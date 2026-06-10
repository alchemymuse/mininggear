// Shared catalog metadata — safe to import in both server and client components.

export type Cat = { id: string; name: string; emoji: string };

export const CATEGORIES: Cat[] = [
  { id: "miner", name: "ASIC Miners", emoji: "⛏️" },
  { id: "trans", name: "Transformers", emoji: "🔌" },
  { id: "panel", name: "Switchgear", emoji: "🗄️" },
  { id: "cable", name: "Cabling", emoji: "🧵" },
  { id: "breaker", name: "Breakers", emoji: "🔘" },
  { id: "fan", name: "Cooling & Fans", emoji: "🌀" },
  { id: "site", name: "Mining Sites", emoji: "🏭" },
];

export const catName = (id: string) =>
  CATEGORIES.find((c) => c.id === id)?.name ?? id;
export const catEmoji = (id: string) =>
  CATEGORIES.find((c) => c.id === id)?.emoji ?? "📦";

export const CONDITIONS: Record<string, { label: string; cls: string }> = {
  new: { label: "New", cls: "new" },
  used: { label: "Used / Grade A", cls: "used" },
  refurb: { label: "Refurbished", cls: "used" },
  repair: { label: "For parts / repair", cls: "repair" },
};
export const condLabel = (c: string) => CONDITIONS[c]?.label ?? c;
export const condCls = (c: string) => CONDITIONS[c]?.cls ?? "used";

export const US_STATES = ["TX", "GA", "NY", "WA", "NV", "CA"];

// Per-category spec fields rendered in the Sell form.
export type SpecField = { key: string; label: string; options?: string[]; placeholder?: string };

export const SPEC_FIELDS: Record<string, SpecField[]> = {
  miner: [
    { key: "Hashrate", label: "Hashrate (TH/s)", placeholder: "234" },
    { key: "Efficiency", label: "Efficiency (J/TH)", placeholder: "15" },
    { key: "Algorithm", label: "Algorithm", options: ["SHA-256", "Scrypt", "Other"] },
    { key: "Batch", label: "Batch / year", placeholder: "2025 Q4" },
    { key: "PSU included", label: "PSU included", options: ["Yes", "No"] },
    { key: "Firmware lock", label: "Firmware lock", options: ["None", "Yes", "Unknown"] },
  ],
  trans: [
    { key: "Rating", label: "Rating (kVA)", placeholder: "2500" },
    { key: "Primary", label: "Primary voltage", placeholder: "34.5 kV" },
    { key: "Secondary", label: "Secondary voltage", placeholder: "480 V" },
    { key: "Phase", label: "Phase", options: ["3-phase", "Single-phase"] },
    { key: "Cooling", label: "Cooling", options: ["Oil ONAN", "Dry-type AN", "Other"] },
    { key: "Monitoring", label: "Monitoring", options: ["Included", "None"] },
  ],
  panel: [
    { key: "Rated current", label: "Rated current (A)", placeholder: "3000" },
    { key: "Voltage", label: "Voltage (V)", placeholder: "480" },
    { key: "Feeder circuits", label: "Feeder circuits", placeholder: "12" },
    { key: "Enclosure", label: "Enclosure", placeholder: "NEMA 3R" },
    { key: "Main breaker", label: "Main breaker", options: ["Yes", "No"] },
    { key: "Designed for", label: "Designed for", placeholder: "Container farm" },
  ],
  cable: [
    { key: "Gauge", label: "Gauge", placeholder: "4/0 AWG" },
    { key: "Conductor", label: "Conductor", options: ["Copper", "Aluminum"] },
    { key: "Voltage", label: "Voltage", placeholder: "600 V" },
    { key: "Length", label: "Length / reel", placeholder: "1000 ft" },
    { key: "Insulation", label: "Insulation", placeholder: "THHN" },
    { key: "Color", label: "Color", placeholder: "Black" },
  ],
  breaker: [
    { key: "Rated current", label: "Rated current (A)", placeholder: "800" },
    { key: "Voltage", label: "Voltage (V)", placeholder: "480" },
    { key: "Poles", label: "Poles", options: ["3P", "2P", "4P"] },
    { key: "Breaking capacity", label: "Breaking capacity (kA)", placeholder: "65" },
    { key: "Type", label: "Type", options: ["ACB drawout", "MCCB molded case"] },
    { key: "Trip unit", label: "Trip unit", options: ["Electronic", "Thermal-magnetic"] },
  ],
  fan: [
    { key: "Airflow", label: "Airflow (CFM)", placeholder: "33000" },
    { key: "Size", label: "Size (mm)", placeholder: "1380" },
    { key: "Power", label: "Power", placeholder: "480V 3-phase" },
    { key: "Type", label: "Type", options: ["Axial neg-pressure", "Chassis fan", "Other"] },
    { key: "VFD", label: "VFD", options: ["Included", "None"] },
    { key: "Ingress", label: "Ingress", placeholder: "IP55" },
  ],
  site: [
    { key: "Total power", label: "Total power (MW)", placeholder: "25" },
    { key: "Available", label: "Available (MW)", placeholder: "18" },
    { key: "Power price", label: "Power price ($/kWh)", placeholder: "0.038–0.045" },
    { key: "Power type", label: "Power type", options: ["Behind-the-meter", "Grid direct", "Self-generation"] },
    { key: "Cooling", label: "Cooling", placeholder: "Air / immersion" },
    { key: "Hosting slots", label: "Hosting slots", placeholder: "8000" },
    { key: "Grid status", label: "Grid status", options: ["Energized", "Under construction", "Pending"] },
    { key: "Land / building", label: "Land / building", placeholder: "Owned land + building" },
  ],
};

export function priceLabel(price: number, unit: string) {
  return price > 0 ? `$${price.toLocaleString()}` : "Price on ask";
}
