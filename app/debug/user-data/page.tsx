"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function UserDataDebugPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/database-test')
      const data = await response.json()
      setResults({ type: 'database-test', data })
    } catch (error) {
      setResults({ type: 'database-test', error: error instanceof Error ? error.message : 'Unknown error' })
    }
    setLoading(false)
  }

  const syncProfiles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/sync-profiles', { method: 'POST' })
      const data = await response.json()
      setResults({ type: 'profile-sync', data })
    } catch (error) {
      setResults({ type: 'profile-sync', error: error instanceof Error ? error.message : 'Unknown error' })
    }
    setLoading(false)
  }

  const checkAdminDashboard = async () => {
    setLoading(true)
    try {
      // Test what the admin dashboard would see
      const response = await fetch('/admin')
      const isAccessible = response.ok
      setResults({ 
        type: 'admin-check', 
        data: { 
          adminPageAccessible: isAccessible,
          status: response.status,
          statusText: response.statusText
        }
      })
    } catch (error) {
      setResults({ type: 'admin-check', error: error instanceof Error ? error.message : 'Unknown error' })
    }
    setLoading(false)
  }

  const createTestUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/create-test-users', { method: 'POST' })
      const data = await response.json()
      setResults({ type: 'create-test-users', data })
    } catch (error) {
      setResults({ type: 'create-test-users', error: error instanceof Error ? error.message : 'Unknown error' })
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Data & Admin Dashboard Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button onClick={testDatabase} disabled={loading} variant="default">
              1. Test Database Connection
            </Button>
            <Button onClick={syncProfiles} disabled={loading} variant="secondary">
              2. Sync Missing Profiles
            </Button>
            <Button onClick={checkAdminDashboard} disabled={loading} variant="outline">
              3. Check Admin Dashboard Access
            </Button>
            <Button onClick={createTestUsers} disabled={loading} variant="destructive">
              4. Create Test Users
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
                  Results: {results.type}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.error ? (
                  <div className="text-red-600">
                    <strong>Error:</strong> {results.error}
                  </div>
                ) : (
                  <div>
                    {results.type === 'database-test' && results.data && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50 p-3 rounded">
                            <h4 className="font-semibold">Total Users</h4>
                            <p className="text-2xl font-bold">{results.data.stats?.totalUsers || 0}</p>
                          </div>
                          <div className="bg-yellow-50 p-3 rounded">
                            <h4 className="font-semibold">Pending Verifications</h4>
                            <p className="text-2xl font-bold">{results.data.stats?.pendingVerifications || 0}</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded">
                            <h4 className="font-semibold">Universities</h4>
                            <p className="text-2xl font-bold">{results.data.stats?.totalUniversities || 0}</p>
                          </div>
                        </div>
                        
                        {results.data.data?.allUsers && results.data.data.allUsers.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Recent Users:</h4>
                            <div className="space-y-2">
                              {results.data.data.allUsers.slice(0, 5).map((user: any, index: number) => (
                                <div key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <span>{user.email} ({user.role})</span>
                                  <span className={user.verified ? 'text-green-600' : 'text-red-600'}>
                                    {user.verified ? '✅ Verified' : '❌ Unverified'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {results.data.data?.pendingUsers && results.data.data.pendingUsers.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Pending Verifications (What Admin Sees):</h4>
                            <div className="space-y-2">
                              {results.data.data.pendingUsers.map((user: any, index: number) => (
                                <div key={user.id} className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                                  <span>{user.email} ({user.role})</span>
                                  <span>{user.university?.name || 'No University'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {results.type === 'profile-sync' && results.data && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50 p-3 rounded">
                            <h4 className="font-semibold">Auth Users</h4>
                            <p className="text-2xl font-bold">{results.data.stats?.authUsersCount || 0}</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded">
                            <h4 className="font-semibold">Profile Users</h4>
                            <p className="text-2xl font-bold">{results.data.stats?.profileUsersCount || 0}</p>
                          </div>
                          <div className="bg-yellow-50 p-3 rounded">
                            <h4 className="font-semibold">Synced</h4>
                            <p className="text-2xl font-bold">{results.data.stats?.syncedCount || 0}</p>
                          </div>
                        </div>
                        
                        {results.data.syncResults && results.data.syncResults.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Newly Synced Users:</h4>
                            <div className="space-y-2">
                              {results.data.syncResults.map((result: any, index: number) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                                  <span>{result.email}</span>
                                  <span className="text-green-600">✅ {result.action}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {results.type === 'create-test-users' && results.data && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50 p-3 rounded">
                            <h4 className="font-semibold">Test Users Created</h4>
                            <p className="text-2xl font-bold">{results.data.testUsersCreated || 0}</p>
                          </div>
                          <div className="bg-yellow-50 p-3 rounded">
                            <h4 className="font-semibold">Should Appear in Admin</h4>
                            <p className="text-2xl font-bold">{results.data.verification?.shouldAppearInAdmin || 0}</p>
                          </div>
                          <div className="bg-red-50 p-3 rounded">
                            <h4 className="font-semibold">Actually Appearing</h4>
                            <p className="text-2xl font-bold">{results.data.verification?.actuallyAppearing || 0}</p>
                          </div>
                        </div>
                        
                        {results.data.university && (
                          <div className="bg-gray-50 p-3 rounded">
                            <h4 className="font-semibold">Test University:</h4>
                            <p>{results.data.university.name} ({results.data.university.domain})</p>
                          </div>
                        )}
                        
                        {results.data.results?.allPendingUsers && results.data.results.allPendingUsers.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Users Appearing in Admin Dashboard:</h4>
                            <div className="space-y-2">
                              {results.data.results.allPendingUsers.map((user: any, index: number) => (
                                <div key={user.id} className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                                  <span>{user.email} ({user.role})</span>
                                  <span>{user.university?.name || 'No University'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <details className="mt-4">
                      <summary className="cursor-pointer font-semibold">Full JSON Response</summary>
                      <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm mt-2 max-h-96">
                        {JSON.stringify(results.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}