# SproochenCoach End-to-End Testing Plan

## Purpose

This plan defines how to thoroughly test the Angular frontend end to end with Playwright. The goal is not only to prove happy paths work, but also to intentionally stress the app, break assumptions, and find frontend/backend contract bugs before users do.

## Testing Philosophy

- Test the real browser behavior: routing, forms, loading states, HTTP calls, auth state, media controls, validation messages, and rendered UI.
- Keep most tests backend-mocked so they are deterministic, fast, and can run in CI without a database, email server, microphone service, AI provider, or payment provider.
- Add a smaller backend-backed suite for integration confidence once the Spring Boot API, database, and test data cleanup are reliable.
- Follow the execution flow when debugging failures: component -> service -> HTTP request -> `ApiResponse<T>` unwrap -> UI state.
- Assert user-visible behavior plus the important backend contract details: endpoint path, HTTP method, request body, multipart field names, auth header, response unwrap, and error message handling.
- Prefer accessible selectors such as roles and labels. Add `data-testid` only when accessible selectors cannot target a stable element.

## Test Suite Structure

### 1. Mocked Frontend E2E Suite

Location: `tests/**/*.spec.ts`

Purpose:

- Runs against Angular with Playwright routes mocking backend APIs.
- Catches frontend regressions quickly.
- Verifies route guards, form behavior, API contract usage, loading states, quota gating, and UI rendering.

Expected command:

```bash
npx playwright test
```

Recommended package script:

```json
{
  "scripts": {
    "test:e2e": "playwright test"
  }
}
```

### 2. Backend-Backed Smoke Suite

Location: `tests/integration/**/*.spec.ts`

Purpose:

- Runs only when the Spring Boot backend is available.
- Verifies the frontend works with the real OpenAPI contract, real auth responses, real CORS settings, and real API error envelopes.
- Should stay small because it depends on external state.

Expected command:

```bash
npx playwright test tests/integration
```

Requirements:

- Backend running at `http://localhost:8080`.
- Test database or disposable local database.
- Known test user fixtures or API-level setup/cleanup.
- Email/OTP test mode, fixed OTP, or backend test endpoint for OTP retrieval.
- Serial execution unless each CI job gets its own isolated backend instance and database.
- Unique test-run namespace for disposable users, for example `e2e-${CI_RUN_ID || Date.now()}`.
- Cleanup strategy for users, subscriptions, attempts, and audit rows created by real backend smoke tests.

### 3. Destructive/Resilience Suite

Location: `tests/resilience/**/*.spec.ts`

Purpose:

- Intentionally breaks assumptions: slow APIs, 500 responses, invalid `ApiResponse`, missing `data`, expired JWT, quota exhaustion, denied microphone permissions, malformed Base64 audio, duplicate submissions, and browser refreshes mid-flow.
- Runs on demand or nightly because it is broader and more expensive.

Expected command:

```bash
npx playwright test tests/resilience
```

## Shared Test Infrastructure

### Isolation and Parallelism

- Mocked Playwright tests may run fully parallel because route mocks and browser storage are isolated per test.
- Backend-backed smoke tests should run with `workers: 1` unless the CI pipeline provisions a dedicated backend and database per run.
- Never share fixed user emails across backend-backed tests unless the suite owns setup and teardown for that user.
- Use dynamic test-run IDs in backend-backed emails, prompt/config labels, and admin-created records.
- Keep destructive real-backend tests out of shared environments; cover destructive contracts in the mocked suite instead.

### Fixtures

Create shared helpers under `tests/fixtures`:

- `auth.fixture.ts`: login helper, authenticated page setup, token assertions, user DTO factories.
- `api.fixture.ts`: reusable `ApiResponse<T>` builders, request capture helpers, route mocks, malformed envelope builders.
- `quota.fixture.ts`: quota builders that can mark any single category exhausted while keeping other categories available.
- `exercise-config.fixture.ts`: standard levels, topics, and exercise type options.
- `dashboard.fixture.ts`: progress DTO factories only; quota state belongs in `quota.fixture.ts`.
- `media.fixture.ts`: browser-level `getUserMedia` permission stubs plus `MediaRecorder` class mocks for speaking/image-description flows.
- `accessibility.fixture.ts`: helper for repeated keyboard navigation and focus checks.

### Contract Tests

- Add `tests/api-response.contract.spec.ts` before scaling feature specs.
- Centralize `ApiResponse<T>` behavior there: `success: true`, `success: false`, missing required `data`, HTTP error with `message`, raw text error, malformed/empty response, and network abort.
- Feature specs should assert feature-specific consequences, such as “button re-enables” or “quota message displays”, rather than re-proving every envelope variant repeatedly.
- Keep one representative failure assertion per feature to prove the component wires service errors into the right UI location.

### Quota Fixtures

- Build quota state with a helper such as `quota({ exhausted: 'CHAT' })`, `quota({ exhausted: 'TTS' })`, `quota({ exhausted: 'STT' })`, and `quota({ exhausted: 'IMAGE' })`.
- Keep category names aligned with the backend contract: `CHAT`, `TTS`, `STT`, and `IMAGE`.
- Use the same fixture in dashboard, text exercises, vocabulary, listening, speaking, image description, and chat.
- Assert quota-blocked UI behavior in each feature, but assert quota DTO parsing centrally.

### Media Fixtures

- Use browser API stubs for deterministic mocked tests: override `navigator.mediaDevices.getUserMedia` and install a controllable fake `MediaRecorder`.
- Use Playwright browser permissions only in a small compatibility smoke test if real browser permission behavior needs coverage.
- Simulate four core states: unsupported browser, permission denied, empty recording, and successful recording with a small WebM-like `Blob`.
- Keep upload assertions at the HTTP boundary: multipart endpoint, `audio` field name, optional `attemptId`, optional `durationSeconds`, and bearer token.

### Mocking Rules

- Mock exact backend paths from the OpenAPI contract.
- Use `ApiResponse<T>` shape for every mocked backend response: `success`, `message`, and `data`.
- Assert the request method before fulfilling the route.
- Assert request payloads for all form submissions.
- Assert `Authorization: Bearer <jwt>` on protected endpoints.
- Mock both success and failure responses for each service-owned feature.
- Fail tests on unexpected backend calls where practical.

### Test Data Rules

- Use dynamic emails for registration/login flows unless the route is fully mocked.
- Use realistic DTOs but only include fields the frontend actually consumes.
- Keep JWT values fake but stable inside each test.
- Use test users:
  - learner: `roles: ['USER']`
  - admin: `roles: ['ADMIN']`
  - disabled user: `adminDisabled: true`
  - unverified user: `emailVerified: false`

## Priority Roadmap

### Phase 1: Critical Auth and Routing

These tests protect the main entry path and route security.

- Registration success:
  - Go to `/signup`.
  - Fill first name, last name, email, password, confirm password.
  - Assert `POST /api/users/addUser`.
  - Assert request excludes confirm password.
  - Mock success and assert redirect to `/otp?email=...`.

- Registration validation:
  - Submit empty form.
  - Assert validation messages.
  - Assert no `POST /api/users/addUser` call.
  - Try invalid email.
  - Try short password.
  - Try password mismatch.
  - Try invalid postal code.

- Registration API failure:
  - Mock duplicate email with `success: false`.
  - Mock HTTP 409 with `ApiResponse.message`.
  - Mock HTTP 500.
  - Assert learner-friendly error and no redirect.
  - Assert submit button re-enables.

- Location suggestions during signup:
  - Type fewer than 2 characters and assert no location call.
  - Type address query and assert `GET /api/users/locations`.
  - Mock suggestions and select one.
  - Assert street, number, postal code, and city auto-fill.
  - Mock location service failure and assert manual-entry fallback.

- OTP page initial load:
  - Visit `/otp?email=learner@example.com`.
  - Assert email field is prefilled.
  - Assert automatic `POST /api/users/sendOtp`.
  - Assert status message appears.

- OTP validation:
  - Submit empty OTP.
  - Submit non-numeric OTP.
  - Submit fewer than 6 digits.
  - Assert no verify request.

- OTP verification success:
  - Fill valid OTP.
  - Assert `POST /api/users/verifyOtp` sends `{ email, otp: number }`.
  - Mock success.
  - Assert redirect to `/login`.

- OTP verification failure:
  - Mock invalid/expired code.
  - Assert error message.
  - Assert still on `/otp`.
  - Assert verify button re-enables.

- Resend OTP:
  - Click resend.
  - Assert `POST /api/users/resendOtp`.
  - Mock success and failure.
  - Assert proper status/error message.

- Login success:
  - Go to `/login`.
  - Fill email/password.
  - Assert `POST /api/users/login`.
  - Mock `ResponseUserDto` with JWT.
  - Assert token saved as `sproochen.authToken`.
  - Assert redirect to `/app/dashboard`.
  - Assert dashboard protected calls include bearer token.

- Login failure:
  - Mock bad credentials.
  - Mock missing `jwt` in successful response.
  - Mock disabled/unverified account message.
  - Assert error message and no token persisted.

- Session initialization:
  - Preload valid JWT in localStorage.
  - Mock `GET /api/users/me`.
  - Visit `/app/dashboard`.
  - Assert user remains authenticated.
  - Mock `/me` failure and assert token is cleared and user is redirected to `/login`.

- Route guard:
  - Visit `/app/dashboard` without token.
  - Assert redirect to `/login`.
  - Visit `/app/admin` as learner.
  - Assert redirect to `/app/dashboard`.
  - Visit `/app/admin` as admin.
  - Assert admin page renders.

- Logout:
  - Log in.
  - Click logout from the shell.
  - Assert token cleared.
  - Assert protected route redirects to `/login`.

### Phase 2: Dashboard and Shell

These tests verify the authenticated landing area and navigation.

- Dashboard success:
- Mock `GET /api/progress/me`.
- Mock `GET /api/users/me/ai-quota` using `quota.fixture.ts`.
  - Assert greeting, stats, streak, activity counts, quota cards, and quick links.

- Dashboard empty state:
  - Mock zero progress and empty skill list.
  - Assert no-progress messaging.
  - Assert no broken charts or `undefined` text.

- Dashboard partial data:
  - Omit optional fields.
  - Assert fallback values render cleanly.
  - Assert no `NaN`, `undefined`, or raw object output.

- Dashboard failure:
  - Mock progress failure.
  - Assert error message.
  - Mock quota failure.
  - Assert quota-specific error does not break the rest of dashboard.

- Shell navigation:
  - Assert sidebar links navigate to dashboard, speaking, listening, exercises, image description, vocabulary, and chat.
  - Assert admin link is hidden for learner and visible for admin.
  - Assert mobile navigation remains usable at small viewport.

- Browser refresh:
  - Log in, navigate to dashboard, refresh.
  - Assert session survives via stored JWT.
  - Assert protected calls still use bearer token.

### Phase 3: Profile Management

These tests verify user-owned account editing.

- Profile load:
  - Mock `GET /api/users/me`.
  - Assert profile form fields populate.
  - Assert email is displayed correctly.

- Profile update success:
  - Edit first name, last name, address, postal code, city.
  - Assert `PUT /api/users/{id}` request shape.
  - Mock updated `ResponseUserDto`.
  - Assert UI reflects changes and auth state updates.

- Password update:
  - Fill password and confirm password.
  - Assert password is included only when provided.
  - Assert confirm password is never sent.

- Profile validation:
  - Invalid email.
  - Invalid postal code.
  - Password mismatch.
  - Assert no update request.

- Profile update failure:
  - Mock `success: false`.
  - Mock HTTP error with `message`.
  - Assert error message and form remains editable.

### Phase 4: Practice Config Loading

These tests protect dynamic backend-driven exercise options.

- Config success:
  - Mock `GET /api/exercise-config`.
  - Assert enabled levels, topics, and types populate dropdowns.
  - Assert disabled options are not selectable if frontend filters them.

- Topic filtering:
  - Select A1, A2, B1.
  - Assert only matching topics appear for the selected level.
  - Assert current topic resets if no longer valid.

- Config loading state:
  - Delay config response.
  - Assert controls/buttons are disabled while loading.
  - Assert loading copy is visible.

- Config failure:
  - Mock config failure.
  - Assert user-facing error.
  - Assert generation buttons stay disabled.
  - Assert no invalid generation request is sent.

- Malformed config:
  - Missing topics.
  - Empty levels.
  - Missing required exercise type.
  - Assert graceful fallback or clear blocking message.

### Phase 5: Text Exercises

These tests verify `POST /api/exercises/generate` and completion.

- Generate translation exercise:
  - Select level, topic, and type.
  - Assert request body uses backend enum/code values.
  - Mock `GeneratedExerciseDto`.
  - Assert question, hint, options, and expected answer rendering.

- Multiple-choice interaction:
  - Mock options.
  - Select an option.
  - Assert UI shows selected state.
  - Assert completion call to `POST /api/progress/exercises/{attemptId}/complete`.

- Reveal answer:
  - Click reveal.
  - Assert expected answer becomes visible.
  - Assert completion is sent once only.

- Generate failures:
  - Mock `success: false`.
  - Mock missing `data`.
  - Mock HTTP 429 quota error.
  - Mock HTTP 500.
  - Assert error messages and loading reset.

- Duplicate clicks:
  - Double-click generate quickly.
  - Assert only one request is made while loading.

- Edge payloads:
  - Empty options.
  - Long question text.
  - Missing hint.
  - Missing attemptId.
  - Assert UI does not crash and completion is skipped when no attempt exists.

### Phase 6: Vocabulary

These tests verify vocabulary card generation and completion.

- Generate vocabulary:
  - Select level/topic.
  - Assert `POST /api/exercises/vocabulary`.
  - Mock card data.
  - Assert source/translation text renders.

- Flip card:
  - Click reveal/flip.
  - Assert translation appears.
  - Assert attempt completion sent once.

- Empty vocabulary response:
  - Mock success with empty/missing data.
  - Assert useful error or empty state.

- Quota blocked:
  - Mock exhausted `CHAT` quota.
  - Assert generate button disabled and upgrade/retry message.

- Failure recovery:
  - Mock error on first request and success on retry.
  - Assert error clears after successful retry.

### Phase 7: Listening

These tests verify Base64 audio handling, native controls, and completion.

- Generate listening exercise:
  - Assert `POST /api/exercises/listening`.
  - Mock `AudioExerciseDto` with `question`, `questionTranslation`, `audio`, and `attemptId`.
  - Assert audio player is visible.
  - Assert Luxembourgish question and English translation render in expected learner-facing places.

- Audio Blob behavior:
  - Provide valid Base64 audio.
  - Assert `<audio controls>` has playable object URL.
  - Generate a second exercise.
  - Assert previous object URL is replaced.

- Reveal answer/completion:
  - Click reveal answer.
  - Assert completion endpoint called once.

- Audio edge cases:
  - Missing audio.
  - Invalid Base64.
  - Very large Base64 string.
  - Missing content type.
  - Assert graceful error/no fake player.

- Quota blocked:
  - Mock exhausted `TTS` quota.
  - Assert generate disabled and clear message.

### Phase 8: Speaking

These tests verify speaking prompt generation, microphone handling, recording upload, and evaluation display.

- Generate speaking prompt:
  - Assert `POST /api/exercises/practice`.
  - Mock `SpeakingDto` with prompt text, translation, audio, and attemptId.
  - Assert audio prompt and learner instructions render.

- Browser without recording support:
  - Remove or override `navigator.mediaDevices` and `MediaRecorder`.
  - Click record.
  - Assert “Audio recording is not supported” message.

- Microphone denied:
  - Mock `getUserMedia` rejection with permission error.
  - Assert learner-friendly microphone error.
  - Assert no upload request.

- Successful recording upload:
  - Mock `MediaRecorder`.
  - Start and stop recording.
  - Assert multipart `POST /api/exercises/recording`.
  - Assert form field name is exactly `audio`.
  - Assert `durationSeconds` is sent when expected.
  - Assert attemptId is sent when present.
  - Mock evaluation with transcript, score, feedback, corrections.
  - Assert evaluation renders.

- Empty recording:
  - Stop recorder with no chunks.
  - Assert “No audio was captured” and no upload request.

- Recording upload failure:
  - Mock 429 quota error.
  - Mock 500.
  - Mock malformed success response.
  - Assert retry button behavior and error recovery.

- Recording controls:
  - Assert generate disabled while recording.
  - Assert resend disabled while uploading.
  - Double-click record/stop rapidly and assert no duplicate uploads.

### Phase 9: Image Description

These tests verify generated image prompts and STT evaluation.

- Generate image description:
  - Select level/topic.
  - Assert `POST /api/exercises/generate-image`.
  - Mock image prompt, image URL/Base64 fields used by current DTO, and attemptId.
  - Assert image, prompt, and instructions render.

- Image generation failures:
  - Mock quota exhausted for `IMAGE`.
  - Mock provider/server error.
  - Mock missing image payload.
  - Assert clear recovery path.

- Image recording success:
  - Mock microphone and `MediaRecorder`.
  - Assert multipart `POST /api/exercises/image-description/recording`.
  - Assert `audio` field name.
  - Assert evaluation renders transcript, score, feedback, and corrections.

- Record before generation:
  - Attempt recording with no generated image.
  - Assert user-facing blocking message.
  - Assert no upload request.

- Quota blocked:
  - Exhaust `STT` quota.
  - Assert recording controls disabled.
  - Exhaust `IMAGE` quota.
  - Assert image generation disabled.

### Phase 10: Chat

These tests verify the current chat UI even if the conversation is still local/mock-driven.

- Chat page renders:
  - Navigate to `/app/chat`.
  - Assert empty or initial conversation state.

- Send message:
  - Type message.
  - Submit with button and Enter key.
  - Assert user message appears.
  - Assert assistant response appears if locally mocked.

- Input validation:
  - Submit empty/whitespace message.
  - Assert no new message.

- Long message:
  - Submit long learner text.
  - Assert layout does not break.

- Quota gating:
  - Mock exhausted `CHAT` quota if chat reads quota.
  - Assert send disabled or blocked message.

### Phase 11: Payments and Subscription

These tests verify checkout and payment return behavior without real Stripe redirects in the mocked suite.

- Start checkout:
  - Click upgrade/subscription action.
  - Assert `POST /api/payments/checkout`.
  - Mock checkout URL.
  - Assert browser navigates or assigns location as intended.

- Checkout API failure:
  - Mock 400/500.
  - Assert error message and button re-enables.

- Payment success return:
  - Visit `/payment/success`.
  - Assert success copy and navigation options.
  - Assert current quota/subscription refresh if implemented.

- Payment cancel return:
  - Visit `/payment/cancel`.
  - Assert cancel copy and recovery action.

- Cancel subscription:
  - Mock `POST /api/payments/subscription/cancel`.
  - Assert success and failure states.

### Phase 12: Admin

These tests verify admin-only operations and prevent accidental exposure to learners.

- Admin visibility:
  - Login as learner.
  - Assert admin sidebar link hidden.
  - Direct visit `/app/admin`.
  - Assert redirect to dashboard.
  - Login as admin.
  - Assert admin sidebar link visible.
  - Visit `/app/admin` and assert page renders.

- Admin user list:
  - Mock paged users.
  - Assert search and status filter request params.
  - Assert rows render user, email, status, roles, subscription, and useful stats.
  - Mock empty page and assert empty state.

- Admin user detail:
  - Select a user.
  - Mock detail, progress, AI usage, and quota.
  - Assert all sections render and loading states do not block each other.

- Disable/enable user:
  - Click disable.
  - Assert `PUT`/configured status endpoint request.
  - Mock success.
  - Assert row/detail updates.
  - Mock failure and assert state rolls back or remains consistent.

- Admin prompts:
  - Load prompt overlays.
  - Create prompt.
  - Edit title/content/enabled state.
  - Delete prompt.
  - Assert delete request uses the correct prompt identifier.
  - Assert refresh calls and audit reload.
  - Mock audit response after delete and assert actor/action/target reflect the deletion contract.
  - Test validation errors and duplicate keys.

- Exercise config admin:
  - Load levels/topics/types.
  - Create new level/topic/type.
  - Edit label/enabled relationship.
  - Delete row.
  - Assert delete request targets the correct config type and code/id.
  - Mock audit response after delete and assert actor/action/target reflect the config deletion contract.
  - Assert generated code format.
  - Assert existing codes do not change during edit.
  - Test backend validation errors.

- Audit trail:
  - Mock recent audit rows.
  - Assert actor/action/target/timestamp render.
  - Mock empty logs.
  - Mock failure.

- Admin resilience:
  - Mock one admin section failing while others succeed.
  - Assert page remains usable and failure is scoped.

### Phase 13: Cross-Cutting Failure and Security Scenarios

Use this phase for behavior that is truly cross-cutting. Do not duplicate every `ApiResponse<T>` envelope variant in every feature file; put envelope parsing coverage in `tests/api-response.contract.spec.ts` and keep feature specs focused on the user-visible consequence.

- Expired token:
  - Mock protected endpoint 401.
  - Assert token clears if implemented.
  - Assert redirect/login recovery path.

- Missing bearer token:
  - Log in with response missing JWT.
  - Assert error and no dashboard access.

- Backend contract drift:
  - Cover envelope parsing centrally in `tests/api-response.contract.spec.ts`.
  - Add only one representative missing-data or failed-envelope case in major feature specs.
  - Assert each feature renders the error in the correct page-specific location.

- Loading states:
  - Delay each major API response.
  - Assert loading text/icon appears.
  - Assert buttons are disabled while requests are in flight.

- Duplicate submission:
  - Double-click every submit/generate/upload button.
  - Assert only one request or safe idempotent UI behavior.

- Network loss:
  - Abort backend route.
  - Assert error message and retry path.

- Unexpected redirect:
  - Access unknown route.
  - Assert redirect to landing page.

- Browser storage:
  - Token in localStorage.
  - Token in sessionStorage.
  - Token with `Bearer ` prefix.
  - Assert auth interceptor normalizes to a single bearer header.

- Authorization boundaries:
  - Learner cannot see admin navigation.
  - Learner cannot open admin route.
  - Admin can open admin route.
  - Logged-out user cannot open app shell routes.

### Phase 14: Accessibility and Usability

- Keyboard navigation:
  - Tab through signup, OTP, login, profile, generation forms, and modal/admin overlays.
  - Assert focus order is usable.

- Labels:
  - Assert important inputs have accessible labels.
  - Assert buttons have clear accessible names.

- Error announcement:
  - Assert form errors use `role="alert"` where appropriate.
  - Assert success/status messages use `role="status"` where appropriate.

- Responsive layout:
  - Test desktop, tablet, and mobile viewport for landing, auth, dashboard, practice pages, and admin.
  - Assert no horizontal overflow in major views.

- Native audio controls:
  - Assert listening/speaking audio uses actual browser controls.
  - Assert no fake playback UI is presented as functional.

- Visual regression:
  - Add lightweight `toHaveScreenshot()` baselines only for stable, high-value pages.
  - Suggested pages: landing, login/signup layout, dashboard, one generated exercise page, and admin overview.
  - Mask dynamic regions such as generated email, current date, progress numbers, audio controls, and animated loading icons.
  - Run screenshot tests in a pinned browser/project only, usually Chromium desktop, to avoid cross-browser noise.

### Phase 15: Real Backend Integration Smoke Tests

Run these after the mocked suite is stable.

Execution policy:

- Run serially with `workers: 1` unless the CI job owns an isolated backend instance and database.
- Use unique emails and generated record labels per CI run.
- Prefer API-level setup and cleanup over UI cleanup.
- Keep this suite small; it should catch integration drift, not duplicate the entire mocked test matrix.

- Register real disposable user.
- Verify OTP using backend test-mode OTP.
- Login with real JWT.
- Load dashboard.
- Generate one text exercise.
- Generate one vocabulary exercise.
- Generate one listening exercise with audio.
- Generate one speaking prompt.
- Upload a small fixture recording if backend accepts it.
- Load/update profile.
- Admin login and basic admin user list if an admin fixture exists.

Do not run destructive admin delete tests against shared or production-like data.

## Suggested Spec File Breakdown

- `tests/auth.registration.spec.ts`
- `tests/auth.otp-login-dashboard.spec.ts`
- `tests/auth.guards.spec.ts`
- `tests/api-response.contract.spec.ts`
- `tests/dashboard.spec.ts`
- `tests/profile.spec.ts`
- `tests/practice-config.spec.ts`
- `tests/fixtures/auth.fixture.ts`
- `tests/fixtures/api.fixture.ts`
- `tests/fixtures/quota.fixture.ts`
- `tests/fixtures/media.fixture.ts`
- `tests/visual/critical-pages.spec.ts`
- `tests/exercises.text.spec.ts`
- `tests/exercises.vocabulary.spec.ts`
- `tests/exercises.listening.spec.ts`
- `tests/exercises.speaking.spec.ts`
- `tests/exercises.image-description.spec.ts`
- `tests/chat.spec.ts`
- `tests/payments.spec.ts`
- `tests/admin.access.spec.ts`
- `tests/admin.users.spec.ts`
- `tests/admin.prompts.spec.ts`
- `tests/admin.exercise-config.spec.ts`
- `tests/admin.audit.spec.ts`
- `tests/resilience/api-errors.spec.ts`
- `tests/resilience/storage-auth.spec.ts`
- `tests/integration/auth-smoke.spec.ts`
- `tests/integration/practice-smoke.spec.ts`

## Recommended Implementation Order

1. Finish auth tests:
   - registration
   - OTP verification
   - login
   - dashboard
   - route guards
   - logout

2. Add shared fixtures:
   - API response builders
   - authenticated page setup
   - centralized API envelope contract tests
   - dashboard mocks
   - reusable quota state builders
   - practice config mocks
   - browser media stubs

3. Cover learner pages:
   - dashboard
   - profile
   - text exercises
   - vocabulary
   - listening
   - speaking
   - image description
   - chat

4. Cover quota and failures:
   - exhausted category limits
   - 429 responses
   - feature-specific missing-data consequences
   - feature-specific failed-envelope consequences
   - slow responses
   - double-click submissions

5. Cover admin:
   - access control
   - user list/detail/status
   - prompts
   - exercise config
   - audit logs

6. Add backend-backed smoke tests:
   - only after deterministic test data and OTP strategy exist.
   - run serially unless the backend/database are isolated per CI job.

7. Add visual regression checks:
   - keep baselines limited to stable critical pages.
   - mask dynamic content to avoid noisy diffs.

## Definition of Done

The E2E test suite is considered thorough when:

- Every public and protected route has at least one render test.
- Every form has validation, success, and failure coverage.
- Every HTTP service has at least one test asserting method, URL, payload, auth header where applicable, and `ApiResponse<T>` handling.
- `ApiResponse<T>` envelope edge cases are covered centrally in `tests/api-response.contract.spec.ts`.
- Feature specs use shared API, auth, quota, dashboard, practice-config, and media fixtures instead of duplicating route setup.
- Every AI/practice feature has quota-blocked and backend-failure coverage.
- Every recording feature has unsupported browser, denied microphone, empty recording, successful upload, and upload failure coverage.
- Every protected route has logged-out and unauthorized-role coverage.
- The dashboard and shell survive refresh with a stored token.
- Critical stable pages have screenshot baselines with dynamic content masked.
- Backend-backed smoke tests run serially or against isolated backend/database instances.
- No test depends on a real third-party AI, email, payment, or microphone service.
- The smaller backend-backed suite proves the most important real integration paths.

## Current Status

- Playwright is installed and configured.
- `npm run test:e2e` is available for the Playwright suite.
- Shared fixtures exist for API envelopes, auth users/session setup, dashboard progress, quota states, and practice config.
- Registration success is covered with a mocked backend.
- OTP verification -> login -> dashboard is covered with mocked backend routes.
- Auth validation and failure cases are covered for signup, OTP, resend OTP, and login validation.
- Route guard coverage exists for logged-out users, learner/admin authorization, and logout token clearing.
- Dashboard coverage exists for success, empty state, progress failure, and quota failure.
- Centralized `ApiResponse<T>` contract coverage exists for failed envelopes, HTTP message envelopes, raw text errors, missing required data, missing login JWT, and bearer token normalization.
- Practice config coverage exists for exercise dropdown loading, topic filtering by level, and config load failure.
- Text exercise coverage exists for generation request payload, rendered exercise content, answer selection, attempt completion, generation failure, and `CHAT` quota blocking.
- Vocabulary coverage exists for generation request payload, rendered flashcards, translation reveal, attempt completion, card navigation, empty responses, generation failure, config failure, and `CHAT` quota blocking.
- Next recommended tests:
  - listening Base64 audio and completion coverage
  - speaking/image-description media fixture implementation
  - profile management coverage
  - admin CRUD coverage
