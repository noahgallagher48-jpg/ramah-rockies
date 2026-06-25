(function () {
  "use strict";

  var TIER1 = window.TIER1 || [];
  var TIER2 = window.TIER2 || [];

  // Combined list drives lightbox navigation (Tier 1 first, then Tier 2).
  var ALL = TIER1.concat(TIER2);

  var featured = document.getElementById("featured");
  var grid = document.getElementById("grid");

  function fullSrc(name) { return "img/full/" + name; }
  function thumbSrc(name) { return "img/thumb/" + name; }

  // ---- Build Tier 1 (featured) ----
  TIER1.forEach(function (name, i) {
    var fig = document.createElement("figure");
    fig.className = "frame";
    var img = document.createElement("img");
    img.src = fullSrc(name);
    img.alt = "Ramah in the Rockies";
    img.loading = i < 2 ? "eager" : "lazy";
    fig.appendChild(img);
    fig.addEventListener("click", function () { openLightbox(i); });
    featured.appendChild(fig);
  });

  // ---- Build Tier 2 (grid) ----
  TIER2.forEach(function (name, j) {
    var idx = TIER1.length + j;
    var cell = document.createElement("div");
    cell.className = "cell";
    var img = document.createElement("img");
    img.src = thumbSrc(name);
    img.alt = "Ramah in the Rockies";
    img.loading = "lazy";
    cell.appendChild(img);
    cell.addEventListener("click", function () { openLightbox(idx); });
    grid.appendChild(cell);
  });

  // ---- Fade-in on scroll ----
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    document.querySelectorAll(".frame, .cell").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".frame, .cell").forEach(function (el) { el.classList.add("in"); });
  }

  // ---- Lightbox ----
  var lb = document.getElementById("lightbox");
  var lbImg = lb.querySelector(".lb-img");
  var lbCounter = lb.querySelector(".lb-counter");
  var current = 0;

  function preload(i) {
    if (i < 0 || i >= ALL.length) return;
    var im = new Image();
    im.src = fullSrc(ALL[i]);
  }

  function show(i) {
    current = (i + ALL.length) % ALL.length;
    lbImg.src = fullSrc(ALL[current]);
    lbCounter.textContent = (current + 1) + " / " + ALL.length;
    preload(current + 1);
    preload(current - 1);
  }

  function openLightbox(i) {
    show(i);
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  function next() { show(current + 1); }
  function prev() { show(current - 1); }

  lb.querySelector(".lb-close").addEventListener("click", closeLightbox);
  lb.querySelector(".lb-next").addEventListener("click", function (e) { e.stopPropagation(); next(); });
  lb.querySelector(".lb-prev").addEventListener("click", function (e) { e.stopPropagation(); prev(); });
  lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb-stage")) closeLightbox(); });

  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
  });

  // Touch swipe
  var sx = 0, sy = 0;
  lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - sx;
    var dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); }
  }, { passive: true });
})();
