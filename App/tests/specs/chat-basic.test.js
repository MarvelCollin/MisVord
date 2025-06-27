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
  
  console.log('Going to login page...');
  await page.goto('/login');
  
  // Wait for page to load, but be more lenient
  try {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
  } catch (error) {
    console.log('Could not find email input, current URL:', page.url());
    throw error;
  }
  
  console.log('Filling credentials...');
  await page.fill('input[name="email"], input[type="email"]', userCredentials.email);
  await page.fill('input[name="password"], input[type="password"]', userCredentials.password);
  
  const captchaInput = page.locator('#login_captcha');
  if (await captchaInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await captchaInput.fill('anything');
  }
  
  console.log('Submitting login...');
  await page.click('button[type="submit"], .login-btn, .btn-primary');
  
  try {
    await page.waitForURL('**/home', { timeout: 20000 });
    console.log('Login successful, current URL:', page.url());
  } catch (error) {
    console.log('Login URL after submit:', page.url());
    throw error;
  }
}

async function navigateToDirectMessage(page) {
  try {
    console.log('Looking for dm-friend-item with chat-room-id=1...');
    
    await page.waitForSelector('.dm-friend-item[data-chat-room-id="1"]', { timeout: 10000 });
    
    const dmFriendItem = page.locator('.dm-friend-item[data-chat-room-id="1"]');
    console.log('Found dm-friend-item, clicking...');
    await dmFriendItem.click();
    
    // Wait for chat to load
    await page.waitForSelector('#chat-messages, .messages-container', { timeout: 15000 });
    console.log('Chat messages container found');
  } catch (error) {
    console.log('Error in navigateToDirectMessage:', error.message);
    console.log('Current URL:', page.url());
    
    // Try to show what DM items are available
    const dmItems = await page.locator('.dm-friend-item').count();
    console.log('Number of DM items found:', dmItems);
    
    throw error;
  }
}

test.describe('Basic Chat Tests', () => {
  test('should login and navigate to DM', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      console.log('Testing login...');
      await loginUser(page, USERS.user1);
      
      console.log('Testing DM navigation...');
      await navigateToDirectMessage(page);
      
      console.log('Testing message input exists...');
      await page.waitForSelector('#message-input', { timeout: 5000 });
      
      const messageInput = page.locator('#message-input');
      expect(await messageInput.isVisible()).toBe(true);
      
      console.log('✅ Basic test passed!');
      
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
      
      console.log('✅ Message send test passed!');
      
    } finally {
      await context.close();
    }
  });
}); 