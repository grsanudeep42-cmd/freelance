import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { requireRole } from "../middlewares/requireRole";
import { UserRole } from "../generated/prisma";
import {
  getPublicServices,
  getServices,
  getMyServices,
  getMyOrders,
  createService,
  getServiceById,
  orderService,
  deliverService,
  completeServiceOrder,
} from "../controllers/serviceController";

export const serviceRoutes = Router();

// ─── Public routes (no auth) ──────────────────────────────────────────────────
serviceRoutes.get("/public",   getPublicServices);
serviceRoutes.get("/:id",      getServiceById);

// ─── Authenticated routes — specific before param ─────────────────────────────
serviceRoutes.get("/",                authenticate, getServices);
serviceRoutes.get("/my",              authenticate, requireRole([UserRole.FREELANCER]), getMyServices);
serviceRoutes.get("/orders/my",       authenticate, getMyOrders);
serviceRoutes.post("/",               authenticate, requireRole([UserRole.FREELANCER]), createService);
serviceRoutes.post("/:id/order",      authenticate, requireRole([UserRole.CUSTOMER]),  orderService);
serviceRoutes.put("/orders/:orderId/deliver",  authenticate, deliverService);
serviceRoutes.put("/orders/:orderId/complete", authenticate, completeServiceOrder);
