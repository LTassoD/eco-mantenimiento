import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jsPDF from "jspdf";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const checklist = await prisma.checklist.findUnique({
    where: { id },
    include: {
      vehicle: true,
      driver: true,
      supervisor: true,
      template: true,
      responses: { include: { item: true } },
    },
  });

  if (!checklist) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const doc = new jsPDF();
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("EcoMantenimiento - Checklist Diario", 20, y);
  y += 12;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha: ${new Date(checklist.createdAt).toLocaleDateString("es-CL")}`, 20, y);
  y += 7;
  doc.text(`Vehículo: ${checklist.vehicle.plate} - ${checklist.vehicle.brand} ${checklist.vehicle.model}`, 20, y);
  y += 7;
  doc.text(`Conductor: ${checklist.driver.name}`, 20, y);
  y += 7;
  doc.text(`Turno: ${checklist.shift}`, 20, y);
  y += 7;
  doc.text(`Kilometraje: ${checklist.currentKm} km`, 20, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.text("Resultados:", 20, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const label: Record<string, string> = { yes: "Estandar", no: "Bajo Estandar", na: "No Aplica" };
  const color: Record<string, [number, number, number]> = { yes: [0, 128, 0], no: [255, 0, 0], na: [128, 128, 128] };

  for (const r of checklist.responses) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const [r2, g2, b2] = color[r.value] || [0, 0, 0];
    doc.setTextColor(r2, g2, b2);
    doc.text(`${r.item.category} - ${r.item.name}: ${label[r.value] || r.value}`, 20, y);
    doc.setTextColor(0, 0, 0);
    y += 6;
  }

  if (checklist.notes) {
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text(`Observaciones: ${checklist.notes}`, 20, y);
  }

  if (checklist.digitalSignature) {
    y += 20;
    doc.text("Firma digital:", 20, y);
    y += 5;
    doc.addImage(checklist.digitalSignature, "PNG", 20, y, 60, 20);
  }

  const pdf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="checklist-${checklist.id.slice(0, 8)}.pdf"`,
    },
  });
}
