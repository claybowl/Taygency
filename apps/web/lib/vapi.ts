const VAPI_API_KEY = process.env.VAPI_API_KEY!;
const VAPI_BASE_URL = 'https://api.vapi.ai';

interface SendSMSParams {
  to: string;
  message: string;
}

export async function sendSMS({ to, message }: SendSMSParams): Promise<void> {
  const response = await fetch(`${VAPI_BASE_URL}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${VAPI_API_KEY}`,
    },
    body: JSON.stringify({
      to,
      message,
      phoneNumberId: process.env.VAPI_PHONE_NUMBER,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`VAPI SMS failed: ${response.status} ${error}`);
  }
}

export function extractPhoneNumber(vapiPayload: { call?: { customer?: { number?: string } } }): string | null {
  return vapiPayload?.call?.customer?.number ?? null;
}
