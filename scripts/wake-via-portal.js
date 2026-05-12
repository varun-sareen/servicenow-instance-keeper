'use strict';

// Wakes a hibernating PDI by logging into developer.servicenow.com.
// Portal auth triggers a server-side wake of the associated instance.
// Assumption: no MFA on the developer portal account. If MFA is detected,
// this function throws immediately rather than hanging.

const PORTAL_URL = 'https://developer.servicenow.com';
const POLL_INTERVAL_MS = 10_000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SIGN_IN_SELECTORS = [
  'a[href*="signin"]',
  'a[href*="sign-in"]',
  'a:has-text("Sign In")',
  'a:has-text("Log In")',
  'button:has-text("Sign In")',
  'button:has-text("Log In")',
];

const EMAIL_SELECTORS = [
  'input[type="email"]',
  'input[name="email"]',
  'input[name="username"]',
  '#email',
  '#username',
];

const PASSWORD_SELECTORS = [
  'input[type="password"]',
  'input[name="password"]',
  '#password',
];

const SUBMIT_SELECTORS = [
  'button[type="submit"]',
  'input[type="submit"]',
  'button:has-text("Sign In")',
  'button:has-text("Log In")',
];

const MFA_SELECTORS = [
  'input[autocomplete="one-time-code"]',
  'text=/verification code/i',
  'text=/two-factor/i',
  'text=/we sent you a code/i',
  'text=/enter the code/i',
  'text=/check your email/i',
];

async function wakeViaDevPortal({ browser, instanceUrl, log }) {
  const email = process.env.SERVICENOW_DEV_EMAIL;
  const password = process.env.SERVICENOW_DEV_PASSWORD;

  if (!email) {
    throw new Error('Missing required env var: SERVICENOW_DEV_EMAIL');
  }
  if (!password) {
    throw new Error('Missing required env var: SERVICENOW_DEV_PASSWORD');
  }

  const baseUrl = instanceUrl.replace(/\/+$/, '');
  log('[portal] Starting developer portal fallback wake-up...');

  const portalContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const pollContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });

  try {
    // ── Portal login ────────────────────────────────────────────
    const portalPage = await portalContext.newPage();

    log(`[portal] Navigating to ${PORTAL_URL}...`);
    await portalPage.goto(PORTAL_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    log(`[portal] Landed at: ${portalPage.url()}`);

    // Click sign-in entry point
    log('[portal] Looking for sign-in entry point...');
    let signInSelector = null;
    for (const selector of SIGN_IN_SELECTORS) {
      const el = await portalPage.$(selector);
      if (el) {
        signInSelector = selector;
        log(`[portal] Clicking sign-in element matched by: ${selector}`);
        await el.click();
        break;
      }
    }
    if (!signInSelector) {
      throw new Error(
        `[portal] No sign-in entry point found on ${portalPage.url()}. ` +
        `Tried: ${SIGN_IN_SELECTORS.join(', ')}`
      );
    }

    await portalPage.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    log(`[portal] Post-click URL: ${portalPage.url()}`);

    // Fill email
    log('[portal] Filling email field...');
    let emailSelector = null;
    for (const selector of EMAIL_SELECTORS) {
      const el = await portalPage.$(selector);
      if (el) {
        emailSelector = selector;
        log(`[portal] Email field matched by: ${selector}`);
        await el.fill(email);
        break;
      }
    }
    if (!emailSelector) {
      throw new Error(
        `[portal] No email field found on ${portalPage.url()}. ` +
        `Tried: ${EMAIL_SELECTORS.join(', ')}`
      );
    }

    // Fill password
    log('[portal] Filling password field...');
    let passwordSelector = null;
    for (const selector of PASSWORD_SELECTORS) {
      const el = await portalPage.$(selector);
      if (el) {
        passwordSelector = selector;
        log(`[portal] Password field matched by: ${selector}`);
        await el.fill(password);
        break;
      }
    }
    if (!passwordSelector) {
      throw new Error(
        `[portal] No password field found on ${portalPage.url()}. ` +
        `Tried: ${PASSWORD_SELECTORS.join(', ')}`
      );
    }

    // Submit
    log('[portal] Submitting credentials...');
    let submitSelector = null;
    for (const selector of SUBMIT_SELECTORS) {
      const el = await portalPage.$(selector);
      if (el) {
        submitSelector = selector;
        log(`[portal] Submit button matched by: ${selector}`);
        await el.click();
        break;
      }
    }
    if (!submitSelector) {
      throw new Error(
        `[portal] No submit button found on ${portalPage.url()}. ` +
        `Tried: ${SUBMIT_SELECTORS.join(', ')}`
      );
    }

    // Wait for post-login settle
    log('[portal] Waiting 5s for post-login page settle...');
    await sleep(5000);
    log(`[portal] Post-login URL: ${portalPage.url()}`);

    // Fail fast on MFA
    log('[portal] Checking for MFA indicators...');
    for (const selector of MFA_SELECTORS) {
      const count = await portalPage.locator(selector).count();
      if (count > 0) {
        throw new Error(
          `[portal] MFA detected — matched selector "${selector}" at URL: ${portalPage.url()}. ` +
          'MFA handling is not implemented in this iteration. Use a developer portal account ' +
          'without MFA, or implement MFA support in a follow-up.'
        );
      }
    }
    log('[portal] No MFA indicators detected. Assuming login succeeded.');

    // ── Poll PDI instance ───────────────────────────────────────
    log(`[portal] Polling ${baseUrl}/login.do every 10s (up to 5 minutes) for login form...`);
    const startMs = Date.now();
    let attempt = 0;

    while (Date.now() - startMs < POLL_TIMEOUT_MS) {
      attempt++;
      const elapsedSec = Math.round((Date.now() - startMs) / 1000);
      log(`[portal] Poll attempt ${attempt} (${elapsedSec}s elapsed) — checking ${baseUrl}/login.do...`);

      let pollPage;
      try {
        pollPage = await pollContext.newPage();
        await pollPage.goto(`${baseUrl}/login.do`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        const loginForm = await pollPage.$('#user_name, input[name="user_name"]');
        if (loginForm) {
          log(`[portal] Login form is visible after ${elapsedSec}s — instance is awake!`);
          return true;
        }
        log(`[portal] Login form not yet visible. Current URL: ${pollPage.url()}`);
      } catch (pollErr) {
        log(`[portal] Poll attempt ${attempt} error: ${pollErr.message}`);
      } finally {
        if (pollPage) await pollPage.close().catch(() => {});
      }

      log('[portal] Waiting 10s before next poll...');
      await sleep(POLL_INTERVAL_MS);
    }

    throw new Error(
      `[portal] Timed out after 5 minutes waiting for ${baseUrl} to become reachable after portal login.`
    );
  } finally {
    log('[portal] Cleaning up portal and poll browser contexts...');
    await portalContext.close().catch(() => {});
    await pollContext.close().catch(() => {});
  }
}

module.exports = { wakeViaDevPortal };
