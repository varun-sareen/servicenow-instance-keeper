// =============================================================
// ServiceNow Instance Keeper - Keep your ServiceNow dev instance alive
// =============================================================
// This script logs into your ServiceNow developer instance,
// wakes it up if it's hibernating, and visits key pages
// to prevent the 10-day inactivity reclaim.
// =============================================================

const { chromium } = require("playwright");

// ── Configuration (pulled from environment variables) ─────────
const config = {
  instanceUrl: process.env.SERVICENOW_INSTANCE_URL, // e.g. https://dev12345.service-now.com
  username: process.env.SERVICENOW_USERNAME, // e.g. admin
  password: process.env.SERVICENOW_PASSWORD, // your instance password
  headless: process.env.HEADLESS !== "false", // set HEADLESS=false to watch it run locally
};

// ── Helper: wait a bit ───────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Helper: log with timestamp ───────────────────────────────
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// ── Main automation ──────────────────────────────────────────
async function keepInstanceAlive() {
  log("🚀 Starting ServiceNow Instance Keeper...");

  // --- Validate config ---
  if (!config.instanceUrl || !config.username || !config.password) {
    console.error("❌ Missing required environment variables!");
    console.error("   Make sure these are set:");
    console.error("   - SERVICENOW_INSTANCE_URL  (e.g. https://dev12345.service-now.com)");
    console.error("   - SERVICENOW_USERNAME       (e.g. admin)");
    console.error("   - SERVICENOW_PASSWORD       (your instance password)");
    process.exit(1);
  }

  // --- Clean up instance URL (remove trailing slash) ---
  const baseUrl = config.instanceUrl.replace(/\/+$/, "");
  log(`📍 Target instance: ${baseUrl}`);

  // --- Launch browser ---
  const browser = await chromium.launch({ headless: config.headless });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    // ── STEP 1: Navigate to instance ──────────────────────
    log("🌐 Step 1: Opening instance URL...");
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60000 });
    await sleep(3000);

    // ── STEP 2: Check if instance is hibernating ──────────
    const pageContent = await page.content();
    const pageUrl = page.url();

    if (
      pageContent.includes("hibernate") ||
      pageContent.includes("wakeup") ||
      pageContent.includes("Wake up") ||
      pageContent.includes("Your instance is") ||
      pageUrl.includes("hibernate")
    ) {
      log("😴 Instance is hibernating! Attempting to wake it up...");

      // Look for wake-up button (ServiceNow uses various selectors)
      const wakeUpButton = await page.$(
        'button:has-text("Wake up"), input[value*="Wake"], a:has-text("Wake"), button:has-text("Start Building")'
      );

      if (wakeUpButton) {
        await wakeUpButton.click();
        log("⏳ Wake-up requested. Waiting for instance to start (this can take 2-5 minutes)...");

        // Wait for instance to be ready (check every 30 seconds, up to 10 minutes)
        for (let attempt = 1; attempt <= 20; attempt++) {
          await sleep(30000); // wait 30 seconds
          log(`   ⏳ Checking if ready... (attempt ${attempt}/20)`);

          try {
            await page.goto(`${baseUrl}/login.do`, {
              waitUntil: "networkidle",
              timeout: 30000,
            });
            const newContent = await page.content();
            if (
              newContent.includes("User name") ||
              newContent.includes("username") ||
              newContent.includes("login")
            ) {
              log("✅ Instance is awake and ready!");
              break;
            }
          } catch (e) {
            // Instance not ready yet, continue waiting
          }

          if (attempt === 20) {
            throw new Error("Instance did not wake up within 10 minutes");
          }
        }
      } else {
        log("⚠️  Could not find wake-up button. Instance may need manual intervention.");
        log("   Going to try logging in anyway...");
      }
    } else {
      log("✅ Instance appears to be running!");
    }

    // ── STEP 3: Login to the instance ─────────────────────
    log("🔐 Step 2: Logging in...");
    await page.goto(`${baseUrl}/login.do`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await sleep(2000);

    // Check if already logged in
    if (page.url().includes("nav_to.do") || page.url().includes("navpage.do")) {
      log("✅ Already logged in (session still active)!");
    } else {
      // Fill in credentials
      await page.fill('#user_name, input[name="user_name"]', config.username);
      await sleep(500);
      await page.fill('#user_password, input[name="user_password"]', config.password);
      await sleep(500);

      // Click login button
      await page.click('#sysverb_login, button[name="login"]');
      log("⏳ Submitting login...");
      //await page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 });
      const iframeElement = await page.waitForSelector('#gsft_main', { timeout: 30000 });
      // Switch into the iframe
      const iframe = await iframeElement.contentFrame();
      // Now wait for .pdi-homepage inside the iframe
      await iframe.waitForSelector('.pdi-homepage', { timeout: 30000 });
      await sleep(3000);

      // Verify login success
      const afterLoginUrl = page.url();
      if (afterLoginUrl.includes("login.do") || afterLoginUrl.includes("login_redirect")) {
        throw new Error("Login failed! Check your credentials.");
      }
      log("✅ Login successful!");
    }

    // ── STEP 4: Visit Update Sets page ────────────────────
    log("📋 Step 3: Opening Update Sets...");
    await page.goto(`${baseUrl}/sys_update_set_list.do`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await sleep(3000);

    // Verify page loaded
    const updateSetsContent = await page.content();
    if (
      updateSetsContent.includes("update_set") ||
      updateSetsContent.includes("Update Set") ||
      updateSetsContent.includes("Default")
    ) {
      log("✅ Update Sets page loaded successfully!");
    } else {
      log("⚠️  Update Sets page may not have loaded correctly, but the instance was accessed.");
    }

    // ── STEP 5: Quick visit to homepage to register activity
    log("🏠 Step 4: Visiting homepage to register extra activity...");
    await page.goto(`${baseUrl}/nav_to.do?uri=home.do`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await sleep(2000);

    // ── Done! ─────────────────────────────────────────────
    log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    log("🎉 SUCCESS! Instance is alive and kicking!");
    log(`   Instance: ${baseUrl}`);
    log(`   Pages visited: login, update sets, homepage`);
    log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    log(`❌ ERROR: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await browser.close();
    log("🔒 Browser closed. See you next run!");
  }
}

// ── Run it! ──────────────────────────────────────────────────
keepInstanceAlive();
