async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const mode = process.env.PAYPAL_MODE || 'sandbox'

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.')
  }

  const baseUrl = mode === 'live' 
    ? 'https://api.paypal.com' 
    : 'https://api.sandbox.paypal.com'

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get PayPal access token: ${error}`)
  }

  const data = await response.json()
  return data.access_token
}

export async function createPayPalPayout(
  recipientEmail: string,
  amount: number,
  currency: string = 'USD',
  note: string = ''
): Promise<{ batchId: string; payoutItemId: string }> {
  const mode = process.env.PAYPAL_MODE || 'sandbox'
  const baseUrl = mode === 'live' 
    ? 'https://api.paypal.com' 
    : 'https://api.sandbox.paypal.com'

  const accessToken = await getPayPalAccessToken()

  const payoutData = {
    sender_batch_header: {
      sender_batch_id: `VPROMISE_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      email_subject: 'You have a payment from VPromise',
      email_message: note || 'Payment from VPromise',
    },
    items: [
      {
        recipient_type: 'EMAIL',
        amount: {
          value: amount.toFixed(2),
          currency,
        },
        receiver: recipientEmail,
        note: note || 'Payment from VPromise',
        sender_item_id: `PAYMENT_${Date.now()}`,
      },
    ],
  }

  const response = await fetch(`${baseUrl}/v1/payments/payouts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payoutData),
  })

  if (!response.ok) {
    const error = await response.json().catch(async () => ({ message: await response.text()}))
    throw new Error(`PayPal API Error (${response.status}): ${JSON.stringify(error)}`)
  }

  const result = await response.json()
  const batchId = result.batch_header?.payout_batch_id || ''
  const payoutItemId = result.items?.[0]?.payout_item_id || ''

  return { batchId, payoutItemId }
}

export async function getPayoutStatus(batchId: string): Promise<string> {
  const mode = process.env.PAYPAL_MODE || 'sandbox'
  const baseUrl = mode === 'live' 
    ? 'https://api.paypal.com' 
    : 'https://api.sandbox.paypal.com'

  const accessToken = await getPayPalAccessToken()

  const response = await fetch(`${baseUrl}/v1/payments/payouts/${batchId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(async () => ({ message: await response.text()}))
    throw new Error(`Failed to check payout status: ${JSON.stringify(error)}`)
  }

  const result = await response.json()
  return result.batch_header?.batch_status || 'UNKNOWN'
}
