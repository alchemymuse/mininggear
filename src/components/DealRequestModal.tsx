"use client";

import { useState } from "react";
import { createDealRequest } from "@/app/actions";

export default function DealRequestModal({
  listingId,
  title,
  emoji,
  seller,
  city,
  state,
  price,
  isSite,
}: {
  listingId: string;
  title: string;
  emoji: string;
  seller: string;
  city: string;
  state: string;
  price: number;
  isSite: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn btn-accent" onClick={() => setOpen(true)}>
        Start a deal request
      </button>

      {open && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal">
            <span className="modal-close" onClick={() => setOpen(false)}>×</span>
            <h2>Start a deal request</h2>
            <div className="sub">Send a structured purchase intent — tracked end-to-end on the platform.</div>
            <div className="lref">
              <span className="e">{emoji}</span>
              <div>
                <b>{title}</b>
                <small>{seller} · {city}, {state}</small>
              </div>
            </div>
            <form action={createDealRequest}>
              <input type="hidden" name="listingId" value={listingId} />
              <div className="field">
                <label>Quantity</label>
                <input name="intentQty" type="number" placeholder="e.g. 50" defaultValue={isSite ? 1 : ""} />
              </div>
              <div className="field">
                <label>Target price USD (optional)</label>
                <input name="targetPrice" type="number" placeholder={price ? String(price) : ""} />
              </div>
              <div className="field">
                <label>Deliver to / timeline</label>
                <input name="deliverTo" placeholder="e.g. Austin, TX · within 2 weeks" />
              </div>
              <div className="field">
                <label>Message</label>
                <textarea name="message" rows={3} placeholder="Payment terms, inspection needs, logistics…" />
              </div>
              <button className="btn btn-accent" style={{ width: "100%", justifyContent: "center", padding: 13 }}>
                Send request
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
