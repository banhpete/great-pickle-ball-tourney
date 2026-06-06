import { Routes, Route, NavLink } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import TeamsPage from './pages/TeamsPage'
import logo from './assets/logo.png'
import './App.css'

function App() {
  return (
    <div className="layout">
      <header className="header">
        <img src={logo} alt="Logo" className="header-logo" />
        <h1>Great Pickleball Tourney</h1>
        <nav className="header-nav">
          <NavLink to="/teams" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>
            Teams
          </NavLink>
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/supersecretadmin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
