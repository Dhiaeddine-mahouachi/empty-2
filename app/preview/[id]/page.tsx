import Link from "next/link";
import { SitePreview } from "../../../components/site-preview";
import { getProjectById } from "../../../lib/projects-db";

export const dynamic = "force-dynamic";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) return <main className="not-found-page"><h1>Taslak bulunamadı.</h1><Link className="button button-dark" href="/builder">Yeni site oluştur</Link></main>;
  return <main className="public-preview-page"><div className="preview-notice"><div><span className={`status-dot ${project.status}`} /><b>{project.status === "approved" ? "AuraDigital tarafından onaylandı" : project.status === "rejected" ? "Düzeltme gerekiyor" : "AuraDigital onayı bekleniyor"}</b><small>Bu bağlantı yalnızca taslak kontrolü içindir.</small></div><Link href="/builder">Yeni taslak oluştur</Link></div><SitePreview project={project} draft={project.status !== "approved"} /></main>;
}
