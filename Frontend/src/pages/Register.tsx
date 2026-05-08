import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../style/Register.css';
import { useAuth } from '../api/useAuth';
import { registerUser } from '../api/auth';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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
      !formData.firstName ||
      !formData.lastName ||
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
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
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
          {/* Name Row */}
          <div className="name-row">
            <div className="input-wrapper name-input">
              <img className="user" src="/images/fullName.png" alt="User icon" />
              <input
                name="firstName"
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>

            <div className="input-wrapper name-input no-icon">
              <input
                name="lastName"
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
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

          <p className="terms-text">
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