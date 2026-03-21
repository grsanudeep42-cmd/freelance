import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  isMock: boolean;
}

export const paymentService = {
  async createOrder(amount: number, currency: string, receipt: string): Promise<PaymentOrder> {
    if (env.PAYMENT_MODE === "razorpay") {
      // Stub for real Razorpay SDK call
      throw new Error("Razorpay integration not completely active yet.");
    }

    // Mock mode
    return {
      orderId: `mock_order_${uuidv4()}`,
      amount,
      currency,
      isMock: true
    };
  },

  async verifyPayment(orderId: string, paymentId: string, signature: string): Promise<boolean> {
    if (env.PAYMENT_MODE === "razorpay") {
      // Stub for real verification
      throw new Error("Razorpay integration not completely active yet.");
    }
    
    // Mock mode always true
    return true;
  }
};
