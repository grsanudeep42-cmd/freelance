import type { Request, Response } from "express";
import { z } from "zod";
import { ServiceOrderStatus, UserRole } from "../generated/prisma";
import { prisma } from "../services/postgres";
import { logger } from "../utils/logger";

// ─── Helpers ──────────────────────────────────────────────────────────────────

class HttpError extends Error {
  statusCode: number;
  code: string;
  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function err(res: Response, statusCode: number, code: string, message: string): void {
  res.status(statusCode).json({ ok: false, error: { message, code } });
}

function requireUser(req: Request): { id: string; role: UserRole } | null {
  const user = req.user;
  if (!user) return null;
  return { id: user.id, role: user.role as unknown as UserRole };
}

const ALLOWED_CATEGORIES = [
  "web-development", "graphic-design", "content-writing", "digital-marketing",
  "video-editing", "ui-ux-design", "mobile-app-dev", "copywriting",
  "data-entry", "virtual-assistance", "social-media", "software-dev",
  "ai-ml", "photography", "tutoring",
] as const;

// ─── Validation Schemas ───────────────────────────────────────────────────────

const createServiceSchema = z.object({
  title:       z.string().min(10).max(100),
  description: z.string().min(30).max(1000),
  category:    z.string().refine((v) => (ALLOWED_CATEGORIES as readonly string[]).includes(v), {
    message: "Invalid category",
  }),
  subcategory:  z.string().optional(),
  price:        z.number().min(100).max(500_000),
  deliveryDays: z.number().int().min(1).max(90),
  revisions:    z.number().int().min(0).max(10),
  includes:     z.array(z.string().min(5)).length(3),
});

const orderServiceSchema = z.object({
  requirements: z.string().optional(),
});

const deliverServiceSchema = z.object({
  deliverable: z.string().min(10),
});

// ─── Public: GET /api/services/public ────────────────────────────────────────

export async function getPublicServices(req: Request, res: Response): Promise<void> {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id:          true,
        title:       true,
        category:    true,
        subcategory: true,
        price:       true,
        deliveryDays:true,
        revisions:   true,
        includes:    true,
        createdAt:   true,
        freelancer: {
          select: {
            id:           true,
            fullName:     true,
            rating:       true,
            totalRatings: true,
          },
        },
      },
    });
    res.json({ ok: true, data: services });
  } catch (error) {
    logger.error("getPublicServices error:", error);
    err(res, 500, "INTERNAL_SERVER_ERROR", "Could not fetch services");
  }
}

// ─── Auth: GET /api/services (listings for logged-in users) ──────────────────

export async function getServices(req: Request, res: Response): Promise<void> {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id:           true,
        title:        true,
        category:     true,
        subcategory:  true,
        price:        true,
        deliveryDays: true,
        revisions:    true,
        includes:     true,
        createdAt:    true,
        freelancer: {
          select: {
            id:           true,
            fullName:     true,
            rating:       true,
            totalRatings: true,
          },
        },
      },
    });
    res.json({ ok: true, data: services });
  } catch (error) {
    logger.error("getServices error:", error);
    err(res, 500, "INTERNAL_SERVER_ERROR", "Could not fetch services");
  }
}

// ─── GET /api/services/my (FREELANCER only) ───────────────────────────────────

export async function getMyServices(req: Request, res: Response): Promise<void> {
  const authed = requireUser(req);
  if (!authed) { err(res, 401, "UNAUTHORIZED", "Not authenticated"); return; }

  try {
    const services = await prisma.service.findMany({
      where:   { freelancerId: authed.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
    });
    res.json({ ok: true, data: services });
  } catch (error) {
    logger.error("getMyServices error:", error);
    err(res, 500, "INTERNAL_SERVER_ERROR", "Could not fetch your services");
  }
}

// ─── GET /api/services/:id (public) ──────────────────────────────────────────

export async function getServiceById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const service = await prisma.service.findUnique({
      where:   { id },
      include: {
        freelancer: {
          select: {
            id:           true,
            fullName:     true,
            rating:       true,
            totalRatings: true,
            createdAt:    true,
          },
        },
        _count: { select: { orders: true } },
      },
    });
    if (!service || !service.isActive) {
      err(res, 404, "NOT_FOUND", "Service not found"); return;
    }
    res.json({ ok: true, data: service });
  } catch (error) {
    logger.error("getServiceById error:", error);
    err(res, 500, "INTERNAL_SERVER_ERROR", "Could not fetch service");
  }
}

// ─── POST /api/services (FREELANCER only) ────────────────────────────────────

export async function createService(req: Request, res: Response): Promise<void> {
  const authed = requireUser(req);
  if (!authed) { err(res, 401, "UNAUTHORIZED", "Not authenticated"); return; }

  const parsed = createServiceSchema.safeParse(req.body);
  if (!parsed.success) {
    err(res, 400, "BAD_REQUEST", parsed.error.errors[0]?.message ?? "Invalid input");
    return;
  }

  try {
    const service = await prisma.service.create({
      data: {
        freelancerId: authed.id,
        ...parsed.data,
      },
    });
    res.status(201).json({ ok: true, data: service });
  } catch (error) {
    logger.error("createService error:", error);
    err(res, 500, "INTERNAL_SERVER_ERROR", "Could not create service");
  }
}

// ─── POST /api/services/:id/order (CLIENT only) ──────────────────────────────

export async function orderService(req: Request, res: Response): Promise<void> {
  const authed = requireUser(req);
  if (!authed) { err(res, 401, "UNAUTHORIZED", "Not authenticated"); return; }

  const { id: serviceId } = req.params;
  const parsed = orderServiceSchema.safeParse(req.body);
  if (!parsed.success) {
    err(res, 400, "BAD_REQUEST", "Invalid input"); return;
  }

  try {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || !service.isActive) {
      err(res, 404, "NOT_FOUND", "Service not found"); return;
    }
    if (service.freelancerId === authed.id) {
      err(res, 400, "BAD_REQUEST", "You cannot order your own service"); return;
    }

    const order = await prisma.serviceOrder.create({
      data: {
        serviceId,
        clientId:     authed.id,
        freelancerId: service.freelancerId,
        price:        service.price,
        requirements: parsed.data.requirements,
        status:       ServiceOrderStatus.IN_PROGRESS,
      },
      include: {
        service:    { select: { title: true } },
        client:     { select: { fullName: true } },
        freelancer: { select: { fullName: true } },
      },
    });

    res.status(201).json({ ok: true, data: order });
  } catch (error) {
    logger.error("orderService error:", error);
    err(res, 500, "INTERNAL_SERVER_ERROR", "Could not create order");
  }
}

// ─── PUT /api/services/orders/:orderId/deliver ────────────────────────────────

export async function deliverService(req: Request, res: Response): Promise<void> {
  const authed = requireUser(req);
  if (!authed) { err(res, 401, "UNAUTHORIZED", "Not authenticated"); return; }

  const { orderId } = req.params;
  const parsed = deliverServiceSchema.safeParse(req.body);
  if (!parsed.success) {
    err(res, 400, "BAD_REQUEST", "Deliverable must be at least 10 characters"); return;
  }

  try {
    const order = await prisma.serviceOrder.findUnique({ where: { id: orderId } });
    if (!order) { err(res, 404, "NOT_FOUND", "Order not found"); return; }
    if (order.freelancerId !== authed.id) {
      err(res, 403, "FORBIDDEN", "Only the assigned freelancer can deliver"); return;
    }
    if (order.status !== ServiceOrderStatus.IN_PROGRESS) {
      err(res, 400, "BAD_REQUEST", "Order is not in progress"); return;
    }

    const updated = await prisma.serviceOrder.update({
      where: { id: orderId },
      data:  { status: ServiceOrderStatus.DELIVERED, deliverable: parsed.data.deliverable },
    });
    res.json({ ok: true, data: updated });
  } catch (error) {
    logger.error("deliverService error:", error);
    err(res, 500, "INTERNAL_SERVER_ERROR", "Could not deliver order");
  }
}

// ─── PUT /api/services/orders/:orderId/complete ───────────────────────────────

export async function completeServiceOrder(req: Request, res: Response): Promise<void> {
  const authed = requireUser(req);
  if (!authed) { err(res, 401, "UNAUTHORIZED", "Not authenticated"); return; }

  const { orderId } = req.params;

  try {
    const order = await prisma.serviceOrder.findUnique({ where: { id: orderId } });
    if (!order) { err(res, 404, "NOT_FOUND", "Order not found"); return; }
    if (order.clientId !== authed.id) {
      err(res, 403, "FORBIDDEN", "Only the client can complete the order"); return;
    }
    if (order.status !== ServiceOrderStatus.DELIVERED) {
      err(res, 400, "BAD_REQUEST", "Order has not been delivered yet"); return;
    }

    const updated = await prisma.serviceOrder.update({
      where: { id: orderId },
      data:  { status: ServiceOrderStatus.COMPLETED },
    });
    res.json({ ok: true, data: updated });
  } catch (error) {
    logger.error("completeServiceOrder error:", error);
    err(res, 500, "INTERNAL_SERVER_ERROR", "Could not complete order");
  }
}

// ─── GET /api/services/orders/my ─────────────────────────────────────────────

export async function getMyOrders(req: Request, res: Response): Promise<void> {
  const authed = requireUser(req);
  if (!authed) { err(res, 401, "UNAUTHORIZED", "Not authenticated"); return; }

  try {
    const [clientOrders, freelancerOrders] = await Promise.all([
      prisma.serviceOrder.findMany({
        where:   { clientId: authed.id },
        orderBy: { createdAt: "desc" },
        include: {
          service:    { select: { title: true, category: true } },
          freelancer: { select: { id: true, fullName: true } },
        },
      }),
      prisma.serviceOrder.findMany({
        where:   { freelancerId: authed.id },
        orderBy: { createdAt: "desc" },
        include: {
          service: { select: { title: true, category: true } },
          client:  { select: { id: true, fullName: true } },
        },
      }),
    ]);
    res.json({ ok: true, data: { clientOrders, freelancerOrders } });
  } catch (error) {
    logger.error("getMyOrders error:", error);
    err(res, 500, "INTERNAL_SERVER_ERROR", "Could not fetch orders");
  }
}
