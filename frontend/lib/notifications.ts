// Système de notifications : email (Nodemailer) + WhatsApp (Meta Cloud API webhook)
// Fonctionne en mode simulation si les variables d'environnement ne sont pas définies

export interface NotificationData {
  destinataire: {
    nom: string;
    prenom: string;
    email?: string;
    telephone?: string;  // format international : +221XXXXXXXXX
  };
  type: "confirmation_demande" | "statut_update" | "document_pret" | "bienvenue";
  reference?: string;
  service?: string;
  statut?: string;
  message_custom?: string;
  langue?: string;
}

// ─── Email via Nodemailer ─────────────────────────────────────────────────────

export async function envoyerEmail(data: NotificationData): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
  const { destinataire, type, reference, service, statut, langue } = data;
  if (!destinataire.email) return { success: false };

  const isWolof = langue === "wolof";

  const TEMPLATES: Record<string, { subject: string; html: string }> = {
    confirmation_demande: {
      subject: isWolof
        ? `SunuBot — Sa demande ${reference} jot na`
        : `SunuBot — Confirmation de votre demande ${reference}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#1F5C99,#174a7a);padding:24px;text-align:center;">
            <h1 style="color:white;margin:0;font-size:22px;">🇸🇳 SunuBot</h1>
            <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px;">Assistant Administratif Multilingue — Sénégal</p>
          </div>
          <div style="padding:24px;">
            <h2 style="color:#1F5C99;font-size:16px;">${isWolof ? "Sa demande jot na!" : "Votre demande a bien été reçue ✓"}</h2>
            <p style="color:#374151;">${isWolof ? "Bonsoir" : "Bonjour"} <strong>${destinataire.prenom} ${destinataire.nom}</strong>,</p>
            <p style="color:#374151;">${isWolof
              ? `Demande bi (${service}) bind na ci système bi.`
              : `Votre demande concernant le service <strong>${service}</strong> a bien été enregistrée dans notre système.`
            }</p>
            <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:0;font-size:13px;color:#0369a1;">
                <strong>${isWolof ? "Numéro référence" : "Numéro de référence"} :</strong>
                <span style="font-family:monospace;font-size:15px;font-weight:bold;margin-left:8px;">${reference}</span>
              </p>
            </div>
            <div style="margin:16px 0;">
              <p style="font-size:13px;color:#6b7280;margin:4px 0;">📋 ${isWolof ? "Suivi" : "Progression"} :</p>
              <div style="display:flex;gap:4px;margin-top:8px;">
                ${["Reçu","En cours","Validé","Disponible"].map((s, i) => `
                  <div style="flex:1;text-align:center;">
                    <div style="width:24px;height:24px;border-radius:50%;background:${i === 0 ? "#1F5C99" : "#e5e7eb"};color:white;display:flex;align-items:center;justify-content:center;font-size:11px;margin:0 auto;">${i === 0 ? "✓" : i + 1}</div>
                    <p style="font-size:9px;margin:2px 0;color:${i === 0 ? "#1F5C99" : "#9ca3af"};">${s}</p>
                  </div>
                `).join("")}
              </div>
            </div>
            <p style="color:#374151;font-size:13px;">${isWolof
              ? "Dinaa ko topp ak email walla SMS. Jereejef!"
              : "Vous serez notifié par email à chaque changement de statut. Merci de faire confiance à SunuBot !"
            }</p>
          </div>
          <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="font-size:11px;color:#9ca3af;margin:0;">SunuBot — Mémoire M2 IA — Université de Thiès</p>
            <p style="font-size:10px;color:#d1d5db;margin:4px 0 0;">Cet email est automatique, ne pas répondre directement.</p>
          </div>
        </div>
      `,
    },
    statut_update: {
      subject: `SunuBot — Mise à jour : ${reference} → ${statut}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#1F5C99,#174a7a);padding:24px;text-align:center;">
            <h1 style="color:white;margin:0;">🔔 SunuBot — Mise à jour</h1>
          </div>
          <div style="padding:24px;">
            <p>Bonjour <strong>${destinataire.prenom} ${destinataire.nom}</strong>,</p>
            <p>Le statut de votre demande <strong>${reference}</strong> a été mis à jour :</p>
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;text-align:center;">
              <p style="font-size:18px;font-weight:bold;color:#16a34a;margin:0;">${statut?.toUpperCase()}</p>
            </div>
            ${statut === "disponible" ? `<p style="color:#16a34a;font-weight:bold;">✅ Votre document est prêt à être retiré !</p>` : ""}
          </div>
        </div>
      `,
    },
    bienvenue: {
      subject: `Bienvenue sur SunuBot, ${destinataire.prenom} !`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#1F5C99,#174a7a);padding:32px;text-align:center;">
            <h1 style="color:white;margin:0;font-size:28px;">🇸🇳 SunuBot</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Votre assistant administratif multilingue</p>
          </div>
          <div style="padding:24px;">
            <h2 style="color:#1F5C99;">Bienvenue, ${destinataire.prenom} ! 🎉</h2>
            <p>Votre compte SunuBot a été créé avec succès. Vous pouvez maintenant :</p>
            <ul style="color:#374151;">
              <li>📋 Faire vos demandes administratives en ligne</li>
              <li>🔔 Suivre l'état de vos dossiers en temps réel</li>
              <li>📄 Télécharger vos récépissés PDF</li>
              <li>🗺️ Localiser les services sur la carte</li>
              <li>🎤 Parler au bot en français ou en wolof</li>
            </ul>
          </div>
        </div>
      `,
    },
    document_pret: {
      subject: `SunuBot 🇸🇳 — Votre document ${reference} est prêt — Téléchargez-le ici`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#1F5C99,#174a7a);padding:32px;text-align:center;">
            <h1 style="color:white;margin:0;font-size:26px;">🇸🇳 SunuBot</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Assistant Administratif Multilingue</p>
          </div>
          <div style="padding:28px;">
            <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
              <p style="font-size:32px;margin:0;">✅</p>
              <h2 style="color:#16a34a;margin:8px 0 4px;">Votre document est prêt !</h2>
              <p style="color:#374151;margin:0;">Référence : <strong style="font-family:monospace;font-size:16px;">${reference}</strong></p>
            </div>
            <p style="color:#374151;">Bonjour <strong>${destinataire.prenom} ${destinataire.nom}</strong>,</p>
            <p style="color:#374151;">Votre demande a été <strong style="color:#16a34a;">validée et traitée</strong> par nos agents. Votre document officiel est maintenant disponible.</p>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="margin:0 0 8px;font-size:13px;color:#1e40af;font-weight:bold;">📥 Comment obtenir votre document :</p>
              <p style="margin:4px 0;font-size:13px;color:#374151;">1. Connectez-vous sur <strong>SunuBot</strong></p>
              <p style="margin:4px 0;font-size:13px;color:#374151;">2. Allez dans <strong>Mon espace → Mes demandes</strong></p>
              <p style="margin:4px 0;font-size:13px;color:#374151;">3. Cliquez sur <strong>Télécharger le récépissé PDF</strong></p>
            </div>
            <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:12px;margin:16px 0;">
              <p style="margin:0;font-size:12px;color:#854d0e;">
                ⚠️ <strong>Note :</strong> Ce récépissé électronique est un document de préinscription.
                Pour le document officiel signé (acte original), veuillez vous présenter au centre d'état civil
                le plus proche avec ce récépissé et une pièce d'identité. <br><br>
                <strong>🌍 Si vous êtes loin de Thiès</strong>, ce récépissé est accepté comme preuve de demande
                dans tous les centres d'état civil du Sénégal.
              </p>
            </div>
            <p style="color:#374151;font-size:13px;">Pour toute question, répondez à cet email ou contactez-nous via SunuBot.</p>
          </div>
          <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="font-size:11px;color:#9ca3af;margin:0;">SunuBot — Mémoire M2 IA — Université de Thiès</p>
          </div>
        </div>
      `,
    },
  };

  const template = TEMPLATES[type] || TEMPLATES.confirmation_demande;

  // En production : utiliser les variables d'environnement SMTP
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    // Mode simulation — log dans la console serveur
    console.log(`[SunuBot Email SIMULATION] To: ${destinataire.email} | Subject: ${template.subject}`);
    return { success: true, simulated: true, messageId: `sim-${Date.now()}` };
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const info = await transporter.sendMail({
      from: `"SunuBot 🇸🇳" <${SMTP_USER}>`,
      to: destinataire.email,
      subject: template.subject,
      html: template.html,
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("[SunuBot Email Error]", err);
    return { success: false };
  }
}

// ─── WhatsApp via Meta Cloud API ──────────────────────────────────────────────

export async function envoyerWhatsApp(data: NotificationData): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
  const { destinataire, type, reference, service, langue } = data;
  if (!destinataire.telephone) return { success: false };

  const isWolof = langue === "wolof";

  const MESSAGES: Record<string, string> = {
    confirmation_demande: isWolof
      ? `🇸🇳 *SunuBot*\n\nSa demande *${service}* bind na!\nNuméro : *${reference}*\n\nDinaa la wax su am yeneen.\nJereejef ci SunuBot! 🙏`
      : `🇸🇳 *SunuBot — Confirmation*\n\nBonjour *${destinataire.prenom}*,\n\nVotre demande *${service}* a bien été enregistrée.\nRéférence : *${reference}*\n\nSuivez l'avancement sur SunuBot. Merci !`,
    statut_update:
      `🔔 *SunuBot* — Mise à jour\n\nVotre demande *${reference}* : nouveau statut *${data.statut?.toUpperCase()}*`,
    document_pret:
      `✅ *SunuBot* — Document prêt !\n\nVotre document *${reference}* est disponible. Présentez-vous au guichet avec une pièce d'identité.`,
    bienvenue: isWolof
      ? `🇸🇳 *SunuBot* — Dalal jaamm, *${destinataire.prenom}*!\n\nSa compte bind na. Man nga def sa demandes yi ci SunuBot.\nJereejef!`
      : `🇸🇳 *SunuBot* — Bienvenue, *${destinataire.prenom}* !\n\nVotre compte a été créé. Vous pouvez maintenant faire vos demandes administratives en ligne.`,
  };

  const msgBody = MESSAGES[type] || MESSAGES.confirmation_demande;

  const WA_TOKEN = process.env.WHATSAPP_TOKEN;
  const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

  if (!WA_TOKEN || !WA_PHONE_ID) {
    console.log(`[SunuBot WhatsApp SIMULATION] To: ${destinataire.telephone}\n${msgBody}`);
    return { success: true, simulated: true, messageId: `wa-sim-${Date.now()}` };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WA_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: destinataire.telephone.replace(/\s/g, ""),
        type: "text",
        text: { body: msgBody },
      }),
    });
    const result = await res.json() as { messages?: Array<{ id: string }> };
    if (result.messages?.[0]?.id) {
      return { success: true, messageId: result.messages[0].id };
    }
    return { success: false };
  } catch (err) {
    console.error("[SunuBot WhatsApp Error]", err);
    return { success: false };
  }
}

// ─── Envoyer toutes les notifications disponibles ────────────────────────────

export async function notifier(data: NotificationData): Promise<void> {
  const tasks: Promise<unknown>[] = [];
  if (data.destinataire.email) tasks.push(envoyerEmail(data));
  if (data.destinataire.telephone) tasks.push(envoyerWhatsApp(data));
  await Promise.allSettled(tasks);
}
