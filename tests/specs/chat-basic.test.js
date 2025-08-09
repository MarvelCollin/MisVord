import { test, expect } from '@playwright/test';

const USERS = {
  user1: {
    email: 'kolin@gmail.com',
    password: 'Miawmiaw123@'
  },
  user2: {
    email: 'titi@gmail.com', 
    password: 'Miawmiaw123@'
  }
};

async function loginUser(page, userCredentials) {
  await page.addInitScript(() => {
    window.BYPASS_CAPTCHA = true;
  });
  

  await page.goto('/login');
  

  try {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
  } catch (error) {

    throw error;
  }
  

  await page.fill('input[name="email"], input[type="email"]', userCredentials.email);
  await page.fill('input[name="password"], input[type="password"]', userCredentials.password);
  
  const captchaInput = page.locator('#login_captcha');
  if (await captchaInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await captchaInput.fill('anything');
  }
  

  await page.click('button[type="submit"], .login-btn, .btn-primary');
  
  try {
    await page.waitForURL('**/home', { timeout: 20000 });

  } catch (error) {

    throw error;
  }
}

async function navigateToDirectMessage(page) {
  try {

    
    await page.waitForSelector('.dm-friend-item[data-chat-room-id="1"]', { timeout: 10000 });
    
    const dmFriendItem = page.locator('.dm-friend-item[data-chat-room-id="1"]');

    await dmFriendItem.click();
    

    await page.waitForSelector('#chat-messages, .messages-container', { timeout: 15000 });

  } catch (error) {


    

    const dmItems = await page.locator('.dm-friend-item').count();

    
    throw error;
  }
}

test.describe('Basic Chat Tests', () => {
  test('should login and navigate to DM', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {

      await loginUser(page, USERS.user1);
      

      await navigateToDirectMessage(page);
      

      await page.waitForSelector('#message-input', { timeout: 5000 });
      
      const messageInput = page.locator('#message-input');
      expect(await messageInput.isVisible()).toBe(true);
      

      
    } finally {
      await context.close();
    }
  });

  test('should send a simple message', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await loginUser(page, USERS.user1);
      await navigateToDirectMessage(page);
      
      const testMessage = `Test message ${Date.now()}`;
      
      const messageInput = page.locator('#message-input');
      await messageInput.fill(testMessage);
      await page.keyboard.press('Enter');
      
      await page.waitForSelector(`text="${testMessage}"`, { timeout: 10000 });
      
      const messageExists = await page.locator(`text="${testMessage}"`).count();
      expect(messageExists).toBeGreaterThan(0);
      

      
    } finally {
      await context.close();
    }
  });
}); 