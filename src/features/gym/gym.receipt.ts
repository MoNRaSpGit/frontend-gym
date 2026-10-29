// Comprobante de pago como imagen (28/10/2026, pedido explicito de Pablo):
// WhatsApp no deja precargar una imagen en un link wa.me (solo texto), asi
// que esto genera el comprobante y lo descarga al telefono; despues se
// adjunta a mano en el chat que ya se abre con buildInvoiceMessage.

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

type ReceiptInput = {
  gymName: string;
  logoUrl: string;
  studentName: string;
  month: string;
  dueDate: string;
};

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

  // Fondo
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);

  // Logo circular
  try {
    const logo = await loadImage(input.logoUrl);
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
  } catch {
    // Si el logo no carga, el comprobante sigue sin el (no se bloquea).
  }

  ctx.textAlign = "center";

  // "✓ PAGADO"
  ctx.fillStyle = "#4fd07a";
  ctx.font = "900 62px system-ui, Arial, sans-serif";
  ctx.fillText("✓ PAGADO", W / 2, 440);

  // Cliente
  ctx.textAlign = "left";
  ctx.fillStyle = "#e8e8e8";
  ctx.font = "600 32px system-ui, Arial, sans-serif";
  ctx.fillText("Cliente:", 56, 520);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 52px system-ui, Arial, sans-serif";
  ctx.fillText(input.studentName, 56, 585);

  // MES (28/10/2026, fix: meses largos como "SEPTIEMBRE" se salian del
  // cuadro con el tamaño fijo -- ahora la letra se achica hasta entrar).
  ctx.textAlign = "center";
  ctx.fillStyle = "#e8e8e8";
  ctx.font = "700 30px system-ui, Arial, sans-serif";
  ctx.fillText("MES", W / 2, 660);
  ctx.fillStyle = "#ffffff";
  const maxMonthWidth = W - 72;
  let monthSize = 150;
  ctx.font = `900 ${monthSize}px Arial, sans-serif`;
  while (ctx.measureText(input.month).width > maxMonthWidth && monthSize > 60) {
    monthSize -= 4;
    ctx.font = `900 ${monthSize}px Arial, sans-serif`;
  }
  ctx.fillText(input.month, W / 2, 815);

  // Linea roja
  ctx.strokeStyle = "#c0392b";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(56, 865);
  ctx.lineTo(W - 56, 865);
  ctx.stroke();

  // Fecha de vencimiento
  ctx.textAlign = "left";
  ctx.fillStyle = "#e8e8e8";
  ctx.font = "600 30px system-ui, Arial, sans-serif";
  ctx.fillText("Fecha de vencimiento:", 56, 935);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 54px system-ui, Arial, sans-serif";
  ctx.fillText(formatShortDateEs(input.dueDate), 56, 1000);

  // Pie
  ctx.textAlign = "center";
  ctx.fillStyle = "#c0392b";
  ctx.font = "700 24px system-ui, Arial, sans-serif";
  ctx.fillText(`Gracias por confiar en ${input.gymName} · Pago confirmado`, W / 2, 1110);

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
