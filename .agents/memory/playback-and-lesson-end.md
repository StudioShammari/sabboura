---
name: Turn playback and lesson-end rules
description: invariants for client turn playback (onDone, stale turns, barge-in) and the end/score/share contract between classroom, review and server
---

## Client turn playback
- Every public play function (turn, chorus, local failsafe, called-on question) must call `ui.onDone()` exactly once, from a `finally`. Internal helpers (the chorus/failsafe "playback" variants) must not, because the outer function owns it.
- Every UI callback checks `ui.stale()` first; a stale turn must never touch kid cards, captions or phase.
- Barge-in (teacher starts talking or typing over the kids) must apply any held "aha" badge move before clearing timers. Clearing first silently drops the level change on screen while the server already counted it.
**Why:** a full review found phases stuck on "processing" and badges that never moved after interrupting the class. Both came from missing onDone or cleared timers.
**How to apply:** any new playback path or interruption path in the classroom.

## Lesson end / score / share
- Score route answers 409 while a lesson is not ended or its score is still being built; the review page ends the lesson once (never in the shared view) and then polls. Ending is idempotent.
- Lessons with zero turns skip the paid AI judge and use the fixed fallback feedback.
- Bad or unknown ids on the share route must still go through the HTML redirect so the review page shows its "not found" card. Do not turn that route into a JSON 404.
**Why:** a subagent changed share to return JSON 404, which left a blank page. Reverted.

## Verifying classroom notices
- The screenshot tool cannot type, so typing-mode states (notices, undo feedback) need the browser tester or careful code reading. Notices are shown in typing mode too; on phones they sit above the taller typing dock.
