import { Routes, Route, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';

import SplashPage from './pages/SplashPage';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';
import AIInsights from './pages/AIInsights';
import MonthlyRecaps from './pages/MonthlyRecaps';
import Register from './pages/Register';
import Login from './pages/Login';

// Root route configuration. Defines public, protected, and fallback routes.
// PublicRoute redirects authenticated users away from login/register.
// PrivateRoute redirects unauthenticated users to login.

export default function App() {
  return (
    <Routes>
      {/* public-only routes */}
      <Route element={<PublicRoute />}>
        <Route path="/" element={<SplashPage />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>

      {/* protected/content routes wrapped with layout/nav */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout><Outlet /></Layout>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="budgets" element={<Budgets />} />
          <Route path="goals" element={<Goals />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="ai" element={<AIInsights />} />
          <Route path="recap" element={<MonthlyRecaps />} />
        </Route>
      </Route>

      {/* fallback for unknown paths */}
      <Route path="*" element={<div>Page not found</div>} />
    </Routes>
  );
}

// will use:
// const Dashboard = lazy(() => import('./pages/Dashboard'));
// in the future for better performance
