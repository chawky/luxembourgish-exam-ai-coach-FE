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

Status: implemented for learner generation forms, with one backend-contract caveat.

Implemented:

- Removed the hardcoded frontend arrays for levels, topics, and exercise types from `src/app/practice-options.ts`.
- Added `PracticeConfigService` to load configured levels, topics, and exercise types from the backend.
- Updated text exercises, vocabulary, listening, speaking, and image-description pages to load enabled config rows dynamically.
- Topic filtering now uses backend `levelCode` relationships instead of hardcoded topic-to-level mappings.
- Speaking and image-description flows choose `SHORT_ANSWER` dynamically from backend exercise types, falling back to the first configured type if needed.

Still future scope:

- Learner pages currently read config from `GET /api/admin/exercise-config` because this is the only exercise-config read endpoint exposed in the OpenAPI contract.
- If the backend protects `/api/admin/exercise-config` for admins only, non-admin learners will not be able to load generation options.
- There is no UI display ordering because the backend does not expose an ordering/display-priority field yet.

Recommendation:

- Add a public read-only backend endpoint such as `GET /api/exercise-config` for learner forms.
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
- Prompt saves and deletes refresh audit logs after successful mutation.

Still future scope:

- The UI does not show locked backend prompt-file content; it only edits the database overlay fields exposed by OpenAPI.
- The UI does not list known prompt keys that do not yet have overlays, because OpenAPI only returns existing prompt overlay DTOs.
- There is no prompt version history, rollback, publish state, or diff preview.
- Backend validation errors are shown as plain API messages; there is no field-level validation display.

Recommendation:

- Add a backend endpoint that returns all known prompt keys plus overlay status if admins need to create overlays without manually typing keys.
- Add versioning/rollback before allowing high-risk prompt edits in production.

### 7. Exercise Config Admin UI

Status: implemented as basic CRUD forms.

Implemented:

- Added `AdminService.getExerciseConfig()`.
- Added save methods for levels, topics, and exercise types.
- Added delete support for levels, topics, and exercise types.
- Added an exercise config section under `/app/admin`.
- Admins can select levels, topics, or exercise types, edit code/label/enabled state, and save.
- Topic editing supports `levelCode`.
- Level editing supports `description`.
- Config mutations refresh the config list and audit logs after successful mutation.

Still future scope:

- Delete actions do not require confirmation yet.
- There is no disable-first workflow even though disabling is safer than deleting once learner history exists.
- There is no display ordering.
- There is no validation for code format on the client beyond requiring non-empty code and label.
- The learner option cache was removed, but pages only refresh config when they are loaded.

Recommendation:

- Add confirmation dialogs before delete.
- Make "disable" the primary UI action and keep delete visually secondary.
- Add client-side code validation once backend code rules are finalized.

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

## Recommended Implementation Order

### Phase 1: Stabilize Backend Config Access

- Add or confirm a public read-only exercise config endpoint for learner forms.
- Switch `PracticeConfigService` away from `/api/admin/exercise-config` if admin authorization blocks learners.
- Re-run `npm run api:types` after the backend endpoint is added.

### Phase 2: Improve Admin Prompt UX

- Add a backend read endpoint for all known prompt keys and overlay status.
- Replace manual prompt-key typing with a select/list of known keys.
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

