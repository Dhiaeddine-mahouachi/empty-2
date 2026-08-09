import { desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { projects } from "../db/schema";
import { defaultProject, type Offer, type ProjectRecord, type ProjectStatus, type QuickSiteDetails } from "./project";

function parseOffers(value: string): Offer[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch { return []; }
}

function parseDetails(value: string): QuickSiteDetails {
  try {
    const parsed = JSON.parse(value) as Partial<QuickSiteDetails>;
    return {
      industry: String(parsed.industry ?? defaultProject.industry),
      eyebrow: String(parsed.eyebrow ?? defaultProject.eyebrow),
      aboutTitle: String(parsed.aboutTitle ?? defaultProject.aboutTitle),
      primaryCta: String(parsed.primaryCta ?? defaultProject.primaryCta),
      workingHours: String(parsed.workingHours ?? defaultProject.workingHours),
      instagram: String(parsed.instagram ?? ""),
      mapUrl: String(parsed.mapUrl ?? ""),
      logoUrl: String(parsed.logoUrl ?? ""),
      heroImageUrl: String(parsed.heroImageUrl ?? ""),
      galleryUrls: Array.isArray(parsed.galleryUrls) ? parsed.galleryUrls.slice(0, 6).map(String) : [],
      benefits: Array.isArray(parsed.benefits) ? parsed.benefits.slice(0, 6).map(String) : [],
      requestMessage: String(parsed.requestMessage ?? ""),
    };
  } catch {
    return { ...defaultProject, galleryUrls: [...defaultProject.galleryUrls], benefits: [...defaultProject.benefits] };
  }
}

export function mapProject(row: typeof projects.$inferSelect): ProjectRecord {
  return {
    ...row,
    ...parseDetails(row.detailsJson),
    templateId: row.templateId as ProjectRecord["templateId"],
    language: row.language as ProjectRecord["language"],
    status: row.status as ProjectStatus,
    paymentStatus: row.paymentStatus as ProjectRecord["paymentStatus"],
    offers: parseOffers(row.offersJson),
  };
}

export async function getProjectById(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return row ? mapProject(row) : null;
}

export async function getProjectBySlug(slug: string) {
  const db = await getDb();
  const [row] = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
  return row ? mapProject(row) : null;
}

export async function listProjects() {
  const db = await getDb();
  const rows = await db.select().from(projects).orderBy(desc(projects.createdAt)).limit(100);
  return rows.map(mapProject);
}
