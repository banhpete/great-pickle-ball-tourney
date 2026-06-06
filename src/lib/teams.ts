import { supabase } from './supabase'
import type { Player } from './players'

export type Team = {
  id: string
  team_name: string
  Player: Player[]
}

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('Team')
    .select('id, team_name, Player(id, name)')
    .order('team_name')
  if (error) throw error
  return data.map((t) => ({ ...t, Player: t.Player.filter(Boolean) }))
}

export async function updateTeam(id: string, team_name: string): Promise<void> {
  const { error } = await supabase.from('Team').update({ team_name }).eq('id', id)
  if (error) throw error
}

export async function createTeam(team_name: string): Promise<Team> {
  const { data, error } = await supabase
    .from('Team')
    .insert({ team_name })
    .select('id, team_name, Player(id, name)')
    .single()
  if (error) throw error
  return { ...data, Player: data.Player.filter(Boolean) }
}
