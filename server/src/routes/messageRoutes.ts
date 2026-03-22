import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/authenticate";
import { validate } from "../middlewares/validate";
import { sendMessage, getConversations, getConversation } from "../controllers/messageController";

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const sendMessageSchema = z.object({
  receiverId: z.string().uuid("Invalid receiver ID"),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message too long"),
  jobId: z.string().uuid().optional(),
});

// ─── Routes ──────────────────────────────────────────────────────────────────

export const messageRoutes = Router();

messageRoutes.use(authenticate);

messageRoutes.post("/", validate(sendMessageSchema), sendMessage);
messageRoutes.get("/conversations", getConversations);
messageRoutes.get("/:userId", getConversation);
