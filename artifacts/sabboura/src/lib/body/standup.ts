// Stand-up mode choices on this device (off by default). Stored in localStorage; storage errors are ignored.
import { useSyncExternalStore } from 'react';
import type { Calib } from './features';

export interface StandupPrefs {
  /** The Plan page switch. */
  on: boolean;
  /** Talk without pressing anything (voice starts and stops the recording). */
  handsFree: boolean;
  /** Quiet live nudges on the self-view tile. */
  nudges: boolean;
}
const KEY = 'sabboura.standup.v1';
const defaults: StandupPrefs = { on: false, handsFree: false, nudges: true };

function load(): StandupPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* storage blocked */ }
  return { ...defaults };
}
let state = load();
const subs = new Set<() => void>();
export const getStandup = () => state;
export function setStandup(p: Partial<StandupPrefs>) {
  state = { ...state, ...p };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  subs.forEach((f) => f());
}
export function useStandup(): StandupPrefs {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => state);
}

/** The calibration pose belongs to one lesson (kept on this device only). */
const calibKey = (lessonId: string) => `sabboura.calib.${lessonId}`;
export function saveCalib(lessonId: string, c: Calib) {
  try { localStorage.setItem(calibKey(lessonId), JSON.stringify(c)); } catch { /* ignore */ }
}
export function loadCalib(lessonId: string): Calib | null {
  try {
    const raw = localStorage.getItem(calibKey(lessonId));
    return raw ? (JSON.parse(raw) as Calib) : null;
  } catch { return null; }
}
