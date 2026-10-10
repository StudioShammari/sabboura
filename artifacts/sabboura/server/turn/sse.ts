import type { Request, Response } from 'express';
import type { TurnEvent } from '../../shared/schemas';

export function openSSE(req: Request, res: Response) {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.socket?.setNoDelay(true);
  const ac = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) ac.abort();
  });
  const ping = setInterval(() => {
    if (!res.writableEnded) res.write(': ping\n\n');
  }, 5000);
  return {
    signal: ac.signal,
    send(ev: TurnEvent) {
      if (res.writableEnded || ac.signal.aborted) return;
      res.write(`event: ${ev.event}\ndata: ${JSON.stringify(ev.data)}\n\n`);
    },
    end() {
      clearInterval(ping);
      if (!res.writableEnded) res.end();
    },
  };
}
