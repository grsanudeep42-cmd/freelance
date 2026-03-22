import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "../config/env";

// Initialize Razorpay — graceful fallback if keys missing
const getRazorpay = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
};

export type RazorpayOrder = {
  orderId: string;
  amount: number;
  currency: string;
  isMock: boolean;
};

// Create a Razorpay order (amount in INR)
export async function createRazorpayOrder(
  amountINR: number,
  currency: string,
  receipt: string
): Promise<RazorpayOrder> {
  const rzp = getRazorpay();

  // Mock mode if no keys
  if (!rzp || env.PAYMENT_MODE === "mock") {
    return {
      orderId: `mock_order_${Date.now()}`,
      amount: amountINR,
      currency,
      isMock: true,
    };
  }

  // Real Razorpay order
  // Razorpay requires amount in paise (multiply by 100)
  const order = await rzp.orders.create({
    amount: Math.round(amountINR * 100),
    currency,
    receipt: receipt.slice(0, 40), // max 40 chars
  });

  return {
    orderId: order.id,
    amount: amountINR,
    currency: order.currency,
    isMock: false,
  };
}

// Verify Razorpay payment signature
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;

  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}
