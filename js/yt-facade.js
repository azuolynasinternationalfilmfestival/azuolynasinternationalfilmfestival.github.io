/**
 * yt-facade.js
 * Lightweight click-to-load YouTube facade with on-demand preconnect.
 * Ąžuolynas International Film Festival
 */
(function (root) {
  "use strict";

  var preconnected = false;

  function ensureYouTubePreconnect() {
    if (preconnected || typeof document === "undefined" || !document.head) return;
    preconnected = true;
    [
      "https://www.youtube-nocookie.com",
      "https://www.youtube.com",
      "https://i.ytimg.com"
    ].forEach(function (origin) {
      if (!document.querySelector('link[rel="preconnect"][href="' + origin + '"]')) {
        var link = document.createElement("link");
        link.rel = "preconnect";
        link.href = origin;
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      }
    });
  }

  function escapeAttr(val) {
    return String(val || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function extractYouTubeId(url) {
    var clean = String(url || "").trim();
    var m = clean.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return m && m[1] ? m[1] : "";
  }

  function isYouTubeUrl(url) {
    return /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/)/i.test(String(url || ""));
  }

  function toNocookieEmbedSrc(url, id) {
    if (id) {
      return "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
    }
    var src = String(url || "").trim()
      .replace("https://www.youtube.com/", "https://www.youtube-nocookie.com/")
      .replace("http://www.youtube.com/", "https://www.youtube-nocookie.com/");
    if (src.indexOf("watch?v=") !== -1) {
      src = src.replace("watch?v=", "embed/");
    }
    return src + (src.indexOf("?") === -1 ? "?" : "&") + "autoplay=1&rel=0";
  }

  function buildFacadeHTML(url, title, lang, fallbackPoster) {
    var cleanUrl = String(url || "").trim();
    if (!cleanUrl) return "";

    var id = extractYouTubeId(cleanUrl);
    if (!id && !isYouTubeUrl(cleanUrl)) {
      return '<video controls playsinline preload="metadata" src="' + escapeAttr(cleanUrl) + '" class="embed-media"></video>';
    }

    var isLt = (lang || (document.documentElement && document.documentElement.lang) || "en").toLowerCase().indexOf("lt") === 0;
    var resolvedTitle = title || (isLt ? "Festivalio vaizdo įrašas" : "Festival video");
    var ariaPrefix = isLt ? "Žiūrėti vaizdo įrašą" : "Play video";
    var safeTitle = escapeAttr(resolvedTitle);
    var safeAria = escapeAttr(ariaPrefix + ": " + resolvedTitle);
    var posterImg = id
      ? '<picture class="yt-facade-picture">' +
          '<source srcset="https://i.ytimg.com/vi_webp/' + id + '/hqdefault.webp" type="image/webp">' +
          '<img class="yt-facade-img" src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" alt="' + safeTitle + '" width="480" height="360" loading="lazy" decoding="async">' +
        "</picture>"
      : '<img class="yt-facade-img" src="' + escapeAttr(fallbackPoster || "https://i.postimg.cc/vmKKp6m6/ceremonija-2026-03-6612.jpg") + '" alt="' + safeTitle + '" width="1200" height="800" loading="lazy" decoding="async">';

    return (
      '<button type="button" class="yt-facade-btn"' +
      (id ? ' data-yt-id="' + id + '"' : ' data-yt-src="' + escapeAttr(toNocookieEmbedSrc(cleanUrl, "")) + '"') +
      ' data-yt-title="' + safeTitle + '" aria-label="' + safeAria + '">' +
        posterImg +
        '<span class="yt-facade-play" aria-hidden="true">' +
          '<svg viewBox="0 0 68 48" width="68" height="48"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#212121" fill-opacity="0.88"/><path d="M45 24 27 14v20" fill="#fff"/></svg>' +
        "</span>" +
      "</button>"
    );
  }

  function activateFacadeButton(btn) {
    if (!btn || btn.dataset.ytActivated === "1") return;
    btn.dataset.ytActivated = "1";
    ensureYouTubePreconnect();

    var id = btn.getAttribute("data-yt-id") || "";
    var customSrc = btn.getAttribute("data-yt-src") || "";
    var title = btn.getAttribute("data-yt-title") || "Festival video";
    var src = customSrc || toNocookieEmbedSrc("", id);
    if (!src) return;

    var iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = title;
    iframe.className = "embed-media";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    btn.replaceWith(iframe);
  }

  if (typeof document !== "undefined") {
    document.addEventListener("pointerenter", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest(".yt-facade-btn") : null;
      if (btn) ensureYouTubePreconnect();
    }, true);

    document.addEventListener("focusin", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest(".yt-facade-btn") : null;
      if (btn) ensureYouTubePreconnect();
    });

    document.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest(".yt-facade-btn") : null;
      if (btn) {
        e.preventDefault();
        activateFacadeButton(btn);
      }
    });
  }

  root.FestivalYouTube = {
    extractYouTubeId: extractYouTubeId,
    buildFacadeHTML: buildFacadeHTML,
    activate: activateFacadeButton,
    preconnect: ensureYouTubePreconnect
  };
})(typeof window !== "undefined" ? window : globalThis);
