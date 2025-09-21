// COMPLETE VERIFICATION BUTTON TEST
// Run this in browser console at localhost:3000/admin
// Make sure you're logged in as an admin user

console.log('=== COMPLETE VERIFICATION BUTTON TEST ===');

// Step 1: Check if buttons exist and are functional
function findAndTestButtons() {
    console.log('🔍 Step 1: Finding verification buttons...');
    
    // Find verify buttons
    const verifyButtons = document.querySelectorAll('button[data-testid="verify-button"]');
    console.log(`Found ${verifyButtons.length} verify buttons`);
    
    // Find reject trigger buttons  
    const rejectTriggers = document.querySelectorAll('button[data-testid="reject-trigger-button"]');
    console.log(`Found ${rejectTriggers.length} reject trigger buttons`);
    
    if (verifyButtons.length === 0 && rejectTriggers.length === 0) {
        console.log('❌ No verification buttons found!');
        console.log('This could mean:');
        console.log('- No pending users to verify');
        console.log('- You are not logged in as admin');
        console.log('- Page has not loaded completely');
        return false;
    }
    
    // Test each verify button
    verifyButtons.forEach((button, index) => {
        const userId = button.getAttribute('data-user-id');
        console.log(`✅ Verify button ${index + 1}: User ID ${userId}`);
        console.log(`   - Disabled: ${button.disabled}`);
        console.log(`   - Text: "${button.textContent}"`);
        
        // Add test click listener
        if (!button.hasAttribute('data-test-listener')) {
            button.addEventListener('click', () => {
                console.log(`🔵 TEST: Verify button clicked for user ${userId}`);
            });
            button.setAttribute('data-test-listener', 'true');
        }
    });
    
    // Test each reject button
    rejectTriggers.forEach((button, index) => {
        const userId = button.getAttribute('data-user-id');
        console.log(`🟠 Reject button ${index + 1}: User ID ${userId}`);
        console.log(`   - Disabled: ${button.disabled}`);
        console.log(`   - Text: "${button.textContent}"`);
        
        // Add test click listener
        if (!button.hasAttribute('data-test-listener')) {
            button.addEventListener('click', () => {
                console.log(`🟠 TEST: Reject trigger clicked for user ${userId}`);
            });
            button.setAttribute('data-test-listener', 'true');
        }
    });
    
    return { verifyButtons: verifyButtons.length, rejectTriggers: rejectTriggers.length };
}

// Step 2: Test API endpoints directly
async function testAPIEndpoints() {
    console.log('🔍 Step 2: Testing API endpoints...');
    
    // Get user ID from first button if available
    const firstButton = document.querySelector('button[data-user-id]');
    const testUserId = firstButton ? firstButton.getAttribute('data-user-id') : 'test-fake-id';
    
    console.log(`Using test user ID: ${testUserId}`);
    
    try {
        // Test verify endpoint
        console.log('Testing verify endpoint...');
        const verifyResponse = await fetch(`/api/admin/verify/${testUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log(`Verify API status: ${verifyResponse.status}`);
        
        if (verifyResponse.status === 401) {
            console.log('❌ Not authenticated - please log in as admin');
            return false;
        } else if (verifyResponse.status === 403) {
            console.log('❌ Not authorized - current user is not admin');
            return false;
        }
        
        // Test reject endpoint
        console.log('Testing reject endpoint...');
        const rejectResponse = await fetch(`/api/admin/reject/${testUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log(`Reject API status: ${rejectResponse.status}`);
        
        if (verifyResponse.status >= 200 && verifyResponse.status < 500 && 
            rejectResponse.status >= 200 && rejectResponse.status < 500) {
            console.log('✅ API endpoints are accessible');
            return true;
        } else {
            console.log('❌ API endpoints have issues');
            return false;
        }
        
    } catch (error) {
        console.error('❌ API test failed:', error);
        return false;
    }
}

// Step 3: Simulate button clicks
function simulateButtonClicks() {
    console.log('🔍 Step 3: Testing button click simulation...');
    
    const verifyButtons = document.querySelectorAll('button[data-testid="verify-button"]');
    const rejectButtons = document.querySelectorAll('button[data-testid="reject-trigger-button"]');
    
    if (verifyButtons.length > 0) {
        console.log('📋 To test verify button manually, run:');
        console.log('document.querySelector("button[data-testid=\\"verify-button\\"]").click()');
    }
    
    if (rejectButtons.length > 0) {
        console.log('📋 To test reject button manually, run:');
        console.log('document.querySelector("button[data-testid=\\"reject-trigger-button\\"]").click()');
    }
    
    return { verifyButtons: verifyButtons.length, rejectButtons: rejectButtons.length };
}

// Step 4: Check for JavaScript errors
function checkForErrors() {
    console.log('🔍 Step 4: Checking for errors...');
    
    // Monitor console for errors
    const originalError = console.error;
    let errorCount = 0;
    
    console.error = function(...args) {
        errorCount++;
        console.log(`🔴 Console Error ${errorCount}:`, ...args);
        originalError.apply(console, args);
    };
    
    // Check for error elements in DOM
    const errorElements = document.querySelectorAll('[class*="error"], .text-red, [class*="text-red"]');
    console.log(`Found ${errorElements.length} error elements in DOM`);
    
    return errorCount;
}

// Main test function
async function runCompleteButtonTest() {
    console.log('🚀 Starting complete verification button test...');
    
    // Run all tests
    const buttonCounts = findAndTestButtons();
    const apiWorking = await testAPIEndpoints();
    const simulationInfo = simulateButtonClicks();
    const errorCount = checkForErrors();
    
    console.log('\n=== TEST RESULTS SUMMARY ===');
    console.log('Button counts:', buttonCounts);
    console.log('API working:', apiWorking);
    console.log('Simulation ready:', simulationInfo);
    console.log('Error count:', errorCount);
    
    if (buttonCounts && buttonCounts.verifyButtons > 0) {
        console.log('\n✅ VERIFICATION BUTTONS FOUND AND READY');
        console.log('🔧 NEXT STEPS:');
        console.log('1. Click a verify button and watch the console for debug messages');
        console.log('2. Check the Network tab for API calls');
        console.log('3. Look for success/error alerts');
        
        if (apiWorking) {
            console.log('4. API endpoints are working - buttons should function correctly');
        } else {
            console.log('4. ⚠️  API endpoints have issues - check authentication');
        }
    } else {
        console.log('\n❌ NO VERIFICATION BUTTONS FOUND');
        console.log('🔧 TROUBLESHOOTING:');
        console.log('1. Make sure you have pending users to verify');
        console.log('2. Ensure you are logged in as an admin user');
        console.log('3. Check if the page has loaded completely');
        console.log('4. Try refreshing the page');
    }
    
    return { buttonCounts, apiWorking, errorCount };
}

// Auto-run the test
runCompleteButtonTest();

// Provide manual functions
window.testButtons = runCompleteButtonTest;
window.findButtons = findAndTestButtons;
window.testAPI = testAPIEndpoints;

console.log('\n📋 Manual test functions available:');
console.log('- testButtons() - Run complete test');
console.log('- findButtons() - Find and analyze buttons');  
console.log('- testAPI() - Test API endpoints only');