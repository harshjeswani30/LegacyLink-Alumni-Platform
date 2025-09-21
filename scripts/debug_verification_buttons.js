// VERIFICATION BUTTON DEBUG TEST
// Paste this in browser console at localhost:3000/admin to debug button issues

console.log('=== VERIFICATION BUTTON DEBUG TEST ===');

// Function to test if buttons are properly attached
function testButtonBindings() {
    console.log('1. Testing button bindings...');
    
    // Find all verification action containers
    const verificationContainers = document.querySelectorAll('[class*="flex space-x-1"], .flex.space-x-1');
    console.log(`Found ${verificationContainers.length} verification containers`);
    
    verificationContainers.forEach((container, index) => {
        console.log(`Container ${index + 1}:`);
        
        // Find verify button (green button)
        const verifyButton = container.querySelector('button[class*="bg-green"]');
        if (verifyButton) {
            console.log('  ✓ Verify button found');
            console.log('  - Disabled:', verifyButton.disabled);
            console.log('  - Has onClick:', typeof verifyButton.onclick);
            console.log('  - Event listeners:', getEventListeners ? getEventListeners(verifyButton) : 'DevTools needed');
        } else {
            console.log('  ✗ Verify button NOT found');
        }
        
        // Find reject button (red button)
        const rejectButton = container.querySelector('button[variant="destructive"], button[class*="destructive"]');
        if (rejectButton) {
            console.log('  ✓ Reject button found');
            console.log('  - Disabled:', rejectButton.disabled);
            console.log('  - Has onClick:', typeof rejectButton.onclick);
        } else {
            console.log('  ✗ Reject button NOT found');
        }
    });
}

// Function to test API endpoints directly
async function testAPIEndpoints() {
    console.log('2. Testing API endpoints...');
    
    try {
        // Test verify endpoint with fake user ID (should return 404)
        console.log('Testing verify endpoint...');
        const verifyResponse = await fetch('/api/admin/verify/test-fake-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log(`Verify endpoint status: ${verifyResponse.status}`);
        const verifyData = await verifyResponse.json();
        console.log('Verify response:', verifyData);
        
        // Test reject endpoint with fake user ID (should return 404)
        console.log('Testing reject endpoint...');
        const rejectResponse = await fetch('/api/admin/reject/test-fake-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log(`Reject endpoint status: ${rejectResponse.status}`);
        const rejectData = await rejectResponse.json();
        console.log('Reject response:', rejectData);
        
        if (verifyResponse.status === 404 && rejectResponse.status === 404) {
            console.log('✓ Both API endpoints are accessible (404 = endpoints exist but user not found)');
            return true;
        } else if (verifyResponse.status === 401 || rejectResponse.status === 401) {
            console.log('✗ Authentication required - make sure you\'re logged in as admin');
            return false;
        } else if (verifyResponse.status === 403 || rejectResponse.status === 403) {
            console.log('✗ Permission denied - make sure you have admin privileges');
            return false;
        } else {
            console.log('? Unexpected API response - check the responses above');
            return false;
        }
    } catch (error) {
        console.error('✗ API test failed:', error);
        return false;
    }
}

// Function to simulate button clicks for debugging
function simulateButtonClicks() {
    console.log('3. Simulating button clicks...');
    
    const verifyButtons = document.querySelectorAll('button[class*="bg-green"]');
    const rejectButtons = document.querySelectorAll('button[class*="destructive"]');
    
    console.log(`Found ${verifyButtons.length} verify buttons and ${rejectButtons.length} reject buttons`);
    
    if (verifyButtons.length > 0) {
        console.log('To test verify button, run: document.querySelector("button[class*=\\"bg-green\\"]").click()');
    }
    
    if (rejectButtons.length > 0) {
        console.log('To test reject button, run: document.querySelector("button[class*=\\"destructive\\"]").click()');
    }
    
    return { verifyButtons: verifyButtons.length, rejectButtons: rejectButtons.length };
}

// Function to check for JavaScript errors
function checkForErrors() {
    console.log('4. Checking for errors...');
    
    // Look for error messages in the DOM
    const errorElements = document.querySelectorAll('[class*="error"], .text-red, [class*="text-red"], .alert-error');
    console.log(`Found ${errorElements.length} error elements on page`);
    
    errorElements.forEach((element, index) => {
        console.log(`Error ${index + 1}:`, element.textContent);
    });
    
    // Check if React is loaded
    console.log('React available:', typeof React !== 'undefined');
    console.log('Next.js router available:', typeof window.__NEXT_DATA__ !== 'undefined');
    
    return errorElements.length;
}

// Main debug function
async function debugVerificationButtons() {
    console.log('Starting verification button debug...');
    
    testButtonBindings();
    const apiWorking = await testAPIEndpoints();
    const buttonCounts = simulateButtonClicks();
    const errorCount = checkForErrors();
    
    console.log('\n=== DEBUG RESULTS ===');
    console.log('API endpoints working:', apiWorking);
    console.log('Button counts:', buttonCounts);
    console.log('Error count:', errorCount);
    
    if (!apiWorking) {
        console.log('\n🔧 RECOMMENDATION: Fix authentication/permission issues first');
    } else if (buttonCounts.verifyButtons === 0 && buttonCounts.rejectButtons === 0) {
        console.log('\n🔧 RECOMMENDATION: No verification buttons found - check if you have pending users');
    } else if (errorCount > 0) {
        console.log('\n🔧 RECOMMENDATION: Fix JavaScript errors shown above');
    } else {
        console.log('\n🔧 RECOMMENDATION: Try manually clicking buttons and check Network tab for API calls');
    }
    
    return { apiWorking, buttonCounts, errorCount };
}

// Auto-run debug
debugVerificationButtons();

// Provide manual functions
window.debugButtons = debugVerificationButtons;
window.testAPI = testAPIEndpoints;

console.log('\nManual debug functions:');
console.log('- debugButtons() - Full debug test');
console.log('- testAPI() - Test API endpoints only');