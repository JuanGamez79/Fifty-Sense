import '../style/SplashPage.css';
import { Link } from "react-router-dom";

export default function SplashPage() {
  return (
    <div className="splash">
      <div className = "glow"></div>
      <h1 className = "word-white"> Help</h1>
      <h1 className = "word-green"> Sense</h1>
      <h2>Budget Smarter.</h2>
      <h2>Live Better.</h2>
      <h5>Track spending, set budgets, and get AI insights to make<br></br>
      smarter decisions</h5>
      <Link to="/register">
        <button className="register-button" type="button">Start for free</button>
      </Link>
      <Link to="/login">
        <button className='login-button' type="button">Login</button>
      </Link>
          <div className = "splash-image">
          
        <img src="/images/Splash.png" alt="Splash Image" />
      </div>
    </div>

  );
}