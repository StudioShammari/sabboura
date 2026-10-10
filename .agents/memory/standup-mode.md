---
name: Stand-up mode design decisions
description: Camera/body-language feature choices and accepted limitations; read before touching stand-up mode, body notes or the camera
---
- Body notes are computed server-side by one shared pure function; copy lives in i18n; test:body checks note kinds only (not wording).
**Why:** keeps the review card and the test on the same logic; wording can change without breaking tests.

- Calibration lives in detector memory during Plan, then is saved per lesson in localStorage in the Classroom. Closing camera setup without calibrating turns stand-up off. "Teach it again" on a stand-up lesson routes back to the Plan page instead of creating a lesson directly.
**Why:** the camera must be set up and calibrated again each session; the camera never runs unless stand-up is on.

- The headless screenshot browser can use Chromium's fake camera (`--use-fake-device-for-media-stream`): models load and the modal renders, but there is no person, so calibration always fails there. Real body detection is unverifiable headless; rely on the synthetic test:body cases.

- Accepted limitations (user-visible, agreed): hands-free has no pre-roll buffer (first syllable may clip); body numbers for a turn are lost if the teacher barges in before the turn's state event.

- CSS gotcha: `.turn-chip` already belongs to PlanVsLesson; body-notes chips use their own class so the plan card styling stays unchanged.
