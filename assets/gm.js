(function () {
  "use strict";

  /* mobile menu */
  var menuBtn = document.querySelector("[data-menu-btn]");
  var menu = document.querySelector("[data-mobile-menu]");
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* console tabs */
  var rail = document.querySelector("[data-rail]");
  if (rail) {
    rail.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-tab]");
      if (!btn) return;
      rail.querySelectorAll("button[data-tab]").forEach(function (b) {
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      var ta = document.querySelector("[data-prompt]");
      if (ta) {
        var ph = btn.getAttribute("data-ph");
        if (ph) ta.placeholder = ph;
        ta.focus();
      }
    });
  }

  /* run → playground */
  var runBtn = document.querySelector("[data-run]");
  if (runBtn) {
    runBtn.addEventListener("click", function () {
      var ta = document.querySelector("[data-prompt]");
      var q = ta && ta.value.trim() ? "?q=" + encodeURIComponent(ta.value.trim()) : "";
      location.href = "/playground" + q;
    });
    var ta0 = document.querySelector("[data-prompt]");
    if (ta0) {
      ta0.addEventListener("keydown", function (e) {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") runBtn.click();
      });
    }
  }

  /* example chips */
  document.querySelectorAll("[data-example]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      var ta = document.querySelector("[data-prompt]");
      if (ta) {
        ta.value = chip.getAttribute("data-example");
        ta.focus();
      }
    });
  });

  /* copy buttons */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var sel = btn.getAttribute("data-copy");
      var el = sel ? document.querySelector(sel) : null;
      var text = el ? el.innerText : "";
      if (navigator.clipboard && text) {
        navigator.clipboard.writeText(text).then(function () {
          var old = btn.textContent;
          btn.textContent = "Copied";
          setTimeout(function () { btn.textContent = old; }, 1400);
        });
      }
    });
  });

  /* command palette stub */
  var searchBtns = document.querySelectorAll("[data-search]");
  searchBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      location.href = "/search-docs.html";
    });
  });
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      location.href = "/search-docs.html";
    }
  });

  /* faq: close others */
  document.querySelectorAll(".faq details").forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      document.querySelectorAll(".faq details").forEach(function (o) {
        if (o !== d) o.open = false;
      });
    });
  });
})();
