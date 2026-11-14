import { LEVELS } from '../lib/constants'

const Leaf = ({ x, y, flip = 1, s = 1, fill }) => (
  <path d="M0 0Q-22-16-30 0Q-12 10 0 0Z" fill={fill} transform={`translate(${x} ${y}) scale(${flip * s} ${s})`} />
)

const Tree = ({ x, y, s = 1, c1 = '#22a455', c2 = '#1e9a4d', c3 = '#34d17a', fruit }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-5" y="-46" width="10" height="46" rx="3" fill="#8b5a2b" />
    <circle cx="-20" cy="-50" r="20" fill={c2} />
    <circle cx="20" cy="-50" r="20" fill={c2} />
    <circle cx="0" cy="-66" r="26" fill={c1} />
    <circle cx="-6" cy="-76" r="14" fill={c3} opacity=".7" />
    {fruit && [[-18, -56], [14, -72], [24, -46], [-4, -46]].map(([a, b]) => <circle key={a} cx={a} cy={b} r="3.5" fill="#f2c24b" />)}
  </g>
)

const Pine = ({ x, y, s = 1, c = '#17794a' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-3" y="-14" width="6" height="14" fill="#6b4423" />
    <path d="M0-70L-20-30H20Z" fill={c} />
    <path d="M0-52L-26-14H26Z" fill={c} />
  </g>
)

// One drawing per level: seed, sprout, sapling, tree, forest.
export function GrowthScene({ stage, className, compact }) {
  const mound = (
    <>
      <ellipse cx="100" cy="170" rx="86" ry="22" fill="#5b3b22" />
      <ellipse cx="100" cy="163" rx="78" ry="16" fill="#7a5233" />
    </>
  )
  return (
    <svg viewBox={compact ? '20 30 160 160' : '0 0 200 200'} role="img" aria-label={`${LEVELS[stage].name} stage`} className={className}>
      {stage === 0 && (
        <>
          {mound}
          <circle cx="100" cy="148" r="22" fill="#f2c24b" opacity=".18" className="animate-pulse" />
          <g className="grow-in">
            <ellipse cx="100" cy="150" rx="11" ry="16" fill="#c98a4b" transform="rotate(-20 100 150)" />
            <path d="M95 142Q98 136 103 138" stroke="#f1c48f" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        </>
      )}
      {stage === 1 && (
        <>
          {mound}
          <g className="grow-in"><g className="sway">
            <path d="M100 158Q97 138 100 116" stroke="#3fbf6a" strokeWidth="5" strokeLinecap="round" fill="none" />
            <Leaf x={100} y={122} s={1.1} fill="#4ade80" />
            <Leaf x={100} y={122} flip={-1} s={1.1} fill="#22c55e" />
          </g></g>
        </>
      )}
      {stage === 2 && (
        <>
          {mound}
          <g className="grow-in"><g className="sway">
            <path d="M100 158Q96 120 100 64" stroke="#2f9e57" strokeWidth="6" strokeLinecap="round" fill="none" />
            <Leaf x={100} y={128} s={1.2} fill="#4ade80" />
            <Leaf x={100} y={108} flip={-1} s={1.2} fill="#22c55e" />
            <Leaf x={100} y={90} s={1.1} fill="#34d17a" />
            <Leaf x={100} y={74} flip={-1} s={1} fill="#4ade80" />
            <Leaf x={100} y={64} s={.8} fill="#86efac" />
          </g></g>
        </>
      )}
      {stage === 3 && (
        <>
          {mound}
          <g className="grow-in"><g className="sway"><Tree x={100} y={164} s={1.25} fruit /></g></g>
        </>
      )}
      {stage === 4 && (
        <>
          <circle cx="158" cy="38" r="22" fill="#f2c24b" opacity=".3" />
          <circle cx="158" cy="38" r="13" fill="#f2c24b" />
          <path d="M0 200V132Q45 108 95 128T200 120V200Z" fill="#1b7a4a" />
          <path d="M0 200V160Q60 138 110 154T200 148V200Z" fill="#16643c" />
          <g className="grow-in" style={{ '--d': '.1s' }}><g className="sway">
            <Pine x={28} y={146} s={.75} c="#1f9a5a" />
            <Tree x={174} y={142} s={.55} c1="#2fb86c" c2="#27a35d" c3="#4ade80" />
          </g></g>
          <g className="grow-in" style={{ '--d': '.25s' }}><g className="sway" style={{ animationDelay: '-1.5s' }}>
            <Pine x={62} y={156} s={.95} />
            <Tree x={142} y={158} s={.85} />
          </g></g>
          <path d="M0 200V178Q50 166 100 180T200 174V200Z" fill="#0f4f2f" />
          <g className="grow-in" style={{ '--d': '.4s' }}><g className="sway" style={{ animationDelay: '-3s' }}>
            <Tree x={100} y={178} s={1.15} fruit />
          </g></g>
        </>
      )}
    </svg>
  )
}
