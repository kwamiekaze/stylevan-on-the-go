import type { CSSProperties } from 'react';
import type { ServiceId } from '@/config/services';

/** Animated service illustrations. Each one plays when its stop is active. */
export function ServiceArt({ id, active }: { id: ServiceId; active: boolean }) {
  return <svg viewBox="0 0 200 200" className={`art art-${id}`} data-active={active} role="presentation">
    <defs>
      <linearGradient id={`arch-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--art-a)" /><stop offset="1" stopColor="var(--art-b)" /></linearGradient>
      <clipPath id={`pole-${id}`}><rect x="78" y="52" width="44" height="116" rx="8" /></clipPath>
      <clipPath id={`eye-${id}`}><path d="M28 112 Q100 52 172 112 Q100 168 28 112 Z" /></clipPath>
    </defs>
    <path d="M14 196 L14 96 A86 86 0 0 1 186 96 L186 196 Z" fill={`url(#arch-${id})`} />
    <path d="M14 196 L14 96 A86 86 0 0 1 186 96 L186 196" fill="none" stroke="var(--gold)" strokeWidth="2.5" />
    <g className="art-spark">{[[34, 60], [168, 52], [150, 150], [44, 150]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z`} fill="var(--gold)" style={{ animationDelay: `${i * .35}s` }} />)}</g>
    {id === 'salon' && <g>
      <path className="hair" d="M40 176 C30 130 60 110 52 70" fill="none" stroke="#c39a62" strokeWidth="7" strokeLinecap="round" />
      <g className="sc sc-a"><path d="M100 112 L150 34 L158 42 L108 120 Z" fill="#eee9e4" stroke="#8d7b72" strokeWidth="2" /><path d="M100 112 L78 146" stroke="#4e2a35" strokeWidth="6" strokeLinecap="round" /><circle cx="68" cy="158" r="17" fill="none" stroke="#c39a62" strokeWidth="7" /></g>
      <g className="sc sc-b"><path d="M100 112 L50 34 L42 42 L92 120 Z" fill="#f7f3ef" stroke="#8d7b72" strokeWidth="2" /><path d="M100 112 L122 146" stroke="#4e2a35" strokeWidth="6" strokeLinecap="round" /><circle cx="132" cy="158" r="17" fill="none" stroke="#c39a62" strokeWidth="7" /></g>
      <circle cx="100" cy="112" r="6" fill="#c39a62" />
    </g>}
    {id === 'barber' && <g>
      <rect x="74" y="170" width="52" height="14" rx="5" fill="#c39a62" /><rect x="74" y="36" width="52" height="16" rx="6" fill="#c39a62" /><circle cx="100" cy="30" r="9" fill="#e6c48a" />
      <rect x="78" y="52" width="44" height="116" rx="8" fill="#fffaf4" />
      <g clipPath={`url(#pole-${id})`}><g className="stripes">{Array.from({ length: 11 }).map((_, n) => { const i = n - 2; return <path key={n} d={`M70 ${22 + i * 40} L130 ${-8 + i * 40} L130 ${12 + i * 40} L70 ${42 + i * 40} Z`} fill={n % 2 ? '#3d4f7a' : '#d1344c'} />; })}</g></g>
      <rect x="78" y="52" width="44" height="116" rx="8" fill="none" stroke="#c39a62" strokeWidth="3" /><rect x="84" y="58" width="7" height="104" rx="3.5" fill="#fff" opacity=".45" />
      <g transform="translate(142 120) rotate(22)"><rect width="12" height="44" rx="4" fill="#4e2a35" /><path d="M0 0 L12 0 L6 -18 Z" fill="#e7e2dd" stroke="#8d7b72" /></g>
    </g>}
    {id === 'nails' && <g>
      {/* hand with freshly painted nails, holding a polish brush */}
      <g transform="rotate(12 92 150)">
        <rect x="54" y="106" width="74" height="72" rx="26" fill="#b97b5c" />
        <ellipse cx="50" cy="140" rx="10" ry="22" transform="rotate(-32 50 140)" fill="#b97b5c" />
        {[[56, 66], [73, 52], [90, 60], [107, 78]].map(([x, top], i) => <g key={i}>
          <rect x={x} y={top} width="16" height={122 - top} rx="8" fill="#b97b5c" />
          <rect className="nailgloss" x={x + 2} y={top + 2} width="12" height="16" rx="6" fill="#e07ab8" />
          <rect x={x + 4} y={top + 4} width="3" height="9" rx="1.5" fill="#fff" opacity=".55" />
          <path d={`M${x + 8} ${top + 34} L${x + 8} ${top + 44}`} stroke="#8a553d" strokeWidth="1.2" strokeLinecap="round" opacity=".45" />
        </g>)}
        <path d="M60 128 Q92 140 122 128" fill="none" stroke="#8a553d" strokeWidth="1.4" strokeLinecap="round" opacity=".35" />
      </g>
      <g className="brush" transform="translate(154 0) rotate(-6)">
        <rect x="-6" y="92" width="12" height="82" rx="6" fill="#e07ab8" stroke="#b9578f" strokeWidth="1.5" />
        <rect x="-8" y="76" width="16" height="18" rx="4" fill="#c39a62" />
        <path d="M-7 78 C-9 58 -3 42 0 34 C3 42 9 58 7 78 Z" fill="#e07ab8" stroke="#b9578f" strokeWidth="1.5" />
        <rect x="-3" y="48" width="2.5" height="22" rx="1.2" fill="#fff" opacity=".5" />
      </g>
    </g>}
    {id === 'lashes' && <g>
      <g className="lashes">{Array.from({ length: 9 }).map((_, i) => { const t = i / 8, x = 38 + t * 124, y = 100 - Math.sin(t * Math.PI) * 38 + 4; const dx = (t - .5) * 26; return <path key={i} d={`M${x} ${y} Q${x + dx * .4} ${y - 26} ${x + dx + 6} ${y - 34}`} fill="none" stroke="#2b1a20" strokeWidth="4.5" strokeLinecap="round" />; })}</g>
      <path d="M28 112 Q100 52 172 112 Q100 168 28 112 Z" fill="#fffaf4" stroke="#4e2a35" strokeWidth="4" />
      <g clipPath={`url(#eye-${id})`}><circle cx="100" cy="112" r="27" fill="#b98a73" /><circle cx="100" cy="112" r="14" fill="#2b1a20" /><circle cx="108" cy="104" r="6" fill="#fff" /><rect className="lid" x="20" y="40" width="160" height="82" fill="#f3d3cf" /></g>
      <path d="M28 112 Q100 52 172 112" fill="none" stroke="#4e2a35" strokeWidth="5" strokeLinecap="round" />
      <path d="M34 60 Q100 26 166 58" fill="none" stroke="#c39a62" strokeWidth="5" strokeLinecap="round" opacity=".8" />
    </g>}
  </svg>;
}

const LABEL: Record<string, string> = { salon: 'At your home', barber: 'At your office', nails: 'At your party', lashes: 'At your hotel', home: 'Your door' };

/** Small top-down places the van visits, drawn to match the van's point of view. */
export function Destination({ id, style, active }: { id: ServiceId | 'home'; style: CSSProperties; active: boolean }) {
  return <div className="dest" style={style} data-active={active}>
    <svg viewBox="0 0 240 220" aria-hidden="true">
      <rect x="6" y="6" width="228" height="196" rx="34" fill="var(--lawn)" />
      {id === 'salon' || id === 'home' ? <g>
        <rect x="56" y="44" width="128" height="92" rx="8" fill="#fff6ee" stroke="#d9c6b6" strokeWidth="2" /><path d="M50 90 L120 40 L190 90 L190 132 L50 132 Z" fill="none" />
        <path d="M50 92 L120 42 L120 136 L50 136 Z" fill="#e9b4b8" /><path d="M190 92 L120 42 L120 136 L190 136 Z" fill="#f2cbce" /><line x1="120" y1="42" x2="120" y2="136" stroke="#c97d8a" strokeWidth="2" />
        <rect x="150" y="50" width="14" height="18" fill="#b9a697" /><path d="M96 150 L144 150 L152 202 L88 202 Z" fill="#efe3d6" />
        {[[24, 170], [206, 160], [30, 40]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="15" fill="#9fc48f" />)}
      </g> : null}
      {id === 'barber' ? <g>
        <rect x="40" y="36" width="160" height="112" rx="8" fill="#e3e7ee" stroke="#b9c1cf" strokeWidth="2" />
        {Array.from({ length: 4 }).flatMap((_, r) => Array.from({ length: 6 }).map((__, c) => <rect key={`${r}${c}`} x={50 + c * 24} y={46 + r * 24} width="16" height="14" rx="2" fill="#a7bad4" />))}
        <rect x="150" y="100" width="36" height="36" rx="5" fill="#cfd6e0" stroke="#b9c1cf" />
        <rect x="80" y="160" width="80" height="36" rx="6" fill="#d6dde5" />{[[24, 176], [214, 176]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="13" fill="#9fc48f" />)}
      </g> : null}
      {id === 'nails' ? <g>
        <circle cx="110" cy="104" r="64" fill="#f7d5d8" />{Array.from({ length: 8 }).map((_, i) => <path key={i} d={`M110 104 L${110 + 64 * Math.cos((i / 8) * Math.PI * 2)} ${104 + 64 * Math.sin((i / 8) * Math.PI * 2)} A64 64 0 0 1 ${110 + 64 * Math.cos(((i + 1) / 8) * Math.PI * 2)} ${104 + 64 * Math.sin(((i + 1) / 8) * Math.PI * 2)} Z`} fill={i % 2 ? '#fff6ee' : '#f0b9bd'} />)}
        <circle cx="110" cy="104" r="9" fill="#c39a62" />
        {[[190, 52, '#e6c48a'], [204, 92, '#f0a6b1'], [182, 132, '#fff6ee']].map(([x, y, c], i) => <g key={i}><circle cx={x as number} cy={y as number} r="13" fill={c as string} stroke="#c39a62" strokeWidth="1.5" /><circle cx={(x as number) - 4} cy={(y as number) - 4} r="3.5" fill="#fff" opacity=".7" /></g>)}
      </g> : null}
      {id === 'lashes' ? <g>
        <rect x="36" y="34" width="168" height="100" rx="10" fill="#f6ece2" stroke="#d9c6b6" strokeWidth="2" /><rect x="52" y="50" width="88" height="60" rx="12" fill="#9ec9e3" stroke="#fff" strokeWidth="4" />
        <rect x="150" y="50" width="42" height="26" rx="4" fill="#e9b4b8" /><rect x="150" y="84" width="42" height="26" rx="4" fill="#fff" stroke="#e9d9cf" />
        <rect x="70" y="150" width="100" height="40" rx="7" fill="#efe3d6" />{[[22, 168], [216, 40]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="13" fill="#9fc48f" />)}
      </g> : null}
      {id === 'home' ? <path d="M120 10 C100 -10 70 14 120 52 C170 14 140 -10 120 10 Z" fill="#d9707f" className="dest-heart" /> : null}
    </svg>
    <span className="dest-label">{LABEL[id]}</span>
  </div>;
}
