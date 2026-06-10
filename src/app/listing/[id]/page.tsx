import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import DealRequestModal from "@/components/DealRequestModal";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { catEmoji, catName, condLabel, condCls } from "@/lib/catalog";
import { toggleFavorite } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const user = await getSessionUser();
  const l = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { specs: { orderBy: { sort: "asc" } }, images: { orderBy: { sort: "asc" } }, seller: true },
  });
  if (!l) notFound();

  const fav = user
    ? await prisma.favorite.findUnique({ where: { userId_listingId: { userId: user.id, listingId: l.id } } })
    : null;
  const isFav = !!fav;
  const emoji = catEmoji(l.category);

  return (
    <>
      <Header activeCat={l.category} />
      <main className="page">
        <Link href={`/browse?cat=${l.category}`} className="back">← Back to {catName(l.category)}</Link>
        <div className="detail">
          <div className="gallery">
            <div className="main-img">
              <div className="glow" />
              {l.images.length > 0 ? <img src={l.images[0].url} alt={l.title} /> : <span className="icn">{emoji}</span>}
            </div>
            <div className="thumbs">
              {l.images.length > 0
                ? l.images.map((img) => (
                    <div key={img.id} className="thumb-img"><img src={img.url} alt="" /></div>
                  ))
                : [0, 1, 2, 3].map((i) => <div key={i}>{emoji}</div>)}
            </div>
          </div>
          <div className="dinfo">
            <span className="kicker">{l.brand || catName(l.category)} · {catName(l.category)}</span>
            <h1>{l.title}</h1>
            <div className="dmeta">
              <span className={`cond ${condCls(l.condition)}`} style={{ margin: 0 }}>{condLabel(l.condition)}</span>
              <span>📍 {l.city}, {l.state}</span>
              <span>{l.shippable ? "· Ships nationwide" : "· Pickup / freight"}</span>
            </div>
            <div className="dprice">
              {l.price > 0 ? (
                <>${l.price.toLocaleString()}<small> {l.unit} · {l.quantity} in stock</small></>
              ) : (
                <>Price on ask<small> · start a deal request</small></>
              )}
            </div>
            <table className="spectab">
              <tbody>
                {l.specs.map((s) => (
                  <tr key={s.id}><td>{s.key}</td><td>{s.value}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="seller">
              <div className="row">
                <div className="savatar">{(l.seller.company || "?")[0]}</div>
                <div>
                  <b>{l.seller.company}</b>
                  <div className="meta">Seller · member since 2023</div>
                </div>
                {l.seller.verified
                  ? <span className="vbadge">✓ Verified business</span>
                  : <span className="vbadge no">Unverified</span>}
              </div>
            </div>
            <div className="cta-row">
              <DealRequestModal
                listingId={l.id}
                title={l.title}
                emoji={emoji}
                seller={l.seller.company}
                city={l.city}
                state={l.state}
                price={l.price}
                isSite={l.category === "site"}
              />
              <form action={toggleFavorite} style={{ flex: 1 }}>
                <input type="hidden" name="listingId" value={l.id} />
                <input type="hidden" name="returnTo" value={`/listing/${l.id}`} />
                <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", padding: 14 }}>
                  {isFav ? "★ Saved" : "☆ Save"}
                </button>
              </form>
            </div>
            <div className="trust">
              <span>🛡️ Verified listing</span>
              <span>📦 Tracked deal requests</span>
              <span>🔒 Secure messaging</span>
            </div>
          </div>

          {l.description && (
            <div className="desc">
              <h3>Description</h3>
              <p>{l.description}</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
