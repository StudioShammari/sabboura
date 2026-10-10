// Stand-up mode: EVERY threshold for body language, in one place so they can be tuned (see /dev/body).
// Distances are in shoulder widths; times in ms; angles in degrees; percentages 0-100.
// Body language notes are tips only. Nothing here ever touches the judge, the badges, the kids, the plan checklist or the score.

export const BODY_RULES = {
  detector: {
    /** Target frame rate, and the slower rate used when a frame takes too long. */
    fps: 12,
    slowFps: 6,
    slowFrameMs: 25,
    /** FaceLandmarker refines head direction only when the face is at least this wide on camera. */
    faceMinPx: 80,
    /** A frame gap longer than this (tab hidden, slow device) counts as this much time at most. */
    maxGapMs: 250,
  },
  visibility: {
    /** A landmark counts as seen at or above this visibility. */
    seen: 0.5,
    /** handsHidden: a wrist below this visibility counts as out of sight. */
    wristHidden: 0.4,
  },
  light: {
    /** Mean brightness (0-255) below this is too dark. */
    darkMean: 55,
    /** Backlit: the edges are brighter than the middle by this much, and the middle is dim. */
    backlitDiff: 55,
    backlitCenter: 100,
  },
  backTurned: { minMs: 1000 },
  headDown: {
    /** Head pitched this far below the calibration pose (face landmarks). */
    pitchDeg: 15,
    /** The same drop measured from the pose: the nose falls below the eye–ear line by this many shoulder widths more than at calibration. */
    noseDrop: 0.07,
  },
  lookingAway: {
    yawDeg: 35,
    /** Pose estimate of yaw: nose offset from the ears' midpoint, in ear widths, beyond calibration. */
    yawProxy: 0.45,
    /** Turned sideways: shoulder width below this share of calibration (relative to torso height when the hips show). */
    shoulderRatio: 0.6,
  },
  handsTogether: {
    /** Wrists closer than this, between shoulders and hips, in front of the torso (holding paper or a phone). */
    maxGap: 0.5,
    /** Wrists may sit this far outside the shoulders, sideways, and still be "in front of the torso". */
    sideMargin: 0.25,
    /** "In front": the wrists' depth is at most this far behind the shoulders' (pose z, in shoulder widths). */
    frontZ: 0.1,
  },
  handsHidden: {
    /** A wrist this close to its hip counts as in a pocket. */
    nearHip: 0.35,
    minMs: 5000,
  },
  armsCrossed: {
    /** Each wrist within this distance of the opposite elbow. */
    nearElbow: 0.6,
    minMs: 3000,
  },
  gesturing: {
    /** Shoulder widths per second. */
    speed: 0.6,
    /** Smoothing window for wrist speed. */
    smoothMs: 300,
  },
  faceTouch: {
    nearNose: 0.5,
    /** Two touches at least this far apart count separately. */
    gapMs: 1500,
  },
  /** Where the hips probably are when they are out of view (below the shoulders, in shoulder widths). */
  hipGuess: 1.5,
  turn: {
    /** The window at the end of a turn (questions usually come at the end). */
    lastMs: 3000,
  },
  notes: {
    /** Only turns where the teacher was in frame for at least this share of talking time count. */
    minSeenPct: 60,
    /** "asking": the last 3 s count as looking away when one of the flags covers at least this much of them. */
    lastPct: 50,
    backPct: 20,
    readingHeadDownPct: 50,
    readingHandsPct: 40,
    lookingDownPct: 50,
    pocketsPct: 50,
    crossedPct: 30,
    stillPct: 5,
    stillMinTalkMs: 30000,
    nonstopPct: 80,
    faceTouches: 5,
    maxNotes: 3,
    /** Strength: facing the class for at least this share of the lesson. */
    facingStrengthPct: 85,
  },
  live: {
    /** Live nudge chip: shown for this long, at most once per turn. */
    showMs: 3000,
    /** Reading nudge: head down with hands together for this long. */
    readingMs: 3000,
  },
};

export type BodyRules = typeof BODY_RULES;

/** A deep copy of the defaults (the /dev/body sliders change a copy, never the module). */
export const cloneRules = (r: BodyRules = BODY_RULES): BodyRules => JSON.parse(JSON.stringify(r));
