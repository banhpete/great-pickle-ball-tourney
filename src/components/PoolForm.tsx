import { useState } from 'react'
import { createPool, type Pool } from '../lib/pools'
import './PlayerForm.css'

type Props = {
  onCreated: (pool: Pool) => void
}

export default function PoolForm({ onCreated }: Props) {
  const [poolName, setPoolName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!poolName.trim()) return
    setLoading(true)
    setError(null)
    try {
      const pool = await createPool(poolName.trim())
      onCreated(pool)
      setPoolName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="player-form">
      <h2>Add Pool</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="pool-name">Pool Name</label>
        <input
          id="pool-name"
          type="text"
          value={poolName}
          onChange={(e) => setPoolName(e.target.value)}
          placeholder="Enter pool name"
          disabled={loading}
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading || !poolName.trim()}>
          {loading ? 'Adding…' : 'Add Pool'}
        </button>
      </form>
    </div>
  )
}
