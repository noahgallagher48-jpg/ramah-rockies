(function () {
  "use strict";

  var T1 = (window.TIER1 || []).map(function (n) { return { id: n, tier: 1 }; });
  var T2 = (window.TIER2 || []).map(function (n) { return { id: n, tier: 2 }; });
  var T3 = (window.TIER3 || []).map(function (n) { return { id: n, tier: 3 }; });
  var ALL = T1.concat(T2, T3);
  var byId = {};
  ALL.forEach(function (o) { byId[o.id] = o; });

  function full(id) { return "img/full/" + id; }
  function thumb(id) { return "img/thumb/" + id; }

  // ---------- Favorites state ----------
  var FAV_KEY = "ramah_favorites_v1";
  var favs = new Set();
  try { (JSON.parse(localStorage.getItem(FAV_KEY)) || []).forEach(function (x) { favs.add(x); }); } catch (e) {}
  function saveFavs() { try { localStorage.setItem(FAV_KEY, JSON.stringify([].concat.apply([], [Array.from(favs)]))); } catch (e) {} }

  function isFav(id) { return favs.has(id); }
  function toggleFav(id) { setFav(id, !favs.has(id)); }
  function setFav(id, on) {
    if (on) favs.add(id); else favs.delete(id);
    saveFavs();
    // sync every heart for this id
    document.querySelectorAll('[data-fav-id="' + cssEsc(id) + '"]').forEach(function (el) {
      el.classList.toggle("faved", on);
    });
    updateFavCount();
    if (currentSlideId() === id) syncSlideHeart();
    if (lbList && lbList[lbIndex] && lbList[lbIndex].id === id) syncLbHeart();
    renderFavTray();
  }
  function cssEsc(s) { return (window.CSS && CSS.escape) ? CSS.escape(s) : s.replace(/["\\]/g, "\\$&"); }

  var favCountEls = [document.getElementById("favCount")];
  var navFav = document.getElementById("favBtn");
  function updateFavCount() {
    var n = favs.size;
    favCountEls.forEach(function (el) { if (el) el.textContent = n; });
    if (navFav) navFav.classList.toggle("has", n > 0);
    var tc = document.getElementById("favTrayCount");
    if (tc) tc.textContent = "(" + n + ")";
  }

  // ---------- Gallery cells ----------
  function makeCell(o) {
    var fig = document.createElement("figure");
    fig.className = "cell";
    var img = document.createElement("img");
    img.src = thumb(o.id);
    img.alt = "Ramah in the Rockies";
    img.loading = "lazy";
    var heart = document.createElement("button");
    heart.className = "heart" + (isFav(o.id) ? " faved" : "");
    heart.setAttribute("data-fav-id", o.id);
    heart.setAttribute("aria-label", "Favorite");
    heart.innerHTML = "<span>&#9825;</span>";
    heart.addEventListener("click", function (e) { e.stopPropagation(); toggleFav(o.id); });
    fig.appendChild(img);
    fig.appendChild(heart);
    return fig;
  }

  function buildGrid(elId, list) {
    var el = document.getElementById(elId);
    list.forEach(function (o, i) {
      var cell = makeCell(o);
      cell.addEventListener("click", function () { openLightbox(list, i); });
      el.appendChild(cell);
    });
    return el;
  }

  buildGrid("grid-tier1", T1);
  buildGrid("grid-tier2", T2);
  buildGrid("grid-tier3", T3);
  buildGrid("grid-all", ALL);

  // ---------- Reveal on scroll ----------
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
    document.querySelectorAll(".cell").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".cell").forEach(function (el) { el.classList.add("in"); });
  }

  // ---------- Slideshow ----------
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  var order = shuffle(ALL);
  var sIdx = 0;
  var ssA = document.getElementById("ssA"), ssB = document.getElementById("ssB");
  var frontIsA = true;
  var ssCounter = document.getElementById("ssCounter");
  var ssHeart = document.getElementById("ssHeart");
  var playing = true, timer = null;
  var INTERVAL = 5000;

  function currentSlideId() { return order.length ? order[sIdx].id : null; }
  function syncSlideHeart() { if (ssHeart) ssHeart.classList.toggle("faved", isFav(currentSlideId())); }

  function showSlide(i, instant) {
    sIdx = (i + order.length) % order.length;
    var id = order[sIdx].id;
    var front = frontIsA ? ssA : ssB;
    var back = frontIsA ? ssB : ssA;
    back.onload = function () {
      back.classList.add("show");
      front.classList.remove("show");
      frontIsA = !frontIsA;
    };
    if (instant) { back.classList.remove("show"); }
    back.src = full(id);
    if (back.complete && back.naturalWidth) back.onload();
    ssCounter.textContent = (sIdx + 1) + " / " + order.length;
    syncSlideHeart();
    preload(full(order[(sIdx + 1) % order.length].id));
  }
  function preload(src) { var im = new Image(); im.src = src; }
  function nextSlide() { showSlide(sIdx + 1); }
  function prevSlide() { showSlide(sIdx - 1); }
  function startTimer() { stopTimer(); if (playing) timer = setInterval(nextSlide, INTERVAL); }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  document.getElementById("ssNext").addEventListener("click", function () { nextSlide(); startTimer(); });
  document.getElementById("ssPrev").addEventListener("click", function () { prevSlide(); startTimer(); });
  var playBtn = document.getElementById("ssPlay");
  playBtn.addEventListener("click", function () {
    playing = !playing;
    playBtn.innerHTML = playing ? "&#10073;&#10073;" : "&#9658;";
    if (playing) startTimer(); else stopTimer();
  });
  document.getElementById("ssFull").addEventListener("click", function () {
    var stage = document.getElementById("slideshow-stage");
    if (!document.fullscreenElement) { (stage.requestFullscreen || stage.webkitRequestFullscreen).call(stage); }
    else { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
  });
  ssHeart.addEventListener("click", function () { toggleFav(currentSlideId()); });
  document.getElementById("slideshow-stage").addEventListener("click", function (e) {
    if (e.target === ssA || e.target === ssB) openLightbox(order, sIdx);
  });

  showSlide(0, true);
  startTimer();

  // ---------- Lightbox ----------
  var lb = document.getElementById("lightbox");
  var lbImg = lb.querySelector(".lb-img");
  var lbCounter = lb.querySelector(".lb-counter");
  var lbHeart = document.getElementById("lbHeart");
  var lbList = null, lbIndex = 0;

  function syncLbHeart() { lbHeart.classList.toggle("faved", isFav(lbList[lbIndex].id)); }
  function lbShow(i) {
    lbIndex = (i + lbList.length) % lbList.length;
    var o = lbList[lbIndex];
    lbImg.src = full(o.id);
    lbCounter.textContent = (lbIndex + 1) + " / " + lbList.length;
    syncLbHeart();
    preload(full(lbList[(lbIndex + 1) % lbList.length].id));
    preload(full(lbList[(lbIndex - 1 + lbList.length) % lbList.length].id));
  }
  function openLightbox(list, i) {
    lbList = list; lbShow(i);
    lb.classList.add("open"); lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() { lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }
  lb.querySelector(".lb-close").addEventListener("click", closeLightbox);
  lb.querySelector(".lb-next").addEventListener("click", function (e) { e.stopPropagation(); lbShow(lbIndex + 1); });
  lb.querySelector(".lb-prev").addEventListener("click", function (e) { e.stopPropagation(); lbShow(lbIndex - 1); });
  lbHeart.addEventListener("click", function (e) { e.stopPropagation(); toggleFav(lbList[lbIndex].id); });
  lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb-stage")) closeLightbox(); });
  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowRight") lbShow(lbIndex + 1);
    else if (e.key === "ArrowLeft") lbShow(lbIndex - 1);
  });
  var tsx = 0, tsy = 0;
  lb.addEventListener("touchstart", function (e) { tsx = e.touches[0].clientX; tsy = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - tsx, dy = e.changedTouches[0].clientY - tsy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? lbShow(lbIndex + 1) : lbShow(lbIndex - 1); }
  }, { passive: true });

  // ---------- Favorites tray ----------
  var tray = document.getElementById("favTray");
  var favGrid = document.getElementById("favGrid");
  var favEmpty = document.getElementById("favEmpty");
  var favForm = document.getElementById("favForm");
  var statusEl = document.getElementById("favStatus");

  function renderFavTray() {
    if (!favGrid) return;
    favGrid.innerHTML = "";
    var ids = Array.from(favs);
    favEmpty.style.display = ids.length ? "none" : "block";
    favForm.style.display = ids.length ? "flex" : "none";
    ids.forEach(function (id) {
      var d = document.createElement("div");
      d.className = "fav-thumb";
      var img = document.createElement("img"); img.src = thumb(id); img.alt = "";
      var rm = document.createElement("button"); rm.innerHTML = "&times;"; rm.setAttribute("aria-label", "Remove");
      rm.addEventListener("click", function () { setFav(id, false); });
      d.appendChild(img); d.appendChild(rm); favGrid.appendChild(d);
    });
  }
  function openTray() { renderFavTray(); tray.classList.add("open"); tray.setAttribute("aria-hidden", "false"); }
  function closeTray() { tray.classList.remove("open"); tray.setAttribute("aria-hidden", "true"); }
  navFav.addEventListener("click", openTray);
  document.getElementById("favClose").addEventListener("click", closeTray);
  tray.addEventListener("click", function (e) { if (e.target === tray) closeTray(); });

  var sendBtn = document.getElementById("favSend");
  sendBtn.addEventListener("click", function () {
    var name = document.getElementById("favName").value.trim();
    var email = document.getElementById("favEmailInput").value.trim();
    if (!name) { setStatus("Please add your name.", "err"); return; }
    if (favs.size === 0) { setStatus("No favorites selected.", "err"); return; }
    var payload = { name: name, email: email, favorites: Array.from(favs), ts: new Date().toISOString() };
    if (!window.FAV_ENDPOINT) { setStatus("Saved locally. (Sending is not configured yet.)", "ok"); return; }
    sendBtn.disabled = true; setStatus("Sending...", "");
    fetch(window.FAV_ENDPOINT, {
      method: "POST",
      // text/plain keeps it a "simple request" (no CORS preflight) for Apps Script
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).then(function () {
      setStatus("Thank you, " + name + ". Your favorites were sent.", "ok");
    }).catch(function () {
      setStatus("Sent. (If you do not hear back, email Noah directly.)", "ok");
    }).finally(function () { sendBtn.disabled = false; });
  });
  function setStatus(msg, cls) { statusEl.textContent = msg; statusEl.className = "fav-status" + (cls ? " " + cls : ""); }

  // init
  updateFavCount();
  renderFavTray();
})();
