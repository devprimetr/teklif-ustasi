/* Teklif Ustası — uygulama mantığı.
   Veri telefonda kalır (localStorage), hiçbir yere gönderilmez. */

const $ = s => document.querySelector(s);
const DEPO = "teklifustasi.v1";

let durum = {
  sektor: "nakliyat",
  degerler: {},      // { kalemKodu: miktar }
  opsiyonlar: {},    // { kalemKodu: true/false }
  fiyatlar: {},      // { "sektor.kalemKodu": kullanıcının kendi fiyatı }
  adlar: {},         // { "sektor.kalemKodu": kullanıcının verdiği kalem adı }
  indirimler: {},    // { indirimKodu: true/false }
  tevkifat: false,   // KDV tevkifati uygulansin mi
  tevkifatOran: "",  // kullanicinin sectigi oran (bos = sektor varsayilani)
  firma: { ad: "", tel: "", mail: "", adres: "", vd: "", vkn: "", iban: "", banka: "", yetkili: "", logo: "" },
  gecmis: [],        // kaydedilen teklifler
  sayac: {},         // { "2026": 7 } -> teklif numarasi
  tema: "otomatik"
};

/* Kullanıcı metni HTML'e basılmadan önce kaçırılır.
   Firma/müşteri adında < > & " gibi karakterler belgeyi bozuyordu. */
const kacir = s => String(s ?? "").replace(/[&<>"']/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- kalıcılık ---------- */
function yukle() {
  const varsayilan = { ...durum, firma: { ...durum.firma } };
  try {
    const h = localStorage.getItem(DEPO);
    if (h) durum = { ...durum, ...JSON.parse(h) };
  } catch (e) { /* özel sekme / bozuk JSON — varsayılanla devam */ }

  /* Kayitli veri BOZUK olabilir: null, yanlis tip, eski surumden eksik alan.
     Yayilma (spread) bunu duzeltmez — {...d, firma:null} firma'yi null yapar
     ve uygulama tamamen coker. Her alan tipiyle birlikte dogrulanir. */
  const nesne = v => (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
  durum.firma      = { ...varsayilan.firma, ...nesne(durum.firma) };
  durum.fiyatlar   = nesne(durum.fiyatlar);
  durum.adlar      = nesne(durum.adlar);
  durum.degerler   = nesne(durum.degerler);
  durum.opsiyonlar = nesne(durum.opsiyonlar);
  durum.indirimler = nesne(durum.indirimler);
  durum.sayac      = nesne(durum.sayac);
  durum.gecmis     = Array.isArray(durum.gecmis) ? durum.gecmis : [];
  durum.tevkifat   = !!durum.tevkifat;
  if (typeof durum.tevkifatOran !== "string") durum.tevkifatOran = "";
  if (!SEKTORLER[durum.sektor]) durum.sektor = "nakliyat";
  if (!["otomatik", "acik", "koyu"].includes(durum.tema)) durum.tema = "otomatik";
}
function kaydet() {
  try {
    localStorage.setItem(DEPO, JSON.stringify({
      sektor: durum.sektor, fiyatlar: durum.fiyatlar,
      adlar: durum.adlar, firma: durum.firma, tema: durum.tema,
      gecmis: durum.gecmis, sayac: durum.sayac, tevkifatOran: durum.tevkifatOran
    }));
  } catch (e) { /* yazılamıyorsa sessizce geç, uygulama çalışmaya devam etsin */ }
}

/* ---------- yardımcılar ---------- */
const para = n => new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2, maximumFractionDigits: 2
}).format(n || 0) + " ₺";

function fiyatAl(kalem) {
  const anahtar = `${durum.sektor}.${kalem.kod}`;
  const ozel = durum.fiyatlar[anahtar];
  return ozel !== undefined && ozel !== "" ? Number(ozel)
       : (kalem.tip === "yuzde" ? kalem.oran : kalem.fiyat);
}

/* Kalem adı da kullanıcı tarafından değiştirilebilir.
   "Kendi Sektörüm" bunsuz işe yaramıyordu — Kalem 1 / Kalem 2 yazıyordu. */
/* KDV orani sabit degil: kanun degisiyor, bazi isler indirimli orana
   giriyor, kimi muaf. Kullanici kendi orani girebilir. */
function kdvOranAl() {
  const ozel = durum.fiyatlar[`${durum.sektor}.kdv`];
  return ozel !== undefined && ozel !== "" ? Number(ozel) : SEKTORLER[durum.sektor].kdv;
}

function indirimOranAl(ind) {
  const ozel = durum.fiyatlar[`${durum.sektor}.ind.${ind.kod}`];
  return ozel !== undefined && ozel !== "" ? Number(ozel) : ind.oran;
}

function adAl(kalem) {
  const ozel = durum.adlar[`${durum.sektor}.${kalem.kod}`];
  return ozel && ozel.trim() ? ozel.trim() : kalem.ad;
}

/* ---------- hesap ---------- */
function hesapla() {
  const s = SEKTORLER[durum.sektor];
  const satirlar = [];
  let ara = 0;

  for (const k of s.kalemler) {
    if (k.tip === "birim") {
      const m = Number(durum.degerler[k.kod] || 0);
      if (!m) continue;
      const f = fiyatAl(k), tutar = m * f;
      satirlar.push({ ad: adAl(k), detay: `${m} ${k.birim} × ${para(f)}`, miktar: m, birim: k.birim, birimFiyat: f, tutar });
      ara += tutar;
    } else if (k.tip === "opsiyon") {
      if (!durum.opsiyonlar[k.kod]) continue;
      const tutar = fiyatAl(k);
      satirlar.push({ ad: adAl(k), detay: "", miktar: 1, birim: "adet", birimFiyat: fiyatAl(k), tutar });
      ara += tutar;
    }
  }
  // yüzde kalemleri en sona — ara toplam üzerinden hesaplanır
  for (const k of s.kalemler) {
    if (k.tip !== "yuzde" || !durum.opsiyonlar[k.kod]) continue;
    const o = fiyatAl(k), tutar = ara * o / 100;
    satirlar.push({ ad: adAl(k), detay: `%${o}`, miktar: "", birim: "", birimFiyat: "", tutar });
    ara += tutar;
  }

  // indirimler ara toplam uzerinden, KDV'den ONCE
  const indirimSatirlari = [];
  let toplamIndirim = 0;
  for (const i of (s.indirimler || [])) {
    if (!durum.indirimler[i.kod]) continue;
    const oran = indirimOranAl(i);
    const tutar = ara * oran / 100;
    indirimSatirlari.push({ ad: adAl({kod:"ind."+i.kod, ad:i.ad}), detay: `%${oran}`, tutar: -tutar });
    toplamIndirim += tutar;
  }

  const net = ara - toplamIndirim;
  const kdvOrani = kdvOranAl();
  const kdv = net * kdvOrani / 100;

  // KDV tevkifati: KDV'nin bir kismi alici tarafindan beyan edilir,
  // saticiya kalan kisim odenir. Matrah degismez, sadece tahsil edilecek
  // KDV azalir.
  let tevkifOran = 0, tevkifEdilen = 0;
  if (durum.tevkifat && s.tevkifat) {
    const secili = durum.tevkifatOran || s.tevkifat.oran;
    const [pay, payda] = secili.split("/").map(Number);
    tevkifOran = pay / payda;
    tevkifEdilen = kdv * tevkifOran;
  }
  const tahsilKdv = kdv - tevkifEdilen;

  return { satirlar, indirimSatirlari, ara, toplamIndirim, net,
           kdv, tevkifEdilen, tahsilKdv,
           tevkifatOranMetin: durum.tevkifatOran || (s.tevkifat && s.tevkifat.oran) || "",
           genel: net + tahsilKdv, kdvOrani };
}

/* ---------- çizim ---------- */
function sektorleriCiz() {
  $("#sektorler").innerHTML = Object.entries(SEKTORLER).map(([kod, s]) => `
    <div class="sektor ${kod === durum.sektor ? "secili" : ""}" data-kod="${kod}">
      <span class="ikon">${s.ikon}</span>${s.ad}
    </div>`).join("");

  document.querySelectorAll(".sektor").forEach(el => {
    el.onclick = () => {
      durum.sektor = el.dataset.kod;
      durum.degerler = {}; durum.opsiyonlar = {}; durum.indirimler = {};
      durum.tevkifat = false; durum.tevkifatOran = "";
      kaydet(); ciz();
    };
  });
}

function kalemleriCiz() {
  const s = SEKTORLER[durum.sektor];
  $("#kalemler").innerHTML = s.kalemler.map(k => {
    const f = fiyatAl(k);
    if (k.tip === "birim") {
      return `<div class="satir">
        <div class="bilgi"><div class="ad">${kacir(adAl(k))}</div>
          <div class="fiyat">${para(f)} / ${k.birim}</div></div>
        <input type="number" inputmode="decimal" min="0" step="any"
               data-kod="${k.kod}" value="${durum.degerler[k.kod] || ""}"
               placeholder="0" aria-label="${k.ad}"></div>`;
    }
    const etiket = k.tip === "yuzde" ? `%${f}` : para(f);
    return `<div class="satir">
      <div class="bilgi"><div class="ad">${kacir(adAl(k))}</div>
        <div class="fiyat">${etiket}</div></div>
      <label class="anahtar"><input type="checkbox" data-ops="${k.kod}"
        ${durum.opsiyonlar[k.kod] ? "checked" : ""} aria-label="${k.ad}">
        <span class="kaydir"></span></label></div>`;
  }).join("");

  // indirimler ayri bir grup olarak alta
  const ind = SEKTORLER[durum.sektor].indirimler || [];
  if (ind.length) {
    $("#kalemler").insertAdjacentHTML("beforeend",
      `<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--cizgi)">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;
             color:var(--soluk);font-weight:700;margin-bottom:10px">İndirimler</div>` +
      ind.map(i => `<div class="satir">
        <div class="bilgi"><div class="ad">${kacir(adAl({kod:"ind."+i.kod, ad:i.ad}))}</div>
          <div class="fiyat">%${indirimOranAl(i)}</div></div>
        <label class="anahtar"><input type="checkbox" data-ind="${i.kod}"
          ${durum.indirimler[i.kod] ? "checked" : ""} aria-label="${kacir(i.ad)}">
          <span class="kaydir"></span></label></div>`).join("") + `</div>`);
    $("#kalemler").querySelectorAll("input[data-ind]").forEach(el => {
      el.onchange = () => { durum.indirimler[el.dataset.ind] = el.checked; toplamCiz(); };
    });
  }

  // KDV tevkifati - sadece orani tanimli sektorlerde
  const tv = SEKTORLER[durum.sektor].tevkifat;
  if (tv) {
    const secili = durum.tevkifatOran || tv.oran;
    $("#kalemler").insertAdjacentHTML("beforeend",
      `<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--cizgi)">
        <div class="satir">
          <div class="bilgi"><div class="ad">KDV Tevkifatı</div>
            <div class="fiyat">${kacir(tv.ad)} · ${secili}</div></div>
          <label class="anahtar"><input type="checkbox" id="tevkifatAnahtar"
            ${durum.tevkifat ? "checked" : ""} aria-label="KDV Tevkifatı">
            <span class="kaydir"></span></label></div>
        <div id="tevkifatAyar" ${durum.tevkifat ? "" : "hidden"}>
          <label style="margin-top:6px">Oran</label>
          <select id="tevkifatSecim" style="width:100%;padding:11px 12px;font-size:15px;
            border:1px solid var(--cizgi);border-radius:11px;background:var(--girdi);
            color:var(--metin);font-family:inherit">
            ${TEVKIFAT_ORANLARI.map(o =>
              `<option value="${o}" ${o === secili ? "selected" : ""}>${o}</option>`).join("")}
          </select>
          <p class="ipucu">Tevkifat her müşteride uygulanmaz. Alıcının
            "belirlenmiş alıcı" olması gerekir ve 2026 için KDV dahil
            12.000 TL alt sınırı vardır. Muhasebecinize danışın.</p>
        </div></div>`);
    $("#tevkifatAnahtar").onchange = e => {
      durum.tevkifat = e.target.checked;
      $("#tevkifatAyar").hidden = !e.target.checked;
      toplamCiz();
    };
    $("#tevkifatSecim").onchange = e => {
      durum.tevkifatOran = e.target.value; kaydet(); ciz();
    };
  }

  $("#kalemler").querySelectorAll("input[data-kod]").forEach(el => {
    el.oninput = () => { durum.degerler[el.dataset.kod] = el.value; toplamCiz(); };
  });
  $("#kalemler").querySelectorAll("input[data-ops]").forEach(el => {
    el.onchange = () => { durum.opsiyonlar[el.dataset.ops] = el.checked; toplamCiz(); };
  });
}

function toplamCiz() {
  const h = hesapla();
  $("#araToplam").textContent = para(h.ara);
  const iEl = $("#indirimSatir");
  if (h.toplamIndirim > 0) {
    iEl.hidden = false;
    $("#indirimTutar").textContent = "-" + para(h.toplamIndirim);
  } else { iEl.hidden = true; }
  $("#kdv").textContent = para(h.kdv);
  $("#kdvEtiket").textContent = `KDV (%${h.kdvOrani})`;
  const tEl = $("#tevkifatSatir");
  if (h.tevkifEdilen > 0) {
    tEl.hidden = false;
    $("#tevkifatEtiket").textContent = `Tevkifat (${h.tevkifatOranMetin})`;
    $("#tevkifatTutar").textContent = "-" + para(h.tevkifEdilen);
  } else { tEl.hidden = true; }
  $("#genel").textContent = para(h.genel);
}

function ciz() { sektorleriCiz(); kalemleriCiz(); toplamCiz(); }

/* ---------- fiyat düzenleme ---------- */
$("#fiyatDuzenle").onclick = () => {
  const s = SEKTORLER[durum.sektor];
  $("#fiyatAlanlari").innerHTML = `
    <div style="margin-bottom:14px;padding-bottom:12px;border-bottom:2px solid var(--cizgi)">
      <label>KDV oranı (%)</label>
      <input type="number" inputmode="decimal" step="any" min="0" max="100"
             id="kdvAlan" value="${kdvOranAl()}">
      <p class="ipucu">Genel oran %20, indirimli %10 veya %1. Muafsanız 0 yazın.</p>
    </div>` + s.kalemler.map(k => `
    <div style="margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--cizgi)">
      <label>Kalem adı</label>
      <input type="text" data-ak="${k.kod}" value="${kacir(adAl(k))}" style="margin-bottom:8px">
      <label>${k.tip === "yuzde" ? "Oran (%)" : k.birim ? `Fiyat (₺/${k.birim})` : "Fiyat (₺)"}</label>
      <input type="number" inputmode="decimal" step="any" data-fk="${k.kod}" value="${fiyatAl(k)}">
    </div>`).join("") + (s.indirimler || []).map(i => `
    <div style="margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--cizgi)">
      <label>İndirim adı</label>
      <input type="text" data-ak="ind.${i.kod}" value="${kacir(adAl({kod:'ind.'+i.kod, ad:i.ad}))}" style="margin-bottom:8px">
      <label>Oran (%)</label>
      <input type="number" inputmode="decimal" step="any" data-fk="ind.${i.kod}" value="${indirimOranAl(i)}">
    </div>`).join("");
  $("#fiyatDlg").showModal();
};
$("#fiyatKapat").onclick = () => $("#fiyatDlg").close();
$("#fiyatKaydet").onclick = () => {
  $("#fiyatAlanlari").querySelectorAll("input[data-fk]").forEach(el => {
    durum.fiyatlar[`${durum.sektor}.${el.dataset.fk}`] = el.value;
  });
  $("#fiyatAlanlari").querySelectorAll("input[data-ak]").forEach(el => {
    durum.adlar[`${durum.sektor}.${el.dataset.ak}`] = el.value;
  });
  durum.fiyatlar[`${durum.sektor}.kdv`] = $("#kdvAlan").value;
  kaydet(); $("#fiyatDlg").close(); ciz();
};

/* ---------- firma bilgileri ---------- */
function firmaCiz() {
  const f = durum.firma;
  $("#firmaOzet").textContent = f.ad || "Firma adı girilmedi";
  $("#firmaOzet").style.color = f.ad ? "" : "var(--soluk)";
  $("#firmaAlt").textContent = [f.tel, f.mail, f.adres].filter(Boolean).join(" · ")
    || "Teklifte görünmesi için bilgilerinizi girin";
}
$("#firmaDuzenle").onclick = () => {
  $("#fFirmaAd").value = durum.firma.ad || "";
  $("#fFirmaTel").value = durum.firma.tel || "";
  $("#fFirmaMail").value = durum.firma.mail || "";
  $("#fFirmaAdres").value = durum.firma.adres || "";
  $("#fFirmaVd").value = durum.firma.vd || "";
  $("#fFirmaVkn").value = durum.firma.vkn || "";
  $("#fFirmaIban").value = durum.firma.iban || "";
  $("#fFirmaBanka").value = durum.firma.banka || "";
  $("#fFirmaYetkili").value = durum.firma.yetkili || "";
  logoOnizle();
  $("#firmaDlg").showModal();
};
/* Logo: localStorage ~5MB sinirli oldugu icin goruntu 200px'e kucultulup
   JPEG olarak saklanir. Ham dosya dogrudan saklanirsa tek fotograf
   kotayi doldurup TUM ayarlarin kaydini bozar. */
function logoOnizle() {
  const im = $("#logoOnizleme"), sil = $("#logoSil");
  if (durum.firma.logo) { im.src = durum.firma.logo; im.style.display = "block"; sil.style.display = ""; }
  else { im.style.display = "none"; sil.style.display = "none"; }
}
$("#fFirmaLogo").onchange = e => {
  const dosya = e.target.files[0];
  if (!dosya) return;
  if (dosya.size > 8 * 1024 * 1024) { alert("Dosya çok büyük (en fazla 8 MB)."); return; }
  const fr = new FileReader();
  fr.onload = () => {
    const img = new Image();
    img.onload = () => {
      const en = 200, oran = Math.min(en / img.width, en / img.height, 1);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * oran); c.height = Math.round(img.height * oran);
      const x = c.getContext("2d");
      x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(img, 0, 0, c.width, c.height);
      durum.firma.logo = c.toDataURL("image/jpeg", 0.82);
      logoOnizle();
    };
    img.onerror = () => alert("Görsel okunamadı.");
    img.src = fr.result;
  };
  fr.readAsDataURL(dosya);
};
$("#logoSil").onclick = () => { durum.firma.logo = ""; $("#fFirmaLogo").value = ""; logoOnizle(); };

$("#firmaKapat").onclick = () => $("#firmaDlg").close();
$("#firmaKaydet").onclick = () => {
  durum.firma = {
    ad: $("#fFirmaAd").value.trim(), tel: $("#fFirmaTel").value.trim(),
    mail: $("#fFirmaMail").value.trim(), adres: $("#fFirmaAdres").value.trim(),
    vd: $("#fFirmaVd").value.trim(), vkn: $("#fFirmaVkn").value.trim(),
    iban: $("#fFirmaIban").value.trim(), banka: $("#fFirmaBanka").value.trim(),
    yetkili: $("#fFirmaYetkili").value.trim(), logo: durum.firma.logo || ""
  };
  kaydet(); $("#firmaDlg").close(); firmaCiz();
};

/* ---------- tema ---------- */
function temaUygula() {
  if (durum.tema === "otomatik") document.documentElement.removeAttribute("data-tema");
  else document.documentElement.setAttribute("data-tema", durum.tema);
}
$("#temaBtn").onclick = () => {
  durum.tema = durum.tema === "otomatik" ? "koyu"
             : durum.tema === "koyu" ? "acik" : "otomatik";
  temaUygula(); kaydet();
};

/* ---------- teklif numarasi ve gecmis ---------- */
function sonrakiNo() {
  const yil = new Date().getFullYear();
  durum.sayac[yil] = (durum.sayac[yil] || 0) + 1;
  kaydet();
  return `${yil}-${String(durum.sayac[yil]).padStart(3, "0")}`;
}

function gecmiseKaydet(no, musteri, h) {
  durum.gecmis.unshift({
    no, musteri: musteri || "", sektor: durum.sektor,
    sektorAd: SEKTORLER[durum.sektor].ad,
    tarih: new Date().toISOString().slice(0, 10),
    genel: h.genel,
    degerler: { ...durum.degerler },
    opsiyonlar: { ...durum.opsiyonlar },
    indirimler: { ...durum.indirimler }
  });
  // en fazla 200 kayit tut - localStorage sinirina takilmasin
  if (durum.gecmis.length > 200) durum.gecmis.length = 200;
  kaydet();
}

function gecmisCiz() {
  const liste = durum.gecmis;
  $("#gecmisSayi").textContent = liste.length ? `${liste.length} teklif` : "Henüz teklif yok";
  $("#gecmisListe").innerHTML = liste.length
    ? liste.map((g, i) => `<div class="gsatir" data-g="${i}">
        <div class="bilgi">
          <div class="ad">${kacir(g.musteri) || "(müşteri adı yok)"}</div>
          <div class="fiyat">${g.no} · ${kacir(g.sektorAd)} · ${g.tarih.split("-").reverse().join(".")}</div>
        </div>
        <div style="text-align:right;white-space:nowrap">
          <div style="font-weight:700">${para(g.genel)}</div>
          <button class="duzenle" data-yukle="${i}">geri yükle</button>
        </div></div>`).join("")
    : `<p class="ipucu">Teklif oluşturduğunuzda burada listelenir.</p>`;

  $("#gecmisListe").querySelectorAll("[data-yukle]").forEach(el => {
    el.onclick = () => {
      const g = durum.gecmis[Number(el.dataset.yukle)];
      durum.sektor = g.sektor;
      durum.degerler = { ...g.degerler };
      durum.opsiyonlar = { ...g.opsiyonlar };
      durum.indirimler = { ...(g.indirimler || {}) };
      $("#musteri").value = g.musteri;
      kaydet(); ciz(); $("#gecmisDlg").close();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  });
}

$("#gecmisAc").onclick = () => { gecmisCiz(); $("#gecmisDlg").showModal(); };
$("#gecmisKapat").onclick = () => $("#gecmisDlg").close();
$("#gecmisTemizle").onclick = () => {
  if (!durum.gecmis.length) return;
  if (!confirm(`${durum.gecmis.length} teklif silinecek. Emin misiniz?`)) return;
  durum.gecmis = []; kaydet(); gecmisCiz();
};

/* ---------- teklif metni ---------- */
function teklifMetni(no) {
  const s = SEKTORLER[durum.sektor];
  const h = hesapla();
  const f = durum.firma;
  const musteri = $("#musteri").value.trim();
  const bugun = new Date().toLocaleDateString("tr-TR");
  const son = new Date(Date.now() + 14 * 864e5).toLocaleDateString("tr-TR");

  let t = `FİYAT TEKLİFİ${no ? " · " + no : ""}
`;
  if (f.ad) t += `${f.ad}
`;
  const iletisim = [f.tel, f.mail, f.adres].filter(Boolean).join(" · ");
  if (iletisim) t += `${iletisim}
`;
  t += `${s.ad}
`;
  if (musteri) t += `Sayın ${musteri}
`;
  t += `Tarih: ${bugun}

`;

  for (const r of h.satirlar) {
    t += `• ${r.ad}${r.detay ? ` (${r.detay})` : ""}
  ${para(r.tutar)}
`;
  }
  for (const r of h.indirimSatirlari) {
    t += `• ${r.ad} (${r.detay})
  ${para(r.tutar)}
`;
  }

  // Her satir gosterilmeli: musteri ara toplamdan genel toplama giden
  // yolu kendi hesaplayabilmeli. Indirim/tevkifat gizlenirse rakamlar
  // tutmuyor ve teklif guvenilirligini kaybediyor.
  t += `
Ara toplam: ${para(h.ara)}
`;
  if (h.toplamIndirim > 0) t += `İndirim: -${para(h.toplamIndirim)}
`;
  if (h.toplamIndirim > 0) t += `Net tutar: ${para(h.net)}
`;
  t += `KDV (%${h.kdvOrani}): ${para(h.kdv)}
`;
  if (h.tevkifEdilen > 0) {
    t += `KDV Tevkifatı (${h.tevkifatOranMetin}): -${para(h.tevkifEdilen)}
`;
    t += `Tahsil edilecek KDV: ${para(h.tahsilKdv)}
`;
  }
  t += `GENEL TOPLAM: ${para(h.genel)}

`;
  if (f.iban) {
    t += `Ödeme Bilgileri
`;
    if (f.banka) t += `${f.banka}
`;
    t += `IBAN: ${f.iban}

`;
  }
  t += `Teklif ${son} tarihine kadar geçerlidir.

Koşullar:
`;
  t += s.kosullar.map(k => `- ${k}`).join("\n");
  return t;
}

/* ---------- paylaş / oluştur ---------- */
$("#paylasBtn").onclick = async () => {
  const h = hesapla();
  if (!h.satirlar.length) { alert("Önce en az bir kalem girin."); return; }
  const no = sonrakiNo();
  gecmiseKaydet(no, $("#musteri").value.trim(), h);
  const metin = teklifMetni(no);
  try {
    if (navigator.share) {
      await navigator.share({ title: "Fiyat Teklifi", text: metin });
    } else {
      await navigator.clipboard.writeText(metin);
      alert("Teklif panoya kopyalandı.");
    }
  } catch (e) { /* kullanıcı iptal etti */ }
};

$("#teklifBtn").onclick = () => {
  const h = hesapla();
  if (!h.satirlar.length) { alert("Önce en az bir kalem girin."); return; }
  const s = SEKTORLER[durum.sektor];
  const musteri = $("#musteri").value.trim();
  const no = sonrakiNo();
  gecmiseKaydet(no, musteri, h);
  const bugun = new Date().toLocaleDateString("tr-TR");
  const son = new Date(Date.now() + 14 * 864e5).toLocaleDateString("tr-TR");

  const w = window.open("", "_blank");
  if (!w) { alert("Açılır pencere engellendi. Paylaş düğmesini kullanın."); return; }
  w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8">
<title>Teklif${musteri ? " — " + kacir(musteri) : ""}</title><style>
@page{size:A4;margin:18mm 16mm}
body{font-family:-apple-system,"Segoe UI",Roboto,sans-serif;color:#111;line-height:1.5;
  max-width:760px;margin:0 auto;padding:28px 20px;font-size:14px}
header{display:flex;justify-content:space-between;align-items:flex-start;
  border-bottom:3px solid #111;padding-bottom:14px;margin-bottom:24px}
h1{font-size:14px;letter-spacing:2px;text-transform:uppercase;margin:0;color:#666}
.buyuk{font-size:21px;font-weight:700}
table{width:100%;border-collapse:collapse;margin-bottom:8px}
td{padding:11px 0;border-bottom:1px solid #eee;vertical-align:top}
td.sag{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.ad{font-weight:600}.detay{color:#666;font-size:12.5px}
.toplamlar{margin-left:auto;width:300px;margin-top:14px}
.ts{display:flex;justify-content:space-between;padding:6px 0;color:#555}
.ts.genel{border-top:2px solid #111;margin-top:8px;padding-top:11px;
  font-size:19px;font-weight:700;color:#111}
.gecerli{margin-top:22px;padding:12px 14px;background:#f6f6f4;border-left:3px solid #111}
.kosul{margin-top:26px;padding-top:16px;border-top:1px solid #eee}
.kosul h2{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin:0 0 8px}
.kosul li{font-size:12.5px;color:#444;margin-bottom:4px}
@media print{body{padding:0}.yazdirma-gizle{display:none}}
</style></head><body>
<header><div style="display:flex;gap:14px;align-items:flex-start">
${durum.firma.logo ? `<img src="${durum.firma.logo}" alt="" style="max-width:72px;max-height:72px;object-fit:contain">` : ""}
<div><div class="buyuk">${kacir(durum.firma.ad) || "Fiyat Teklifi"}</div>
<div style="color:#666;font-size:13px">${kacir([durum.firma.tel, durum.firma.mail, durum.firma.adres].filter(Boolean).join(" · ")) || "Fiyat Teklifi"}</div>
${(durum.firma.vd || durum.firma.vkn) ? `<div style="color:#888;font-size:12px;margin-top:2px">${kacir([durum.firma.vd, durum.firma.vkn && ("VKN: " + durum.firma.vkn)].filter(Boolean).join(" · "))}</div>` : ""}</div></div>
<div style="text-align:right;font-size:13px;color:#666">Teklif No: ${no}<br>${bugun}</div></header>
${musteri ? `<p style="margin:0 0 20px"><span style="color:#888;font-size:11px;
  text-transform:uppercase;letter-spacing:1px">Sayın</span><br>
  <span style="font-size:16px;font-weight:600">${kacir(musteri)}</span></p>` : ""}
<table>
<thead><tr>
<th style="text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;border-bottom:1px solid #ddd;padding-bottom:7px">Hizmet</th>
<th style="text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;border-bottom:1px solid #ddd;padding-bottom:7px">Miktar</th>
<th style="text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;border-bottom:1px solid #ddd;padding-bottom:7px">Birim Fiyat</th>
<th style="text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;border-bottom:1px solid #ddd;padding-bottom:7px">Tutar</th>
</tr></thead>
${h.satirlar.map(r => `<tr><td><div class="ad">${kacir(r.ad)}</div></td>
<td class="sag">${r.miktar !== "" ? kacir(String(r.miktar) + " " + (r.birim || "")) : kacir(r.detay)}</td>
<td class="sag">${r.birimFiyat !== "" ? para(r.birimFiyat) : ""}</td>
<td class="sag">${para(r.tutar)}</td></tr>`).join("")}
${h.indirimSatirlari.map(r => `<tr><td><div class="ad" style="color:#0a7a3d">${kacir(r.ad)}</div></td>
<td class="sag" style="color:#0a7a3d">${kacir(r.detay)}</td><td></td>
<td class="sag" style="color:#0a7a3d">${para(r.tutar)}</td></tr>`).join("")}</table>
<div class="toplamlar">
<div class="ts"><span>Ara toplam</span><span>${para(h.ara)}</span></div>
${h.toplamIndirim > 0 ? `<div class="ts" style="color:#0a7a3d"><span>İndirim</span><span>-${para(h.toplamIndirim)}</span></div>` : ""}
<div class="ts"><span>KDV (%${h.kdvOrani})</span><span>${para(h.kdv)}</span></div>
${h.tevkifEdilen > 0 ? `<div class="ts"><span>KDV Tevkifatı (${h.tevkifatOranMetin})</span><span>-${para(h.tevkifEdilen)}</span></div>` : ""}
<div class="ts genel"><span>Genel Toplam</span><span>${para(h.genel)}</span></div></div>
<div class="gecerli">Bu teklif <b>${son}</b> tarihine kadar geçerlidir.</div>
${durum.firma.iban ? `<div class="kosul"><h2>Ödeme Bilgileri</h2>
<div style="font-size:13px;color:#333">${kacir(durum.firma.banka || "")}${durum.firma.banka ? "<br>" : ""}
<b>IBAN:</b> ${kacir(durum.firma.iban)}</div></div>` : ""}
<div class="kosul"><h2>Koşullar</h2><ul>${s.kosullar.map(k => `<li>${kacir(k)}</li>`).join("")}</ul></div>
<div style="margin-top:34px;display:flex;justify-content:space-between;gap:40px">
<div style="flex:1"><div style="border-top:1px solid #999;padding-top:6px;font-size:12px;color:#666">
Teklifi veren${durum.firma.yetkili ? "<br><b style=\"color:#111\">" + kacir(durum.firma.yetkili) + "</b>" : ""}</div></div>
<div style="flex:1"><div style="border-top:1px solid #999;padding-top:6px;font-size:12px;color:#666">
Kabul eden${musteri ? "<br><b style=\"color:#111\">" + kacir(musteri) + "</b>" : ""}</div></div>
</div>
<p class="yazdirma-gizle" style="margin-top:28px;text-align:center">
<button onclick="window.print()" style="padding:13px 26px;font-size:15px;font-weight:600;
  background:#111;color:#fff;border:none;border-radius:11px;cursor:pointer">
  PDF olarak kaydet / Yazdır</button></p>
</body></html>`);
  w.document.close();
};

/* ---------- başlat ---------- */
yukle();
/* Magaza ekran goruntusu icin ornek veri: ?demo=1 */
if (new URLSearchParams(location.search).get("demo") === "1") {
  durum.degerler = { mesafe: 45, hacim: 22, kat: 2 };
  durum.opsiyonlar = { paketleme: true, sigorta: true };
} else if (new URLSearchParams(location.search).get("demo") === "2") {
  durum.degerler = { alan: 85, oda: 3 };
  durum.opsiyonlar = { malzeme: true, tasima: true };
} else if (new URLSearchParams(location.search).get("demo") === "3") {
  durum.degerler = { mesafe: 45, hacim: 22, kat: 2 };
  durum.opsiyonlar = { paketleme: true, sigorta: true };
  durum.indirimler = { haftaici: true };
} else if (new URLSearchParams(location.search).get("demo") === "4") {
  durum.degerler = { mesafe: 45, hacim: 22, kat: 2 };
  durum.opsiyonlar = { paketleme: true, sigorta: true };
  durum.indirimler = { haftaici: true };
  durum.tevkifat = true;
}
temaUygula();
firmaCiz();
ciz();

// test: ?ac=firma ile firma penceresini otomatik ac
if (new URLSearchParams(location.search).get("belge") === "1") {
  $("#musteri").value = "Mehmet Demir";
  setTimeout(() => $("#teklifBtn").click(), 100);
}
if (new URLSearchParams(location.search).get("ac") === "firma") {
  $("#firmaDuzenle").click();
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
