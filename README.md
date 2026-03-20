# ❄️ SNOW Instance Keeper

![GitHub stars](https://img.shields.io/github/stars/varun-sareen/snow-instance-keeper?style=flat-square&color=38bdf8)
![GitHub forks](https://img.shields.io/github/forks/varun-sareen/snow-instance-keeper?style=flat-square&color=2dd4bf)
![GitHub license](https://img.shields.io/github/license/varun-sareen/snow-instance-keeper?style=flat-square)

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

## 🚀 Get Started

Pick the guide for your operating system:

### [🍎 Mac Setup Guide → README-MAC.md](README-MAC.md)

### [🪟 Windows Setup Guide → README-WINDOWS.md](README-WINDOWS.md)

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
├── README.md                  ← You are here!
├── README-MAC.md              ← Setup guide for Mac users
└── README-WINDOWS.md          ← Setup guide for Windows users
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
