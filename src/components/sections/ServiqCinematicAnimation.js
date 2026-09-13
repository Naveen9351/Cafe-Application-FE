import React, { useEffect, useRef } from "react";

/* ──────────────────────────────────────────────────────────────
   ServiqCinematicAnimation.js
   Pure HTML5 Canvas — 10-Scene Looping ServiQ Product Film
   ~45 second seamless loop, no external dependencies
   ────────────────────────────────────────────────────────────── */

const TOTAL_DURATION = 45000; // 45 seconds full loop

// Easing functions
const ease = {
  inOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  linear: t => t,
  elastic: t => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Draw a rounded rect
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Draw a glowing line between two points
function glowLine(ctx, x1, y1, x2, y2, color, alpha, width = 1.5) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.shadowBlur = 12;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

// Draw a particle dot
function particle(ctx, x, y, r, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.shadowBlur = 10;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Glassmorphism card
function glassCard(ctx, x, y, w, h, r, alpha = 0.85) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.shadowBlur = 20;
  ctx.shadowColor = 'rgba(5,150,105,0.25)';
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// Text helper
function text(ctx, str, x, y, color, size, weight = '600', alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px 'Plus Jakarta Sans', Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(str, x, y);
  ctx.restore();
}

// Node circle
function node(ctx, x, y, r, color, label, alpha, pulsePhase) {
  const pulse = 1 + 0.08 * Math.sin(pulsePhase);
  ctx.save();
  ctx.globalAlpha = alpha;
  // outer ring
  ctx.beginPath();
  ctx.arc(x, y, r * pulse * 1.45, 0, Math.PI * 2);
  ctx.fillStyle = `${color}22`;
  ctx.fill();
  // middle ring
  ctx.beginPath();
  ctx.arc(x, y, r * pulse * 1.15, 0, Math.PI * 2);
  ctx.fillStyle = `${color}44`;
  ctx.fill();
  // core
  ctx.beginPath();
  ctx.arc(x, y, r * pulse, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.shadowBlur = 18;
  ctx.shadowColor = color;
  ctx.fill();
  ctx.restore();

  if (label) {
    text(ctx, label, x, y + r * pulse * 1.45 + 14, '#e2e8f0', 10, '700', alpha);
  }
}

// Particle traveling along a path
function travelingParticle(ctx, x1, y1, x2, y2, progress, color) {
  const px = lerp(x1, x2, progress);
  const py = lerp(y1, y2, progress);
  particle(ctx, px, py, 4, color, 1);
  // trail
  for (let i = 1; i <= 5; i++) {
    const t = progress - i * 0.035;
    if (t < 0) break;
    const tx = lerp(x1, x2, t);
    const ty = lerp(y1, y2, t);
    particle(ctx, tx, ty, 3 - i * 0.4, color, (5 - i) / 7);
  }
}

export default function ServiqCinematicAnimation() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Responsive sizing
    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.offsetWidth;
      canvas.height = Math.min(parent.offsetWidth * (9 / 16), 520);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    // Particle pool for the ecosystem flow
    const flowParticles = [];
    for (let i = 0; i < 20; i++) {
      flowParticles.push({
        angle: (i / 20) * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.005,
        r: 4 + Math.random() * 3,
        color: ['#10b981', '#d97706', '#a78bfa', '#38bdf8'][i % 4],
        alpha: 0.6 + Math.random() * 0.4,
        radius: 0.28 + Math.random() * 0.06
      });
    }

    function draw(ts) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) % TOTAL_DURATION;
      const t = elapsed / TOTAL_DURATION; // 0..1 full loop progress

      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;

      // ── Clear ──
      ctx.clearRect(0, 0, W, H);

      // ── Dark background ──
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.8);
      bgGrad.addColorStop(0, '#0d1a12');
      bgGrad.addColorStop(0.5, '#0a1520');
      bgGrad.addColorStop(1, '#060c10');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // ── Ambient particles (always present) ──
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2 + ts * 0.0001;
        const r = (0.30 + (i % 3) * 0.08) * Math.min(W, H);
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        const pa = 0.07 + 0.05 * Math.sin(ts * 0.001 + i);
        particle(ctx, px, py, 1.5, '#10b981', pa);
      }

      // ─────────────────────────────────────────────────
      // Determine which scene is active (0..9)
      // Scene durations (proportional slices of 45s):
      // S1:0-0.10, S2:0.10-0.20, S3:0.20-0.30, S4:0.30-0.38
      // S5:0.38-0.48, S6:0.48-0.56, S7:0.56-0.66
      // S8:0.66-0.74, S9:0.74-0.86, S10:0.86-1.0
      // ─────────────────────────────────────────────────

      const SCENES = [
        [0, 0.10],    // 1
        [0.10, 0.20], // 2
        [0.20, 0.30], // 3
        [0.30, 0.38], // 4
        [0.38, 0.48], // 5
        [0.48, 0.56], // 6
        [0.56, 0.66], // 7
        [0.66, 0.74], // 8
        [0.74, 0.86], // 9
        [0.86, 1.00]  // 10
      ];

      let sceneIdx = 0;
      let sceneT = 0; // 0..1 within scene
      for (let i = 0; i < SCENES.length; i++) {
        if (t >= SCENES[i][0] && t < SCENES[i][1]) {
          sceneIdx = i;
          sceneT = (t - SCENES[i][0]) / (SCENES[i][1] - SCENES[i][0]);
          break;
        }
      }

      // ── Ecosystem node positions (relative to canvas) ──
      const nodeRadius = clamp(W * 0.038, 14, 28);
      const ecosystemRadius = Math.min(W, H) * 0.31;
      const NODES = [
        { label: 'Customer', color: '#10b981', angle: -Math.PI / 2 },
        { label: 'Table QR', color: '#d97706', angle: -Math.PI / 2 + Math.PI * 2 / 5 },
        { label: 'AI Order', color: '#a78bfa', angle: -Math.PI / 2 + Math.PI * 4 / 5 },
        { label: 'Kitchen', color: '#f43f5e', angle: -Math.PI / 2 + Math.PI * 6 / 5 },
        { label: 'Owner', color: '#38bdf8', angle: -Math.PI / 2 + Math.PI * 8 / 5 }
      ];
      const nodePositions = NODES.map(n => ({
        ...n,
        x: cx + Math.cos(n.angle) * ecosystemRadius,
        y: cy + Math.sin(n.angle) * ecosystemRadius
      }));

      const pulse = ts * 0.002;

      // Helper to blend two scenes
      const blend = (from, to, eased = true) => {
        const raw = eased ? ease.inOut(sceneT) : sceneT;
        const fadeIn = clamp(sceneT * 8, 0, 1);
        return fadeIn;
      };

      // ── SCENE 1: Ecosystem appears ──────────────────────
      if (sceneIdx === 0) {
        const alpha = ease.out(clamp(sceneT * 3, 0, 1));
        const cameraZoom = 1 + 0.03 * ease.inOut(sceneT);

        // Draw connection lines
        nodePositions.forEach((n, i) => {
          nodePositions.forEach((n2, j) => {
            if (j <= i) return;
            const lineAlpha = 0.12 + 0.06 * Math.sin(pulse + i + j);
            glowLine(ctx, cx + (n.x - cx) / cameraZoom, cy + (n.y - cy) / cameraZoom,
              cx + (n2.x - cx) / cameraZoom, cy + (n2.y - cy) / cameraZoom,
              '#10b981', lineAlpha * alpha, 1);
          });
        });

        // Central core
        node(ctx, cx, cy, nodeRadius * 1.3, '#059669', '', alpha, pulse);
        text(ctx, 'SERVIQ', cx, cy + 4, '#ffffff', clamp(W * 0.013, 8, 13), '900', alpha);

        // Outer nodes
        nodePositions.forEach((n, i) => {
          const stagger = ease.out(clamp((sceneT - i * 0.08) * 5, 0, 1));
          node(ctx, cx + (n.x - cx) / cameraZoom, cy + (n.y - cy) / cameraZoom,
            nodeRadius, n.color, n.label, stagger * alpha, pulse + i);
        });

        // Flowing particles on connections
        if (sceneT > 0.5) {
          for (let k = 0; k < 3; k++) {
            const prog = (sceneT * 3 + k / 3) % 1;
            const ni = k % NODES.length;
            const ni2 = (k + 1) % NODES.length;
            travelingParticle(ctx,
              cx + (nodePositions[ni].x - cx) / cameraZoom, cy + (nodePositions[ni].y - cy) / cameraZoom,
              cx + (nodePositions[ni2].x - cx) / cameraZoom, cy + (nodePositions[ni2].y - cy) / cameraZoom,
              prog, nodePositions[ni].color);
          }
        }

        // Title
        const titleAlpha = ease.out(clamp((sceneT - 0.4) * 4, 0, 1));
        text(ctx, 'SERVIQ', cx, H * 0.84, '#ffffff', clamp(W * 0.028, 16, 26), '900', titleAlpha);
        text(ctx, 'One connected system for your entire restaurant', cx, H * 0.91,
          '#94a3b8', clamp(W * 0.012, 8, 12), '500', titleAlpha);
      }

      // ── SCENE 2: Customer QR scan ────────────────────────
      if (sceneIdx === 1) {
        const alpha = ease.out(clamp(sceneT * 4, 0, 1));
        // Draw table
        const tableX = cx - W * 0.18;
        const tableY = cy - H * 0.08;
        const tableW = W * 0.36;
        const tableH = H * 0.32;
        ctx.save();
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillStyle = 'rgba(217,119,6,0.12)';
        ctx.strokeStyle = 'rgba(217,119,6,0.4)';
        ctx.lineWidth = 1.5;
        roundRect(ctx, tableX, tableY, tableW, tableH, 12);
        ctx.fill(); ctx.stroke();
        ctx.restore();
        text(ctx, '🍽️ Table 04', cx - tableW * 0.05, tableY + tableH * 0.28,
          '#d97706', clamp(W * 0.013, 8, 13), '800', alpha);

        // QR code visual
        const qx = cx - W * 0.045;
        const qy = cy - H * 0.04;
        const qSize = Math.min(W, H) * 0.07;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        for (let qi = 0; qi < 4; qi++) {
          for (let qj = 0; qj < 4; qj++) {
            if (Math.random() > 0.5 || (qi < 2 && qj < 2)) {
              ctx.fillStyle = (qi < 2 && qj < 2) ? '#ffffff' : '#94a3b8';
              ctx.fillRect(qx + qi * (qSize / 4) - qSize / 2, qy + qj * (qSize / 4) - qSize / 4, qSize / 4 - 1, qSize / 4 - 1);
            }
          }
        }
        ctx.restore();

        // Phone
        const phoneX = cx + W * 0.15;
        const phoneY = cy - H * 0.16;
        const phoneW = W * 0.09;
        const phoneH = H * 0.3;
        glassCard(ctx, phoneX, phoneY, phoneW, phoneH, 10, alpha * 0.9);
        text(ctx, '📱', phoneX + phoneW / 2, phoneY + phoneH * 0.45,
          '#ffffff', clamp(W * 0.022, 14, 22), '400', alpha);

        // Light beam traveling
        const beamProgress = sceneT % 0.5 * 2;
        if (sceneT > 0.2) {
          const np = clamp(beamProgress, 0, 1);
          // QR → phone
          travelingParticle(ctx, qx, qy, phoneX + phoneW / 2, phoneY + phoneH / 2, np, '#d97706');
          glowLine(ctx, qx, qy, phoneX + phoneW / 2, phoneY + phoneH / 2, '#d97706', 0.12 + 0.06 * Math.sin(pulse * 3), 1);
        }
        if (sceneT > 0.5) {
          // phone → ServIQ core
          const np2 = clamp((sceneT - 0.5) * 2, 0, 1);
          travelingParticle(ctx, phoneX + phoneW / 2, phoneY + phoneH / 2, cx, cy, np2, '#10b981');
          glowLine(ctx, phoneX + phoneW / 2, phoneY + phoneH / 2, cx, cy, '#10b981', 0.15, 1);
        }

        // Labels
        text(ctx, 'Table → Phone → ServiQ', cx, H * 0.87, '#10b981', clamp(W * 0.012, 8, 11), '700', alpha);
        node(ctx, cx, cy, nodeRadius * 0.9, '#059669', '', alpha * 0.6, pulse);
      }

      // ── SCENE 3: Digital Menu ────────────────────────────
      if (sceneIdx === 2) {
        const alpha = ease.out(clamp(sceneT * 4, 0, 1));
        const menuW = W * 0.30;
        const menuH = H * 0.72;
        const menuX = cx - menuW / 2;
        const menuY = cy - menuH / 2 - H * 0.02;

        glassCard(ctx, menuX, menuY, menuW, menuH, 16, alpha * 0.95);

        // Header
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(5,150,105,0.9)';
        roundRect(ctx, menuX, menuY, menuW, menuH * 0.13, 16);
        ctx.fill();
        ctx.restore();
        text(ctx, 'SERVIQ Menu', cx, menuY + menuH * 0.09, '#ffffff', clamp(W * 0.013, 8, 13), '800', alpha);

        const categories = ['☕ Coffee', '🥐 Breakfast', '🍿 Snacks', '🍰 Desserts'];
        categories.forEach((cat, i) => {
          const catAlpha = ease.out(clamp((sceneT - 0.08 * i) * 5, 0, 1));
          const py = menuY + menuH * 0.18 + i * menuH * 0.08;
          const isActive = i === 0;
          ctx.save();
          ctx.globalAlpha = catAlpha * alpha;
          ctx.fillStyle = isActive ? 'rgba(5,150,105,0.3)' : 'rgba(255,255,255,0.05)';
          roundRect(ctx, menuX + menuW * 0.06, py, menuW * 0.88, menuH * 0.07, 6);
          ctx.fill();
          ctx.restore();
          text(ctx, cat, menuX + menuW * 0.5, py + menuH * 0.048,
            isActive ? '#10b981' : '#cbd5e1', clamp(W * 0.011, 7, 11), '700', catAlpha * alpha);
        });

        // Food cards
        const items = [
          { name: 'Cappuccino', price: '₹180', emoji: '☕' },
          { name: 'Croissant', price: '₹120', emoji: '🥐' }
        ];
        items.forEach((item, i) => {
          const cardAlpha = ease.out(clamp((sceneT - 0.35 - i * 0.1) * 5, 0, 1));
          const iy = menuY + menuH * 0.52 + i * menuH * 0.22;
          glassCard(ctx, menuX + menuW * 0.07, iy, menuW * 0.86, menuH * 0.18, 8, cardAlpha * alpha * 0.8);
          text(ctx, item.emoji, menuX + menuW * 0.22, iy + menuH * 0.1, '#ffffff', clamp(W * 0.018, 12, 18), '400', cardAlpha * alpha);
          text(ctx, item.name, menuX + menuW * 0.57, iy + menuH * 0.075, '#e2e8f0', clamp(W * 0.011, 7, 10), '700', cardAlpha * alpha);
          text(ctx, item.price, menuX + menuW * 0.57, iy + menuH * 0.135, '#10b981', clamp(W * 0.011, 7, 10), '800', cardAlpha * alpha);
          // Selected indicator
          if (sceneT > 0.7) {
            const selAlpha = ease.out(clamp((sceneT - 0.7) * 5, 0, 1));
            ctx.save();
            ctx.globalAlpha = selAlpha;
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(menuX + menuW * 0.87, iy + menuH * 0.1, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });

        // Cart counter
        if (sceneT > 0.75) {
          const cartA = ease.elastic(clamp((sceneT - 0.75) * 4, 0, 1));
          text(ctx, '🛒 2 items → ₹300', cx, menuY + menuH + H * 0.06,
            '#d97706', clamp(W * 0.012, 8, 12), '800', cartA * alpha);
        }
      }

      // ── SCENE 4: AI Order Routing ────────────────────────
      if (sceneIdx === 3) {
        const alpha = ease.out(clamp(sceneT * 5, 0, 1));

        // Nodes: ORDER → AI → KITCHEN
        const nodes4 = [
          { x: cx - W * 0.3, y: cy, label: 'ORDER', color: '#d97706' },
          { x: cx, y: cy, label: 'SERVIQ AI', color: '#10b981' },
          { x: cx + W * 0.3, y: cy, label: 'KITCHEN', color: '#f43f5e' }
        ];
        nodes4.forEach((n, i) => {
          const na = ease.out(clamp((sceneT - i * 0.15) * 5, 0, 1));
          node(ctx, n.x, n.y, nodeRadius * 1.1, n.color, '', na * alpha, pulse + i * 2);
          text(ctx, n.label, n.x, n.y + nodeRadius * 2 + 8, n.color,
            clamp(W * 0.011, 7, 11), '900', na * alpha);
        });

        // Connecting lines
        glowLine(ctx, nodes4[0].x, nodes4[0].y, nodes4[1].x, nodes4[1].y, '#d97706', 0.18 * alpha, 1);
        glowLine(ctx, nodes4[1].x, nodes4[1].y, nodes4[2].x, nodes4[2].y, '#10b981', 0.18 * alpha, 1);

        // Particles traveling
        const pp1 = (sceneT * 2) % 1;
        const pp2 = (sceneT * 2 + 0.5) % 1;
        travelingParticle(ctx, nodes4[0].x, nodes4[0].y, nodes4[1].x, nodes4[1].y, pp1, '#d97706');
        travelingParticle(ctx, nodes4[1].x, nodes4[1].y, nodes4[2].x, nodes4[2].y, pp2, '#10b981');

        // AI label
        const labelA = ease.out(clamp((sceneT - 0.4) * 4, 0, 1));
        glassCard(ctx, cx - W * 0.12, cy - H * 0.22, W * 0.24, H * 0.12, 8, labelA * 0.9);
        text(ctx, '⚡ AI ORDER ROUTING', cx, cy - H * 0.145, '#10b981', clamp(W * 0.012, 7, 12), '900', labelA * alpha);
        text(ctx, 'Intelligent dispatch in < 50ms', cx, cy - H * 0.09, '#94a3b8', clamp(W * 0.01, 7, 10), '600', labelA * alpha);
      }

      // ── SCENE 5: Kitchen / KDS ───────────────────────────
      if (sceneIdx === 4) {
        const alpha = ease.out(clamp(sceneT * 4, 0, 1));
        const kw = W * 0.46;
        const kh = H * 0.58;
        const kx = cx - kw / 2;
        const ky = cy - kh / 2;

        // KDS Screen
        glassCard(ctx, kx, ky, kw, kh, 14, alpha * 0.95);

        // KDS Header
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(244,63,94,0.85)';
        roundRect(ctx, kx, ky, kw, kh * 0.14, 14);
        ctx.fill();
        ctx.restore();
        text(ctx, '🖥️ Kitchen Display System', cx, ky + kh * 0.095, '#ffffff', clamp(W * 0.013, 8, 12), '800', alpha);

        // Order card arriving
        const orderA = ease.elastic(clamp(sceneT * 3, 0, 1));
        const ocx = cx;
        const ocy = ky + kh * 0.34;
        glassCard(ctx, cx - kw * 0.38, ocy - kh * 0.13, kw * 0.76, kh * 0.52, 10, orderA * 0.85);
        text(ctx, 'Order #1042', cx, ocy - kh * 0.055, '#ffffff', clamp(W * 0.013, 8, 13), '900', orderA * alpha);
        text(ctx, 'Cappuccino  •  Croissant', cx, ocy + kh * 0.02, '#cbd5e1', clamp(W * 0.011, 7, 10), '600', orderA * alpha);

        // Status pill
        const statuses = ['NEW', 'PREPARING', 'READY'];
        const statusColors = ['#f59e0b', '#3b82f6', '#10b981'];
        const statusIdx = sceneT < 0.4 ? 0 : sceneT < 0.75 ? 1 : 2;
        const statA = ease.elastic(clamp((sceneT - Math.max(0, (statusIdx * 0.35) - 0.02)) * 6, 0, 1));
        ctx.save();
        ctx.globalAlpha = statA * alpha;
        ctx.fillStyle = statusColors[statusIdx] + '33';
        ctx.strokeStyle = statusColors[statusIdx];
        ctx.lineWidth = 1.5;
        roundRect(ctx, cx - W * 0.08, ocy + kh * 0.075, W * 0.16, kh * 0.1, 20);
        ctx.fill(); ctx.stroke();
        ctx.restore();
        text(ctx, statuses[statusIdx], cx, ocy + kh * 0.135, statusColors[statusIdx], clamp(W * 0.012, 7, 12), '900', statA * alpha);

        // Kitchen activity indicators
        if (sceneT > 0.4) {
          const kia = ease.out(clamp((sceneT - 0.4) * 4, 0, 1));
          const stations = ['☕ Bar: Cold Brew', '🥐 Bakery: Croissant'];
          stations.forEach((s, i) => {
            text(ctx, s, cx, ky + kh * 0.88 - i * kh * 0.11, '#6b7280',
              clamp(W * 0.01, 6, 10), '600', kia * alpha);
          });
        }
      }

      // ── SCENE 6: Order Ready ─────────────────────────────
      if (sceneIdx === 5) {
        const alpha = ease.out(clamp(sceneT * 4, 0, 1));

        // Trail: Kitchen → ServiQ → Customer
        const n6 = [
          { x: cx - W * 0.32, y: cy, label: 'KITCHEN', color: '#f43f5e' },
          { x: cx, y: cy, label: 'SERVIQ', color: '#10b981' },
          { x: cx + W * 0.28, y: cy - H * 0.1, label: 'CUSTOMER', color: '#d97706' }
        ];
        n6.forEach((n, i) => {
          node(ctx, n.x, n.y, nodeRadius, n.color, n.label, alpha * 0.8, pulse + i);
        });
        glowLine(ctx, n6[0].x, n6[0].y, n6[1].x, n6[1].y, '#f43f5e', 0.15 * alpha, 1);
        glowLine(ctx, n6[1].x, n6[1].y, n6[2].x, n6[2].y, '#10b981', 0.15 * alpha, 1);

        const pp = (sceneT * 1.5) % 1;
        travelingParticle(ctx, n6[0].x, n6[0].y, n6[1].x, n6[1].y, pp, '#f43f5e');
        if (pp > 0.5) {
          travelingParticle(ctx, n6[1].x, n6[1].y, n6[2].x, n6[2].y, (pp - 0.5) * 2, '#10b981');
        }

        // Phone notification
        const notifA = ease.elastic(clamp((sceneT - 0.45) * 4, 0, 1));
        const nx = n6[2].x - W * 0.05;
        const ny = n6[2].y - H * 0.28;
        glassCard(ctx, nx, ny, W * 0.22, H * 0.22, 10, notifA * 0.95);
        text(ctx, '📱', nx + W * 0.11, ny + H * 0.1, '#ffffff', clamp(W * 0.025, 16, 24), '400', notifA * alpha);
        text(ctx, 'Your order is ready!', nx + W * 0.11, ny + H * 0.165, '#10b981',
          clamp(W * 0.011, 7, 10), '800', notifA * alpha);

        // Vibration dots
        if (sceneT > 0.6) {
          for (let v = 0; v < 3; v++) {
            const va = Math.sin(pulse * 8 + v * 2) * 0.5 + 0.5;
            particle(ctx, nx + W * 0.115 + (v - 1) * W * 0.025, ny - H * 0.02, 2, '#10b981', va * notifA);
          }
        }
      }

      // ── SCENE 7: Owner Dashboard ─────────────────────────
      if (sceneIdx === 6) {
        const alpha = ease.out(clamp(sceneT * 4, 0, 1));
        const dw = W * 0.52;
        const dh = H * 0.64;
        const dx = cx - dw / 2;
        const dy = cy - dh / 2;

        glassCard(ctx, dx, dy, dw, dh, 16, alpha * 0.95);

        // Dashboard header
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(5,150,105,0.7)';
        roundRect(ctx, dx, dy, dw, dh * 0.13, 16);
        ctx.fill();
        ctx.restore();
        text(ctx, '📊 Owner Dashboard', cx, dy + dh * 0.09, '#ffffff', clamp(W * 0.013, 8, 13), '800', alpha);

        // Metrics
        const metrics = [
          { label: "Today's Orders", value: '148', color: '#10b981' },
          { label: 'Revenue', value: '₹24,600', color: '#d97706' },
          { label: 'Popular', value: 'Cappuccino', color: '#a78bfa' },
          { label: 'Tables', value: '12 / 16', color: '#38bdf8' }
        ];
        const mw = dw * 0.44;
        const mh = dh * 0.18;
        metrics.forEach((m, i) => {
          const mi = ease.out(clamp((sceneT - 0.08 * i) * 4, 0, 1));
          const mx = dx + dw * 0.04 + (i % 2) * (mw + dw * 0.08);
          const my = dy + dh * 0.18 + Math.floor(i / 2) * (mh + dh * 0.04);
          ctx.save();
          ctx.globalAlpha = mi * alpha;
          ctx.fillStyle = m.color + '1a';
          ctx.strokeStyle = m.color + '55';
          ctx.lineWidth = 1;
          roundRect(ctx, mx, my, mw, mh, 8);
          ctx.fill(); ctx.stroke();
          ctx.restore();
          text(ctx, m.value, mx + mw / 2, my + mh * 0.52, m.color, clamp(W * 0.014, 8, 14), '900', mi * alpha);
          text(ctx, m.label, mx + mw / 2, my + mh * 0.82, '#94a3b8', clamp(W * 0.009, 6, 9), '600', mi * alpha);
        });

        // Mini bar chart (revenue)
        if (sceneT > 0.55) {
          const bca = ease.out(clamp((sceneT - 0.55) * 5, 0, 1));
          const bars = [0.5, 0.7, 0.6, 0.85, 0.9, 0.75, 1.0];
          const bw = dw * 0.09;
          const bx0 = dx + dw * 0.07;
          const by0 = dy + dh * 0.82;
          const maxBH = dh * 0.16;
          bars.forEach((bv, bi) => {
            const bh = bv * maxBH * bca;
            const colors7 = ['#10b981', '#d97706', '#a78bfa', '#10b981', '#38bdf8', '#d97706', '#10b981'];
            ctx.save();
            ctx.globalAlpha = bca * alpha * 0.85;
            ctx.fillStyle = colors7[bi] + 'cc';
            roundRect(ctx, bx0 + bi * (bw + dw * 0.018), by0 - bh, bw, bh, 3);
            ctx.fill();
            ctx.restore();
          });
        }

        // Table indicators
        if (sceneT > 0.65) {
          const tia = ease.out(clamp((sceneT - 0.65) * 6, 0, 1));
          const tableStatuses = ['Active', 'Ordering', 'Ready', 'Active', 'Free'];
          const tColors = { Active: '#10b981', Ordering: '#d97706', Ready: '#38bdf8', Free: '#4b5563' };
          tableStatuses.forEach((s, i) => {
            particle(ctx, dx + dw + W * 0.04 + (i % 2) * W * 0.065,
              dy + dh * 0.2 + Math.floor(i / 2) * H * 0.13,
              6, tColors[s], tia * alpha);
            text(ctx, s, dx + dw + W * 0.04 + (i % 2) * W * 0.065,
              dy + dh * 0.2 + Math.floor(i / 2) * H * 0.13 + 15,
              tColors[s], clamp(W * 0.009, 6, 9), '600', tia * alpha);
          });
        }
      }

      // ── SCENE 8: Table QR Management ────────────────────
      if (sceneIdx === 7) {
        const alpha = ease.out(clamp(sceneT * 4, 0, 1));
        const fw = W * 0.5;
        const fh = H * 0.62;
        const fx = cx - fw / 2;
        const fy = cy - fh / 2;

        glassCard(ctx, fx, fy, fw, fh, 14, alpha * 0.9);
        text(ctx, '🏪 Table Floor Plan', cx, fy + fh * 0.09, '#94a3b8', clamp(W * 0.012, 7, 12), '700', alpha);

        // Tables grid
        const tableCount = 5 + (sceneT > 0.7 ? 1 : 0);
        const cols = 3;
        const tw = fw * 0.22;
        const th = fh * 0.2;
        for (let ti = 0; ti < tableCount; ti++) {
          const tAlpha = ti === 5
            ? ease.elastic(clamp((sceneT - 0.7) * 5, 0, 1))
            : ease.out(clamp((sceneT - ti * 0.07) * 5, 0, 1));
          const col = ti % cols;
          const row = Math.floor(ti / cols);
          const tx = fx + fw * 0.1 + col * (tw + fw * 0.09);
          const ty = fy + fh * 0.18 + row * (th + fh * 0.07);

          ctx.save();
          ctx.globalAlpha = tAlpha * alpha;
          ctx.fillStyle = ti === 5 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)';
          ctx.strokeStyle = ti === 5 ? '#10b981' : 'rgba(255,255,255,0.15)';
          ctx.lineWidth = ti === 5 ? 2 : 1;
          roundRect(ctx, tx, ty, tw, th, 8);
          ctx.fill(); ctx.stroke();
          ctx.restore();

          text(ctx, `Table 0${ti + 1}`, tx + tw / 2, ty + th * 0.42, '#e2e8f0',
            clamp(W * 0.009, 6, 9), '700', tAlpha * alpha);

          // QR indicator dot
          particle(ctx, tx + tw / 2, ty + th * 0.72, 4, ti === 5 ? '#10b981' : '#d97706', tAlpha * alpha);
        }

        // "New table added" label
        if (sceneT > 0.7) {
          const nta = ease.elastic(clamp((sceneT - 0.7) * 4, 0, 1));
          glassCard(ctx, cx - W * 0.15, fy + fh + H * 0.02, W * 0.3, H * 0.1, 8, nta * 0.95);
          text(ctx, '✅ New table added', cx, fy + fh + H * 0.072, '#10b981',
            clamp(W * 0.012, 7, 12), '800', nta * alpha);
          text(ctx, 'QR code generated automatically', cx, fy + fh + H * 0.1, '#6b7280',
            clamp(W * 0.009, 6, 9), '600', nta * alpha);
        }
      }

      // ── SCENE 9: Complete Loop ───────────────────────────
      if (sceneIdx === 8) {
        const alpha = ease.out(clamp(sceneT * 3, 0, 1));

        // All nodes visible
        nodePositions.forEach((n, i) => {
          node(ctx, n.x, n.y, nodeRadius, n.color, n.label, alpha, pulse + i);
        });

        // Center
        node(ctx, cx, cy, nodeRadius * 1.4, '#059669', '', alpha, pulse);
        text(ctx, 'AI', cx, cy + 4, '#ffffff', clamp(W * 0.012, 8, 11), '900', alpha);

        // All connections
        nodePositions.forEach((n, i) => {
          const n2 = nodePositions[(i + 1) % nodePositions.length];
          glowLine(ctx, n.x, n.y, n2.x, n2.y, n.color, 0.15 * alpha, 1.2);
          glowLine(ctx, n.x, n.y, cx, cy, n.color, 0.10 * alpha, 1);
        });

        // Flowing particles on all paths
        flowParticles.forEach((fp, i) => {
          fp.angle += fp.speed;
          const ni = i % nodePositions.length;
          const ni2 = (ni + 1) % nodePositions.length;
          const pr = (fp.angle / (Math.PI * 2)) % 1;
          travelingParticle(ctx,
            nodePositions[ni].x, nodePositions[ni].y,
            nodePositions[ni2].x, nodePositions[ni2].y,
            Math.abs(Math.sin(fp.angle)), fp.color);
        });

        // Owner above all
        const ownerA = ease.out(clamp((sceneT - 0.3) * 4, 0, 1));
        glassCard(ctx, cx - W * 0.16, H * 0.05, W * 0.32, H * 0.11, 8, ownerA * 0.9);
        text(ctx, '👤 RESTAURANT OWNER', cx, H * 0.105, '#38bdf8', clamp(W * 0.012, 7, 12), '900', ownerA * alpha);
        text(ctx, 'Monitoring entire ecosystem', cx, H * 0.14, '#64748b', clamp(W * 0.009, 6, 9), '600', ownerA * alpha);

        // Flow label
        const flowA = ease.out(clamp((sceneT - 0.5) * 4, 0, 1));
        text(ctx, 'Customer → Order → AI → Kitchen → Ready → Customer', cx, H * 0.92,
          '#10b981', clamp(W * 0.011, 7, 10), '700', flowA * alpha);
      }

      // ── SCENE 10: Infinity Loop ──────────────────────────
      if (sceneIdx === 9) {
        const alpha = ease.out(clamp(sceneT * 3, 0, 1));

        // Draw infinity symbol path
        const R = Math.min(W, H) * 0.22;
        const infScale = 1 + 0.02 * Math.sin(pulse);
        ctx.save();
        ctx.globalAlpha = 0.12 * alpha;
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#10b981';
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.01) {
          const lemnX = cx + (R * infScale * Math.cos(a)) / (1 + Math.sin(a) * Math.sin(a));
          const lemnY = cy + (R * infScale * Math.sin(a) * Math.cos(a)) / (1 + Math.sin(a) * Math.sin(a));
          if (a === 0) ctx.moveTo(lemnX, lemnY);
          else ctx.lineTo(lemnX, lemnY);
        }
        ctx.stroke();
        ctx.restore();

        // Particles traveling the infinity path
        const infWords = ['DISCOVER', 'ORDER', 'ROUTE', 'PREPARE', 'SERVE', 'ANALYZE', 'REPEAT'];
        const infColors = ['#10b981', '#d97706', '#a78bfa', '#f43f5e', '#38bdf8', '#10b981', '#d97706'];
        infWords.forEach((word, wi) => {
          const angle = (ts * 0.0008 + (wi / infWords.length) * Math.PI * 2) % (Math.PI * 2);
          const ix = cx + (R * infScale * Math.cos(angle)) / (1 + Math.sin(angle) * Math.sin(angle));
          const iy = cy + (R * infScale * Math.sin(angle) * Math.cos(angle)) / (1 + Math.sin(angle) * Math.sin(angle));
          particle(ctx, ix, iy, 5, infColors[wi], alpha * 0.9);
          text(ctx, word, ix, iy - 14, infColors[wi], clamp(W * 0.009, 6, 9), '800', alpha * 0.85);
        });

        // Glowing center AI core
        node(ctx, cx, cy, nodeRadius * 1.2, '#059669', '', alpha, pulse);
        text(ctx, 'AI', cx, cy + 4, '#ffffff', clamp(W * 0.012, 7, 12), '900', alpha);

        // Final branding
        const brandA = ease.out(clamp((sceneT - 0.4) * 3, 0, 1));
        const fadeOut = 1 - ease.in(clamp((sceneT - 0.85) * 6, 0, 1));

        text(ctx, 'SERVIQ', cx, H * 0.84, '#ffffff', clamp(W * 0.028, 18, 28), '900', brandA * alpha * fadeOut);
        text(ctx, 'From table to kitchen, everything connected.', cx, H * 0.91,
          '#94a3b8', clamp(W * 0.012, 7, 11), '500', brandA * alpha * fadeOut);
      }

      // ── Persistent ServiQ watermark ──
      if (sceneIdx !== 9) {
        text(ctx, 'SERVIQ', W * 0.08, H * 0.95, '#ffffff', clamp(W * 0.013, 8, 12), '900', 0.12);
      }

      // ── Scene transition overlay (subtle fade between scenes) ──
      if (sceneT < 0.08) {
        const fadeIn = 1 - ease.out(sceneT / 0.08);
        ctx.save();
        ctx.globalAlpha = fadeIn * 0.5;
        ctx.fillStyle = '#060c10';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
      if (sceneT > 0.92) {
        const fadeOut = ease.in((sceneT - 0.92) / 0.08);
        ctx.save();
        ctx.globalAlpha = fadeOut * 0.5;
        ctx.fillStyle = '#060c10';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div style={{
      width: '100%',
      background: '#060c10',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Top label ribbon */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        background: 'linear-gradient(to bottom, rgba(6,12,16,0.85), transparent)',
        pointerEvents: 'none'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 11, fontWeight: 800, color: '#10b981',
          letterSpacing: '0.06em', textTransform: 'uppercase'
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: '#10b981',
            boxShadow: '0 0 0 3px rgba(16,185,129,0.3)',
            animation: 'pulseSubtle 2s infinite'
          }} />
          ServiQ — Live Ecosystem Animation
        </div>
        <div style={{
          fontSize: 10, color: '#4b5563', fontWeight: 600
        }}>
          ~45s loop
        </div>
      </div>

      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%' }}
      />
    </div>
  );
}
