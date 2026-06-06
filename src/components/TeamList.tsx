import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { getTeams, updateTeam, type Team } from '../lib/teams'
import { getUnassignedPlayers, assignPlayerToTeam, removePlayerFromTeam, randomizePlayersToTeams, type Player } from '../lib/players'
import './TeamList.css'

type Props = {
  teams: Team[]
  setTeams: Dispatch<SetStateAction<Team[]>>
}

export default function TeamList({ teams, setTeams }: Props) {
  const [unassigned, setUnassigned] = useState<Player[]>([])
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [randomizing, setRandomizing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getTeams().then(setTeams).catch(console.error)
    getUnassignedPlayers().then(setUnassigned).catch(console.error)
  }, [])

  async function handleRandomize() {
    if (!unassigned.length || !teams.length) return
    setRandomizing(true)
    try {
      await randomizePlayersToTeams(unassigned, teams)
      const [updatedTeams, updatedUnassigned] = await Promise.all([getTeams(), getUnassignedPlayers()])
      setTeams(updatedTeams)
      setUnassigned(updatedUnassigned)
      setSelected({})
    } catch (err) {
      console.error(err)
    } finally {
      setRandomizing(false)
    }
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

  async function handleRemove(teamId: string, player: Player) {
    try {
      await removePlayerFromTeam(player.id)
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId ? { ...t, Player: t.Player.filter((p) => p.id !== player.id) } : t
        )
      )
      setUnassigned((prev) => [...prev, player].sort((a, b) => a.name.localeCompare(b.name)))
    } catch (err) {
      console.error(err)
    }
  }

  async function handleAdd(teamId: string) {
    const playerId = selected[teamId]
    if (!playerId) return
    const player = unassigned.find((p) => p.id === Number(playerId))
    if (!player) return
    setLoading((prev) => ({ ...prev, [teamId]: true }))
    try {
      await assignPlayerToTeam(player.id, teamId)
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId ? { ...t, Player: [...t.Player, player] } : t
        )
      )
      setUnassigned((prev) => prev.filter((p) => p.id !== player.id))
      setSelected((prev) => {
        const next = { ...prev }
        Object.keys(next).forEach((key) => {
          if (next[key] === String(player.id)) next[key] = ''
        })
        return next
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading((prev) => ({ ...prev, [teamId]: false }))
    }
  }

  return (
    <div className="team-list">
      <div className="team-list-header">
        <h2>Teams</h2>
        {unassigned.length > 0 && teams.length > 0 && (
          <button className="randomize-btn" onClick={handleRandomize} disabled={randomizing}>
            {randomizing ? 'Randomizing…' : 'Randomize Players'}
          </button>
        )}
      </div>
      {teams.length === 0 ? (
        <p className="empty">No teams yet.</p>
      ) : (
        <ul>
          {teams.map((t) => (
            <li key={t.id}>
              {editingId === t.id ? (
                <div className="team-name-edit">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(t.id); if (e.key === 'Escape') cancelEdit() }}
                    autoFocus
                  />
                  <button className="save-name-btn" onClick={() => saveEdit(t.id)} disabled={saving || !editName.trim()}>
                    {saving ? '…' : 'Save'}
                  </button>
                  <button className="cancel-name-btn" onClick={cancelEdit} disabled={saving}>Cancel</button>
                </div>
              ) : (
                <div className="team-name-row">
                  <span className="team-name">{t.team_name}</span>
                  <button className="edit-name-btn" onClick={() => startEdit(t)}>Edit</button>
                </div>
              )}
              {t.Player.length > 0 && (
                <ul className="team-players">
                  {t.Player.map((p) => (
                    <li key={p.id}>
                      <span>· {p.name}</span>
                      <button className="remove-player" onClick={() => handleRemove(t.id, p)}>✕</button>
                    </li>
                  ))}
                </ul>
              )}
              {unassigned.length > 0 && t.Player.length < 2 && (
                <div className="add-player">
                  <select
                    value={selected[t.id] ?? ''}
                    onChange={(e) =>
                      setSelected((prev) => ({ ...prev, [t.id]: e.target.value }))
                    }
                  >
                    <option value="">Add player…</option>
                    {unassigned.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAdd(t.id)}
                    disabled={!selected[t.id] || loading[t.id]}
                  >
                    {loading[t.id] ? '…' : 'Add'}
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
