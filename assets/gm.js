(function () {
  "use strict";

  /* mobile menu — floating mini buttons */
  var menuBtn = document.querySelector("[data-menu-btn]");
  var menu = document.querySelector("[data-mobile-menu]");
  if (menuBtn && menu) {
    var setMenu = function (open) {
      menu.classList.toggle("open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    };
    menuBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      setMenu(!menu.classList.contains("open"));
    });
    document.addEventListener("click", function (e) {
      if (!menu.classList.contains("open")) return;
      if (menu.contains(e.target) || menuBtn.contains(e.target)) return;
      setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) setMenu(false);
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
      var mn = document.querySelector("[data-model-name]");
      if (mn && mn.textContent && mn.textContent !== "auto:free") {
        q += (q ? "&" : "?") + "model=" + encodeURIComponent(mn.textContent);
      }
      location.href = "/playground" + q;
    });
    var ta0 = document.querySelector("[data-prompt]");
    if (ta0) {
      ta0.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        if (e.shiftKey) return; /* ⇧↵ = new line (default) */
        e.preventDefault();
        runBtn.click();
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

  /* model search palette */
  var overlay = document.createElement("div");
  overlay.className = "palette-overlay";
  overlay.innerHTML =
    '<div class="palette" role="dialog" aria-label="Search models">' +
    '  <div class="palette-input-row">' +
    '    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>' +
    '    <input class="palette-input" type="text" placeholder="Search 314 models — gpt, claude, gemini, free..." aria-label="Search models" autocomplete="off">' +
    '    <span class="kbd">ESC</span>' +
    '  </div>' +
    '  <div class="palette-list"><div class="palette-loading">Loading models&hellip;</div></div>' +
    '  <div class="palette-foot"><span>&uarr;&darr; navigate</span><span>&crarr; open in playground</span><span>esc close</span></div>' +
    "</div>";
  document.body.appendChild(overlay);

  var palInput = overlay.querySelector(".palette-input");
  var palList = overlay.querySelector(".palette-list");
  var allModels = null;
  var selIdx = 0;
  var current = [];

  function fetchModels() {
    if (allModels) return Promise.resolve(allModels);
    return fetch("/api/v1/models")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        allModels = (d.data || []).map(function (m) { return m.id; });
        return allModels;
      })
      .catch(function () { allModels = []; return allModels; });
  }

  function renderList(q) {
    q = (q || "").toLowerCase().trim();
    var ids = allModels || [];
    var hits = q
      ? ids.filter(function (id) { return id.toLowerCase().indexOf(q) !== -1; })
      : ids.slice(0, 8);
    current = hits.slice(0, 40);
    selIdx = 0;
    if (!current.length) {
      palList.innerHTML = '<div class="palette-empty">No models match &ldquo;' + (q.replace(/</g, "&lt;")) + '&rdquo;</div>';
      return;
    }
    palList.innerHTML = current
      .map(function (id, i) {
        var free = id.slice(-5) === ":free";
        var prov = id.indexOf("/") !== -1 ? id.split("/")[0] : "grexlabs";
        return (
          '<button type="button" class="palette-item' + (i === 0 ? " sel" : "") + '" data-i="' + i + '">' +
          '<span class="pid">' + id + "</span>" +
          (free ? '<span class="pfree">FREE</span>' : "") +
          '<span class="pprov">' + prov + "</span>" +
          "</button>"
        );
      })
      .join("");
  }

  function openPalette() {
    overlay.classList.add("open");
    palInput.value = "";
    palList.innerHTML = '<div class="palette-loading">Loading models&hellip;</div>';
    fetchModels().then(function () { renderList(""); });
    setTimeout(function () { palInput.focus(); }, 30);
  }
  function closePalette() { overlay.classList.remove("open"); }
  function goModel(id) {
    closePalette();
    location.href = "/playground?model=" + encodeURIComponent(id);
  }

  document.querySelectorAll("[data-search]").forEach(function (b) {
    b.addEventListener("click", openPalette);
  });
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openPalette();
    }
    if (e.key === "Escape" && overlay.classList.contains("open")) closePalette();
  });
  overlay.addEventListener("click", function (e) { if (e.target === overlay) closePalette(); });
  palInput.addEventListener("input", function () { renderList(palInput.value); });
  palInput.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!current.length) return;
      selIdx = (selIdx + (e.key === "ArrowDown" ? 1 : -1) + current.length) % current.length;
      palList.querySelectorAll(".palette-item").forEach(function (el, i) {
        el.classList.toggle("sel", i === selIdx);
      });
      var act = palList.querySelector(".palette-item.sel");
      if (act) act.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (current[selIdx]) goModel(current[selIdx]);
    }
  });
  palList.addEventListener("click", function (e) {
    var it = e.target.closest(".palette-item");
    if (it) goModel(current[+it.dataset.i]);
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

  /* scroll-reveal */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    }
  }

  /* ── model picker (console) ── */
  var pickBtn = document.querySelector("[data-model-pick]");
  var pickPop = document.querySelector("[data-model-pop]");
  var pickName = document.querySelector("[data-model-name]");
  if (pickBtn && pickPop) {
    var FREE_IDS = ["auto:free","auto"];
    var pickModels = null;
    var chosen = "auto:free";

    function loadPick() {
      if (pickModels) return Promise.resolve(pickModels);
      return fetch("/api/v1/models").then(function(r){return r.json()}).then(function(d){
        var ids = (d.data||[]).map(function(m){return m.id});
        // free first, then popular paid
        var free = ids.filter(function(i){return i.slice(-5)===":free"}).slice(0,12);
        var paid = ids.filter(function(i){return i.slice(-5)!==":free" && FREE_IDS.indexOf(i)<0}).slice(0,25);
        pickModels = free.concat(paid);
        return pickModels;
      }).catch(function(){pickModels=["auto:free"];return pickModels});
    }

    function renderPick(q) {
      q = (q||"").toLowerCase();
      var ids = (pickModels||[]).filter(function(i){return !q || i.toLowerCase().indexOf(q)!==-1});
      var html = ids.slice(0,40).map(function(id){
        var free = id.slice(-5)===":free" || id==="auto:free";
        return '<button type="button" role="option" data-id="'+id+'" class="'+(id===chosen?"sel":"")+'">'+
          '<span class="mp-id">'+id+'</span>'+
          (free?'<span class="tag-free">FREE</span>':'<span class="tag-lock">SIGN UP</span>')+
        '</button>';
      }).join("");
      html += '<div class="mp-note">Free models run with no signup. Paid models need a free account \u2014 <a href="/signup">create one</a> for $10 credit.</div>';
      pickPop.innerHTML = html;
    }

    pickBtn.addEventListener("click", function(e){
      e.stopPropagation();
      var open = !pickPop.classList.contains("open");
      pickPop.classList.toggle("open", open);
      pickBtn.setAttribute("aria-expanded", open?"true":"false");
      if (open) {
        pickPop.innerHTML = '<div style="padding:.75rem;font-family:var(--font-tech);font-size:.6875rem;color:hsl(var(--foreground-faint))">Loading models\u2026</div>';
        loadPick().then(function(){renderPick("")});
      }
    });
    pickPop.addEventListener("click", function(e){
      var b = e.target.closest("button[data-id]");
      if (!b) return;
      chosen = b.getAttribute("data-id");
      if (pickName) pickName.textContent = chosen;
      pickPop.classList.remove("open");
      pickBtn.setAttribute("aria-expanded","false");
    });
    document.addEventListener("click", function(e){
      if (!pickPop.classList.contains("open")) return;
      if (pickPop.contains(e.target) || pickBtn.contains(e.target)) return;
      pickPop.classList.remove("open");
      pickBtn.setAttribute("aria-expanded","false");
    });

    // run → pass model
    var runBtn2 = document.querySelector("[data-run]");
    if (runBtn2) {
      runBtn2.addEventListener("click", function(){
        // intercept: append model to query — re-bind by wrapping original navigation
      }, true);
    }
  }

  /* ── cookie consent ── */
  var cbar = document.getElementById("cookieBar");
  if (cbar) {
    var key = "gl_cookie_consent";
    var val = null;
    try { val = localStorage.getItem(key); } catch(e) {}
    if (!val) {
      setTimeout(function(){ cbar.classList.add("show"); }, 900);
    }
    cbar.addEventListener("click", function(e){
      var b = e.target.closest("[data-cookie]");
      if (!b) return;
      try { localStorage.setItem(key, b.getAttribute("data-cookie")); } catch(e) {}
      cbar.classList.remove("show");
    });
  }
})();
