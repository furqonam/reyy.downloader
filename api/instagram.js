// ============================================
//  api/instagram.js — Instagram Downloader
//  TT/IG DOWNLOADER NO WM — by.reyystecu
// ============================================
const axios = require("axios");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ success: false, error: "URL tidak boleh kosong" });
  }

  const igRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|tv|stories)\/.+/i;
  if (!igRegex.test(url)) {
    return res.status(400).json({ success: false, error: "URL bukan dari Instagram" });
  }

  try {
    const cleanUrl = url.split("?")[0].replace(/\/$/, "");

    // ── Method 1: Snapinsta POST ──
    try {
      const formData = new URLSearchParams();
      formData.append("url", cleanUrl);
      formData.append("action", "post");

      const res1 = await axios.post(
        "https://snapinsta.app/action.php",
        formData.toString(),
        {
          timeout: 12000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": "https://snapinsta.app/",
            "Origin": "https://snapinsta.app"
          }
        }
      );

      const html = typeof res1.data === "string" ? res1.data : JSON.stringify(res1.data);

      const videoMatch = html.match(/(https?:\/\/[^"'\s\\]+(?:cdninstagram|fbcdn)[^"'\s\\]*\.mp4[^"'\s\\]*)/i);
      const imageMatches = html.match(/(https?:\/\/[^"'\s\\]+(?:cdninstagram|fbcdn)[^"'\s\\]*\.jpg[^"'\s\\]*)/gi);

      if (videoMatch) {
        return res.status(200).json({
          success: true,
          platform: "instagram",
          type: "video",
          data: {
            video: videoMatch[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/"),
            thumbnail: imageMatches
              ? imageMatches[0].replace(/\\u0026/g, "&").replace(/\\\//g, "/")
              : null
          }
        });
      }

      if (imageMatches && imageMatches.length > 0) {
        const images = [...new Set(
          imageMatches.map(i => i.replace(/\\u0026/g, "&").replace(/\\\//g, "/"))
        )];
        return res.status(200).json({
          success: true,
          platform: "instagram",
          type: "image",
          data: { images: images.slice(0, 10) }
        });
      }
    } catch (e) {
      console.warn("[IG] Method 1 failed:", e.message);
    }

    // ── Method 2: Snapinsta alternatif ──
    try {
      const res2 = await axios.get("https://snapinsta.app/action2.php", {
        params: { url: cleanUrl },
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://snapinsta.app/"
        }
      });

      const html2 = typeof res2.data === "string" ? res2.data : JSON.stringify(res2.data);
      const vidMatch2 = html2.match(/(https?:\/\/[^"'\s\\]+\.mp4[^"'\s\\]*)/i);

      if (vidMatch2) {
        return res.status(200).json({
          success: true,
          platform: "instagram",
          type: "video",
          data: {
            video: vidMatch2[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/")
          }
        });
      }
    } catch (e) {
      console.warn("[IG] Method 2 failed:", e.message);
    }

    return res.status(500).json({
      success: false,
      error: "Gagal ekstrak media. Pastikan post publik, bukan private."
    });

  } catch (err) {
    console.error("[IG]", err.message);
    return res.status(500).json({
      success: false,
      error: "Server sedang sibuk. Coba lagi.",
      detail: err.message
    });
  }
};