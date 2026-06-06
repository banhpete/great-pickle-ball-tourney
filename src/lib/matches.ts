import { supabase } from './supabase'

export type MatchStatus = 'pending' | 'in_progress' | 'completed'
export type ReferenceObjectType = 'Pool'

export const MATCH_STATUSES: MatchStatus[] = ['pending', 'in_progress', 'completed']
export const REFERENCE_OBJECT_TYPES: ReferenceObjectType[] = ['Pool']

export type MatchTeam = { id: string; team_name: string }

export type Match = {
  id: string
  team_1_id: string
  team_2_id: string
  team_1_score: number | null
  team_2_score: number | null
  match_status: MatchStatus
  reference_object_type: ReferenceObjectType | null
  reference_object_id: string | null
  team_1: MatchTeam
  team_2: MatchTeam
}

export type CreateMatchInput = {
  team_1_id: string
  team_2_id: string
  match_status: MatchStatus
  reference_object_type: ReferenceObjectType | null
  reference_object_id: string | null
}

export async function getMatches(): Promise<Match[]> {
  const [{ data: raw, error }, { data: teams }] = await Promise.all([
    supabase.from('Match').select('*').order('id'),
    supabase.from('Team').select('id, team_name'),
  ])
  if (error) throw error

  const teamMap = new Map((teams ?? []).map((t) => [String(t.id), t]))
  return (raw ?? []).map((m) => ({
    ...m,
    id: String(m.id),
    team_1_id: String(m.team_1_id),
    team_2_id: String(m.team_2_id),
    reference_object_id: m.reference_object_id ? String(m.reference_object_id) : null,
    team_1: teamMap.get(String(m.team_1_id)) ?? { id: String(m.team_1_id), team_name: 'Unknown' },
    team_2: teamMap.get(String(m.team_2_id)) ?? { id: String(m.team_2_id), team_name: 'Unknown' },
  }))
}

export async function generatePoolMatches(
  pools: { id: string; teams: { id: string }[] }[]
): Promise<void> {
  const rows: object[] = []
  for (const pool of pools) {
    for (let i = 0; i < pool.teams.length; i++) {
      for (let j = i + 1; j < pool.teams.length; j++) {
        rows.push({
          team_1_id: pool.teams[i].id,
          team_2_id: pool.teams[j].id,
          match_status: 'pending',
          reference_object_type: 'Pool',
          reference_object_id: pool.id,
          team_1_score: null,
          team_2_score: null,
        })
      }
    }
  }
  if (!rows.length) return
  const { error } = await supabase.from('Match').insert(rows)
  if (error) throw error
}

export async function updateMatch(
  id: string,
  input: { team_1_score: number | null; team_2_score: number | null; match_status: MatchStatus }
): Promise<void> {
  const { error } = await supabase.from('Match').update(input).eq('id', id)
  if (error) throw error
}

export async function createMatch(
  input: CreateMatchInput,
  team1: MatchTeam,
  team2: MatchTeam
): Promise<Match> {
  const { data, error } = await supabase
    .from('Match')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return {
    ...data,
    id: String(data.id),
    team_1_id: String(data.team_1_id),
    team_2_id: String(data.team_2_id),
    reference_object_id: data.reference_object_id ? String(data.reference_object_id) : null,
    team_1: team1,
    team_2: team2,
  }
}
