import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { projects } from "../../../db/schema";
import { isTemplateId, slugify, type Offer, type ProjectLanguage } from "../../../lib/project";

function clean(value: unknown, max = 500) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function cleanUrl(value: unknown) {
  const text = clean(value, 800);
  if (!text) return "";
  try { const url = new URL(text); return ["http:", "https:"].includes(url.protocol) ? url.toString() : ""; } catch { return ""; }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const businessName = clean(body.businessName, 100);
    const email = clean(body.email, 160);
    const contactName = clean(body.contactName, 100);
    const templateId = clean(body.templateId, 30);
    if (!businessName || !email || !contactName || !isTemplateId(templateId)) return Response.json({ error: "Gerekli alanları kontrol edin." }, { status: 400 });
    const db = await getDb();
    let slug = slugify(clean(body.slug, 60) || businessName) || `site-${crypto.randomUUID().slice(0, 6)}`;
    const [existing] = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, slug)).limit(1);
    if (existing) slug = `${slug}-${crypto.randomUUID().slice(0, 4)}`;
    const offers = Array.isArray(body.offers) ? body.offers.slice(0, 12).map((item) => { const offer = item as Partial<Offer>; return { name: clean(offer.name, 100), description: clean(offer.description, 240), price: clean(offer.price, 40) }; }) : [];
    const details = {
      industry: clean(body.industry, 80),
      eyebrow: clean(body.eyebrow, 100),
      aboutTitle: clean(body.aboutTitle, 160),
      primaryCta: clean(body.primaryCta, 60),
      workingHours: clean(body.workingHours, 100),
      instagram: clean(body.instagram, 100),
      mapUrl: cleanUrl(body.mapUrl),
      logoUrl: cleanUrl(body.logoUrl),
      heroImageUrl: cleanUrl(body.heroImageUrl),
      galleryUrls: Array.isArray(body.galleryUrls) ? body.galleryUrls.slice(0, 6).map(cleanUrl).filter(Boolean) : [],
      benefits: Array.isArray(body.benefits) ? body.benefits.slice(0, 6).map((item) => clean(item, 100)).filter(Boolean) : [],
      requestMessage: clean(body.requestMessage, 1000),
    };
    const id = crypto.randomUUID();
    await db.insert(projects).values({ id, slug, templateId, language: (["tr", "en", "ar"].includes(String(body.language)) ? body.language : "tr") as ProjectLanguage, businessName, tagline: clean(body.tagline, 140), description: clean(body.description, 600), primaryColor: /^#[0-9a-fA-F]{6}$/.test(String(body.primaryColor)) ? String(body.primaryColor) : "#a3ff12", phone: clean(body.phone, 40), whatsapp: clean(body.whatsapp, 40), email, address: clean(body.address, 200), contactName, offersJson: JSON.stringify(offers), detailsJson: JSON.stringify(details), paymentStatus: "unpaid", status: "pending" });
    return Response.json({ project: { id, slug, status: "pending" } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("no such table") ? "Veritabanı hazırlanıyor. Lütfen kısa süre sonra tekrar deneyin." : "Talep kaydedilemedi.";
    return Response.json({ error: message }, { status: 500 });
  }
}
