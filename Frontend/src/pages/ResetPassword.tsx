import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import '../style/Login.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(token!, password);
      setMessage('Password reset! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login">
      <div className="oval"></div>
      <div className="left">
        <h1 className="word-white">Fifty</h1>
        <h1 className="word-green">Sense</h1>
        <h2>Budget Smarter.</h2>
        <h2>Live Better.</h2>
      </div>
      <div className="right">
        <h1>Reset Password</h1>
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="input-wrapper">
            <img className="email" src="/images/password.png" alt="Password icon" />
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="input-wrapper">
            <img className="email" src="/images/password.png" alt="Confirm icon" />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {message && <p className="auth-success">{message}</p>}
          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p>
          Remember your password? <Link to="/login">Sign In</Link>
        </p>
      </div>
      <div className="vl"></div>
    </div>
  );
}