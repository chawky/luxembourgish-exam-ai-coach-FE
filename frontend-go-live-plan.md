# Frontend Go-Live Plan

Repository: `chawky/luxembourgish-exam-ai-coach-FE`  
Branch reviewed: `master`  
Purpose: Remaining frontend work required before a public production launch.

## Priority 0 — Critical Fix Before Launch

### 1. Fix Profile Updates for Normal Users

Status: Broken in current FE

Backend contract:

- `PUT /api/users/me` exists for authenticated users.
- `PUT /api/users/{id}` is `ADMIN`-only.

Current FE issue:

- `AuthService.updateProfile()` still calls `PUT /api/users/{userId}`.

Required:

- Change `AuthService.updateProfile()` to call `PUT /api/users/me`.
- Remove the need to choose the current user's ID for self-profile updates.
- Keep the `ADMIN` by-ID API separate if an admin screen needs it.
- Update generated API schema if necessary.
- Add or update tests for normal `USER` profile editing.
- Test profile update on Railway with a regular `USER` account.

Acceptance:

- A normal `USER` can update only their own profile.
- The browser never chooses another user ID for the self-update operation.
- `ADMIN`-only by-ID operations remain separate.

## Priority 1 — Required Production Functionality

### 2. Complete Deployed E2E Testing

Status: Not complete

The final test must use the Railway-hosted frontend and real backend, not only mocks.

Test:

- Registration.
- Address/location lookup.
- OTP email delivery.
- OTP verification.
- Login.
- Refresh while logged in.
- Logout.
- Profile update.
- Dashboard.
- All exercise types.
- Progress updates.
- `BASIC` limits and restrictions.
- `PREMIUM` behavior.
- Stripe TEST checkout.
- Return from Stripe success and cancel URLs.
- Subscription cancellation.
- Admin pages and authorization.
- Disabled-user behavior.

Use several personas:

- New `BASIC` user.
- Existing `BASIC` user.
- `PREMIUM` user.
- `ADMIN` user.
- Disabled user.

### 3. Custom Production Domain

Status: Pending

Planned domain:

- `https://letztalklux.com`

Required:

- Buy the domain.
- Attach it to the FE Railway service on port `80`.
- Wait for DNS and TLS/HTTPS to become active.
- Verify deep routes work directly, for example `/app/dashboard`.
- Verify page refresh on Angular routes still falls back to `index.html`.
- Update any frontend absolute URLs or Stripe return URLs if they are domain-specific.
- Coordinate BE CORS update to allow the final origin.

### 4. Resend/Domain-Related UI Validation

Status: Backend integration exists; frontend flow must be tested

Required:

- Verify registration directs users to the OTP verification flow correctly.
- Verify resend states and cooldowns are understandable.
- Display clean messages for expired, wrong, and max-attempt OTP cases.
- Verify production email flow after Resend sender domain is enabled.

### 5. Stripe Production Readiness

Status: Keep test mode until final launch

Required:

- Complete Stripe TEST checkout through the deployed FE.
- Confirm success/cancel navigation is correct.
- Confirm user subscription UI refreshes after webhook processing.
- Confirm `BASIC` to `PREMIUM` state is reflected after refresh/re-login.
- Test cancel subscription UI.
- Verify no test-specific URLs or messaging remain before launch.
- Switch UI to live production only after BE Stripe LIVE configuration is ready.

## Priority 2 — Deployment and Reliability Checks

### 6. Verify Nginx Dynamic Backend DNS in a Real Redeploy

Status: Implementation present in `default.conf.template`; final real-world verification needed

Current FE Nginx uses a runtime resolver and variable-based backend target so Railway can re-resolve the backend after a private-IP change.

Required test:

- Start with FE working.
- Redeploy BE only.
- Do not redeploy FE.
- Wait at least 10–20 seconds.
- Call several `/api/...` endpoints from the FE.
- Confirm there are no stale-IP `502` or `504` errors.

Acceptance:

- Backend redeploys do not require frontend redeploys.

### 7. Mobile/Responsive Test

Status: Not verified

Test on at least:

- Real mobile browser.
- Small Android viewport.
- Small iPhone viewport.
- Tablet width.
- Desktop.

Pay special attention to:

- Signup form.
- OTP form.
- Navigation.
- Dashboard.
- Exercise pages.
- Audio recording controls.
- Stripe/upgrade screens.
- Profile forms.

### 8. Browser Compatibility and Production UX

Status: Needs final pass

Required:

- Test Chrome/Edge.
- Test Firefox.
- Test Safari if available.
- Verify loading states for slow AI responses.
- Verify friendly handling of `401`, `403`, `429`, `500`, `502`, `503`, and `504`.
- Ensure no raw HTML/Nginx error body is shown to the user.
- Ensure no console errors during normal navigation.
- Ensure no broken assets after hard refresh.
- Ensure cache behavior does not serve stale Angular HTML after a release.

## Priority 3 — Security Hardening

### 9. Replace localStorage JWT for a Public Paid Launch

Status: Current FE stores the bearer token in `localStorage`

Current risk:

- Any successful XSS can read the token.

Preferred long-term architecture:

- Backend issues an `HttpOnly`, `Secure`, `SameSite` cookie.
- FE no longer reads or writes auth tokens from `localStorage`.
- `/api/users/me` restores the session.
- CSRF protection is adjusted appropriately for cookie auth.
- Logout invalidates or clears the cookie.

Launch decision:

- For a small controlled beta, this can be staged with an explicit risk decision.
- For a broad public paid launch, this should be treated as an important security upgrade.

### 10. Frontend Security Sanity

Required:

- Confirm no API keys or backend secrets are bundled in Angular.
- Confirm only public configuration is present in built JS.
- Inspect DevTools Network/Application tabs for accidental sensitive data.
- Ensure authorization decisions are enforced by BE, not only route guards.
- Avoid rendering unsanitized AI/provider HTML.

## Priority 4 — Test Automation Improvements

### 11. Add a Small Real-Backend Release Suite

Status: Playwright infrastructure exists

Current E2E coverage is useful, but a release gate should include a small suite against a real deployed/test backend.

Recommended release smoke suite:

- Register → OTP verify → login.
- Refresh authenticated session.
- Profile update.
- Generate one exercise.
- Complete one exercise and verify progress.
- Verify `BASIC` restriction/quota response.
- Stripe TEST checkout handoff.
- Logout.
- `USER` cannot access `ADMIN` route.

Do not make every E2E test depend on external AI/payment services; keep a focused release smoke suite.

## Frontend Launch Gate

Do not call the FE production-ready until:

- `updateProfile()` uses `/api/users/me`.
- Full Railway registration/OTP/login/logout flow passes.
- All exercise types have been smoke-tested.
- `BASIC`/`PREMIUM` UI behavior is verified.
- Stripe TEST flow works.
- Final custom domain works with HTTPS and deep-route refresh.
- Backend-only redeploy works without FE redeploy.
- Mobile test passes.
- No important console/network errors remain.
- Production error states are user-friendly.
- Authentication storage strategy has an explicit launch decision.
