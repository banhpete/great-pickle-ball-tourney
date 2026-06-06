import { useEffect, useState } from 'react'
import { getTeams, updateTeam, type Team } from '../lib/teams'
import { getMatches, type Match } from '../lib/matches'
import './TeamsPage.css'

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getTeams(), getMatches()])
      .then(([t, m]) => { setTeams(t); setMatches(m) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function getRecord(teamId: string) {
    const id = Number(teamId)
    const played = matches.filter(
      (m) => m.winning_team_id != null && (m.team_1_id === id || m.team_2_id === id)
    )
    const wins = played.filter((m) => m.winning_team_id === id).length
    const losses = played.length - wins
    return { wins, losses }
  }

  function startEdit(t: Team) {
    setEditingId(t.id)
    setEditName(t.team_name)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
  }

  async function saveEdit(id: string) {
    const name = editName.trim()
    if (!name) return
    setSaving(true)
    try {
      await updateTeam(id, name)
      setTeams((prev) => prev.map((t) => t.id === id ? { ...t, team_name: name } : t))
      cancelEdit()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="teams-page-empty">Loading…</p>

  return (
    <div className="teams-page">
      <h2>Teams</h2>
      {teams.length === 0 ? (
        <p className="teams-page-empty">No teams yet.</p>
      ) : (
        <ul className="teams-grid">
          {teams.map((t) => (
            <li key={t.id} className="team-card">
              {editingId === t.id ? (
                <div className="team-card-edit">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(t.id); if (e.key === 'Escape') cancelEdit() }}
                    autoFocus
                  />
                  <div className="team-card-edit-actions">
                    <button className="save-name-btn" onClick={() => saveEdit(t.id)} disabled={saving || !editName.trim()}>
                      {saving ? '…' : 'Save'}
                    </button>
                    <button className="cancel-name-btn" onClick={cancelEdit} disabled={saving}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="team-card-header">
                  <span className="team-card-name">{t.team_name}</span>
                  <button className="edit-name-btn" onClick={() => startEdit(t)}>Edit</button>
                </div>
              )}
              {t.Player.length > 0 ? (
                <ul className="team-card-players">
                  {t.Player.map((p) => (
                    <li key={p.id}>{p.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="team-card-empty">No players</p>
              )}
              {(() => {
                const { wins, losses } = getRecord(t.id)
                return (wins > 0 || losses > 0) ? (
                  <div className="team-card-record">
                    <span className="record-wins">{wins}W</span>
                    <span className="record-sep">·</span>
                    <span className="record-losses">{losses}L</span>
                  </div>
                ) : null
              })()}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
