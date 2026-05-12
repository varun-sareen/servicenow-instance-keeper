# Changelog

## [Unreleased]

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
