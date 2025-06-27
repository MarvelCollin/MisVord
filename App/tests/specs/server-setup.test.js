import { test, expect } from '@playwright/test';

test.describe('Server Setup Tests', () => {
  
  test('should check if app is accessible', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MisVord/);
  });

  test('should check authentication status', async ({ page }) => {
    const response = await page.goto('/api/auth/check');
    const data = await response.json();
    console.log('Auth status:', data);
    
    if (!data.authenticated) {
      console.log('User not authenticated - need to login first');
    } else {
      console.log('User authenticated:', data.username);
    }
  });

  test('should find available servers', async ({ page }) => {
    const response = await page.goto('/api/user/servers');
    const data = await response.json();
    console.log('Available servers:', data);
    
    if (data.success && data.servers && data.servers.length > 0) {
      console.log('Found servers:', data.servers.map(s => `${s.id}: ${s.name}`));
      const firstServer = data.servers[0];
      console.log('Will use server:', firstServer.id, firstServer.name);
    } else {
      console.log('No servers found - need to create test server');
    }
  });

  test('should access first available server', async ({ page }) => {
    const serversResponse = await page.goto('/api/user/servers');
    const serversData = await serversResponse.json();
    
    if (serversData.success && serversData.servers && serversData.servers.length > 0) {
      const firstServerId = serversData.servers[0].id;
      console.log('Accessing server:', firstServerId);
      
      await page.goto(`/server/${firstServerId}`);
      await page.waitForTimeout(2000);
      
      const channels = await page.locator('[data-channel-type]').all();
      console.log('Found channels:', channels.length);
      
      if (channels.length > 0) {
        const voiceChannels = await page.locator('[data-channel-type="voice"]').all();
        const textChannels = await page.locator('[data-channel-type="text"]').all();
        console.log('Voice channels:', voiceChannels.length);
        console.log('Text channels:', textChannels.length);
      }
    } else {
      console.log('Skipping - no servers available');
    }
  });
}); 