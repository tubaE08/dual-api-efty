const express = require("express");
const axios = require("axios");

const app = express();

async function callUpstream(name, url) {
  const start = Date.now();
  try {
    const res = await axios.get(url, {
      timeout: 25000,
      validateStatus: () => true,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
      },
    });

    const isSuccess = res.status >= 200 && res.status < 300;

    return {
      api: name,
      developer: "Efty",
      status: isSuccess ? "success" : "failed",
      http_code: res.status,
      time_taken_seconds: Number(((Date.now() - start) / 1000).toFixed(3)),
      data: res.data,
    };
  } catch (err) {
    return {
      api: name,
      developer: "Efty",
      status: "failed",
      http_code: 0,
      time_taken_seconds: Number(((Date.now() - start) / 1000).toFixed(3)),
      error: err.message || "Request failed",
    };
  }
}

app.get(["/", "/send", "/api"], async (req, res) => {
  const rawPhone = req.query.phone || req.query.num || req.query.number || "";
  const phone = String(rawPhone).trim();

  if (!phone) {
    return res.status(400).json({
      status: "failed",
      developer: "Efty",
      message: "Please provide a phone number. Example: /send?phone=01700000000 or /api?num=01700000000",
    });
  }

  const encodedPhone = encodeURIComponent(phone);
  const overallStart = Date.now();

  const targets = [
    {
      name: "Bomb_Olive_API",
      url: `https://bomb-olive.vercel.app/send?phone=${encodedPhone}`,
    },
    {
      name: "Apicall_Coral_API",
      url: `https://apicall-coral.vercel.app/api?num=${encodedPhone}`,
    },
  ];

  const [api1Result, api2Result] = await Promise.all(
    targets.map((target) => callUpstream(target.name, target.url))
  );

  const anySuccess =
    api1Result.status === "success" || api2Result.status === "success";

  return res.status(200).json({
    status: anySuccess ? "success" : "failed",
    developer: "Efty",
    target_number: phone,
    total_apis_called: targets.length,
    total_time_seconds: Number(((Date.now() - overallStart) / 1000).toFixed(3)),
    results: [api1Result, api2Result],
  });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = app;
