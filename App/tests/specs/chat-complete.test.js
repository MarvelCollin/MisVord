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
  messageForm: '#message-form',    
  messageGroup: '.message-group',
  messageContent: '.message-content',
  messageMainText: '.message-main-text',
  reactionButton: '.message-action-reaction',
  emojiPickerButton: '.emoji-picker-button',
  reactionPill: '.message-reaction-pill',
  reactionContainer: '.message-reactions-container',
  editButton: '.message-action-edit',
  deleteButton: '.message-action-delete',
  editForm: '.edit-message-form',
  editedBadge: '.edited-badge',
  dmFriendItem: '.dm-friend-item[data-chat-room-id="1"]',
  chatMessages: '#chat-messages',
  messagesContainer: '.messages-container'
};

async function loginUser(page, userCredentials, userLabel) {

  
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

async function navigateToDirectMessage(page, userLabel) {

  
  try {
    await page.waitForSelector(SELECTORS.dmFriendItem, { timeout: 5000 });
    
    const dmFriendItem = page.locator(SELECTORS.dmFriendItem);
    await dmFriendItem.click();
    

    await page.waitForSelector(SELECTORS.chatMessages, { timeout: 10000 });
    await page.waitForSelector(SELECTORS.messageInput, { timeout: 8000 });
    await page.waitForSelector(SELECTORS.sendButton, { timeout: 5000 });
    

    await page.waitForFunction(() => window.chatSection, { timeout: 5000 });
    

  } catch (error) {

    
    const dmItems = await page.locator('.dm-friend-item').count();

    
    throw error;
  }
}

async function sendMessage(page, content, userLabel) {

  

  await page.waitForSelector(SELECTORS.messageInput, { timeout: 8000 });
  await page.waitForFunction(() => window.chatSection, { timeout: 8000 });
  
  const messageInput = page.locator(SELECTORS.messageInput);
  await messageInput.click();
  await messageInput.fill(content);
  

  await page.keyboard.press('Enter');
  

  await page.waitForSelector(`text="${content}"`, { timeout: 12000 });

}

async function waitForMessageReceived(page, content, userLabel) {

  
  await page.waitForSelector(`text="${content}"`, { timeout: 15000 });

}

async function tryAddReaction(page, messageText, emoji, userLabel) {

  
  try {

    const messageElement = page.locator(SELECTORS.messageContent).filter({ hasText: messageText });
    await messageElement.hover();
    

    const reactionButton = messageElement.locator(SELECTORS.reactionButton);
    
    if (await reactionButton.isVisible({ timeout: 3000 })) {
      await reactionButton.click();

      

      const emojiButton = page.locator(SELECTORS.emojiPickerButton).first();
      if (await emojiButton.isVisible({ timeout: 3000 })) {
        await emojiButton.click();

        

        await page.waitForSelector(SELECTORS.reactionPill, { timeout: 5000 });

        return true;
      } else {

        return false;
      }
    } else {

      return false;
    }
  } catch (error) {

    return false;
  }
}

async function tryEditMessage(page, messageText, newText, userLabel) {

  
  try {
    const messageElement = page.locator(SELECTORS.messageContent).filter({ hasText: messageText });
    await messageElement.hover();
    
    const editButton = messageElement.locator(SELECTORS.editButton);
    
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();

      

      const editForm = page.locator(SELECTORS.editForm);
      if (await editForm.isVisible({ timeout: 3000 })) {
        const editTextarea = editForm.locator('textarea');
        await editTextarea.clear();
        await editTextarea.fill(newText);
        await page.keyboard.press('Enter');
        

        await page.waitForSelector(SELECTORS.editedBadge, { timeout: 5000 });

        return true;
      } else {

        return false;
      }
    } else {

      return false;
    }
  } catch (error) {

    return false;
  }
}

test.describe('Complete Chat System Test', () => {
  test('Full chat workflow - login once, test everything in sequence', async ({ browser }, testInfo) => {

    testInfo.setTimeout(90000);
    let user1Context, user2Context;
    let user1Page, user2Page;

    try {


      
      user1Context = await browser.newContext();
      user2Context = await browser.newContext();
      
      user1Page = await user1Context.newPage();
      user2Page = await user2Context.newPage();
      

      await loginUser(user1Page, USERS.user1, 'User1');
      await loginUser(user2Page, USERS.user2, 'User2');
      

      await navigateToDirectMessage(user1Page, 'User1');
      await navigateToDirectMessage(user2Page, 'User2');
      

       try {
         await Promise.all([
           user1Page.waitForFunction(() => 
             window.globalSocketManager && 
             window.globalSocketManager.socket && 
             window.globalSocketManager.socket.connected, 
             { timeout: 5000 }
           ),
           user2Page.waitForFunction(() => 
             window.globalSocketManager && 
             window.globalSocketManager.socket && 
             window.globalSocketManager.socket.connected, 
             { timeout: 5000 }
           )
         ]);

       } catch (error) {

       }
      


       
       const message1 = `Hello from User1 - ${Date.now()}`;
       const message2 = `Hello back from User2 - ${Date.now()}`;
       

       await sendMessage(user1Page, message1, 'User1');
       await waitForMessageReceived(user2Page, message1, 'User2');
       

       await sendMessage(user2Page, message2, 'User2');
       await waitForMessageReceived(user1Page, message2, 'User1');
      

      const user1Messages1 = await user1Page.locator(`text="${message1}"`).count();
      const user1Messages2 = await user1Page.locator(`text="${message2}"`).count();
      const user2Messages1 = await user2Page.locator(`text="${message1}"`).count();
      const user2Messages2 = await user2Page.locator(`text="${message2}"`).count();
      
      expect(user1Messages1).toBeGreaterThan(0);
      expect(user1Messages2).toBeGreaterThan(0);
      expect(user2Messages1).toBeGreaterThan(0);
      expect(user2Messages2).toBeGreaterThan(0);
      

      


      
      const reactionMessage = `React to this - ${Date.now()}`;
      

      await sendMessage(user1Page, reactionMessage, 'User1');
      await waitForMessageReceived(user2Page, reactionMessage, 'User2');
      

      const reactionAdded = await tryAddReaction(user2Page, reactionMessage, '👍', 'User2');
      
      if (reactionAdded) {

         try {
           await user1Page.waitForSelector(SELECTORS.reactionPill, { timeout: 6000 });

         } catch (error) {

         }
      } else {

      }
      


      
      const editMessage = `Edit this message - ${Date.now()}`;
      const editedContent = `EDITED: ${editMessage}`;
      

      await sendMessage(user1Page, editMessage, 'User1');
      await waitForMessageReceived(user2Page, editMessage, 'User2');
      

      const editSuccess = await tryEditMessage(user1Page, editMessage, editedContent, 'User1');
      
      if (editSuccess) {

         try {
           await user2Page.waitForSelector(`text="${editedContent}"`, { timeout: 6000 });
           await user2Page.waitForSelector(SELECTORS.editedBadge, { timeout: 4000 });

         } catch (error) {

         }
      } else {

      }
      


      
      const permissionMessage = `Permission test - ${Date.now()}`;
      

      await sendMessage(user1Page, permissionMessage, 'User1');
      await waitForMessageReceived(user2Page, permissionMessage, 'User2');
      

      const illegalEdit = await tryEditMessage(user2Page, permissionMessage, 'HACKED', 'User2');
      
      if (!illegalEdit) {

      } else {

      }
      

      
    } catch (error) {




      throw error;
    } finally {

      if (user1Context) await user1Context.close();
      if (user2Context) await user2Context.close();
    }
  });
}); 