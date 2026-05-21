# Changelog

## [Unreleased]

---

## [1.1.1] - 2026-05-21

### Fixed
- `keep-alive.js` no longer uses `waitUntil:'networkidle'` for post-login navigation or the homepage activity step. The previous behavior caused false-failure reports on runs that had actually succeeded at registering instance activity. Affected 3 of 4 daily runs between May 16–21.

---

## [1.1.0] - 2026-05-12

### Changed
- **Portal sign-in flow rewritten** based on confirmed live investigation findings:
  - Sign In button is inside a Shadow DOM (`<sn-cx-navigation>`); now located with
    `page.getByRole('button', { name: 'Sign In', exact: true })` which pierces shadow
    roots automatically instead of unreliable CSS selector fallbacks.
  - TrustArc cookie banner is dismissed before any interaction (two clicks:
    "Required Only" then "Close"), both best-effort so the run continues if
    the banner is absent.
  - Auth flow is identifier-first (two pages): email submitted via `#username` /
    `#identify-submit`, then password field awaited and filled on the resulting page
    before a final submit. Previous implementation assumed a single-page form.
- GitHub Actions workflow now caches Playwright browser binaries
  (`~/.cache/ms-playwright`) keyed by OS and Playwright version, and uses
  `actions/cache@v4` on the `actions/setup-node@v4` step for npm packages.
  On cache hits only OS-level apt dependencies are reinstalled
  (`install-deps chromium`), skipping the browser binary download and saving
  ~1.5–2 minutes of setup time per run.

### Fixed
- Portal navigation now uses `waitUntil: 'domcontentloaded'` instead of `'networkidle'`.
  The developer portal has continuous background network activity that prevented
  `networkidle` from ever firing, causing a consistent 60 s timeout on the first live run.
  The selector-based readiness checks that follow the `goto` calls are the real signal.

### Added
- **Developer portal fallback wake-up** (`scripts/wake-via-portal.js`): when a hibernating
  instance no longer renders a wake-up button, the keeper now logs into
  `developer.servicenow.com` as a side-effect trigger for server-side wake-up, then polls
  the PDI URL every 10 s (up to 5 minutes) until the login form becomes visible.
- **MFA fast-fail**: if MFA is detected during portal login the script throws immediately
  with a clear error rather than hanging. MFA handling will be designed in a follow-up
  iteration based on observed runtime behaviour.
- Two new required GitHub Secrets (add these manually in the repo Settings before the
  next workflow run):
  - `SERVICENOW_DEV_EMAIL` — your `developer.servicenow.com` login email
  - `SERVICENOW_DEV_PASSWORD` — your `developer.servicenow.com` login password
  - **Note:** these are separate accounts from the PDI admin credentials
    (`SERVICENOW_USERNAME` / `SERVICENOW_PASSWORD`).

> This release assumes the developer portal account does **not** have MFA enabled
> (or that MFA is not triggered from the GitHub Actions runner IP).

---

## [1.0.0]

Initial release — daily Playwright automation that logs into a ServiceNow developer
instance, wakes it from hibernation via the in-page button, and visits key pages to
prevent the 10-day inactivity reclaim. Includes GitHub Actions workflow and daily email
notification via Gmail SMTP.
