"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";
import StarRating from "../../../components/StarRating";
import { ProfileStrength } from "../../../components/ProfileStrength";
import type { User, Review } from "../../../lib/types";

export default function PublicProfilePage(): JSX.Element {
  const { user: authUser } = useAuth();
  const { userId } = useParams() as { userId: string };
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [userRes, reviewsRes] = await Promise.all([
          api.get(`/profile/${userId}`),
          api.get(`/reviews/user/${userId}`)
        ]);
        setProfile(userRes.data?.data || null);
        setReviews(reviewsRes.data?.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    if (userId) {
      loadData();
    }
  }, [userId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8 flex justify-center items-center">
        <p className="text-slate-500 dark:text-slate-400 animate-pulse text-sm font-medium">Loading profile…</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8 flex justify-center items-center">
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm font-medium shadow-sm">
          {error || "Profile not found."}
        </div>
      </main>
    );
  }

  function roleBadgeClass(role: string): string {
    if (role === "FREELANCER") return "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
    if (role === "CUSTOMER") return "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30";
    return "bg-slate-100 dark:bg-slate-700/40 text-slate-500 border-slate-200 dark:border-slate-600";
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        
        {/* Profile Card */}
        <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left shadow-sm">
          {profile.avatarUrl ? (
             <img src={profile.avatarUrl} alt="avatar" className="w-20 h-20 rounded-full border-2 border-emerald-200 dark:border-emerald-500/30 object-cover" />
          ) : (
             <div className="w-20 h-20 shrink-0 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-3xl font-bold select-none">
                {profile.fullName[0]?.toUpperCase() ?? "?"}
             </div>
          )}
          
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{profile.fullName}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
               <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full border ${roleBadgeClass(profile.role)}`}>
                  {profile.role === "CUSTOMER" ? "CLIENT" : profile.role}
               </span>
               {profile.isVerified && (
                  <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold uppercase tracking-wider rounded-full">
                     ✓ Verified
                  </span>
               )}
            </div>
            
            <div className="pt-2 flex flex-col md:flex-row items-center justify-center md:justify-start gap-4">
               {profile.totalRatings && profile.totalRatings > 0 ? (
                 <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 inline-flex items-center gap-2">
                    <StarRating value={profile.rating || 0} readonly />
                    <span className="text-slate-900 dark:text-white font-semibold text-sm">{profile.rating?.toFixed(1)}</span>
                    <span className="text-slate-500 text-xs">({profile.totalRatings})</span>
                 </div>
               ) : (
                 <p className="text-slate-500 dark:text-slate-400 text-sm italic">No ratings yet.</p>
               )}
               
               {profile.createdAt && (
                 <>
                   <span className="hidden md:inline text-slate-300 dark:text-slate-700">•</span>
                   <span className="text-slate-500 dark:text-slate-400 text-sm">Member since {new Date(profile.createdAt).getFullYear()}</span>
                 </>
               )}
            </div>
            
            {(profile.githubUrl || profile.linkedinUrl) && (
               <div className="flex gap-4 pt-3 items-center justify-center md:justify-start">
                  {profile.linkedinUrl && (
                     <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-medium">
                        LinkedIn ↗
                     </a>
                  )}
                  {profile.githubUrl && (
                     <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-medium">
                        GitHub ↗
                     </a>
                  )}
               </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* About / Bio */}
            {profile.bio && (
              <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">About</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
              </section>
            )}

            {/* Portfolio */}
            {profile.freelancerProfile?.portfolioLinks?.length > 0 && (
               <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Portfolio</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {profile.freelancerProfile.portfolioLinks.map((link: any, i: number) => (
                        <a key={i} href={link.url} target="_blank" rel="noreferrer" className="block bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors">
                           <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1">{link.title}</h3>
                           <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 inline-block">View Project →</span>
                        </a>
                     ))}
                  </div>
               </section>
            )}

            {/* Reviews Feed */}
            <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reviews</h2>
          
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row gap-4">
                       <div className="flex-1">
                         <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                               {r.reviewer?.avatarUrl ? (
                                 <img src={r.reviewer.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" />
                               ) : (
                                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
                                    {r.reviewer?.fullName?.[0]}
                                 </div>
                               )}
                               <div className="flex flex-col">
                                 <span className="text-sm font-semibold text-slate-900 dark:text-white">{r.reviewer?.fullName}</span>
                                 <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                               </div>
                            </div>
                            <StarRating value={r.rating} readonly />
                         </div>
                         {r.job?.title && (
                           <div className="mb-3">
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/50 uppercase tracking-wider font-semibold truncate max-w-full inline-block">Job: {r.job.title}</span>
                           </div>
                         )}
                         {r.comment && <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{r.comment}</p>}
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700/50">
                   <span className="text-3xl block mb-2 opacity-50 grayscale">⭐</span>
                   <p className="text-slate-500 dark:text-slate-400 text-sm italic">No reviews yet.</p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6 md:col-span-1">
            {authUser?.id === profile.id && profile.role === "FREELANCER" && (
              <section className="bg-white dark:bg-[#111827] border border-emerald-200 dark:border-emerald-500/20 rounded-2xl shadow-sm p-5 space-y-4">
                 <div className="flex items-center justify-between">
                   <h2 className="text-sm font-bold text-slate-900 dark:text-white">Your Profile Strength</h2>
                   <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] uppercase font-semibold tracking-wider py-0.5 px-2 rounded">Private</span>
                 </div>
                 <ProfileStrength score={profile.freelancerProfile?.profileStrength || 0} />
              </section>
            )}

            {profile.role === "FREELANCER" && profile.freelancerProfile?.skills?.length > 0 && (
               <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
                 <h2 className="text-base font-bold text-slate-900 dark:text-white">Skills</h2>
                 <div className="flex flex-wrap gap-2">
                   {profile.freelancerProfile.skills.map((skill: string, i: number) => {
                     const hasBadge = profile.skillBadges?.some((b: any) => b.skill === skill);
                     return (
                       <span key={i} className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                         hasBadge 
                           ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40" 
                           : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600"
                       }`}>
                         {hasBadge && <span className="mr-1">✓</span>}
                         {skill}
                       </span>
                     )
                   })}
                 </div>
               </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
