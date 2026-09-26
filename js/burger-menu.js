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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBurgerMenu);
  } else {
    initBurgerMenu();
  }
})();
