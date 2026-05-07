const { test, expect } = require('@playwright/test');

test.describe('index.html Visual Regression', () => {
  test('チュートリアル初期表示', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('tutorialSeen'));
    await page.reload();
    await page.waitForSelector('.tutorial-overlay:not(.hidden)');
    await expect(page).toHaveScreenshot('index-tutorial.png');
  });

  test('選択画面（チュートリアル後）', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('tutorialSeen', 'true'));
    await page.reload();
    await page.waitForSelector('.selection-screen:not(.hidden)');
    await expect(page).toHaveScreenshot('index-selection.png');
  });

  test('ギャラリーモード画面', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('tutorialSeen', 'true'));
    await page.reload();
    await page.waitForSelector('.selection-screen:not(.hidden)');
    await page.click('#showGalleryBtn');
    await page.waitForSelector('.upload-view.visible');
    await expect(page).toHaveScreenshot('index-gallery.png');
  });
});

test.describe('camera.html Visual Regression', () => {
  test('初期表示（カメラ権限なし）', async ({ page }) => {
    await page.goto('/camera.html');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('camera-initial.png');
  });
});
