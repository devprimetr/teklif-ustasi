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
  firma: { ad: "", tel: "", mail: "", adres: "" },
  tema: "otomatik"
};

/* Kullanıcı metni HTML'e basılmadan önce kaçırılır.
   Firma/müşteri adında < > & " gibi karakterler belgeyi bozuyordu. */
const kacir = s => String(s ?? "").replace(/[&<>"']/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- kalıcılık ---------- */
function yukle() {
  try {
    const h = localStorage.getItem(DEPO);
    if (h) durum = { ...durum, ...JSON.parse(h) };
  } catch (e) { /* özel sekme / kapalı depolama — varsayılanla devam */ }
}
function kaydet() {
  try {
    localStorage.setItem(DEPO, JSON.stringify({
      sektor: durum.sektor, fiyatlar: durum.fiyatlar,
      adlar: durum.adlar, firma: durum.firma, tema: durum.tema
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
      satirlar.push({ ad: adAl(k), detay: `${m} ${k.birim} × ${para(f)}`, tutar });
      ara += tutar;
    } else if (k.tip === "opsiyon") {
      if (!durum.opsiyonlar[k.kod]) continue;
      const tutar = fiyatAl(k);
      satirlar.push({ ad: adAl(k), detay: "", tutar });
      ara += tutar;
    }
  }
  // yüzde kalemleri en sona — ara toplam üzerinden hesaplanır
  for (const k of s.kalemler) {
    if (k.tip !== "yuzde" || !durum.opsiyonlar[k.kod]) continue;
    const o = fiyatAl(k), tutar = ara * o / 100;
    satirlar.push({ ad: adAl(k), detay: `%${o}`, tutar });
    ara += tutar;
  }

  const kdv = ara * s.kdv / 100;
  return { satirlar, ara, kdv, genel: ara + kdv, kdvOrani: s.kdv };
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
      durum.degerler = {}; durum.opsiyonlar = {};
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
  $("#kdv").textContent = para(h.kdv);
  $("#kdvEtiket").textContent = `KDV (%${h.kdvOrani})`;
  $("#genel").textContent = para(h.genel);
}

function ciz() { sektorleriCiz(); kalemleriCiz(); toplamCiz(); }

/* ---------- fiyat düzenleme ---------- */
$("#fiyatDuzenle").onclick = () => {
  const s = SEKTORLER[durum.sektor];
  $("#fiyatAlanlari").innerHTML = s.kalemler.map(k => `
    <div style="margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--cizgi)">
      <label>Kalem adı</label>
      <input type="text" data-ak="${k.kod}" value="${kacir(adAl(k))}" style="margin-bottom:8px">
      <label>${k.tip === "yuzde" ? "Oran (%)" : k.birim ? `Fiyat (₺/${k.birim})` : "Fiyat (₺)"}</label>
      <input type="number" inputmode="decimal" step="any" data-fk="${k.kod}" value="${fiyatAl(k)}">
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
  $("#firmaDlg").showModal();
};
$("#firmaKapat").onclick = () => $("#firmaDlg").close();
$("#firmaKaydet").onclick = () => {
  durum.firma = {
    ad: $("#fFirmaAd").value.trim(), tel: $("#fFirmaTel").value.trim(),
    mail: $("#fFirmaMail").value.trim(), adres: $("#fFirmaAdres").value.trim()
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

/* ---------- teklif metni ---------- */
function teklifMetni() {
  const s = SEKTORLER[durum.sektor];
  const h = hesapla();
  const musteri = $("#musteri").value.trim();
  const bugun = new Date().toLocaleDateString("tr-TR");
  const son = new Date(Date.now() + 14 * 864e5).toLocaleDateString("tr-TR");

  let t = `FİYAT TEKLİFİ\n${s.ad}\n`;
  if (musteri) t += `Sayın ${musteri}\n`;
  t += `Tarih: ${bugun}\n\n`;
  for (const r of h.satirlar) {
    t += `• ${r.ad}${r.detay ? ` (${r.detay})` : ""}\n  ${para(r.tutar)}\n`;
  }
  t += `\nAra toplam: ${para(h.ara)}\nKDV (%${h.kdvOrani}): ${para(h.kdv)}\n`;
  t += `GENEL TOPLAM: ${para(h.genel)}\n\n`;
  t += `Teklif ${son} tarihine kadar geçerlidir.\n\nKoşullar:\n`;
  t += s.kosullar.map(k => `- ${k}`).join("\n");
  return t;
}

/* ---------- paylaş / oluştur ---------- */
$("#paylasBtn").onclick = async () => {
  const h = hesapla();
  if (!h.satirlar.length) { alert("Önce en az bir kalem girin."); return; }
  const metin = teklifMetni();
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
<header><div><div class="buyuk">${kacir(durum.firma.ad) || s.ikon + " " + s.ad}</div>
<div style="color:#666;font-size:13px">${kacir([durum.firma.tel, durum.firma.mail, durum.firma.adres].filter(Boolean).join(" · ")) || "Fiyat Teklifi"}</div></div>
<div style="text-align:right;font-size:13px;color:#666">${bugun}</div></header>
${musteri ? `<p style="margin:0 0 20px"><span style="color:#888;font-size:11px;
  text-transform:uppercase;letter-spacing:1px">Sayın</span><br>
  <span style="font-size:16px;font-weight:600">${kacir(musteri)}</span></p>` : ""}
<table>${h.satirlar.map(r => `<tr><td><div class="ad">${kacir(r.ad)}</div>
${r.detay ? `<div class="detay">${kacir(r.detay)}</div>` : ""}</td>
<td class="sag">${para(r.tutar)}</td></tr>`).join("")}</table>
<div class="toplamlar">
<div class="ts"><span>Ara toplam</span><span>${para(h.ara)}</span></div>
<div class="ts"><span>KDV (%${h.kdvOrani})</span><span>${para(h.kdv)}</span></div>
<div class="ts genel"><span>Genel Toplam</span><span>${para(h.genel)}</span></div></div>
<div class="gecerli">Bu teklif <b>${son}</b> tarihine kadar geçerlidir.</div>
<div class="kosul"><h2>Koşullar</h2><ul>${s.kosullar.map(k => `<li>${kacir(k)}</li>`).join("")}</ul></div>
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
}
temaUygula();
firmaCiz();
ciz();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
