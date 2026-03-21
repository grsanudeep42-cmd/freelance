export function calculateProfileStrength(profile: {
  bio?: string | null;
  skills?: string[];
  hourlyRate?: number | null;
  portfolioLinks?: any[];
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  isAgeVerified?: boolean;
  avatarUrl?: string | null;
}): number {
  let score = 0;
  
  // Bio: 20 points (min 50 chars for full points)
  if (profile.bio && profile.bio.length >= 50) score += 20;
  else if (profile.bio && profile.bio.length >= 20) score += 10;
  
  // Skills: 20 points (min 3 skills for full points)
  if (profile.skills && profile.skills.length >= 3) score += 20;
  else if (profile.skills && profile.skills.length >= 1) score += 10;
  
  // Hourly rate: 10 points
  if (profile.hourlyRate && profile.hourlyRate > 0) score += 10;
  
  // Portfolio links: 20 points (min 1 for full points)
  if (profile.portfolioLinks && profile.portfolioLinks.length >= 2) score += 20;
  else if (profile.portfolioLinks && profile.portfolioLinks.length >= 1) score += 10;
  
  // LinkedIn: 10 points
  if (profile.linkedinUrl) score += 10;
  
  // GitHub: 10 points
  if (profile.githubUrl) score += 10;
  
  // Age verified: 5 points
  if (profile.isAgeVerified) score += 5;
  
  // Avatar: 5 points
  if (profile.avatarUrl) score += 5;
  
  return Math.min(score, 100);
}
