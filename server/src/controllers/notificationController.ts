import type { Request, Response } from "express";
import { prisma } from "../services/postgres";

// GET /api/notifications — get my notifications
export async function getMyNotifications(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    res.json({ ok: true, data: { notifications, unreadCount } });
  } catch {
    res.status(500).json({
      ok: false,
      error: { message: "Failed to fetch notifications" },
    });
  }
}

// PATCH /api/notifications/:id/read — mark one as read
export async function markAsRead(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({
      ok: false,
      error: { message: "Failed to mark as read" },
    });
  }
}

// PATCH /api/notifications/read-all — mark all as read
export async function markAllRead(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.id;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({
      ok: false,
      error: { message: "Failed to mark all as read" },
    });
  }
}
