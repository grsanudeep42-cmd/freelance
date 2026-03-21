import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../services/postgres";
import { logger } from "../utils/logger";
import { calculateProfileStrength } from "../utils/profileStrength";

// Schema for updateMyProfile
const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  linkedinUrl: z.union([z.string().url(), z.literal("")]).optional(),
  githubUrl: z.union([z.string().url(), z.literal("")]).optional(),
  websiteUrl: z.union([z.string().url(), z.literal("")]).optional(),
  isAgeVerified: z.boolean().optional(),
  skills: z.array(z.string().max(30)).max(10).optional(),
  hourlyRate: z.number().min(50).max(50000).optional(),
  portfolioLinks: z.array(z.object({
    title: z.string().min(1).max(100),
    url: z.string().url()
  })).max(5).optional()
});

const SAFE_USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  avatarUrl: true,
  rating: true,
  totalRatings: true,
  creditBalance: true,
  isVerified: true,
  createdAt: true,
  bio: true,
  linkedinUrl: true,
  githubUrl: true,
  isAgeVerified: true
} as const;

export async function getMyProfile(req: Request, res: Response): Promise<void> {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ ok: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        ...SAFE_USER_SELECT,
        skillBadges: true,
        freelancerProfile: true
      }
    });

    if (!user) {
      res.status(401).json({ ok: false, error: { message: "User not found", code: "NOT_FOUND" } });
      return;
    }

    if (user.role === "FREELANCER" && !user.freelancerProfile) {
      // Create empty profile if not exists
      const newProfile = await prisma.freelancerProfile.create({
        data: { userId: user.id }
      });
      user.freelancerProfile = newProfile;
    }

    res.status(200).json({ ok: true, data: user });
  } catch (err) {
    logger.error("getMyProfile failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({
      ok: false,
      error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" }
    });
  }
}

export async function updateMyProfile(req: Request, res: Response): Promise<void> {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ ok: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const body = updateProfileSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { freelancerProfile: true }
    });

    if (!user) {
      res.status(401).json({ ok: false, error: { message: "User not found", code: "NOT_FOUND" } });
      return;
    }

    // Prepare user model updates
    const userUpdateData: any = {};
    if (body.fullName !== undefined) userUpdateData.fullName = body.fullName;
    if (body.bio !== undefined) userUpdateData.bio = body.bio;
    if (body.linkedinUrl !== undefined) userUpdateData.linkedinUrl = body.linkedinUrl === "" ? null : body.linkedinUrl;
    if (body.githubUrl !== undefined) userUpdateData.githubUrl = body.githubUrl === "" ? null : body.githubUrl;
    if (body.isAgeVerified !== undefined) userUpdateData.isAgeVerified = body.isAgeVerified;

    let updatedUser;
    
    if (Object.keys(userUpdateData).length > 0) {
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: userUpdateData,
        select: SAFE_USER_SELECT
      });
    } else {
      updatedUser = {
        id: user.id, fullName: user.fullName, email: user.email, role: user.role,
        avatarUrl: user.avatarUrl, rating: user.rating, totalRatings: user.totalRatings,
        creditBalance: user.creditBalance, isVerified: user.isVerified,
        createdAt: user.createdAt, bio: user.bio, linkedinUrl: user.linkedinUrl,
        githubUrl: user.githubUrl, isAgeVerified: user.isAgeVerified
      };
    }

    let updatedProfile = user.freelancerProfile;

    if (user.role === "FREELANCER") {
      const profileUpdateData: any = {};
      if (body.skills !== undefined) profileUpdateData.skills = body.skills;
      if (body.hourlyRate !== undefined) profileUpdateData.hourlyRate = body.hourlyRate;
      if (body.portfolioLinks !== undefined) profileUpdateData.portfolioLinks = body.portfolioLinks;
      if (body.websiteUrl !== undefined) profileUpdateData.websiteUrl = body.websiteUrl === "" ? null : body.websiteUrl;
      
      const newLinkedinUrl = userUpdateData.linkedinUrl !== undefined ? userUpdateData.linkedinUrl : user.linkedinUrl;
      const newGithubUrl = userUpdateData.githubUrl !== undefined ? userUpdateData.githubUrl : user.githubUrl;
      const newBio = userUpdateData.bio !== undefined ? userUpdateData.bio : user.bio;
      const newAgeVerified = userUpdateData.isAgeVerified !== undefined ? userUpdateData.isAgeVerified : user.isAgeVerified;

      // Calculate strength
      const profileToScore = {
        bio: newBio,
        skills: body.skills !== undefined ? body.skills : updatedProfile?.skills,
        hourlyRate: body.hourlyRate !== undefined ? body.hourlyRate : updatedProfile?.hourlyRate,
        portfolioLinks: body.portfolioLinks !== undefined ? body.portfolioLinks : (updatedProfile?.portfolioLinks as any[]),
        linkedinUrl: newLinkedinUrl,
        githubUrl: newGithubUrl,
        websiteUrl: body.websiteUrl !== undefined ? (body.websiteUrl === "" ? null : body.websiteUrl) : updatedProfile?.websiteUrl,
        isAgeVerified: newAgeVerified,
        avatarUrl: user.avatarUrl
      };
      
      const strength = calculateProfileStrength(profileToScore);
      profileUpdateData.profileStrength = strength;

      // Make sure we keep linkedinUrl, githubUrl, etc on the freelancerProfile in sync due to schema redundancies
      profileUpdateData.linkedinUrl = newLinkedinUrl;
      profileUpdateData.githubUrl = newGithubUrl;
      profileUpdateData.bio = newBio || "";
      profileUpdateData.isAgeVerified = newAgeVerified;

      updatedProfile = await prisma.freelancerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          ...profileUpdateData
        },
        update: profileUpdateData
      });
    }

    res.status(200).json({ ok: true, data: { ...updatedUser, freelancerProfile: updatedProfile } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.errors[0]?.message || "Validation Error", code: "BAD_REQUEST" } });
      return;
    }
    logger.error("updateMyProfile failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({
      ok: false,
      error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" }
    });
  }
}

const PUBLIC_USER_SELECT = {
  id: true,
  fullName: true,
  role: true,
  avatarUrl: true,
  rating: true,
  totalRatings: true,
  isVerified: true,
  createdAt: true,
  bio: true,
  linkedinUrl: true,
  githubUrl: true
} as const;

export async function getPublicProfile(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...PUBLIC_USER_SELECT,
        skillBadges: true,
        freelancerProfile: true
      }
    });

    if (!user) {
      res.status(404).json({ ok: false, error: { message: "User not found", code: "NOT_FOUND" } });
      return;
    }

    res.status(200).json({ ok: true, data: user });
  } catch (err) {
    logger.error("getPublicProfile failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({
      ok: false,
      error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" }
    });
  }
}
