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

const SELECTORS = {
  messageInput: '#message-input',
  sendButton: '#send-button',
  messageContent: '.message-content',
  reactionButton: '.message-action-reaction',
  emojiPickerButton: '.emoji-picker-button',
  reactionPill: '.message-reaction-pill',
  editButton: '.message-action-edit',
  editForm: '.edit-message-form',
  editedBadge: '.edited-badge',
  dmFriendItem: '.dm-friend-item[data-chat-room-id="1"]',
  chatMessages: '#chat-messages'
};

async function loginUser(page, userCredentials, userLabel) {
  console.log(`🔐 Logging in ${userLabel}...`);
  await page.addInitScript(() => { window.BYPASS_CAPTCHA = true; });
  await page.goto('/login');
  await page.waitForSelector('input[name="email"]');
  await page.fill('input[name="email"]', userCredentials.email);
  await page.fill('input[name="password"]', userCredentials.password);
  
  const captchaInput = page.locator('#login_captcha');
  if (await captchaInput.isVisible({ timeout: 1500 })) {
    await captchaInput.fill('bypass');
  }
  
  await page.click('button[type="submit"]');
  await page.waitForURL('**/home', { timeout: 15000 });
  console.log(`✅ ${userLabel} logged in.`);
}

async function navigateToDirectMessage(page, userLabel) {
  console.log(`📱 ${userLabel}: Navigating to DM...`);
  await page.waitForSelector(SELECTORS.dmFriendItem, { timeout: 10000 });
  await page.locator(SELECTORS.dmFriendItem).click();
  await page.waitForSelector(SELECTORS.chatMessages, { timeout: 10000 });
  await page.waitForFunction(() => window.chatSection, { timeout: 5000 });
  console.log(`✅ ${userLabel} in DM chat.`);
}

async function sendMessage(page, content) {
  const messageInput = page.locator(SELECTORS.messageInput);
  await messageInput.click();
  await messageInput.fill(content);
  await page.keyboard.press('Enter');
  await page.waitForSelector(`text="${content}"`, { timeout: 8000 });
}

async function waitForMessage(page, content) {
  await page.waitForSelector(`text="${content}"`, { timeout: 15000 });
}

test.describe('Complete Chat Workflow', () => {
  let user1Context, user2Context;
  let user1Page, user2Page;

  test.beforeAll(async ({ browser }) => {
    user1Context = await browser.newContext();
    user2Context = await browser.newContext();
    user1Page = await user1Context.newPage();
    user2Page = await user2Context.newPage();
    
    await loginUser(user1Page, USERS.user1, 'User1');
    await loginUser(user2Page, USERS.user2, 'User2');
    
    await navigateToDirectMessage(user1Page, 'User1');
    await navigateToDirectMessage(user2Page, 'User2');
  });

  test.afterAll(async () => {
    await user1Context.close();
    await user2Context.close();
  });

  test('should send and receive messages', async () => {
    const message = `Live message from User1: ${Date.now()}`;
    console.log(`📝 User1 sending: "${message}"`);
    await sendMessage(user1Page, message);
    
    console.log('⏳ User2 waiting for message...');
    await waitForMessage(user2Page, message);
    console.log('✅ User2 received message.');
  });
  
  test('should add and sync reactions', async () => {
    const reactionMessage = `Message to react to: ${Date.now()}`;
    await sendMessage(user1Page, reactionMessage);
    await waitForMessage(user2Page, reactionMessage);

    console.log('😊 User2 adding reaction...');
    const messageOnUser2 = user2Page.locator(SELECTORS.messageContent, { hasText: reactionMessage });
    await messageOnUser2.hover();
    await messageOnUser2.locator(SELECTORS.reactionButton).click();
    await user2Page.locator(SELECTORS.emojiPickerButton).first().click();

    console.log('⏳ User1 waiting for reaction...');
    const reactionOnUser1 = user1Page.locator(SELECTORS.reactionPill);
    await expect(reactionOnUser1).toBeVisible({ timeout: 10000 });
    console.log('✅ User1 received reaction.');
  });

  test('should edit and sync messages', async () => {
    const originalMessage = `Message to edit: ${Date.now()}`;
    const editedMessage = `[EDITED] ${originalMessage}`;
    await sendMessage(user1Page, originalMessage);
    await waitForMessage(user2Page, originalMessage);

    console.log('✏️ User1 editing message...');
    const messageOnUser1 = user1Page.locator(SELECTORS.messageContent, { hasText: originalMessage });
    await messageOnUser1.hover();
    await messageOnUser1.locator(SELECTORS.editButton).click();
    
    const editInput = user1Page.locator(`${SELECTORS.editForm} textarea`);
    await editInput.fill(editedMessage);
    await editInput.press('Enter');

    console.log('⏳ User2 waiting for edited message...');
    await waitForMessage(user2Page, editedMessage);
    const editedBadge = user2Page.locator(SELECTORS.messageContent, { hasText: editedMessage }).locator(SELECTORS.editedBadge);
    await expect(editedBadge).toBeVisible({ timeout: 5000 });
    console.log('✅ User2 saw edited message.');
  });

  test('should not allow editing others messages', async () => {
    const message = `Final check from User1: ${Date.now()}`;
    await sendMessage(user1Page, message);
    await waitForMessage(user2Page, message);

    console.log("🔒 User2 trying to edit User1's message (should fail)...");
    const messageOnUser2 = user2Page.locator(SELECTORS.messageContent, { hasText: message });
    await messageOnUser2.hover();
    const editButton = messageOnUser2.locator(SELECTORS.editButton);
    
    await expect(editButton).not.toBeVisible({ timeout: 2000 });
    console.log("✅ Correct, edit button is not visible.");
  });
}); 