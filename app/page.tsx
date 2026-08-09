import Link from "next/link";
import { templates } from "../lib/project";

const steps = [
  { number: "01", title: "Şablonu seç", text: "İşletmene en uygun hazır tasarımı canlı olarak incele." },
  { number: "02", title: "Bilgilerini gir", text: "Metinleri, fiyatları, renkleri ve iletişim bilgilerini düzenle." },
  { number: "03", title: "Önizle ve gönder", text: "Siteyi yayınlamadan önce telefon ve masaüstünde kontrol et." },
  { number: "04", title: "AuraDigital onayı", text: "Talep kırmızı bekleme durumuna geçer; onaydan sonra yeşil ve canlı olur." },
];

export default function Home() {
  return (
    <main>
      <header className="topbar shell">
        <Link className="brand" href="/quicksite" aria-label="AuraDigital QuickSite ana sayfa">
          <span className="brand-mark">A<span>•</span></span>
          <span>auradigital</span>
        </Link>
        <nav className="desktop-nav" aria-label="Ana menü">
          <a href="#templates">Şablonlar</a>
          <a href="#how">Nasıl çalışır?</a>
          <a href="#control">Yayın kontrolü</a>
        </nav>
        <div className="top-actions">
          <span className="language-pill">TR <span>⌄</span></span>
          <Link className="button button-small" href="/quicksite/builder">Siteni oluştur</Link>
        </div>
      </header>

      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" /> AuraDigital QuickSite</div>
          <h1>Hazır şablon.<br /><em>Senin içeriğin.</em><br />Kontrollü yayın.</h1>
          <p>İşletmen için profesyonel bir siteyi birkaç dakikada hazırla. Yayına alma kararı her zaman AuraDigital kontrolünde kalsın.</p>
          <div className="hero-actions">
            <Link className="button" href="/quicksite/builder">Ücretsiz taslağını başlat <span>→</span></Link>
            <a className="text-link" href="#templates">Şablonları incele <span>↓</span></a>
          </div>
          <div className="trust-row">
            <span>✓ Kod bilgisi gerekmez</span>
            <span>✓ Canlı önizleme</span>
            <span>✓ Onaylı yayın</span>
          </div>
        </div>

        <div className="hero-product" aria-label="AuraDigital oluşturucu önizlemesi">
          <div className="product-glow" />
          <div className="builder-window">
            <div className="window-bar">
              <div className="window-dots"><i /><i /><i /></div>
              <span>studio.auradigital.ink</span>
              <span className="secure-badge">Güvenli</span>
            </div>
            <div className="builder-body">
              <aside className="mini-panel">
                <span className="mini-label">İŞLETME ADI</span>
                <div className="fake-input">Kahve Durağı</div>
                <span className="mini-label">ANA RENK</span>
                <div className="swatches"><i /><i /><i /><i /></div>
                <span className="mini-label">BÖLÜMLER</span>
                <div className="fake-field" /><div className="fake-field short" />
                <div className="pending-card"><span className="status-dot pending" /> Onay bekliyor</div>
              </aside>
              <div className="mini-preview">
                <div className="preview-nav"><b>KAHVE.</b><span>Menü &nbsp; Hakkımızda &nbsp; İletişim</span></div>
                <div className="preview-hero">
                  <div><small>İSTANBUL’DA TAZE KAHVE</small><strong>Günün en iyi<br />molası burada.</strong><button>Menüyü gör</button></div>
                  <div className="coffee-art"><span>☕</span></div>
                </div>
                <div className="preview-cards"><i /><i /><i /></div>
              </div>
            </div>
          </div>
          <div className="float-card float-live"><span className="status-dot approved" /> <div><b>Yayın hazır</b><small>AuraDigital onayladı</small></div></div>
          <div className="float-card float-mobile"><span>▯</span><div><b>Mobil uyumlu</b><small>Tüm ekranlarda</small></div></div>
        </div>
      </section>

      <section className="template-section shell" id="templates">
        <div className="section-heading">
          <div><span className="kicker">HAZIR TASARIMLAR</span><h2>Bir tasarım seç,<br />kendine göre değiştir.</h2></div>
          <p>Menü, kafe, yerel hizmet ve kişisel portföy için hazırlanmış okunaklı, hızlı ve mobil uyumlu başlangıçlar.</p>
        </div>
        <div className="template-grid">
          {templates.map((template, index) => (
            <Link className={`template-card template-card-${index + 1}`} href={`/quicksite/builder?template=${template.id}`} key={template.id}>
              <div className="template-topline"><span>{template.category}</span><b>{String(index + 1).padStart(2, "0")}</b></div>
              <div className="template-mock">
                <div className="mock-nav"><b>{template.demoBrand}</b><i /><i /><i /></div>
                <div className="mock-content"><small>{template.demoKicker}</small><strong>{template.demoTitle}</strong><span className="mock-button">İncele</span></div>
                <div className="mock-tiles"><i /><i /><i /></div>
              </div>
              <div className="template-info"><div><h3>{template.name}</h3><p>{template.description}</p></div><span className="round-arrow">↗</span></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="steps-section" id="how">
        <div className="shell">
          <div className="section-heading inverse">
            <div><span className="kicker">4 BASİT ADIM</span><h2>Fikirden yayına,<br />kontrol sende.</h2></div>
            <p>Müşteri siteyi hazırlar. AuraDigital kaliteyi, ödemeyi ve yayın iznini kontrol eder.</p>
          </div>
          <div className="step-grid">
            {steps.map((step, index) => <article key={step.number} className={index === 3 ? "accent-step" : ""}><span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="control-section shell" id="control">
        <div className="control-copy">
          <span className="kicker">SAHİBİ SEN OL</span>
          <h2>Hiçbir müşteri senden habersiz yayına çıkamaz.</h2>
          <p>Her yeni talep yönetim ekranında kırmızı noktayla görünür. Ödeme ve içerik kontrolünden sonra tek tıkla onaylarsın; durum yeşile döner ve müşterinin adresi açılır.</p>
          <ul><li><span className="status-dot pending" /> Kırmızı: ödeme veya onay bekliyor</li><li><span className="status-dot approved" /> Yeşil: onaylandı ve yayında</li></ul>
          <Link className="button button-dark" href="/admin/#quicksite">Yönetim ekranı <span>→</span></Link>
        </div>
        <div className="approval-demo">
          <div className="approval-header"><div><small>MÜŞTERİ TALEPLERİ</small><h3>Yayın kontrolü</h3></div><span>3 bekleyen</span></div>
          {["Coffee 1", "Mira Güzellik", "Usta Teknik"].map((name, i) => <div className="client-row" key={name}><span className={`status-dot ${i === 2 ? "approved" : "pending"}`} /><div><b>{name}</b><small>auradigital.ink/quicksite/{name.toLowerCase().replace(/ /g, "-")}</small></div><em>{i === 2 ? "Yayında" : "Onayla →"}</em></div>)}
        </div>
      </section>

      <footer className="footer shell">
        <div className="brand"><span className="brand-mark">A<span>•</span></span><span>auradigital</span></div>
        <p>İstanbul’dan işletmeler için hızlı, anlaşılır dijital deneyimler.</p>
        <div><Link href="/quicksite/builder">Site oluştur</Link><a href="mailto:hello@auradigital.ink">İletişim</a></div>
      </footer>
    </main>
  );
}
