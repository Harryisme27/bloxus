import { chromium } from "playwright";
import { copyFileSync } from "node:fs";

const scene = "file:///D:/Market/Market/uniemarket/assets-src/logo-scene.html";
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 960, height: 600 },
  recordVideo: { dir: "video-out", size: { width: 960, height: 600 } },
});
const page = await ctx.newPage();
await page.goto(scene);
await page.waitForTimeout(12400);
const video = page.video();
await page.close(); // chốt độ dài video tại đây (~12.4s)
const videoPath = await video.path();

// Poster chụp ở context khác (không dính vào video).
const p2 = await browser.newPage({ viewport: { width: 960, height: 600 } });
await p2.goto(scene);
await p2.waitForTimeout(2600);
await p2.screenshot({ path: "D:/Market/Market/uniemarket/public/logo-poster.png" });
await ctx.close();
await browser.close();
copyFileSync(videoPath, "D:/Market/Market/uniemarket/public/logo.webm");
console.log("saved");
