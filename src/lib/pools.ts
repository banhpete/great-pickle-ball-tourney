import { supabase } from './supabase'

export type PoolTeam = {
  id: string
  team_name: string
}

export type Pool = {
  id: string
  pool_name: string
  teams: PoolTeam[]
}

export async function getPools(): Promise<Pool[]> {
  const { data, error } = await supabase
    .from('Pool')
    .select('id, pool_name, Pool_Team_Relationship(team_id, Team(id, team_name))')
    .order('pool_name')
  if (error) throw error
  return data.map((pool) => ({
    id: pool.id,
    pool_name: pool.pool_name,
    teams: (pool.Pool_Team_Relationship ?? [])
      .filter(Boolean)
      .map((r: any) => r.Team)
      .filter(Boolean),
  }))
}

export async function createPool(pool_name: string): Promise<Pool> {
  const { data, error } = await supabase
    .from('Pool')
    .insert({ pool_name })
    .select('id, pool_name')
    .single()
  if (error) throw error
  return { ...data, teams: [] }
}

export async function getUnassignedTeams(): Promise<PoolTeam[]> {
  const [{ data: relationships }, { data: teams, error }] = await Promise.all([
    supabase.from('Pool_Team_Relationship').select('team_id'),
    supabase.from('Team').select('id, team_name').order('team_name'),
  ])
  if (error) throw error
  const assignedIds = new Set((relationships ?? []).map((r) => String(r.team_id)))
  return (teams ?? []).filter((t) => !assignedIds.has(String(t.id)))
}

export async function addTeamToPool(teamId: string, poolId: string): Promise<void> {
  const { error } = await supabase
    .from('Pool_Team_Relationship')
    .insert({ team_id: teamId, pool_id: poolId })
  if (error) throw error
}

export async function removeTeamFromPool(teamId: string, poolId: string): Promise<void> {
  const { error } = await supabase
    .from('Pool_Team_Relationship')
    .delete()
    .eq('team_id', teamId)
    .eq('pool_id', poolId)
  if (error) throw error
}

export async function randomizeTeamsToPools(
  teams: PoolTeam[],
  pools: Pool[]
): Promise<void> {
  const shuffled = [...teams].sort(() => Math.random() - 0.5)
  await Promise.all(
    shuffled.map((team, i) =>
      supabase
        .from('Pool_Team_Relationship')
        .insert({ team_id: team.id, pool_id: pools[i % pools.length].id })
    )
  )
}
