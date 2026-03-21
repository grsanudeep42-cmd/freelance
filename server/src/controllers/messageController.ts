import { z } from "zod";
import type { Request, Response } from "express";
import { prisma } from "../services/postgres";
import { logger } from "../utils/logger";
import { groqGuard } from "../services/groqGuard";

const sendSchema = z.object({
  receiverId: z.string().uuid(),
  jobId: z.string().uuid().optional(),
  content: z.string().min(1).max(2000),
});

export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const senderId = req.user!.id;
    const body = sendSchema.safeParse(req.body);

    if (!body.success) {
      res.status(400).json({
        ok: false,
        error: { message: "Invalid payload", code: "BAD_REQUEST", details: body.error.flatten() }
      });
      return;
    }

    const { receiverId, jobId, content } = body.data;

    if (senderId === receiverId) {
      res.status(400).json({ 
        ok: false, 
        error: { message: "Cannot send message to yourself", code: "BAD_REQUEST" } 
      });
      return;
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      res.status(404).json({ 
        ok: false, 
        error: { message: "Receiver not found", code: "NOT_FOUND" } 
      });
      return;
    }

    // 1. Phishing Scan
    const scanResult = await groqGuard.scanMessage(content);

    // 2. Block Logic
    if (!scanResult.safe) {
      // Save blocked message
      await prisma.message.create({
        data: {
          senderId,
          receiverId,
          jobId,
          content,
          isBlocked: true,
          flagReason: scanResult.reason
        }
      });

      // Register AI Flag
      await prisma.aiFlag.create({
        data: {
          userId: senderId,
          reason: scanResult.reason ?? "Flagged by AI Guard",
          severity: scanResult.severity,
        }
      });

      // Auto-suspend check
      const flagCount = await prisma.aiFlag.count({
        where: { userId: senderId, resolved: false }
      });

      if (flagCount >= 3) {
        await prisma.user.update({
          where: { id: senderId },
          data: { isActive: false }
        });
        logger.warn("User auto-suspended for 3+ AI flags", { userId: senderId });
      }

      res.status(400).json({ 
        ok: false, 
        error: { message: `Message blocked: ${scanResult.reason}`, code: "MESSAGE_BLOCKED" } 
      });
      return;
    }

    // 3. Safe transmission
    const message = await prisma.message.create({
      data: { senderId, receiverId, jobId, content }
    });

    res.status(201).json({ ok: true, data: message });
  } catch (err) {
    logger.error("sendMessage failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({
      ok: false,
      error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" }
    });
  }
}

export async function getConversation(req: Request, res: Response): Promise<void> {
  try {
    const myId = req.user!.id;
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ ok: false, error: { message: "Missing userId", code: "BAD_REQUEST" }});
      return;
    }

    const messages = await prisma.message.findMany({
      where: {
        isBlocked: false,
        OR: [
          { senderId: myId, receiverId: userId },
          { senderId: userId, receiverId: myId }
        ]
      },
      orderBy: { createdAt: "asc" },
      take: 100
    });

    res.status(200).json({ ok: true, data: messages });
  } catch (err) {
    logger.error("getConversation failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({ ok: false, error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" }});
  }
}

export async function getConversations(req: Request, res: Response): Promise<void> {
  try {
    const myId = req.user!.id;

    const messages = await prisma.message.findMany({
      where: {
        isBlocked: false,
        OR: [
          { senderId: myId },
          { receiverId: myId }
        ]
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        receiver: { select: { id: true, fullName: true, avatarUrl: true } }
      }
    });

    const conversationMap = new Map<string, any>();

    for (const msg of messages) {
      const otherUser = msg.senderId === myId ? msg.receiver : msg.sender;
      if (!otherUser) continue; // safety check

      // Keep only the most recent message per distinct user
      if (!conversationMap.has(otherUser.id)) {
        conversationMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: msg.content.substring(0, 50) + (msg.content.length > 50 ? "…" : ""),
          updatedAt: msg.createdAt
        });
      }
    }

    const sortedConvos = Array.from(conversationMap.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );

    res.status(200).json({ ok: true, data: sortedConvos });
  } catch (err) {
    logger.error("getConversations failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({ ok: false, error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" }});
  }
}
