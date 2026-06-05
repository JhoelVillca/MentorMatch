import { test, expect } from '@playwright/test';

test('Happy Path: Iniciar Sesión exitosamente', async ({ page }) => {
  // 1. Abrir la página de login
  await page.goto('http://localhost:5173/login');

  // 2. Llenar credenciales válidas
  // Usaremos unas credenciales de prueba; 
  // si no existen, el test podría fallar, 
  // pero el flujo base está implementado.
  await page.fill('input#username', 'mentor@mentormatch.com');
  await page.fill('input#password', 'password123');

  // 3. Hacer clic en el botón de Iniciar Sesión
  await page.click('button[type="submit"]');

  // 4. Esperar a que la navegación ocurra y verificar que cambió a una ruta protegida
  // Aceptamos /mentee, /mentor o /admin
  await page.waitForURL(/\/mentee|\/mentor|\/admin/);

  // 5. Verificamos explícitamente la URL
  const currentUrl = page.url();
  expect(currentUrl).toMatch(/\/mentee|\/mentor|\/admin/);
});
