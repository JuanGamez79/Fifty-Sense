import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../style/Login.css';
import { useAuth } from '../api/useAuth';
import { loginUser } from '../api/auth';

// Login page. Handles user authentication and redirects to dashboard on success.
// Also displays session expiry messages passed from AuthContext via sessionStorage.

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedMessage = sessionStorage.getItem('authMessage');

    if (savedMessage) {
      setErrorMessage(savedMessage);
      sessionStorage.removeItem('authMessage');
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.email || !formData.password) {
      setErrorMessage('Email and password are required.');
      return;
    }

    try {
      setIsSubmitting(true);

      const { token, user } = await loginUser(formData.email, formData.password);

      login(token, user);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Login request failed:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to reach the server. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login">
      <div className="oval"></div>
      <div className="left">
        <h1 className="word-white"> Fifty</h1>
        <h1 className="word-green"> Sense</h1>
        <h2>Budget Smarter.</h2>
        <h2>Live Better.</h2>
        <h5>Track spending, set budgets, and get AI insights to make<br></br>
        smarter decisions</h5>
      </div>
      <div className="right">
  <h1>Welcome Back</h1>

  <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
    <div className="input-wrapper">
      <img className="email" src="/images/email.png" alt="Email icon" />
      <input
        name="email"
        type="email"
        placeholder="name@email.com"
        value={formData.email}
        onChange={handleChange}
      />
    </div>

    <div className="input-wrapper">
      <img className="password" src="/images/password.png" alt="Password icon" />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
      />
    </div>

    <a href="#">Forgot Password?</a>

    {errorMessage && <p className="auth-error">{errorMessage}</p>}

    <button type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Signing In...' : 'Sign In'}
    </button>
  </form>

  <p>
    Don&apos;t have an account? <Link to="/register">Sign Up</Link>
  </p>
</div>

      <div className="vl"></div>
    </div>
  );
}
