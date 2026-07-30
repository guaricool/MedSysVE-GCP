const META_PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN

/**
 * Helper genérico para enviar respuestas omnicanal a través de Meta Graph API
 * para Instagram Direct Messages y Facebook Messenger.
 */
export async function sendMetaDirectMessage(opts: {
  recipientId: string
  text: string
  channel: "INSTAGRAM" | "FACEBOOK"
}): Promise<{ success: boolean; error?: string }> {
  if (!META_PAGE_ACCESS_TOKEN) {
    console.warn(`[MetaMessaging] Meta Access Token not configured for ${opts.channel} — set META_PAGE_ACCESS_TOKEN`)
    return { success: false, error: "not_configured" }
  }

  try {
    const url = `https://graph.facebook.com/v20.0/me/messages`
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${META_PAGE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: opts.recipientId },
        message: { text: opts.text },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error(`[MetaMessaging] Error enviando mensaje a ${opts.channel}:`, errText)
      return { success: false, error: errText }
    }

    return { success: true }
  } catch (e) {
    console.error(`[MetaMessaging] Error de conexión enviando a ${opts.channel}:`, e)
    return { success: false, error: "network_error" }
  }
}
