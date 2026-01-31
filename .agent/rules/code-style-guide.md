---
trigger: always_on
---

# Project Overview

This is a React + Vite application for a live streaming platform
(`vidsimu-live`) using Firebase for backend services and Cloudflare R2 for asset
storage.

# Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, DaisyUI, Radix UI (Primitives), Geist Font
  (Typography)
- **Backend**: Firebase (Auth, Firestore, Hosting)
- **Storage**: Cloudflare R2 (for music assets)
- **Video**: HLS.js (via `useVideoDuration`)

# Architecture & Patterns

## Data Fetching & State

- Use **custom hooks** for logic and data fetching (e.g., `usePolls`,
  `useBackgroundMusic`, `useVideoDuration`).
- **Encapsulate** Firestore logic within these hooks; avoid direct Firestore
  calls in components.
- Use `src/lib/collections.ts` for centralized Firestore collection references.

## Key Feature Implementation Rules

### 1. Live Polling

- **Hook**: `usePolls` handles all poll logic (active poll, results, voting).
- **Components**:
  - `AdminPollManager`: For admins to create/manage polls.
  - `PollVoteCard`: For viewers to vote and see results.
- **Data Structure**: Polls are stored in `polls` collection; votes in
  `poll_votes` sub-collection.
- **Persistence**: Store `visitorId` locally and check against `poll_votes` to
  persist voting state across reloads.

### 2. Stream Timing & Duration

- **Validation**: Use strict validation for stream states (Scheduled, Active,
  Ended).
- **Source of Truth**: Prioritize `useVideoDuration` (HLS manifest) ->
  `event.duration` -> Default (60m).
- **Display**: For active streams, show `Current Playback Time / Total Duration`
  (e.g., `00:15:30 / 01:00:00`).

### 3. Background Music (Countdown)

- **Hook**: `useBackgroundMusic` manages playback.
- **Source**: Cloudflare R2 bucket (`VITE_R2_MUSIC_URL`).
- **Sync Logic**:
  - **Deterministic**: Track order and position are calculated based on
    `sessionStartTime`.
  - **Seeded Shuffle**: Tracks are shuffled using the session date as a seed
    (same day = same order).
  - **Start Time**: Music starts exactly 10 minutes before session.
- **Autoplay**: audio must be enabled via user interaction (click). Include
  visual hints if audio is blocked.

### 4. Admin Dashboard

- **Layout**: Sidebar for tools (Chat, Polls, Viewers), Main area for
  Stream/Metrics.
- **Metrics**: Real-time viewer count, Stream health, Message velocity.
- **Offline Analytics**: Implement pure frontend-side JSON export/import. Do not
  use backend storage for generated reports.

### 5. Session Export

- **Mechanism**: Client-side generation of JSON from Firestore queries.
- **Privacy**: No PII permanently stored in export files if possible; use
  anonymized IDs where appropriate.

# UI/UX Standards

- **Aesthetic**: Premium "Dark Mode Only" design. No light mode support. Use
  deep grays, violet accents, and glassmorphism.
- **Typography**: Use Geist Sans for UI and Geist Mono for code/data.
- **Tailwind**: Use utility classes for layout and spacing.
- **DaisyUI**: Use for complex interactive components (Countdown, Modals).
- **Responsiveness**: Ensure mobile-first compatibility for viewer pages.

# Coding Standards

- **TypeScript**: Use strict typing. Avoid `any`.
- **Imports**: Use absolute imports (`@/components/...`).
- **Logging**: Use descriptive console logs for complex logic (e.g.,
  `[Sync Music] ...`) to aid debugging.
