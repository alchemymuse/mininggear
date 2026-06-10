"use client";

import { useRouter, useSearchParams } from "next/navigation";

const CONDS: [string, string][] = [
  ["new", "New"],
  ["used", "Used / Grade A"],
  ["repair", "For parts"],
];

export default function Filters({
  states,
  condCounts,
  stateCounts,
}: {
  states: string[];
  condCounts: Record<string, number>;
  stateCounts: Record<string, number>;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const list = (key: string) => (sp.get(key) ? sp.get(key)!.split(",").filter(Boolean) : []);
  const conds = list("cond");
  const sts = list("st");

  function push(next: URLSearchParams) {
    const qs = next.toString();
    router.push(qs ? `/browse?${qs}` : "/browse");
  }
  function setMulti(key: string, value: string, on: boolean) {
    const cur = new Set(list(key));
    on ? cur.add(value) : cur.delete(value);
    const next = new URLSearchParams(sp.toString());
    cur.size ? next.set(key, Array.from(cur).join(",")) : next.delete(key);
    push(next);
  }
  function setVal(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    value ? next.set(key, value) : next.delete(key);
    push(next);
  }
  function clearAll() {
    const next = new URLSearchParams();
    const cat = sp.get("cat");
    const q = sp.get("q");
    if (cat) next.set("cat", cat);
    if (q) next.set("q", q);
    push(next);
  }

  const hasFilters = conds.length || sts.length || sp.get("ship") || sp.get("min") || sp.get("max");

  return (
    <aside className="filters">
      <div className="fh">
        <b>Filters</b>
        {hasFilters ? <a onClick={clearAll}>Clear all</a> : null}
      </div>

      <div className="fgroup">
        <h3>Condition</h3>
        {CONDS.map(([v, label]) => (
          <label className="fopt" key={v}>
            <input type="checkbox" checked={conds.includes(v)} onChange={(e) => setMulti("cond", v, e.target.checked)} />
            {label}
            <span className="ct">{condCounts[v] ?? 0}</span>
          </label>
        ))}
      </div>

      <div className="fgroup">
        <h3>Location</h3>
        {states.map((s) => (
          <label className="fopt" key={s}>
            <input type="checkbox" checked={sts.includes(s)} onChange={(e) => setMulti("st", s, e.target.checked)} />
            {s}
            <span className="ct">{stateCounts[s] ?? 0}</span>
          </label>
        ))}
      </div>

      <div className="fgroup">
        <h3>Price (USD)</h3>
        <div className="frange">
          <input type="number" placeholder="Min" defaultValue={sp.get("min") ?? ""} onBlur={(e) => setVal("min", e.target.value)} />
          <span>–</span>
          <input type="number" placeholder="Max" defaultValue={sp.get("max") ?? ""} onBlur={(e) => setVal("max", e.target.value)} />
        </div>
      </div>

      <div className="fgroup">
        <h3>Logistics</h3>
        <label className="fopt">
          <input type="checkbox" checked={!!sp.get("ship")} onChange={(e) => setVal("ship", e.target.checked ? "1" : "")} />
          Shippable only
        </label>
      </div>
    </aside>
  );
}
