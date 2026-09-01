// Sektör tanımları. Yeni sektör eklemek için buraya bir nesne ekleyin —
// uygulamanın geri kalanı değişmez.
const SEKTORLER = {
  nakliyat: {
    ad: "Evden Eve Nakliyat",
    ikon: "🚚",
    kdv: 20,
    kalemler: [
      { kod: "mesafe",     ad: "Mesafe",           birim: "km",   fiyat: 32,   tip: "birim" },
      { kod: "hacim",      ad: "Eşya hacmi",       birim: "m³",   fiyat: 450,  tip: "birim" },
      { kod: "kat",        ad: "Asansörsüz kat",   birim: "kat",  fiyat: 350,  tip: "birim" },
      { kod: "paketleme",  ad: "Paketleme",        fiyat: 2500,  tip: "opsiyon" },
      { kod: "asansor",    ad: "Mobilya asansörü", fiyat: 3500,  tip: "opsiyon" },
      { kod: "sigorta",    ad: "Taşıma sigortası", oran: 3,      tip: "yuzde" }
    ],
    kosullar: [
      "Fiyata KDV dahil değildir.",
      "Kıymetli eşya (nakit, ziynet, evrak) taşımaya dahil değildir.",
      "Tarih değişikliği en az 48 saat önce bildirilmelidir.",
      "Ödeme: %40 rezervasyonda, %60 teslimde."
    ]
  },

  tadilat: {
    ad: "Tadilat & Boya",
    ikon: "🔨",
    kdv: 20,
    kalemler: [
      { kod: "alan",       ad: "Boyanacak alan",   birim: "m²",   fiyat: 220,  tip: "birim" },
      { kod: "oda",        ad: "Oda sayısı",       birim: "oda",  fiyat: 1800, tip: "birim" },
      { kod: "alcı",       ad: "Alçı / macun",     birim: "m²",   fiyat: 130,  tip: "birim" },
      { kod: "malzeme",    ad: "Malzeme dahil",    fiyat: 4500,  tip: "opsiyon" },
      { kod: "tasima",     ad: "Eşya taşıma/örtme", fiyat: 1500, tip: "opsiyon" }
    ],
    kosullar: [
      "Fiyata KDV dahil değildir.",
      "İşçilik garantisi 1 yıldır.",
      "Elektrik ve su tesisatı kapsam dışıdır.",
      "Ödeme: %50 başlangıçta, %50 teslimde."
    ]
  },

  matbaa: {
    ad: "Matbaa & Baskı",
    ikon: "🖨️",
    kdv: 20,
    kalemler: [
      { kod: "adet",       ad: "Baskı adedi",      birim: "adet", fiyat: 4,    tip: "birim" },
      { kod: "sayfa",      ad: "Sayfa sayısı",     birim: "sayfa",fiyat: 2,    tip: "birim" },
      { kod: "kalip",      ad: "Kalıp / hazırlık", fiyat: 1200,  tip: "opsiyon" },
      { kod: "selefon",    ad: "Selefon kaplama",  fiyat: 900,   tip: "opsiyon" },
      { kod: "kesim",      ad: "Özel kesim",       fiyat: 750,   tip: "opsiyon" }
    ],
    kosullar: [
      "Fiyata KDV dahil değildir.",
      "Baskı öncesi dijital prova onayı alınır.",
      "Renk farkı toleransı %5'tir.",
      "Teslim süresi onaydan sonra 3 iş günüdür."
    ]
  },

  temizlik: {
    ad: "Temizlik Hizmeti",
    ikon: "🧽",
    kdv: 20,
    kalemler: [
      { kod: "metrekare",  ad: "Alan",             birim: "m²",   fiyat: 45,   tip: "birim" },
      { kod: "personel",   ad: "Personel/gün",     birim: "gün",  fiyat: 1600, tip: "birim" },
      { kod: "cam",        ad: "Cam temizliği",    fiyat: 1200,  tip: "opsiyon" },
      { kod: "koltuk",     ad: "Koltuk yıkama",    fiyat: 2200,  tip: "opsiyon" },
      { kod: "dezenfekte", ad: "Dezenfeksiyon",    fiyat: 1800,  tip: "opsiyon" }
    ],
    kosullar: [
      "Fiyata KDV dahil değildir.",
      "Temizlik malzemeleri fiyata dahildir.",
      "Çalışma saatleri 09:00-18:00 arasıdır.",
      "Ödeme hizmet sonunda alınır."
    ]
  },

  catering: {
    ad: "Catering & Organizasyon",
    ikon: "🍽️",
    kdv: 10,
    kalemler: [
      { kod: "kisi",       ad: "Kişi sayısı",      birim: "kişi", fiyat: 420,  tip: "birim" },
      { kod: "ikram",      ad: "Ek ikram/kişi",    birim: "kişi", fiyat: 95,   tip: "birim" },
      { kod: "servis",     ad: "Servis personeli", fiyat: 3500,  tip: "opsiyon" },
      { kod: "ekipman",    ad: "Masa/sandalye",    fiyat: 2800,  tip: "opsiyon" },
      { kod: "sunum",      ad: "Sunum & dekor",    fiyat: 4200,  tip: "opsiyon" }
    ],
    kosullar: [
      "Fiyata KDV dahil değildir.",
      "Kişi sayısı en geç 3 gün önce kesinleştirilir.",
      "Menü değişikliği fiyatı etkileyebilir.",
      "Ödeme: %50 rezervasyonda, %50 organizasyon günü."
    ]
  },

  ozel: {
    ad: "Kendi Sektörüm",
    ikon: "⚙️",
    kdv: 20,
    kalemler: [
      { kod: "kalem1",     ad: "Kalem 1",          birim: "adet", fiyat: 100,  tip: "birim" },
      { kod: "kalem2",     ad: "Kalem 2",          birim: "adet", fiyat: 200,  tip: "birim" },
      { kod: "opsiyon1",   ad: "Ek hizmet",        fiyat: 500,   tip: "opsiyon" }
    ],
    kosullar: [
      "Fiyata KDV dahil değildir.",
      "Teklif 14 gün geçerlidir."
    ]
  }
};
