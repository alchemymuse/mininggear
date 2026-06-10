import mammoth from "mammoth";
import * as XLSX from "xlsx";
import pdf from "pdf-parse/lib/pdf-parse.js";
import { SPEC_FIELDS } from "@/lib/catalog";

export type Extracted = {
  category: string;
  brand: string;
  title: string;
  specs: Record<string, string>;
  description: string;
  source: string; // file name
  matched: number; // how many spec fields were filled
};

const BRANDS = [
  "Bitmain", "MicroBT", "WhatsMiner", "Canaan", "Avalon", "ABB", "Eaton",
  "Siemens", "Schneider", "Square D", "Southwire", "Multi-Wing", "GE", "Cummins",
];

// keyword -> category, scored
const CATEGORY_HINTS: Record<string, string[]> = {
  miner: ["antminer", "whatsminer", "hashrate", "th/s", "j/th", "asic", "sha-256", "s19", "s21", "m30", "m50", "m60"],
  trans: ["transformer", "kva", "oil-immersed", "dry-type", "onan", "primary voltage", "secondary voltage"],
  panel: ["switchgear", "pdu", "distribution", "feeder", "nema", "busbar", "panelboard"],
  cable: ["awg", "mcm", "conductor", "thhn", "xhhw", "cable", "reel"],
  breaker: ["breaker", "mccb", "acb", "poles", "breaking capacity", "trip unit", "circuit breaker"],
  fan: ["cfm", "axial", "cooling fan", "exhaust fan", "vfd", "airflow"],
  site: ["mw", "kwh", "hosting", "behind-the-meter", "substation", "$/kwh", "grid", "power price", "megawatt"],
};

// ---------- file -> text + key/value rows ----------

async function readDocument(file: File): Promise<{ text: string; pairs: [string, string][] }> {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  const pairs: [string, string][] = [];

  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
    const wb = XLSX.read(buffer, { type: "buffer" });
    let text = "";
    for (const sheetName of wb.SheetNames) {
      const rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[sheetName], { header: 1, blankrows: false });
      for (const row of rows) {
        const cells = (row as unknown[]).map((c) => (c == null ? "" : String(c).trim()));
        if (cells.length >= 2 && cells[0] && cells[1]) pairs.push([cells[0], cells[1]]);
        text += cells.join(" \t ") + "\n";
      }
    }
    return { text, pairs };
  }

  if (name.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer });
    return { text: value, pairs: linePairs(value) };
  }

  if (name.endsWith(".pdf")) {
    const data = await pdf(buffer);
    return { text: data.text, pairs: linePairs(data.text) };
  }

  // plain text fallback
  const text = buffer.toString("utf8");
  return { text, pairs: linePairs(text) };
}

// "Hashrate: 234 TH/s" or "Hashrate    234 TH/s" -> [key, value]
function linePairs(text: string): [string, string][] {
  const out: [string, string][] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z][A-Za-z0-9 /()._-]{1,34}?)\s*[:\t]\s*(.+?)\s*$/);
    if (m && m[2].length <= 80) out.push([m[1].trim(), m[2].trim()]);
  }
  return out;
}

// ---------- heuristics ----------

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  let best = "miner";
  let bestScore = 0;
  for (const [cat, hints] of Object.entries(CATEGORY_HINTS)) {
    const score = hints.reduce((s, h) => s + (lower.includes(h) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}

function detectBrand(text: string): string {
  const lower = text.toLowerCase();
  return BRANDS.find((b) => lower.includes(b.toLowerCase())) ?? "";
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Regex fallbacks for the most valuable fields, keyed by spec field key.
const REGEX_BY_KEY: Record<string, RegExp> = {
  Hashrate: /(\d{2,4}(?:\.\d+)?)\s*TH\/s/i,
  Efficiency: /(\d{1,3}(?:\.\d+)?)\s*J\/TH/i,
  Rating: /(\d{3,5})\s*kVA/i,
  Primary: /(\d{1,3}(?:\.\d+)?)\s*kV\b/i,
  "Rated current": /(\d{2,4})\s*A\b/i,
  "Breaking capacity": /(\d{1,3})\s*kA\b/i,
  Airflow: /([\d,]{2,7})\s*CFM/i,
  "Total power": /(\d{1,3}(?:\.\d+)?)\s*MW\b/i,
  "Power price": /\$?\s*(0?\.\d{2,3})\s*(?:\/?\s*kWh)/i,
  Gauge: /(\d\/0|\d{2,4}\s*(?:AWG|MCM))/i,
};

function fillSpecs(category: string, text: string, pairs: [string, string][]): Record<string, string> {
  const fields = SPEC_FIELDS[category] ?? [];
  const specs: Record<string, string> = {};
  const pairMap = new Map(pairs.map(([k, v]) => [norm(k), v]));

  for (const f of fields) {
    // 1) exact-ish key/value pair from the document
    const fromPair = pairMap.get(norm(f.key)) ?? pairMap.get(norm(f.label));
    if (fromPair) { specs[f.key] = fromPair.slice(0, 60); continue; }
    // 2) regex fallback against the full text
    const rx = REGEX_BY_KEY[f.key];
    if (rx) {
      const m = text.match(rx);
      if (m) specs[f.key] = m[0].trim();
    }
  }
  return specs;
}

function guessTitle(text: string, brand: string, pairs: [string, string][]): string {
  const titlePair = pairs.find(([k]) => /^(model|title|product|item|description)$/i.test(k.trim()));
  if (titlePair) return titlePair[1].slice(0, 90);
  // brand + model token e.g. "S21 Pro 234T"
  const model = text.match(/\b([A-Z]\d{1,3}[A-Za-z]*(?:\s?(?:Pro|XP|Hydro|Plus|S|j))?\s?\d{2,4}T?)\b/);
  if (brand && model) return `${brand} ${model[1]}`.replace(/\s+/g, " ").trim().slice(0, 90);
  const firstLine = text.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length >= 6 && l.length <= 90);
  return (firstLine ?? "").slice(0, 90);
}

export async function extractFromFile(file: File): Promise<Extracted> {
  const { text, pairs } = await readDocument(file);
  const category = detectCategory(text);
  const brand = detectBrand(text);
  const specs = fillSpecs(category, text, pairs);
  const title = guessTitle(text, brand, pairs);
  const description = text.replace(/\s+\n/g, "\n").trim().slice(0, 600);

  return {
    category,
    brand,
    title,
    specs,
    description,
    source: file.name,
    matched: Object.keys(specs).length,
  };
}
