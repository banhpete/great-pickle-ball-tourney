import { useEffect, useState } from 'react'
import { createMatch, MATCH_STATUSES, REFERENCE_OBJECT_TYPES, type Match, type MatchStatus, type ReferenceObjectType } from '../lib/matches'
import { supabase } from '../lib/supabase'
import './MatchForm.css'

type Team = { id: string; team_name: string }
type PoolOption = { id: string; pool_name: string }

type Props = {
  onCreated: (match: Match) => void
}

export default function MatchForm({ onCreated }: Props) {
  const [teams, setTeams] = useState<Team[]>([])
  const [pools, setPools] = useState<PoolOption[]>([])
  const [team1Id, setTeam1Id] = useState('')
  const [team2Id, setTeam2Id] = useState('')
  const [status, setStatus] = useState<MatchStatus>('pending')
  const [refType, setRefType] = useState<ReferenceObjectType | ''>('')
  const [refId, setRefId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('Team').select('id, team_name').order('team_name').then(({ data }) => {
      setTeams((data ?? []).map((t) => ({ ...t, id: String(t.id) })))
    })
    supabase.from('Pool').select('id, pool_name').order('pool_name').then(({ data }) => {
      setPools((data ?? []).map((p) => ({ ...p, id: String(p.id) })))
    })
  }, [])

  const team2Options = teams.filter((t) => t.id !== team1Id)

  const refOptions: PoolOption[] = refType === 'Pool' ? pools : []

  const isValid = team1Id && team2Id && team1Id !== team2Id && (!refType || refId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    setError(null)
    const team1 = teams.find((t) => t.id === team1Id)!
    const team2 = teams.find((t) => t.id === team2Id)!
    try {
      const match = await createMatch(
        {
          team_1_id: team1Id,
          team_2_id: team2Id,
          match_status: status,
          reference_object_type: refType || null,
          reference_object_id: refId || null,
        },
        team1,
        team2
      )
      onCreated(match)
      setTeam1Id('')
      setTeam2Id('')
      setStatus('pending')
      setRefType('')
      setRefId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="match-form">
      <h2>Add Match</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="team1">Team 1</label>
        <select id="team1" value={team1Id} onChange={(e) => { setTeam1Id(e.target.value); setTeam2Id('') }}>
          <option value="">Select team…</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.team_name}</option>)}
        </select>

        <label htmlFor="team2">Team 2</label>
        <select id="team2" value={team2Id} onChange={(e) => setTeam2Id(e.target.value)} disabled={!team1Id}>
          <option value="">Select team…</option>
          {team2Options.map((t) => <option key={t.id} value={t.id}>{t.team_name}</option>)}
        </select>

        <label htmlFor="status">Status</label>
        <select id="status" value={status} onChange={(e) => setStatus(e.target.value as MatchStatus)}>
          {MATCH_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>

        <label htmlFor="ref-type">Reference Type <span className="optional">(optional)</span></label>
        <select id="ref-type" value={refType} onChange={(e) => { setRefType(e.target.value as ReferenceObjectType | ''); setRefId('') }}>
          <option value="">None</option>
          {REFERENCE_OBJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {refType && (
          <>
            <label htmlFor="ref-id">{refType}</label>
            <select id="ref-id" value={refId} onChange={(e) => setRefId(e.target.value)}>
              <option value="">Select {refType.toLowerCase()}…</option>
              {refOptions.map((o) => <option key={o.id} value={o.id}>{o.pool_name}</option>)}
            </select>
          </>
        )}

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={!isValid || loading}>
          {loading ? 'Adding…' : 'Add Match'}
        </button>
      </form>
    </div>
  )
}
