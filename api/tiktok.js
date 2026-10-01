// ============================================
//  api/tiktok.js — TikTok Downloader
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

  const tiktokRegex = /^(https?:\/\/)?(www\.|m\.|vm\.|vt\.)?(tiktok\.com|douyin\.com)\/.+/i;
  if (!tiktokRegex.test(url)) {
    return res.status(400).json({ success: false, error: "URL bukan dari TikTok" });
  }

  try {
    const tikwmRes = await axios.get("https://www.tikwm.com/api/", {
      params: { url, hd: 1 },
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    if (tikwmRes.data && tikwmRes.data.code === 0 && tikwmRes.data.data) {
      const d = tikwmRes.data.data;
      const images = d.images || null;

      return res.status(200).json({
        success: true,
        platform: "tiktok",
        type: images ? "image" : "video",
        data: {
          title: d.title || "TikTok Video",
          author: d.author?.nickname || d.author?.unique_id || "Unknown",
          thumbnail: d.cover,
          duration: d.duration,
          video: d.play,
          video_hd: d.hdplay || d.play,
          video_sd: d.play,
          music: d.music,
          images: images
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: "Gagal ekstrak video. Pastikan link valid & video publik."
    });

  } catch (err) {
    console.error("[TikTok]", err.message);
    return res.status(500).json({
      success: false,
      error: "Server sedang sibuk. Coba lagi sebentar.",
      detail: err.message
    });
  }
};