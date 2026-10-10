import { useEffect, useState } from 'react';
import type { TimingsEvent } from '@shared/schemas';
import { getDebug, warmup } from '@/lib/api';
import { micName } from '@/lib/audio';

export function DebugPanel({ lessonId, timings, log, onClose }: { lessonId: string; timings: TimingsEvent | null; log: string[]; onClose: () => void }) {
  const [warm, setWarm] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  useEffect(() => { navigator.mediaDevices?.enumerateDevices().then((d) => setDevices(d.filter((x) => x.kind === 'audioinput'))).catch(() => {}); }, []);
  const rows: [string, number][] = timings
    ? [['judge', timings.judgeMs], ['rules', timings.rulesMs], ['lines', timings.linesMs], ['tts max', Math.max(0, ...timings.ttsMs)], ['db', timings.dbMs], ['total', timings.totalMs]]
    : [];
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <aside className="debug">
      <button onClick={onClose} style={{ float: 'right' }}>×</button>
      <b>Debug · {lessonId.slice(0, 8)}</b>
      <h3>Last turn</h3>
      {rows.map(([k, v]) => (
        <div className="wf" key={k}><span>{k}</span><div><div className="bar" style={{ width: `${(v / max) * 100}%`, background: '#1F4FA0' }} /></div><span>{Math.round(v)} ms</span></div>
      ))}
      {timings && <pre>{JSON.stringify(timings.models)}</pre>}
      <h3>Mic</h3>
      <div>{micName()}</div>
      <select onChange={(e) => { void import('@/lib/audio').then((m) => { m.closeMic(); return m.openMic(e.target.value); }); }}>
        {devices.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId.slice(0, 8)}</option>)}
      </select>
      <h3>Warm-up</h3>
      <button onClick={() => warmup(true).then(setWarm).catch((e) => setWarm({ error: String(e) }))}>Run</button>
      {warm && <pre>{JSON.stringify(warm, null, 1)}</pre>}
      <h3>Server</h3>
      <button onClick={() => getDebug(lessonId).then(setServer).catch(() => {})}>Load</button>
      {server && <pre>{JSON.stringify(server, null, 1)}</pre>}
      <h3>Events</h3>
      <pre>{log.join('\n')}</pre>
    </aside>
  );
}
