import Link from "next/link";
import { ownerPageAccess } from "../owner-auth";
import AdminClient from "./admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const access = await ownerPageAccess("/admin");
  if (!access.authorized) return <main className="access-page"><div className="access-card"><span className="brand-mark">A<span>•</span></span><span className="kicker">KORUMALI ALAN</span><h1>{access.configured ? "Bu hesap yönetici değil." : "Yönetici e-postası henüz ayarlanmadı."}</h1><p>{access.configured ? `${access.user.email} hesabının bu yayınları yönetme izni yok.` : "OWNER_EMAIL ayarına ChatGPT hesabınızın e-postasını ekleyerek yönetim ekranını yalnızca kendinize açın."}</p><Link className="button button-dark" href="/">Ana sayfaya dön</Link></div></main>;
  return <AdminClient displayName={access.user.displayName} />;
}
