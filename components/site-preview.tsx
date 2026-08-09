/* eslint-disable @next/next/no-img-element -- customer-provided URLs are intentionally rendered without a fixed remote-image allowlist */
import type { ProjectInput } from "../lib/project";

const labels = {
  tr: { offers: "Hizmetler", menu: "Menü", about: "Hakkımızda", contact: "İletişim", reach: "Bize ulaş", explore: "Keşfet", whatsapp: "WhatsApp", selection: "SEÇKİMİZ", work: "NELER YAPIYORUZ", menuTitle: "Menüden öne çıkanlar", workTitle: "Öne çıkan hizmetler", know: "BİZİ TANIYIN", info: "Bilgi al", made: "AuraDigital QuickSite ile hazırlandı", gallery: "GALERİ", advantages: "NEDEN BİZ?" },
  en: { offers: "Services", menu: "Menu", about: "About", contact: "Contact", reach: "Contact us", explore: "Explore", whatsapp: "WhatsApp", selection: "OUR SELECTION", work: "WHAT WE DO", menuTitle: "Menu highlights", workTitle: "Featured services", know: "ABOUT US", info: "Ask us", made: "Built with AuraDigital QuickSite", gallery: "GALLERY", advantages: "WHY US?" },
  ar: { offers: "الخدمات", menu: "القائمة", about: "من نحن", contact: "اتصل بنا", reach: "تواصل معنا", explore: "اكتشف", whatsapp: "واتساب", selection: "اختياراتنا", work: "ماذا نقدم", menuTitle: "أبرز عناصر القائمة", workTitle: "الخدمات المميزة", know: "تعرف علينا", info: "اسألنا", made: "تم الإنشاء بواسطة AuraDigital QuickSite", gallery: "المعرض", advantages: "لماذا نحن؟" },
};

function safeImage(value: string) { return /^https?:\/\//i.test(value) ? value : ""; }
function instagramUrl(value: string) { const handle = value.replace(/^@/, "").trim(); return handle ? `https://instagram.com/${handle}` : ""; }

export function SitePreview({ project, draft = false, compact = false }: { project: ProjectInput; draft?: boolean; compact?: boolean }) {
  const direction = project.language === "ar" ? "rtl" : "ltr";
  const copy = labels[project.language] ?? labels.tr;
  const menuSite = project.templateId.includes("menu") || project.templateId === "espresso";
  const heroImage = safeImage(project.heroImageUrl);
  const logo = safeImage(project.logoUrl);
  const gallery = project.galleryUrls.map(safeImage).filter(Boolean);
  return (
    <div className={`generated-site site-${project.templateId} ${compact ? "is-compact" : ""}`} style={{ "--site-accent": project.primaryColor } as React.CSSProperties} dir={direction}>
      {draft && <div className="draft-ribbon"><span /> {project.language === "ar" ? "معاينة — لم يتم النشر بعد" : project.language === "en" ? "DRAFT PREVIEW — NOT PUBLISHED YET" : "TASLAK ÖNİZLEME — HENÜZ YAYINDA DEĞİL"}</div>}
      <div className="generated-nav"><b>{logo && <img className="generated-logo" src={logo} alt="" />}{project.businessName}</b><div><a href="#offers">{menuSite ? copy.menu : copy.offers}</a><a href="#about">{copy.about}</a><a href="#contact">{copy.contact}</a></div><a className="generated-cta" href={`tel:${project.phone}`}>{copy.reach}</a></div>
      <section className="generated-hero">
        <div className="generated-copy"><small>{project.eyebrow || project.address || "AURADIGITAL QUICKSITE"}</small><h1>{project.tagline}</h1><p>{project.description}</p>{project.workingHours && <span className="generated-hours">◷ {project.workingHours}</span>}<div><a className="generated-primary" href="#offers">{project.primaryCta || copy.explore}</a><a className="generated-secondary" href={`https://wa.me/${project.whatsapp.replace(/\D/g, "")}`}>{copy.whatsapp}</a></div></div>
        <div className={`generated-art ${heroImage ? "has-image" : ""}`} style={heroImage ? { backgroundImage: `linear-gradient(135deg, rgba(0,0,0,.08), rgba(0,0,0,.22)), url(${heroImage})` } : undefined}><span>{heroImage ? "" : project.templateId === "nova-menu" ? "✦" : project.templateId === "espresso" ? "☕" : project.templateId === "local-pro" ? "✓" : "↗"}</span><i>{project.businessName.slice(0, 2).toUpperCase()}</i></div>
      </section>
      {project.benefits.some(Boolean) && <section className="generated-benefits"><small>{copy.advantages}</small><div>{project.benefits.filter(Boolean).map((benefit, index) => <span key={`${benefit}-${index}`}>✓ {benefit}</span>)}</div></section>}
      <section className="generated-offers" id="offers"><div className="generated-section-title"><small>{menuSite ? copy.selection : copy.work}</small><h2>{menuSite ? copy.menuTitle : copy.workTitle}</h2></div><div className="offer-grid">{project.offers.map((offer, index) => <article key={`${offer.name}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><h3>{offer.name || "Başlık"}</h3><p>{offer.description || "Kısa açıklama"}</p><b>{offer.price || copy.info}</b></article>)}</div></section>
      {gallery.length > 0 && <section className="generated-gallery"><small>{copy.gallery}</small><div>{gallery.map((image, index) => <img src={image} alt={`${project.businessName} ${copy.gallery.toLocaleLowerCase()} ${index + 1}`} key={image} />)}</div></section>}
      <section className="generated-about" id="about"><span>{project.businessName.slice(0, 1)}</span><div><small>{copy.know}</small><h2>{project.aboutTitle}</h2><p>{project.description}</p></div></section>
      <footer className="generated-footer" id="contact"><div><b>{project.businessName}</b><p>{project.address}</p><p>{project.workingHours}</p></div><div><a href={`tel:${project.phone}`}>{project.phone}</a><a href={`mailto:${project.email}`}>{project.email}</a>{project.instagram && <a href={instagramUrl(project.instagram)} target="_blank" rel="noreferrer">Instagram · {project.instagram}</a>}{project.mapUrl && <a href={project.mapUrl} target="_blank" rel="noreferrer">Google Maps ↗</a>}</div><small>{copy.made}</small></footer>
    </div>
  );
}
