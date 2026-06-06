import { useState } from 'react'
import { createTeam, type Team } from '../lib/teams'
import './PlayerForm.css'

type Props = {
  onCreated: (team: Team) => void
}

export default function TeamForm({ onCreated }: Props) {
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!teamName.trim()) return
    setLoading(true)
    setError(null)
    try {
      const team = await createTeam(teamName.trim())
      onCreated(team)
      setTeamName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="player-form">
      <h2>Add Team</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="team-name">Team Name</label>
        <input
          id="team-name"
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Enter team name"
          disabled={loading}
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading || !teamName.trim()}>
          {loading ? 'Adding…' : 'Add Team'}
        </button>
      </form>
    </div>
  )
}
