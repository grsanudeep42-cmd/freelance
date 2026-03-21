import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { initiatePayment, releasePayment, getEscrow, getMyTransactions } from "../controllers/paymentController";

export const paymentRoutes = Router();

paymentRoutes.get("/my-transactions", authenticate, getMyTransactions);
paymentRoutes.get("/escrow/:jobId", authenticate, getEscrow);
paymentRoutes.post("/initiate", authenticate, initiatePayment);
paymentRoutes.post("/release", authenticate, releasePayment);
