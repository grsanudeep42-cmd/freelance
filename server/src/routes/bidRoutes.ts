import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { 
  acceptBid, 
  applyBid, 
  getBidsForJob,
  getMyBids 
} from "../controllers/bidController";

export const bidRoutes = Router();

bidRoutes.get("/", authenticate, getMyBids);
bidRoutes.post("/", authenticate, applyBid);
bidRoutes.get("/job/:jobId", authenticate, getBidsForJob);
bidRoutes.post("/:bidId/accept", authenticate, acceptBid);

