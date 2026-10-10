export function Frac({ n, d }: { n: number | string; d: number | string }) {
  return (
    <bdi dir="ltr" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle', lineHeight: 1, margin: '0 .15em', fontSize: '.85em' }}>
      <span style={{ borderBottom: '2px solid currentColor', padding: '0 .2em .1em' }}>{n}</span>
      <span style={{ paddingTop: '.1em' }}>{d}</span>
    </bdi>
  );
}
