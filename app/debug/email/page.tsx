import { EmailDebugChecker } from "@/components/email-debug-checker"
import { DataSyncTool } from "@/components/data-sync-tool"

export default function EmailDebugPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Authentication Debug & Sync Tool</h1>
      <p className="text-muted-foreground">
        Comprehensive tool to debug authentication issues and sync data between Supabase Auth and profiles table
      </p>
      
      <DataSyncTool />
      
      <EmailDebugChecker email="22BCS15891@cuchd.in" />
      
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
          🔧 How to use these tools:
        </h3>
        <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li><strong>1. Data Sync Tool:</strong> Click "Sync Data" to ensure auth.users and profiles are synchronized</li>
          <li><strong>2. Email Tests:</strong> Use the test buttons to check specific emails</li>
          <li><strong>3. Email Debug:</strong> Click "Debug" to see detailed analysis of your email</li>
          <li><strong>4. Console Logs:</strong> Open browser dev tools to see detailed console logs</li>
        </ol>
      </div>

      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
          ✅ Expected Behavior After Sync:
        </h3>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
          <li>• If your email exists in auth.users → Sign-up should show "already registered" error</li>
          <li>• If your email exists in profiles → Sign-up should show "already registered" error</li>
          <li>• Missing profiles should be automatically created for existing auth users</li>
          <li>• Console will show detailed logs of all checks</li>
        </ul>
      </div>
    </div>
  )
}