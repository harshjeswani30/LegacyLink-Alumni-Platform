// Test if service role is configured
// Run this in browser console to check if the API can access service role

fetch('/api/admin/verify/test-check-service-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
})
.then(response => response.json())
.then(result => {
    console.log('Service role check:', result);
})
.catch(error => {
    console.error('Service role check failed:', error);
});