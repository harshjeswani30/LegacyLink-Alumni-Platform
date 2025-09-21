// TEST VERIFICATION SYSTEM
// Run this in browser console at localhost:3000/admin after logging in as admin

console.log('=== TESTING VERIFICATION SYSTEM ===');

// First, let's check if we can see any pending users in the current page
function checkCurrentPendingUsers() {
    console.log('1. Checking current pending users in DOM...');
    
    // Look for pending user cards
    const cards = document.querySelectorAll('.grid .card, [class*="card"]');
    console.log(`Found ${cards.length} cards on page`);
    
    // Look for verification buttons
    const verifyButtons = document.querySelectorAll('button[class*="bg-green"], button:has(svg)');
    console.log(`Found ${verifyButtons.length} potential verify buttons`);
    
    // Look for user names/emails in cards
    const userInfo = [];
    cards.forEach((card, index) => {
        const nameElement = card.querySelector('[class*="text-base"], h3, h4');
        const emailElement = card.querySelector('[class*="text-xs"], [class*="text-sm"]');
        const roleElement = card.querySelector('[class*="badge"], .badge');
        
        if (nameElement) {
            userInfo.push({
                index,
                name: nameElement.textContent?.trim(),
                email: emailElement?.textContent?.trim(),
                role: roleElement?.textContent?.trim()
            });
        }
    });
    
    console.log('Found user info:', userInfo);
    return userInfo;
}

// Function to simulate clicking a verify button
function simulateVerifyClick() {
    console.log('2. Looking for verify buttons to test...');
    
    const verifyButtons = document.querySelectorAll('button[class*="bg-green"]');
    if (verifyButtons.length > 0) {
        console.log(`Found ${verifyButtons.length} verify buttons`);
        console.log('To test verification, you can manually click the green verify button');
        console.log('Or run: document.querySelector("button[class*=\\"bg-green\\"]").click()');
        return true;
    } else {
        console.log('No verify buttons found - this might mean:');
        console.log('- No pending users to verify');
        console.log('- User is not logged in as admin');
        console.log('- Verification buttons not rendering properly');
        return false;
    }
}

// Function to test the API directly
async function testVerificationAPI() {
    console.log('3. Testing verification API endpoints...');
    
    // Test if we can access the API (without actually verifying anyone)
    try {
        // This should return 404 for non-existent user, which proves the endpoint works
        const testResponse = await fetch('/api/admin/verify/test-non-existent-user-id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        console.log(`API test response: ${testResponse.status}`);
        const testData = await testResponse.json();
        console.log('API test data:', testData);
        
        if (testResponse.status === 404 && testData.error === 'User not found') {
            console.log('✓ Verification API endpoint is working');
            return true;
        } else if (testResponse.status === 401) {
            console.log('✗ Not authenticated - please log in as admin');
            return false;
        } else if (testResponse.status === 403) {
            console.log('✗ Not authorized - current user is not an admin');
            return false;
        } else {
            console.log('? Unexpected API response');
            return false;
        }
    } catch (error) {
        console.error('✗ API test failed:', error);
        return false;
    }
}

// Main test function
async function runFullVerificationTest() {
    console.log('Running comprehensive verification test...');
    
    const pendingUsers = checkCurrentPendingUsers();
    const hasVerifyButtons = simulateVerifyClick();
    const apiWorking = await testVerificationAPI();
    
    console.log('\n=== TEST RESULTS ===');
    console.log(`Pending users found: ${pendingUsers.length}`);
    console.log(`Verify buttons found: ${hasVerifyButtons}`);
    console.log(`API working: ${apiWorking}`);
    
    if (pendingUsers.length > 0 && hasVerifyButtons && apiWorking) {
        console.log('✓ Verification system appears to be working!');
        console.log('You can now manually click a verify button to test the full workflow');
    } else if (pendingUsers.length === 0) {
        console.log('ℹ No pending users - verification queue is empty');
        console.log('This is normal if all users are already verified');
    } else {
        console.log('⚠ Some issues detected - check the individual test results above');
    }
    
    return {
        pendingUsers: pendingUsers.length,
        hasVerifyButtons,
        apiWorking
    };
}

// Auto-run the test
runFullVerificationTest();

// Provide manual functions
window.testVerification = runFullVerificationTest;
window.checkPending = checkCurrentPendingUsers;

console.log('\nManual test functions available:');
console.log('- testVerification() - Run full verification test');
console.log('- checkPending() - Check pending users in DOM');