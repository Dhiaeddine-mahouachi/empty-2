"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PaymentStatus, ProjectRecord, ProjectStatus } from "../../lib/project";

export default function AdminClient({ displayName }: { displayName: string }) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [filter, setFilter] = useState<"all" | ProjectStatus>("all");
  const [selectedId, setSelectedId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const response = await fetch("/api/admin/projects");
    const payload = await response.json() as { projects?: ProjectRecord[]; error?: string };
    if (response.ok) setProjects(payload.projects ?? []); else setError(payload.error ?? "Talepler yüklenemedi.");
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/projects")
      .then(async (response) => ({ response, payload: await response.json() as { projects?: ProjectRecord[]; error?: string } }))
      .then(({ response, payload }) => { if (!active) return; if (response.ok) setProjects(payload.projects ?? []); else setError(payload.error ?? "Talepler yüklenemedi."); setLoading(false); });
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => filter === "all" ? projects : projects.filter((project) => project.status === filter), [filter, projects]);
  const selected = projects.find((project) => project.id === selectedId) ?? null;
  const counts = useMemo(() => ({ pending: projects.filter((p) => p.status === "pending").length, unpaid: projects.filter((p) => p.paymentStatus !== "paid").length, approved: projects.filter((p) => p.status === "approved").length, rejected: projects.filter((p) => p.status === "rejected").length }), [projects]);

  function openDetails(project: ProjectRecord) { setSelectedId(project.id); setNoteDraft(project.ownerNote); setError(""); }

  async function updateRequest(id: string, patch: { status?: ProjectStatus; paymentStatus?: PaymentStatus; ownerNote?: string }) {
    setBusy(id); setError("");
    const response = await fetch(`/api/admin/projects/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) });
    const payload = await response.json() as { project?: Partial<ProjectRecord>; error?: string };
    if (!response.ok || !payload.project) setError(payload.error ?? "Talep güncellenemedi.");
    else setProjects((current) => current.map((project) => project.id === id ? { ...project, ...payload.project } : project));
    setBusy("");
  }

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <Link className="brand inverse-brand" href="/"><span className="brand-mark">A<span>•</span></span><span>auradigital</span></Link>
        <nav><button className="active">▦ <span>QuickSite talepleri</span>{counts.pending > 0 && <b>{counts.pending}</b>}</button><Link href="/builder">＋ <span>Yeni taslak</span></Link><Link href="/">⌂ <span>QuickSite ana sayfa</span></Link></nav>
        <div className="admin-user"><span>{displayName.slice(0, 1).toUpperCase()}</span><div><b>{displayName}</b><small>AuraDigital sahibi</small></div></div>
      </aside>

      <section className="admin-content">
        <header><div><span className="kicker">QUICKSITE YÖNETİM MERKEZİ</span><h1>Müşteri talepleri</h1><p>Müşteri siteyi gönderir; sen detayları, ödemeyi ve yayını buradan yönetirsin.</p></div><button className="button button-dark" onClick={() => void load()}>Talepleri yenile</button></header>
        <div className="metric-grid metric-grid-four"><article><span className="status-dot pending" /><div><small>YENİ TALEP</small><b>{counts.pending}</b></div></article><article><span className="payment-dot unpaid">₺</span><div><small>ÖDEME BEKLİYOR</small><b>{counts.unpaid}</b></div></article><article><span className="status-dot approved" /><div><small>YAYINDA</small><b>{counts.approved}</b></div></article><article><span className="status-dot rejected" /><div><small>DÜZELTME</small><b>{counts.rejected}</b></div></article></div>

        {error && <div className="admin-error">{error}</div>}

        {selected && <section className="request-detail-panel">
          <header><div><span className={`status-dot ${selected.status}`} /><div><small>TALEP DETAYI</small><h2>{selected.businessName}</h2><p>/{selected.slug} · {selected.industry}</p></div></div><button onClick={() => setSelectedId("")} aria-label="Kapat">×</button></header>
          <div className="request-status-line"><span className={`request-badge ${selected.paymentStatus}`}>{selected.paymentStatus === "paid" ? "✓ Ödeme alındı" : "₺ Ödeme bekliyor"}</span><span className={`request-badge ${selected.status}`}>{selected.status === "approved" ? "Yayında" : selected.status === "rejected" ? "Düzeltme istendi" : "Onay bekliyor"}</span><span>{new Date(selected.createdAt).toLocaleString("tr-TR")}</span></div>
          <div className="request-detail-grid">
            <div><small>MÜŞTERİ</small><b>{selected.contactName}</b><a href={`mailto:${selected.email}`}>{selected.email}</a><a href={`tel:${selected.phone}`}>{selected.phone}</a></div>
            <div><small>SİTE BİLGİSİ</small><b>{selected.templateId} · {selected.language.toUpperCase()}</b><span>{selected.address}</span><span>{selected.workingHours}</span></div>
            <div><small>SOSYAL & İLETİŞİM</small><b>{selected.whatsapp || "WhatsApp yok"}</b><span>{selected.instagram || "Instagram yok"}</span><span>{selected.mapUrl ? "Harita eklendi" : "Harita yok"}</span></div>
            <div><small>İÇERİK</small><b>{selected.offers.length} ürün / hizmet</b><span>{selected.benefits.filter(Boolean).length} avantaj</span><span>{selected.galleryUrls.filter(Boolean).length} galeri görseli</span></div>
          </div>
          <div className="request-copy-preview"><div><small>ANA BAŞLIK</small><h3>{selected.tagline}</h3><p>{selected.description}</p></div><div><small>MÜŞTERİ NOTU</small><p>{selected.requestMessage || "Müşteri ek bir not bırakmadı."}</p></div></div>
          <div className="request-offers"><small>ÜRÜN / HİZMET LİSTESİ</small><div>{selected.offers.map((offer, index) => <span key={`${offer.name}-${index}`}><b>{offer.name || `Öğe ${index + 1}`}</b><em>{offer.price || "—"}</em></span>)}</div></div>
          <label className="owner-note-field">İç not<textarea rows={3} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Müşteriyle ilgili not…" /></label>
          <div className="request-detail-actions"><Link href={`/preview/${selected.id}`} target="_blank">Taslağı tam ekran aç ↗</Link><button onClick={() => void updateRequest(selected.id, { ownerNote: noteDraft })} disabled={busy === selected.id}>Notu kaydet</button><button className={selected.paymentStatus === "paid" ? "unpay" : "pay"} onClick={() => void updateRequest(selected.id, { paymentStatus: selected.paymentStatus === "paid" ? "unpaid" : "paid" })} disabled={busy === selected.id}>{selected.paymentStatus === "paid" ? "Ödemeyi geri al" : "Ödeme alındı"}</button><button className="reject" onClick={() => void updateRequest(selected.id, { status: "rejected" })} disabled={busy === selected.id}>Düzeltme iste</button><button className="approve" onClick={() => void updateRequest(selected.id, { status: "approved" })} disabled={busy === selected.id || selected.paymentStatus !== "paid"}>{selected.paymentStatus !== "paid" ? "Önce ödemeyi onayla" : "Onayla ve yayınla"}</button></div>
        </section>}

        <div className="admin-table-wrap"><div className="table-toolbar"><div>{(["all", "pending", "approved", "rejected"] as const).map((item) => <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item === "all" ? "Tüm talepler" : item === "pending" ? "Yeni talepler" : item === "approved" ? "Yayında" : "Düzeltme"}</button>)}</div><span>{visible.length} talep</span></div>{loading ? <div className="empty-state">Talepler yükleniyor…</div> : visible.length === 0 ? <div className="empty-state">Bu durumda henüz QuickSite talebi yok.</div> : <div className="project-list">{visible.map((project) => <article className={`project-row ${selectedId === project.id ? "selected" : ""}`} key={project.id}><span className={`status-dot ${project.status}`} /><div className="project-main"><b>{project.businessName}</b><small>{project.contactName} · {project.industry}</small></div><div className="project-payment"><small>ÖDEME</small><b className={project.paymentStatus}>{project.paymentStatus === "paid" ? "Alındı" : "Bekliyor"}</b></div><div className="project-slug"><small>YAYIN ADRESİ</small><b>/{project.slug}</b></div><div className="project-date"><small>OLUŞTURULDU</small><b>{new Date(project.createdAt).toLocaleDateString("tr-TR")}</b></div><div className="project-actions"><button onClick={() => openDetails(project)}>Detaylar</button><Link href={`/preview/${project.id}`} target="_blank">Önizle</Link>{project.status === "approved" && <Link className="live-link" href={`/site/${project.slug}`} target="_blank">Canlı site ↗</Link>}</div></article>)}</div>}</div>
      </section>
    </main>
  );
}
