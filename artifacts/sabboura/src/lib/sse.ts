import type { TurnEvent } from '@shared/schemas';

/** POST /turn and read SSE with fetch + a stream reader (never EventSource). Falls back to the JSON shape. */
export function streamTurn(
  lessonId: string,
  body: { text: string; source: string; teacherSeconds: number; clientTurnId: string },
  onEvent: (ev: TurnEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  return streamPost(`/api/lessons/${lessonId}/turn`, body, onEvent, signal);
}

/** A kid with a raised hand has been called on. */
export function streamCallOn(lessonId: string, kid: string, onEvent: (ev: TurnEvent) => void, signal?: AbortSignal): Promise<void> {
  return streamPost(`/api/lessons/${lessonId}/call-on`, { kid }, onEvent, signal);
}

async function streamPost(path: string, body: unknown, onEvent: (ev: TurnEvent) => void, signal?: AbortSignal): Promise<void> {
  const res = await fetch(path, {
    method: 'POST', signal,
    headers: { Accept: 'text/event-stream', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    if (!res.ok) throw new Error('turn failed');
    const j = await res.json();
    for (const ev of j.events ?? []) onEvent(ev);
    return;
  }
  if (!res.ok || !ct.includes('text/event-stream') || !res.body) throw new Error('bad turn response');
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = '';
  const emit = (chunk: string) => {
    let event = '';
    const data: string[] = [];
    for (const line of chunk.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
    }
    if (!event || !data.length) return;
    let parsed: unknown;
    try { parsed = JSON.parse(data.join('\n')); } catch { return; }
    onEvent({ event, data: parsed } as TurnEvent);
  };
  try {
  for (;;) {
    const { value, done } = await reader.read();
    buf = (buf + (value ?? '')).replace(/\r\n/g, '\n');
    let i: number;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const chunk = buf.slice(0, i);
      buf = buf.slice(i + 2);
      emit(chunk);
    }
    if (done) { if (buf.trim()) emit(buf); break; }
  }
  } finally { reader.releaseLock(); }
}
