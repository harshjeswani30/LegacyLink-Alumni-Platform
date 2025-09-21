// DIRECT VERIFICATION API TEST
// Run this in browser console at localhost:3000/admin to test verification directly

async function testDirectVerification() {
    console.log('=== DIRECT VERIFICATION API TEST ===');
    
    // Find the first verify button to get a real user ID
    const firstVerifyButton = document.querySelector('button[data-testid="verify-button"]');
    if (!firstVerifyButton) {
        console.log('❌ No verify buttons found - no pending users to test');
        return;
    }
    
    const userId = firstVerifyButton.getAttribute('data-user-id');
    const userName = firstVerifyButton.closest('.card')?.querySelector('.text-base')?.textContent || 'Unknown';
    
    console.log(`🔍 Testing verification for: ${userName} (ID: ${userId})`);
    
    try {
        console.log('📡 Making API call...');
        const response = await fetch(`/api/admin/verify/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        console.log(`📡 Response status: ${response.status}`);
        
        const result = await response.json();
        console.log('📡 Response data:', result);
        
        if (response.ok && result.success) {
            console.log('✅ API TEST PASSED - Verification successful');
            console.log('✅ Verified user data:', result.verified_user);
            
            // Check if user was actually updated in the database
            if (result.verified_user && result.verified_user.verified === true) {
                console.log('✅ DATABASE UPDATE CONFIRMED - User is now verified');
                return true;
            } else {
                console.log('❌ DATABASE UPDATE ISSUE - User verification status unclear');
                return false;
            }
        } else {
            console.log('❌ API TEST FAILED');
            console.log('❌ Error:', result.error || 'Unknown error');
            return false;
        }
        
    } catch (error) {
        console.error('❌ API TEST EXCEPTION:', error);
        return false;
    }
}

// Function to check current verification status
async function checkCurrentStatus() {
    console.log('🔍 Checking current verification status...');
    
    const verifyButtons = document.querySelectorAll('button[data-testid="verify-button"]');
    console.log(`Found ${verifyButtons.length} pending users with verify buttons`);
    
    verifyButtons.forEach((button, index) => {
        const userId = button.getAttribute('data-user-id');
        const userName = button.closest('.card')?.querySelector('.text-base')?.textContent || 'Unknown';
        console.log(`${index + 1}. ${userName} (ID: ${userId}) - Status: PENDING`);
    });
}

// Function to manually verify without UI updates (for testing)
async function manualVerifyTest(userId) {
    console.log(`🧪 Manual verification test for user: ${userId}`);
    
    try {
        const response = await fetch(`/api/admin/verify/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        console.log('Manual test result:', result);
        
        return { success: response.ok, data: result };
    } catch (error) {
        console.error('Manual test error:', error);
        return { success: false, error };
    }
}

// Run initial tests
console.log('🚀 Starting verification diagnosis...');
checkCurrentStatus();

// Make functions available globally
window.testDirectVerification = testDirectVerification;
window.checkCurrentStatus = checkCurrentStatus;
window.manualVerifyTest = manualVerifyTest;

console.log('\n📋 Available test functions:');
console.log('- testDirectVerification() - Test API with real user');
console.log('- checkCurrentStatus() - Show all pending users');
console.log('- manualVerifyTest(userId) - Test specific user ID');