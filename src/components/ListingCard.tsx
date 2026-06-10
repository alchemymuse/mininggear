import Link from "next/link";
import { catEmoji, catName, condLabel, condCls } from "@/lib/catalog";
import { toggleFavorite } from "@/app/actions";

export type CardListing = {
  id: string;
  category: string;
  title: string;
  brand: string | null;
  condition: string;
  quantity: number;
  price: number;
  unit: string;
  state: string;
  city: string;
  featured: boolean;
  specs: { key: string; value: string }[];
  images?: { url: string }[];
};

export default function ListingCard({
  l,
  isFav = false,
  returnTo = "/browse",
}: {
  l: CardListing;
  isFav?: boolean;
  returnTo?: string;
}) {
  const chips = l.specs.slice(0, 2).map((s) => s.value);
  return (
    <div className="card">
      <Link href={`/listing/${l.id}`} className="cardlink">
        <div className="ph">
          <div className="glow" />
          {l.images && l.images.length > 0 ? (
            <img src={l.images[0].url} alt={l.title} />
          ) : (
            <span className="icn">{catEmoji(l.category)}</span>
          )}
          {l.featured ? (
            <span className="tag feat">Featured</span>
          ) : (
            <span className="tag">{catName(l.category)}</span>
          )}
        </div>
        <div className="bd">
          <span className="kicker">{l.brand || catName(l.category)}</span>
          <h4>{l.title}</h4>
          <div className="chips">
            {chips.map((c, i) => (
              <span className="chip" key={i}>{c}</span>
            ))}
            <span className="chip">Qty {l.quantity}</span>
          </div>
          <div className="ft">
            <div>
              <div className="price">
                {l.price > 0 ? (
                  <>${l.price.toLocaleString()}<small> {l.unit}</small></>
                ) : (
                  <span style={{ fontSize: 16 }}>Price on ask</span>
                )}
              </div>
              <span className={`cond ${condCls(l.condition)}`} style={{ marginTop: 6 }}>
                {condLabel(l.condition)}
              </span>
            </div>
            <div className="loc">📍 {l.city}, {l.state}</div>
          </div>
        </div>
      </Link>
      <form action={toggleFavorite} className="fav-form">
        <input type="hidden" name="listingId" value={l.id} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <