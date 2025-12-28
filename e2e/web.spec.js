import { test, expect } from '@playwright/test';

const WEB_BASE = process.env.WEB_URL || 'http://localhost:3000';

test.describe('Web Application', () => {
  
  test.beforeEach(async ({ page }) => {
    // Skip if web server is not running
    test.skip(!process.env.WEB_URL, 'Web server not configured');
  });

  test('Homepage loads', async ({ page }) => {
    await page.goto(WEB_BASE);
    await expect(page).toHaveTitle(/OrbitalAstro/i);
  });

  test('Dashboard page accessible', async ({ page }) => {
    await page.goto(`${WEB_BASE}/dashboard`);
    // Add specific assertions based on your dashboard content
    await expect(page.locator('body')).toBeVisible();
  });

  test('Navigation works', async ({ page }) => {
    await page.goto(WEB_BASE);
    
    // Test navigation links if they exist
    const navLinks = page.locator('nav a, [role="navigation"] a');
    const count = await navLinks.count();
    
    if (count > 0) {
      // Click first nav link and verify navigation
      await navLinks.first().click();
      await expect(page).not.toHaveURL(WEB_BASE);
    }
  });
});





