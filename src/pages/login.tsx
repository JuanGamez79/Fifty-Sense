import '../style/login.css';

export default function Login() {
    return (
        <div className="login">
            <div className="oval"></div>
            <div className="left">
                <h1 className = "word-white"> Fifty</h1>
                <h1 className = "word-green"> Sense</h1>
                 <h2>Budget Smarter.</h2>
                <h2>Live Better.</h2>
                <h5>Track spending, set budgets, and get AI insights to make<br></br>
                smarter decisions</h5>
            </div>
             <div className="right">
                <h1>Welcome Back</h1>



                <img className="email" src="/images/email.png"></img>
                <input type="email" placeholder="name@email.com" />

                <img className="password" src="/images/password.png"></img>
                <input type="password" placeholder="Password" />


                <a href="#">Forgot Password?</a>
                <a href="/Dashboard">
                <button type="button">Sign In</button>
                </a>
                <p>Don't have an account? <a href="/register">Sign Up</a></p>
            </div>
            <div className="vl"></div>
        </div>
    );
}