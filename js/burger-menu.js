/**
 * Ąžuolynas International Students Film Festival
 * Responsive Burger Menu & Navigation Drawer
 */

(function () {
  function initBurgerMenu() {
    const burgerBtn = document.getElementById("menuBurgerBtn");
    const closeBtn = document.getElementById("menuBurgerCloseBtn");
    const backdrop = document.getElementById("mobileMenuBackdrop");
    const drawer = document.getElementById("mobileMenuDrawer");

    if (!burgerBtn || !drawer) {
      return;
    }

    function syncVisibility() {
      // Sync any dynamic section visibility between desktop nav and drawer nav
      const desktopNavItems = document.querySelectorAll('[id^="navLink"]');
      desktopNavItems.forEach((desktopEl) => {
        const id = desktopEl.id;
        const drawerId = "drawer" + id.charAt(0).toUpperCase() + id.slice(1);
        const drawerEl = document.getElementById(drawerId);
        if (drawerEl) {
          const isHidden = desktopEl.classList.contains("d-none") || desktopEl.style.display === "none";
          drawerEl.classList.toggle("d-none", isHidden);
        }
      });
    }

    function openMenu() {
      syncVisibility();
      drawer.classList.add("active");
      if (backdrop) backdrop.classList.add("active");
      document.body.classList.add("menu-drawer-open");
      burgerBtn.setAttribute("aria-expanded", "true");
      drawer.setAttribute("aria-hidden", "false");
      if (backdrop) backdrop.setAttribute("aria-hidden", "false");

      // Set focus on close button or first interactive element
      if (closeBtn) {
        setTimeout(() => closeBtn.focus(), 80);
      }
    }

    function closeMenu() {
      drawer.classList.remove("active");
      if (backdrop) backdrop.classList.remove("active");
      document.body.classList.remove("menu-drawer-open");
      burgerBtn.setAttribute("aria-expanded", "false");
      drawer.setAttribute("aria-hidden", "true");
      if (backdrop) backdrop.setAttribute("aria-hidden", "true");
      burgerBtn.focus();
    }

    function toggleMenu() {
      if (drawer.classList.contains("active")) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    burgerBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeMenu();
      });
    }

    if (backdrop) {
      backdrop.addEventListener("click", () => {
        closeMenu();
      });
    }

    // Close on ESC key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.classList.contains("active")) {
        closeMenu();
      }
    });

    // Automatically close drawer when an in-page anchor link is clicked
    const drawerLinks = drawer.querySelectorAll("a");
    drawerLinks.forEach((link) => {
      link.addEventListener("click", () => {
        const href = link.getAttribute("href") || "";
        // If clicking anchor or page link, close drawer smoothly
        if (href.startsWith("#") || href.includes(".html")) {
          closeMenu();
        }
      });
    });

    // Expose global API
    window.BurgerMenu = {
      open: openMenu,
      close: closeMenu,
      toggle: toggleMenu,
      syncVisibility: syncVisibility
    };

    // Initial sync
    syncVisibility();
  }

  function initFloatingControls() {
    let cluster = document.querySelector(".floating-actions-cluster");
    const isLt = document.documentElement.lang === "lt" || window.location.pathname.includes("/lt/");

    if (!cluster) {
      cluster = document.createElement("aside");
      cluster.className = "floating-actions-cluster";
      cluster.setAttribute("aria-label", isLt ? "Greitoji navigacija ir socialiniai tinklai" : "Quick navigation and social links");
      cluster.innerHTML = `
        <button type="button" id="scrollToTopBtn" class="floating-btn floating-btn-top" title="${isLt ? 'Grįžti į viršų' : 'Scroll to top'}" aria-label="${isLt ? 'Grįžti į puslapio viršų' : 'Scroll to top'}">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
          <span class="floating-btn-tooltip">${isLt ? 'Į viršų' : 'Top'}</span>
        </button>
      `;
      document.body.appendChild(cluster);
    }

    const topBtn = cluster.querySelector("#scrollToTopBtn");
    if (!topBtn) return;

    let ticking = false;
    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 300) {
            topBtn.classList.add("visible");
          } else {
            topBtn.classList.remove("visible");
          }
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    topBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  function init() {
    initBurgerMenu();
    initFloatingControls();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
