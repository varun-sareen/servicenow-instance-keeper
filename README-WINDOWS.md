# 🪟 ServiceNow Instance Keeper — Windows Setup Guide

This guide will walk you through setting up the ServiceNow Instance Keeper on your Windows PC. Every step is explained in detail — no prior experience needed.

---

## 📋 What You Need Before Starting

- [ ] A **GitHub account** (free) — [Sign up here](https://github.com/signup) if you don't have one
- [ ] A **ServiceNow Developer Instance** — [Get one here](https://developer.servicenow.com/dev.do)
- [ ] Your instance URL (looks like `https://dev12345.service-now.com`)
- [ ] Your instance username (usually `admin`)
- [ ] Your instance password
- [ ] A **Gmail account** (for email notifications)

---

## Step 1: Create a New Private Repository on GitHub

1. Go to [github.com/new](https://github.com/new)
2. Fill in:
   - **Repository name**: `servicenow-instance-keeper`
   - **Description**: `Keeps my ServiceNow dev instance alive`
   - **Visibility**: Select **Private** 🔒
3. **Do NOT** check "Add a README file" (we already have one)
4. Click **Create repository**
5. Keep this page open — you'll need it in Step 3

---

## Step 2: Download This Project

Download all the project files and save them in a folder called `servicenow-instance-keeper` on your PC.

Make sure the folder structure looks exactly like this:

```
servicenow-instance-keeper/
├── .github/
│   └── workflows/
│       └── keep-alive.yml
├── scripts/
│   └── keep-alive.js
├── .gitignore
├── package.json
└── README.md (+ README-MAC.md, README-WINDOWS.md)
```

> ⚠️ **Important**: The `.github/workflows/` nesting is critical. GitHub Actions will NOT work if `keep-alive.yml` is in the root folder.

---

## Step 3: Upload the Project to GitHub

### 3a. Install Git

Windows does not come with Git pre-installed. Download and install it:

1. Go to [git-scm.com/download/win](https://git-scm.com/download/win)
2. Download the installer and run it
3. Use **all the default options** during installation (just keep clicking Next)
4. After installation, **close and reopen PowerShell** if you had it open

To verify it worked, open PowerShell and type:

```powershell
git --version
```

You should see something like `git version 2.47.0.windows.1`.

### 3b. Install GitHub CLI

Open **PowerShell** (press the `Win` key, type "PowerShell", hit Enter).

```powershell
winget install --id GitHub.cli
```

> If `winget` is not available or you get an error, download GitHub CLI manually from [cli.github.com](https://cli.github.com) — click the "Download for Windows" button.

After installing, **close and reopen PowerShell** so it recognizes the new commands.

To verify it worked:

```powershell
gh --version
```

### 3c. Log in to GitHub

```powershell
gh auth login
```

When it asks you questions, pick:
- **Where do you use GitHub?** → `GitHub.com`
- **Preferred protocol?** → `HTTPS`
- **Authenticate?** → `Login with a web browser`

It will open your browser — click Authorize, and you're logged in.

### 3d. Navigate to your project folder

The easiest way:
1. Open **File Explorer** and navigate to the `servicenow-instance-keeper` folder
2. Click in the **address bar** at the top of File Explorer (where it shows the folder path)
3. The path will get highlighted and become selectable — **copy it** (Ctrl+C)
4. In PowerShell, type `cd` followed by the path in quotes:

```powershell
cd "C:\Users\YourName\Documents\servicenow-instance-keeper"
```

> 💡 **Tip**: If the path has spaces in it (like `My Documents`), make sure to wrap the whole path in double quotes.

> 💡 **Alternative**: In File Explorer, you can also right-click inside the folder while holding Shift, then select "Open PowerShell window here" — this opens PowerShell already in the right folder.

### 3e. Push the code to GitHub

Run these commands **one at a time** (press Enter after each):

```powershell
git init
```

```powershell
git add .
```

```powershell
git commit -m "Initial setup: ServiceNow Instance Keeper"
```

```powershell
git remote add origin https://github.com/YOUR_USERNAME/servicenow-instance-keeper.git
```

> ⚠️ Replace `YOUR_USERNAME` with your actual GitHub username.

```powershell
git branch -M main
```

```powershell
git push -u origin main
```

After this, refresh your GitHub repo page — you should see all the files and folders there!

> 💡 **Tip**: If git asks you to configure your identity, run these two commands first (replace with your details):
> ```powershell
> git config --global user.email "your-email@example.com"
> ```
> ```powershell
> git config --global user.name "Your Name"
> ```

---

## Step 4: Create a Gmail App Password (for email notifications)

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Make sure **2-Step Verification** is turned **ON** (you can't create app passwords without it)
3. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Type a name like `servicenow-keeper` and click **Create**
5. Google will show you a **16-character password** — **copy it immediately** (you won't see it again)

---

## Step 5: Add Your Secrets (Credentials)

This is where you securely store your login info and email settings. GitHub encrypts these — **nobody can see them**, not even you after saving.

1. Go to your repo on GitHub: `https://github.com/YOUR_USERNAME/servicenow-instance-keeper`
2. Click **Settings** (tab at the top of the repo)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** and add these **one at a time**:

**ServiceNow credentials (5 secrets):**

| Name | Value | Example |
|------|-------|---------|
| `SERVICENOW_INSTANCE_URL` | Your full instance URL | `https://dev12345.service-now.com` |
| `SERVICENOW_USERNAME` | Your instance username | `admin` |
| `SERVICENOW_PASSWORD` | Your instance password | `your-password-here` |
| `SERVICENOW_DEV_EMAIL` | Your developer.servicenow.com login email (different from your PDI admin account) | `you@example.com` |
| `SERVICENOW_DEV_PASSWORD` | Your developer.servicenow.com login password (different from your PDI admin account) | `your-portal-password` |

**Email notification settings (3 secrets):**

| Name | Value | Example |
|------|-------|---------|
| `EMAIL_USERNAME` | Your Gmail address | `yourname@gmail.com` |
| `EMAIL_APP_PASSWORD` | The 16-char password from Step 4 | `abcdefghijklmnop` |
| `EMAIL_TO` | Where to receive notifications | `yourname@gmail.com` |

> You should have **8 secrets total** when done.

> ⚠️ **Important**: For `EMAIL_APP_PASSWORD`, paste the 16-character code **without any spaces**. So `abcd efgh ijkl mnop` becomes `abcdefghijklmnop`.

For each one:
- Click **New repository secret**
- Type the **Name** exactly as shown (all caps, underscores)
- Paste the **Value**
- Click **Add secret**

---

## Step 6: Test It! (Run Manually)

Let's make sure everything works before relying on the daily schedule:

1. Go to your repo on GitHub
2. Click the **Actions** tab (at the top)
3. You'll see **"Keep ServiceNow Instance Alive"** in the left sidebar — click it
4. Click the **"Run workflow"** button (dropdown on the right)
5. Click the green **"Run workflow"** button

Now watch it run! Click on the running workflow to see live logs. You should see messages like:

```
🚀 Starting ServiceNow Instance Keeper...
📍 Target instance: https://dev12345.service-now.com
✅ Instance appears to be running!
✅ Login successful!
✅ Update Sets page loaded successfully!
🎉 SUCCESS! Instance is alive and kicking!
```

You should also receive an email notification shortly after! (Check your spam folder if you don't see it.)

---

## Step 7: You're Done! 🎉

The automation will now run **every day at 13:00 CET (Berlin time)** automatically. You don't need to do anything else!

> Note: GitHub cron runs in UTC. The current schedule is `0 12 * * *` (12:00 UTC = 13:00 CET). When Berlin switches to summer time (CEST), the run will be at 14:00 local time. Adjust the cron if needed.

To change the schedule time, edit `.github/workflows/keep-alive.yml` and update the cron line. Some handy presets:

| Time (UTC) | Time (CET/Berlin) | Time (IST) | Cron |
|------------|-------------------|------------|------|
| 3:00 AM | 4:00 AM | 8:30 AM | `0 3 * * *` |
| 7:00 AM | 8:00 AM | 12:30 PM | `0 7 * * *` |
| 12:00 PM | 13:00 PM | 5:30 PM | `0 12 * * *` |
| 14:00 PM | 15:00 PM | 7:30 PM | `0 14 * * *` |

---

## 🔧 Optional: Test Locally on Your PC

If you want to see the automation run on your own machine with a visible browser:

First, make sure you have **Node.js** installed. If not, download it from [nodejs.org](https://nodejs.org) — get the **LTS** version and install with default options.

Then open PowerShell, navigate to the project folder, and run:

```powershell
npm install
```

```powershell
npx playwright install chromium
```

```powershell
$env:SERVICENOW_INSTANCE_URL="https://dev12345.service-now.com"
$env:SERVICENOW_USERNAME="admin"
$env:SERVICENOW_PASSWORD="your-password"
```

```powershell
npm run test-run
```

> Note: The `$env:` syntax is how you set temporary environment variables in PowerShell. These disappear when you close the window — your credentials are not stored anywhere.

---

## 🤝 Sharing With a Friend

Want to share this with a colleague?

1. **If your repo is private**: Go to Settings → Collaborators → Add people → Type their GitHub username
2. They should then **fork** the repo to their own account
3. They follow this guide from **Step 4 onwards** (they add their own secrets with their own credentials)
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
| No email received | Check spam folder. Verify `EMAIL_APP_PASSWORD` is the 16-char app password **without spaces**, not your regular Gmail password |
| `winget` not recognized | Download GitHub CLI manually from [cli.github.com](https://cli.github.com) |
| `git` not recognized | Install Git from [git-scm.com/download/win](https://git-scm.com/download/win), then **restart PowerShell** |
| `npm` not recognized | Install Node.js from [nodejs.org](https://nodejs.org), then **restart PowerShell** |
| `403` error on git push | Run `gh auth login` first to authenticate with GitHub |
| `remote origin already exists` | That's fine — just run `git push` |
| Git asks for identity | Run `git config --global user.email "you@example.com"` and `git config --global user.name "Your Name"` |
| Node.js 20 deprecation warning | Harmless — comes from third-party GitHub Actions, does not affect functionality |
