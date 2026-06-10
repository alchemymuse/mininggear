"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortSelect() {
  const router = useRouter();
  const sp = useSearchParams();
  const value = sp.get("sort") ?? "feat";

  function onChange(v: string) {
    const next = new URLSearchParams(sp.toString());
    v === "feat" ? next.delete("sort") : next.set("sort", v);
    const qs = next.toString();
    router.push(qs ? `/browse?${qs}` : "/browse");
  }

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="feat">Recommended</option>
      <option value="plow">Price: low to high</option>
      <option value="phigh">Price: high to low</option>
    </select>
  );
}
