import { test, expect } from '@playwright/test';

test.describe('Server Setup Tests', () => {
  
  test('should check if app is accessible', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MisVord/);
  });

  test('should check authentication status', async ({ page }) => {
    const response = await page.goto('/api/auth/check');
    const data = await response.json();

    
    if (!data.authenticated) {

    } else {

    }
  });

  test('should find available servers', async ({ page }) => {
    const response = await page.goto('/api/user/servers');
    const data = await response.json();

    
    if (data.success && data.servers && data.servers.length > 0) {

      const firstServer = data.servers[0];

    } else {

    }
  });

  test('should access first available server', async ({ page }) => {
    const serversResponse = await page.goto('/api/user/servers');
    const serversData = await serversResponse.json();
    
    if (serversData.success && serversData.servers && serversData.servers.length > 0) {
      const firstServerId = serversData.servers[0].id;

      
      await page.goto(`/server/${firstServerId}`);
      await page.waitForTimeout(2000);
      
      const channels = await page.locator('[data-channel-type]').all();

      
      if (channels.length > 0) {
        const voiceChannels = await page.locator('[data-channel-type="voice"]').all();
        const textChannels = await page.locator('[data-channel-type="text"]').all();


      }
    } else {

    }
  });
}); 