import { asset } from './asset';

interface LogoMarkProps {
  size: string;
  className?: string;
}

/** Sabboura app icon: a framed chalkboard with a chalk paper plane. */
export function LogoMark({ size, className }: LogoMarkProps) {
  return (
    <img
      src={asset('brand/sabboura-icon.png')}
      width={size}
      height={size}
      className={className}
      alt="Sabboura logo"
      style={{ display: 'block', flex: 'none', width: size, height: size }}
    />
  );
}

/** Icon + bilingual wordmark (سبّورة / Sabboura), light text for dark backgrounds. */
export function LogoLockupOnDark({ width }: { width: string }) {
  return (
    <img
      src={asset('brand/sabboura-lockup-dark.png')}
      alt="Sabboura · سبّورة"
      style={{ display: 'block', width, height: 'auto' }}
    />
  );
}
