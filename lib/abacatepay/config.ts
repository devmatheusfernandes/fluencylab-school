import crypto from "node:crypto";
import { getEnv } from "@/lib/env/validation";

const ABACATEPAY_API_BASE_URL = "https://api.abacatepay.com/v1" as const;

export const ABACATEPAY_CONFIG = {
  BASE_URL: getEnv("NEXT_PUBLIC_APP_URL"),
  API_BASE_URL: ABACATEPAY_API_BASE_URL,
  WEBHOOK_SECRET: getEnv("ABACATEPAY_WEBHOOK_SECRET"),
  PUBLIC_KEY: getEnv("ABACATEPAY_PUBLIC_KEY"),
  PIX_EXPIRATION_DAYS: 7,
  get WEBHOOK_URL() {
    return `${this.BASE_URL}/api/payment/abacatepay/webhook`;
  },
} as const;

type AbacatePayOk<T> = { data: T; error: null };
type AbacatePayErr = { data?: null; error: string };
type AbacatePayResponse<T> = AbacatePayOk<T> | AbacatePayErr;

export type AbacatePayPixQrCode = {
  id: string;
  amount: number;
  status: "PENDING" | "EXPIRED" | "CANCELLED" | "PAID" | "REFUNDED";
  brCode?: string;
  brCodeBase64?: string;
  expiresAt?: string;
};

async function abacatepayPost<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const resp = await fetch(`${ABACATEPAY_CONFIG.API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getEnv("ABACATEPAY_API_KEY")}`,
    },
    body: JSON.stringify(body),
  });

  const json = (await resp.json()) as AbacatePayResponse<T>;

  if (!resp.ok || (json as AbacatePayErr).error) {
    const message =
      (json as AbacatePayErr).error ||
      `AbacatePay request failed (${resp.status})`;
    throw new Error(message);
  }

  return (json as AbacatePayOk<T>).data;
}

/**
 * Creates a PIX QRCode in AbacatePay.
 *
 * The API expects amount in centavos and expiresIn in seconds.
 * Description has a max length of 37 characters (extra characters are ignored by AbacatePay).
 */
export async function createAbacatePayPixQrCode(params: {
  amountCents: number;
  expiresInSeconds: number;
  description: string;
  metadata?: Record<string, unknown>;
  customer?: {
    name: string;
    cellphone: string;
    email: string;
    taxId: string;
  };
}) {
  const data = await abacatepayPost<AbacatePayPixQrCode>("/pixQrCode/create", {
    amount: params.amountCents,
    expiresIn: params.expiresInSeconds,
    description: params.description,
    metadata: params.metadata ?? {},
    ...(params.customer ? { customer: params.customer } : {}),
  });

  // AbacatePay may return `brCodeBase64` with a full data URL prefix.
  // Our UI expects a raw base64 payload.
  const rawBase64 = data.brCodeBase64?.startsWith("data:image/")
    ? data.brCodeBase64.split("base64,")[1]
    : data.brCodeBase64;

  return {
    id: data.id,
    status: data.status,
    brCode: data.brCode,
    brCodeBase64: rawBase64,
    expiresAt: data.expiresAt,
  };
}

/**
 * AbacatePay webhook security:
 * - Validate query param `webhookSecret`
 * - Validate HMAC SHA-256 base64 signature from header `X-Webhook-Signature`
 *
 * Reference: https://github.com/AbacatePay/documentation/blob/main/pages/webhooks.mdx
 */
export function verifyAbacatePayWebhookSecret(webhookSecret: string | null) {
  return webhookSecret === ABACATEPAY_CONFIG.WEBHOOK_SECRET;
}

export function verifyAbacatePaySignature(
  rawBody: string,
  signatureFromHeader: string,
) {
  const bodyBuffer = Buffer.from(rawBody, "utf8");
  const expectedSig = crypto
    .createHmac("sha256", ABACATEPAY_CONFIG.PUBLIC_KEY)
    .update(bodyBuffer)
    .digest("base64");

  const A = Buffer.from(expectedSig);
  const B = Buffer.from(signatureFromHeader);

  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

