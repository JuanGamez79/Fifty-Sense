import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../style/register.css';
import { useAuth } from '../api/useAuth';
import { registerUser } from '../api/auth';

// Registration page. Validates the form, splits the full name, and creates a new account.
// Redirects to dashboard on success.

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setErrorMessage('All fields are required.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);

      const { token, user } = await registerUser({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email,
        password: formData.password,
      });

      login(token, user);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Register request failed:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to reach the server. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="register">
      <div className="oval"></div>

      <div className="left">
        <h1 className="word-white"> Fifty</h1>
        <h1 className="word-green"> Sense</h1>
        <h2>Budget Smarter.</h2>
        <h2>Live Better.</h2>
        <h5>
          Track spending, set budgets, and get AI insights to make
          <br />
          smarter decisions
        </h5>
      </div>

      <div className="right">
        <h1>Get Started</h1>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="input-wrapper">
            <img className="user" src="/images/fullName.png" alt="User icon" />
            <input
              name="first_name"
              type="text"
              placeholder="First Name"
              value={formData.first_name}
              onChange={handleChange}
            />
          </div>

          <div className="input-wrapper">
            <img className="user" src="/images/fullName.png" alt="User icon" />
            <input
              name="last_name"
              type="text"
              placeholder="Last Name"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>

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

          <div className="input-wrapper">
            <img className="password2" src="/images/password.png" alt="Confirm password icon" />
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <p>
            By signing up, you agree to the <a href="#">Terms of Service</a> and{' '}
            <a href="#">Privacy Policy</a>.
          </p>

          {errorMessage && <p className="auth-error">{errorMessage}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>

      <div className="vl"></div>
    </div>
  );
}