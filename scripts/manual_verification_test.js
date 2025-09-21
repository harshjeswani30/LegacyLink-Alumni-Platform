// MANUAL VERIFICATION SYSTEM TEST
// Run this in the browser console at localhost:3000/admin while logged in as admin

async function createTestUser() {
    console.log('Creating test unverified user...');
    
    try {
        // Create a test signup request (this will go through the normal signup flow)
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: `test.user.${Date.now()}@example.com`,
                password: 'testpassword123',
                fullName: 'Test Unverified User',
                role: 'student',
                universityId: 'your-university-id-here' // You'll need to replace this
            })
        });
        
        if (response.ok) {
            console.log('✓ Test user created successfully');
            return true;
        } else {
            console.log('✗ Failed to create test user:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Error creating test user:', error);
        return false;
    }
}

async function testCurrentVerificationButtons() {
    console.log('Testing verification buttons on current page...');
    
    // Look for green verify buttons
    const verifyButtons = document.querySelectorAll('button[class*="bg-green"]');
    console.log(`Found ${verifyButtons.length} verify buttons`);
    
    if (verifyButtons.length > 0) {
        console.log('Verification buttons found! You can:');
        console.log('1. Click them manually to test verification');
        console.log('2. Check browser network tab for API calls');
        console.log('3. Watch for success/error messages');
        
        // Add click listeners to log API calls
        verifyButtons.forEach((button, index) => {
            const originalOnClick = button.onclick;
            button.onclick = function(e) {
                console.log(`Verify button ${index + 1} clicked`);
                if (originalOnClick) originalOnClick.call(this, e);
            };
        });
        
        return true;
    } else {
        console.log('No verify buttons found. This could mean:');
        console.log('- No pending users (verification queue is empty)');
        console.log('- Not logged in as admin');
        console.log('- Page hasn\'t loaded completely');
        return false;
    }
}

async function checkPageContent() {
    console.log('Analyzing current page content...');
    
    // Check for pending users section
    const pendingSection = document.querySelector('h3:contains("Pending Verification"), h2:contains("Pending"), [class*="pending"]');
    console.log('Pending section found:', !!pendingSection);
    
    // Check for user cards
    const userCards = document.querySelectorAll('.card, [class*="card"]');
    console.log(`Found ${userCards.length} user cards`);
    
    // Check for any error messages
    const errorMessages = document.querySelectorAll('[class*="error"], .text-red, [class*="text-red"]');
    console.log(`Found ${errorMessages.length} potential error messages`);
    
    // Look for loading states
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
    console.log(`Found ${loadingElements.length} loading elements`);
    
    return {
        pendingSection: !!pendingSection,
        userCards: userCards.length,
        errorMessages: errorMessages.length,
        loadingElements: loadingElements.length
    };
}

// Run comprehensive test
async function runFullTest() {
    console.log('=== VERIFICATION SYSTEM MANUAL TEST ===');
    
    const pageContent = await checkPageContent();
    const hasVerifyButtons = await testCurrentVerificationButtons();
    
    console.log('\n=== TEST RESULTS ===');
    console.log('Page analysis:', pageContent);
    console.log('Has verify buttons:', hasVerifyButtons);
    
    if (hasVerifyButtons) {
        console.log('\n✓ VERIFICATION SYSTEM APPEARS TO BE WORKING');
        console.log('Try clicking a green verify button to test the API');
    } else if (pageContent.userCards === 0) {
        console.log('\nℹ NO PENDING USERS FOUND');
        console.log('This is normal if all users are verified');
        console.log('You might want to create a test user or check if you\'re logged in as admin');
    } else {
        console.log('\n⚠ POTENTIAL ISSUES DETECTED');
        console.log('Check console for errors and verify you\'re logged in as admin');
    }
    
    return { pageContent, hasVerifyButtons };
}

// Auto-run
runFullTest();

// Make functions available globally
window.testVerificationSystem = runFullTest;
window.checkPage = checkPageContent;

console.log('\nManual functions available:');
console.log('- testVerificationSystem() - Run full test');
console.log('- checkPage() - Check page content');