export async function sendPasswordResetEmail(args: { to: string; resetUrl: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM

  if (!apiKey || !from) {
    throw new Error('Email is not configured (missing RESEND_API_KEY / RESEND_FROM)')
  }

  const text = `
Tu as demandé à réinitialiser ton mot de passe Orbital Astro.

Ouvre ce lien (valide environ 1 heure) :
${args.resetUrl}

Si tu n’es pas à l’origine de cette demande, ignore ce message : ton mot de passe actuel reste inchangé.
  `.trim()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: 'Réinitialisation de ton mot de passe — Orbital Astro',
      text,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend error (${res.status}): ${body || res.statusText}`)
  }
}
