import { test, expect } from '@playwright/test';

test('Debería iniciar sesión exitosamente como Mentee', async ({ page }) => {
  page.on('console', msg => console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', err => console.error(`BROWSER ERROR: ${err.message}`));

  await page.goto('/login');
  await page.fill('#username', 'mentee@test.com');
  await page.fill('#password', '123456');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/mentee/);
});
