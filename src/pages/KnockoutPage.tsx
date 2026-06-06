import { useEffect, useState } from 'react'
import { getKnockouts, type Knockout } from '../lib/knockouts'
import { getPools, type Pool } from '../lib/pools'
import { getMatches, type Match } from '../lib/matches'
import './KnockoutPage.css'

const MATCH_H = 64
const CELL_H = 80 // MATCH_H + 16px gap between adjacent matches

function matchTop(roundIdx: number, matchIdx: number): number {
  return (matchIdx + 0.5) * CELL_H * Math.pow(2, roundIdx) - MATCH_H / 2
}

function roundLabel(matchCount: number): string {
  if (matchCount === 1) return 'Final'
  if (matchCount === 2) return 'Semi-finals'
  if (matchCount === 4) return 'Quarter-finals'
  return `Round of ${matchCount * 2}`
}

export default function KnockoutPage() {
  const [knockouts, setKnockouts] = useState<Knockout[]>([])
  const [pools, setPools] = useState<Pool[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getKnockouts(), getPools(), getMatches()])
      .then(([k, p, m]) => {
        setKnockouts(k)
        setPools(p)
        setMatches(m)
        if (k.length > 0) setSelectedId(k[0].id)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const selected = knockouts.find((k) => k.id === selectedId) ?? null
  const poolMap = new Map(pools.map((p) => [Number(p.id), p.pool_name]))

  const knockoutMatches = matches
    .filter((m) => m.reference_object_type === 'Knockout' && m.reference_object_id === selectedId)
    .sort((a, b) => (a.knockout_order ?? 0) - (b.knockout_order ?? 0))

  if (loading) return <p className="ko-empty">Loading…</p>
  if (knockouts.length === 0) return <p className="ko-empty">No knockouts yet.</p>

  const n = selected?.number_of_teams_from_pool ?? 0
  const totalRounds = n > 0 ? Math.ceil(Math.log2(n)) + 1 : 1
  const containerH = n * CELL_H

  return (
    <div className="knockout-page">
      <div className="ko-tabs">
        {knockouts.map((k) => (
          <button
            key={k.id}
            className={`ko-tab${k.id === selectedId ? ' ko-tab-active' : ''}`}
            onClick={() => setSelectedId(k.id)}
          >
            {poolMap.get(k.pool_1_id) ?? `Pool ${k.pool_1_id}`}
            {' vs '}
            {poolMap.get(k.pool_2_id) ?? `Pool ${k.pool_2_id}`}
          </button>
        ))}
      </div>

      {selected && (
        knockoutMatches.length === 0 ? (
          <p className="ko-empty">No matches generated yet.</p>
        ) : (
          <div className="bracket">
            {Array.from({ length: totalRounds }, (_, roundIdx) => {
              const scale = Math.pow(2, roundIdx)
              const matchCount = Math.round(n / scale)
              const isFirst = roundIdx === 0
              const isLast = roundIdx === totalRounds - 1
              const matchByOrder = isFirst
                ? new Map(knockoutMatches.map((m) => [m.knockout_order ?? 0, m]))
                : new Map<number, typeof knockoutMatches[0]>()

              const connectors = !isLast
                ? Array.from({ length: Math.floor(matchCount / 2) }, (_, i) => ({
                    top: (2 * i + 0.5) * CELL_H * scale,
                    height: CELL_H * scale,
                  }))
                : []

              return (
                <div
                  key={roundIdx}
                  className={`bracket-round${isFirst ? ' first' : ''}${isLast ? ' last' : ''}`}
                >
                  <div className="round-label">{roundLabel(matchCount)}</div>
                  <div className="round-body" style={{ height: containerH }}>
                    {Array.from({ length: matchCount }, (_, matchIdx) => {
                      const top = matchTop(roundIdx, matchIdx)
                      const m = matchByOrder.get(matchIdx)
                      return (
                        <div key={matchIdx} className="match-slot" style={{ top }}>
                          {m ? (
                            <div className="bkt-match">
                              <div className={`bkt-team${m.winning_team_id === m.team_1_id ? ' winner' : m.winning_team_id != null ? ' loser' : ''}`}>
                                <span className="bkt-name">{m.team_1.team_name}</span>
                                {m.team_1_score != null && <span className="bkt-score">{m.team_1_score}</span>}
                              </div>
                              <div className={`bkt-team${m.winning_team_id === m.team_2_id ? ' winner' : m.winning_team_id != null ? ' loser' : ''}`}>
                                <span className="bkt-name">{m.team_2.team_name}</span>
                                {m.team_2_score != null && <span className="bkt-score">{m.team_2_score}</span>}
                              </div>
                            </div>
                          ) : (
                            <div className="bkt-match bkt-tbd">
                              <div className="bkt-team tbd"><span className="bkt-name">TBD</span></div>
                              <div className="bkt-team tbd"><span className="bkt-name">TBD</span></div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {connectors.map((c, i) => (
                      <div key={i} className="v-connector" style={{ top: c.top, height: c.height }} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
