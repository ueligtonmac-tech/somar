export async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  const instanceId = process.env.ZAPI_INSTANCE_ID
  const token = process.env.ZAPI_TOKEN
  if (!instanceId || !token) return false

  // Normalize phone: remove all non-digits, ensure starts with 55 (Brazil)
  const normalized = phone.replace(/\D/g, '')
  const withCountry = normalized.startsWith('55') ? normalized : `55${normalized}`

  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: withCountry, message }),
      }
    )
    return res.ok
  } catch {
    return false
  }
}
