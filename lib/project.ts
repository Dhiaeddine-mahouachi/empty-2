export type TemplateId = "nova-menu" | "espresso" | "local-pro" | "mono-portfolio";
export type ProjectStatus = "pending" | "approved" | "rejected";
export type ProjectLanguage = "tr" | "en" | "ar";

export type Offer = { name: string; description: string; price: string };
export type PaymentStatus = "unpaid" | "paid";

export type QuickSiteDetails = {
  industry: string;
  eyebrow: string;
  aboutTitle: string;
  primaryCta: string;
  workingHours: string;
  instagram: string;
  mapUrl: string;
  logoUrl: string;
  heroImageUrl: string;
  galleryUrls: string[];
  benefits: string[];
  requestMessage: string;
};

export type ProjectInput = {
  templateId: TemplateId;
  language: ProjectLanguage;
  businessName: string;
  tagline: string;
  description: string;
  primaryColor: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  contactName: string;
  slug: string;
  offers: Offer[];
} & QuickSiteDetails;

export type ProjectRecord = ProjectInput & {
  id: string;
  status: ProjectStatus;
  ownerNote: string;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  revision: number;
  paymentStatus: PaymentStatus;
};

export const templates: Array<{
  id: TemplateId; name: string; category: string; description: string;
  demoBrand: string; demoKicker: string; demoTitle: string;
}> = [
  { id: "nova-menu", name: "Nova Menü", category: "RESTORAN & MENÜ", description: "Büyük fotoğraf alanları ve kolay okunan fiyat listesi.", demoBrand: "NOVA", demoKicker: "TAZE • YEREL • GÜNLÜK", demoTitle: "İyi yemek, iyi his." },
  { id: "espresso", name: "Espresso", category: "KAFE & PASTANE", description: "Sıcak tonlar ve ürünleri öne çıkaran modern kafe düzeni.", demoBrand: "KÖŞE", demoKicker: "SPECIALTY COFFEE", demoTitle: "Yavaşla. Bir kahve al." },
  { id: "local-pro", name: "Local Pro", category: "YEREL HİZMET", description: "Telefon ve WhatsApp dönüşümüne odaklanan güvenli tasarım.", demoBrand: "USTA+", demoKicker: "AYNI GÜN SERVİS", demoTitle: "İşini doğru yapan ekip." },
  { id: "mono-portfolio", name: "Mono Studio", category: "PORTFÖY & KİŞİSEL", description: "Projeler ve uzmanlık için cesur, sade bir vitrin.", demoBrand: "D/M", demoKicker: "CREATIVE PORTFOLIO", demoTitle: "Fikirleri dijitale çevir." },
];

export const defaultProject: ProjectInput = {
  templateId: "nova-menu",
  language: "tr",
  businessName: "Kahve Durağı",
  tagline: "Günün en iyi molası burada.",
  description: "Özenle seçilen ürünler, sıcak bir atmosfer ve her gün taze hazırlanan lezzetler.",
  primaryColor: "#a3ff12",
  phone: "+90 555 000 00 00",
  whatsapp: "+90 555 000 00 00",
  email: "merhaba@kahveduragi.com",
  address: "Kadıköy, İstanbul",
  contactName: "Dhia",
  slug: "kahve-duragi",
  industry: "Kafe & Restoran",
  eyebrow: "İSTANBUL’DA TAZE KAHVE",
  aboutTitle: "İyi iş, güven veren detaylarda saklı.",
  primaryCta: "Menüyü keşfet",
  workingHours: "Her gün 09:00 – 23:00",
  instagram: "@kahveduragi",
  mapUrl: "",
  logoUrl: "",
  heroImageUrl: "",
  galleryUrls: ["", "", ""],
  benefits: ["Her gün taze hazırlık", "Hızlı WhatsApp iletişimi", "Kolay ulaşım"],
  requestMessage: "",
  offers: [
    { name: "İmza Kahve", description: "Çift shot espresso, süt ve özel krema", price: "₺145" },
    { name: "Günün Tatlısı", description: "Her sabah mutfağımızda taze hazırlanır", price: "₺190" },
    { name: "Kahvaltı Tabağı", description: "Peynir, zeytin, yumurta ve sıcak ekmek", price: "₺320" },
  ],
};

export function slugify(value: string) {
  return value.toLocaleLowerCase("tr")
    .replaceAll("ı", "i").replaceAll("ğ", "g").replaceAll("ü", "u")
    .replaceAll("ş", "s").replaceAll("ö", "o").replaceAll("ç", "c")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

export function isTemplateId(value: string): value is TemplateId {
  return templates.some((template) => template.id === value);
}
