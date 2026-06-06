import { useEffect, useState } from 'react'
import { getPools, type Pool } from '../lib/pools'
import { getTeams, type Team } from '../lib/teams'
import { getMatches, type Match } from '../lib/matches'
import './HomePage.css'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export default function HomePage() {
  const [pools, setPools] = useState<Pool[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
                {poolMatches.map((m) => (
                  <li key={m.id} className="home-match">
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
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
