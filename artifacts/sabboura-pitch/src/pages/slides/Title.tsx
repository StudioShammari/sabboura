import { LogoMark } from '@/components/Logo';
import { SlideShell, asset } from '@/components/SlideShell';

const KIDS = ['omar', 'lina', 'sara', 'khaled', 'yazan'];

export default function Title() {
  return (
    <SlideShell n={1} bare>
      <div className="flex flex-col items-center h-full">
        <div className="w-full" style={{ maxWidth: '80cqw', marginTop: '0.6cqw' }}>
          <div
            className="board flex flex-col items-center justify-center text-center"
            style={{ height: '33cqw', padding: '2.4cqw 4cqw' }}
          >
            <div className="flex items-center" style={{ gap: '2.2cqw' }}>
              <LogoMark size="9.5cqw" />
              <div className="flex flex-col items-start" style={{ lineHeight: 1 }}>
                <span
                  lang="ar"
                  dir="rtl"
                  style={{
                    fontFamily: 'var(--font-display-family)',
                    fontWeight: 800,
                    fontSize: '7.6cqw',
                    lineHeight: 1.05,
                    color: 'var(--chalk)',
                  }}
                >
                  سبّورة
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: '1.7cqw',
                    letterSpacing: '0.22em',
                    color: 'var(--chalk-dim)',
                    marginTop: '0.2cqw',
                  }}
                >
                  SABBOURA
                </span>
              </div>
            </div>

            <div
              style={{
                width: '22cqw',
                height: '0.16cqw',
                background: 'var(--chalk-dim)',
                margin: '2.2cqw 0 1.9cqw',
                borderRadius: 999,
              }}
            />

            <p
              lang="ar"
              dir="rtl"
              className="chalk-font"
              style={{ fontSize: '3.5cqw', lineHeight: 1.35, color: 'var(--chalk-yellow)', margin: 0 }}
            >
              «درّب حالك قبل ما تدخل الصف»
            </p>
            <p style={{ fontSize: '1.8cqw', fontWeight: 500, color: 'var(--chalk)', margin: '0.6cqw 0 0' }}>
              Practise your lesson before you teach it.
            </p>
          </div>
          <div className="ledge">
            <span className="ledge-chalk" style={{ right: '9cqw' }} />
            <span className="ledge-chalk" style={{ right: '13.4cqw', width: '2cqw', background: 'var(--chalk-yellow)' }} />
          </div>
        </div>

        <div className="flex items-end justify-between w-full" style={{ maxWidth: '80cqw', marginTop: 'auto' }}>
          <div>
            <h1 className="h-display" style={{ fontSize: '3.2cqw' }}>
              A flight simulator for teachers.
            </h1>
            <p style={{ fontSize: '1.4cqw', fontWeight: 600, margin: '0.7cqw 0 0', color: 'var(--ink)' }}>
              Mustafa Al Shammari · Yousef Al Masri · Ahmad Shadeed
            </p>
            <p className="body" style={{ fontSize: '1.15cqw', marginTop: '0.2cqw' }}>
              Princess Sumaya University for Technology (PSUT), Amman
            </p>
          </div>
          <div className="flex" style={{ gap: '0.6cqw' }}>
            {KIDS.map((k) => (
              <span key={k} className="avatar" style={{ width: '4.6cqw', height: '4.6cqw', border: '0.12cqw solid var(--line)' }}>
                <img src={asset(`kids/${k}-neutral.webp`)} alt="" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
