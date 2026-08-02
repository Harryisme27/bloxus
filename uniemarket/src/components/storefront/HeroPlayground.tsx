// Lớp canvas giải trí phủ nền hero (kiểu model 3D kéo được của
// yummytrackstat.com): coin lát chanh, Robux và item các game đang bán (pet
// Adopt Me, mèo Pet Sim 99, gói hạt Grow a Garden 2, dao MM2) trôi lơ lửng —
// tóm - kéo - ném văng được; va mép thì nảy, thả tay thì tóe sparkles rồi trôi
// về nhịp bồng bềnh cũ. Nội dung hero nằm lớp trên nên không bị chặn click.
import { useEffect, useRef } from "react";

/** lemon: coin lát chanh thương hiệu · robux: đồng Robux hexagon · dog: pet
 * chó vàng Adopt Me · cat: mèo blocky Pet Sim 99 · seed/tree/bee: star seed,
 * cây tím và ong voxel Grow a Garden 2 · knife: dao cartoon MM2 · brainrot: ly cà phê có mặt
 * kiểu Steal a Brainrot · fruit: trái Blox Fruit. */
type CoinKind = "lemon" | "robux" | "dog" | "cat" | "seed" | "tree" | "bee" | "knife" | "brainrot" | "fruit";

type Coin = {
  kind: CoinKind;
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  baseY: number;
  phase: number;
};

type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };

const COIN_COUNT = 10;

/** Đồng Robux: hexagon vàng + viền sáng + ô vuông xoay 45° ở tâm. */
function drawRobux(ctx: CanvasRenderingContext2D, c: Coin) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.rot);
  const hex = (r: number) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };
  hex(c.r);
  ctx.fillStyle = "#f5b01e";
  ctx.fill();
  hex(c.r * 0.8);
  ctx.fillStyle = "#ffd95e";
  ctx.fill();
  hex(c.r * 0.8);
  ctx.strokeStyle = "#fff6d8";
  ctx.lineWidth = Math.max(1.2, c.r * 0.07);
  ctx.stroke();
  // Ô vuông xoay 45° (kiểu logo Robux) ở tâm.
  ctx.rotate(Math.PI / 4);
  const s = c.r * 0.42;
  ctx.fillStyle = "#fff6d8";
  ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.strokeStyle = "#f5b01e";
  ctx.lineWidth = Math.max(1, c.r * 0.06);
  ctx.strokeRect(-s / 2, -s / 2, s, s);
  ctx.restore();
}

/** Corgi kiểu Adopt Me: tai nhọn dựng, đầu nâu vàng với mảng mặt kem, mắt
 * đen tròn to, mũi đen + lưỡi hồng thè ra. */
function drawDog(ctx: CanvasRenderingContext2D, c: Coin) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.rot);
  const r = c.r;
  // Tai nhọn dựng hai bên (vẽ trước, nằm dưới đầu).
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.25, -r * 0.55);
    ctx.lineTo(side * r * 0.85, -r * 1.25);
    ctx.lineTo(side * r * 0.95, -r * 0.35);
    ctx.closePath();
    ctx.fillStyle = "#e0a860";
    ctx.fill();
    // Lõi tai kem.
    ctx.beginPath();
    ctx.moveTo(side * r * 0.45, -r * 0.55);
    ctx.lineTo(side * r * 0.78, -r * 1.05);
    ctx.lineTo(side * r * 0.85, -r * 0.45);
    ctx.closePath();
    ctx.fillStyle = "#f7ead2";
    ctx.fill();
  }
  // Đầu tròn nâu vàng.
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = "#e0a860";
  ctx.fill();
  // Mảng mặt kem: sọc trán + nửa mặt dưới (đặc trưng corgi).
  ctx.beginPath();
  ctx.ellipse(0, r * 0.45, r * 0.7, r * 0.58, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#f7ead2";
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-r * 0.14, -r * 0.95, r * 0.28, r * 0.8, r * 0.12);
  ctx.fillStyle = "#f7ead2";
  ctx.fill();
  // Mắt đen tròn to + chấm sáng (đặc trưng Adopt Me).
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * r * 0.42, -r * 0.12, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = "#17130f";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(side * r * 0.42 - r * 0.06, -r * 0.19, r * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }
  // Mũi đen.
  ctx.beginPath();
  ctx.ellipse(0, r * 0.28, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#17130f";
  ctx.fill();
  // Lưỡi hồng thè ra dưới cằm.
  ctx.beginPath();
  ctx.roundRect(-r * 0.14, r * 0.52, r * 0.28, r * 0.5, r * 0.12);
  ctx.fillStyle = "#f2879b";
  ctx.fill();
  ctx.restore();
}

/** Ong voxel kiểu Grow a Garden 2: thân hộp vàng sọc đen nằm ngang, cánh
 * trắng trên lưng, mắt đen vuông. */
function drawBee(ctx: CanvasRenderingContext2D, c: Coin) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.rot);
  const w2 = c.r * 2.1;
  const h2 = c.r * 1.5;
  // Cánh trắng mờ trên lưng (vẽ trước, nằm dưới thân).
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * w2 * 0.12, -h2 * 0.52, w2 * 0.18, h2 * 0.3, side * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Thân hộp vàng bo góc.
  ctx.beginPath();
  ctx.roundRect(-w2 / 2, -h2 / 2, w2, h2, c.r * 0.24);
  ctx.fillStyle = "#f2c928";
  ctx.fill();
  // Sọc đen dọc thân (clip trong thân).
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "#2b2118";
  ctx.fillRect(-w2 * 0.08, -h2 / 2, w2 * 0.16, h2);
  ctx.fillRect(w2 * 0.22, -h2 / 2, w2 * 0.15, h2);
  ctx.restore();
  ctx.strokeStyle = "#d9a63c";
  ctx.lineWidth = Math.max(1.2, c.r * 0.07);
  ctx.beginPath();
  ctx.roundRect(-w2 / 2, -h2 / 2, w2, h2, c.r * 0.24);
  ctx.stroke();
  // Mặt phía trước (bên trái): mắt vuông đen + má.
  ctx.fillStyle = "#2b2118";
  ctx.fillRect(-w2 * 0.38, -h2 * 0.18, w2 * 0.09, h2 * 0.26);
  ctx.fillRect(-w2 * 0.2, -h2 * 0.18, w2 * 0.09, h2 * 0.26);
  ctx.restore();
}

/** Pet mèo blocky kiểu Pet Sim 99: đầu hộp xám, tai nhọn, mắt trắng oval to,
 * miệng hồng cười mở. */
function drawBlockCat(ctx: CanvasRenderingContext2D, c: Coin) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.rot);
  const s = c.r * 1.9;
  // Tai nhọn nhô hai góc trên.
  ctx.fillStyle = "#8a919c";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * s * 0.42, -s * 0.4);
    ctx.lineTo(side * s * 0.52, -s * 0.72);
    ctx.lineTo(side * s * 0.18, -s * 0.48);
    ctx.closePath();
    ctx.fill();
  }
  // Đầu hộp bo góc nhẹ.
  ctx.beginPath();
  ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.14);
  ctx.fillStyle = "#9aa2ad";
  ctx.fill();
  ctx.strokeStyle = "#7c828c";
  ctx.lineWidth = Math.max(1.2, c.r * 0.07);
  ctx.stroke();
  // Ria mép hai bên mép trên đầu.
  ctx.strokeStyle = "#7c828c";
  ctx.lineWidth = Math.max(1, c.r * 0.05);
  for (const side of [-1, 1]) {
    for (const dy of [-0.36, -0.28]) {
      ctx.beginPath();
      ctx.moveTo(side * s * 0.34, s * dy);
      ctx.lineTo(side * s * 0.48, s * (dy - 0.04));
      ctx.stroke();
    }
  }
  // Mắt trắng to, con ngươi đen gần kín (đặc trưng PS99).
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * s * 0.22, s * 0.02, s * 0.15, s * 0.19, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(side * s * 0.22, s * 0.03, s * 0.1, s * 0.14, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#14171c";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(side * s * 0.19, -s * 0.02, s * 0.03, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }
  // Miệng ω nhỏ.
  ctx.strokeStyle = "#4d525a";
  ctx.lineWidth = Math.max(1, c.r * 0.06);
  ctx.beginPath();
  ctx.arc(-s * 0.05, s * 0.3, s * 0.05, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.arc(s * 0.05, s * 0.3, s * 0.05, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

/** Star seed kiểu Grow a Garden 2: ngôi sao vàng voxel 5 cánh trên đế mũi
 * tên vàng, mặt sao lấm chấm lưới sáng. */
function drawSeed(ctx: CanvasRenderingContext2D, c: Coin) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.rot);
  const R = c.r;
  // Đế: khối mũi tên vàng đậm chĩa xuống.
  ctx.beginPath();
  ctx.moveTo(-R * 0.42, R * 0.55);
  ctx.lineTo(R * 0.42, R * 0.55);
  ctx.lineTo(R * 0.26, R * 0.95);
  ctx.lineTo(0, R * 1.2);
  ctx.lineTo(-R * 0.26, R * 0.95);
  ctx.closePath();
  ctx.fillStyle = "#c8951a";
  ctx.fill();
  ctx.strokeStyle = "#a67a0e";
  ctx.lineWidth = Math.max(1, R * 0.06);
  ctx.stroke();
  // Ngôi sao 5 cánh.
  const star = (ro: number, ri: number) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 === 0 ? ro : ri;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };
  star(R * 1.15, R * 0.58);
  ctx.fillStyle = "#e8b423";
  ctx.fill();
  star(R * 1.15, R * 0.58);
  ctx.strokeStyle = "#b2860f";
  ctx.lineWidth = Math.max(1.4, R * 0.09);
  ctx.stroke();
  // Mặt sao sáng hơn bên trong.
  star(R * 0.85, R * 0.44);
  ctx.fillStyle = "#ffd95e";
  ctx.fill();
  // Lưới chấm voxel trên mặt sao.
  ctx.fillStyle = "rgba(232, 180, 35, 0.55)";
  const d = R * 0.09;
  for (const [gx, gy] of [
    [-0.28, -0.1],
    [0, -0.1],
    [0.28, -0.1],
    [-0.14, 0.14],
    [0.14, 0.14],
    [0, 0.38],
  ] as const) {
    ctx.fillRect(R * gx - d / 2, R * gy - d / 2, d, d);
  }
  // Chóp khối nhỏ trên đỉnh sao.
  ctx.fillStyle = "#ffd95e";
  ctx.fillRect(-R * 0.14, -R * 1.35, R * 0.28, R * 0.24);
  ctx.fillStyle = "#e8b423";
  ctx.fillRect(-R * 0.22, -R * 1.14, R * 0.44, R * 0.16);
  ctx.restore();
}

/** Dao cartoon kiểu MM2: lưỡi sáng gradient tím-hồng + chuôi tối. */
function drawKnife(ctx: CanvasRenderingContext2D, c: Coin) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.rot + Math.PI / 4);
  const L = c.r * 2.1;
  // Lưỡi.
  const grad = ctx.createLinearGradient(0, -L * 0.5, 0, L * 0.1);
  grad.addColorStop(0, "#c9b8ff");
  grad.addColorStop(1, "#8d6bf0");
  ctx.beginPath();
  ctx.moveTo(0, -L * 0.55);
  ctx.quadraticCurveTo(L * 0.22, -L * 0.25, L * 0.13, L * 0.05);
  ctx.lineTo(-L * 0.13, L * 0.05);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "#e6dcff";
  ctx.lineWidth = Math.max(1, c.r * 0.06);
  ctx.stroke();
  // Chắn tay.
  ctx.fillStyle = "#f5b01e";
  ctx.beginPath();
  ctx.roundRect(-L * 0.2, L * 0.05, L * 0.4, L * 0.09, L * 0.04);
  ctx.fill();
  // Chuôi.
  ctx.fillStyle = "#3a3148";
  ctx.beginPath();
  ctx.roundRect(-L * 0.08, L * 0.14, L * 0.16, L * 0.34, L * 0.06);
  ctx.fill();
  ctx.restore();
}

/** Cây tím xoắn kiểu Grow a Garden 2: thân sọc tím nghiêng nhẹ, rễ xòe ba
 * chân, hai chùm lá tua nhọn tím sáng bám lưng chừng thân. */
function drawTree(ctx: CanvasRenderingContext2D, c: Coin) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.rot);
  const R = c.r;
  ctx.lineCap = "round";
  // Rễ xòe ba chân dưới gốc.
  ctx.strokeStyle = "#3a1660";
  ctx.lineWidth = Math.max(2, R * 0.28);
  for (const [dx, dy] of [
    [-0.75, 0.4],
    [0, 0.55],
    [0.75, 0.4],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(0, R * 0.75);
    ctx.quadraticCurveTo(R * dx * 0.5, R * (0.75 + dy * 0.5), R * dx, R * (0.75 + dy));
    ctx.stroke();
  }
  // Thân xoắn nghiêng nhẹ sang phải trên cao.
  ctx.strokeStyle = "#45197a";
  ctx.lineWidth = Math.max(3, R * 0.42);
  ctx.beginPath();
  ctx.moveTo(0, R * 0.8);
  ctx.quadraticCurveTo(-R * 0.15, -R * 0.2, R * 0.25, -R * 1.05);
  ctx.stroke();
  // Sọc tối chạy dọc thân (cảm giác vặn xoắn).
  ctx.strokeStyle = "#2a0e4d";
  ctx.lineWidth = Math.max(1.2, R * 0.1);
  ctx.beginPath();
  ctx.moveTo(-R * 0.08, R * 0.75);
  ctx.quadraticCurveTo(-R * 0.22, -R * 0.15, R * 0.15, -R * 0.95);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(R * 0.1, R * 0.7);
  ctx.quadraticCurveTo(-R * 0.02, -R * 0.1, R * 0.34, -R * 0.9);
  ctx.stroke();
  // Hai chùm lá tua nhọn (quạt gai) bám thân.
  for (const [cx, cy, dir] of [
    [R * 0.05, -R * 0.35, -1],
    [R * 0.28, -R * 0.95, 1],
  ] as const) {
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 5; i++) {
      const a = dir * (0.25 + i * 0.32) - Math.PI / 2;
      const len = R * (0.55 + (i % 2) * 0.2);
      const grad = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
      grad.addColorStop(0, "#7a2fd0");
      grad.addColorStop(1, "#b45cf5");
      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(1.5, R * 0.13);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

/** Nhân vật brainrot: ly cà phê giấy sọc nâu-trắng, nắp kem, mắt tròn to. */
function drawBrainrot(ctx: CanvasRenderingContext2D, c: Coin) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.rot);
  const w2 = c.r * 1.4;
  const h2 = c.r * 1.9;
  // Thân ly hơi thuôn xuống dưới.
  ctx.beginPath();
  ctx.moveTo(-w2 / 2, -h2 * 0.32);
  ctx.lineTo(w2 / 2, -h2 * 0.32);
  ctx.lineTo(w2 * 0.36, h2 / 2);
  ctx.lineTo(-w2 * 0.36, h2 / 2);
  ctx.closePath();
  ctx.fillStyle = "#f3e8d8";
  ctx.fill();
  // Sọc ngang nâu.
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "#8a5a33";
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(-w2 / 2, -h2 * 0.28 + i * h2 * 0.28, w2, h2 * 0.13);
  }
  ctx.restore();
  // Nắp kem trắng gợn sóng + đế nắp.
  ctx.beginPath();
  ctx.roundRect(-w2 * 0.56, -h2 * 0.44, w2 * 1.12, h2 * 0.14, c.r * 0.1);
  ctx.fillStyle = "#fffdf7";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-w2 * 0.22, -h2 * 0.46, w2 * 0.18, Math.PI, 0);
  ctx.arc(w2 * 0.1, -h2 * 0.5, w2 * 0.22, Math.PI, 0);
  ctx.arc(w2 * 0.34, -h2 * 0.46, w2 * 0.14, Math.PI, 0);
  ctx.fillStyle = "#fffdf7";
  ctx.fill();
  // Mắt tròn to + chấm sáng.
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * w2 * 0.2, -h2 * 0.05, c.r * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(side * w2 * 0.2, -h2 * 0.03, c.r * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = "#17130f";
    ctx.fill();
  }
  // Miệng cười nhỏ.
  ctx.strokeStyle = "#17130f";
  ctx.lineWidth = Math.max(1, c.r * 0.07);
  ctx.beginPath();
  ctx.arc(0, h2 * 0.14, c.r * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

/** Trái Blox Fruit: khối hộp hồng bo góc, cuống xoắn xanh, mặt cười sáng. */
function drawFruit(ctx: CanvasRenderingContext2D, c: Coin) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.rot);
  const s = c.r * 1.8;
  // Cuống xoắn.
  ctx.strokeStyle = "#5cb84e";
  ctx.lineWidth = Math.max(1.6, c.r * 0.12);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.5);
  ctx.quadraticCurveTo(s * 0.12, -s * 0.78, s * 0.3, -s * 0.68);
  ctx.stroke();
  // Khối trái cây bo góc + facet sáng chéo.
  ctx.beginPath();
  ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.16);
  ctx.fillStyle = "#e05a9c";
  ctx.fill();
  ctx.strokeStyle = "#f28fc0";
  ctx.lineWidth = Math.max(1.4, c.r * 0.09);
  ctx.stroke();
  // Facet sáng góc trên trái.
  ctx.beginPath();
  ctx.moveTo(-s * 0.42, -s * 0.42);
  ctx.lineTo(s * 0.05, -s * 0.42);
  ctx.lineTo(-s * 0.42, s * 0.05);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
  ctx.fill();
  // Mắt sáng hồng nhạt + miệng cười.
  ctx.fillStyle = "#ffd7ea";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * s * 0.2, -s * 0.05, s * 0.09, s * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#ffd7ea";
  ctx.lineWidth = Math.max(1.2, c.r * 0.1);
  ctx.beginPath();
  ctx.arc(0, s * 0.16, s * 0.14, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawCoin(ctx: CanvasRenderingContext2D, c: Coin) {
  if (c.kind === "robux") return drawRobux(ctx, c);
  if (c.kind === "dog") return drawDog(ctx, c);
  if (c.kind === "bee") return drawBee(ctx, c);
  if (c.kind === "cat") return drawBlockCat(ctx, c);
  if (c.kind === "seed") return drawSeed(ctx, c);
  if (c.kind === "tree") return drawTree(ctx, c);
  if (c.kind === "knife") return drawKnife(ctx, c);
  if (c.kind === "brainrot") return drawBrainrot(ctx, c);
  if (c.kind === "fruit") return drawFruit(ctx, c);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.rot);
  // Vỏ vàng + vành trắng + múi chanh, vẽ tay cho khớp coin trong video logo.
  ctx.beginPath();
  ctx.arc(0, 0, c.r, 0, Math.PI * 2);
  ctx.fillStyle = "#f5b01e";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, c.r * 0.82, 0, Math.PI * 2);
  ctx.fillStyle = "#fff6d8";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, c.r * 0.72, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd95e";
  ctx.fill();
  ctx.strokeStyle = "#fff6d8";
  ctx.lineWidth = Math.max(1.5, c.r * 0.08);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * c.r * 0.68, Math.sin(a) * c.r * 0.68);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, c.r * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = "#fff6d8";
  ctx.fill();
  ctx.restore();
}

export function HeroPlayground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const coins: Coin[] = [];
    const sparks: Spark[] = [];
    let grabbed: Coin | null = null;
    let lastX = 0;
    let lastY = 0;
    let raf = 0;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    // Rải coin hai bên rìa (tránh cột nội dung giữa) cho đỡ rối mắt.
    // Trộn loại: coin thương hiệu + Robux + item các game đang bán (Adopt Me,
    // Grow a Garden 2, MM2, Steal a Brainrot, Blox Fruits).
    const KINDS: CoinKind[] = ["lemon", "dog", "robux", "bee", "seed", "knife", "brainrot", "fruit", "tree", "cat"];
    for (let i = 0; i < COIN_COUNT; i++) {
      const leftSide = i % 2 === 0;
      const x = leftSide ? Math.random() * w * 0.24 + w * 0.03 : w * 0.73 + Math.random() * w * 0.24;
      const y = Math.random() * h * 0.8 + h * 0.1;
      const kind = KINDS[i % KINDS.length];
      coins.push({
        kind,
        x,
        y,
        // Cây vẽ theo chiều dọc dài nên cho bán kính lớn hơn chút mới rõ dáng.
        r: kind === "tree" ? 24 + Math.random() * 10 : 14 + Math.random() * 14,
        vx: 0,
        vy: 0,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.01,
        baseY: y,
        phase: Math.random() * Math.PI * 2,
      });
    }

    function hit(x: number, y: number): Coin | null {
      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        if ((x - c.x) ** 2 + (y - c.y) ** 2 <= (c.r * 1.25) ** 2) return c;
      }
      return null;
    }

    function pos(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onDown(e: PointerEvent) {
      const { x, y } = pos(e);
      const c = hit(x, y);
      if (!c) return;
      grabbed = c;
      // Đưa coin đang tóm lên trên cùng.
      coins.splice(coins.indexOf(c), 1);
      coins.push(c);
      lastX = x;
      lastY = y;
      canvas!.setPointerCapture(e.pointerId);
      canvas!.style.cursor = "grabbing";
      e.preventDefault();
    }

    function onMove(e: PointerEvent) {
      const { x, y } = pos(e);
      if (grabbed) {
        grabbed.vx = x - lastX;
        grabbed.vy = y - lastY;
        grabbed.x = x;
        grabbed.y = y;
        lastX = x;
        lastY = y;
      } else {
        canvas!.style.cursor = hit(x, y) ? "grab" : "default";
      }
    }

    function onUp() {
      if (!grabbed) return;
      // Ném ra: tóe sparkles theo hướng văng.
      for (let i = 0; i < 10; i++) {
        sparks.push({
          x: grabbed.x,
          y: grabbed.y,
          vx: grabbed.vx * 0.3 + (Math.random() - 0.5) * 4,
          vy: grabbed.vy * 0.3 + (Math.random() - 0.5) * 4,
          life: 1,
          color: "#ffd95e",
        });
      }
      grabbed.vr = grabbed.vx * 0.002;
      grabbed.baseY = Math.min(Math.max(grabbed.y, h * 0.08), h * 0.92);
      grabbed = null;
      canvas!.style.cursor = "grab";
    }

    let t2 = 0;
    function frame() {
      t2 += 1 / 60;
      ctx!.clearRect(0, 0, w, h);

      for (const c of coins) {
        if (c !== grabbed) {
          c.x += c.vx;
          c.y += c.vy;
          c.vx *= 0.96;
          c.vy *= 0.96;
          // Lò xo nhẹ kéo về độ cao gốc + nhịp bồng bềnh.
          c.vy += (c.baseY + Math.sin(t2 * 1.4 + c.phase) * 8 - c.y) * 0.004;
          // Nảy khỏi mép.
          if (c.x < c.r) (c.x = c.r), (c.vx = Math.abs(c.vx) * 0.8);
          if (c.x > w - c.r) (c.x = w - c.r), (c.vx = -Math.abs(c.vx) * 0.8);
          if (c.y < c.r) (c.y = c.r), (c.vy = Math.abs(c.vy) * 0.8);
          if (c.y > h - c.r) (c.y = h - c.r), (c.vy = -Math.abs(c.vy) * 0.8);
          c.rot += c.vr + c.vx * 0.004;
        } else {
          c.rot += c.vx * 0.01;
        }
        drawCoin(ctx!, c);
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.94;
        s.vy *= 0.94;
        s.life -= 0.03;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx!.globalAlpha = s.life;
        ctx!.fillStyle = s.color;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, 2.2 * s.life + 0.6, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="absolute inset-0 h-full w-full"
      // pan-y: vẫn cuộn dọc được trên mobile khi chạm vào vùng trống.
      style={{ touchAction: "pan-y" }}
    />
  );
}
