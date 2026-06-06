import { supabase } from './supabase'

export type Player = {
  id: number
  name: string
}

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase.from('Player').select('id, name').order('name')
  if (error) throw error
  return data
}

export async function createPlayer(name: string): Promise<Player> {
  const { data, error } = await supabase.from('Player').insert({ name }).select().single()
  if (error) throw error
  return data
}

export async function getUnassignedPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('Player')
    .select('id, name')
    .is('team_id', null)
    .order('name')
  if (error) throw error
  return data
}

export async function assignPlayerToTeam(playerId: number, teamId: string): Promise<void> {
  const { error } = await supabase.from('Player').update({ team_id: teamId }).eq('id', playerId)
  if (error) throw error
}

export async function removePlayerFromTeam(playerId: number): Promise<void> {
  const { error } = await supabase.from('Player').update({ team_id: null }).eq('id', playerId)
  if (error) throw error
}

export async function randomizePlayersToTeams(
  players: Player[],
  teams: import('./teams').Team[]
): Promise<void> {
  const slots: string[] = []
  for (const team of teams) {
    for (let i = team.Player.length; i < 2; i++) {
      slots.push(team.id)
    }
  }

  const shuffled = [...players].sort(() => Math.random() - 0.5)
  await Promise.all(
    shuffled.slice(0, slots.length).map((player, i) =>
      supabase.from('Player').update({ team_id: slots[i] }).eq('id', player.id)
    )
  )
}
