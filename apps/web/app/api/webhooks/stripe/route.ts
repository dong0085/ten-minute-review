import Stripe from "stripe";
import { jsonError, jsonOk } from "@/lib/api";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return jsonOk({ received: true });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return jsonError("Missing stripe-signature header", 400);
  }
  const payload = await request.text();
  const stripe = new Stripe(secretKey);
  try {
    stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid signature", 400);
  }
  return jsonOk({ received: true });
}
