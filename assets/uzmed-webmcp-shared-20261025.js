/* Shared drug-source WebMCP adapter. Existing native registration, MKB, DDI and dose contracts remain in place. */
(function (W) {
  'use strict';

  var VERSIYA = 'uzmed-webmcp-shared-20261025';
  var BELGI   = '__UZMED_WEBMCP_READY__';

  if (W[BELGI]) { return; }
  if (W.__UZMED_WEBMCP_YUKLANDI__) { return; }
  W.__UZMED_WEBMCP_YUKLANDI__ = true;

  var MAX = 10;          /* standart natija chegarasi */
  var MAX_HARD = 25;     /* qattiq chegara */

  var H = {
    versiya: VERSIYA, api: null, mavjud: false, royxatdan: [],
    xato: null, urinish: 0, royxatVaqt: null, kutildi: false
  };

  function log(m) { try { console.log('[UZMED WebMCP] ' + m); } catch (e) {} }

  /* ═══ 1. API ANIQLASH — soxta obyekt YARATILMAYDI ═══ */
  function ctx() {
    try {
      if (typeof document !== 'undefined' && document.modelContext) {
        H.api = 'document.modelContext'; return document.modelContext;
      }
    } catch (e) {}
    try {
      if (typeof navigator !== 'undefined' && navigator.modelContext) {
        H.api = 'navigator.modelContext'; return navigator.modelContext;
      }
    } catch (e) {}
    H.api = null; return null;
  }

  /* ═══ 2. MA'LUMOTGA KIRISH (nusxa yo'q) ═══ */
  function MKB() {
    try { if (typeof MKB_DATA !== 'undefined' && MKB_DATA) { return MKB_DATA; } } catch (e) {}
    try { if (W.MKB_DATA) { return W.MKB_DATA; } } catch (e) {}
    return null;
  }
  function DD() {
    try { if (typeof DRUG_DATA !== 'undefined' && DRUG_DATA) { return DRUG_DATA; } } catch (e) {}
    try { if (W.DRUG_DATA) { return W.DRUG_DATA; } } catch (e) {}
    return null;
  }
  function FDB() { try { return W.FULL_DRUG_DB || null; } catch (e) { return null; } }
  function DDI() { try { return W.UZMED_DDI_PRO || null; } catch (e) { return null; } }
  function DOZA2() { try { return W.UZMEDDozaV2 || null; } catch (e) { return null; } }
  function DOZA1() { try { return W.UZMEDDoza || null; } catch (e) { return null; } }

  /* ═══ 3. NORMALIZATSIYA (matn, tibbiy mantiq emas) ═══
     Avval mavjud UZMED_DDI_PRO.norm ishlatiladi. */
  var KIRIL = [['ий','iy'],['щ','shch'],['ч','ch'],['ш','sh'],['ю','yu'],['я','ya'],['ё','yo'],['ж','j'],
    ['х','x'],['ц','ts'],['ъ',''],['ь',''],['а','a'],['б','b'],['в','v'],['г','g'],['д','d'],['е','e'],
    ['з','z'],['и','i'],['й','y'],['к','k'],['л','l'],['м','m'],['н','n'],['о','o'],['п','p'],['р','r'],
    ['с','s'],['т','t'],['у','u'],['ф','f'],['ы','i'],['э','e'],['ў','o'],['қ','q'],['ғ','g'],['ҳ','h']];

  function lookupAlias(value) {
    return String(value)
      .replace(/\bfluconazole\b/g, 'flukonazol')
      .replace(/\b(?:kalsiy|kaltsiy|kaltsiya|calcium) (?:glyukonat|gluconate)\b/g, 'kaltsiy glyukonat')
      .replace(/\b(?:levosetirizin|levotsetirizin|levocetirizine)\b/g, 'levocetirizine')
      .replace(/\b(?:difenhidramin|difengidramin|dimedrol|diphenhydramine)\b/g, 'diphenhydramine')
      .replace(/\b(?:aspirin|acetylsalicylic acid|atsetilsalitsil(?:ovaya)?(?: kislota)?)\b/g, 'acetylsalicylic acid');
  }

  function norm(s) {
    if (s == null) { return ''; }
    var d = DDI();
    if (d && typeof d.norm === 'function') {
      try { var r = d.norm(s); if (typeof r === 'string' && r) { return lookupAlias(r); } } catch (e) {}
    }
    var t = String(s).toLowerCase();
    for (var i = 0; i < KIRIL.length; i++) { t = t.split(KIRIL[i][0]).join(KIRIL[i][1]); }
    t = t.replace(/[\u2018\u2019\u02bb\u02bc`']/g, '');
    t = t.replace(/[^a-z0-9]+/g, ' ').trim();
    return lookupAlias(t);
  }

  /* Reyting: aniq mos > boshlanadi > ichida bor */
  function ball(matn, q) {
    var n = norm(matn); if (!n || !q) { return 0; }
    if (n === q) { return 100; }
    if (n.indexOf(q) === 0) { return 70; }
    if (n.indexOf(q) >= 0) { return 40; }
    return 0;
  }

  function chegara(v) {
    var n = parseInt(v, 10);
    if (!isFinite(n) || n <= 0) { return MAX; }
    return Math.min(n, MAX_HARD);
  }

  function matn(v) { return (v == null) ? null : String(v); }

  /* ═══ 4. TOOL: search_drug ═══ */
  async function searchDrug(p) {
    try {
      const result=await W.UZMEDDrugCatalog.search(p.query,{limit:p.limit||8});
      const cards=result.rows.filter(r=>r.key.startsWith('local:')),market=result.rows.filter(r=>r.key.startsWith('market:'));
      return {ok:true,found:result.rows.length>0,query:p.query,count:result.rows.length,
        results:cards.map(r=>({manba:r.source,kalit:r.key.slice(6),nom:r.name,shakl:r.form,dozalash_mavjud:!!r.raw?.dozalash,clinical_blocked:!!r.clinicalBlock})),
        reyestr:market.map(r=>({manba:r.source,savdo_nomi:r.name,inn:r.inn,ishlab_chiqaruvchi:r.manufacturer,shakl:r.form,narx:r.price,valyuta:r.currency})),
        sources:result.sources,products:result.rows,limit_per_source:Math.min(12,Number(p.limit)||8),izoh:'Dorilar va Qabul bilan umumiy manbalar. Topilgan mahsulotning kalitini get_drug_detailsga berish mumkin. Doza avtomatik tayinlanmaydi.'};
    } catch(e) {return {ok:false,xato:'manba',sabab:e.message};}
  }

  /* ═══ 5. TOOL: get_drug_details ═══ */
  // Quarantine only independently confirmed brand/ingredient conflicts.
  // No replacement formulation or dose is guessed, and source records stay unchanged.
  function clinicalIdentityConflict(k, d) {
    var label = String(k || '') + ' ' + String((d && d.name) || '');
    label = label.toLowerCase();
    if (/avamys/.test(label) && /flutikazon propionat|mometazon/.test(label)) {
      return { reason: 'Avamys brandi flutikazon furoatga tegishli; boshqa faol modda kartasi bilan aralashtirilgan.',
        source: 'https://www.ema.europa.eu/en/medicines/human/EPAR/avamys' };
    }
    if (/salbutamol/.test(label) && /ipratropiy/.test(label) && /duaklir/.test(label)) {
      return { reason: 'Duaklir brandi aklidinium va formoterolga tegishli; salbutamol/ipratropiy kartasi bilan aralashtirilgan.',
        source: 'https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=2eba3089-28b4-4190-9fba-2511246cfd16&type=display' };
    }
    return null;
  }

  async function getDrugDetails(p) {
    const key=String(p.kalit||p.drug||p.query||'');if(!key)return {ok:false,xato:'validatsiya'};
    try {
      let row;
      if(/^(local:|market:|kb:)/.test(key))row=await W.UZMEDDrugCatalog.detail({key});
      else if(/^(apteka:|price:)/.test(key)){const source=key.startsWith('apteka:')?'Apteka.uz':'ArzonApteka';row=await W.UZMEDDrugCatalog.detail({key,slug:key.slice(key.indexOf(':')+1),source});}
      else row=await W.UZMEDDrugCatalog.detail({key:'local:'+key});
      const d=row.uzbek||row.raw||{},blocked=!!row.clinicalBlock;
      return {ok:true,found:true,kalit:key,manba:row.source,nom:row.name,clinical_blocked:blocked,shakl:blocked?null:row.form,
        korsatmalar:blocked?null:matn(d.korsatmalar||d.indications),dozalash:blocked?null:matn(d.dozalash||d.dosage_instructions),qarshi_korsatmalar:blocked?null:matn(d.qarshi||d.contraindications),yon_tasirlar:blocked?null:matn(d.yon||d.adverse_effects),talsiruvi:blocked?null:matn(d.talsiruvi||d.interactions),eslatma:blocked?null:matn(d.eslatma||d.special_instructions),product:row,izoh:blocked?row.clinicalBlock.reason:'Aynan tanlangan manba yozuvi. Yetishmagan ma’lumot taxmin qilinmaydi.'};
    }catch(e){return {ok:false,found:false,xato:'manba',sabab:e.message};}
  }

  /* ═══ 6. TOOL: search_icd10 ═══ */
  function searchIcd10(p) {
    var m = MKB();
    if (!m) { return { ok: false, xato: 'baza', sabab: 'MKB_DATA yuklanmagan' }; }
    var xom = (p && p.query);
    if (xom == null || String(xom).trim() === '') {
      return { ok: false, xato: 'validatsiya', sabab: 'query bo\u2018sh' };
    }
    var lim = chegara(p && p.limit);
    var kodQ = String(xom).toUpperCase().replace(/\s+/g, '');
    var compactQ = kodQ.replace(/\./g, '');
    var q = norm(xom);
    var top = [], i, r, b;

    for (i = 0; i < m.length; i++) {
      r = m[i]; if (!r) { continue; }
      b = 0;
      var kod = String(r[0] || '').toUpperCase();
      if (kod.replace(/\./g, '') === compactQ) { b = 100; }
      else if (kod.replace(/\./g, '').indexOf(compactQ) === 0 && /^[A-Z]\d/.test(compactQ)) { b = 80; }
      if (b === 0 && q) {
        b = Math.max(ball(r[1], q), ball(r[2], q));
        var aliases = Array.isArray(r.localAliases) ? r.localAliases : (Array.isArray(r[3]) ? r[3] : []);
        aliases.forEach(function(alias) { b = Math.max(b, ball(alias, q)); });
      }
      if (b > 0) { top.push({ b: b, r: r }); }
    }
    if (!top.length && W.UZMED_REFERENCE_SEARCH && typeof W.UZMED_REFERENCE_SEARCH.searchMkb === 'function') {
      try {
        W.UZMED_REFERENCE_SEARCH.searchMkb(m, String(xom), m.length).forEach(function(row, index) {
          top.push({ b: 100 - index / Math.max(1, m.length), r: row });
        });
      } catch (e) { /* Existing exact-code and local-alias results remain authoritative. */ }
    }
    if (!top.length) {
      return { ok: true, found: false, query: String(xom), results: [],
        izoh: 'UZMED MKB-10 bazasida topilmadi.' };
    }
    top.sort(function (x, y) { return y.b - x.b; });
    var out = [];
    for (i = 0; i < top.length && i < lim; i++) {
      var row = top[i].r;
      var local = Array.isArray(row.localAliases) ? row.localAliases : (Array.isArray(row[3]) ? row[3] : []);
      var official = !!row.canonicalTitle || /^WHO ICD-10/.test(String(row.reference || ''));
      var uz = official ? local.find(function(x) { return /[a-z]/i.test(x) && !/[а-яё]/i.test(x); }) : row[1];
      var ru = row[2] || local.find(function(x) { return /[а-яё]/i.test(x); });
      out.push({ kod: matn(row[0]), nom_en: official ? matn(row.canonicalTitle || row[1]) : null,
        nom_uz: matn(uz) || null, nom_ru: matn(ru) || null,
        mahalliy_nomlar_tasdiqlangan: row.aliasesVerified === true,
        nom_manba: official ? 'WHO ICD-10 2019; tarjima — UZMED mahalliy sinonimlari' : 'UZMED mahalliy ma’lumotnoma' });
    }
    return { ok: true, found: true, query: String(xom), count: top.length,
      korsatildi: out.length, results: out, manba: 'UZMED MKB-10 (' + m.length + ' kod)' };
  }

  /* ═══ 7. TOOL: check_drug_interactions ═══ */
  function checkInteractions(p) {
    var d = DDI();
    if (!d || typeof d.analyze !== 'function') {
      return { ok: false, xato: 'dvigatel', sabab: 'UZMED_DDI_PRO yuklanmagan' };
    }
    var list = (p && (p.dorilar || p.drugs));
    if (!list && p && p.drugA && p.drugB) { list = [p.drugA, p.drugB]; }
    if (!Array.isArray(list)) {
      return { ok: false, xato: 'validatsiya', sabab: 'dorilar massiv bo\u2018lishi kerak' };
    }
    list = list.filter(function (x) { return x != null && String(x).trim() !== ''; })
               .slice(0, 12).map(function (x) { return String(x); });
    if (list.length < 2) {
      return { ok: false, xato: 'validatsiya', sabab: 'kamida 2 ta dori kerak' };
    }

    var a;
    try { a = d.analyze(list); }
    catch (e) { return { ok: false, xato: 'dvigatel', sabab: 'analyze() istisno: ' + (e && e.message) }; }
    if (!a || a.ok === false) {
      return { ok: false, xato: 'dvigatel', sabab: 'analyze() natija bermadi' };
    }

    var juft = [], i, j, pr, out;
    var ap = a.pairs || [];
    for (i = 0; i < ap.length; i++) {
      pr = ap[i];
      if (!pr || !pr.rules || !pr.rules.length) { continue; }
      out = { dori_a: pr.a && pr.a.name, dori_b: pr.b && pr.b.name, daraja: pr.level, qoidalar: [] };
      for (j = 0; j < pr.rules.length; j++) {
        var q = pr.rules[j];
        out.qoidalar.push({
          daraja: matn(q.level), mexanizm: matn(q.mechanism), tasir: matn(q.effect),
          tavsiya: matn(q.action), boshlanishi: matn(q.onset),
          manba: matn(q.source), tasdiqlangan: (q._verified === true)
        });
      }
      juft.push(out);
    }

    return {
      ok: true, kiritilgan: list,
      aniqlangan: (a.drugs || []).map(function (x) { return { kiritilgan: x.raw, nom: x.name, bazada: !!x.known }; }),
      nomalum: a.unknown || [],
      topildi: juft.length,
      jiddiy: a.serious || 0,
      daraja_hisobi: a.counts || null,
      talsirlar: juft,
      manba: 'UZMED DDI Pro (oflayn qoidalar bazasi)',
      izoh: juft.length === 0
        ? 'Bu juftlik(lar) uchun UZMED bazasida qoida YO\u2018Q. Bu \u201Cxavfsiz\u201D degani emas \u2014 shunchaki bazada yo\u2018q.'
        : 'Faqat UZMED bazasidagi qoidalar. tasdiqlangan=false bo\u2018lsa manba qayta tekshirilishi kerak.'
    };
  }

  /* ═══ 8. TOOL: calculate_dose ═══
     Mavjud dvigatel: UZMEDDozaV2.sinov() -> validatsiya + pediatrik bloklash
                      UZMEDDoza.hisobla() -> to'liq tafsilot
     Yangi formula YOZILMAGAN. Vazn/yosh yo'q bo'lsa TAXMIN QILINMAYDI. */
  var KUN_YIL = 365.25, KUN_OY = KUN_YIL/12;   /* UZMED ning o'z konstantalari */

  function yoshKunHisob(p) {
    var api=W.UZMEDDoseCatalog;if(!api)return NaN;
    if(p.yosh_kun!=null&&p.yosh_kun!=='') {
      if((p.yosh_yil!=null&&p.yosh_yil!=='')||(p.yosh_oy!=null&&p.yosh_oy!==''))return NaN;
      return api.number(p.yosh_kun);
    }
    var total=0,present=false;
    for(var part of [['yosh_yil',KUN_YIL],['yosh_oy',KUN_OY]]) {
      if(p[part[0]]==null||p[part[0]]==='')continue;
      var n=api.number(p[part[0]]);if(!isFinite(n)||n<0)return NaN;total+=n*part[1];present=true;
    }
    return present?total:NaN;
  }

  function calculateDose(p) {
    p = p || {};
    var v2 = DOZA2(), v1 = DOZA1(), fdb = FDB();
    if (!v2 || typeof v2.sinov !== 'function') {
      return { ok: false, xato: 'dvigatel', sabab: 'UZMEDDozaV2 yuklanmagan' };
    }
    if (!fdb) { return { ok: false, xato: 'baza', sabab: 'FULL_DRUG_DB yuklanmagan' }; }

    /* dori */
    var kirish = p.dori || p.kalit || p.drug;
    if (!kirish) { return { ok: false, xato: 'validatsiya', sabab: 'dori ko\u2018rsatilmagan' }; }
    var api=W.UZMEDDoseCatalog, linked=api&&api.resolve({inn:kirish},fdb);
    var k=linked&&linked.key, db=linked&&linked.db;
    if (!db) {
      return { ok: true, hisoblandi: false, sabab: 'dori_topilmadi',
        izoh: 'UZMED FULL_DRUG_DB da \u201C' + String(kirish) + '\u201D topilmadi.' };
    }

    var conflict = clinicalIdentityConflict(k, db);
    if (conflict) {
      return { ok: true, hisoblandi: false, clinical_blocked: true, kalit: k,
        sabab: 'brand_ingredient_conflict', izoh: conflict.reason, manba: conflict.source };
    }

    /* yosh — TAXMIN QILINMAYDI */
    var ad = yoshKunHisob(p);
    if (!isFinite(ad)) {
      return { ok: true, hisoblandi: false, sabab: 'validatsiya',
        izoh: 'Yosh kiritilmagan. yosh_kun yoki yosh_yil/yosh_oy bering. UZMED yoshni taxmin qilmaydi.' };
    }
    /* vazn — TAXMIN QILINMAYDI */
    var vaznBor = (p.vazn_kg != null && p.vazn_kg !== '');
    if (!vaznBor) {
      return { ok: true, hisoblandi: false, sabab: 'validatsiya',
        izoh: 'Vazn kiritilmagan. calculate_dose vaznni TAXMIN QILMAYDI \u2014 vazn_kg bering.' };
    }
    var wt = api.number(p.vazn_kg);
    var ht = (p.boy_sm != null && p.boy_sm !== '') ? parseFloat(p.boy_sm) : null;
    var jins = (p.jins === 'F' || p.jins === 'M') ? p.jins : 'M';
    var drug = { brand: db.name, name: db.name, inn:k, form:db.shakl, generic:true, doseRegimen:p.sxema||'', specialPopulation:!!p.individual_holat };

    /* 1) Mavjud validatsiya + pediatrik bloklash */
    var s;
    try { s = v2.sinov(drug, db, ad, wt, ht, jins); }
    catch (e) { return { ok: false, xato: 'dvigatel', sabab: 'sinov() istisno: ' + (e && e.message) }; }

    if (!s || s.blok) {
      return {
        ok: true, hisoblandi: false, dori: db.name, kalit: k,
        sxemalar:api.regimens(k).map(function(r){return {id:r.id,nom:r.label};}),
        sabab: (s && s.tur) || 'nomalum',
        izoh: (s && s.sabab) || 'Hisob bajarilmadi.',
        manba: 'UZMED doza dvigateli (fix-doza-v2)'
      };
    }

    /* 2) Tafsilot — AYNI dvigatel, dcCalc ishlatadigan yo'l */
    var c = null;
    if (v1 && typeof v1.hisobla === 'function') {
      try { c = v1.hisobla(drug, db, ad, wt, ht, jins); } catch (e) { c = null; }
    }

    /* 3) Xavfsizlik invarianti: ikki yo'l bir xil raqam bermasa — RAQAM BERILMAYDI */
    if (c && c.pd) {
      if (c.pd.dailyMin !== s.kunlik[0] || c.pd.dailyMax !== s.kunlik[1]) {
        return { ok: false, xato: 'nomuvofiqlik',
          sabab: 'Ikki hisob yo\u2018li turlicha natija berdi \u2014 xavfsizlik uchun raqam ko\u2018rsatilmadi.' };
      }
    }

    var j = {
      ok: true, hisoblandi: true, kalit: k, dori: db.name,
      bemor: { yosh_kun: Math.round(ad), yosh_yil: Math.round(ad / KUN_YIL * 10) / 10,
               vazn_kg: wt, boy_sm: ht, jins: jins, yosh_guruhi: (c && c.ag) || null },
      doza: {
        sutkalik_mg: { min: s.kunlik[0], max: s.kunlik[1] },
        bir_martalik_mg: { min: s.birMartalik[0], max: s.birMartalik[1] },
        chastota_kunlik: s.freq,
        bolim: s.sekt
      },
      manba_matni: (c && c.doseStr) || db.dozalash,
      manba: 'UZMED FULL_DRUG_DB dozalash matni + UZMED doza dvigateli',
      izoh: 'Raqamlar UZMED ning mavjud kalkulyatori bilan AYNI dvigatelda hisoblangan. Klinik qaror shifokorniki.'
    };
    if (c && c.pd) {
      j.doza.birlik = c.pd.birlik;
      j.doza.bir_martalik = {min:s.birMartalik[0],max:s.birMartalik[1],birlik:c.pd.birlik};
      j.doza.sutkalik = {min:s.kunlik[0],max:s.kunlik[1],birlik:c.pd.birlik};
      if(c.pd.birlik!=='mg'){j.doza.bir_martalik_mg=null;j.doza.sutkalik_mg=null;}
      j.doza.mg_kg_kun = (c.pd.birlik==='mg' && c.pd.perKg && c.pd.sutkalik && c.pd.pkMin != null) ? { min: c.pd.pkMin, max: c.pd.pkMax } : null;
      j.doza.mg_kg_bir_doza = (c.pd.birlik==='mg' && c.pd.perKg && !c.pd.sutkalik && c.pd.pkMin != null) ? { min: c.pd.pkMin, max: c.pd.pkMax } : null;
      j.doza.yuborish_yoli = matn(c.pd.route);
      j.doza.izohlar = c.pd.izoh || null;
    }
    if(c&&c.phases) {
      j.doza.bosqichlar=c.phases;j.doza.sxema=c.regimen.id;j.doza.kurs_jami_mg=c.totalMg==null?null:c.totalMg;
      j.manba_url=c.source;j.manba='Sxemaga mos doza yo‘riqnomasi';
      if(c.phases.length>1){j.doza.sutkalik_mg=null;j.doza.bir_martalik_mg=null;j.doza.sutkalik=null;j.doza.bir_martalik=null;j.izoh='Doza kunlar bo‘yicha farq qiladi. Faqat bosqichlar ro‘yxatidagi kun va dozadan foydalaning; sxemani shifokor tanlaydi.';}
    }
    if (c && c.forms) { j.amaliy_shakl = c.forms; }
    if (c && c.warns && c.warns.length) { j.ogohlantirishlar = c.warns; }
    if (db.qarshi) { j.qarshi_korsatmalar = matn(db.qarshi); }
    return j;
  }

  /* ═══ 9. TOOL TA'RIFLARI ═══ */
  var TOOLS = [
    {
      name: 'uzmed_ping',
      title: 'UZMED WebMCP Ping',
      description: 'Check that the UZMED offline medical reference application is connected over WebMCP and report which UZMED data modules are loaded. Read-only diagnostic. Returns no patient data and no credentials.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: function () {
        var fdb = FDB(), dd = DD(), m = MKB();
        return Promise.resolve({
          ok: true, app: 'UZMED', webmcp: true, adapter: VERSIYA, api: H.api,
          vaqt: new Date().toISOString(),
          modullar: {
            dori_monografiya: fdb ? Object.keys(fdb).length : 0,
            dori_reyestr: dd ? dd.length : 0,
            mkb10: m ? m.length : 0,
            dori_talsiruvi: !!DDI(),
            doza_dvigateli: !!(DOZA2() && DOZA2().sinov)
          },
          toollar: H.royxatdan
        });
      }
    },
    {
      name: 'search_drug',
      title: 'UZMED dori qidiruvi',
      description: 'Search the same UZMED, Apteka.uz and ArzonApteka sources as Dorilar and Qabul. Full source products and statuses are returned in products and sources; legacy groups remain: "results" are UZMED monographs that contain dosing text (use the returned "kalit" with get_drug_details or calculate_dose), and "reyestr" are medicines registered in Uzbekistan with manufacturer and price. Read-only.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Drug name, e.g. "amoksitsillin" or "амоксициллин"' },
          limit: { type: 'integer', description: 'Max results per group, 1-25, default 10' }
        },
        required: ['query'], additionalProperties: false
      },
      annotations: { readOnlyHint: true },
      execute: function (a) { return Promise.resolve(searchDrug(a || {})); }
    },
    {
      name: 'get_drug_details',
      title: 'UZMED dori monografiyasi',
      description: 'Return the full UZMED monograph for one drug: forms, indications, dosing text, contraindications, side effects and interactions. Pass the "kalit" returned by search_drug. Only data present in UZMED is returned; missing fields are null and are never filled in. Read-only.',
      inputSchema: {
        type: 'object',
        properties: { kalit: { type: 'string', description: 'UZMED drug key from search_drug, e.g. "amoksitsillin"' } },
        required: ['kalit'], additionalProperties: false
      },
      annotations: { readOnlyHint: true },
      execute: function (a) { return Promise.resolve(getDrugDetails(a || {})); }
    },
    {
      name: 'search_icd10',
      title: 'UZMED MKB-10 qidiruvi',
      description: 'Search the loaded UZMED ICD-10 database by code, official English title, or existing Uzbek/Russian local aliases. Returns official and local names separately, null for unavailable translations, and local translation verification status. The exact loaded count is reported by uzmed_ping. Read-only.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'ICD-10 code or disease name in Uzbek or Russian' },
          limit: { type: 'integer', description: 'Max results, 1-25, default 10' }
        },
        required: ['query'], additionalProperties: false
      },
      annotations: { readOnlyHint: true },
      execute: function (a) { return Promise.resolve(searchIcd10(a || {})); }
    },
    {
      name: 'check_drug_interactions',
      title: 'UZMED dori o\u2018zaro ta\u2019siri',
      description: 'Check drug-drug interactions between two or more medicines using the UZMED offline interaction database. Returns severity level, mechanism, clinical effect, recommended action and the source reference for each rule found. If no rule exists in UZMED for a pair, this is reported explicitly and is NOT presented as "safe". Severity is never inferred. Read-only.',
      inputSchema: {
        type: 'object',
        properties: {
          dorilar: { type: 'array', items: { type: 'string' },
            description: 'Two or more drug names, e.g. ["varfarin","aspirin"]' }
        },
        required: ['dorilar'], additionalProperties: false
      },
      annotations: { readOnlyHint: true },
      execute: function (a) { return Promise.resolve(checkInteractions(a || {})); }
    },
    {
      name: 'calculate_dose',
      title: 'UZMED doza kalkulyatori',
      description: 'Calculate a medicine dose using the SAME calculation engine as the UZMED user interface. Requires the drug, the patient age and the patient weight. Weight and age are NEVER estimated: if either is missing the tool returns a validation error instead of a number. Age limits and contraindications recorded in the UZMED database are enforced and can block the calculation. Read-only, no state is changed.',
      inputSchema: {
        type: 'object',
        properties: {
          dori: { type: 'string', description: 'Exact UZMED INN key, e.g. amoksitsillin. Never substitute a partial or ambiguous name.' },
          sxema: {type:'string',description:'Clinician-selected regimen id from sxemalar in a blocked response. Required for structured rules. Never infer the clinical indication.'},
          individual_holat:{type:'boolean',description:'True if renal/hepatic disease, pregnancy or another condition requires an individualized dose; blocks standard rules.'},
          vazn_kg: { type: 'number', description: 'Patient weight in kg. REQUIRED. Never guessed.' },
          yosh_yil: { type: 'number', description: 'Patient age in years' },
          yosh_oy: { type: 'number', description: 'Additional months of age' },
          yosh_kun: { type: 'number', description: 'Age in days (alternative to years/months)' },
          boy_sm: { type: 'number', description: 'Height in cm (optional)' },
          jins: { type: 'string', enum: ['M', 'F'], description: 'Sex, default M' }
        },
        required: ['dori', 'vazn_kg'], additionalProperties: false
      },
      annotations: { readOnlyHint: true },
      execute: function (a) { return Promise.resolve(calculateDose(a || {})); }
    }
  ];

  /* ═══ 10. RO'YXATDAN O'TKAZISH ═══ */
  function royxat() {
    if (W[BELGI]) { return; }
    H.urinish++;
    var mc = ctx();
    H.mavjud = !!mc;
    if (!mc) { return; }                       /* WebMCP yo'q -> UZMED normal ishlaydi */
    if (typeof mc.registerTool !== 'function') { H.xato = 'registerTool topilmadi'; return; }

    W[BELGI] = true;
    H.royxatVaqt = new Date().toISOString();

    TOOLS.forEach(function (t) {
      var p;
      try { p = mc.registerTool(t); }
      catch (e) { H.xato = 'sinxron: ' + ((e && e.name) || e); return; }
      if (p && typeof p.then === 'function') {
        p.then(function () {
          if (H.royxatdan.indexOf(t.name) < 0) { H.royxatdan.push(t.name); }
        }, function (e) {
          var nom = (e && e.name) || String(e);
          if (nom === 'InvalidStateError') {
            if (H.royxatdan.indexOf(t.name) < 0) { H.royxatdan.push(t.name); }
          } else { H.xato = t.name + ': ' + nom; log('rad etildi ' + t.name + ' \u2014 ' + nom); }
        });
      } else {
        if (H.royxatdan.indexOf(t.name) < 0) { H.royxatdan.push(t.name); }
      }
    });
    log(TOOLS.length + ' tool ro\u2018yxatdan o\u2018tkazildi (' + H.api + ')');
  }

  /* ═══ 11. VAQTLASH — UZMED init tugagach ═══ */
  var t0 = Date.now(), CHEK = 60000, pollAktiv = false;

  function tayyorMi() {
    var m = MKB(), f = FDB();
    return !!(m && m.length && f && Object.keys(f).length);
  }
  function kut() {
    if (W[BELGI]) { pollAktiv = false; return; }
    if (tayyorMi()) { H.kutildi = true; pollAktiv = false; royxat(); return; }
    if (Date.now() - t0 > CHEK) { pollAktiv = false; royxat(); return; }
    try { setTimeout(kut, 300); } catch (e) { pollAktiv = false; royxat(); }
  }
  function boshla() {
    if (W[BELGI]) { return; }
    if (tayyorMi()) { H.kutildi = true; royxat(); return; }
    if (!pollAktiv) { pollAktiv = true; kut(); }
  }

  try {
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', boshla, { once: true }); }
    else { boshla(); }
  } catch (e) {}
  try { W.addEventListener('load', boshla, { once: true }); } catch (e) {}
  try { setTimeout(boshla, 6000); }  catch (e) {}
  try { setTimeout(royxat, 25000); } catch (e) {}
  try { setTimeout(royxat, 62000); } catch (e) {}
  try { if (typeof W.requestIdleCallback === 'function') { W.requestIdleCallback(boshla, { timeout: 12000 }); } } catch (e) {}

  /* ═══ 12. TEKSHIRUV API + PANEL (#webmcp-test) ═══ */
  W.UZMED_WEBMCP = {
    versiya: VERSIYA,
    toollar: TOOLS.map(function (t) { return t.name; }),
    holat: function () {
      var o = {}; for (var k in H) { if (Object.prototype.hasOwnProperty.call(H, k)) { o[k] = H[k]; } }
      o.royxatBelgisi = !!W[BELGI];
      o.uzmedTayyor = tayyorMi();
      return o;
    },
    /* Tool mantig'ini WebMCP'siz ham sinash (native emas deb aniq belgilanadi) */
    lokal: function (nom, arg) {
      var t = null, i;
      for (i = 0; i < TOOLS.length; i++) { if (TOOLS[i].name === nom) { t = TOOLS[i]; } }
      if (!t) { return Promise.resolve({ xato: 'tool topilmadi: ' + nom }); }
      return Promise.resolve(t.execute(arg || {}));
    },
    sinov: function () {
      var mc = ctx();
      var n = { native_api: H.api, native_mavjud: !!mc, royxatdan: H.royxatdan.slice(),
                getTools: null, executeTool: null };
      if (!mc) { n.xulosa = 'NATIVE WEBMCP: BU MUHITDA MAVJUD EMAS'; return Promise.resolve(n); }
      var p1 = (typeof mc.getTools === 'function')
        ? mc.getTools().then(function (l) { n.getTools = (l || []).map(function (t) { return t && t.name; }); return l || []; },
                             function (e) { n.getTools = 'xato: ' + ((e && e.name) || e); return []; })
        : (n.getTools = 'getTools() yo\u2018q', Promise.resolve([]));
      return p1.then(function (l) {
        if (typeof mc.executeTool !== 'function') { n.executeTool = 'executeTool() yo\u2018q'; n.xulosa = 'NATIVE API BOR'; return n; }
        var t = null, i;
        for (i = 0; i < l.length; i++) { if (l[i] && l[i].name === 'uzmed_ping') { t = l[i]; } }
        if (!t) { n.executeTool = 'uzmed_ping ro\u2018yxatda yo\u2018q'; n.xulosa = 'NATIVE API BOR'; return n; }
        return mc.executeTool(t, {}).then(function (r) {
          n.executeTool = r; n.xulosa = 'NATIVE WEBMCP TASDIQLANDI'; return n;
        }, function (e) { n.executeTool = 'xato: ' + ((e && e.name) || e); n.xulosa = 'NATIVE API BOR, EXECUTE XATO'; return n; });
      });
    }
  };

  function panel() {
    var koq = false;
    try {
      koq = (String(W.location.hash || '').indexOf('webmcp-test') >= 0) ||
            (String(W.location.search || '').indexOf('webmcp=test') >= 0);
    } catch (e) {}
    if (!koq) { return; }
    if (document.getElementById('uzmed-webmcp-panel')) { return; }

    var d = document.createElement('div');
    d.id = 'uzmed-webmcp-panel';
    d.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;max-height:66vh;overflow:auto;' +
      'z-index:2147483647;background:#0b1220;color:#d7e3f4;border:1px solid #24405f;border-radius:12px;' +
      'padding:12px 14px;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:0 8px 28px rgba(0,0,0,.5)';

    var bayroq = document.createElement('div');
    bayroq.style.cssText = 'font-weight:700;margin-bottom:8px;padding:6px 8px;border-radius:8px;text-align:center';
    d.appendChild(bayroq);

    var out = document.createElement('pre');
    out.style.cssText = 'margin:0;white-space:pre-wrap;word-break:break-word';
    out.textContent = 'tekshirilmoqda...';
    d.appendChild(out);

    var qator = document.createElement('div');
    qator.style.cssText = 'margin-top:10px;display:flex;gap:8px;flex-wrap:wrap';
    function tugma(m, fn) {
      var b = document.createElement('button');
      b.textContent = m;
      b.style.cssText = 'flex:1;min-width:110px;padding:8px 10px;border-radius:8px;border:1px solid #2b4d72;' +
        'background:#12233a;color:#cfe4ff;font:600 12px system-ui;cursor:pointer';
      b.addEventListener('click', fn); return b;
    }

    function yangila() {
      var mc = ctx();
      if (mc) {
        bayroq.style.background = '#0f3a24'; bayroq.style.color = '#7ef0b0';
        bayroq.textContent = 'NATIVE WEBMCP: BOR (' + H.api + ')';
      } else {
        bayroq.style.background = '#3a1520'; bayroq.style.color = '#ff9aa8';
        bayroq.textContent = 'NATIVE WEBMCP: BU MUHITDA MAVJUD EMAS';
      }
      out.textContent = 'tekshirilmoqda...';
      var r = { holat: W.UZMED_WEBMCP.holat() };
      W.UZMED_WEBMCP.sinov().then(function (s) { r.native_sinov = s; out.textContent = JSON.stringify(r, null, 2); },
                                  function (e) { r.native_sinov = 'xato: ' + e; out.textContent = JSON.stringify(r, null, 2); });
    }

    function lokalSinov() {
      out.textContent = 'lokal tool sinovi (NATIVE EMAS)...';
      var A = W.UZMED_WEBMCP.lokal;
      Promise.all([
        A('uzmed_ping', {}),
        A('search_drug', { query: 'amoksitsillin', limit: 3 }),
        A('search_icd10', { query: 'pnevmoniya', limit: 3 }),
        A('check_drug_interactions', { dorilar: ['varfarin', 'aspirin'] }),
        A('calculate_dose', { dori: 'amoksitsillin', yosh_yil: 6, vazn_kg: 20 }),
        A('calculate_dose', { dori: 'amoksitsillin', yosh_yil: 6 })
      ]).then(function (r) {
        out.textContent = '⚠ LOKAL SINOV — NATIVE WEBMCP EMAS\n\n' + JSON.stringify({
          ping: r[0], search_drug: r[1], search_icd10: r[2],
          interactions: r[3], dose_ok: r[4], dose_vaznsiz: r[5]
        }, null, 2);
      });
    }

    qator.appendChild(tugma('Native tekshir', yangila));
    qator.appendChild(tugma('Lokal tool sinovi', lokalSinov));
    qator.appendChild(tugma('Yopish', function () { if (d.parentNode) { d.parentNode.removeChild(d); } }));
    d.appendChild(qator);
    (document.body || document.documentElement).appendChild(d);
    yangila();
  }

  try { setTimeout(panel, 8000); }  catch (e) {}
  try { setTimeout(panel, 20000); } catch (e) {}
  try { W.addEventListener('load', function () { setTimeout(panel, 1500); }, { once: true }); } catch (e) {}

  log('adapter yuklandi (' + VERSIYA + ') \u2014 ' + TOOLS.length + ' tool tayyor');

})(window);
