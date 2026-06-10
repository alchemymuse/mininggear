import Link from "next/link";
import Header from "@/components/Header";
import { loginWithCredentials, loginWithGoogle } from "@/app/auth-actions";
import { googleEnabled } from "@/auth";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <>
      <Header />
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>Sign in</h1>
          <div className="sub">Access your MiningGear seller workspace.</div>

          {searchParams.error && <div className="auth-err">Invalid email or password. Try again.</div>}

          <form action={loginWithCredentials}>
            <div className="field">
              <label>Work email</label>
              <input name="email" type="email" required placeholder="you@company.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input name="password" type="password" required placeholder="••••••••" />
            </div>
            <button className="btn btn-primary">Sign in</button>
          </form>

          {googleEnabled && (
            <>
              <div className="auth-or">or</div>
              <form action={loginWithGoogle}>
                <button className="btn-google">
                  <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"/></svg>
                  Continue with Google
                </button>
              </form>
            </>
          )}

          <div className="auth-foot">
            New seller? <Link href="/register">Create an account</Link>
          </div>

          <div className="demo-box">
            <b>Demo logins</b><br />
            Seller — <b>ops@westpower.mining</b> / <b>demo1234</b><br />
            Admin — <b>admin@mininggear.io</b> / <b>admin1234</b>
          </div>
        </div>
      </div>
    </>
  );
}
