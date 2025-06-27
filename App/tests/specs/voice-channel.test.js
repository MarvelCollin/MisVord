import { test, expect } from '@playwright/test';

test.describe('Voice Channel Tests', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.addInitScript(() => {
      window.BYPASS_CAPTCHA = true;
    });
  });

  test('should find and navigate to voice channel', async ({ page }) => {
    const serversResponse = await page.request.get('/api/user/servers');
    const serversData = await serversResponse.json();
    
    if (!serversData.success || !serversData.servers || serversData.servers.length === 0) {
      test.skip('No servers available for testing');
    }
    
    const firstServerId = serversData.servers[0].id;
    await page.goto(`/server/${firstServerId}`);
    
    await page.waitForSelector('[data-channel-type="voice"]', { timeout: 10000 });
    await page.click('[data-channel-type="voice"]');
    
    await page.waitForTimeout(2000);
    
    const hasVoiceUIError = consoleErrors.some(error => 
      error.includes('Could not find voice UI elements')
    );
    
    expect(hasVoiceUIError).toBeFalsy();
    
    await expect(page.locator('#voice-container')).toBeVisible();
  });

  test('should load voice UI elements after SPA navigation', async ({ page }) => {
    const serversResponse = await page.request.get('/api/user/servers');
    const serversData = await serversResponse.json();
    
    if (!serversData.success || !serversData.servers || serversData.servers.length === 0) {
      test.skip('No servers available for testing');
    }
    
    const firstServerId = serversData.servers[0].id;
    await page.goto(`/server/${firstServerId}`);
    
    await page.waitForSelector('[data-channel-type="voice"]');
    await page.click('[data-channel-type="voice"]');
    
    await page.waitForTimeout(1500);
    
    await expect(page.locator('#joinView')).toBeVisible();
    await expect(page.locator('#connectingView')).toBeAttached();
    await expect(page.locator('#connectedView')).toBeAttached();
    await expect(page.locator('#voiceControls')).toBeAttached();
  });

  test('should switch between text and voice channels', async ({ page }) => {
    const serversResponse = await page.request.get('/api/user/servers');
    const serversData = await serversResponse.json();
    
    if (!serversData.success || !serversData.servers || serversData.servers.length === 0) {
      test.skip('No servers available for testing');
    }
    
    const firstServerId = serversData.servers[0].id;
    await page.goto(`/server/${firstServerId}`);
    
    const textChannel = page.locator('[data-channel-type="text"]').first();
    if (await textChannel.count() > 0) {
      await textChannel.click();
      await page.waitForTimeout(500);
    }
    
    await page.waitForSelector('[data-channel-type="voice"]');
    await page.click('[data-channel-type="voice"]');
    await page.waitForTimeout(1500);
    
    const hasUIError = consoleErrors.some(error => 
      error.includes('Could not find voice UI elements')
    );
    
    expect(hasUIError).toBeFalsy();
    await expect(page.locator('#voice-container')).toBeVisible();
  });

  test('should handle multiple voice channel switches', async ({ page }) => {
    const serversResponse = await page.request.get('/api/user/servers');
    const serversData = await serversResponse.json();
    
    if (!serversData.success || !serversData.servers || serversData.servers.length === 0) {
      test.skip('No servers available for testing');
    }
    
    const firstServerId = serversData.servers[0].id;
    await page.goto(`/server/${firstServerId}`);
    
    const voiceChannels = await page.locator('[data-channel-type="voice"]').all();
    
    if (voiceChannels.length > 1) {
      for (let i = 0; i < Math.min(3, voiceChannels.length); i++) {
        await voiceChannels[i].click();
        await page.waitForTimeout(1000);
        
        await expect(page.locator('#voice-container')).toBeVisible();
      }
    }
    
    const hasUIError = consoleErrors.some(error => 
      error.includes('Could not find voice UI elements')
    );
    
    expect(hasUIError).toBeFalsy();
  });

  test('should join voice channel successfully', async ({ page }) => {
    const serversResponse = await page.request.get('/api/user/servers');
    const serversData = await serversResponse.json();
    
    if (!serversData.success || !serversData.servers || serversData.servers.length === 0) {
      test.skip('No servers available for testing');
    }
    
    const firstServerId = serversData.servers[0].id;
    await page.goto(`/server/${firstServerId}`);
    
    await page.waitForSelector('[data-channel-type="voice"]');
    await page.click('[data-channel-type="voice"]');
    await page.waitForTimeout(1500);
    
    await expect(page.locator('#joinBtn')).toBeVisible();
    await page.click('#joinBtn');
    
    await page.waitForTimeout(3000);
    
    const hasJoinError = consoleErrors.some(error => 
      error.includes('Auto join voice failed')
    );
    
    expect(hasJoinError).toBeFalsy();
  });

  test.afterEach(async ({ page }) => {
    if (consoleErrors.length > 0) {
      console.log('Console errors captured:', consoleErrors);
    }
  });
}); 