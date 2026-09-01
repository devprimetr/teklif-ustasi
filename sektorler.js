// Sektör tanımları. Yeni sektör eklemek için buraya bir nesne ekleyin —
// uygulamanın geri kalanı değişmez.
// KDV tevkifat oranlari: KDV Genel Uygulama Tebligi.
// Yalnizca DOGRULANMIS oranlar yazildi. Matbaa ve catering icin oran
// eklenmedi - kullanici kendi orani girebilir.
// UYARI: Tevkifat her musteride uygulanmaz; alicinin "belirlenmis alici"
// olmasi gerekir ve 2026 icin KDV dahil 12.000 TL alt siniri vardir.
const TEVKIFAT_ORANLARI = ["2/10","3/10","4/10","5/10","7/10","9/10","10/10"];

const SEKTORLER = {
  nakliyat: {
    ikon: `<path d="M10 17h4V5H2v12h3m5 0H5m5 0v-5h9l3 5h-3m-9 0a2 2 0 104 0m5 0a2 2 0 104 0"/>`,
    ad: "Evden Eve Nakliyat",
    kdv: 20,
    tevkifat: { oran: "2/10", ad: "Yük taşımacılığı" },
    kalemler: [
      { kod: "mesafe",     ad: "Mesafe",           birim: "km",   fiyat: 32,   tip: "birim" },
      { kod: "hacim",      ad: "Eşya hacmi",       birim: "m³",   fiyat: 450,  tip: "birim" },
      { kod: "kat",        ad: "Asansörsüz kat",   birim: "kat",  fiyat: 350,  tip: "birim" },
      { kod: "paketleme",  ad: "Paketleme",        fiyat: 2500,  tip: "opsiyon" },
      { kod: "asansor",    ad: "Mobilya asansörü", fiyat: 3500,  tip: "opsiyon" },
      { kod: "sigorta",    ad: "Taşıma sigortası", oran: 3,      tip: "yuzde" }
    ],
    indirimler: [
      { kod: "haftaici", ad: "Hafta içi", oran: 10 },
      { kod: "pesin",    ad: "Peşin ödeme", oran: 5 }
    ],
    kosullar: [
      "Fiyata KDV dahil değildir.",
      "Kıymetli eşya (nakit, ziynet, evrak) taşımaya dahil değildir.",
      "Tarih değişikliği en az 48 saat önce bildirilmelidir.",
      "Ödeme: %40 rezervasyonda, %60 teslimde."
    ]
  },

  tadilat: {
    ikon: `<path d="M14 7l-9 9 3 3 9-9M14 7l1.5-1.5a2.1 2.1 0 013 0l1 1a2.1 2.1 0 010 3L17 11M14 7l3 4"/>`,
    ad: "Tadilat & Boya",
    kdv: 20,
    tevkifat: { oran: "4/10", ad: "Yapım işleri" },
    kalemler: [
      { kod: "alan",       ad: "Boyanacak alan",   birim: "m²",   fiyat: 220,  tip: "birim" },
      { kod: "oda",        ad: "Oda sayısı",       birim: "oda",  fiyat: 1800, tip: "birim" },
      { kod: "alcı",       ad: "Alçı / macun",     birim: "m²",   fiyat: 130,  tip: "birim" },
      { kod: "malzeme",    ad: "Malzeme dahil",    fiyat: 4500,  tip: "opsiyon" },
      { kod: "tasima",     ad: "Eşya taşıma/örtme", fiyat: 1500, tip: "opsiyon" }
    ],
    indirimler: [
      { kod: "topluis", ad: "Komple daire", oran: 12 },
      { kod: "pesin",   ad: "Peşin ödeme", oran: 5 }
    ],
    kosullar: [
      "Fiyata KDV dahil değildir.",
      "İşçilik garantisi 1 yıldır.",
      "Elektrik ve su tesisatı kapsam dışıdır.",
      "Ödeme: %50 başlangıçta, %50 teslimde."
    ]
  },

  matbaa: {
    ikon: `<path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-4a2 2 0 012-2h16a2 2 0 012 2v4a2 2 0 01-2 2h-2M6 14h12v7H6z"/>`,
    ad: "Matbaa & Baskı",
    kdv: 20,
    kalemler: [
      { kod: "adet",       ad: "Baskı adedi",      birim: "adet", fiyat: 4,    tip: "birim" },
      { kod: "sayfa",      ad: "Sayfa sayısı",     birim: "sayfa",fiyat: 2,    tip: "birim" },
      { kod: "kalip",      ad: "Kalıp / hazırlık", fiyat: 1200,  tip: "opsiyon" },
      { kod: "selefon",    ad: "Selefon kaplama",  fiyat: 900,   tip: "opsiyon" },
      { kod: "kesim",      ad: "Özel kesim",       fiyat: 750,   tip: "opsiyon" }
    ],
    indirimler: [
      { kod: "yuksekadet", ad: "Yüksek adet", oran: 15 },
      { kod: "pesin",      ad: "Peşin ödeme", oran: 5 }
    ],
    kosullar: [
      "Fiyata KDV dahil değildir.",
      "Baskı öncesi dijital prova onayı alınır.",
      "Renk farkı toleransı %5'tir.",
      "Teslim süresi onaydan sonra 3 iş günüdür."
    ]
  },

  temizlik: {
    ikon: `<path d="M9 3h6l1 6H8l1-6zM8 9v3a4 4 0 004 4 4 4 0 004-4V9M12 16v5"/>`,
    ad: "Temizlik Hizmeti",
    kdv: 20,
    tevkifat: { oran: "9/10", ad: "Temizlik hizmeti" },
    kalemler: [
      { kod: "metrekare",  ad: "Alan",             birim: "m²",   fiyat: 45,   tip: "birim" },
      { kod: "personel",   ad: "Personel/gün",     birim: "gün",  fiyat: 1600, tip: "birim" },
      { kod: "cam",        ad: "Cam temizliği",    fiyat: 1200,  tip: "opsiyon" },
      { kod: "koltuk",     ad: "Koltuk yıkama",    fiyat: 2200,  tip: "opsiyon" },
      { kod: "dezenfekte", ad: "Dezenfeksiyon",    fiyat: 1800,  tip: "opsiyon" }
    ],
    indirimler: [
      { kod: "abonelik", ad: "Aylık abonelik", oran: 20 },
      { kod: "pesin",    ad: "Peşin ödeme", oran: 5 }
    ],
    kosullar: [
      "Fiyata KDV dahil değildir.",
      "Temizlik malzemeleri fiyata dahildir.",
      "Çalışma saatleri 09:00-18:00 arasıdır.",
      "Ödeme hizmet sonunda alınır."
    ]
  },

  catering: {
    ikon: `<path d="M4 3v8a3 3 0 003 3v7M7 3v6M10 3v6M17 3c-1.5 2-2 4-2 6s.5 3 2 3v9"/>`,
    ad: "Catering & Organizasyon",
    kdv: 10,
    kalemler: [
      { kod: "kisi",       ad: "Kişi sayısı",      birim: "kişi", fiyat: 420,  tip: "birim" },
      { kod: "ikram",      ad: "Ek ikram/kişi",    birim: "kişi", fiyat: 95,   tip: "birim" },
      { kod: "servis",     ad: "Servis personeli", fiyat: 3500,  tip: "opsiyon" },
      { kod: "ekipman",    ad: "Masa/sandalye",    fiyat: 2800,  tip: "opsiyon" },
      { kod: "sunum",      ad: "Sunum & dekor",    fiyat: 4200,  tip: "opsiyon" }
    ],
    indirimler: [
      { kod: "erkenrez", ad: "Erken rezervasyon", oran: 10 },
      { kod: "pesin",    ad: "Peşin ödeme", oran: 5 }
    ],
    kosullar: [
      "Fiyata KDV dahil değildir.",
      "Kişi sayısı en geç 3 gün önce kesinleştirilir.",
      "Menü değişikliği fiyatı etkileyebilir.",
      "Ödeme: %50 rezervasyonda, %50 organizasyon günü."
    ]
  },

  ozel: {
    ikon: `<path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1A1.6 1.6 0 008 19.4a1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H2a2 2 0 110-4h.1A1.6 1.6 0 004.6 8a1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V2a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H22a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z"/>`,
    ad: "Kendi Sektörüm",
    kdv: 20,
    kalemler: [
      { kod: "kalem1",     ad: "Kalem 1",          birim: "adet", fiyat: 100,  tip: "birim" },
      { kod: "kalem2",     ad: "Kalem 2",          birim: "adet", fiyat: 200,  tip: "birim" },
      { kod: "opsiyon1",   ad: "Ek hizmet",        fiyat: 500,   tip: "opsiyon" }
    ],
    indirimler: [
      { kod: "indirim1", ad: "İndirim", oran: 10 }
    ],
    kosullar: [
      "Fiyata KDV dahil değildir.",
      "Teklif 14 gün geçerlidir."
    ]
  }
};
