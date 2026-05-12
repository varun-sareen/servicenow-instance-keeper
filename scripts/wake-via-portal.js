'use strict';

// Wakes a hibernating PDI by logging into developer.servicenow.com.
// Portal auth triggers a server-side wake of the associated instance.
//
// Key implementation notes (confirmed by live investigation):
//
// Shadow DOM: the Sign In button lives inside the open shadow root of
// <sn-cx-navigation id="layout-authenticated">. page.getByRole() pierces
// shadow roots automatically, making it more reliable than CSS selectors.
//
// Cookie banner: TrustArc injects a banner on every cold visit (also in
// shadow DOM). Two clicks are required — "Required Only" then "Close" —
// before any other interaction is possible. Both are best-effort; the
// banner may not appear on all subsequent visits.
//
// Identifier-first auth: clicking Sign In redirects to signon.servicenow.com.
// The login is a two-step flow — email on page 1, password on page 2.
// Page 2 selectors are best-effort (investigation stopped at the email step)
// and may need adjustment after the first successful run reaches that page.
//
// MFA assumption: if MFA appears on page 2 we fail fast with a clear error.

const PORTAL_URL = 'https://developer.servicenow.com';
const POLL_INTERVAL_MS = 10_000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    // ── Portal navigation ───────────────────────────────────────
    const portalPage = await portalContext.newPage();

    log(`[portal] Navigating to ${PORTAL_URL}...`);
    await portalPage.goto(PORTAL_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    log(`[portal] Landed at: ${portalPage.url()}`);

    // Portal redirects to /dev.do; wait non-fatally in case the redirect is slow
    await portalPage.waitForURL(/\/dev\.do/, { timeout: 15_000 }).catch(() => {
      log('[portal] No /dev.do redirect observed — continuing from current URL');
    });
    log(`[portal] URL after redirect wait: ${portalPage.url()}`);

    // ── Cookie banner dismissal (TrustArc, shadow DOM, best-effort) ──
    log('[portal] Checking for TrustArc cookie banner...');
    await portalPage.getByText('Required Only', { exact: true })
      .click({ timeout: 5000 })
      .catch(() => log('[portal] No cookie banner found, continuing'));
    await portalPage.getByRole('button', { name: 'Close' })
      .click({ timeout: 3000 })
      .catch(() => {});
    log('[portal] Cookie banner step complete.');

    // ── Sign In (shadow-DOM-aware via getByRole) ────────────────
    log('[portal] Clicking Sign In button...');
    await portalPage.getByRole('button', { name: 'Sign In', exact: true }).click();
    log('[portal] Sign In clicked. Waiting for signon.servicenow.com redirect...');

    await portalPage.waitForURL(/signon\.servicenow\.com.*pageId=login/, { timeout: 30_000 });
    log(`[portal] Redirected to signon: ${portalPage.url()}`);

    // ── Page 1: identifier (email) ──────────────────────────────
    log('[portal] Filling email on identifier page...');
    await portalPage.fill('#username', email);
    log('[portal] Clicking identify-submit...');
    await portalPage.click('#identify-submit');

    // ── Page 2: password ────────────────────────────────────────
    log('[portal] Waiting for password field...');
    try {
      await portalPage.waitForSelector('input[type="password"]', { timeout: 20_000 });
    } catch (err) {
      const currentUrl = portalPage.url();
      const bodyText = await portalPage.textContent('body').catch(() => '(could not read body)');
      throw new Error(
        `[portal] Password field did not appear. URL: ${currentUrl}\n` +
        `Body (first 1000 chars): ${bodyText.slice(0, 1000)}`
      );
    }
    log(`[portal] Password field visible. URL: ${portalPage.url()}`);

    log('[portal] Filling password...');
    await portalPage.fill('input[type="password"]', password);

    log('[portal] Submitting password...');
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign In")',
      'button:has-text("Submit")',
      'button:has-text("Continue")',
      'button:has-text("Log In")',
    ];
    let submitClicked = false;
    for (const selector of submitSelectors) {
      const el = await portalPage.$(selector);
      if (el) {
        log(`[portal] Submit button matched by: ${selector}`);
        await el.click();
        submitClicked = true;
        break;
      }
    }
    if (!submitClicked) {
      throw new Error(
        `[portal] No submit button found after password entry. URL: ${portalPage.url()}. ` +
        `Tried: ${submitSelectors.join(', ')}`
      );
    }

    // ── Post-login settle + MFA check ───────────────────────────
    log('[portal] Waiting 5s for post-login page settle...');
    await sleep(5000);
    log(`[portal] Post-login URL: ${portalPage.url()}`);

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
