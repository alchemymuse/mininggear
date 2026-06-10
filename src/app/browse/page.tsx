import Link from "next/link";
import Header from "@/components/Header";
import ListingCard from "@/components/ListingCard";
import Filters from "@/components/Filters";
import SortSelect from "@/components/SortSelect";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { catName, US_STATES } from "@/lib/catalog";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type SP = { [k: string]: string | undefined };

export default async function BrowsePage({ searchParams: searchParamsPromise }: { searchParams: Promise<SP> }) {
  const searchParams = await searchParamsPromise;
  const user = await getSessionUser();
  const cat = searchParams.cat;
  const q = (searchParams.q ?? "").trim();
  const conds = (searchParams.cond ?? "").split(",").filter(Boolean);
  const sts = (searchParams.st ?? "").split(",").filter(Boolean);
  const ship = searchParams.ship === "1";
  const min = searchParams.min ? Number(searchParams.min) : undefined;
  const max = searchParams.max ? Number(searchParams.max) : undefined;
  const sort = searchParams.sort ?? "feat";

  const AND: Prisma.ListingWhereInput[] = [{ status: "active" }];
  if (cat) AND.push({ category: cat });
  if (q) AND.push({ OR: [{ title: { contains: q } }, { brand: { contains: q } }, { city: { contains: q } }] });
  if (conds.length) AND.push({ condition: { in: conds } });
  if (sts.length) AND.push({ state: { in: sts } });
  if (ship) AND.push({ shippable: true });
  if (min !== undefined) AND.push({ OR: [{ price: { gte: min } }, { price: 0 }] });
  if (max !== undefined) AND.push({ OR: [{ price: { lte: max } }, { price: 0 }] });
  const where: Prisma.ListingWhereInput = { AND };

  const [rowsRaw, favs, condGroups, stateGroups] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { specs: { orderBy: { sort: "asc" } }, images: { orderBy: { sort: "asc" } } },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    }),
    user ? prisma.favorite.findMany({ where: { userId: user.id }, select: { listingId: true } }) : Promise.resolve([]),
    prisma.listing.groupBy({ by: ["condition"], _count: true, where: { status: "active", ...(cat ? { category: cat } : {}) } }),
    prisma.listing.groupBy({ by: ["state"], _count: true, where: { status: "active", ...(cat ? { category: cat } : {}) } }),
  ]);

  let rows = rowsRaw;
  if (sort === "plow") rows = [...rows].sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
  if (sort === "phigh") rows = [...rows].sort((a, b) => (b.price || 0) - (a.price || 0));

  const favIds = new Set(favs.map((f) => f.listingId));
  const condCounts: Record<string, number> = {};
  condGroups.forEach((g) => (condCounts[g.condition] = g._count));
  const stateCounts: Record<string, number> = {};
  stateGroups.forEach((g) => (stateCounts[g.state] = g._count));

  const returnTo = `/browse?${new URLSearchParams(searchParams as Record<string, string>).toString()}`;

  return (
    <>
      <Header activeCat={cat} />
      <main className="page">
        <Link href="/" className="back">← Home</Link>
        <div className="section-h" style={{ marginTop: 0 }}>
          <div>
            <h2>{cat ? catName(cat) : "All equipment"}</h2>
            <div className="sub">
              {q ? `Results for "${q}"` : "Used mining hardware, power gear & sites across the US"}
            </div>
          </div>
        </div>
        <div className="browse">
          <Filters states={US_STATES} condCounts={condCounts} stateCounts={stateCounts} />
          <div>
            <div className="list-top">
              <span className="cnt"><b>{rows.length}</b> {rows.length === 1 ? "result" : "results"}</span>
              <SortSelect />
            </div>
            {rows.length ? (
              <div className="grid">
                {rows.map((l) => (
                  <ListingCard key={l.id} l={l} isFav={favIds.has(l.id)} returnTo={returnTo} />
                ))}
              </div>
            ) : (
              <div className="empty">
                <span className="e">🔍</span>No listings match these filters. Try widening your search.
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
