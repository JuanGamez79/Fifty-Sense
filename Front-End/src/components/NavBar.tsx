import { Link, NavLink } from 'react-router-dom'
import './nav.css'

export default function NavBar() {
  return (
    <nav className="nav-bar">
      <Link to="/" className="brand">My Budget</Link>
      <div className="nav-links">
        <NavLink to="/dashboard" className={({isActive}) => isActive ? 'active' : ''}>Dashboard</NavLink>
        <NavLink to="/transactions" className={({isActive}) => isActive ? 'active' : ''}>Transactions</NavLink>
        <NavLink to="/budgets" className={({isActive}) => isActive ? 'active' : ''}>Budgets</NavLink>
        <NavLink to="/goals" className={({isActive}) => isActive ? 'active' : ''}>Goals</NavLink>
        <NavLink to="/calendar" className={({isActive}) => isActive ? 'active' : ''}>Calendar</NavLink>
        <NavLink to="/analytics" className={({isActive}) => isActive ? 'active' : ''}>Analytics</NavLink>
        <NavLink to="/ai" className={({isActive}) => isActive ? 'active' : ''}>AI</NavLink>
        <NavLink to="/recap" className={({isActive}) => isActive ? 'active' : ''}>Recap</NavLink>
      </div>
    </nav>
  )
}
