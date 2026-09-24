/**
 * Ąžuolynas International Students Film Festival
 * Social Media Sharing Helper
 * Supports Facebook direct share, Instagram highlights copy + redirect/modal,
 * Web Share API, and clipboard copy.
 */

(function (global) {
  const CANONICAL_BASE = "https://azuolynasinternationalfilmfestival.github.io";

  function getAbsoluteUrl(relativeOrAbsolute) {
    if (!relativeOrAbsolute) {
      return window.location.href;
    }
    if (relativeOrAbsolute.startsWith("http://") || relativeOrAbsolute.startsWith("https://")) {
      return relativeOrAbsolute;
    }
    // Resolve relative path against current location
    try {
      const resolved = new URL(relativeOrAbsolute, window.location.href);
      return resolved.href;
    } catch (e) {
      return CANONICAL_BASE + "/" + relativeOrAbsolute.replace(/^\//, "");
    }
  }

  function showToast(message, type = "success") {
    if (typeof global.showToast === "function") {
      global.showToast(message, type);
      return;
    }
    const container = document.getElementById("toastContainer");
    if (!container) {
      console.log(message);
      return;
    }
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      console.warn("Clipboard API failed, trying execCommand", err);
    }
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);
      return successful;
    } catch (err) {
      console.error("Copy failed", err);
      return false;
    }
  }

  function openPopup(url, title = "Share", w = 620, h = 580) {
    const left = window.screen.width / 2 - w / 2;
    const top = window.screen.height / 2 - h / 2;
    return window.open(
      url,
      title,
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=${w}, height=${h}, top=${top}, left=${left}`
    );
  }

  const FestivalShare = {
    /**
     * Share generic URL & text to Facebook
     */
    shareFacebook(url, quote) {
      const targetUrl = getAbsoluteUrl(url);
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetUrl)}${quote ? `&quote=${encodeURIComponent(quote)}` : ""}`;
      openPopup(fbUrl, "Facebook Share");
    },

    /**
     * Share Edition to Facebook
     */
    shareEditionFacebook(year, title, pageUrl) {
      const isLt = document.documentElement.lang === "lt" || window.location.pathname.includes("/lt/");
      const heading = title || `FEST ${year || "2026"}`;
      const url = getAbsoluteUrl(pageUrl || window.location.pathname);
      const quote = isLt
        ? `Atraskite ${heading} – Ąžuolyno tarptautinis mokinių filmų festivalis! Keturios žemynų istorijos viename ekrane.`
        : `Discover ${heading} – Ąžuolynas International Students Film Festival! Youth films from four continents.`;
      this.shareFacebook(url, quote);
    },

    /**
     * Share Festival Results to Facebook
     */
    shareResultsFacebook() {
      const isLt = document.documentElement.lang === "lt" || window.location.pathname.includes("/lt/");
      const url = getAbsoluteUrl(window.location.pathname + "#results");
      const quote = isLt
        ? `Skelbiami oficialūs Ąžuolyno tarptautinio mokinių filmų festivalio laureatai ir nugalėtojai! Pažvelkite į jaunųjų kino kūrėjų pasiekimus.`
        : `Official winners and laureates of the Ąžuolynas International Students Film Festival announced! Check out the youth filmmakers' awards.`;
      this.shareFacebook(url, quote);
    },

    /**
     * Share individual Winner to Facebook
     */
    shareWinnerFacebook(winnerId) {
      const isLt = document.documentElement.lang === "lt" || window.location.pathname.includes("/lt/");
      const winner = (window.filmsCache || []).find((f) => f.id === winnerId);
      const url = getAbsoluteUrl(window.location.pathname + "#results");
      let quote = "";

      if (winner) {
        quote = isLt
          ? `Sveikiname! „${winner.filmTitle || 'Kūrinys'}“ (${winner.name || 'Dalyvis'}) pelnė ${winner.awardTitle || 'Apdovanojimą'} Ąžuolyno filmų festivalyje! 🎬 Žiūrėkite filmą:`
          : `Congratulations! "${winner.filmTitle || 'Film'}" by ${winner.name || 'Filmmaker'} won ${winner.awardTitle || 'Award'} at Ąžuolynas Students Film Festival! 🎬 Watch it here:`;
      } else {
        quote = isLt
          ? "Ąžuolyno tarptautinio mokinių filmų festivalio nugalėtojai!"
          : "Ąžuolynas International Students Film Festival Winners!";
      }

      this.shareFacebook(url, quote);
    },

    /**
     * Helper to show Instagram highlight dialog with copied text
     */
    async openInstagramModal(highlightText, url, options = {}) {
      const isLt = document.documentElement.lang === "lt" || window.location.pathname.includes("/lt/");
      const fullShareText = `${highlightText}\n\n🔗 ${getAbsoluteUrl(url)}\n\n#AzuolynasFilmFest #YouthCinema #StudentsFilmFestival #ShortFilms #Kaunas`;

      // Copy highlight text to clipboard
      const copied = await copyToClipboard(fullShareText);

      if (copied) {
        showToast(
          isLt
            ? "Instagram įrašo tekstas ir nuoroda nukopijuoti į iškarpinę!"
            : "Instagram highlight caption & link copied to clipboard!"
        );
      }

      // If mobile supports Web Share API, prompt native share sheet (which often includes Instagram Stories/Feed/Direct)
      if (navigator.share && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        try {
          await navigator.share({
            title: options.title || "Ąžuolynas Film Festival",
            text: highlightText,
            url: getAbsoluteUrl(url)
          });
          return;
        } catch (err) {
          // If user cancels or share is dismissed, continue to open the modal
          if (err.name !== "AbortError") {
            console.log("Web Share fallback to modal", err);
          }
        }
      }

      // Display the helper modal
      const modal = document.getElementById("instagramShareModal");
      if (modal) {
        const pre = document.getElementById("igModalTextPreview");
        if (pre) pre.textContent = fullShareText;

        const heading = document.getElementById("igModalHeading");
        if (heading && options.heading) heading.textContent = options.heading;

        const sub = document.getElementById("igModalSub");
        if (sub && options.sub) sub.textContent = options.sub;

        modal.classList.add("active");
      } else {
        // Fallback: prompt to open Instagram directly
        const openNow = confirm(
          isLt
            ? "Nuoroda nukopijuota! Ar norite atidaryti „Instagram“ dabar?"
            : "Highlight copied! Would you like to open Instagram now?"
        );
        if (openNow) {
          window.open("https://www.instagram.com/", "_blank");
        }
      }
    },

    closeInstagramModal() {
      const modal = document.getElementById("instagramShareModal");
      if (modal) modal.classList.remove("active");
    },

    /**
     * Share Edition to Instagram
     */
    shareEditionInstagram(year, title, pageUrl, subtitle) {
      const isLt = document.documentElement.lang === "lt" || window.location.pathname.includes("/lt/");
      const heading = title || `FEST ${year || "2026"}`;
      const url = pageUrl || window.location.pathname;
      const text = isLt
        ? `🎬 ${heading} – Ąžuolyno tarptautinis mokinių filmų festivalis!\n${subtitle || 'Keturios žemynų istorijos ir talentingiausi jaunieji kūrėjai viename ekrane.'}\nPeržiūrėkite festivalio akimirkas ir laureatus!`
        : `🎬 ${heading} – Ąžuolynas International Students Film Festival!\n${subtitle || 'Youth films from four continents uniting on one screen.'}\nExplore highlights, stories, and winners!`;

      this.openInstagramModal(text, url, {
        heading: isLt ? `Dalintis ${heading} „Instagram“` : `Share ${heading} on Instagram`,
        sub: isLt ? "Tekstas ir nuoroda paruošti klijavimui į Stories arba Post!" : "Caption and link are copied and ready for your Story or Post!"
      });
    },

    /**
     * Share Festival Results to Instagram
     */
    shareResultsInstagram() {
      const isLt = document.documentElement.lang === "lt" || window.location.pathname.includes("/lt/");
      const url = window.location.pathname + "#results";
      const text = isLt
        ? `🏆 Oficialūs Ąžuolyno tarptautinio mokinių filmų festivalio REZULTATAI!\nSveikiname visus talentinguosius laureatus ir dalyvius iš viso pasaulio. Žiūrėkite nugalėtojų filmus ir ceremoniją:`
        : `🏆 Official Ąžuolynas International Students Film Festival RESULTS!\nCelebrating outstanding youth directors and laureates worldwide. Watch the winning films:`;

      this.openInstagramModal(text, url, {
        heading: isLt ? "Dalintis festivalio rezultatais" : "Share Festival Results on Instagram",
        sub: isLt ? "Nukopijuota! Pasidalykite laureatų pasiekimais su draugais." : "Copied! Celebrate the young winners on your Instagram."
      });
    },

    /**
     * Share Winner to Instagram
     */
    shareWinnerInstagram(winnerId) {
      const isLt = document.documentElement.lang === "lt" || window.location.pathname.includes("/lt/");
      const winner = (window.filmsCache || []).find((f) => f.id === winnerId);
      const url = window.location.pathname + "#results";
      let text = "";

      if (winner) {
        text = isLt
          ? `🌟 Laureatas! „${winner.filmTitle || 'Filmas'}“\nAutorius: ${winner.name || 'Dalyvis'} (${winner.institution || winner.location || ''})\nNominacija: ${winner.awardTitle || 'Laureatas'}\nKategorija: ${winner.category || ''}\n\nŽiūrėkite filmą Ąžuolyno filmų festivalio platformoje!`
          : `🌟 Winner Highlight! "${winner.filmTitle || 'Film'}"\nFilmmaker: ${winner.name || 'Student'} (${winner.institution || winner.location || ''})\nAward: ${winner.awardTitle || 'Laureate'}\nCategory: ${winner.category || ''}\n\nWatch this winning film on the Ąžuolynas Fest platform!`;
      } else {
        text = isLt
          ? `🏆 Ąžuolyno tarptautinio mokinių filmų festivalio laureatas! Žiūrėkite nugalėtojo darbą:`
          : `🏆 Ąžuolynas International Students Film Festival winner! Watch the winning film:`;
      }

      this.openInstagramModal(text, url, {
        heading: isLt ? "Dalintis laureato pergale" : "Share Winner on Instagram",
        sub: isLt ? "Laureato aprašymas nukopijuotas! Paskelbkite savo istorijoje." : "Winner highlight copied! Ready to paste into your Story."
      });
    },

    /**
     * Copy link with feedback toast
     */
    async copyLink(url, successMsg) {
      const isLt = document.documentElement.lang === "lt" || window.location.pathname.includes("/lt/");
      const targetUrl = getAbsoluteUrl(url);
      const copied = await copyToClipboard(targetUrl);
      if (copied) {
        showToast(successMsg || (isLt ? "Nuoroda nukopijuota į iškarpinę!" : "Link copied to clipboard!"));
      } else {
        showToast(isLt ? "Nepavyko nukopijuoti nuorodos" : "Could not copy link", "error");
      }
    },

    copyResultsLink() {
      const isLt = document.documentElement.lang === "lt" || window.location.pathname.includes("/lt/");
      this.copyLink(
        window.location.pathname + "#results",
        isLt ? "Festivalio rezultatų nuoroda nukopijuota!" : "Festival results link copied to clipboard!"
      );
    },

    copyWinnerLink(winnerId) {
      const isLt = document.documentElement.lang === "lt" || window.location.pathname.includes("/lt/");
      const winner = (window.filmsCache || []).find((f) => f.id === winnerId);
      const title = winner ? ` (${winner.filmTitle})` : "";
      this.copyLink(
        window.location.pathname + "#results",
        isLt ? `Apdovanojimo nuoroda${title} nukopijuota!` : `Award link${title} copied to clipboard!`
      );
    },

    /**
     * Native share sheet handler
     */
    async shareNative(options = {}) {
      const isLt = document.documentElement.lang === "lt" || window.location.pathname.includes("/lt/");
      const url = getAbsoluteUrl(options.url || window.location.href);
      if (navigator.share) {
        try {
          await navigator.share({
            title: options.title || "Ąžuolynas Film Festival",
            text: options.text || "",
            url: url
          });
          return;
        } catch (err) {
          if (err.name === "AbortError") return;
        }
      }
      // Fallback to copy link
      this.copyLink(url, isLt ? "Nuoroda nukopijuota į iškarpinę!" : "Link copied to clipboard!");
    }
  };

  // Expose globally
  global.FestivalShare = FestivalShare;
})(typeof window !== "undefined" ? window : globalThis);
