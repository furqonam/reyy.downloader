/* ═══════════════════════════════════════════════
   TT/IG DOWNLOADER NO WM — Frontend Logic
   by.reyystecu
   ═══════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════
   SMOOTH SCROLL — LENIS
   ═══════════════════════════════════════════════ */
(function initSmoothScroll(){
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (typeof Lenis === "undefined") {
    console.warn("[Lenis] Not loaded, fallback to native scroll.");
    return;
  }

  const lenis = new Lenis({
    duration: 0.8,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.5,
    infinite: false
  });

  function raf(time){
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  window.__lenis = lenis;
})();

let currentPlatform = "tiktok";
let currentData = null;

// ═══════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════
function showToast(msg, type = "info") {
  const c = document.getElementById("toastContainer");
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type] || "ℹ️"}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => {
    t.style.transition = "opacity .25s linear";
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 260);
  }, 2800);
}

// ═══════════════════════════════════════════════
// DETEKSI PLATFORM
// ═══════════════════════════════════════════════
function detectPlatform(url) {
  if (/tiktok\.com|douyin\.com/i.test(url)) return "tiktok";
  if (/instagram\.com/i.test(url)) return "instagram";
  return null;
}

const urlInput = document.getElementById("urlInput");
const downloadBtn = document.getElementById("downloadBtn");
const errorBox = document.getElementById("errorBox");
const errorText = document.getElementById("errorText");
const loadingBox = document.getElementById("loadingBox");
const resultSection = document.getElementById("resultSection");

urlInput.addEventListener("input", (e) => {
  const url = e.target.value.trim();
  const detected = detectPlatform(url);
  if (detected && detected !== currentPlatform) {
    switchPlatform(detected);
  }
});

// ═══════════════════════════════════════════════
// PLATFORM TABS
// ═══════════════════════════════════════════════
function switchPlatform(platform) {
  currentPlatform = platform;
  document.querySelectorAll(".platform-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.platform === platform);
  });
}

document.querySelectorAll(".platform-tab").forEach(tab => {
  tab.addEventListener("click", () => switchPlatform(tab.dataset.platform));
});

// ═══════════════════════════════════════════════
// PASTE BUTTON
// ═══════════════════════════════════════════════
const pasteBtn = document.getElementById("pasteBtn");
if (pasteBtn) {
  pasteBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      urlInput.value = text;
      urlInput.dispatchEvent(new Event("input"));
      showToast("Link di-paste!", "success");
    } catch (e) {
      showToast("Gagal paste. Coba manual.", "error");
    }
  });
}

// ═══════════════════════════════════════════════
// ERROR / LOADING HELPERS
// ═══════════════════════════════════════════════
function showError(msg) {
  errorText.textContent = msg;
  errorBox.classList.add("show");
  loadingBox.classList.remove("show");
  resultSection.classList.remove("show");
  downloadBtn.classList.remove("loading");
  downloadBtn.disabled = false;
}
function hideError() {
  errorBox.classList.remove("show");
}

// ═══════════════════════════════════════════════
// DOWNLOAD HANDLER
// ═══════════════════════════════════════════════
downloadBtn.addEventListener("click", async () => {
  const url = urlInput.value.trim();
  hideError();
  resultSection.classList.remove("show");

  if (!url) {
    showError("Masukkan link dulu ya!");
    return;
  }

  const platform = detectPlatform(url);
  if (!platform) {
    showError("Link harus dari TikTok atau Instagram!");
    return;
  }

  downloadBtn.classList.add("loading");
  downloadBtn.disabled = true;
  loadingBox.classList.add("show");

  try {
    const apiUrl = `/api/${platform}?url=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    loadingBox.classList.remove("show");
    downloadBtn.classList.remove("loading");
    downloadBtn.disabled = false;

    if (!res.ok || !data.success) {
      showError(data.error || "Gagal download. Coba lagi.");
      return;
    }

    currentData = data;
    renderResult(data);
    showToast("Media berhasil diambil!", "success");

  } catch (err) {
    console.error(err);
    showError("Server error. Coba lagi sebentar.");
  }
});

// ═══════════════════════════════════════════════
// RENDER RESULT
// ═══════════════════════════════════════════════
function renderResult(data) {
  const d = data.data;
  const thumb = document.getElementById("resultThumb");
  const title = document.getElementById("resultTitle");
  const author = document.getElementById("resultAuthor");
  const hdBtn = document.getElementById("downloadHdBtn");
  const sdBtn = document.getElementById("downloadSdBtn");
  const gallery = document.getElementById("resultGallery");

  gallery.innerHTML = "";
  hdBtn.style.display = "none";
  sdBtn.style.display = "none";

  // ── TikTok ──
  if (data.platform === "tiktok") {
    thumb.src = d.thumbnail || "";
    title.textContent = d.title || "TikTok Video";
    author.textContent = `@${d.author || "user"}`;

    if (d.images && d.images.length) {
      d.images.forEach(img => {
        const el = document.createElement("img");
        el.src = img;
        el.alt = "Image";
        el.loading = "lazy";
        el.onclick = () => window.open(img, "_blank");
        gallery.appendChild(el);
      });
    } else {
      if (d.video_hd) {
        hdBtn.href = `/api/download?url=${encodeURIComponent(d.video_hd)}&filename=tiktok_hd.mp4`;
        hdBtn.style.display = "flex";
      }
      if (d.video_sd || d.video) {
        sdBtn.href = `/api/download?url=${encodeURIComponent(d.video_sd || d.video)}&filename=tiktok_sd.mp4`;
        sdBtn.style.display = "flex";
      }
    }
  }

  // ── Instagram ──
  if (data.platform === "instagram") {
    if (data.type === "video") {
      thumb.src = d.thumbnail || "";
      title.textContent = d.title || "Instagram Video";
      author.textContent = "@instagram";
      hdBtn.href = `/api/download?url=${encodeURIComponent(d.video)}&filename=ig_video.mp4`;
      hdBtn.style.display = "flex";
    } else if (data.type === "image" && d.images) {
      thumb.src = d.images[0];
      title.textContent = d.title || "Instagram Photo";
      author.textContent = "@instagram";
      d.images.forEach(img => {
        const el = document.createElement("img");
        el.src = img;
        el.alt = "Image";
        el.loading = "lazy";
        el.onclick = () => window.open(img, "_blank");
        gallery.appendChild(el);
      });
    }
  }

  resultSection.classList.add("show");

  if (window.__lenis) {
    window.__lenis.scrollTo(resultSection, { offset: -80, duration: 0.8 });
  } else {
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ═══════════════════════════════════════════════
// RESET
// ═══════════════════════════════════════════════
document.getElementById("resetBtn").addEventListener("click", () => {
  urlInput.value = "";
  resultSection.classList.remove("show");
  hideError();
  currentData = null;
  urlInput.focus();
  if (window.__lenis) {
    window.__lenis.scrollTo(0, { duration: 0.6 });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

// ═══════════════════════════════════════════════
// ENTER KEY SUBMIT
// ═══════════════════════════════════════════════
urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    downloadBtn.click();
  }
});