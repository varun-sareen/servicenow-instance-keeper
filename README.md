# ❄️ SNOW Instance Keeper

**Automatically keeps your ServiceNow Developer Instance alive so it never gets reclaimed.**

ServiceNow reclaims inactive developer instances after **10 days of no activity**. This tool logs into your instance every day via GitHub Actions (completely free), visits key pages, and keeps it active — all without touching your laptop or phone.

You also get a **daily email notification** telling you whether the job succeeded or failed.

---

## 🎯 What It Does

Every day, this automation will:

1. Open your ServiceNow developer instance
2. Wake it up if it's hibernating (instances sleep after a few hours of inactivity)
3. Log in with your credentials
4. Visit the **Update Sets** page
5. Visit the **Homepage** to register activity
6. Send you an **email notification** with the result (success or failure)

All of this runs on GitHub's servers — **not your computer**. You set it up once and forget about it.

---

## 📋 What You Need Before Starting

- [ ] A **GitHub account** (free) — [Sign up here](https://github.com/signup) if you don't have one
- [ ] A **ServiceNow Developer Instance** — [Get one here](https://developer.servicenow.com/dev.do)
- [ ] Your instance URL (looks like `https://dev12345.service-now.com`)
- [ ] Your instance username (usually `admin`)
- [ ] Your instance password
- [ ] A **Gmail account** (for email notifications)

---

## 🚀 Setup Guide (Step by Step)

### Step 1: Create a New Private Repository on GitHub

1. Go to [github.com/new](https://github.com/new)
2. Fill in:
   - **Repository name**: `snow-instance-keeper`
   - **Description**: `Keeps my ServiceNow dev instance alive`
   - **Visibility**: Select **Private** 🔒
3. **Do NOT** check "Add a README file" (we already have one)
4. Click **Create repository**
5. Keep this page open — you'll need it in Step 3

### Step 2: Download This Project

Download all the project files and save them in a folder called `snow-instance-keeper` on your computer.

Make sure the folder structure looks exactly like this:

```
snow-instance-keeper/
├── .github/
│   └── workflows/
│       └── keep-alive.yml
├── scripts/
│   └── keep-alive.js
├── .gitignore
├── package.json
└── README.md
```

> ⚠️ **Important**: The `.github/workflows/` nesting is critical. GitHub Actions will NOT work if `keep-alive.yml` is in the root folder.

### Step 3: Upload the Project to GitHub

Open **Terminal** on your Mac (press `Cmd + Space`, type "Terminal", hit Enter).

First, install GitHub CLI and log in (one-time setup):

```bash
brew install gh
```

```bash
gh auth login
```

When it asks you questions, pick:
- **Where do you use GitHub?** → `GitHub.com`
- **Preferred protocol?** → `HTTPS`
- **Authenticate?** → `Login with a web browser`

It will open your browser — click Authorize, and you're logged in.

Now navigate to your project folder. The easiest way:
1. Type `cd ` in Terminal (with a space after it)
2. **Drag and drop** the folder from Finder into the Terminal window
3. Press Enter

Then run these commands **one at a time** (press Enter after each):

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Initial setup: SNOW Instance Keeper"
```

```bash
git remote add origin https://github.com/YOUR_USERNAME/snow-instance-keeper.git
```

> ⚠️ Replace `YOUR_USERNAME` with your actual GitHub username in the command above.

```bash
git branch -M main
```

```bash
git push -u origin main
```

After this, refresh your GitHub repo page — you should see all the files and folders there!

> 💡 **Tip**: Run commands one at a time. Do NOT paste multiple lines together — the comment lines (starting with `#`) will cause errors in Terminal.

### Step 4: Create a Gmail App Password (for email notifications)

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Make sure **2-Step Verification** is turned **ON** (you can't create app passwords without it)
3. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Type a name like `snow-keeper` and click **Create**
5. Google will show you a **16-character password** — **copy it immediately** (you won't see it again)

### Step 5: Add Your Secrets (Credentials)

This is where you securely store your login info and email settings. GitHub encrypts these — **nobody can see them**, not even you after saving.

1. Go to your repo on GitHub: `https://github.com/YOUR_USERNAME/snow-instance-keeper`
2. Click **Settings** (tab at the top of the repo)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** and add these **one at a time**:

**ServiceNow credentials (3 secrets):**

| Name | Value | Example |
|------|-------|---------|
| `SNOW_INSTANCE_URL` | Your full instance URL | `https://dev12345.service-now.com` |
| `SNOW_USERNAME` | Your instance username | `admin` |
| `SNOW_PASSWORD` | Your instance password | `your-password-here` |

**Email notification settings (3 secrets):**

| Name | Value | Example |
|------|-------|---------|
| `EMAIL_USERNAME` | Your Gmail address | `yourname@gmail.com` |
| `EMAIL_APP_PASSWORD` | The 16-char password from Step 4 | `abcd efgh ijkl mnop` |
| `EMAIL_TO` | Where to receive notifications | `yourname@gmail.com` |

> You should have **6 secrets total** when done.

For each one:
- Click **New repository secret**
- Type the **Name** exactly as shown (all caps, underscores)
- Paste the **Value**
- Click **Add secret**

### Step 6: Test It! (Run Manually)

Let's make sure everything works before relying on the daily schedule:

1. Go to your repo on GitHub
2. Click the **Actions** tab (at the top)
3. You'll see **"Keep SNOW Instance Alive"** in the left sidebar — click it
4. Click the **"Run workflow"** button (dropdown on the right)
5. Click the green **"Run workflow"** button

Now watch it run! Click on the running workflow to see live logs. You should see messages like:

```
🚀 Starting SNOW Instance Keeper...
📍 Target instance: https://dev12345.service-now.com
✅ Instance appears to be running!
✅ Login successful!
✅ Update Sets page loaded successfully!
🎉 SUCCESS! Instance is alive and kicking!
```

You should also receive an email notification shortly after!

### Step 7: You're Done! 🎉

The automation will now run **every day at 7:00 AM UTC** automatically. You don't need to do anything else!

To change the schedule time, edit `.github/workflows/keep-alive.yml` and update the cron line. Some handy presets:

| Time (UTC) | Time (IST) | Time (CET/Berlin) | Cron |
|------------|------------|-------------------|------|
| 3:00 AM | 8:30 AM | 4:00 AM | `0 3 * * *` |
| 7:00 AM | 12:30 PM | 8:00 AM | `0 7 * * *` |
| 14:00 PM | 7:30 PM | 3:00 PM | `0 14 * * *` |

---

## 🔧 Optional: Test Locally on Your Mac

If you want to see the automation run on your own machine (with a visible browser!):

```bash
# 1. Install dependencies
npm install

# 2. Install the browser
npx playwright install chromium

# 3. Set your credentials (temporary, just for this terminal session)
export SNOW_INSTANCE_URL="https://dev12345.service-now.com"
export SNOW_USERNAME="admin"
export SNOW_PASSWORD="your-password"

# 4. Run with visible browser (so you can watch!)
npm run test-run
```

---

## 🤝 Sharing With a Friend

Want to share this with a colleague? Here's what to tell them:

1. **If your repo is private**: Go to Settings → Collaborators → Add people → Type their GitHub username
2. They should then **fork** the repo to their own account
3. They follow this README from **Step 4 onwards** (they add their own secrets with their own credentials)
4. That's it! Their fork will run independently with their own schedule

Alternatively, you can make the repo **public** temporarily for them to fork it, then make it private again.

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| Workflow doesn't run | Go to Actions tab → make sure workflows are enabled |
| Login fails | Double-check your secrets — the Name must match exactly |
| Instance won't wake up | Try running manually a second time; sometimes first wake-up takes long |
| "No credentials" error | Make sure all 6 secrets are added (check for typos in names) |
| No email received | Check spam folder. Verify `EMAIL_APP_PASSWORD` is the 16-char Google app password, not your Gmail password |
| `zsh: command not found: #` | You pasted multiple lines including comments. Run commands one at a time |
| `403` error on git push | Run `gh auth login` first to authenticate |
| `remote origin already exists` | That's fine — just run `git push` |

---

## 📁 Project Structure

```
snow-instance-keeper/
├── .github/
│   └── workflows/
│       └── keep-alive.yml    ← GitHub Actions schedule & workflow + email notification
├── scripts/
│   └── keep-alive.js         ← The actual automation script
├── .gitignore                 ← Keeps sensitive files out of git
├── package.json               ← Project dependencies
└── README.md                  ← You are here!
```

---

## 💡 Want to Add More Pages?

Open `scripts/keep-alive.js` and look for "Step 4". Copy that pattern to add more pages:

```javascript
// Example: Also visit Incident list
log("📋 Opening Incidents...");
await page.goto(`${baseUrl}/incident_list.do`, {
  waitUntil: "networkidle",
  timeout: 30000,
});
await sleep(3000);
```

---

## 💰 Cost

**Completely free.** GitHub Actions gives you 2,000 minutes/month on the free tier. This workflow uses about 5-10 minutes per run, so roughly 150-300 minutes/month — well within the free limit.

---

**Built with ❤️ to save ServiceNow developers from losing their instances.**
