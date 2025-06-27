import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.addInitScript(() => {
    window.BYPASS_CAPTCHA = true;
  });
  
  await page.goto('/login');
  
  await page.fill('input[name="email"]', 'kolin@gmail.com');
  await page.fill('input[name="password"]', 'Miawmiaw123@');
  
  const captchaInput = page.locator('#login_captcha');
  if (await captchaInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await captchaInput.fill('anything');
  }
  
  await page.click('button[type="submit"]');
  
  await page.waitForURL('/home', { timeout: 15000 });
  await expect(page).toHaveURL('/home');
  
  await page.context().storageState({ path: authFile });
}); 