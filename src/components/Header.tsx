import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog";
import { getSessionUser } from "@/lib/session";
import { logout } from "@/app/auth-actions";

export default async function Header({ activeCat }: { activeCat?: string }) {
  const user = await getSessionUser();

  return (
    <header className="site">
      <div className="nav">
        <Link href="/" className="logo">
          <span className="mark" />
          Mining<b>Gear</b>
        </Link>
        <form action="/browse" className="search">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input name="q" placeholder="Search miners, transformers, sites…" />
        </form>
        <div className="nav-r">
          <Link href="/browse" className="btn btn-ghost">Browse</Link>
          {user ? (
            <>
              {user.role === "admin" && <Link href="/admin" className="btn btn-ghost">Admin</Link>}
              <Link href="/sell" className="btn btn-accent">＋ Sell equipment</Link>
              <Link href="/dashboard" className="avatar" title={user.company || user.email || "Account"}>
                {(user.company || user.email || "?").slice(0, 1).toUpperCase()}
              </Link>
              <form action={logout}>
                <button className="btn btn-ghost" title="Sign out">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Sign in</Link>
              <Link href="/register" className="btn btn-accent">Get started</Link>
            </>
          )}
        </div>
      </div>
      <div className="catstrip">
        <div className="catstrip-in">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={`/browse?cat=${c.id}`}
              className={`catpill ${activeCat === c.id ? "on" : ""}`}
            >
              <span className="ce">{c.emoji}</span>
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
