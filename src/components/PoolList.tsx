import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { getPools, getUnassignedTeams, addTeamToPool, removeTeamFromPool, randomizeTeamsToPools, type Pool, type PoolTeam } from '../lib/pools'
import { generatePoolMatches, getMatches, type Match } from '../lib/matches'
import './PoolList.css'

type Props = {
  pools: Pool[]
  setPools: Dispatch<SetStateAction<Pool[]>>
}

export default function PoolList({ pools, setPools }: Props) {
  const [unassigned, setUnassigned] = useState<PoolTeam[]>([])
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [randomizing, setRandomizing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    getPools().then(setPools).catch(console.error)
    getUnassignedTeams().then(setUnassigned).catch(console.error)
    getMatches().then(setMatches).catch(console.error)
  }, [])

  function getTeamScore(poolId: string, teamId: string): number | null {
    const id = Number(teamId)
    const poolMatches = matches.filter(
      (m) => m.reference_object_type === 'Pool' && m.reference_object_id === Number(poolId) &&
        (m.team_1_id === id || m.team_2_id === id)
    )
    if (!poolMatches.length) return null
    const total = poolMatches.reduce((sum, m) => {
      const score = m.team_1_id === id ? m.team_1_score : m.team_2_score
      return sum + (score ?? 0)
    }, 0)
    const hasAnyScore = poolMatches.some(
      (m) => (m.team_1_id === id ? m.team_1_score : m.team_2_score) != null
    )
    return hasAnyScore ? total : null
  }

  async function handleRandomize() {
    if (!unassigned.length || !pools.length) return
    setRandomizing(true)
    try {
      await randomizeTeamsToPools(unassigned, pools)
      const [updatedPools, updatedUnassigned] = await Promise.all([getPools(), getUnassignedTeams()])
      setPools(updatedPools)
      setUnassigned(updatedUnassigned)
      setSelected({})
    } catch (err) {
      console.error(err)
    } finally {
      setRandomizing(false)
    }
  }

  async function handleGenerateMatches() {
    setGenerating(true)
    try {
      await generatePoolMatches(pools)
      getMatches().then(setMatches).catch(console.error)
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  async function handleAdd(poolId: string) {
    const teamId = selected[poolId]
    if (!teamId) return
    const team = unassigned.find((t) => String(t.id) === teamId)
    if (!team) return
    setLoading((prev) => ({ ...prev, [poolId]: true }))
    try {
      await addTeamToPool(teamId, poolId)
      setPools((prev) =>
        prev.map((p) => p.id === poolId ? { ...p, teams: [...p.teams, team] } : p)
      )
      setUnassigned((prev) => prev.filter((t) => String(t.id) !== teamId))
      setSelected((prev) => {
        const next = { ...prev }
        Object.keys(next).forEach((key) => { if (next[key] === teamId) next[key] = '' })
        return next
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading((prev) => ({ ...prev, [poolId]: false }))
    }
  }

  async function handleRemove(poolId: string, team: PoolTeam) {
    try {
      await removeTeamFromPool(String(team.id), poolId)
      setPools((prev) =>
        prev.map((p) => p.id === poolId ? { ...p, teams: p.teams.filter((t) => t.id !== team.id) } : p)
      )
      setUnassigned((prev) => [...prev, team].sort((a, b) => a.team_name.localeCompare(b.team_name)))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="pool-list">
      <div className="pool-list-header">
        <h2>Pools</h2>
        <div className="pool-list-actions">
          {unassigned.length > 0 && pools.length > 0 && (
            <button className="randomize-btn" onClick={handleRandomize} disabled={randomizing}>
              {randomizing ? 'Randomizing…' : 'Randomize Teams'}
            </button>
          )}
          {pools.some((p) => p.teams.length >= 2) && (
            <button className="generate-btn" onClick={handleGenerateMatches} disabled={generating}>
              {generating ? 'Generating…' : 'Generate Matches'}
            </button>
          )}
        </div>
      </div>
      {pools.length === 0 ? (
        <p className="empty">No pools yet.</p>
      ) : (
        <ul>
          {pools.map((p) => (
            <li key={p.id}>
              <span className="pool-name">{p.pool_name}</span>
              {p.teams.length > 0 && (
                <ul className="pool-teams">
                  {p.teams.map((t) => {
                    const score = getTeamScore(p.id, String(t.id))
                    return (
                      <li key={t.id}>
                        <span>· {t.team_name}</span>
                        <span className="team-score-row">
                          {score != null && <span className="team-score">{score} pts</span>}
                          <button className="remove-team" onClick={() => handleRemove(p.id, t)}>✕</button>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
              {unassigned.length > 0 && (
                <div className="add-team">
                  <select
                    value={selected[p.id] ?? ''}
                    onChange={(e) => setSelected((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  >
                    <option value="">Add team…</option>
                    {unassigned.map((t) => (
                      <option key={t.id} value={t.id}>{t.team_name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAdd(p.id)}
                    disabled={!selected[p.id] || loading[p.id]}
                  >
                    {loading[p.id] ? '…' : 'Add'}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
