import { Resend } from "resend";
import { formatPrice } from "@/lib/utils/format";

// Initialisation paresseuse : le constructeur Resend rejette une clé vide,
// ce qui empêcherait le worker de démarrer sans RESEND_API_KEY configurée.
let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("RESEND_API_KEY manquante");
    }
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM = "ImmoPlatform <alertes@astrawave.fr>";

export interface AlertDealItem {
  title: string;
  price: number;
  city: string;
  url: string;
}

export async function sendAlertEmail(
  to: string,
  alertName: string,
  deals: AlertDealItem[]
): Promise<boolean> {
  try {
    const items = deals
      .map(
        (d) =>
          `<li style="margin-bottom:12px">
            <a href="${d.url}" style="color:#0D9488;font-weight:600">${d.title}</a><br/>
            <span style="color:#0B1C3D">${formatPrice(d.price)} · ${d.city}</span>
          </li>`
      )
      .join("");

    await getResend().emails.send({
      from: FROM,
      to,
      subject: `🔔 ${deals.length} nouveau${deals.length > 1 ? "x" : ""} bien${deals.length > 1 ? "s" : ""} — alerte « ${alertName} »`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#0B1C3D">Votre alerte « ${alertName} »</h2>
          <p>De nouveaux biens correspondent à vos critères :</p>
          <ul style="list-style:none;padding:0">${items}</ul>
          <p style="color:#64748b;font-size:12px">
            Vous recevez cet email car vous avez créé une alerte sur ImmoPlatform.
            Gérez vos alertes depuis votre <a href="${process.env.NEXT_PUBLIC_APP_URL}/alertes">tableau de bord</a>.
          </p>
        </div>`,
    });
    return true;
  } catch (error) {
    console.error("[email/alert] sendAlertEmail failed:", error);
    return false;
  }
}
