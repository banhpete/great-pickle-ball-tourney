import { Routes, Route } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import './App.css'

function App() {
  return (
    <div className="layout">
      <header className="header">
        <h1>Great Pickleball Tourney</h1>
      </header>
      <main className="main">
        <Routes>
          <Route path="/supersecretadmin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
