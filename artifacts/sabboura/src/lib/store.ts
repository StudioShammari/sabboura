import { useSyncExternalStore } from 'react';
import type { Lang, Title } from '@shared/data';

export interface Settings { lang: Lang; title: Title; topicId: string; calm: boolean; tap: boolean; sfx: boolean }
const KEY = 'sabboura.settings.v1';
const defaults: Settings = { lang: 'ar', title: 'miss', topicId: 'fractions', calm: false, tap: false, sfx: true };

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* storage blocked */ }
  return { ...defaults };
}
let state: Settings = load();
const subs = new Set<() => void>();

export function applyDocument() {
  const el = document.documentElement;
  el.lang = state.lang;
  el.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  document.body.classList.toggle('calm', state.calm);
  if (new URLSearchParams(location.search).get('motion') === 'full') el.classList.add('motion-full');
}

export function setSettings(patch: Partial<Settings>) {
  state = { ...state, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  applyDocument();
  subs.forEach((f) => f());
}
export const getSettings = () => state;
export function useSettings(): Settings {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => state);
}

export const lsGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
export const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
export function deviceId(): string {
  let id = lsGet('sabboura.device');
  if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); lsSet('sabboura.device', id); }
  return id;
}
