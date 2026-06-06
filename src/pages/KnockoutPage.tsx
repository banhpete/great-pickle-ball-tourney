import { useEffect, useState } from 'react'
import { getKnockouts, type Knockout } from '../lib/knockouts'
import { getPools, type Pool } from '../lib/pools'
import { getMatches, updateMatch, createKnockoutMatch, type Match } from '../lib/matches'
import './KnockoutPage.css'

const MATCH_H = 64
const CELL_H = 80

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

type ScoreEntry = { score1: string; score2: string }

function matchTop(roundIdx: number, matchIdx: number): number {
  return (matchIdx + 0.5) * CELL_H * Math.pow(2, roundIdx) - MATCH_H / 2
}

function roundLabel(matchCount: number): string {
  if (matchCount === 1) return 'Final'
  if (matchCount === 2) return 'Semi-finals'
  if (matchCount === 4) return 'Quarter-finals'
  return `Round of ${matchCount * 2}`
}

function getRoundOffset(roundIdx: number, n: number): number {
  let offset = 0
  let count = n
  for (let r = 0; r < roundIdx; r++) {
    offset += count
    count = Math.round(count / 2)
  }
  return offset
}

function getMatchRoundInfo(order: number, n: number) {
  let offset = 0
  let count = n
  let round = 0
  while (order >= offset + count) {
    offset += count
    count = Math.round(count / 2)
    round++
  }
  return { round, indexInRound: order - offset, roundOffset: offset, roundCount: count }
}

export default function KnockoutPage() {
  const [knockouts, setKnockouts] = useState<Knockout[]>([])
  const [pools, setPools] = useState<Pool[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [scoreEntries, setScoreEntries] = useState<Record<string, ScoreEntry>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)

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

  function getEntry(id: string): ScoreEntry {
    return scoreEntries[id] ?? { score1: '', score2: '' }
  }

  function setEntry(id: string, patch: Partial<ScoreEntry>) {
    setScoreEntries((prev) => ({ ...prev, [id]: { ...getEntry(id), ...patch } }))
  }

  async function submitKnockoutScore(m: Match) {
    if (!selected) return
    const entry = getEntry(m.id)
    const score1 = entry.score1 !== '' ? Number(entry.score1) : null
    const score2 = entry.score2 !== '' ? Number(entry.score2) : null
    const winnerId =
      score1 != null && score2 != null && score1 !== score2
        ? score1 > score2 ? m.team_1_id : m.team_2_id
        : null

    const n = selected.number_of_teams_from_pool
    const order = m.knockout_order ?? 0
    const partnerOrder = order % 2 === 0 ? order + 1 : order - 1
    const partnerMatch = knockoutMatches.find((x) => (x.knockout_order ?? -1) === partnerOrder) ?? null

    setSubmittingId(m.id)
    try {
      await updateMatch(m.id, {
        team_1_score: score1,
        team_2_score: score2,
        match_status: 'completed',
        winning_team_id: winnerId,
      })

      let newMatch: Match | null = null

      if (
        winnerId != null &&
        partnerMatch != null &&
        partnerMatch.match_status === 'completed' &&
        partnerMatch.winning_team_id != null
      ) {
        const { indexInRound, roundOffset, roundCount } = getMatchRoundInfo(order, n)
        const pairIndex = Math.floor(indexInRound / 2)
        const nextOrder = roundOffset + roundCount + pairIndex

        const currentWinner = winnerId === m.team_1_id ? m.team_1 : m.team_2
        const partnerWinner =
          partnerMatch.winning_team_id === partnerMatch.team_1_id
            ? partnerMatch.team_1
            : partnerMatch.team_2
        const [team1ForNext, team2ForNext] =
          order < partnerOrder
            ? [currentWinner, partnerWinner]
            : [partnerWinner, currentWinner]

        newMatch = await createKnockoutMatch(team1ForNext, team2ForNext, selected.id, nextOrder)
      }

      const eligiblePending = knockoutMatches.filter(
        (x) => x.id !== m.id && x.match_status === 'pending'
      )
      if (newMatch) eligiblePending.push(newMatch)

      const nextToStart =
        eligiblePending.length > 0
          ? eligiblePending[Math.floor(Math.random() * eligiblePending.length)]
          : null

      if (nextToStart) {
        await updateMatch(nextToStart.id, {
          team_1_score: null,
          team_2_score: null,
          match_status: 'in_progress',
          winning_team_id: null,
        })
      }

      setMatches((prev) => {
        const updated = prev.map((x) => {
          if (x.id === m.id)
            return { ...x, team_1_score: score1, team_2_score: score2, match_status: 'completed' as const, winning_team_id: winnerId }
          if (nextToStart && x.id === nextToStart.id)
            return { ...x, match_status: 'in_progress' as const }
          return x
        })
        if (newMatch) {
          const status = nextToStart?.id === newMatch.id ? 'in_progress' as const : 'pending' as const
          return [...updated, { ...newMatch, match_status: status }]
        }
        return updated
      })

      setScoreEntries((prev) => {
        const next = { ...prev }
        delete next[m.id]
        return next
      })
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingId(null)
    }
  }

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
  const matchByOrder = new Map(knockoutMatches.map((m) => [m.knockout_order ?? 0, m]))

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
          <div className="ko-content">
            {/* Bracket */}
            <div className="bracket">
              {Array.from({ length: totalRounds }, (_, roundIdx) => {
                const scale = Math.pow(2, roundIdx)
                const matchCount = Math.round(n / scale)
                const isFirst = roundIdx === 0
                const isLast = roundIdx === totalRounds - 1
                const roundOff = getRoundOffset(roundIdx, n)

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
                        const absoluteOrder = roundOff + matchIdx
                        const m = matchByOrder.get(absoluteOrder)
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

            {/* Match list */}
            <section className="ko-match-section">
              <h2>Matches</h2>
              <ul className="ko-match-list">
                {knockoutMatches.map((m) => {
                  const entry = getEntry(m.id)
                  const isSubmitting = submittingId === m.id
                  const showWarning =
                    (entry.score1 !== '' || entry.score2 !== '') &&
                    Number(entry.score1) < 7 &&
                    Number(entry.score2) < 7
                  return (
                    <li key={m.id} className="ko-match-item">
                      <div className="ko-match-main">
                        <div className="ko-match-teams">
                          <span className={`ko-team-name${m.winning_team_id === m.team_1_id ? ' winner' : ''}`}>
                            {m.team_1.team_name}
                          </span>
                          <span className="ko-match-score">
                            {m.team_1_score != null && m.team_2_score != null
                              ? `${m.team_1_score} – ${m.team_2_score}`
                              : 'vs'}
                          </span>
                          <span className={`ko-team-name${m.winning_team_id === m.team_2_id ? ' winner' : ''}`}>
                            {m.team_2.team_name}
                          </span>
                        </div>
                        <span className={`ko-match-status status-${m.match_status}`}>
                          {STATUS_LABEL[m.match_status] ?? m.match_status}
                        </span>
                      </div>
                      {m.match_status === 'in_progress' && (
                        <div className="ko-score-submit-wrap">
                          <div className="ko-score-submit">
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={entry.score1}
                              onChange={(e) => setEntry(m.id, { score1: e.target.value })}
                              className="ko-score-input"
                              aria-label={`${m.team_1.team_name} score`}
                            />
                            <span className="ko-score-sep">–</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={entry.score2}
                              onChange={(e) => setEntry(m.id, { score2: e.target.value })}
                              className="ko-score-input"
                              aria-label={`${m.team_2.team_name} score`}
                            />
                            <button
                              className="ko-submit-btn"
                              onClick={() => submitKnockoutScore(m)}
                              disabled={
                                isSubmitting ||
                                entry.score1 === '' ||
                                entry.score2 === '' ||
                                (Number(entry.score1) < 7 && Number(entry.score2) < 7)
                              }
                            >
                              {isSubmitting ? '…' : 'Submit'}
                            </button>
                          </div>
                          {showWarning && (
                            <p className="ko-score-warning">A score of at least 7 is required to submit.</p>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          </div>
        )
      )}
    </div>
  )
}
