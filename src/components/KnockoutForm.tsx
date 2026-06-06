import { useEffect, useState } from 'react'
import { createKnockout, type Knockout } from '../lib/knockouts'
import { getPools, type Pool } from '../lib/pools'
import './MatchForm.css'

type Props = {
  onCreated: (knockout: Knockout) => void
}

export default function KnockoutForm({ onCreated }: Props) {
  const [pools, setPools] = useState<Pool[]>([])
  const [pool1Id, setPool1Id] = useState<number | null>(null)
  const [pool2Id, setPool2Id] = useState<number | null>(null)
  const [teamsFromPool, setTeamsFromPool] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPools().then(setPools).catch(console.error)
  }, [])

  const pool1 = pools.find((p) => Number(p.id) === pool1Id)
  const pool2 = pools.find((p) => Number(p.id) === pool2Id)
  const maxTeams =
    pool1 && pool2 ? Math.min(pool1.teams.length, pool2.teams.length) : 0

  const pool2Options = pools.filter((p) => Number(p.id) !== pool1Id)

  const isValid =
    pool1Id != null && pool2Id != null && pool1Id !== pool2Id &&
    teamsFromPool && Number(teamsFromPool) >= 2 && Number(teamsFromPool) <= maxTeams && Number(teamsFromPool) % 2 === 0

  function handlePool1Change(val: string) {
    setPool1Id(val ? Number(val) : null)
    setPool2Id(null)
    setTeamsFromPool('')
  }

  function handlePool2Change(val: string) {
    setPool2Id(val ? Number(val) : null)
    setTeamsFromPool('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || pool1Id == null || pool2Id == null) return
    setLoading(true)
    setError(null)
    try {
      const knockout = await createKnockout({
        pool_1_id: pool1Id,
        pool_2_id: pool2Id,
        number_of_teams_from_pool: Number(teamsFromPool),
      })
      onCreated(knockout)
      setPool1Id(null)
      setPool2Id(null)
      setTeamsFromPool('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="match-form">
      <h2>Add Knockout</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="pool1">Pool 1</label>
        <select id="pool1" value={pool1Id ?? ''} onChange={(e) => handlePool1Change(e.target.value)}>
          <option value="">Select pool…</option>
          {pools.map((p) => (
            <option key={p.id} value={p.id}>{p.pool_name}</option>
          ))}
        </select>

        <label htmlFor="pool2">Pool 2</label>
        <select id="pool2" value={pool2Id ?? ''} onChange={(e) => handlePool2Change(e.target.value)} disabled={pool1Id == null}>
          <option value="">Select pool…</option>
          {pool2Options.map((p) => (
            <option key={p.id} value={p.id}>{p.pool_name}</option>
          ))}
        </select>

        <label htmlFor="teams-from-pool">
          Teams from each pool{maxTeams > 0 && <span className="optional"> (max {maxTeams})</span>}
        </label>
        <select
          id="teams-from-pool"
          value={teamsFromPool}
          onChange={(e) => setTeamsFromPool(e.target.value)}
          disabled={pool1Id == null || pool2Id == null || maxTeams === 0}
        >
          <option value="">Select…</option>
          {Array.from({ length: Math.floor(maxTeams / 2) }, (_, i) => (i + 1) * 2).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={!isValid || loading}>
          {loading ? 'Adding…' : 'Add Knockout'}
        </button>
      </form>
    </div>
  )
}
