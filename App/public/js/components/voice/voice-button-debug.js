/**
 * Voice Button Debug Tool
 * Call window.debugVoiceButtons() in the console to diagnose button issues
 */

window.debugVoiceButtons = function() {
    console.log('🔍 [VOICE-BUTTON-DEBUG] Starting diagnosis...');
    
    const buttonIds = ['micBtn', 'videoBtn', 'deafenBtn', 'screenBtn', 'ticTacToeBtn', 'disconnectBtn'];
    const issues = [];
    
    console.log('📊 Button Analysis:');
    console.log('==================');
    
    buttonIds.forEach(btnId => {
        const btn = document.getElementById(btnId);
        const icon = btn?.querySelector('i');
        
        console.log(`\n🔘 ${btnId}:`);
        
        if (!btn) {
            console.log('   ❌ Element not found');
            issues.push(`${btnId}: Element not found`);
            return;
        }
        
        // Check visibility
        const rect = btn.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        console.log(`   👁️  Visible: ${isVisible ? '✅' : '❌'} (${Math.round(rect.width)}x${Math.round(rect.height)})`);
        
        if (!isVisible) {
            issues.push(`${btnId}: Not visible (${Math.round(rect.width)}x${Math.round(rect.height)})`);
        }
        
        // Check computed styles
        const computedStyles = window.getComputedStyle(btn);
        console.log(`   🎨 Background: ${computedStyles.backgroundColor}`);
        console.log(`   🔘 Border-radius: ${computedStyles.borderRadius}`);
        console.log(`   📏 Size: ${computedStyles.width} x ${computedStyles.height}`);
        console.log(`   👆 Cursor: ${computedStyles.cursor}`);
        console.log(`   📱 Display: ${computedStyles.display}`);
        
        // Check if styles are being applied
        if (computedStyles.backgroundColor === 'rgba(0, 0, 0, 0)' || computedStyles.backgroundColor === 'transparent') {
            issues.push(`${btnId}: No background color applied`);
        }
        
        if (computedStyles.cursor !== 'pointer') {
            issues.push(`${btnId}: Cursor not set to pointer`);
        }
        
        // Check icon
        if (icon) {
            const iconStyles = window.getComputedStyle(icon);
            const iconContent = window.getComputedStyle(icon, '::before').content;
            
            console.log(`   🔤 Icon classes: ${icon.className}`);
            console.log(`   🎭 Icon content: ${iconContent}`);
            console.log(`   🎨 Icon color: ${iconStyles.color}`);
            console.log(`   📏 Icon size: ${iconStyles.fontSize}`);
            
            if (iconContent === 'none' || iconContent === '""') {
                issues.push(`${btnId}: FontAwesome icon not loading`);
            }
        } else {
            console.log('   ❌ Icon element not found');
            issues.push(`${btnId}: Icon element missing`);
        }
        
        // Check event listeners
        const hasClickListener = btn.onclick !== null || 
                               btn.addEventListener.toString().includes('click') ||
                               btn.outerHTML.includes('onclick');
        console.log(`   🖱️  Has click listener: ${hasClickListener ? '✅' : '❓'}`);
        
        // Check classes
        console.log(`   🏷️  Classes: ${btn.className}`);
        
        // Check if Tailwind classes are working
        const hasTailwindClasses = btn.className.includes('bg-[') || btn.className.includes('hover:bg-[');
        console.log(`   🎨 Has Tailwind classes: ${hasTailwindClasses ? '✅' : '❌'}`);
        
        if (hasTailwindClasses && computedStyles.backgroundColor === 'rgba(0, 0, 0, 0)') {
            issues.push(`${btnId}: Tailwind classes present but not applied`);
        }
    });
    
    // Check Tailwind CSS loading
    console.log('\n🌊 Tailwind CSS Status:');
    console.log('======================');
    
    const testElement = document.createElement('div');
    testElement.className = 'bg-red-500 w-10 h-10';
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    document.body.appendChild(testElement);
    
    const testStyles = window.getComputedStyle(testElement);
    const tailwindWorking = testStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                           testStyles.width === '40px' && 
                           testStyles.height === '40px';
    
    console.log(`Tailwind CSS working: ${tailwindWorking ? '✅' : '❌'}`);
    if (!tailwindWorking) {
        issues.push('Tailwind CSS not loading properly');
    }
    
    document.body.removeChild(testElement);
    
    // Check FontAwesome loading
    console.log('\n🎭 FontAwesome Status:');
    console.log('=====================');
    
    const faTestElement = document.createElement('i');
    faTestElement.className = 'fas fa-microphone';
    faTestElement.style.position = 'absolute';
    faTestElement.style.left = '-9999px';
    document.body.appendChild(faTestElement);
    
    const faStyles = window.getComputedStyle(faTestElement, '::before');
    const faWorking = faStyles.content && faStyles.content !== 'none' && faStyles.content !== '""';
    
    console.log(`FontAwesome working: ${faWorking ? '✅' : '❌'}`);
    if (!faWorking) {
        issues.push('FontAwesome not loading properly');
    }
    
    document.body.removeChild(faTestElement);
    
    // Check CSS file loading
    console.log('\n📄 CSS File Status:');
    console.log('==================');
    
    const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const voiceCssLink = cssLinks.find(link => link.href.includes('voice-call-section.css'));
    
    console.log(`Voice CSS file found: ${voiceCssLink ? '✅' : '❌'}`);
    if (voiceCssLink) {
        console.log(`   URL: ${voiceCssLink.href}`);
    } else {
        issues.push('voice-call-section.css not found');
    }
    
    // Summary
    console.log('\n📋 Summary:');
    console.log('===========');
    
    if (issues.length === 0) {
        console.log('🎉 No issues detected! Voice buttons should be working correctly.');
    } else {
        console.log(`⚠️  Found ${issues.length} issues:`);
        issues.forEach((issue, index) => {
            console.log(`   ${index + 1}. ${issue}`);
        });
        
        console.log('\n💡 Suggested fixes:');
        if (issues.some(i => i.includes('Tailwind'))) {
            console.log('   • Check if Tailwind CSS is loaded correctly');
            console.log('   • Try running: window.fixVoiceButtons()');
        }
        if (issues.some(i => i.includes('FontAwesome'))) {
            console.log('   • Check if FontAwesome CSS is loaded');
            console.log('   • Icons should still work with emoji fallbacks');
        }
        if (issues.some(i => i.includes('not visible'))) {
            console.log('   • Check parent container visibility');
            console.log('   • Check for CSS display/visibility overrides');
        }
    }
    
    return {
        buttonCount: buttonIds.length,
        issuesFound: issues.length,
        issues: issues,
        tailwindWorking: tailwindWorking,
        fontAwesomeWorking: faWorking
    };
};

// Auto-run debug on page load if there are issues
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const results = window.debugVoiceButtons();
        if (results.issuesFound > 0) {
            console.log('🚨 Voice button issues detected. Running automatic fix...');
            if (window.fixVoiceButtons) {
                window.fixVoiceButtons();
            }
        }
    }, 2000);
});
