// ============================================
//  api/download.js — Proxy Downloader
//  TT/IG DOWNLOADER NO WM — by.reyystecu
// ============================================
const axios = require("axios");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { url, filename } = req.query;

  if (!url) {
    return res.status(400).send("URL diperlukan");
  }

  try {
    const response = await axios.get(decodeURIComponent(url), {
      responseType: "stream",
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.tiktok.com/"
      },
      validateStatus: (s) => s < 500
    });

    if (response.status >= 400) {
      return res.status(500).send("Gagal download: " + response.status);
    }

    const contentType = response.headers["content-type"] || "video/mp4";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename || "video.mp4"}"`
    );

    if (response.headers["content-length"]) {
      res.setHeader("Content-Length", response.headers["content-length"]);
    }

    response.data.on("error", (err) => {
      console.error("[Download] Stream error:", err.message);
      if (!res.headersSent) res.status(500).end();
      else res.end();
    });

    response.data.pipe(res);

  } catch (err) {
    console.error("[Download]", err.message);
    res.status(500).send("Gagal download file: " + err.message);
  }
};