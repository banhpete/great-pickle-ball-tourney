import { supabase } from './supabase'

export type MatchStatus = 'pending' | 'in_progress' | 'completed'
export type ReferenceObjectType = 'Pool' | 'Knockout'

export const MATCH_STATUSES: MatchStatus[] = ['pending', 'in_progress', 'completed']
export const REFERENCE_OBJECT_TYPES: ReferenceObjectType[] = ['Pool', 'Knockout']

export type MatchTeam = { id: string; team_name: string }

export type Match = {
  id: string
  team_1_id: number
  team_2_id: number
  team_1_score: number | null
  team_2_score: number | null
  match_status: MatchStatus
  reference_object_type: ReferenceObjectType | null
  reference_object_id: number | null
  winning_team_id: number | null
  knockout_order: number | null
  team_1: MatchTeam
  team_2: MatchTeam
}

export type CreateMatchInput = {
  team_1_id: number
  team_2_id: number
  match_status: MatchStatus
  reference_object_type: ReferenceObjectType | null
  reference_object_id: number | null
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
    team_1_id: Number(m.team_1_id),
    team_2_id: Number(m.team_2_id),
    reference_object_id: m.reference_object_id != null ? Number(m.reference_object_id) : null,
    winning_team_id: m.winning_team_id != null ? Number(m.winning_team_id) : null,
    knockout_order: m.knockout_order != null ? Number(m.knockout_order) : null,
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
          team_1_id: Number(pool.teams[i].id),
          team_2_id: Number(pool.teams[j].id),
          match_status: 'pending',
          reference_object_type: 'Pool',
          reference_object_id: Number(pool.id),
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

export async function generateKnockoutMatches(
  knockout: { id: number; pool_1_id: number; pool_2_id: number; number_of_teams_from_pool: number },
  pools: { id: string; teams: { id: string }[] }[],
  matches: Match[]
): Promise<void> {
  const pool1 = pools.find((p) => Number(p.id) === knockout.pool_1_id)
  const pool2 = pools.find((p) => Number(p.id) === knockout.pool_2_id)
  if (!pool1 || !pool2) throw new Error('Pool not found')

  const n = knockout.number_of_teams_from_pool

  function rankTeams(poolId: number, teams: { id: string }[]) {
    const poolMatches = matches.filter(
      (m) => m.reference_object_type === 'Pool' && m.reference_object_id === poolId
    )
    const winsMap = new Map<number, number>(teams.map((t) => [Number(t.id), 0]))
    for (const m of poolMatches) {
      if (m.winning_team_id != null && winsMap.has(m.winning_team_id)) {
        winsMap.set(m.winning_team_id, (winsMap.get(m.winning_team_id) ?? 0) + 1)
      }
    }
    return [...teams].sort(
      (a, b) => (winsMap.get(Number(b.id)) ?? 0) - (winsMap.get(Number(a.id)) ?? 0)
    )
  }

  const ranked1 = rankTeams(knockout.pool_1_id, pool1.teams).slice(0, n)
  const ranked2 = rankTeams(knockout.pool_2_id, pool2.teams).slice(0, n)

  // Best from pool1 vs worst from pool2, 2nd best from pool1 vs 2nd worst from pool2, etc.
  const rows = ranked1.map((team1, i) => ({
    team_1_id: Number(team1.id),
    team_2_id: Number(ranked2[n - 1 - i].id),
    match_status: 'pending',
    reference_object_type: 'Knockout',
    reference_object_id: knockout.id,
    team_1_score: null,
    team_2_score: null,
    winning_team_id: null,
    knockout_order: i,
  }))

  if (!rows.length) return
  const { error } = await supabase.from('Match').insert(rows)
  if (error) throw error
}

export async function deleteMatch(id: string): Promise<void> {
  const { error } = await supabase.from('Match').delete().eq('id', id)
  if (error) throw error
}

export async function updateMatch(
  id: string,
  input: { team_1_score: number | null; team_2_score: number | null; match_status: MatchStatus; winning_team_id: number | null }
): Promise<void> {
  const { error } = await supabase.from('Match').update(input).eq('id', id)
  if (error) throw error
}

export async function createKnockoutMatch(
  team1: MatchTeam,
  team2: MatchTeam,
  knockoutId: number,
  knockoutOrder: number
): Promise<Match> {
  const { data, error } = await supabase
    .from('Match')
    .insert({
      team_1_id: Number(team1.id),
      team_2_id: Number(team2.id),
      match_status: 'pending',
      reference_object_type: 'Knockout',
      reference_object_id: knockoutId,
      knockout_order: knockoutOrder,
      team_1_score: null,
      team_2_score: null,
      winning_team_id: null,
    })
    .select()
    .single()
  if (error) throw error
  return {
    ...data,
    id: String(data.id),
    team_1_id: Number(data.team_1_id),
    team_2_id: Number(data.team_2_id),
    reference_object_id: data.reference_object_id != null ? Number(data.reference_object_id) : null,
    winning_team_id: data.winning_team_id != null ? Number(data.winning_team_id) : null,
    knockout_order: data.knockout_order != null ? Number(data.knockout_order) : null,
    team_1: team1,
    team_2: team2,
  }
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
    reference_object_id: data.reference_object_id != null ? Number(data.reference_object_id) : null,
    team_1: team1,
    team_2: team2,
  }
}
