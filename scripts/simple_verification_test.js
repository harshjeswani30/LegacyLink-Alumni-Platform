// SIMPLE VERIFICATION TEST (BROWSER CONSOLE)
// Copy and paste this entire script into browser console at localhost:3000/admin

(async function() {
    console.log('=== VERIFICATION TEST STARTING ===');
    
    // Find verify buttons
    const verifyButtons = document.querySelectorAll('button[data-testid="verify-button"]');
    console.log(`Found ${verifyButtons.length} verify buttons`);
    
    if (verifyButtons.length === 0) {
        console.log('❌ No verify buttons found. Make sure you have pending users and are logged in as admin.');
        return;
    }
    
    // Get first user for testing
    const firstButton = verifyButtons[0];
    const userId = firstButton.getAttribute('data-user-id');
    const userName = firstButton.closest('.card')?.querySelector('.text-base')?.textContent || 'Unknown';
    
    console.log(`🔍 Testing verification for: ${userName} (ID: ${userId})`);
    
    try {
        console.log('📡 Making API call...');
        
        const response = await fetch(`/api/admin/verify/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        console.log(`📡 Response Status: ${response.status}`);
        console.log(`📡 Response OK: ${response.ok}`);
        
        const result = await response.json();
        console.log('📡 Full Response Data:', result);
        
        if (response.ok) {
            if (result.success) {
                console.log('✅ API returned success');
                
                if (result.verified_user) {
                    console.log('✅ Verified user data:', result.verified_user);
                    console.log(`✅ User verified status: ${result.verified_user.verified}`);
                    
                    if (result.verified_user.verified === true) {
                        console.log('🎉 VERIFICATION SUCCESSFUL - User is now verified in database');
                    } else {
                        console.log('❌ VERIFICATION FAILED - User verified status is still false');
                    }
                } else {
                    console.log('⚠️  API success but no verified_user data returned');
                }
            } else {
                console.log('❌ API returned success=false');
            }
        } else {
            console.log('❌ API request failed');
            console.log('❌ Error:', result.error || 'Unknown error');
            
            if (response.status === 401) {
                console.log('🔐 Authentication issue - make sure you are logged in');
            } else if (response.status === 403) {
                console.log('🚫 Permission issue - make sure you have admin privileges');
            }
        }
        
    } catch (error) {
        console.error('❌ Exception during API call:', error);
    }
    
    console.log('=== VERIFICATION TEST COMPLETE ===');
})();

// Also provide a simple manual test function
window.testVerify = async function(userId) {
    if (!userId) {
        const button = document.querySelector('button[data-user-id]');
        userId = button?.getAttribute('data-user-id');
    }
    
    if (!userId) {
        console.log('No user ID provided and no buttons found');
        return;
    }
    
    console.log(`Testing verification for user: ${userId}`);
    
    try {
        const response = await fetch(`/api/admin/verify/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        console.log('Response:', { status: response.status, ok: response.ok, data: result });
        return result;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
};

console.log('Manual test function available: testVerify(userId) or testVerify() for first user');