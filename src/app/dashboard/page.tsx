import Link from "next/link";
import Header from "@/components/Header";
import ListingCard from "@/components/ListingCard";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { catEmoji, catName } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const REQ_STATUS: Record<string, [string, string]> = {
  new: ["s-new", "Awaiting seller"],
  prog: ["s-prog", "In negotiation"],
  done: ["s-done", "Closed"],
  closed: ["s-done", "Closed"],
};
const LISTING_STATUS: Record<string, [string, string]> = {
  active: ["s-done", "Active"],
  pending: ["s-prog", "In review"],
  rejected: ["s-new", "Needs changes"],
  matched: ["s-done", "Matched"],
  delisted: ["s-new", "Delisted"],
};

export default async function DashboardPage({ searchParams: searchParamsPromise }: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await searchParamsPromise;
  const user = await requireUser();
  const tab = searchParams.tab ?? "listings";

  const [listings, requests, favs] = await Promise.all([
    prisma.listing.findMany({ where: { sellerId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.matchRequest.findMany({ where: { buyerId: user.id }, include: { listing: true }, orderBy: { createdAt: "desc" } }),
    prisma.favorite.findMany({
      where: { userId: user.id },
      include: { listing: { include: { specs: { orderBy: { sort: "asc" } }, images: { orderBy: { sort: "asc" } } } } },
      orderBy: { id: "desc" },
    }),
  ]);

  const tabLink = (id: string, label: string, n: number) => (
    <Link href={`/dashboard?tab=${id}`} className={`tab ${tab === id ? "on" : ""}`}>{label} · {n}</Link>
  );

  return (
    <>
      <Header />
      <main className="page">
        <div className="dbhead">
          <div className="savatar">{(user.company || "?").slice(0, 1).toUpperCase()}</div>
          <div>
            <h2>{user.company || user.email}</h2>
            <div className="meta">
              {user.verified ? <span className="vbadge">✓ Verified business</span> : <span className="vbadge no">Unverified</span>}
              · {user.role}
            </div>
          </div>
        </div>

        <div className="tabs">
          {tabLink("listings", "My listings", listings.length)}
          {tabLink("requests", "Deal requests", requests.length)}
          {tabLink("favs", "Saved", favs.length)}
        </div>

        {tab === "listings" && (
          listings.length ? listings.map((l) => {
            const [cls, label] = LISTING_STATUS[l.status] ?? ["s-new", l.status];
            return (
              <div className="dbrow" key={l.id}>
                <div className="ph">{catEmoji(l.category)}</div>
                <div className="meta">
                  <b>{l.title}</b>
                  <div>{catName(l.category)} · Qty {l.quantity} · {l.price > 0 ? `$${l.price.toLocaleString()} ${l.unit}` : "POA"} · 📍 {l.city}, {l.state}</div>
                </div>
                <span className={`status ${cls}`}>{label}</span>
                <Link href={`/listing/${l.id}`} className="btn btn-ghost">View</Link>
              </div>
            );
          }) : <div className="empty"><span className="e">📦</span>No listings yet. Use &quot;Sell equipment&quot; to add one — it&apos;ll go to admin review.</div>
        )}

        {tab === "requests" && (
          requests.length ? requests.map((r) => {
            const [cls, label] = REQ_STATUS[r.status] ?? ["s-new", r.status];
            return (
              <div className="dbrow" key={r.id}>
                <div className="ph">{catEmoji(r.listing.category)}</div>
                <div className="meta">
                  <b>{r.listing.title}</b>
                  <div>Qty {r.intentQty} · Target {r.targetPrice > 0 ? `$${r.targetPrice.toLocaleString()}` : "POA"} · Deliver to {r.deliverTo || "—"}</div>
                </div>
                <span className={`status ${cls}`}>{label}</span>
                <Link href={`/listing/${r.listingId}`} className="btn btn-ghost">View listing</Link>
              </div>
            );
          }) : <div className="empty"><span className="e">📋</span>No deal requests yet. Browse listings and start a deal request to negotiate directly with sellers.</div>
        )}

        {tab === "favs" && (
          favs.length ? (
            <div className="grid">
              {favs.map((f) => (
                <ListingCard key={f.id} l={f.listing} isFav returnTo="/dashboard?tab=favs" />
              ))}
            </div>
          ) : <div className="empty"><span className="e">⭐</span>No saved listings yet. Browse and save listings you&apos;re interested in.</div>
        )}
      </main>
    </>
  );
}
