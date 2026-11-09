import { Lock } from 'lucide-react'
import type { Piece } from '../../domain/types.ts'
import { PIECE_STATE_COLORS, PIECE_STATE_LABELS } from '../../domain/types.ts'
import type { PieceFilter } from '../../store/selectors.ts'
import { matchesPieceFilter, selectMillKpiMetrics } from '../../store/selectors.ts'
import { useMillStore } from '../../store/useMillStore.ts'

interface EndCapPolarViewProps {
  section: 'feed' | 'discharge'
  activeFilter: PieceFilter
}

interface RingGeometry {
  ring: string
  count: number
  rInner: number
  rOuter: number
}

const FEED_GEOMETRY: ReadonlyArray<RingGeometry> = [
  { ring: 'FIHL', count: 12, rInner: 56, rOuter: 102 },
  { ring: 'FMFL', count: 12, rInner: 106, rOuter: 152 },
  { ring: 'OHL', count: 24, rInner: 156, rOuter: 202 },
]

const DISCHARGE_GEOMETRY: ReadonlyArray<RingGeometry> = [
  { ring: 'DIHL', count: 12, rInner: 64, rOuter: 130 },
  { ring: 'OHL', count: 24, rInner: 134, rOuter: 202 },
]

const CX = 220
const CY = 220
const OUTER_RADIUS = 202

function createAnnularSectorPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startAngle: number,
  endAngle: number,
): string {
  const x1Outer = cx + rOuter * Math.cos(startAngle)
  const y1Outer = cy + rOuter * Math.sin(startAngle)
  const x2Outer = cx + rOuter * Math.cos(endAngle)
  const y2Outer = cy + rOuter * Math.sin(endAngle)

  const x1Inner = cx + rInner * Math.cos(endAngle)
  const y1Inner = cy + rInner * Math.sin(endAngle)
  const x2Inner = cx + rInner * Math.cos(startAngle)
  const y2Inner = cy + rInner * Math.sin(startAngle)

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0

  return [
    `M ${x1Outer.toFixed(2)} ${y1Outer.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2Outer.toFixed(2)} ${y2Outer.toFixed(2)}`,
    `L ${x1Inner.toFixed(2)} ${y1Inner.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x2Inner.toFixed(2)} ${y2Inner.toFixed(2)}`,
    'Z',
  ].join(' ')
}

function createBallChargeSemicirclePath(cx: number, cy: number, radius: number): {
  path: string
  levelY: number
  leftX: number
  rightX: number
} {
  const startAngle = (20 * Math.PI) / 180
  const endAngle = (160 * Math.PI) / 180
  const leftX = cx + radius * Math.cos(endAngle)
  const rightX = cx + radius * Math.cos(startAngle)
  const levelY = cy + radius * Math.sin(startAngle)

  const path = [
    `M ${rightX.toFixed(2)} ${levelY.toFixed(2)}`,
    `A ${radius} ${radius} 0 0 1 ${leftX.toFixed(2)} ${levelY.toFixed(2)}`,
    `L ${rightX.toFixed(2)} ${levelY.toFixed(2)}`,
    'Z',
  ].join(' ')

  return { path, levelY, leftX, rightX }
}

export default function EndCapPolarView({
  section,
  activeFilter,
}: EndCapPolarViewProps) {
  const mills = useMillStore((s) => s.mills)
  const activeMillCode = useMillStore((s) => s.activeMillCode)
  const currentUser = useMillStore((s) => s.currentUser)
  const cyclePiece = useMillStore((s) => s.cyclePiece)
  const togglePhoto = useMillStore((s) => s.togglePhoto)
  const metrics = useMillStore(selectMillKpiMetrics)

  const activeMill = mills[activeMillCode] ?? Object.values(mills)[0]
  const isMinera = currentUser?.role === 'minera'

  const isFeed = section === 'feed'
  const sectionSummary = isFeed ? metrics.feed : metrics.discharge
  const ringSummaries = isFeed ? metrics.feedRings : metrics.dischargeRings
  const geometryList = isFeed ? FEED_GEOMETRY : DISCHARGE_GEOMETRY

  const pieceLookup = new Map<string, Piece>()
  for (const piece of activeMill?.pieces ?? []) {
    if (piece.section === section) {
      pieceLookup.set(`${piece.ring}-${piece.index}`, piece)
    }
  }

  const ballCharge = createBallChargeSemicirclePath(CX, CY, OUTER_RADIUS)

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {sectionSummary.label} ({sectionSummary.total} piezas)
            </h2>
            <p className="text-xs text-slate-500">
              R: {sectionSummary.removed + sectionSummary.changed} · C: {sectionSummary.changed} / {sectionSummary.total} (
              {sectionSummary.changedPercent}%)
            </p>
          </div>

          {isMinera ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
              <Lock className="h-3 w-3" />
              <span>Solo lectura</span>
            </span>
          ) : (
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              Vista frontal polar
            </span>
          )}
        </div>

        <div className="mx-auto max-w-[380px]">
          <svg
            viewBox="0 0 440 440"
            className="h-auto w-full select-none"
            role="img"
            aria-label={`Mapa polar ${sectionSummary.label}`}
          >
            <circle
              cx={CX}
              cy={CY}
              r={OUTER_RADIUS + 6}
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="2"
            />

            {geometryList.map((ringGeo) =>
              Array.from({ length: ringGeo.count }, (_, idx) => {
                const index = idx + 1
                const piece = pieceLookup.get(`${ringGeo.ring}-${index}`)
                if (!piece) {
                  return null
                }

                const step = (2 * Math.PI) / ringGeo.count
                const startAngle = -Math.PI / 2 + idx * step
                const endAngle = startAngle + step
                const midAngle = (startAngle + endAngle) / 2
                const midRadius = (ringGeo.rInner + ringGeo.rOuter) / 2

                const labelX = CX + midRadius * Math.cos(midAngle)
                const labelY = CY + midRadius * Math.sin(midAngle)
                const photoDotRadius = ringGeo.rOuter - 8
                const photoX = CX + photoDotRadius * Math.cos(midAngle)
                const photoY = CY + photoDotRadius * Math.sin(midAngle)

                const pathData = createAnnularSectorPath(
                  CX,
                  CY,
                  ringGeo.rInner,
                  ringGeo.rOuter,
                  startAngle,
                  endAngle,
                )

                const visibleByFilter = matchesPieceFilter(piece.state, activeFilter)
                const fillColor = PIECE_STATE_COLORS[piece.state]
                const textFill = piece.state === 'R' ? '#0f172a' : '#ffffff'

                return (
                  <g
                    key={piece.id}
                    onClick={() => {
                      if (!isMinera && visibleByFilter) {
                        cyclePiece(piece.id)
                      }
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault()
                      if (!isMinera && visibleByFilter) {
                        togglePhoto(piece.id)
                      }
                    }}
                    className={
                      !visibleByFilter
                        ? 'opacity-20'
                        : isMinera
                          ? 'cursor-default'
                          : 'cursor-pointer transition-opacity hover:opacity-90'
                    }
                  >
                    <title>
                      {`${piece.ring} #${piece.index} · ${PIECE_STATE_LABELS[piece.state]} (${piece.state})${
                        piece.hasPhoto ? ' · Con foto' : ''
                      }`}
                    </title>
                    <path
                      d={pathData}
                      fill={fillColor}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={textFill}
                      fontSize={ringGeo.count > 16 ? '10' : '11'}
                      fontWeight="700"
                    >
                      {piece.index}
                    </text>
                    {piece.hasPhoto && (
                      <circle
                        cx={photoX}
                        cy={photoY}
                        r="3.5"
                        fill="#0284c7"
                        stroke="#ffffff"
                        strokeWidth="1.2"
                      />
                    )}
                  </g>
                )
              }),
            )}

            <circle
              cx={CX}
              cy={CY}
              r={isFeed ? 52 : 60}
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="3"
            />
            <text
              x={CX}
              y={CY - 6}
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="11"
              fontWeight="700"
            >
              {isFeed ? 'ALIMENTACIÓN' : 'DESCARGA'}
            </text>
            <text
              x={CX}
              y={CY + 10}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="9"
              fontWeight="600"
            >
              {isFeed ? 'FIHL · FMFL · OHL' : 'DIHL · OHL'}
            </text>

            {isFeed && (
              <g pointerEvents="none">
                <path
                  d={ballCharge.path}
                  fill="#0f172a"
                  fillOpacity="0.28"
                />
                <line
                  x1={ballCharge.leftX}
                  y1={ballCharge.levelY}
                  x2={ballCharge.rightX}
                  y2={ballCharge.levelY}
                  stroke="#0284c7"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                />
                <rect
                  x={CX - 66}
                  y={ballCharge.levelY + 12}
                  width="132"
                  height="22"
                  rx="11"
                  fill="#0f172a"
                  fillOpacity="0.85"
                />
                <text
                  x={CX}
                  y={ballCharge.levelY + 23}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#38bdf8"
                  fontSize="10"
                  fontWeight="700"
                >
                  Carga de bolas 30%
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
        {ringSummaries.map((ringItem) => (
          <div
            key={ringItem.ring}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                Anillo {ringItem.ring} ({ringItem.total} pzas)
              </span>
              <span className="font-semibold text-slate-700">
                R: {ringItem.removed + ringItem.changed} · C: {ringItem.changed} / {ringItem.total} (
                {ringItem.changedPercent}%)
              </span>
            </div>
            <div className="mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                style={{
                  width: `${(ringItem.changed / Math.max(1, ringItem.total)) * 100}%`,
                  backgroundColor: PIECE_STATE_COLORS.RC,
                }}
                className="transition-all duration-300"
              />
              <div
                style={{
                  width: `${(ringItem.removed / Math.max(1, ringItem.total)) * 100}%`,
                  backgroundColor: PIECE_STATE_COLORS.R,
                }}
                className="transition-all duration-300"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
