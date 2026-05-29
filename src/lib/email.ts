import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const fromEmail = process.env.SMTP_FROM || smtpUser || "noreply@ecologica.cl";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function getTransporter() {
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) return null;
  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: parseInt(smtpPort) === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
}

export async function sendChecklistEmail(to: string, driverName: string, checklistId: string, plate: string, date: string): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("SMTP no configurado — email no enviado");
    return false;
  }

  const pdfUrl = `${appUrl}/api/checklist/pdf?id=${checklistId}`;

  try {
    await transporter.sendMail({
      from: `"EcoMantenimiento" <${fromEmail}>`,
      to,
      subject: `Comprobante de Checklist - ${plate} - ${date}`,
      html: `
        <div style="font-family: 'Open Sans', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #021793; color: white; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="margin:0; font-family: 'Lato', sans-serif;">Eco<span style="color:#30ff00;">Mantenimiento</span></h1>
          </div>
          <div style="border: 1px solid #e0e0e0; border-top: 0; padding: 24px; border-radius: 0 0 12px 12px;">
            <p>Hola <strong>${driverName}</strong>,</p>
            <p>Tu checklist del vehículo <strong>${plate}</strong> del <strong>${date}</strong> fue registrado exitosamente.</p>
            <p>Puedes descargar el comprobante en PDF aquí:</p>
            <p style="text-align:center; margin: 24px 0;">
              <a href="${pdfUrl}" target="_blank"
                 style="background: #021793; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Descargar comprobante
              </a>
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 24px;">
              Ecológica · Sistema EcoMantenimiento
            </p>
          </div>
        </div>
      `,
    });
    console.log(`Email enviado a ${to}`);
    return true;
  } catch (err: any) {
    console.error("Error al enviar email:", err.message);
    return false;
  }
}
