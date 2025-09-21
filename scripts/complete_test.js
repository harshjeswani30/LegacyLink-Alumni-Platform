// COMPLETE VERIFICATION TEST - COPY AND PASTE ALL OF THIS
// This will show the full response

console.log('🧪 Starting complete verification test...');

const userId = '5a3110c5-7afe-4cfa-b5f0-46851ebe0805';

fetch(`/api/admin/verify/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
})
.then(response => {
    console.log('📡 Response Status:', response.status);
    console.log('📡 Response OK:', response.ok);
    return response.json();
})
.then(result => {
    console.log('📡 COMPLETE RESPONSE:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
        console.log('✅ API Success: true');
        
        if (result.verified_user) {
            console.log('✅ Verified User Data Found:');
            console.log('   - ID:', result.verified_user.id);
            console.log('   - Name:', result.verified_user.full_name);
            console.log('   - Email:', result.verified_user.email);
            console.log('   - Verified:', result.verified_user.verified);
            console.log('   - Updated:', result.verified_user.updated_at);
            
            if (result.verified_user.verified === true) {
                console.log('🎉 SUCCESS: User is verified in database!');
            } else {
                console.log('❌ FAILED: User verified field is still false');
            }
        } else {
            console.log('❌ PROBLEM: No verified_user data returned');
        }
    } else {
        console.log('❌ API Success: false');
        console.log('❌ Error:', result.error);
    }
})
.catch(error => {
    console.error('❌ Network/Parse Error:', error);
});

console.log('Test submitted, waiting for response...');