// Voice Call Section Deduplication Verification Script
// Run this in browser console to check for duplicates

function verifyVoiceCallDeduplication() {
    console.log('🔍 Verifying Voice Call Deduplication System...');
    
    // Check if voice call section is available
    if (!window.voiceCallSection) {
        console.error('❌ Voice call section not available');
        return;
    }
    
    // Get all participant cards
    const participantCards = document.querySelectorAll('.participant-card[data-user-id]');
    console.log(`📊 Found ${participantCards.length} participant cards`);
    
    // Group by user_id to find duplicates
    const userGroups = {};
    participantCards.forEach((card, index) => {
        const userId = card.getAttribute('data-user-id');
        if (!userGroups[userId]) {
            userGroups[userId] = [];
        }
        userGroups[userId].push({
            element: card,
            index: index,
            participantId: card.getAttribute('data-participant-id') || 'unknown',
            displayName: card.querySelector('.participant-name')?.textContent || 'unknown'
        });
    });
    
    // Check for duplicates
    let duplicateCount = 0;
    let totalDuplicates = 0;
    
    Object.entries(userGroups).forEach(([userId, cards]) => {
        if (cards.length > 1) {
            duplicateCount++;
            totalDuplicates += cards.length - 1;
            
            console.warn(`🚫 DUPLICATE FOUND - User ID ${userId}:`, cards);
            
            // Mark duplicates visually
            cards.forEach((card, index) => {
                if (index > 0) { // Keep first, mark others as duplicates
                    card.element.classList.add('duplicate');
                }
            });
        }
    });
    
    // Summary
    console.log(`\n📋 Verification Summary:`);
    console.log(`   Total participant cards: ${participantCards.length}`);
    console.log(`   Unique users: ${Object.keys(userGroups).length}`);
    console.log(`   Users with duplicates: ${duplicateCount}`);
    console.log(`   Total duplicate cards: ${totalDuplicates}`);
    
    if (duplicateCount === 0) {
        console.log('✅ No duplicates found - deduplication system working correctly!');
    } else {
        console.warn(`⚠️ Found ${duplicateCount} users with duplicate cards`);
        
        // Test the cleanup function
        if (window.voiceCallSection.removeDuplicateCards) {
            console.log('🧹 Testing automatic cleanup...');
            window.voiceCallSection.removeDuplicateCards();
            
            // Re-check after cleanup
            setTimeout(() => {
                const remainingCards = document.querySelectorAll('.participant-card[data-user-id]');
                console.log(`✨ After cleanup: ${remainingCards.length} cards remaining`);
            }, 100);
        }
    }
    
    return {
        totalCards: participantCards.length,
        uniqueUsers: Object.keys(userGroups).length,
        duplicateUsers: duplicateCount,
        duplicateCards: totalDuplicates,
        isClean: duplicateCount === 0
    };
}

// Auto-run verification
console.log('Voice Call Deduplication Verification Script Loaded');
console.log('Run verifyVoiceCallDeduplication() to check for duplicates');

// Export to window for easy access
window.verifyVoiceCallDeduplication = verifyVoiceCallDeduplication;
