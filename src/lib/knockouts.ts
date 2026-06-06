import { supabase } from './supabase'

export type Knockout = {
  id: number
  pool_1_id: number
  pool_2_id: number
  number_of_teams_from_pool: number
}

export async function getKnockouts(): Promise<Knockout[]> {
  const { data, error } = await supabase.from('Knockout').select('*').order('id')
  if (error) throw error
  return (data ?? []).map((k) => ({
    id: Number(k.id),
    pool_1_id: Number(k.pool_1_id),
    pool_2_id: Number(k.pool_2_id),
    number_of_teams_from_pool: Number(k.number_of_teams_from_pool),
  }))
}

export async function deleteKnockout(id: number): Promise<void> {
  const { error } = await supabase.from('Knockout').delete().eq('id', id)
  if (error) throw error
}

export async function createKnockout(input: {
  pool_1_id: number
  pool_2_id: number
  number_of_teams_from_pool: number
}): Promise<Knockout> {
  const { data, error } = await supabase
    .from('Knockout')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return {
    id: Number(data.id),
    pool_1_id: Number(data.pool_1_id),
    pool_2_id: Number(data.pool_2_id),
    number_of_teams_from_pool: Number(data.number_of_teams_from_pool),
  }
}
