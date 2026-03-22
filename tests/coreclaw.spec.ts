import { test, expect } from '@playwright/test';

// ============================================================
// 1. Page Load & Basic UI
// ============================================================

test.describe('Page Load', () => {
  test('loads the CoreClaw UI', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CoreClaw/);
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.welcome h2')).toHaveText('🧪 CoreClaw');
  });

  test('shows skill count in sidebar', async ({ page }) => {
    await page.goto('/');
    const skillCount = page.locator('#skillCount');
    await expect(skillCount).toBeVisible();
    // Should show a number >= 0 (local skills directory)
    await expect(skillCount).toBeVisible();
  });
});

// ============================================================
// 2. Sidebar Toggle
// ============================================================

test.describe('Sidebar Toggle', () => {
  test('toggle button closes and opens sidebar', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('.sidebar');
    const toggle = page.locator('#sidebarToggle');

    await expect(sidebar).not.toHaveClass(/collapsed/);

    // Close
    await toggle.click();
    await expect(sidebar).toHaveClass(/collapsed/);
    await expect(toggle).toHaveText('▶');

    // Open
    await toggle.click();
    await expect(sidebar).not.toHaveClass(/collapsed/);
    await expect(toggle).toHaveText('◀');
  });

  test('Ctrl+B toggles sidebar', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('.sidebar');

    await page.keyboard.press('Control+b');
    await expect(sidebar).toHaveClass(/collapsed/);

    await page.keyboard.press('Control+b');
    await expect(sidebar).not.toHaveClass(/collapsed/);
  });
});

// ============================================================
// 3. Experiment CRUD
// ============================================================

test.describe('Experiment Management', () => {
  test('create a new experiment via modal', async ({ page }) => {
    await page.goto('/');

    // Click + New
    await page.click('.btn-new');
    await expect(page.locator('#newExpModal')).toHaveClass(/visible/);

    // Fill form
    await page.fill('#expNameInput', 'Playwright Test Experiment');
    await page.fill('#expDescInput', 'Automated test experiment');
    await page.click('#newExpModal .btn-primary');

    // Modal closes, experiment appears in sidebar
    await expect(page.locator('#newExpModal')).not.toHaveClass(/visible/);
    await expect(page.locator('.experiment-item.active .exp-name')).toHaveText('Playwright Test Experiment');

    // Chat area is visible
    await expect(page.locator('#expTitle')).toHaveText('Playwright Test Experiment');
    await expect(page.locator('#messagesArea')).toHaveClass(/visible/);
    await expect(page.locator('#inputArea')).toHaveClass(/visible/);
  });

  test('Ctrl+N opens new experiment modal', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+n');
    await expect(page.locator('#newExpModal')).toHaveClass(/visible/);
    // Escape closes
    await page.keyboard.press('Escape');
    await expect(page.locator('#newExpModal')).not.toHaveClass(/visible/);
  });

  test('rename experiment via header click', async ({ page }) => {
    await page.goto('/');

    // Create experiment first
    await page.click('.btn-new');
    await page.fill('#expNameInput', 'To Be Renamed');
    await page.click('#newExpModal .btn-primary');
    await expect(page.locator('#expTitle')).toHaveText('To Be Renamed');

    // Click title to rename
    await page.click('#expTitle');
    await expect(page.locator('#renameExpModal')).toHaveClass(/visible/);
    await expect(page.locator('#renameInput')).toHaveValue('To Be Renamed');

    // Change name
    await page.fill('#renameInput', 'Renamed Experiment');
    await page.click('#renameExpModal .btn-primary');

    await expect(page.locator('#renameExpModal')).not.toHaveClass(/visible/);
    await expect(page.locator('#expTitle')).toHaveText('Renamed Experiment');
  });

  test('delete experiment requires name confirmation', async ({ page }) => {
    await page.goto('/');

    // Create experiment
    await page.click('.btn-new');
    await page.fill('#expNameInput', 'Delete Me');
    await page.click('#newExpModal .btn-primary');

    // Click delete
    await page.click('.header-btn.danger');
    await expect(page.locator('#deleteExpModal')).toHaveClass(/visible/);
    await expect(page.locator('#deleteExpName')).toHaveText('Delete Me');

    // Delete button should be disabled
    await expect(page.locator('#deleteConfirmBtn')).toBeDisabled();

    // Type wrong name — still disabled
    await page.fill('#deleteConfirmInput', 'Wrong Name');
    await expect(page.locator('#deleteConfirmBtn')).toBeDisabled();

    // Type correct name — enabled
    await page.fill('#deleteConfirmInput', 'Delete Me');
    await expect(page.locator('#deleteConfirmBtn')).toBeEnabled();

    // Confirm delete
    await page.click('#deleteConfirmBtn');
    await expect(page.locator('#deleteExpModal')).not.toHaveClass(/visible/);

    // Back to welcome screen
    await expect(page.locator('.welcome')).toBeVisible();
    // Deleted experiment gone from sidebar
    await expect(page.locator('.experiment-item:has-text("Delete Me")')).toHaveCount(0);
  });

  test('sidebar rename and delete buttons appear on hover', async ({ page }) => {
    await page.goto('/');

    // Create experiment
    await page.click('.btn-new');
    await page.fill('#expNameInput', 'Hover Test');
    await page.click('#newExpModal .btn-primary');

    // Hover to show action buttons
    const item = page.locator('.experiment-item').first();
    await item.hover();
    await expect(item.locator('.exp-actions')).toBeVisible();
  });
});

// ============================================================
// 4. Settings Modal
// ============================================================

test.describe('Settings', () => {
  test('open and close settings modal', async ({ page }) => {
    await page.goto('/');

    await page.click('.settings-btn');
    await expect(page.locator('#settingsModal')).toHaveClass(/visible/);

    // Close with X button
    await page.click('#settingsModal .modal-close');
    await expect(page.locator('#settingsModal')).not.toHaveClass(/visible/);
  });

  test('provider toggle switches between OpenAI / Azure / Ollama', async ({ page }) => {
    await page.goto('/');
    await page.click('.settings-btn');

    // Click OpenAI explicitly to ensure it's selected
    await page.click('#providerOpenai');
    await expect(page.locator('#openaiFields')).toBeVisible();
    await expect(page.locator('#azureFields')).not.toBeVisible();
    await expect(page.locator('#ollamaFields')).not.toBeVisible();

    // Switch to Azure
    await page.click('#providerAzure');
    await expect(page.locator('#openaiFields')).not.toBeVisible();
    await expect(page.locator('#azureFields')).toBeVisible();
    await expect(page.locator('#ollamaFields')).not.toBeVisible();

    // Switch to Ollama
    await page.click('#providerOllama');
    await expect(page.locator('#openaiFields')).not.toBeVisible();
    await expect(page.locator('#azureFields')).not.toBeVisible();
    await expect(page.locator('#ollamaFields')).toBeVisible();
    await expect(page.locator('#settingsOllamaUrl')).toHaveValue('http://localhost:11434');
  });

  test('save settings and reload persists values', async ({ page }) => {
    await page.goto('/');
    await page.click('.settings-btn');

    await page.fill('#settingsGithubUser', 'test-user');
    await page.fill('#settingsGithubRepo', 'test-user/my-experiments');
    await page.click('#settingsModal .btn-primary');

    // Saved indicator
    await expect(page.locator('#settingsSaved')).toHaveClass(/visible/);

    // Close modal first, then reopen
    await page.click('#settingsModal .modal-close');
    await expect(page.locator('#settingsModal')).not.toHaveClass(/visible/);

    // Reopen settings — values should persist
    await page.click('.settings-btn');
    await expect(page.locator('#settingsGithubUser')).toHaveValue('test-user');
    await expect(page.locator('#settingsGithubRepo')).toHaveValue('test-user/my-experiments');
  });

  test('add MCP server manually', async ({ page }) => {
    await page.goto('/');
    await page.click('.settings-btn');

    await page.click('.btn-add-mcp');
    // MCP server card should appear
    await expect(page.locator('.mcp-server-card')).toHaveCount(1);
  });
});

// ============================================================
// 5. Chat & Agent (WebSocket flow)
// ============================================================

test.describe('Chat Flow', () => {
  test('send message via WebSocket and see user message appear', async ({ page }) => {
    await page.goto('/');

    // Create experiment
    await page.click('.btn-new');
    await page.fill('#expNameInput', 'Chat Test');
    await page.click('#newExpModal .btn-primary');
    await expect(page.locator('#inputArea')).toHaveClass(/visible/);

    // Wait for WebSocket to connect
    await page.waitForTimeout(1000);

    // Type and send message
    await page.fill('#chatInput', 'Hello from Playwright');
    await page.click('.btn-send');

    // User message should appear in chat
    await expect(page.locator('.message.user').first()).toBeVisible();
    await expect(page.locator('.message.user .msg-content').first()).toContainText('Hello from Playwright');
  });
});

// ============================================================
// 6. API Tests
// ============================================================

test.describe('REST API', () => {
  test('GET /api/experiments returns array', async ({ request }) => {
    const res = await request.get('/api/experiments');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('POST /api/experiments creates experiment', async ({ request }) => {
    const res = await request.post('/api/experiments', {
      data: { name: 'API Test', description: 'Created via API' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('API Test');
    expect(body.id).toBeTruthy();

    // Cleanup
    await request.delete(`/api/experiments/${body.id}`);
  });

  test('GET /api/skills returns 190 skills', async ({ request }) => {
    const res = await request.get('/api/skills');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.length).toBe(190);
  });

  test('PUT /api/settings saves and GET returns masked tokens', async ({ request }) => {
    const res = await request.put('/api/settings', {
      data: {
        github_token: 'ghp_testtoken123456',
        ai_provider: 'ollama',
        ollama_url: 'http://localhost:11434',
        ollama_model: 'llama3.3',
      },
    });
    expect(res.ok()).toBeTruthy();

    const getRes = await request.get('/api/settings');
    const settings = await getRes.json();
    expect(settings.ai_provider).toBe('ollama');
    expect(settings.ollama_url).toBe('http://localhost:11434');
    expect(settings.ollama_model).toBe('llama3.3');
    // Token should be masked
    expect(settings.github_token).toContain('•');
    expect(settings.github_token).toMatch(/3456$/);
  });
});
