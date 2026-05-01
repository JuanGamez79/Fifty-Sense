import { Link, NavLink, useNavigate } from 'react-router-dom';
import '../style/NavBar.css';
import { useAuth } from '../api/useAuth';

// Top navigation bar shown on all protected pages.
// Highlights the active route and handles logout.

// All nav items in one place — add or remove routes here.
const navLinks = [
  { to: '/dashboard',     label: 'Dashboard'     },
  { to: '/transactions',  label: 'Transactions'  },
  { to: '/budgets',       label: 'Budgets'       },
  { to: '/goals',         label: 'Goals'         },
  { to: '/calendar',      label: 'Calendar'      },
  { to: '/analytics',     label: 'Analytics'     },
  { to: '/ai',            label: 'AI'            },
  { to: '/recap',         label: 'Recap'         },
];

export default function NavBar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Clears auth state and redirects to the splash page.
  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <nav className="nav-bar">
    <Link to="/dashboard" className="brand">
      <span className="brand-white">Fifty</span>
      <span className="brand-green">Sense</span>
    </Link>

      <div className="nav-links">
        {navLinks.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => isActive ? 'active' : undefined}
          >
            {label}
          </NavLink>
        ))}
      </div>

      <div className="nav-actions">
        <Link to="/account" className="account-button">
          Account
        </Link>

        <button type="button" className="logout-button" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </nav>
  );
}
