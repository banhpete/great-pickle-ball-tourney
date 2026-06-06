import { useState } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import AdminPage from "./pages/AdminPage";
import TeamsPage from "./pages/TeamsPage";
import HomePage from "./pages/HomePage";
import KnockoutPage from "./pages/KnockoutPage";
import RulesPage from "./pages/RulesPage";
import logoImg from "./assets/logo.png";
import "./App.css";

function App() {
  const location = useLocation();
  const poolPlayActive =
    location.pathname === "/" || location.pathname === "/pool-play";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="layout">
      <header className="header">
        <img src={logoImg} alt="Great Pickleball Tourney" className="header-logo" />
        <button
          className="burger"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className={`header-nav${menuOpen ? " header-nav-open" : ""}`}>
          <NavLink
            to="/"
            className={poolPlayActive ? "nav-link nav-link-active" : "nav-link"}
            onClick={() => setMenuOpen(false)}
          >
            Pool Play
          </NavLink>
          <NavLink
            to="/knockout"
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
            onClick={() => setMenuOpen(false)}
          >
            Knockout
          </NavLink>
          <NavLink
            to="/rules"
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
            onClick={() => setMenuOpen(false)}
          >
            Rules
          </NavLink>
          <NavLink
            to="/teams"
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
            onClick={() => setMenuOpen(false)}
          >
            Teams
          </NavLink>
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pool-play" element={<HomePage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/knockout" element={<KnockoutPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/supersecretadmin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
