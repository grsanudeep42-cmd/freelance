import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { sendMessage, getConversations, getConversation } from "../controllers/messageController";

export const messageRoutes = Router();

messageRoutes.use(authenticate);

messageRoutes.post("/", sendMessage);
messageRoutes.get("/conversations", getConversations);
messageRoutes.get("/:userId", getConversation);
