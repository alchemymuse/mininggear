import Link from "next/link";
import Header from "@/components/Header";
import ListingCard from "@/components/ListingCard";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { CATEGORIES } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  const [featured, favs, counts, totalCount] = await Promise.all([
    prisma.listing.findMany({
      where: { featured: true, status: "active" },
      include: { specs: { orderBy: { sort: "asc" } }, images: { orderBy: { sort: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    user ? prisma.favorite.findMany({ where: { userId: user.id }, select: { listingId: true } }) : Promise.resolve([]),
    prisma.listing.groupBy({ by: ["category"], _count: true, where: { status: "active" } }),
    prisma.listing.count({ where: { status: "active" } }),
  ]);
  const favIds = new Set(favs.map((f) => f.listingId));
  const countFor = (cat: string) => counts.find((c) => c.category === cat)?._count ?? 0;

  return (
    <>
      <Header />
      <main className="page">
        <section className="hero">
          <span className="eyebrow"><span className="dot" />Now live across 6 US states</span>
          <h1>The marketplace for used <em>Bitcoin mining</em> hardware &amp; sites.</h1>
          <p>
            Miners, transformers, switchgear, cabling, breakers, cooling and full mining sites —
            standardized specs, verified sellers, and tracked deal requests from first message to close.
          </p>
          <div className="hero-cta">
            <Link href="/browse" className="btn btn-primary btn-lg">Browse the market →</Link>
            <Link href="/sell" className="btn btn-ghost btn-lg">List equipment</Link>
          </div>
          <div className="hero-stats">
            <div><b>{totalCount.toLocaleString()}</b><span>Live listings</span></div>
            <div><b>33 MW</b><span>Site power available</span></div>
            <div><b>{counts.length}</b><span>Active categories</span></div>
            <div><b>$0.038</b><span>Lowest $/kWh listed</span></div>
          </div>
        </section>

        <div className="section-h">
          <div>
            <h2>Browse by category</h2>
            <div className="sub">Structured specs for every equipment class</div>
          </div>
          <Link href="/browse">View all →</Link>
        </div>
        <div className="catgrid">
          {CATEGORIES.map((c) => (
            <Link key={c.id} href={`/browse?cat=${c.id}`} className="catcard">
              <div className="ic">{c.emoji}</div>
              <div><b>{c.name}</b><small>{countFor(c.id)} listed</small></div>
            </Link>
          ))}
        </div>

        <div className="section-h">
          <div>
            <h2>Featured listings</h2>
            <div className="sub">Hand-picked from verified sellers</div>
          </div>
          <Link href="/browse">See more →</Link>
        </div>
        <div className="grid">
          {featured.map((l) => (
            <ListingCard key={l.id} l={l} isFav={favIds.has(l.id)} returnTo="/" />
          ))}
        </div>
      </main>
    </>
  );
}
