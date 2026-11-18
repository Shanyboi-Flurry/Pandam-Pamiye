import { useId } from 'react'
import { LEVELS } from '../lib/constants'
import { useDark } from './ui'

/* ---------- small pieces ---------- */
const Leaf = ({ x, y, flip = 1, s = 1, fill, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip * s} ${s})`}>
    <path d="M0 0Q-22-16-30 0Q-12 10 0 0Z" fill={fill} />
    <path d="M-2 0Q-14-4-25-1" stroke="#0f5132" strokeOpacity=".35" strokeWidth="1" fill="none" />
  </g>
)

const Cloud = ({ x, y, s = 1, o = 0.9 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <g className="drift">
      <ellipse cx="0" cy="0" rx="18" ry="7" fill="#fff" />
      <circle cx="-7" cy="-5" r="8" fill="#fff" />
      <circle cx="6" cy="-7" r="10" fill="#fff" />
    </g>
  </g>
)

const Grass = ({ x, y, s = 1, c = '#2fb86c' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g className="sway"><path d="M-6 0Q-8-9-11-14M-2 0Q-2-12 0-18M3 0Q5-9 9-13M7 0Q8-6 12-8" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" /></g>
  </g>
)

const Flower = ({ x, y, s = 1, c = '#f472b6', center = '#fde047' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 0Q-1-8 0-15" stroke="#2f9e57" strokeWidth="2" fill="none" />
    {[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cx="0" cy="-19" rx="2.6" ry="4" fill={c} transform={`rotate(${r} 0 -15)`} />)}
    <circle cx="0" cy="-15" r="2.4" fill={center} />
  </g>
)

const Pebble = ({ x, y, s = 1, c = '#8d8d99' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx="0" cy="0" rx="7" ry="4.5" fill={c} />
    <ellipse cx="-2" cy="-1.5" rx="3" ry="1.6" fill="#fff" opacity=".25" />
  </g>
)

const Mushroom = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-2" y="-7" width="4" height="7" rx="1.5" fill="#f5e6c8" />
    <path d="M-8-6Q0-18 8-6Z" fill="#e5484d" />
    <circle cx="-3" cy="-9" r="1.2" fill="#fff" />
    <circle cx="3" cy="-8" r="1" fill="#fff" />
  </g>
)

const Butterfly = ({ x, y, s = 1, c = '#fb923c' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g className="bob">
      <ellipse cx="-4" cy="-2" rx="4.5" ry="3" fill={c} className="flap" />
      <ellipse cx="4" cy="-2" rx="4.5" ry="3" fill={c} className="flap" />
      <ellipse cx="-3" cy="2" rx="3" ry="2.2" fill={c} opacity=".8" />
      <ellipse cx="3" cy="2" rx="3" ry="2.2" fill={c} opacity=".8" />
      <rect x="-.7" y="-4" width="1.4" height="9" rx=".7" fill="#3b2a1a" />
    </g>
  </g>
)

const Bird = ({ x, y, s = 1 }) => (
  <path d={`M${x - 7 * s} ${y}Q${x - 3.5 * s} ${y - 5 * s} ${x} ${y}Q${x + 3.5 * s} ${y - 5 * s} ${x + 7 * s} ${y}`} stroke="#1e293b" strokeWidth={1.6 * s} strokeLinecap="round" fill="none" opacity=".75" />
)

const Star = ({ x, y, r = 1.4, d = 0 }) => <circle cx={x} cy={y} r={r} fill="#fff" className="twinkle" style={{ animationDelay: `${d}s` }} />

const Sun = ({ x, y, r = 12, rays = true }) => (
  <g>
    <circle cx={x} cy={y} r={r * 1.9} fill="#fde68a" opacity=".25" />
    {rays && (
      <g className="spin" style={{ transformOrigin: `${x}px ${y}px` }}>
        {[...Array(10)].map((_, i) => (
          <rect key={i} x={x - 1.3} y={y - r * 1.7} width="2.6" height={r * 0.55} rx="1.3" fill="#fde047" opacity=".7" transform={`rotate(${i * 36} ${x} ${y})`} />
        ))}
      </g>
    )}
    <circle cx={x} cy={y} r={r} fill="#fbbf24" />
    <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.45} fill="#fde68a" opacity=".7" />
  </g>
)

const Tree = ({ x, y, s = 1, c1 = '#22a455', c2 = '#1e9a4d', c3 = '#34d17a', fruit, detail }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {detail && <ellipse cx="0" cy="2" rx="32" ry="5" fill="#000" opacity=".18" />}
    {detail && <path d="M-5 0Q-14 2-20 4M5 0Q14 2 20 4" stroke="#6b4423" strokeWidth="3.5" strokeLinecap="round" fill="none" />}
    <path d="M-6 0Q-4-26-5-46H5Q4-26 6 0Z" fill="#8b5a2b" />
    {detail && <path d="M-1 -4V-40M2 -10V-34" stroke="#5e3b1c" strokeWidth="1.2" strokeLinecap="round" opacity=".6" />}
    {detail && <path d="M0-30L-14-46M0-34L13-50" stroke="#8b5a2b" strokeWidth="4" strokeLinecap="round" />}
    <circle cx="-20" cy="-50" r="20" fill={c2} />
    <circle cx="20" cy="-50" r="20" fill={c2} />
    <circle cx="0" cy="-66" r="26" fill={c1} />
    <circle cx="-6" cy="-76" r="14" fill={c3} opacity=".7" />
    {detail && <circle cx="-26" cy="-56" r="9" fill={c3} opacity=".35" />}
    {detail && <circle cx="22" cy="-44" r="7" fill="#0f5132" opacity=".18" />}
    {fruit && [[-18, -56], [14, -72], [24, -46], [-4, -46], [-30, -44], [4, -88]].map(([a, b]) => (
      <g key={a}><circle cx={a} cy={b} r="3.6" fill="#f2c24b" /><circle cx={a - 1} cy={b - 1} r="1.1" fill="#fff" opacity=".7" /></g>
    ))}
  </g>
)

const Pine = ({ x, y, s = 1, c = '#17794a' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx="0" cy="1" rx="14" ry="3" fill="#000" opacity=".18" />
    <rect x="-3" y="-14" width="6" height="14" fill="#6b4423" />
    <path d="M0-76L-17-44H17Z" fill={c} />
    <path d="M0-62L-22-28H22Z" fill={c} />
    <path d="M0-46L-27-12H27Z" fill={c} />
    <path d="M0-76L8-52L0-48Z" fill="#fff" opacity=".12" />
  </g>
)

/* ---------- theme-aware sky: sun by day, moon and stars by night ---------- */
const ease = 'transform 1.4s cubic-bezier(.5,0,.2,1), opacity 1.1s ease'
function Sky({ dark, stage }) {
  const id = useId().replace(/:/g, '')
  const fade = (on) => ({ opacity: on ? 1 : 0, transition: 'opacity 1.1s ease' })
  return (
    <>
      <defs>
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a98d8" /><stop offset="1" stopColor="#bfe6f7" /></linearGradient>
        <linearGradient id={`${id}n`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#070f33" /><stop offset="1" stopColor="#1d3a7c" /></linearGradient>
        <mask id={`${id}m`}><rect x="0" y="0" width="200" height="200" fill="#fff" /><circle cx="166" cy="33" r="11" fill="#000" /></mask>
      </defs>
      <rect x="-60" y="-60" width="320" height="320" fill={`url(#${id}d)`} />
      <rect x="-60" y="-60" width="320" height="320" fill={`url(#${id}n)`} style={fade(dark)} />

      <g style={fade(dark)}>
        {[[30, 40, 1.6, 0], [62, 24, 1.2, .6], [96, 50, 1, 1.1], [134, 24, 1.5, .3], [176, 70, 1.2, .9], [150, 90, 1, 1.4], [44, 84, 1.1, .2], [110, 22, 1, .8], [78, 70, 1, 1.6]].map(([a, b, r, d]) => <Star key={a} x={a} y={b} r={r} d={d} />)}
        <g className="shoot" opacity="0"><path d="M20 20L44 32" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" /></g>
      </g>

      {/* moon rises when it gets dark, the sun sets */}
      <g style={{ transform: `translateY(${dark ? 0 : 90}px)`, opacity: dark ? 1 : 0, transition: ease }}>
        <circle cx="158" cy="38" r="26" fill="#fef3c7" opacity=".12" className="animate-pulse" />
        <circle cx="158" cy="38" r="18" fill="#fef3c7" opacity=".14" />
        <circle cx="158" cy="38" r="14" fill="#fef3c7" mask={`url(#${id}m)`} />
      </g>
      <g style={{ transform: `translateY(${dark ? 90 : 0}px)`, opacity: dark ? 0 : 1, transition: ease }}>
        <Sun x={158} y={40} r={12 + (stage > 2 ? 1 : 0)} />
      </g>

      <g style={{ opacity: dark ? 0.28 : 1, transition: 'opacity 1.1s ease' }}>
        <Cloud x={42} y={46} s={1.05} />
        <Cloud x={112} y={26} s={.75} o={.85} />
        {stage > 1 && <Cloud x={150} y={78} s={.6} o={.7} />}
      </g>
      {stage > 2 && (
        <g style={fade(!dark)}>
          <Bird x={74} y={66} s={1} />
          <Bird x={92} y={56} s={.8} />
          {stage > 3 && <Bird x={108} y={64} s={.7} />}
        </g>
      )}
    </>
  )
}

// One drawing per level: seed, sprout, sapling, tree, forest. Each one adds more life than the last.
export function GrowthScene({ stage, className, compact }) {
  const dark = useDark()
  const mound = (
    <>
      <ellipse cx="100" cy="172" rx="90" ry="22" fill="#4a2f1b" />
      <ellipse cx="100" cy="165" rx="82" ry="17" fill="#7a5233" />
      <ellipse cx="100" cy="161" rx="70" ry="9" fill="#8d6038" opacity=".7" />
      {[[52, 168], [74, 173], [126, 171], [150, 166], [100, 176], [34, 170]].map(([a, b]) => <circle key={a} cx={a} cy={b} r="1.6" fill="#4a2f1b" opacity=".7" />)}
    </>
  )
  const lawn = <ellipse cx="100" cy="163" rx="82" ry="16" fill="#2f8f4e" />
  return (
    <svg viewBox={compact ? '20 30 160 160' : '0 0 200 200'} role="img" aria-label={`${LEVELS[stage].name} stage`} className={className} preserveAspectRatio="xMidYMid slice">
      <Sky dark={dark} stage={stage} />
      {stage === 0 && (
        <>
          {mound}
          <Pebble x={46} y={160} s={1} />
          <Pebble x={158} y={165} s={.8} c="#7b7b88" />
          <Grass x={28} y={166} s={.8} c="#1d7a45" />
          <Grass x={170} y={168} s={.7} c="#1d7a45" />
          <circle cx="100" cy="146" r="26" fill="#f2c24b" opacity=".16" className="animate-pulse" />
          <circle cx="100" cy="146" r="16" fill="#f2c24b" opacity=".18" className="animate-pulse" />
          <g className="grow-in">
            <ellipse cx="100" cy="150" rx="11" ry="16" fill="#c98a4b" transform="rotate(-20 100 150)" />
            <ellipse cx="97" cy="145" rx="4" ry="7" fill="#e3ad72" transform="rotate(-20 97 145)" opacity=".8" />
            <path d="M95 142Q98 136 103 138" stroke="#f1c48f" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M101 152L99 160" stroke="#fff" strokeOpacity=".55" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        </>
      )}
      {stage === 1 && (
        <>
          {mound}
          <Pebble x={52} y={161} s={1} />
          <Grass x={36} y={168} s={.8} c="#2fb86c" />
          <Grass x={160} y={166} s={.9} c="#2fb86c" />
          <Grass x={140} y={172} s={.6} c="#4ade80" />
          <g className="grow-in"><g className="sway">
            <path d="M100 160Q96 140 100 114" stroke="#3fbf6a" strokeWidth="5" strokeLinecap="round" fill="none" />
            <Leaf x={100} y={124} s={1.15} fill="#4ade80" rot={-8} />
            <Leaf x={100} y={124} flip={-1} s={1.15} fill="#22c55e" rot={8} />
            <ellipse cx="100" cy="113" rx="4" ry="6" fill="#86efac" />
          </g></g>
          <g className="drop"><path d="M72 70Q76 78 72 82Q68 78 72 70Z" fill="#7dd3fc" /></g>
          <g className="drop" style={{ animationDelay: '-.9s' }}><path d="M126 60Q130 68 126 72Q122 68 126 60Z" fill="#7dd3fc" /></g>
          <g transform="translate(124 160)"><ellipse cx="0" cy="0" rx="4.5" ry="3.4" fill="#ef4444" /><path d="M0-3.4V3.4" stroke="#1e293b" strokeWidth=".8" /><circle cx="-1.6" cy="-.8" r=".7" fill="#1e293b" /><circle cx="1.6" cy=".8" r=".7" fill="#1e293b" /></g>
        </>
      )}
      {stage === 2 && (
        <>
          {mound}
          {lawn}
          <Grass x={34} y={168} s={1} />
          <Grass x={164} y={170} s={1} />
          <Grass x={130} y={175} s={.7} c="#4ade80" />
          <Flower x={52} y={166} s={1} c="#f472b6" />
          <Flower x={150} y={164} s={.9} c="#fff" />
          <Flower x={70} y={172} s={.7} c="#a78bfa" />
          <Pebble x={118} y={170} s={.9} />
          <g className="grow-in"><g className="sway">
            <path d="M100 160Q95 120 100 62" stroke="#2f9e57" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M99 100Q82 96 74 84" stroke="#2f9e57" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M101 84Q118 80 126 68" stroke="#2f9e57" strokeWidth="3" strokeLinecap="round" fill="none" />
            <Leaf x={100} y={132} s={1.25} fill="#4ade80" rot={-6} />
            <Leaf x={100} y={116} flip={-1} s={1.25} fill="#22c55e" rot={6} />
            <Leaf x={100} y={100} s={1.15} fill="#34d17a" />
            <Leaf x={100} y={88} flip={-1} s={1.1} fill="#4ade80" />
            <Leaf x={74} y={84} flip={-1} s={.9} fill="#34d17a" rot={-20} />
            <Leaf x={126} y={68} s={.9} fill="#4ade80" rot={-10} />
            <Leaf x={100} y={74} s={.95} fill="#22c55e" />
            <Leaf x={100} y={64} flip={-1} s={.8} fill="#86efac" />
            <ellipse cx="100" cy="60" rx="4" ry="6" fill="#bbf7d0" />
          </g></g>
          <Butterfly x={140} y={104} s={1} c="#fb923c" />
        </>
      )}
      {stage === 3 && (
        <>
          {mound}
          {lawn}
          <Grass x={30} y={168} s={1.1} />
          <Grass x={170} y={170} s={1.1} />
          <Grass x={58} y={176} s={.8} c="#4ade80" />
          <Grass x={142} y={176} s={.8} c="#4ade80" />
          <Flower x={48} y={168} s={1} c="#f472b6" />
          <Flower x={156} y={166} s={1} c="#fff" />
          <Flower x={36} y={176} s={.8} c="#fbbf24" />
          <Mushroom x={146} y={174} s={.9} />
          <Pebble x={66} y={174} s={.9} />
          <g className="grow-in"><g className="sway"><Tree x={100} y={164} s={1.25} fruit detail /></g></g>
          <g className="fall"><Leaf x={60} y={96} s={.45} fill="#4ade80" rot={30} /></g>
          <Butterfly x={42} y={120} s={.9} c="#60a5fa" />
        </>
      )}
      {stage === 4 && (
        <>
          <path d="M0 200V122Q40 96 92 118T200 108V200Z" fill="#2f9a62" />
          <path d="M0 200V132Q45 108 95 128T200 120V200Z" fill="#1b7a4a" />
          <path d="M20 136Q40 130 60 136" stroke="#0f5132" strokeOpacity=".2" strokeWidth="3" fill="none" />
          <path d="M0 200V160Q60 138 110 154T200 148V200Z" fill="#16643c" />
          <path d="M84 200Q96 176 112 158Q124 150 142 150Q124 156 114 170Q104 186 112 200Z" fill="#d6b27a" opacity=".85" />
          <g className="grow-in" style={{ '--d': '.1s' }}><g className="sway">
            <Pine x={24} y={146} s={.7} c="#1f9a5a" />
            <Pine x={46} y={142} s={.55} c="#27a35d" />
            <Tree x={176} y={142} s={.55} c1="#2fb86c" c2="#27a35d" c3="#4ade80" />
            <Pine x={196} y={140} s={.6} c="#1f9a5a" />
          </g></g>
          <g className="grow-in" style={{ '--d': '.25s' }}><g className="sway" style={{ animationDelay: '-1.5s' }}>
            <Pine x={62} y={156} s={.95} />
            <Tree x={142} y={158} s={.85} fruit />
          </g></g>
          <path d="M0 200V178Q50 166 100 180T200 174V200Z" fill="#0f4f2f" />
          <Flower x={22} y={186} s={.9} c="#f472b6" />
          <Flower x={34} y={192} s={.7} c="#fff" />
          <Flower x={178} y={188} s={.9} c="#fbbf24" />
          <Mushroom x={164} y={194} s={.9} />
          <Grass x={50} y={194} s={.9} c="#4ade80" />
          <g className="grow-in" style={{ '--d': '.4s' }}><g className="sway" style={{ animationDelay: '-3s' }}>
            <Tree x={100} y={180} s={.95} fruit detail />
          </g></g>
          <Butterfly x={60} y={116} s={1} c="#fb923c" />
          <Butterfly x={150} y={96} s={.8} c="#a78bfa" />
          <g className="bob"><circle cx="30" cy="100" r="1.8" fill="#fde047" /></g>
        </>
      )}
      {/* fireflies and a soft blue tint at night */}
      <g style={{ opacity: dark ? 1 : 0, transition: 'opacity 1.1s ease' }}>
        {[[60, 128, 0], [142, 116, -1], [100, 100, -2], [34, 146, -.6]].map(([a, b, d]) => (
          <g key={a} className="bob" style={{ animationDelay: `${d}s` }}><circle cx={a} cy={b} r="2" fill="#fde047" /><circle cx={a} cy={b} r="5" fill="#fde047" opacity=".25" /></g>
        ))}
      </g>
      <rect x="-60" y="-60" width="320" height="320" fill="#0a1640" pointerEvents="none" style={{ opacity: dark ? 0.3 : 0, transition: 'opacity 1.1s ease' }} />
    </svg>
  )
}
