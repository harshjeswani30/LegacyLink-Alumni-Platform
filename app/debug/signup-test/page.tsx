"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function SignupTestPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('testuser@example.com')

  const testSignupFlow = async () => {
    setLoading(true)
    setResults(null)
    
    try {
      const supabase = createClient()
      
      console.log('🧪 Testing signup flow for:', testEmail)
      
      // Step 1: Check if user already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', testEmail)
        .single()
      
      if (existingProfile) {
        setResults({
          step: 'User already exists',
          data: existingProfile,
          message: 'User already has a profile. Try a different email.'
        })
        setLoading(false)
        return
      }
      
      // Step 2: Get a university to associate with
      const { data: universities } = await supabase
        .from('universities')
        .select('*')
        .limit(1)
      
      if (!universities || universities.length === 0) {
        setResults({
          step: 'No universities found',
          error: 'No universities exist. Create one first.',
          message: 'The system needs at least one university to test with.'
        })
        setLoading(false)
        return
      }
      
      const university = universities[0]
      
      // Step 3: Test creating a profile directly (simulating successful auth signup)
      const testUserId = crypto.randomUUID()
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: testUserId,
          email: testEmail,
          full_name: 'Test User',
          role: 'alumni',
          university_id: university.id,
          verified: false
        })
        .select()
        .single()
      
      if (profileError) {
        setResults({
          step: 'Profile creation failed',
          error: profileError,
          message: 'Could not create profile in database.'
        })
        setLoading(false)
        return
      }
      
      // Step 4: Test what admin dashboard would see
      const { data: adminView, error: adminError } = await supabase
        .from('profiles')
        .select('*, university:universities(*)')
        .eq('verified', false)
        .in('role', ['alumni', 'student'])
        .order('created_at', { ascending: false })
      
      // Step 5: Test university-specific admin view
      const { data: uniAdminView, error: uniAdminError } = await supabase
        .from('profiles')
        .select('*, university:universities(*)')
        .eq('verified', false)
        .eq('university_id', university.id)
        .in('role', ['alumni', 'student'])
        .order('created_at', { ascending: false })
      
      setResults({
        step: 'Test completed',
        success: true,
        data: {
          createdProfile: newProfile,
          university: university,
          adminView: adminView || [],
          universityAdminView: uniAdminView || [],
          verification: {
            shouldAppearInAdmin: 1,
            actuallyInAdmin: adminView?.filter(u => u.id === testUserId).length || 0,
            actuallyInUniAdmin: uniAdminView?.filter(u => u.id === testUserId).length || 0
          }
        },
        errors: {
          profileError,
          adminError,
          uniAdminError
        }
      })
      
    } catch (error) {
      setResults({
        step: 'Test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    setLoading(false)
  }

  const cleanupTestUser = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('email', testEmail)
      
      if (error) {
        setResults({
          step: 'Cleanup failed',
          error: error
        })
      } else {
        setResults({
          step: 'Cleanup completed',
          message: 'Test user removed successfully'
        })
      }
    } catch (error) {
      setResults({
        step: 'Cleanup failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Signup Flow & Admin Visibility Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testEmail">Test Email</Label>
            <Input
              id="testEmail"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>
          
          <div className="flex gap-4">
            <Button onClick={testSignupFlow} disabled={loading} variant="default">
              Test Signup → Admin Visibility
            </Button>
            <Button onClick={cleanupTestUser} disabled={loading} variant="destructive">
              Cleanup Test User
            </Button>
          </div>
          
          {loading && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Running test...</span>
            </div>
          )}
          
          {results && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  Test Results: {results.step}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.error ? (
                  <div className="text-red-600">
                    <strong>Error:</strong> {JSON.stringify(results.error, null, 2)}
                  </div>
                ) : results.success ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <h4 className="font-semibold">Should Appear</h4>
                        <p className="text-2xl font-bold">{results.data?.verification?.shouldAppearInAdmin || 0}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <h4 className="font-semibold">In Admin View</h4>
                        <p className="text-2xl font-bold">{results.data?.verification?.actuallyInAdmin || 0}</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded">
                        <h4 className="font-semibold">In Uni Admin View</h4>
                        <p className="text-2xl font-bold">{results.data?.verification?.actuallyInUniAdmin || 0}</p>
                      </div>
                    </div>
                    
                    {results.data?.createdProfile && (
                      <div className="bg-gray-50 p-3 rounded">
                        <h4 className="font-semibold">Created Profile:</h4>
                        <p>{results.data.createdProfile.email} ({results.data.createdProfile.role})</p>
                        <p>Verified: {results.data.createdProfile.verified ? '✅' : '❌'}</p>
                        <p>University: {results.data.university?.name}</p>
                      </div>
                    )}
                    
                    {results.data?.adminView && results.data.adminView.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">All Pending Users (Admin View):</h4>
                        <div className="space-y-1">
                          {results.data.adminView.map((user: any, index: number) => (
                            <div key={user.id} className="flex justify-between items-center p-2 bg-yellow-50 rounded text-sm">
                              <span>{user.email} ({user.role})</span>
                              <span>{user.university?.name || 'No University'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p>{results.message}</p>
                  </div>
                )}
                
                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold">Full Results</summary>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm mt-2 max-h-96">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}