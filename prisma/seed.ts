import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type Seed = {
  cat: string; title: string; brand?: string; cond: string; qty: number;
  price: number; unit: string; state: string; city: string; ship: boolean;
  feat: boolean; seller: "west" | "apex" | "north" | "grid";
  specs: Record<string, string>; desc: string;
};

const LISTINGS: Seed[] = [
  { cat: "miner", title: "Bitmain Antminer S21 Pro 234T — Unit w/ PSU", brand: "Bitmain", cond: "new", qty: 120, price: 4200, unit: "/unit", state: "TX", city: "Austin", ship: true, feat: true, seller: "west",
    specs: { Hashrate: "234 TH/s", Efficiency: "15 J/TH", Algorithm: "SHA-256", Batch: "2025 Q4", "PSU included": "Yes", "Firmware lock": "None" },
    desc: "Surplus brand-new sealed units from a fleet expansion. Bulk pricing available. Local pickup in Texas or drop-ship; nameplate and serial verification provided on request." },
  { cat: "miner", title: "MicroBT WhatsMiner M60S 186T — Grade A", brand: "MicroBT", cond: "used", qty: 300, price: 2650, unit: "/unit", state: "GA", city: "Atlanta", ship: true, feat: false, seller: "apex",
    specs: { Hashrate: "186 TH/s", Efficiency: "18.5 J/TH", Algorithm: "SHA-256", Batch: "2024 Q2", "PSU included": "Yes", "Firmware lock": "None" },
    desc: "Hosted-fleet decommission, stable runners, cleaned and bench-tested with test footage available. 300 units, tiered volume discounts." },
  { cat: "miner", title: "Antminer S19j Pro 104T — For parts / repair lot", brand: "Bitmain", cond: "repair", qty: 80, price: 780, unit: "/unit", state: "NY", city: "Buffalo", ship: true, feat: false, seller: "grid",
    specs: { Hashrate: "104 TH/s (partial faults)", Efficiency: "29.5 J/TH", Algorithm: "SHA-256", Batch: "2022", "PSU included": "Some", "Firmware lock": "Unknown" },
    desc: "Fault / parts lot ideal for repair shops harvesting boards or refurbishing. Sold as-is, no hashrate guarantee. Whole-lot buyers preferred." },
  { cat: "trans", title: "2500 kVA Oil-Immersed Transformer 34.5kV->480V", brand: "ABB", cond: "used", qty: 3, price: 38000, unit: "/unit", state: "TX", city: "Midland", ship: false, feat: true, seller: "west",
    specs: { Rating: "2500 kVA", Primary: "34.5 kV", Secondary: "480 V", Phase: "3-phase", Cooling: "ONAN oil-immersed", Monitoring: "Included" },
    desc: "Retired site transformer with strong service records, includes temperature monitoring and bushings. Buyer arranges rigging/transport; logistics intros available." },
  { cat: "trans", title: "1500 kVA Dry-Type Transformer 480V — New spare", brand: "Eaton", cond: "new", qty: 2, price: 29500, unit: "/unit", state: "WA", city: "Quincy", ship: false, feat: false, seller: "north",
    specs: { Rating: "1500 kVA", Primary: "12.47 kV", Secondary: "480 V", Phase: "3-phase", Cooling: "AN dry-type", Monitoring: "Included" },
    desc: "Cancelled-project surplus, brand new, never energized. Full factory warranty documentation on hand." },
  { cat: "panel", title: "480V Main Switchgear 3000A — 12 feeders w/ main", brand: "Square D", cond: "used", qty: 4, price: 9800, unit: "/unit", state: "TX", city: "Houston", ship: true, feat: false, seller: "west",
    specs: { "Rated current": "3000 A", Voltage: "480 V", Incoming: "1", "Feeder circuits": "12", Enclosure: "NEMA 3R", "Main breaker": "Yes" },
    desc: "Outdoor-rated main distribution board with branch breakers and metering. Standard mining build, full set available as a package." },
  { cat: "panel", title: "Container Mining PDU 415V — 48 positions", brand: "Generic", cond: "used", qty: 30, price: 1200, unit: "/set", state: "GA", city: "Savannah", ship: true, feat: false, seller: "apex",
    specs: { "Rated current": "400 A", Voltage: "415 V", Outputs: "48", Breakers: "Included", "Designed for": "Container farms", "Main breaker": "Yes" },
    desc: "Standard container-farm PDU, 48 miner output positions, pulled from decommissioned site. Volume discounts." },
  { cat: "cable", title: "4/0 AWG Copper Cable 600V — Full reel (1000 ft)", brand: "Southwire", cond: "new", qty: 60, price: 2400, unit: "/reel", state: "TX", city: "Dallas", ship: true, feat: false, seller: "north",
    specs: { Gauge: "4/0 AWG", Conductor: "Copper", Voltage: "600 V", Length: "1000 ft / reel", Insulation: "THHN", Color: "Black" },
    desc: "New full-reel stock, common mining feeder gauge. Partial reels available." },
  { cat: "cable", title: "350 MCM Aluminum Cable 600V — Used (~800 ft)", brand: "Generic", cond: "used", qty: 25, price: 680, unit: "/reel", state: "NV", city: "Reno", ship: true, feat: false, seller: "grid",
    specs: { Gauge: "350 MCM", Conductor: "Aluminum", Voltage: "600 V", Length: "~800 ft / reel", Insulation: "XHHW", Color: "Mixed" },
    desc: "Reclaimed aluminum cable in usable condition, good fit for budget-conscious builds." },
  { cat: "breaker", title: "480V 800A 3-Pole Air Circuit Breaker (ACB)", brand: "Schneider", cond: "used", qty: 18, price: 1450, unit: "/each", state: "TX", city: "Houston", ship: true, feat: false, seller: "west",
    specs: { "Rated current": "800 A", Voltage: "480 V", Poles: "3P", "Breaking capacity": "65 kA", Type: "Drawout ACB", "Trip unit": "Electronic" },
    desc: "Pulled from mining switchgear, tested and functional, trip curves provided." },
  { cat: "breaker", title: "415V 250A MCCB — New, lot of 24", brand: "Siemens", cond: "new", qty: 24, price: 210, unit: "/each", state: "GA", city: "Atlanta", ship: true, feat: false, seller: "apex",
    specs: { "Rated current": "250 A", Voltage: "415 V", Poles: "3P", "Breaking capacity": "35 kA", Type: "MCCB molded case", "Trip unit": "Thermal-magnetic" },
    desc: "New stock molded-case breakers, sold as a lot, ideal for container-farm branch protection." },
  { cat: "fan", title: 'Container Axial Fan 1380mm (54") w/ VFD', brand: "Multi-Wing", cond: "used", qty: 40, price: 520, unit: "/unit", state: "GA", city: "Savannah", ship: true, feat: false, seller: "apex",
    specs: { Airflow: "~33,000 CFM", Size: "1380 mm", Power: "480V 3-phase", Type: "Axial negative-pressure", VFD: "Included", Ingress: "IP55" },
    desc: "Negative-pressure container cooling fans, pulled from site, blades intact, VFD control included." },
  { cat: "fan", title: "Miner Replacement Fan 12038 12V — New (lot of 500)", brand: "Generic", cond: "new", qty: 500, price: 6, unit: "/each", state: "CA", city: "City of Industry", ship: true, feat: false, seller: "north",
    specs: { Airflow: "~250 CFM", Size: "120x38 mm", Power: "12 V DC", Type: "Miner chassis fan", Speed: "6000 RPM", Bearing: "Dual ball" },
    desc: "Universal replacement fan for S19 / M30 series, new bulk parts, a staple for repair shops." },
  { cat: "site", title: "25 MW Behind-the-Meter Site, West Texas — Hosting", cond: "used", qty: 1, price: 0, unit: "POA", state: "TX", city: "Pecos County", ship: false, feat: true, seller: "west",
    specs: { "Total power": "25 MW", Available: "18 MW", "Power price": "$0.038-0.045 /kWh", "Power type": "Behind-the-meter gas", Cooling: "Air + immersion", "Hosting slots": "~8,000", "Grid status": "Energized & operating" },
    desc: "Operating site offering full or partial power capacity for sale or transfer — includes substation, containers and an on-site O&M team. Whole-site sale or hosting slots. Start a deal request to discuss terms." },
  { cat: "site", title: "8 MW Grid-Tied Site, Georgia — Land + Building", cond: "used", qty: 1, price: 0, unit: "POA", state: "GA", city: "Dalton", ship: false, feat: false, seller: "apex",
    specs: { "Total power": "8 MW", Available: "8 MW", "Power price": "$0.052 /kWh", "Power type": "Grid direct", Cooling: "Air-cooled containers", "Hosting slots": "~2,600", "Grid status": "Energized" },
    desc: "Includes 5 acres of owned land and a steel building, 8 MW of approved capacity. Ready for a self-build or hosting operator to take over." },
  { cat: "miner", title: "Antminer S19 XP 141T — Grade A, hosted pull", brand: "Bitmain", cond: "used", qty: 200, price: 1850, unit: "/unit", state: "NV", city: "Las Vegas", ship: true, feat: false, seller: "apex",
    specs: { Hashrate: "141 TH/s", Efficiency: "21.5 J/TH", Algorithm: "SHA-256", Batch: "2023 Q1", "PSU included": "Yes", "Firmware lock": "None" },
    desc: "Stable decommissioned runners, batch-tested and cleaned, test report provided. 200 units minimum." },
];

async function main() {
  console.log("Resetting data...");
  await prisma.matchRequest.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listingSpec.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const sellerPw = await bcrypt.hash("demo1234", 10);
  const adminPw = await bcrypt.hash("admin1234", 10);

  const sellers = {
    west: await prisma.user.create({ data: { company: "WestPower Mining", email: "ops@westpower.mining", passwordHash: sellerPw, role: "seller", verified: true, phone: "+1 432 555 0148" } }),
    apex: await prisma.user.create({ data: { company: "Apex Recyclers", email: "sales@apexrecyclers.io", passwordHash: sellerPw, role: "seller", verified: true } }),
    north: await prisma.user.create({ data: { company: "NorthGrid Supply", email: "desk@northgrid.supply", passwordHash: sellerPw, role: "seller", verified: true } }),
    grid: await prisma.user.create({ data: { company: "GridSalvage LLC", email: "info@gridsalvage.co", passwordHash: sellerPw, role: "seller", verified: false } }),
  };

  await prisma.user.create({ data: { company: "MiningGear Admin", email: "admin@mininggear.io", passwordHash: adminPw, role: "admin", verified: true } });

  for (const l of LISTINGS) {
    await prisma.listing.create({
      data: {
        sellerId: sellers[l.seller].id,
        category: l.cat,
        title: l.title,
        brand: l.brand ?? null,
        condition: l.cond,
        quantity: l.qty,
        price: l.price,
        unit: l.unit,
        state: l.state,
        city: l.city,
        shippable: l.ship,
        featured: l.feat,
        status: "active",
        description: l.desc,
        specs: {
          create: Object.entries(l.specs).map(([key, value], i) => ({ key, value, sort: i })),
        },
      },
    });
  }

  // Two pending submissions so the admin review queue has content on first run.
  const PENDING: Seed[] = [
    { cat: "miner", title: "Antminer S21 200T — hosted pull (pending review)", brand: "Bitmain", cond: "used", qty: 60, price: 3100, unit: "/unit", state: "TX", city: "El Paso", ship: true, feat: false, seller: "grid",
      specs: { Hashrate: "200 TH/s", Efficiency: "17.5 J/TH", Algorithm: "SHA-256", Batch: "2025 Q1", "PSU included": "Yes", "Firmware lock": "None" },
      desc: "Recently submitted, awaiting admin approval. Hosted-fleet pull, tested." },
    { cat: "trans", title: "1000 kVA Pad-Mount Transformer (pending review)", brand: "GE", cond: "used", qty: 1, price: 14500, unit: "/unit", state: "NV", city: "Sparks", ship: false, feat: false, seller: "grid",
      specs: { Rating: "1000 kVA", Primary: "12.47 kV", Secondary: "480 V", Phase: "3-phase", Cooling: "ONAN oil-immersed", Monitoring: "None" },
      desc: "Submitted for review. Pad-mount unit, buyer arranges transport." },
  ];
  for (const l of PENDING) {
    await prisma.listing.create({
      data: {
        sellerId: sellers[l.seller].id, category: l.cat, title: l.title, brand: l.brand ?? null,
        condition: l.cond, quantity: l.qty, price: l.price, unit: l.unit, state: l.state, city: l.city,
        shippable: l.ship, featured: false, status: "pending", description: l.desc,
        specs: { create: Object.entries(l.specs).map(([key, value], i) => ({ key, value, sort: i })) },
      },
    });
  }

  // Two demo deal requests authored by the current (WestPower) account.
  const s21 = await prisma.listing.findFirst({ where: { title: { contains: "S21 Pro" } } });
  const site = await prisma.listing.findFirst({ where: { category: "site", city: "Pecos County" } });
  if (s21) await prisma.matchRequest.create({ data: { listingId: s21.id, buyerId: sellers.west.id, intentQty: 50, targetPrice: 4000, deliverTo: "Austin, TX", status: "prog", message: "Can you do $4,000/unit on 50?" } });
  if (site) await prisma.matchRequest.create({ data: { listingId: site.id, buyerId: sellers.west.id, intentQty: 1, deliverTo: "—", status: "new", message: "Interested in 5 MW of hosting slots." } });

  const count = await prisma.listing.count();
  console.log(`Seeded ${count} listings across ${Object.keys(sellers).length} sellers.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
