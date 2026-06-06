import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { getMatches, updateMatch, deleteMatch, MATCH_STATUSES, type Match, type MatchStatus } from '../lib/matches'
import './MatchList.css'

type Props = {
  matches: Match[]
  setMatches: Dispatch<SetStateAction<Match[]>>
}

type EditState = {
  team_1_score: string
  team_2_score: string
  match_status: MatchStatus
  winning_team_id: string
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export default function MatchList({ matches, setMatches }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    getMatches().then(setMatches).catch(console.error)
  }, [])

  function startEdit(m: Match) {
    setEditingId(m.id)
    setEditState({
      team_1_score: m.team_1_score != null ? String(m.team_1_score) : '',
      team_2_score: m.team_2_score != null ? String(m.team_2_score) : '',
      match_status: m.match_status,
      winning_team_id: m.winning_team_id != null ? String(m.winning_team_id) : '',
    })
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteMatch(id)
      setMatches((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setEditState(null)
  }

  async function saveEdit(m: Match) {
    if (!editState) return
    setSaving(true)
    const score1 = editState.team_1_score !== '' ? Number(editState.team_1_score) : null
    const score2 = editState.team_2_score !== '' ? Number(editState.team_2_score) : null
    try {
      const winnerId = editState.winning_team_id ? Number(editState.winning_team_id) : null
      await updateMatch(m.id, {
        team_1_score: score1,
        team_2_score: score2,
        match_status: editState.match_status,
        winning_team_id: winnerId,
      })
      setMatches((prev) =>
        prev.map((x) =>
          x.id === m.id
            ? { ...x, team_1_score: score1, team_2_score: score2, match_status: editState.match_status, winning_team_id: winnerId }
            : x
        )
      )
      cancelEdit()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="match-list">
      <h2>Matches</h2>
      {matches.length === 0 ? (
        <p className="empty">No matches yet.</p>
      ) : (
        <ul>
          {matches.map((m) => (
            <li key={m.id}>
              <div className="match-header">
                <div className="match-teams">
                  <span>{m.team_1.team_name}</span>
                  <span className="vs">vs</span>
                  <span>{m.team_2.team_name}</span>
                </div>
                {editingId !== m.id && (
                  <div className="match-actions">
                    <button className="edit-btn" onClick={() => startEdit(m)}>Edit</button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(m.id)}
                      disabled={deletingId === m.id}
                    >
                      {deletingId === m.id ? '…' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>

              {editingId === m.id && editState ? (
                <div className="match-edit">
                  <div className="score-inputs">
                    <div className="score-field">
                      <label>{m.team_1.team_name}</label>
                      <input
                        type="number"
                        min="0"
                        value={editState.team_1_score}
                        onChange={(e) => setEditState({ ...editState, team_1_score: e.target.value })}
                        placeholder="—"
                      />
                    </div>
                    <span className="score-sep">–</span>
                    <div className="score-field">
                      <label>{m.team_2.team_name}</label>
                      <input
                        type="number"
                        min="0"
                        value={editState.team_2_score}
                        onChange={(e) => setEditState({ ...editState, team_2_score: e.target.value })}
                        placeholder="—"
                      />
                    </div>
                  </div>
                  <select
                    value={editState.match_status}
                    onChange={(e) => setEditState({ ...editState, match_status: e.target.value as MatchStatus })}
                  >
                    {MATCH_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                  <select
                    value={editState.winning_team_id}
                    onChange={(e) => setEditState({ ...editState, winning_team_id: e.target.value })}
                  >
                    <option value="">No winner</option>
                    <option value={m.team_1_id}>{m.team_1.team_name}</option>
                    <option value={m.team_2_id}>{m.team_2.team_name}</option>
                  </select>
                  <div className="edit-actions">
                    <button className="save-btn" onClick={() => saveEdit(m)} disabled={saving}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button className="cancel-btn" onClick={cancelEdit} disabled={saving}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="match-meta">
                  <span className={`status status-${m.match_status}`}>
                    {STATUS_LABEL[m.match_status] ?? m.match_status}
                  </span>
                  {m.team_1_score != null && m.team_2_score != null && (
                    <span className="score">{m.team_1_score} – {m.team_2_score}</span>
                  )}
                  {m.winning_team_id != null && (
                    <span className="winner">
                      🏆 {m.winning_team_id === m.team_1_id ? m.team_1.team_name : m.team_2.team_name}
                    </span>
                  )}
                  {m.reference_object_type && (
                    <span className="reference">{m.reference_object_type} #{m.reference_object_id}</span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
