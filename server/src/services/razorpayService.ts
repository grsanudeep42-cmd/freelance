import Razorpay from "razorpay";
import { env } from "../config/env";

export const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID ?? "rzp_placeholder",
  key_secret: env.RAZORPAY_KEY_SECRET ?? "placeholder_secret",
});
