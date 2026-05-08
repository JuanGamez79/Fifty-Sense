import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import '../style/Login.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      await forgotPassword(email);
      setMessage('If that email exists, a reset link has been sent.');
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
        <h1>Forgot Password</h1>
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="input-wrapper">
            <img className="email" src="/images/email.png" alt="Email icon" />
            <input
              type="email"
              placeholder="name@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {message && <p className="auth-success">{message}</p>}
          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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