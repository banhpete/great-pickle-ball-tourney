import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { getKnockouts, deleteKnockout, type Knockout } from '../lib/knockouts'
import { getPools, type Pool } from '../lib/pools'
import { getMatches, generateKnockoutMatches, type Match } from '../lib/matches'
import './KnockoutList.css'

type Props = {
  knockouts: Knockout[]
  setKnockouts: Dispatch<SetStateAction<Knockout[]>>
}

export default function KnockoutList({ knockouts, setKnockouts }: Props) {
  const [pools, setPools] = useState<Pool[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [generatingId, setGeneratingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    getKnockouts().then(setKnockouts).catch(console.error)
    getPools().then(setPools).catch(console.error)
    getMatches().then(setMatches).catch(console.error)
  }, [])

  const poolMap = new Map(pools.map((p) => [Number(p.id), p.pool_name]))

  async function handleDelete(id: number) {
    setDeletingId(id)
    try {
      await deleteKnockout(id)
      setKnockouts((prev) => prev.filter((k) => k.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleGenerate(k: Knockout) {
    setGeneratingId(k.id)
    try {
      await generateKnockoutMatches(k, pools, matches)
    } catch (err) {
      console.error(err)
    } finally {
      setGeneratingId(null)
    }
  }

  return (
    <div className="knockout-list">
      <h2>Knockouts</h2>
      {knockouts.length === 0 ? (
        <p className="empty">No knockouts yet.</p>
      ) : (
        <ul>
          {knockouts.map((k) => (
            <li key={k.id}>
              <div className="knockout-header">
                <div className="knockout-pools">
                  <span className="pool-name">{poolMap.get(k.pool_1_id) ?? `Pool ${k.pool_1_id}`}</span>
                  <span className="vs">vs</span>
                  <span className="pool-name">{poolMap.get(k.pool_2_id) ?? `Pool ${k.pool_2_id}`}</span>
                </div>
                <div className="knockout-actions">
                  <button
                    className="generate-btn"
                    onClick={() => handleGenerate(k)}
                    disabled={generatingId === k.id || deletingId === k.id}
                  >
                    {generatingId === k.id ? 'Generating…' : 'Generate Matches'}
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(k.id)}
                    disabled={deletingId === k.id || generatingId === k.id}
                  >
                    {deletingId === k.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
              <span className="teams-count">{k.number_of_teams_from_pool} teams from each pool</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
