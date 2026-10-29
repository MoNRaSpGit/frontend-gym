// Configuracion de factura por workspace (28/10/2026 Pablo, 29/10/2026
// Ale) -- compartido entre GymStudentsSection (al renovar) y
// GymSummarySection (para reenviar despues desde Resumen si se contesto
// "no" en su momento).
import { currentMonthEs, downloadReceiptImage } from "./gym.receipt";
import { buildWhatsAppLink } from "./gym.shared";

export type GymInvoiceConfig = {
  gymName: string;
  logoUrl?: string;
  style: "card" | "ticket";
};

export function getInvoiceConfig(workspaceKey: string): GymInvoiceConfig | null {
  if (workspaceKey === "pablom") {
    return { gymName: "ANIMAL GYM", logoUrl: `${import.meta.env.BASE_URL}animal-gym-logo.png`, style: "card" };
  }
  if (workspaceKey === "alegym") {
    return { gymName: "GYM TAIKE", style: "ticket" };
  }
  return null;
}

type InvoiceStudent = { name: string; phone: string; dueDate: string };

// Descarga el comprobante y abre WhatsApp vacio (el humano adjunta la
// imagen a mano -- wa.me no deja precargar archivos, solo texto).
export async function sendInvoiceForStudent(student: InvoiceStudent, workspaceKey: string): Promise<void> {
  const config = getInvoiceConfig(workspaceKey);
  if (!config) return;
  try {
    await downloadReceiptImage({
      gymName: config.gymName,
      logoUrl: config.logoUrl,
      style: config.style,
      studentName: student.name,
      month: currentMonthEs(),
      dueDate: student.dueDate
    });
  } catch (err) {
    console.error("No se pudo generar el comprobante:", err);
  }
  window.open(buildWhatsAppLink(student.phone), "_blank", "noopener,noreferrer");
}
