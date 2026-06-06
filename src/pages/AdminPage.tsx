import { useState } from 'react'
import PlayerList from '../components/PlayerList'
import PlayerForm from '../components/PlayerForm'
import TeamList from '../components/TeamList'
import TeamForm from '../components/TeamForm'
import PoolList from '../components/PoolList'
import PoolForm from '../components/PoolForm'
import MatchList from '../components/MatchList'
import MatchForm from '../components/MatchForm'
import KnockoutList from '../components/KnockoutList'
import KnockoutForm from '../components/KnockoutForm'
import type { Player } from '../lib/players'
import type { Team } from '../lib/teams'
import type { Pool } from '../lib/pools'
import type { Match } from '../lib/matches'
import type { Knockout } from '../lib/knockouts'
import './AdminPage.css'

type AdminSection = 'players' | 'teams' | 'pools' | 'matches' | 'knockout'

export default function AdminPage() {
  const [section, setSection] = useState<AdminSection>('players')
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [pools, setPools] = useState<Pool[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [knockouts, setKnockouts] = useState<Knockout[]>([])

  return (
    <div className="admin">
      <nav className="admin-nav">
        <button
          className={section === 'players' ? 'active' : ''}
          onClick={() => setSection('players')}
        >
          Players {players.length > 0 && <span className="tab-count">{players.length}</span>}
        </button>
        <button
          className={section === 'teams' ? 'active' : ''}
          onClick={() => setSection('teams')}
        >
          Teams {teams.length > 0 && <span className="tab-count">{teams.length}</span>}
        </button>
        <button
          className={section === 'pools' ? 'active' : ''}
          onClick={() => setSection('pools')}
        >
          Pools {pools.length > 0 && <span className="tab-count">{pools.length}</span>}
        </button>
        <button
          className={section === 'matches' ? 'active' : ''}
          onClick={() => setSection('matches')}
        >
          Matches {matches.length > 0 && <span className="tab-count">{matches.length}</span>}
        </button>
        <button
          className={section === 'knockout' ? 'active' : ''}
          onClick={() => setSection('knockout')}
        >
          Knockout {knockouts.length > 0 && <span className="tab-count">{knockouts.length}</span>}
        </button>
      </nav>

      {section === 'players' && (
        <div className="admin-content">
          <PlayerList players={players} setPlayers={setPlayers} />
          <PlayerForm onCreated={(p) => setPlayers((prev) => [...prev, p])} />
        </div>
      )}

      {section === 'teams' && (
        <div className="admin-content">
          <TeamList teams={teams} setTeams={setTeams} />
          <TeamForm onCreated={(t) => setTeams((prev) => [...prev, t])} />
        </div>
      )}

      {section === 'pools' && (
        <div className="admin-content">
          <PoolList pools={pools} setPools={setPools} />
          <PoolForm onCreated={(p) => setPools((prev) => [...prev, p])} />
        </div>
      )}

      {section === 'matches' && (
        <div className="admin-content">
          <MatchList matches={matches} setMatches={setMatches} />
          <MatchForm onCreated={(m) => setMatches((prev) => [...prev, m])} />
        </div>
      )}

      {section === 'knockout' && (
        <div className="admin-content">
          <KnockoutList knockouts={knockouts} setKnockouts={setKnockouts} />
          <KnockoutForm onCreated={(k) => setKnockouts((prev) => [...prev, k])} />
        </div>
      )}
    </div>
  )
}
