import Link from "next/link";
import Header from "@/components/Header";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { catEmoji, catName, condLabel } from "@/lib/catalog";
import { approveListing, rejectListing } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const [pending, recent] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "pending" },
      include: { seller: true, specs: { orderBy: { sort: "asc" } }, images: { orderBy: { sort: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.listing.findMany({
      where: { status: { in: ["active", "rejected"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <>
      <Header />
      <main className="page">
        <div className="section-h" style={{ marginTop: 0 }}>
          <div>
            <h2>Review queue</h2>
            <div className="sub">Approve or reject seller submissions before they go live</div>
          </div>
        </div>

        <div className="admin-note">
          🛡️ <span><b>{pending.length}</b> listing{pending.length === 1 ? "" : "s"} awaiting review. Approved listings appear instantly in Browse.</span>
        </div>

        {pending.length === 0 ? (
          <div className="empty"><span className="e">✅</span>Queue is clear. No listings waiting for review.</div>
        ) : (
          pending.map((l) => (
            <div className="dbrow" key={l.id} style={{ alignItems: "flex-start" }}>
              <div className="ph">
                {l.images.length > 0 ? <img src={l.images[0].url} alt="" /> : catEmoji(l.category)}
              </div>
              <div className="meta">
                <b>{l.title}</b>
                <div>
                  {catName(l.category)} · {condLabel(l.condition)} · Qty {l.quantity} ·{" "}
                  {l.price > 0 ? `$${l.price.toLocaleString()} ${l.unit}` : "POA"} · 📍 {l.city}, {l.state}
                </div>
                <div style={{ marginTop: 4 }}>
                  Seller: <b style={{ color: "var(--ink)" }}>{l.seller.company || l.seller.email}</b>
                  {l.seller.verified ? " · ✓ verified" : " · unverified"} · {l.specs.length} specs · {l.images.length} photos
                </div>
              </div>
              <div className="adm-actions">
                <Link href={`/listing/${l.id}`} className="btn btn-ghost">Preview</Link>
                <form action={approveListing}>
                  <input type="hidden" name="listingId" value={l.id} />
                  <button className="btn btn-primary">Approve</button>
                </form>
                <form action={rejectListing}>
                  <input type="hidden" name="listingId" value={l.id} />
                  <button className="btn btn-danger">Reject</button>
                </form>
              </div>
            </div>
          ))
        )}

        <div className="section-h"><div><h2>Recently reviewed</h2></div></div>
        {recent.map((l) => (
          <div className="dbrow" key={l.id}>
            <div className="ph">{catEmoji(l.category)}</div>
            <div className="meta">
              <b>{l.title}</b>
              <div>{catName(l.category)} · 📍 {l.city}, {l.state}</div>
            </div>
            <span className={`status ${l.status === "active" ? "s-done" : "s-new"}`}>
              {l.status === "active" ? "Live" : "Rejected"}
            </span>
            <Link href={`/listing/${l.id}`} className="btn btn-ghost">View</Link>
          </div>
        ))}
      </main>
    </>
  );
}
