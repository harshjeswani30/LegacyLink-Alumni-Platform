// VERIFICATION SYSTEM BROWSER CONSOLE TEST
// Open browser console on localhost:3000/admin and run this script
// This will help test if the verification API is working

console.log('=== VERIFICATION SYSTEM TEST ===');

// Function to test verification API
async function testVerificationAPI() {
    console.log('1. Testing verification API...');
    
    try {
        // First, let's see if we can get current user info
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            console.log('✓ Current user:', userData);
        } else {
            console.log('✗ Failed to get current user:', response.status);
        }
        
    } catch (error) {
        console.error('✗ Error testing auth:', error);
    }
}

// Function to check pending users in DOM
function checkPendingUsersInDOM() {
    console.log('2. Checking pending users in DOM...');
    
    const pendingCards = document.querySelectorAll('[data-testid*="pending"], .card-content');
    console.log(`Found ${pendingCards.length} potential pending user cards`);
    
    // Look for verification buttons
    const verifyButtons = document.querySelectorAll('button[data-testid*="verify"], button:contains("Verify")');
    console.log(`Found ${verifyButtons.length} verification buttons`);
    
    // Look for AlumniVerificationActions components
    const verificationActions = document.querySelectorAll('[data-component*="verification"], [class*="verification"]');
    console.log(`Found ${verificationActions.length} verification action elements`);
    
    return {
        pendingCards: pendingCards.length,
        verifyButtons: verifyButtons.length,
        verificationActions: verificationActions.length
    };
}

// Function to simulate verification button click
async function testVerificationButtonClick(userId) {
    console.log(`3. Testing verification for user: ${userId}`);
    
    try {
        const response = await fetch(`/api/admin/verify/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✓ Verification API success:', result);
        } else {
            console.log('✗ Verification API failed:', response.status, result);
        }
        
        return result;
    } catch (error) {
        console.error('✗ Verification API error:', error);
        return null;
    }
}

// Main test function
async function runVerificationTests() {
    console.log('Starting verification system tests...');
    
    // Test 1: Check authentication
    await testVerificationAPI();
    
    // Test 2: Check DOM elements
    const domCheck = checkPendingUsersInDOM();
    
    // Test 3: Check if there are any pending users visible
    const pendingUserElements = document.querySelectorAll('[data-testid="pending-user"], .card');
    console.log(`Found ${pendingUserElements.length} potential pending user elements`);
    
    // Look for user IDs in the DOM that we could test verification with
    const userIdElements = document.querySelectorAll('[data-user-id]');
    if (userIdElements.length > 0) {
        const testUserId = userIdElements[0].getAttribute('data-user-id');
        console.log(`Found test user ID: ${testUserId}`);
        
        // Uncomment the line below to actually test verification (be careful!)
        // await testVerificationButtonClick(testUserId);
    } else {
        console.log('No user IDs found in DOM for testing');
    }
    
    console.log('=== TEST COMPLETE ===');
    return domCheck;
}

// Auto-run the tests
runVerificationTests();

// Also provide manual test functions
window.testVerification = testVerificationButtonClick;
window.checkDOM = checkPendingUsersInDOM;

console.log('Manual test functions available:');
console.log('- testVerification(userId) - Test verification API for specific user');  
console.log('- checkDOM() - Check DOM for verification elements');