import { createContext, createElement, useContext, useSyncExternalStore, type ReactNode } from 'react';
import { DEFAULT_SETTING, normalizeSetting, withPatch, type ClassSetting } from '@shared/setting';
import { lsGet, lsSet } from './store';

// The class conditions are chosen on the Plan page and remembered here. Stage mode never reads or writes them.
const KEY = 'sabboura.class.v1';
let state: ClassSetting = (() => {
  try { const raw = lsGet(KEY); return raw ? normalizeSetting(JSON.parse(raw)) : DEFAULT_SETTING; } catch { return DEFAULT_SETTING; }
})();
const subs = new Set<() => void>();

export const getClassSetting = () => state;
export function setClassSetting(patch: Partial<Omit<ClassSetting, 'preset'>> | ClassSetting) {
  state = 'preset' in patch && patch.preset !== 'custom' ? normalizeSetting(patch) : withPatch(state, patch);
  lsSet(KEY, JSON.stringify(state));
  subs.forEach((f) => f());
}
/** The remembered choice (for the Plan page). */
export function useStoredSetting(): ClassSetting {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => state);
}

// The setting of the lesson on screen. Components that show a kid read it from here; no provider = the default class.
const Ctx = createContext<ClassSetting>(DEFAULT_SETTING);
export const useSetting = () => useContext(Ctx);
export function SettingProvider({ value, children }: { value: ClassSetting | null | undefined; children: ReactNode }) {
  return createElement(Ctx.Provider, { value: value ?? DEFAULT_SETTING }, children);
}
