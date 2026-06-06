import { useEffect, useState } from 'react'
import { getPools, type Pool } from '../lib/pools'
import { getTeams, type Team } from '../lib/teams'
import { getMatches, updateMatch, type Match } from '../lib/matches'
import './HomePage.css'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

type ScoreEntry = { score1: string; score2: string }

export default function HomePage() {
  const [pools, setPools] = useState<Pool[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [scoreEntries, setScoreEntries] = useState<Record<string, ScoreEntry>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getPools(), getTeams(), getMatches()])
      .then(([p, t, m]) => {
        setPools(p)
        setTeams(t)
        setMatches(m)
        if (p.length > 0) setSelectedPoolId(p[0].id)
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

  async function submitScore(m: Match) {
    const entry = getEntry(m.id)
    const score1 = entry.score1 !== '' ? Number(entry.score1) : null
    const score2 = entry.score2 !== '' ? Number(entry.score2) : null
    const winnerId =
      score1 != null && score2 != null && score1 !== score2
        ? score1 > score2 ? m.team_1_id : m.team_2_id
        : null

    const pendingInPool = matches.filter(
      (x) =>
        x.id !== m.id &&
        x.reference_object_type === 'Pool' &&
        x.reference_object_id === m.reference_object_id &&
        x.match_status === 'pending'
    )
    const nextPending = pendingInPool.length > 0
      ? pendingInPool[Math.floor(Math.random() * pendingInPool.length)]
      : null

    setSubmittingId(m.id)
    try {
      await updateMatch(m.id, {
        team_1_score: score1,
        team_2_score: score2,
        match_status: 'completed',
        winning_team_id: winnerId,
      })
      if (nextPending) {
        await updateMatch(nextPending.id, {
          team_1_score: null,
          team_2_score: null,
          match_status: 'in_progress',
          winning_team_id: null,
        })
      }
      setMatches((prev) =>
        prev.map((x) => {
          if (x.id === m.id)
            return { ...x, team_1_score: score1, team_2_score: score2, match_status: 'completed', winning_team_id: winnerId }
          if (nextPending && x.id === nextPending.id)
            return { ...x, match_status: 'in_progress' }
          return x
        })
      )
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

  const teamMap = new Map(teams.map((t) => [String(t.id), t]))

  const selectedPool = pools.find((p) => p.id === selectedPoolId) ?? null

  const poolMatches = matches.filter(
    (m) => m.reference_object_type === 'Pool' && m.reference_object_id === Number(selectedPoolId)
  )

  if (loading) return <p className="home-empty">Loading…</p>
  if (pools.length === 0) return <p className="home-empty">No pools yet.</p>

  return (
    <div className="home-page">
      <div className="pool-tabs">
        {pools.map((p) => (
          <button
            key={p.id}
            className={`pool-tab${p.id === selectedPoolId ? ' pool-tab-active' : ''}`}
            onClick={() => setSelectedPoolId(p.id)}
          >
            {p.pool_name}
          </button>
        ))}
      </div>

      {selectedPool && (
        <div className="pool-content">
          <section className="pool-section">
            <h2>Teams</h2>
            {selectedPool.teams.length === 0 ? (
              <p className="home-empty">No teams in this pool.</p>
            ) : (
              <ul className="home-teams">
                {selectedPool.teams.map((t) => {
                  const players = teamMap.get(String(t.id))?.Player ?? []
                  return (
                    <li key={t.id} className="home-team-card">
                      <span className="home-team-name">{t.team_name}</span>
                      {players.length > 0 && (
                        <ul className="home-team-players">
                          {players.map((p) => (
                            <li key={p.id}>{p.name}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="pool-section">
            <h2>Matches</h2>
            {poolMatches.length === 0 ? (
              <p className="home-empty">No matches in this pool.</p>
            ) : (
              <ul className="home-matches">
                {poolMatches.map((m) => {
                  const entry = getEntry(m.id)
                  const isSubmitting = submittingId === m.id
                  return (
                    <li key={m.id} className="home-match">
                      <div className="home-match-main">
                        <div className="home-match-teams">
                          <span className={m.winning_team_id === m.team_1_id ? 'team-name winner' : 'team-name'}>
                            {m.team_1.team_name}
                          </span>
                          <span className="home-match-score">
                            {m.team_1_score != null && m.team_2_score != null
                              ? `${m.team_1_score} – ${m.team_2_score}`
                              : 'vs'}
                          </span>
                          <span className={m.winning_team_id === m.team_2_id ? 'team-name winner' : 'team-name'}>
                            {m.team_2.team_name}
                          </span>
                        </div>
                        <span className={`home-match-status status-${m.match_status}`}>
                          {STATUS_LABEL[m.match_status] ?? m.match_status}
                        </span>
                      </div>
                      {m.match_status === 'in_progress' && (
                        <div className="score-submit-wrap">
                          <div className="score-submit">
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={entry.score1}
                              onChange={(e) => setEntry(m.id, { score1: e.target.value })}
                              className="score-input"
                              aria-label={`${m.team_1.team_name} score`}
                            />
                            <span className="score-sep">–</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={entry.score2}
                              onChange={(e) => setEntry(m.id, { score2: e.target.value })}
                              className="score-input"
                              aria-label={`${m.team_2.team_name} score`}
                            />
                            <button
                              className="submit-score-btn"
                              onClick={() => submitScore(m)}
                              disabled={isSubmitting || entry.score1 === '' || entry.score2 === '' || (Number(entry.score1) < 7 && Number(entry.score2) < 7)}
                            >
                              {isSubmitting ? '…' : 'Submit'}
                            </button>
                          </div>
                          {(entry.score1 !== '' || entry.score2 !== '') && Number(entry.score1) < 7 && Number(entry.score2) < 7 && (
                            <p className="score-warning">A score of at least 7 is required to submit.</p>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
