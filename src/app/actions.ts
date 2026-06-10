"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser, requireAdmin } from "@/lib/session";
import { SPEC_FIELDS } from "@/lib/catalog";
import { saveUpload, isImage } from "@/lib/storage";
import { extractFromFile, type Extracted } from "@/lib/extract";
import { sendMail } from "@/lib/mail";
import { dealRequestSellerEmail, dealRequestBuyerEmail } from "@/lib/emails";

// ---------- buyer: deal requests (matchmaking core) ----------
export async function createDealRequest(formData: FormData) {
  const user = await requireUser();
  const listingId = String(formData.get("listingId"));
  const intentQty = Number(formData.get("intentQty") || 1);
  const targetPrice = Number(formData.get("targetPrice") || 0);
  const deliverTo = String(formData.get("deliverTo") || "");
  const message = String(formData.get("message") || "");

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, include: { seller: true } });
  if (!listing) redirect("/browse");

  await prisma.matchRequest.create({
    data: { listingId, buyerId: user.id, intentQty, targetPrice, deliverTo, message, status: "new" },
  });

  // Notify the seller, and confirm to the buyer. Failures must not block the flow.
  const info = {
    sellerEmail: listing.seller.email,
    sellerName: listing.seller.company || listing.seller.name || "",
    buyerCompany: user.company || user.name || "A buyer",
    buyerEmail: user.email ?? "",
    listingTitle: listing.title,
    listingId: listing.id,
    intentQty, targetPrice, deliverTo, message,
  };
  try {
    await Promise.allSettled([
      sendMail(dealRequestSellerEmail(info)),
      user.email ? sendMail(dealRequestBuyerEmail(info)) : Promise.resolve(),
    ]);
  } catch (e) {
    console.error("[deal-request] email error:", e);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?tab=requests&sent=1");
}

// ---------- favorites ----------
export async function toggleFavorite(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const listingId = String(formData.get("listingId"));
  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId: user.id, listingId } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { userId: user.id, listingId } });
  }
  revalidatePath(String(formData.get("returnTo") || "/browse"));
}

// ---------- seller: publish a listing (goes to admin review) ----------
export async function createListing(formData: FormData) {
  const user = await requireUser();
  const category = String(formData.get("category") || "miner");
  const fields = SPEC_FIELDS[category] ?? [];
  const specs = fields
    .map((f, i) => ({ key: f.key, value: String(formData.get(`spec_${f.key}`) || "").trim(), sort: i }))
    .filter((s) => s.value.length > 0);

  // Save any uploaded images.
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0 && isImage(f));
  const images: { url: string; sort: number }[] = [];
  for (let i = 0; i < files.length; i++) {
    const saved = await saveUpload(files[i], "listings");
    images.push({ url: saved.url, sort: i });
  }

  const priceRaw = String(formData.get("price") || "").replace(/[^0-9.]/g, "");
  await prisma.listing.create({
    data: {
      sellerId: user.id,
      category,
      title: String(formData.get("title") || "Untitled listing"),
      brand: String(formData.get("brand") || "") || null,
      condition: String(formData.get("condition") || "used"),
      quantity: Number(formData.get("quantity") || 1),
      price: priceRaw ? Number(priceRaw) : 0,
      unit: String(formData.get("unit") || "/unit"),
      state: String(formData.get("state") || "TX"),
      city: String(formData.get("city") || ""),
      shippable: formData.get("shippable") === "on",
      description: String(formData.get("description") || ""),
      status: "pending", // requires admin approval before going live
      specs: { create: specs },
      images: { create: images },
    },
  });
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  redirect("/dashboard?tab=listings&created=1");
}

// ---------- admin: review queue ----------
export async function approveListing(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("listingId"));
  await prisma.listing.update({ where: { id }, data: { status: "active", rejectNote: null } });
  revalidatePath("/admin");
  revalidatePath("/browse");
}

export async function rejectListing(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("listingId"));
  await prisma.listing.update({
    where: { id },
    data: { status: "rejected", rejectNote: String(formData.get("note") || "Did not meet listing guidelines.") },
  });
  revalidatePath("/admin");
}

// ---------- document extraction (PDF / Excel / Word) ----------
export async function extractDocument(
  formData: FormData
): Promise<{ ok: true; data: Extracted } | { ok: false; error: string }> {
  await requireUser();
  const file = formData.get("doc");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No file received." };
  if (file.size > 20 * 1024 * 1024) return { ok: false, error: "File too large (max 20 MB)." };
  try {
    const data = await extractFromFile(file);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not read that file." };
  }
}
