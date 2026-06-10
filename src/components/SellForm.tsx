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
          <input name="title" required value={base.titl