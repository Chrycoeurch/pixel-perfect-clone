import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { DOC_TYPES, type DocType } from "./acte-types";

export interface ActePdfInput {
  docType: DocType;
  docNumber: string;
  verifyCode: string;
  verifyUrl: string;
  issuedAt: Date;
  issuerName: string;
  fokontany: string;
  citizen: {
    last_name: string;
    first_names: string;
    sex: "M" | "F";
    birth_date?: string | null;
    birth_place?: string | null;
    cin?: string | null;
    profession?: string | null;
    address?: string | null;
  };
  body: string;
}

export async function generateActePdf(input: ActePdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const green = rgb(0.05, 0.42, 0.27);
  const gray = rgb(0.4, 0.4, 0.4);
  const dark = rgb(0.1, 0.1, 0.1);

  // Header band
  page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: green });
  page.drawText("REPOBLIKAN'I MADAGASIKARA", { x: 40, y: height - 35, size: 11, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Fitiavana – Tanindrazana – Fandrosoana", {
    x: 40, y: height - 50, size: 9, font, color: rgb(1, 1, 1),
  });
  page.drawText(`FOKONTANY ${input.fokontany.toUpperCase()}`, {
    x: 40, y: height - 70, size: 10, font: bold, color: rgb(1, 1, 1),
  });
  page.drawText("FANISA Web Pro", { x: width - 130, y: height - 70, size: 9, font, color: rgb(1, 1, 1) });

  // Title
  const title = DOC_TYPES[input.docType].toUpperCase();
  const titleW = bold.widthOfTextAtSize(title, 18);
  page.drawText(title, { x: (width - titleW) / 2, y: height - 140, size: 18, font: bold, color: dark });

  page.drawText(`N° ${input.docNumber}`, { x: 40, y: height - 170, size: 10, font, color: gray });
  page.drawText(`Délivré le ${input.issuedAt.toLocaleDateString("fr-FR")}`, {
    x: width - 200, y: height - 170, size: 10, font, color: gray,
  });

  // Citizen block
  let y = height - 210;
  const line = (label: string, value: string) => {
    page.drawText(label, { x: 40, y, size: 10, font: bold, color: dark });
    page.drawText(value, { x: 180, y, size: 10, font, color: dark });
    y -= 18;
  };
  line("Nom et prénoms :", `${input.citizen.last_name} ${input.citizen.first_names}`);
  line("Sexe :", input.citizen.sex === "M" ? "Masculin" : "Féminin");
  if (input.citizen.birth_date)
    line("Né(e) le :", `${input.citizen.birth_date}${input.citizen.birth_place ? " à " + input.citizen.birth_place : ""}`);
  if (input.citizen.cin) line("CIN :", input.citizen.cin);
  if (input.citizen.profession) line("Profession :", input.citizen.profession);
  if (input.citizen.address) line("Adresse :", input.citizen.address);

  // Body
  y -= 20;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: gray });
  y -= 30;

  const wrap = (text: string, max: number) => {
    const words = text.split(/\s+/);
    const out: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (font.widthOfTextAtSize(test, 11) > max) {
        if (cur) out.push(cur);
        cur = w;
      } else cur = test;
    }
    if (cur) out.push(cur);
    return out;
  };
  for (const line of input.body.split("\n")) {
    for (const sub of wrap(line, width - 80)) {
      page.drawText(sub, { x: 40, y, size: 11, font, color: dark });
      y -= 16;
    }
    y -= 4;
  }

  // QR code
  const qrDataUrl = await QRCode.toDataURL(input.verifyUrl, { margin: 1, width: 200 });
  const qrBytes = Uint8Array.from(atob(qrDataUrl.split(",")[1]), (c) => c.charCodeAt(0));
  const qrImg = await pdf.embedPng(qrBytes);
  const qrSize = 90;
  page.drawImage(qrImg, { x: 40, y: 80, width: qrSize, height: qrSize });
  page.drawText("Vérifier l'authenticité :", { x: 140, y: 145, size: 9, font: bold, color: dark });
  page.drawText(input.verifyUrl, { x: 140, y: 130, size: 8, font, color: gray });
  page.drawText(`Code : ${input.verifyCode}`, { x: 140, y: 115, size: 8, font, color: gray });

  // Signature
  page.drawText("Le Chef Fokontany", { x: width - 200, y: 150, size: 10, font: bold, color: dark });
  page.drawText(input.issuerName, { x: width - 200, y: 90, size: 10, font, color: dark });
  page.drawLine({ start: { x: width - 200, y: 110 }, end: { x: width - 60, y: 110 }, thickness: 0.3, color: gray });

  // Footer
  page.drawText(`FANISA Web Pro · Document immuable · ${input.docNumber}`, {
    x: 40, y: 30, size: 8, font, color: gray,
  });

  return pdf.save();
}
