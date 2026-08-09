import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { projects } from "../../../../../db/schema";
import { ownerApiAccess } from "../../../../owner-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await ownerApiAccess();
  if (!access.ok) return access.response;
  const { id } = await params;
  const body = await request.json() as { status?: string; paymentStatus?: string; ownerNote?: string };
  if (body.status && !["approved", "rejected", "pending"].includes(body.status)) return Response.json({ error: "Geçersiz yayın durumu." }, { status: 400 });
  if (body.paymentStatus && !["unpaid", "paid"].includes(body.paymentStatus)) return Response.json({ error: "Geçersiz ödeme durumu." }, { status: 400 });
  const now = new Date().toISOString();
  const db = await getDb();
  const [current] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!current) return Response.json({ error: "Talep bulunamadı." }, { status: 404 });
  const nextStatus = body.status ?? current.status;
  const nextPayment = body.paymentStatus ?? current.paymentStatus;
  if (nextStatus === "approved" && nextPayment !== "paid") return Response.json({ error: "Yayına almadan önce ödemeyi onaylayın." }, { status: 409 });
  const [updated] = await db.update(projects).set({ status: nextStatus, paymentStatus: nextPayment, ownerNote: body.ownerNote === undefined ? current.ownerNote : String(body.ownerNote).slice(0, 500), updatedAt: now, approvedAt: nextStatus === "approved" ? (current.approvedAt ?? now) : null }).where(eq(projects.id, id)).returning({ id: projects.id, status: projects.status, paymentStatus: projects.paymentStatus, ownerNote: projects.ownerNote, slug: projects.slug });
  if (!updated) return Response.json({ error: "Talep bulunamadı." }, { status: 404 });
  return Response.json({ project: updated });
}
