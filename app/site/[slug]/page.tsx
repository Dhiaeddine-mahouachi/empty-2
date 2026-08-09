import Link from "next/link";
import { SitePreview } from "../../../components/site-preview";
import { getProjectBySlug } from "../../../lib/projects-db";

export const dynamic = "force-dynamic";

export default async function PublicSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project || project.status !== "approved") return <main className="locked-page"><div className="locked-card"><span className="lock-icon">◎</span><span className="kicker">AURADIGITAL YAYIN KONTROLÜ</span><h1>Bu site henüz yayında değil.</h1><p>İçerik, ödeme ve yayın izni AuraDigital tarafından kontrol ediliyor. Onay verildiğinde bu adres otomatik olarak açılacak.</p><div className="submission-status"><span className="status-dot pending" /><div><b>Onay bekliyor</b><small>Yayın erişimi kapalı</small></div></div><Link className="text-link dark-text" href="/">AuraDigital’e dön →</Link></div></main>;
  return <SitePreview project={project} />;
}
