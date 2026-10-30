// Comprobante de pago como imagen (28/10/2026, pedido explicito de Pablo,
// y 29/10/2026 sumado para Ale con un formato nuevo distinto): WhatsApp no
// deja precargar una imagen en un link wa.me (solo texto), asi que esto
// genera el comprobante y lo descarga al telefono; despues se adjunta a
// mano en el chat que ya se abre vacio.

const MONTHS_ES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];

export function currentMonthEs(): string {
  return MONTHS_ES[new Date().getMonth()];
}

function formatShortDateEs(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Letra que se achica sola hasta entrar en el ancho disponible (28/10/2026,
// fix: meses largos como "SEPTIEMBRE" se salian del cuadro con un tamaño
// fijo). Devuelve el tamaño final ya aplicado a ctx.font.
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
  weight: number,
  family: string
): number {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 4;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

type ReceiptInput = {
  gymName: string;
  logoUrl?: string;
  studentName: string;
  month: string;
  dueDate: string;
  style?: "card" | "card-light" | "ticket";
};

type CardTheme = {
  background: string;
  label: string;
  text: string;
  check: string;
  accent: string;
  // "circle": logo redondo recortado (Animal Gym). "framed": logo
  // rectangular con fondo blanco propio, se dibuja entero con su
  // proporcion (Equilibrio Gym).
  logoShape: "circle" | "framed";
};

const CARD_THEMES: Record<"card" | "card-light", CardTheme> = {
  card: { background: "#0a0a0a", label: "#e8e8e8", text: "#ffffff", check: "#4fd07a", accent: "#c0392b", logoShape: "circle" },
  "card-light": { background: "#ffffff", label: "#5b5f58", text: "#141414", check: "#4f9a2b", accent: "#4f9a2b", logoShape: "framed" }
};

// Formato "card" (Animal Gym / Pablo): fondo negro, logo circular, acento
// verde/rojo. Formato "card-light" (30/10/2026, Ale / Equilibrio Gym):
// el mismo comprobante pero en blanco con acento verde, para que el logo
// (que viene con fondo blanco) quede integrado y no como un recuadro.
async function buildCardReceipt(ctx: CanvasRenderingContext2D, W: number, input: ReceiptInput, theme: CardTheme) {
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, W, 1180);

  if (input.logoUrl) {
    try {
      const logo = await loadImage(input.logoUrl);
      if (theme.logoShape === "circle") {
        const cx = W / 2;
        const cy = 190;
        const r = 130;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logo, cx - r, cy - r, r * 2, r * 2);
        ctx.restore();
      } else {
        const maxW = 440;
        const maxH = 330;
        const scale = Math.min(maxW / logo.width, maxH / logo.height);
        const w = logo.width * scale;
        const h = logo.height * scale;
        ctx.drawImage(logo, (W - w) / 2, 26 + (maxH - h) / 2, w, h);
      }
    } catch {
      // Si el logo no carga, el comprobante sigue sin el (no se bloquea).
    }
  }

  ctx.textAlign = "center";
  ctx.fillStyle = theme.check;
  ctx.font = "900 62px system-ui, Arial, sans-serif";
  ctx.fillText("✓ PAGADO", W / 2, 440);

  ctx.textAlign = "left";
  ctx.fillStyle = theme.label;
  ctx.font = "600 32px system-ui, Arial, sans-serif";
  ctx.fillText("Cliente:", 56, 520);
  ctx.fillStyle = theme.text;
  ctx.font = "800 52px system-ui, Arial, sans-serif";
  ctx.fillText(input.studentName, 56, 585);

  ctx.textAlign = "center";
  ctx.fillStyle = theme.label;
  ctx.font = "700 30px system-ui, Arial, sans-serif";
  ctx.fillText("MES", W / 2, 660);
  ctx.fillStyle = theme.text;
  fitFontSize(ctx, input.month, W - 72, 150, 60, 900, "Arial, sans-serif");
  ctx.fillText(input.month, W / 2, 815);

  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(56, 865);
  ctx.lineTo(W - 56, 865);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = theme.label;
  ctx.font = "600 30px system-ui, Arial, sans-serif";
  ctx.fillText("Fecha de vencimiento:", 56, 935);
  ctx.fillStyle = theme.text;
  ctx.font = "800 54px system-ui, Arial, sans-serif";
  ctx.fillText(formatShortDateEs(input.dueDate), 56, 1000);

  ctx.textAlign = "center";
  ctx.fillStyle = theme.accent;
  ctx.font = "700 24px system-ui, Arial, sans-serif";
  ctx.fillText(`Gracias por confiar en ${input.gymName} · Pago confirmado`, W / 2, 1110);
}

// Letra "troquelada" de los bordes de arriba/abajo del tique, como un
// recibo de papel arrancado.
function zigzagPath(ctx: CanvasRenderingContext2D, xStart: number, xEnd: number, y: number, teeth: number, amp: number, down: boolean) {
  const width = xEnd - xStart;
  const step = width / teeth;
  ctx.lineTo(xStart, y);
  for (let i = 0; i < teeth; i++) {
    const midX = xStart + step * (i + 0.5);
    const nextX = xStart + step * (i + 1);
    ctx.lineTo(midX, y + (down ? amp : -amp));
    ctx.lineTo(nextX, y);
  }
}

// Formato "ticket" (nuevo, para Ale -- probando otra idea visual): fondo
// oscuro, tique de papel claro con bordes troquelados y sello rojo
// inclinado de "PAGADO", como un recibo de verdad.
function buildTicketReceipt(ctx: CanvasRenderingContext2D, W: number, input: ReceiptInput) {
  const H = 1180;
  ctx.fillStyle = "#15171c";
  ctx.fillRect(0, 0, W, H);

  const left = 60;
  const right = W - 60;
  const top = 70;
  const bottom = H - 70;

  // Papel troquelado arriba/abajo.
  ctx.save();
  ctx.beginPath();
  zigzagPath(ctx, left, right, top, 22, 9, true);
  ctx.lineTo(right, bottom);
  zigzagPath(ctx, right, left, bottom, 22, 9, false);
  ctx.lineTo(left, top);
  ctx.closePath();
  ctx.fillStyle = "#f6f1e4";
  ctx.shadowColor = "rgba(0,0,0,.45)";
  ctx.shadowBlur = 30;
  ctx.fill();
  ctx.restore();

  // Encabezado.
  ctx.textAlign = "center";
  ctx.fillStyle = "#1c1c1c";
  ctx.font = "900 58px Arial, sans-serif";
  ctx.fillText(input.gymName.toUpperCase(), W / 2, top + 100);
  ctx.fillStyle = "#8a8370";
  ctx.font = "700 20px system-ui, Arial, sans-serif";
  ctx.fillText("C O M P R O B A N T E   D E   P A G O", W / 2, top + 140);

  dashedLine(ctx, left + 20, right - 20, top + 175);

  // Sello "PAGADO" inclinado, estilo tinta de sello.
  ctx.save();
  ctx.translate(W / 2, top + 310);
  ctx.rotate((-9 * Math.PI) / 180);
  ctx.strokeStyle = "#b5392e";
  ctx.lineWidth = 7;
  ctx.strokeRect(-190, -58, 380, 116);
  ctx.strokeRect(-178, -46, 356, 92);
  ctx.fillStyle = "#b5392e";
  ctx.textAlign = "center";
  ctx.font = "900 56px Arial, sans-serif";
  ctx.fillText("PAGADO", 0, 18);
  ctx.restore();

  // Cliente.
  ctx.textAlign = "left";
  ctx.fillStyle = "#8a8370";
  ctx.font = "700 26px system-ui, Arial, sans-serif";
  ctx.fillText("CLIENTE", left + 20, top + 470);
  ctx.fillStyle = "#1c1c1c";
  ctx.font = "800 46px system-ui, Arial, sans-serif";
  ctx.fillText(input.studentName, left + 20, top + 525);

  dashedLine(ctx, left + 20, right - 20, top + 565);

  // Mes.
  ctx.textAlign = "left";
  ctx.fillStyle = "#8a8370";
  ctx.font = "700 26px system-ui, Arial, sans-serif";
  ctx.fillText("MES ABONADO", left + 20, top + 620);
  ctx.fillStyle = "#1c1c1c";
  ctx.textAlign = "center";
  fitFontSize(ctx, input.month, W - 2 * (left + 20), 110, 48, 900, "Arial, sans-serif");
  ctx.fillText(input.month, W / 2, top + 710);

  dashedLine(ctx, left + 20, right - 20, top + 750);

  // Vencimiento.
  ctx.textAlign = "left";
  ctx.fillStyle = "#8a8370";
  ctx.font = "700 26px system-ui, Arial, sans-serif";
  ctx.fillText("PRÓXIMO VENCIMIENTO", left + 20, top + 805);
  ctx.fillStyle = "#1c1c1c";
  ctx.font = "800 46px system-ui, Arial, sans-serif";
  ctx.fillText(formatShortDateEs(input.dueDate), left + 20, top + 860);

  dashedLine(ctx, left + 20, right - 20, top + 900);

  // Pie.
  ctx.textAlign = "center";
  ctx.fillStyle = "#8a8370";
  ctx.font = "600 22px system-ui, Arial, sans-serif";
  ctx.fillText(`Gracias por tu pago · ${input.gymName.toUpperCase()}`, W / 2, bottom - 40);
}

function dashedLine(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number) {
  ctx.save();
  ctx.strokeStyle = "#c9c2ab";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

export async function buildReceiptImageBlob(input: ReceiptInput): Promise<Blob> {
  const W = 720;
  const H = 1180;
  const SCALE = 2;

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el canvas del comprobante.");
  ctx.scale(SCALE, SCALE);

  if (input.style === "ticket") {
    buildTicketReceipt(ctx, W, input);
  } else {
    await buildCardReceipt(ctx, W, input, CARD_THEMES[input.style ?? "card"]);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo generar la imagen del comprobante."));
    }, "image/png");
  });
}

export async function downloadReceiptImage(input: ReceiptInput): Promise<void> {
  const blob = await buildReceiptImageBlob(input);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `comprobante-${input.studentName.replace(/\s+/g, "_")}-${input.month}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
