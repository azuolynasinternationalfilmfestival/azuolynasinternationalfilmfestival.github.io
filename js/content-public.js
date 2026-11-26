/**
 * content-public.js
 * Public website loader & dynamic hydrator backed primarily by Firestore `content` collection,
 * with clean fallbacks to `editions`, `settings/festival`, and `data/editions.json`.
 */
(function (global) {
  "use strict";

  var DEFAULT_HERO =
    "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3458.jpeg?alt=media&token=224af1bd-25ff-494e-8136-fbf330d3ad5b";
  var COVER_2026 = "https://i.postimg.cc/vmKKp6m6/ceremonija-2026-03-6612.jpg";

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeUrl(raw, fallback) {
    var val = String(raw || "").trim();
    if (!val) return fallback || "";
    if (/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(val)) return val;
    if (/^https?:\/\//i.test(val) || val.charAt(0) === "/" || val.indexOf("./") === 0 || val.indexOf("../") === 0) {
      return val;
    }
    return fallback || "";
  }

  function sanitizeEditorialStory(raw) {
    var escaped = String(raw || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    return escaped
      .replace(/&lt;(\/?(b|strong|i|em|blockquote|u))&gt;/gi, "<$1>")
      .split(/\n{2,}/)
      .map(function (p) {
        return '<p style="margin:0 0 12px 0;">' + p.replace(/\n/g, "<br>") + "</p>";
      })
      .join("");
  }

  function isLegacyOutdated2026(ed) {
    if (!ed) return false;
    var hero = String(ed.heroImage || "");
    var dt = String(ed.date || "");
    var dtEn = String(ed.dateEn || "");
    var updated = String(ed.updatedAt || "");
    return (
      (!updated || updated < "2026-11-23T09:00:00.000Z") &&
      (!hero || hero.indexOf("IMG_3458") !== -1 || hero.indexOf("IMG_3459") !== -1 || dt.indexOf("balandžio 17") !== -1 || dtEn.indexOf("April 17") !== -1)
    );
  }

  function isInLangSubdir() {
    if (typeof location === "undefined") return true;
    return /\/(lt|en)\//.test(location.pathname || "");
  }

  function resolveEditionUrl(year, lang, ed) {
    var yr = String(year || (ed && ed.year) || "2027").trim();
    var targetLang = lang === "en" ? "en" : "lt";
    var inSubdir = isInLangSubdir();
    var prefix = inSubdir ? "" : targetLang + "/";
    if (yr === "2026" || yr === "2027") {
      return prefix + "azuolynas-fest-" + yr + ".html";
    }
    return prefix + "edition.html?year=" + encodeURIComponent(yr);
  }

  function applyDynamicSeo(doc, lang) {
    if (!doc || typeof document === "undefined") return;
    var isEn = lang === "en";
    var title = (isEn ? doc.seoTitleEn || doc.seoTitle : doc.seoTitle || doc.seoTitleEn) || "";
    var desc = (isEn ? doc.seoDescriptionEn || doc.seoDescription : doc.seoDescription || doc.seoDescriptionEn) || "";
    if (title && String(title).trim()) {
      document.title = String(title).trim();
      var ogTitle = document.querySelector('meta[property="og:title"]');
      var twTitle = document.querySelector('meta[name="twitter:title"]');
      if (ogTitle) ogTitle.setAttribute("content", String(title).trim());
      if (twTitle) twTitle.setAttribute("content", String(title).trim());
    }
    if (desc && String(desc).trim()) {
      var metaDesc = document.querySelector('meta[name="description"]');
      var ogDesc = document.querySelector('meta[property="og:description"]');
      var twDesc = document.querySelector('meta[name="twitter:description"]');
      if (metaDesc) metaDesc.setAttribute("content", String(desc).trim());
      if (ogDesc) ogDesc.setAttribute("content", String(desc).trim());
      if (twDesc) twDesc.setAttribute("content", String(desc).trim());
    }
  }

  function updateHeaderEditionNav(catalogMap, lang, activeYear) {
    if (typeof document === "undefined" || !catalogMap) return;
    var nav = document.querySelector("header .header-edition-nav");
    if (!nav) return;

    var years = Object.keys(catalogMap)
      .filter(function (k) {
        if (k === "home" || k.indexOf("_") !== -1) return false;
        var item = catalogMap[k] || {};
        var n = Number(k);
        if (n >= 2026) return true;
        return item._fromContentDoc === true && item.status !== "archived";
      })
      .sort(function (a, b) {
        return Number(b) - Number(a);
      });

    if (years.length === 0) return;

    nav.innerHTML = years
      .map(function (yr) {
        var href = resolveEditionUrl(yr, lang, catalogMap[yr]);
        var isActive = String(activeYear || "") === String(yr);
        return (
          '<a href="' +
          escapeHtml(href) +
          '" class="header-edition-link' +
          (isActive ? " active" : "") +
          '">' +
          escapeHtml(yr) +
          "</a>"
        );
      })
      .join("");
  }

  function normalizeEditionForLang(doc, lang) {
    if (!doc) return doc;
    var yr = String(doc.year || doc.id || "").trim();
    if (yr === "2026" && isLegacyOutdated2026(doc)) {
      return {
        id: "2026",
        year: "2026",
        title: "FEST 2026",
        titleEn: "FEST 2026",
        date: "2026 m. balandžio 30 d.",
        dateEn: "April 30, 2026",
        subtitle: "Tema: „What If“ • Kino šventė Kauno tarptautinėje gimnazijoje: net keturi žemynai viename ekrane!",
        subtitleEn: "Theme: 'What If' • Cinema Celebration at Kaunas International Gymnasium: Four Continents on One Screen!",
        heroImage: COVER_2026,
        videoUrl: doc.videoUrl || "https://www.youtube.com/watch?v=INGtv",
        photos: doc.photos || []
      };
    }
    return {
      ...doc,
      year: yr || doc.year,
      heroImage: safeUrl(doc.heroImage, yr === "2026" ? COVER_2026 : DEFAULT_HERO)
    };
  }

  function attachPublicContentSync(opts) {
    var lang = (opts && opts.lang) === "en" ? "en" : "lt";
    var targetYear = opts && opts.year ? String(opts.year) : "";
    var onHomeContent = opts && typeof opts.onHomeContent === "function" ? opts.onHomeContent : null;
    var onEditionDoc = opts && typeof opts.onEditionDoc === "function" ? opts.onEditionDoc : null;
    var onCatalog = opts && typeof opts.onCatalog === "function" ? opts.onCatalog : null;

    var catalog = {};
    var hasFirestoreContent = false;

    function emitCatalog() {
      updateHeaderEditionNav(catalog, lang, targetYear);
      if (onCatalog) {
        var list = Object.keys(catalog)
          .filter(function (k) {
            return k !== "home" && k.indexOf("_") === -1;
          })
          .map(function (k) {
            return normalizeEditionForLang(catalog[k], lang);
          })
          .sort(function (a, b) {
            return Number(b.year || 0) - Number(a.year || 0);
          });
        if (list.length > 0) onCatalog(list);
      }
    }

    function absorbContentDoc(id, data, fromContentCollection) {
      if (!data || typeof data !== "object") return;
      var key = String(id || data.year || "").trim();
      if (!key || key.indexOf("_") !== -1) return;

      if (key === "home") {
        catalog.home = { ...data, id: "home", _fromContentDoc: !!fromContentCollection };
        if (onHomeContent) onHomeContent(catalog.home);
        if (!targetYear) applyDynamicSeo(catalog.home, lang);
        return;
      }

      var existing = catalog[key];
      if (!fromContentCollection && existing && existing._fromContentDoc) {
        return;
      }

      var merged = {
        ...(existing || {}),
        ...data,
        id: key,
        year: key,
        _fromContentDoc: fromContentCollection || (existing && existing._fromContentDoc) || false
      };
      catalog[key] = merged;

      if (targetYear && key === targetYear) {
        var norm = normalizeEditionForLang(merged, lang);
        if (onEditionDoc) onEditionDoc(norm);
        applyDynamicSeo(norm, lang);
      }
    }

    // 1. JSON baseline fallback (works offline on static hosts before Firestore wakes up)
    var jsonRel = isInLangSubdir() ? "../data/editions.json" : "data/editions.json";
    if (typeof fetch === "function") {
      fetch(jsonRel)
        .then(function (r) {
          return r && r.ok && (r.headers.get("content-type") || "").indexOf("application/json") !== -1 ? r.json() : null;
        })
        .then(function (payload) {
          if (hasFirestoreContent || !payload || !Array.isArray(payload.editions)) return;
          for (var i = 0; i < payload.editions.length; i++) {
            var ed = payload.editions[i];
            absorbContentDoc(ed.year || ed.id, ed, false);
          }
          emitCatalog();
        })
        .catch(function () {});
    }

    // 2. Attach Firestore listeners (content primary, editions non-destructive fallback)
    function connectDb(activeDb) {
      if (!activeDb || typeof activeDb.collection !== "function") return;

      activeDb.collection("content").onSnapshot(
        function (snapshot) {
          hasFirestoreContent = true;
          snapshot.forEach(function (doc) {
            absorbContentDoc(doc.id, doc.data(), true);
          });
          emitCatalog();
        },
        function () {}
      );

      activeDb.collection("editions").onSnapshot(
        function (snapshot) {
          snapshot.forEach(function (doc) {
            absorbContentDoc(doc.id, doc.data(), false);
          });
          emitCatalog();
        },
        function () {}
      );
    }

    if (typeof global.db !== "undefined" && global.db) {
      connectDb(global.db);
    } else if (global.FestivalFirebasePublic && typeof global.FestivalFirebasePublic.onReady === "function") {
      global.FestivalFirebasePublic.onReady(connectDb);
    }
  }

  global.FestivalContentPublic = {
    safeUrl: safeUrl,
    escapeHtml: escapeHtml,
    sanitizeEditorialStory: sanitizeEditorialStory,
    resolveEditionUrl: resolveEditionUrl,
    updateHeaderEditionNav: updateHeaderEditionNav,
    applyDynamicSeo: applyDynamicSeo,
    attachPublicContentSync: attachPublicContentSync
  };
})(typeof window !== "undefined" ? window : globalThis);
