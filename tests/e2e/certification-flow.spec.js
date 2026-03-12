// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Test E2E du parcours certification : login → parcours incubé → éléments présents.
 * Scénario simplifié : vérification de la présence des éléments clés sans login réel
 * (nécessite des données de test en base).
 */
test.describe('Parcours certification', () => {
  test('page de login affiche le formulaire et les éléments attendus', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Bienvenue/i })).toBeVisible();
    await expect(page.getByPlaceholder(/votre@email\.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/6\+ caractères/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Créer un compte/i })).toBeVisible();
  });

  test('page accept-invitation affiche le formulaire code', async ({ page }) => {
    await page.goto('/accept-invitation');
    await expect(page.getByRole('heading', { name: /Code d'invitation/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Ex\. ABC123/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Valider le code/i })).toBeVisible();
  });

  test('navigation vers /incube redirige vers login si non connecté', async ({ page }) => {
    await page.goto('/incube');
    await expect(page).toHaveURL(/\/login/);
  });

  test('page d\'accueil redirige vers login si non connecté', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });
});
