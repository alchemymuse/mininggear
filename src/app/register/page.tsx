import Link from "next/link";
import Header from "@/components/Header";
import { registerUser } from "@/app/auth-actions";

const MSG: Record<string, string> = {
  invalid: "Please enter a company, email, and a password of at least 8 characters.",
  exists: "An account with that email already exists. Try signing in.",
};

export default function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <>
      <Header />
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>Create your seller account</h1>
          <div className="sub">List equipment and manage deal requests on MiningGear.</div>

          {searchParams.error && <div className="auth-err">{MSG[searchParams.error] ?? "Something went wrong."}</div>}

          <form action={registerUser}>
            <div className="field">
              <label>Company name</label>
              <input name="company" required placeholder="WestPower Mining LLC" />
            </div>
            <div className="field">
              <label>Work email</label>
              <input name="email" type="email" required placeholder="you@company.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input name="password" type="password" required minLength={8} placeholder="At least 8 characters" />
            </div>
            <button className="btn btn-primary">Create account</button>
          </form>

          <div className="auth-foot">
            Already have an account? <Link href="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </>
  );
}
