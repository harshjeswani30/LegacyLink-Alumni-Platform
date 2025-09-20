import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { readFileSync } from "fs"
import { join } from "path"

export const dynamic = "force-dynamic"

async function executeSqlStatements(supabase: any, sqlContent: string) {
  // Split SQL into individual statements, handling multi-line statements properly
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

  const results = []
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    if (!statement) continue
    
    try {
      console.log(`Executing statement ${i + 1}/${statements.length}:`, statement.substring(0, 100) + '...')
      
      // For CREATE/DROP/ALTER statements, we need to use the raw SQL execution
      const { data, error } = await supabase.rpc('exec', { sql: statement })
      
      if (error) {
        console.error(`Statement ${i + 1} error:`, error)
        results.push({
          statement: i + 1,
          success: false,
          error: error.message,
          sql: statement.substring(0, 200)
        })
      } else {
        console.log(`Statement ${i + 1} executed successfully`)
        results.push({
          statement: i + 1,
          success: true,
          sql: statement.substring(0, 200)
        })
      }
    } catch (err) {
      console.error(`Statement ${i + 1} exception:`, err)
      results.push({
        statement: i + 1,
        success: false,
        error: err instanceof Error ? err.message : String(err),
        sql: statement.substring(0, 200)
      })
    }
  }
  
  return results
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Read the migration SQL file
    const sqlFilePath = join(process.cwd(), 'scripts', '010_fix_profile_creation.sql')
    const sqlContent = readFileSync(sqlFilePath, 'utf-8')

    console.log('🔧 Starting profile creation fix migration...')
    console.log('📄 SQL file loaded:', sqlFilePath)

    // Execute the migration
    const executionResults = await executeSqlStatements(supabase, sqlContent)
    
    const successCount = executionResults.filter(r => r.success).length
    const errorCount = executionResults.filter(r => !r.success).length

    console.log(`✅ Migration execution completed: ${successCount} success, ${errorCount} errors`)

    // Try to sync existing users
    let syncResults = null
    try {
      console.log('🔄 Running sync for existing users...')
      const { data: syncData, error: syncError } = await supabase.rpc('sync_existing_auth_users')
      
      if (syncError) {
        console.error('Sync error:', syncError)
        syncResults = { error: syncError.message }
      } else {
        syncResults = syncData
        console.log('📊 Sync completed:', syncData)
      }
    } catch (syncErr) {
      console.error('Sync exception:', syncErr)
      syncResults = { error: syncErr instanceof Error ? syncErr.message : String(syncErr) }
    }

    return NextResponse.json({
      success: errorCount === 0,
      migration: {
        totalStatements: executionResults.length,
        successCount,
        errorCount,
        results: executionResults
      },
      sync: syncResults,
      message: errorCount === 0 ? 
        'Migration applied successfully!' : 
        `Migration completed with ${errorCount} errors`
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}