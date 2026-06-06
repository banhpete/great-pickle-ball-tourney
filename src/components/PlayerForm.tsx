import { useState } from 'react'
import { createPlayer, type Player } from '../lib/players'
import './PlayerForm.css'

type Props = {
  onCreated: (player: Player) => void
}

export default function PlayerForm({ onCreated }: Props) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const player = await createPlayer(name.trim())
      onCreated(player)
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="player-form">
      <h2>Add Player</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="player-name">Name</label>
        <input
          id="player-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter player name"
          disabled={loading}
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading || !name.trim()}>
          {loading ? 'Adding…' : 'Add Player'}
        </button>
      </form>
    </div>
  )
}
