import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import {
  getMyNotifications,
  markAsRead,
  markAllRead,
} from "../controllers/notificationController";

export const notificationRoutes = Router();

notificationRoutes.get("/", authenticate, getMyNotifications);
notificationRoutes.patch("/read-all", authenticate, markAllRead);
notificationRoutes.patch("/:id/read", authenticate, markAsRead);
