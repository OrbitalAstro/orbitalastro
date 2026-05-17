export async function sendPasswordChangedEmail(args: { to: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM

  if (!apiKey || !from) {
    throw new Error('Email is not configured (missing RESEND_API_KEY / RESEND_FROM)')
  }

  const when = new Date().toLocaleString('fr-CA', {
    timeZone: 'America/Toronto',
    dateStyle: 'long',
    timeStyle: 'short',
  })

  const forgotUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://www.orbitalastro.ca'
  const resetLink = `${forgotUrl}/auth/forgot-password`

  const text = `
Ton mot de passe Orbital Astro a été modifié.

Date : ${when}

Si tu es à l’origine de ce changement, tu peux ignorer ce message.

Si tu ne l’as pas demandé, réinitialise ton mot de passe dès que possible :
${resetLink}
  `.trim()

  const safeHref = resetLink.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  const html = `
<p>Ton mot de passe <strong>Orbital Astro</strong> a été modifié.</p>
<p>Date : ${when}</p>
<p>Si tu es à l’origine de ce changement, tu peux ignorer ce message.</p>
<p>Si tu ne l’as pas demandé, <a href="${safeHref}">réinitialise ton mot de passe</a> dès que possible.</p>
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
      subject: 'Ton mot de passe a été modifié — Orbital Astro',
      text,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend error (${res.status}): ${body || res.statusText}`)
  }
}
