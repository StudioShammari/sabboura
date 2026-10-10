export const now = () => performance.now();
export const since = (t0: number) => Math.round(performance.now() - t0);
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function withTimeout<T>(p: Promise<T>, ms: number, label = 'timeout'): Promise<T> {
  let t: NodeJS.Timeout;
  return Promise.race([
    p.finally(() => clearTimeout(t)),
    new Promise<T>((_, rej) => {
      t = setTimeout(() => rej(new Error(label)), ms);
    }),
  ]);
}
