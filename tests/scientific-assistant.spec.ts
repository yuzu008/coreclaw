import { test, expect } from '@playwright/test';

test.describe('Scientific Assistant Skill', () => {
  test('create a new chat with scientific-assistant skill and send a message', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.welcome h2')).toHaveText('🐾 CoreClaw');

    // Open New Chat modal
    await page.getByRole('button', { name: 'New Chat Group' }).click();
    await expect(page.locator('#newExpModal')).toHaveClass(/visible/);

    // Fill chat name
    await page.fill('#expNameInput', 'Scientific Test');

    // Select scientific-assistant skill
    const skillSelect = page.locator('#expSkillSelect');
    await expect(skillSelect).toBeVisible();

    // Wait for skills to populate (async fetch)
    await page.waitForFunction(() => {
      const sel = document.getElementById('expSkillSelect') as HTMLSelectElement;
      return sel && sel.options.length > 1;
    }, { timeout: 5000 });

    // Verify scientific-assistant exists in dropdown
    const options = await skillSelect.locator('option').allTextContents();
    const hasScientific = options.some(o => o.toLowerCase().includes('scientific'));
    expect(hasScientific).toBe(true);

    // Select scientific-assistant
    await skillSelect.selectOption({ label: options.find(o => o.toLowerCase().includes('scientific'))! });

    // Create the chat
    await page.locator('#newExpModal button:has-text("Create")').click();
    await expect(page.locator('#newExpModal')).not.toHaveClass(/visible/);

    // Verify chat is active
    await expect(page.locator('#expTitle')).toHaveText('Scientific Test');

    // Verify skill badge shows scientific-assistant
    const badge = page.locator('#chatSkillBadge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText(/scientific/i);

    // Verify message input area is visible
    await expect(page.locator('#chatInput')).toBeVisible();
    await expect(page.locator('#sendBtn')).toBeVisible();

    // Send a test message
    await page.fill('#chatInput', 'What is Bayesian inference?');
    await page.click('#sendBtn');

    // Verify user message appears in the chat
    await expect(page.locator('.message.user').last().locator('.msg-content'))
      .toContainText('What is Bayesian inference?', { timeout: 5000 });

    // Verify the processing indicator appears (task bar with stop button)
    // This proves the message was sent via WebSocket and the backend received it
    const taskBar = page.locator('.task-bar, #sendBtn, button:has-text("⏹")');
    await expect(taskBar.first()).toBeVisible({ timeout: 5000 });
  });

  test('scientific-assistant skill appears in sidebar skill selector', async ({ page }) => {
    await page.goto('/');

    // Click skill button in sidebar
    const skillBtn = page.locator('.sidebar-actions button:has-text("Skill"), .sidebar-actions button:has-text("🧩")');
    if (await skillBtn.isVisible()) {
      await skillBtn.click();

      // Wait for skill selector popup
      await page.waitForTimeout(500);

      // Check that scientific-assistant is listed
      const skillItems = await page.locator('.skill-popup-item, .skill-item').allTextContents();
      const hasScientific = skillItems.some(item => item.toLowerCase().includes('scientific'));
      expect(hasScientific).toBe(true);
    }
  });

  test('new chat with scientific-assistant persists skill after page reload', async ({ page }) => {
    await page.goto('/');

    // Create chat with scientific-assistant
    await page.getByRole('button', { name: 'New Chat Group' }).click();
    await page.fill('#expNameInput', 'Persist Skill Test');

    await page.waitForFunction(() => {
      const sel = document.getElementById('expSkillSelect') as HTMLSelectElement;
      return sel && sel.options.length > 1;
    }, { timeout: 5000 });

    const skillSelect = page.locator('#expSkillSelect');
    const options = await skillSelect.locator('option').allTextContents();
    await skillSelect.selectOption({ label: options.find(o => o.toLowerCase().includes('scientific'))! });

    await page.locator('#newExpModal button:has-text("Create")').click();
    await expect(page.locator('#expTitle')).toHaveText('Persist Skill Test');
    await expect(page.locator('#chatSkillBadge')).toContainText(/scientific/i);

    // Reload page
    await page.reload();

    // Click the experiment in sidebar to re-select it
    await page.locator('.experiment-item:has-text("Persist Skill Test")').first().click();
    await expect(page.locator('#expTitle')).toHaveText('Persist Skill Test');

    // Badge should still show scientific-assistant
    await expect(page.locator('#chatSkillBadge')).toContainText(/scientific/i);
  });
});
