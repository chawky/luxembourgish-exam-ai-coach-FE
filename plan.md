# SproochenCoach Frontend Admin Feature Plan

## Purpose

This file records what has already been adapted in the Angular frontend for the current admin/backend roadmap and what still needs to be built or verified.

## Current Findings

### 1. Backend Contract Alignment

Status: partially implemented and build-validated.

Implemented:

- Regenerated the OpenAPI schema from the running backend into `src/app/api/backend-schema.ts`.
- Updated frontend exercise request types so `level`, `topic`, and `type` are string codes instead of hardcoded TypeScript literal enums.
- Added `attemptId` fields to generated exercise, vocabulary, speaking, listening, and image-description frontend DTOs.
- Added `completedActivities` and `latestExerciseName` to progress dashboard DTOs.
- Added `emailVerified` and `adminDisabled` to the frontend `User` model.

Still future scope:

- The frontend still uses hand-written shared models in `src/app/models.ts` rather than consuming generated OpenAPI types everywhere.
- There is no strict compile-time mapping from each HTTP service method to the generated OpenAPI operation response/request types.

Recommendation:

- Keep the current hand-written models for now because the app already uses them broadly.
- Later, migrate service-level DTOs to generated OpenAPI types first, then normalize to UI view models at component boundaries.

### 2. Dynamic Exercise Config

Status: implemented for learner generation forms.

Implemented:

- Removed the hardcoded frontend arrays for levels, topics, and exercise types from `src/app/practice-options.ts`.
- Added `PracticeConfigService` to load configured levels, topics, and exercise types from the backend.
- Updated text exercises, vocabulary, listening, speaking, and image-description pages to load enabled config rows dynamically.
- Topic filtering now uses backend `levelCode` relationships instead of hardcoded topic-to-level mappings.
- Speaking and image-description flows choose `SHORT_ANSWER` dynamically from backend exercise types, falling back to the first configured type if needed.
- Learner pages now read enabled-only config from public authenticated `GET /api/exercise-config`.
- Admin config editing remains protected under `/api/admin/exercise-config`.

Still future scope:

- There is no UI display ordering because the backend does not expose an ordering/display-priority field yet.

Recommendation:

- Keep admin CRUD under `/api/admin/exercise-config`.
- Add ordering on the backend before implementing drag-and-drop ordering in the admin UI.

### 3. Exercise Attempt Lifecycle

Status: partially implemented.

Implemented:

- Text exercises preserve backend `attemptId`.
- Vocabulary preserves backend `attemptId`.
- Listening preserves backend `attemptId`.
- Speaking preserves backend `attemptId` and sends it during recording evaluation.
- Image description preserves backend `attemptId` and sends it during recording evaluation.
- Recording uploads send `durationSeconds` using the client-side elapsed recording timer.
- Added `ExerciseService.completeAttempt(...)` for `POST /api/progress/exercises/{attemptId}/complete`.
- Text exercises mark an attempt completed when the learner selects an option or reveals the answer.
- Listening marks an attempt completed when the learner selects an option or reveals the model answer.
- Vocabulary marks an attempt completed when the learner flips a card to reveal the translation.
- Dashboard now shows completed activity counts separately from evaluated counts.

Still future scope:

- Text, listening, and vocabulary completion is client-triggered and simple; it does not perform answer correctness evaluation.
- Free-text exercises are marked completed when the answer is revealed, not when the learner explicitly submits an answer.
- Generated payload replay/history is not implemented because the backend does not persist full generated exercise payloads yet.

Recommendation:

- Add explicit "Submit answer" actions for text/listening/vocabulary if correctness evaluation is added later.
- Keep the current lightweight completion behavior until backend answer-checking endpoints exist.

### 4. Admin Navigation and Authorization

Status: implemented for frontend route gating.

Implemented:

- Added `AuthService.isAdmin`.
- Added `adminGuard`.
- Added `/app/admin` route.
- Added an Admin sidebar item that is only visible for users with `ADMIN` or `ROLE_ADMIN`.
- Split the admin dashboard into focused frontend sections for users, prompts, exercise config, and audit trail instead of rendering everything in one long page.

Still future scope:

- Frontend route gating is only a UX guard. Backend authorization remains the real security boundary.
- If role naming changes, `AuthService.isAdmin` must be updated.

Recommendation:

- Keep both `ADMIN` and `ROLE_ADMIN` accepted until the backend role format is stable.

### 5. Admin User Profiles

Status: implemented for current profile-management scope.

Implemented:

- Added `AdminService.getUsers(...)` for paged user lookup.
- Added `AdminService.getUser(...)` for user detail.
- Added `AdminService.updateUserStatus(...)` for admin disable/enable.
- Added `AdminService.getUserProgress(...)` for per-user attempts.
- Added `AdminService.getUserAiUsage(...)` for per-user AI usage rows.
- Added `/app/admin` user profile UI with search, status filtering, detail stats, account enable/disable, recent progress, and recent AI usage.

Still future scope:

- User list pagination controls are not implemented yet; the frontend loads the first page.
- AI usage filter controls for `from`, `to`, `provider`, and `model` are not implemented yet.
- Per-user progress pagination controls are not implemented yet.
- Admin user detail does not show every profile field yet.

Recommendation:

- Add pagination and filters once the data volume is large enough to need them.
- Keep the current page simple for MVP validation.

### 6. Prompt Management UI

Status: implemented as a basic overlay editor.

Implemented:

- Added `AdminService.getPrompts()`.
- Added `AdminService.createPrompt(...)`.
- Added `AdminService.updatePrompt(...)`.
- Added `AdminService.deletePrompt(...)`.
- Added a prompt management section under `/app/admin`.
- Admins can select an existing prompt overlay, edit title, edit teaching guidance, toggle enabled state, save, create a new overlay, or delete an overlay.
- Prompt keys are no longer shown or editable in the admin UI; new prompt overlay keys are generated internally from the title as lowercase kebab-case identifiers, while existing keys stay stable during edits.
- Prompt saves and deletes refresh audit logs after successful mutation.

Still future scope:

- The UI does not show locked backend prompt-file content; it only edits the database overlay fields exposed by OpenAPI.
- The UI does not list known backend prompt definitions that do not yet have overlays, because OpenAPI only returns existing prompt overlay DTOs.
- There is no prompt version history, rollback, publish state, or diff preview.
- Backend validation errors are shown as plain API messages; there is no field-level validation display.

Recommendation:

- Add a backend endpoint that returns all known prompt definitions plus overlay status if admins need to create overlays from a fixed backend-owned list.
- Add versioning/rollback before allowing high-risk prompt edits in production.

### 7. Exercise Config Admin UI

Status: implemented as basic CRUD forms.

Implemented:

- Added `AdminService.getExerciseConfig()`.
- Added save methods for levels, topics, and exercise types.
- Added delete support for levels, topics, and exercise types.
- Added an exercise config section under `/app/admin`.
- Admins can open separate config tabs for levels, topics, or exercise types.
- Admins can select a row inside the active config tab, edit label/enabled state, and save.
- Exercise config codes are no longer editable or shown in the admin UI; new codes are generated from labels as uppercase snake-case identifiers, while existing codes stay stable during edits.
- Topic editing supports `levelCode`.
- Level editing supports `description`.
- Config mutations refresh the config list and audit logs after successful mutation.

Still future scope:

- Delete actions do not require confirmation yet.
- There is no disable-first workflow even though disabling is safer than deleting once learner history exists.
- There is no display ordering.
- The learner option cache was removed, but pages only refresh config when they are loaded.

Recommendation:

- Add confirmation dialogs before delete.
- Make "disable" the primary UI action and keep delete visually secondary.
- Keep generated codes stable after creation so existing learner history and backend references do not break.

### 8. Audit Trail UI

Status: implemented as a basic recent-log viewer.

Implemented:

- Added `AdminService.getAuditLogs(...)`.
- Added a recent audit trail section under `/app/admin`.
- Prompt, config, and status mutations refresh audit logs after successful mutation.

Still future scope:

- Audit filters for actor, target user, target type, target id, and action are not implemented in the UI yet.
- Audit pagination controls are not implemented yet.
- Old/new values and reasons are not fully expanded in the UI.

Recommendation:

- Add filters and expanded row details when audit logs become useful for real operational debugging.

### 9. Subscription, Quotas, and AI Cost Control

Status: frontend quota gating is implemented for current learner AI surfaces.

Implemented:

- Frontend starts subscription checkout through `POST /api/payments/checkout`.
- Frontend supports subscription cancellation through `POST /api/payments/subscription/cancel`.
- Backend now decides BASIC vs PREMIUM AI routing from the logged-in user's subscription.
- Admin user detail exposes recent AI usage and estimated AI cost for operational review.
- Regenerated OpenAPI types after adding `GET /api/users/me/ai-quota`.
- Added `AiQuotaService` for current-user quota status.
- Text exercises, vocabulary, and chat send controls respect the `CHAT` quota.
- Speaking and listening prompt/audio generation respect the `TTS` quota.
- Speaking and image-description recording evaluation controls respect the `STT` quota.
- Image-description generation respects the `IMAGE` quota.
- Backend 429 quota messages are surfaced through the existing API error handling.
- Exhausted BASIC quota shows an upgrade-oriented message; exhausted PREMIUM quota shows a monthly-limit message.

Still future scope:

- There is no frontend-facing usage meter showing learners how much premium practice remains.
- Admin AI usage filters for provider and model are not implemented yet.
- Chat is still a local mock conversation; quota gating is present, but usage will only decrement once chat sends real backend AI requests.

Recommendation:

- Treat user payment as SaaS revenue: users pay the app through Stripe, and the backend pays model providers using the platform API keys.
- Define plan limits that exceed expected model cost with margin, such as monthly generated exercises, speaking evaluations, listening clips, and image-description attempts.
- Enforce limits in the backend before making model calls so unpaid or over-limit users cannot create provider cost.
- Use cheaper models for BASIC or high-volume simple tasks, and reserve stronger models for premium feedback, difficult evaluation, or paid tiers.
- Keep provider API keys server-side only; do not ask learners to enter OpenAI or Groq keys unless the product explicitly supports bring-your-own-key.

## Recommended Implementation Order

### Phase 1: Stabilize Backend Config Access

- Completed: public read-only `GET /api/exercise-config` is available for learner forms.
- Completed: `PracticeConfigService` now reads from `/api/exercise-config`.
- Completed: `npm run api:types` was re-run after the backend endpoint was added.

### Phase 2: Improve Admin Prompt UX

- Add a backend read endpoint for all known prompt definitions and overlay status.
- Replace free-form prompt creation with a select/list of backend-owned prompt definitions.
- Add client-side validation help for backend prompt validation rules.
- Add prompt versioning/rollback before production use.

### Phase 3: Harden Config Mutation UX

- Add delete confirmations.
- Prefer enable/disable actions over destructive deletes.
- Add client-side validation for code format and required topic level relationship.
- Add ordering when backend exposes display priority.

### Phase 4: Add Operational Filters

- Add pagination to admin user list, progress rows, AI usage rows, and audit logs.
- Add AI usage filters for date range, provider, and model.
- Add audit filters for actor, target, and action.

### Phase 5: Tighten Generated Type Usage

- Move service request and response types closer to generated OpenAPI operation types.
- Keep component-facing view models normalized and stable.
- Avoid leaking backend DTO implementation details into learner-facing UI copy.

## Validation

- `npm run api:types` was run successfully against `http://localhost:8080/v3/api-docs`.
- `npm run build` passes after the frontend admin changes.
- End-to-end behavior still needs browser verification with an admin JWT and a non-admin learner JWT.
