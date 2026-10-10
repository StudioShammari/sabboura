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
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value.replace(/\r\n/g, '\n');
    let i: number;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const chunk = buf.slice(0, i);
      buf = buf.slice(i + 2);
      let event = '', data = '';
      for (const line of chunk.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (!event || !data) continue;
      try { onEvent({ event, data: JSON.parse(data) } as TurnEvent); } catch { /* ignore malformed */ }
    }
  }
}
