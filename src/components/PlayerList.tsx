import { useEffect } from 'react'
import { getPlayers, type Player } from '../lib/players'
import './PlayerList.css'

type Props = {
  players: Player[]
  setPlayers: (players: Player[]) => void
}

export default function PlayerList({ players, setPlayers }: Props) {
  useEffect(() => {
    getPlayers().then(setPlayers).catch(console.error)
  }, [])

  return (
    <div className="player-list">
      <h2>Players</h2>
      {players.length === 0 ? (
        <p className="empty">No players yet.</p>
      ) : (
        <ul>
          {players.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
