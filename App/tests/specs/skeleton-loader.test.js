import { test, expect } from '@playwright/test';

test.describe('ChatSkeletonLoader Tests', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.addInitScript(() => {
      window.BYPASS_CAPTCHA = true;
    });
  });

  test('should not have duplicate ChatSkeletonLoader declarations', async ({ page }) => {
    const serversResponse = await page.request.get('/api/user/servers');
    const serversData = await serversResponse.json();
    
    if (!serversData.success || !serversData.servers || serversData.servers.length === 0) {
      test.skip('No servers available for testing');
    }
    
    const firstServerId = serversData.servers[0].id;
    await page.goto(`/server/${firstServerId}`);
    
    await page.waitForSelector('[data-channel-type="voice"]');
    await page.click('[data-channel-type="voice"]');
    await page.waitForTimeout(1000);
    
    const textChannel = page.locator('[data-channel-type="text"]').first();
    if (await textChannel.count() > 0) {
      await textChannel.click();
      await page.waitForTimeout(1000);
    }
    
    await page.waitForSelector('[data-channel-type="voice"]');
    await page.click('[data-channel-type="voice"]');
    await page.waitForTimeout(1000);
    
    const hasDuplicateError = consoleErrors.some(error => 
      error.includes('ChatSkeletonLoader') && error.includes('already been declared')
    );
    
    expect(hasDuplicateError).toBeFalsy();
  });

  test('should load ChatSkeletonLoader only once', async ({ page }) => {
    const serversResponse = await page.request.get('/api/user/servers');
    const serversData = await serversResponse.json();
    
    if (!serversData.success || !serversData.servers || serversData.servers.length === 0) {
      test.skip('No servers available for testing');
    }
    
    const firstServerId = serversData.servers[0].id;
    await page.goto(`/server/${firstServerId}`);
    
    await page.waitForSelector('[data-channel-type="voice"]');
    
    const chatSkeletonLoaderExists = await page.evaluate(() => {
      return typeof window.ChatSkeletonLoader !== 'undefined';
    });
    
    expect(chatSkeletonLoaderExists).toBeTruthy();
    
    await page.click('[data-channel-type="voice"]');
    await page.waitForTimeout(1500);
    
    const stillExists = await page.evaluate(() => {
      return typeof window.ChatSkeletonLoader !== 'undefined';
    });
    
    expect(stillExists).toBeTruthy();
    
    const syntaxErrors = consoleErrors.filter(error => 
      error.includes('SyntaxError') || error.includes('already been declared')
    );
    
    expect(syntaxErrors).toHaveLength(0);
  });

  test('should handle rapid channel switching without script errors', async ({ page }) => {
    const serversResponse = await page.request.get('/api/user/servers');
    const serversData = await serversResponse.json();
    
    if (!serversData.success || !serversData.servers || serversData.servers.length === 0) {
      test.skip('No servers available for testing');
    }
    
    const firstServerId = serversData.servers[0].id;
    await page.goto(`/server/${firstServerId}`);
    
    const channels = await page.locator('[data-channel-type]').all();
    
    for (let i = 0; i < Math.min(5, channels.length); i++) {
      await channels[i % channels.length].click();
      await page.waitForTimeout(300);
    }
    
    const scriptErrors = consoleErrors.filter(error => 
      error.includes('SyntaxError') || 
      error.includes('already been declared') ||
      error.includes('ChatSkeletonLoader')
    );
    
    expect(scriptErrors).toHaveLength(0);
  });

  test.afterEach(async ({ page }) => {
    if (consoleErrors.length > 0) {
      console.log('Console errors in skeleton loader test:', consoleErrors);
    }
  });
}); 