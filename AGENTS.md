# SproochenCoach Frontend Agent Instructions

## Scope

These instructions apply to the whole Angular frontend repository.

## Working Style

- Treat the user as a learner building a portfolio project; explain important contract, auth, DTO, and architecture decisions briefly before changing code.
- Debug frontend/backend integration by following the execution flow: component -> service -> HTTP request -> `ApiResponse<T>` unwrap -> UI state.
- Prefer small, focused changes that preserve the current Angular style and avoid unrelated rewrites.
- Do not rewrite working authentication, routing, dashboard, or existing AI integration UI unless the user asks or there is a concrete bug.
- If several valid frontend designs exist, explain the trade-off and recommend the simplest one that keeps the backend contract clear.

## Project Snapshot

- This repository is the Angular frontend for SproochenCoach, an AI-powered Luxembourgish language-learning coach.
- The backend is a Spring Boot API that owns authentication, AI-generated exercises, speaking/listening prompt generation, TTS audio, recording upload, STT transcription, and AI speaking evaluation.
- The frontend should adapt to backend changes through the OpenAPI contract instead of manually guessing DTOs from snippets.

## Technology Stack

- Angular 18, standalone components, Angular Router, Reactive Forms, HttpClient, RxJS, TypeScript strict mode.
- Keep code compatible with the existing Angular standalone-component style.
- Use existing shared models/services until generated OpenAPI types are introduced or the user asks for a type-generation refactor.

## Backend Contract Source of Truth

- Backend OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- Backend Swagger UI: `http://localhost:8080/swagger-ui.html`
- The OpenAPI contract is the source of truth for endpoint paths, request DTOs, response DTOs, enum names, and auth requirements.
- Before changing API calls, DTO interfaces, response unwrapping, or enum values, regenerate or inspect `src/app/api/backend-schema.ts` if it exists.
- If `src/app/api/backend-schema.ts` does not exist and the task touches backend contracts, inspect `/v3/api-docs` directly or recommend adding OpenAPI type generation.
- Do not invent backend endpoint paths, DTO fields, enum values, or response shapes from memory.

## Recommended OpenAPI Type Workflow

- Preferred dev dependency: `openapi-typescript`.
- Recommended script:

```json
{
  "scripts": {
    "api:types": "openapi-typescript http://localhost:8080/v3/api-docs -o src/app/api/backend-schema.ts"
  }
}
```

- Use `npm run api:types` when the backend is running and API contracts changed.
- If the backend is not running, use the latest generated `src/app/api/backend-schema.ts`; if it is missing or stale, state that the contract could not be verified.

## Backend Architecture Context

- Backend package root is `com.nailic.sproochencoach.*`.
- Controllers are thin; backend business logic lives in services.
- REST responses use the generic wrapper `ApiResponse<T>` with `success`, `message`, and `data`.
- Frontend services should unwrap `ApiResponse<T>` consistently and surface `message` on errors.
- Backend uses DTOs at REST boundaries; frontend should not depend on backend JPA entity shapes.

## Authentication Contract

- Authentication identifier is email, not username.
- Login route is `POST /api/users/login`.
- Registration route is `POST /api/users/addUser`.
- OTP routes are `POST /api/users/sendOtp`, `POST /api/users/resendOtp`, and `POST /api/users/verifyOtp`.
- Current auth transport is `Authorization: Bearer <jwt>`, not HttpOnly cookies.
- `/api/users/me` is protected and should be called with the JWT bearer token.
- JWT subject is the user's email. Do not build frontend logic that assumes JWT subject is username.
- New users are disabled until successful OTP verification.

## Exercise Contract

- Text exercise endpoint: `POST /api/exercises/generate`.
- Request DTO is `ExerciseRequestDto` with enum fields:
  - `level`: `A1`, `A2`, `B1`
  - `topic`: backend `TopicEnum`
  - `type`: `TRANSLATION`, `MULTIPLE_CHOICE`, `FILL_IN_THE_BLANK`, `SHORT_ANSWER`
- Current text exercise response DTO is `GeneratedExerciseDto` with `question`, `type`, `options`, `expectedAnswer`, and `hint`.
- Topic enums carry level information on the backend; frontend topic filtering should stay aligned with the backend enum contract.

## Speaking Contract

- Speaking endpoint: `POST /api/exercises/practice`.
- Request body is `ExerciseRequestDto`.
- Response body is `ApiResponse<SpeakingDto>`.
- `SpeakingDto` extends `AudioExerciseDto` and currently adds no extra fields.
- `questionTranslation` is the canonical English translation field. Do not reintroduce older plural names unless OpenAPI shows them.
- `data.audio` is backend `byte[]` serialized as Base64 JSON for short MVP clips.

## Listening Contract

- Listening endpoint: `POST /api/exercises/listening`.
- Request body is `ExerciseRequestDto`.
- Response body is `ApiResponse<AudioExerciseDto>`.
- `AudioExerciseDto` extends `GeneratedExerciseDto` and adds `questionTranslation` plus Base64 `audio`.
- Listening `question` contains the Luxembourgish listening text.
- `questionTranslation` contains the English translation of `question`.
- The frontend should create a playable `Blob` URL from `data.audio`; do not expect a persistent audio URL unless OpenAPI changes.

## Recording Contract

- Recording endpoint: `POST /api/exercises/recording`.
- Request content type is `multipart/form-data`.
- Audio form field name is exactly `audio`.
- Existing frontend behavior may use `recording.webm` with `audio/webm;codecs=opus`.
- Response is a speaking evaluation containing `transcript`, integer `score`, English `feedback`, and `corrections: string[]`.

## Frontend Integration Rules

- Keep HTTP logic in Angular services; keep components focused on form state, UI state, and rendering.
- Do not duplicate endpoint URLs across components. Add or update a service when integrating backend routes.
- Preserve existing `ApiResponse<T>` error handling patterns: failed `success`, missing `data`, and `HttpErrorResponse` should produce useful user-facing errors.
- Normalize backend DTOs at the component/service boundary when the UI needs a stable view model.
- Treat Base64 audio as short-lived UI data: create object URLs for playback and revoke them on replacement or component destroy.
- Prefer backend contract fields over legacy frontend mock fields. Mock/demo data should not drive API DTO design.

## User-Facing UI Rules

- Do not show technical implementation details in learner-facing UI copy, including backend wording, API endpoint paths, DTO names, OpenAPI, provider names, stack traces, or raw payload details.
- Keep technical details in code, generated schemas, logs, documentation, or developer-facing error messages; UI should describe the learner action and recovery path.
- While waiting for backend-generated content, show clear loading text and a subtle animated icon so the interface feels responsive.
- For audio playback, prefer native browser media controls or a maintained audio library. Do not show fake waveforms or play buttons that lack seeking, progress, and basic playback control.

## Validation

- After TypeScript or Angular template changes, run the narrowest useful frontend validation first, usually `npm run build`.
- Do not fix unrelated build warnings or unrelated broken pages unless they block the requested task.
- If backend integration cannot be fully verified because the Spring Boot server is not running, state what was validated locally and what still needs end-to-end testing.
