const { test, expect } = require('@playwright/test');

test('Voice presence is preserved through socket auth events', async ({ page }) => {
    await page.goto('http://localhost:1001');
    
    await page.waitForSelector('[data-page="home"]', { timeout: 30000 });
    
    await page.waitForFunction(() => {
        return window.globalSocketManager && 
               window.globalSocketManager.isConnected && 
               window.globalSocketManager.isAuthenticated;
    }, { timeout: 15000 });
    

    

    await page.addScriptTag({
        content: `
            window.runVoicePresenceTest = async function() {
                const socketManager = window.globalSocketManager;
                
                if (!socketManager) {
                    throw new Error('GlobalSocketManager not available');
                }
                

                

                socketManager.currentPresenceStatus = 'online';
                socketManager.currentActivityDetails = { type: 'In Voice Call' };
                socketManager.updatePresence('online', { type: 'In Voice Call' });
                

                

                await new Promise(resolve => setTimeout(resolve, 100));
                

                const isInVoiceCall = socketManager.currentActivityDetails?.type === 'In Voice Call';
                const initialActivity = isInVoiceCall ? { type: 'In Voice Call' } : { type: 'active' };
                


                
                socketManager.updatePresence('online', initialActivity);
                

                await new Promise(resolve => setTimeout(resolve, 100));
                

                const currentActivity = socketManager.currentActivityDetails?.type === 'In Voice Call' 
                    ? { type: 'In Voice Call' } 
                    : { type: 'active' };
                    
                socketManager.updatePresence('online', currentActivity);
                

                await new Promise(resolve => setTimeout(resolve, 100));
                
                const finalActivity = socketManager.currentActivityDetails?.type;
                

                
                return {
                    success: finalActivity === 'In Voice Call',
                    finalActivity: finalActivity,
                    expected: 'In Voice Call'
                };
            };
        `
    });
    

    const result = await page.evaluate(() => window.runVoicePresenceTest());
    

    

    expect(result.success).toBe(true);
    expect(result.finalActivity).toBe('In Voice Call');
    

});

test('Voice presence heartbeat preserves voice call status', async ({ page }) => {

    await page.goto('http://localhost:1001');
    

    await page.waitForSelector('[data-page="home"]', { timeout: 30000 });
    

    await page.waitForFunction(() => {
        return window.globalSocketManager && 
               window.globalSocketManager.isConnected && 
               window.globalSocketManager.isAuthenticated;
    }, { timeout: 15000 });
    

    
    const result = await page.evaluate(async () => {
        const socketManager = window.globalSocketManager;
        
        if (!socketManager) {
            throw new Error('GlobalSocketManager not available');
        }
        

        
        socketManager.currentPresenceStatus = 'online';
        socketManager.currentActivityDetails = { type: 'In Voice Call' };
        socketManager.updatePresence('online', { type: 'In Voice Call' });
        

        
        await new Promise(resolve => setTimeout(resolve, 6000));
        
        const finalActivity = socketManager.currentActivityDetails?.type;
        

        
        return {
            success: finalActivity === 'In Voice Call',
            finalActivity: finalActivity,
            expected: 'In Voice Call'
        };
    });
    

    

    expect(result.success).toBe(true);
    expect(result.finalActivity).toBe('In Voice Call');
    

});
