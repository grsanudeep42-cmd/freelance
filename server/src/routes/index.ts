import { Router } from "express";
import { healthRoutes } from "./healthRoutes";
import { authRoutes } from "./authRoutes";
import { skillsRoutes } from "./skillsRoutes";
import { jobRoutes } from "./jobRoutes";
import { bidRoutes } from "./bidRoutes";
import { adminJobRoutes } from "./adminJobRoutes";
import { adminRoutes } from "./adminRoutes";
import { messageRoutes } from "./messageRoutes";
import { userRoutes } from "./userRoutes";
import { reviewRoutes } from "./reviewRoutes";
import { paymentRoutes } from "./paymentRoutes";
import { skillTestRoutes } from "./skillTestRoutes";
import { serviceRoutes } from "./serviceRoutes";
import { profileRoutes } from "./profileRoutes";

export const apiRoutes = Router();

apiRoutes.use("/auth",        authRoutes);
apiRoutes.use("/jobs",        jobRoutes);
apiRoutes.use("/bids",        bidRoutes);
apiRoutes.use("/admin-jobs",  adminJobRoutes);
apiRoutes.use("/admin",       adminRoutes);
apiRoutes.use("/",            skillsRoutes);
apiRoutes.use("/messages",    messageRoutes);
apiRoutes.use("/users",       userRoutes);
apiRoutes.use("/reviews",     reviewRoutes);
apiRoutes.use("/payments",    paymentRoutes);
apiRoutes.use("/skill-tests", skillTestRoutes);
apiRoutes.use("/services",    serviceRoutes);
apiRoutes.use("/profile",     profileRoutes);

export { healthRoutes };

