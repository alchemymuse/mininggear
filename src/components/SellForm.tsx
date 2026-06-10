"use client";

import { useState } from "react";
import { createListing, extractDocument } from "@/app/actions";
import { CATEGORIES, SPEC_FIELDS, catName, US_STATES } from "@/lib/catalog";

type Base = {
  title: string; brand: string; condition: string; quantity: string;
  price: string; state: string; city: string; shippable: boolean; description: string;
};
type ExtractState = { status: "idle" | "busy" | "ok" | "err"; msg?: string };

const EMPTY: Base = {
  title: "", brand: "", condition: "new", quantity: "1",
  price: "", state: "TX", city: "", shippable: true, description: "",
};

export default function SellForm() {
  const [cat, setCat] = useState("miner");
  const [base, setBase] = useState<Base>(EMPTY);
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<string[]>([]);
  const [extract, setExtract] = useState<ExtractState>({ status: "idle" });

  const fields = SPEC_FIELDS[cat] ?? [];
  const setB = (k: keyof Base, v: string | boolean) => setBase((b) => ({ ...b, [k]: v }));

  async function onExtract(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtract({ status: "busy", msg: `Reading ${file.name}…` });
    try {
      const fd = new FormData();
      fd.append("doc", file);
      const res = await extractDocument(fd);
      if (res.ok) {
        const d = res.data;
        setCat(d.category || cat);
        setBase((b) => ({
          ...b,
          title: d.title || b.title,
          brand: d.brand || b.brand,
          description: d.description || b.description,
        }));
        setSpecs((s) => ({ ...s, ...d.specs }));
        setExtract({ status: "ok", msg: `Auto-filled ${d.matched} spec field(s) from ${d.source}. Please review before publishing.` });
      } else {
        setExtract({ status: "err", msg: res.error });
      }
    } catch {
      setExtract({ status: "err", msg: "Extraction failed. Fill the form manually." });
    } finally {
      e.target.value = "";
    }
  }

  function onImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  return (
    <form action={createListing} className="form-wrap">
      <input type="hidden" name="category" value={cat} />

      <div className="fstep">
        <div className="sh">
          <span className="sn">1</span>
          <div><h3>Category</h3><div className="substep">Each category has its own spec fields</div></div>
        </div>
        <div className="catselect">
          {CATEGORIES.map((c) => (
            <div key={c.id} className={cat === c.id ? "on" : ""} onClick={() => setCat(c.id)}>
              <span className="e">{c.emoji}</span>
              {c.name}
            </div>
          ))}
        </div>
      </div>

      <div className="fstep">
        <div className="sh">
          <span className="sn">2</span>
          <div><h3>Auto-fill from a spec sheet</h3><div className="substep">Upload a PDF, Excel, or Word file — we extract the details for you</div></div>
        </div>
        <div className="extract-box">
          <div className="row">
            <div className="ic">📄</div>
            <div style={{ flex: 1 }}>
              <b>Drag in a datasheet or quote</b><br />
              <small>PDF · XLSX / CSV · DOCX — fields below fill automatically and stay editable</small>
            </div>
            <label className="btn btn-ghost" style={{ cursor: "pointer" }}>
              Choose file
              <input type="file" accept=".pdf,.xlsx,.xls,.csv,.docx,.txt" hidden onChange={onExtract} />
            </label>
          </div>
          {extract.status !== "idle" && (
            <div className={`extract-status ${extract.status === "ok" ? "ok" : extract.status === "err" ? "err" : "busy"}`}>
              {extract.status === "busy" ? "⏳ " : extract.status === "ok" ? "✓ " : "⚠ "}
              {extract.msg}
            </div>
          )}
        </div>
      </div>

      <div className="fstep">
        <div className="sh">
          <span className="sn">3</span>
          <div><h3>Basics</h3><div className="substep">The core info buyers see first</div></div>
        </div>
        <div className="field">
          <label>Listing title <span className="req">*</span></label>
          <input name="title" required value={base.title} onChange={(e) => setB("title", e.target.value)} placeholder="e.g. Bitmain S21 Pro 234T — 50 units" />
        </div>
        <div className="fgrid">
          <div className="field">
            <label>Brand</label>
            <input name="brand" value={base.brand} onChange={(e) => setB("brand", e.target.value)} placeholder="e.g. Bitmain" />
          </div>
          <div className="field">
            <label>Condition <span className="req">*</span></label>
            <select name="condition" value={base.condition} onChange={(e) => setB("condition", e.target.value)}>
              <option value="new">New</option>
              <option value="used">Used / Grade A</option>
              <option value="refurb">Refurbished</option>
              <option value="repair">For parts / repair</option>
            </select>
          </div>
        </div>
        <div className="fgrid">
          <div className="field">
            <label>Quantity <span className="req">*</span></label>
            <input name="quantity" type="number" required value={base.quantity} onChange={(e) => setB("quantity", e.target.value)} placeholder="1" />
          </div>
          <div className="field">
            <label>Price USD (0 = POA)</label>
            <input name="price" type="number" value={base.price} onChange={(e) => setB("price", e.target.value)} placeholder="0" />
          </div>
        </div>
        <div className="fgrid">
          <div className="field">
            <label>State <span className="req">*</span></label>
            <select name="state" value={base.state} onChange={(e) => setB("state", e.target.value)}>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label>City <span className="req">*</span></label>
            <input name="city" required value={base.city} onChange={(e) => setB("city", e.target.value)} placeholder="e.g. Austin" />
          </div>
        </div>
        <div className="field">
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" name="shippable" checked={base.shippable} onChange={(e) => setB("shippable", e.target.checked)} />
            Shippable nationwide
          </label>
        </div>
      </div>

      <div className="fstep">
        <div className="sh">
          <span className="sn">4</span>
          <div><h3>{catName(cat)} specs</h3><div className="substep">Category-specific fields that power structured search</div></div>
        </div>
        <div className="fgrid">
          {fields.map((f) => (
            <div className="field" key={f.key}>
              <label>{f.label}</label>
              {f.options ? (
                <select name={`spec_${f.key}`} value={specs[f.key] ?? ""} onChange={(e) => setSpecs((s) => ({ ...s, [f.key]: e.target.value }))}>
                  <option value="">—</option>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input name={`spec_${f.key}`} value={specs[f.key] ?? ""} onChange={(e) => setSpecs((s) => ({ ...s, [f.key]: e.target.value }))} placeholder={f.placeholder} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="fstep">
        <div className="sh">
          <span className="sn">5</span>
          <div><h3>Photos</h3><div className="substep">Up to 8 images (JPG, PNG, WebP — max 12 MB each)</div></div>
        </div>
        <label className="uploadbox">
          <span className="e">📸</span>
          Click or drag photos here
          <input type="file" name="images" multiple accept="image/*" hidden onChange={onImages} />
        </label>
        {previews.length > 0 && (
          <div className="thumbs" style={{ marginTop: 14 }}>
            {previews.map((src, i) => (
              <div key={i} className="thumb-img"><img src={src} alt="" /></div>
            ))}
          </div>
        )}
      </div>

      <div className="fstep">
        <div className="sh">
          <span className="sn">6</span>
          <div><h3>Description</h3><div className="substep">Any additional details, history, or notes for buyers</div></div>
        </div>
        <div className="field">
          <textarea name="description" rows={4} value={base.description} onChange={(e) => setB("description", e.target.value)} placeholder="Operating history, reason for sale, included accessories, shipping notes…" />
        </div>
      </div>

      <button className="btn btn-accent btn-lg" style={{ width: "100%", justifyContent: "center", marginTop: 6 }}>
        Submit for review
      </button>
    </form>
  );
}
