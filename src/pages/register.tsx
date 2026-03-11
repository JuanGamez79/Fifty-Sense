import '../style/register.css';
<meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>

export default function Register() {
    return (
        <div className="register">

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
                <h1>Get Started</h1>

                <img className="user" src="/images/fullName.png"></img>
                <input type="username" placeholder="Full Name" />

                <img className="email" src="/images/email.png"></img>
                <input type="email" placeholder="name@email.com" />

                <img className="password" src="/images/password.png"></img>
                <input type="password" placeholder="Password" />

                <img className="password2" src="/images/password.png"></img>
                <input type="password" placeholder="Confirm Password" />

                <p>By signing up, you agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy<br></br> Policy</a>.</p>
                <a href= "/Dashboard">
                <button  type="button">Sign Up</button>
                </a>
                <p>Already have an account? <a href="/login">Log in</a></p>
            </div>
            <div className="vl"></div>
        </div>
    );
}
