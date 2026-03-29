# Tangle-me Security Package (Phase 2)
## From Architecture Audit — March 2026

### What's Included

```
api/middleware/
  auth.php          — Unified authentication + input validation + API response helper
  csrf.php          — CSRF token generation & validation
  rate-limiter.php  — Brute-force protection for auth endpoints

csrf-helper.js      — JavaScript helper for CSRF tokens in fetch() calls
schema-changelog.sql — SQL to create rate_limits + api_log tables
htaccess-security-additions.txt — .htaccess lines to add
INTEGRATION-GUIDE.php — How to wire up each existing endpoint
.gitignore           — Proper gitignore for the project
```

### Installation Steps

#### 1. Create the database tables
Open phpMyAdmin → select `u143213086_tangleme` → SQL tab → paste and run `schema-changelog.sql`

#### 2. Upload middleware files
Upload the `api/middleware/` folder to your server so your file structure looks like:
```
tangle-me.com/
  api/
    middleware/
      auth.php
      csrf.php
      rate-limiter.php
    login.php        ← existing
    register.php     ← existing
    ...
```

#### 3. Update .htaccess
Add the lines from `htaccess-security-additions.txt` to your existing `.htaccess` file.

#### 4. Add CSRF to JavaScript
Add the code from `csrf-helper.js` to the top of your `script.js`, OR include it as a separate `<script>` tag in `index.html`.

#### 5. Update endpoints one by one
Follow `INTEGRATION-GUIDE.php` to add middleware to each endpoint. Start with the critical ones:
1. `login.php` (rate limiting)
2. `register.php` (rate limiting)
3. `forgot-password.php` (rate limiting)
4. `post-ad.php` (auth + CSRF)
5. `send-message.php` (auth + CSRF + rate limit)

### Audit Items Addressed

- [x] `php_value display_errors 0` (.htaccess)
- [x] Unified auth.php middleware
- [x] CSRF token system
- [x] Rate limiting for auth endpoints
- [x] Input validation helpers
- [x] API request logging
- [x] Standardized JSON response format
- [x] Block .git directory access
- [x] Security headers (X-Frame-Options, etc.)
- [x] Schema changelog started
- [x] .gitignore created
