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
      <main className="min-h-screen bg-[#0f172a] px-4 py-10 flex justify-center">
        <p className="text-slate-400 animate-pulse">Loading profile…</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-[#0f172a] px-4 py-10 flex justify-center">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-300">
          {error || "Profile not found."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f172a] px-4 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        
        {/* Profile Card */}
        <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-8 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left shadow-xl">
          {profile.avatarUrl ? (
             <img src={profile.avatarUrl} alt="avatar" className="w-24 h-24 rounded-full border-2 border-slate-600 object-cover" />
          ) : (
             <div className="w-24 h-24 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold select-none drop-shadow">
                {profile.fullName[0]?.toUpperCase() ?? "?"}
             </div>
          )}
          
          <div className="flex-1 space-y-2">
            <h1 className="text-white text-2xl font-bold tracking-tight mb-1">{profile.fullName}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
               <span className="px-3 py-1 bg-slate-700/50 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-full border border-slate-600">
                  {profile.role}
               </span>
               {profile.isVerified && (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-full border border-emerald-500/30">
                     ✓ Verified
                  </span>
               )}
            </div>
            
            <div className="pt-2 flex flex-col md:flex-row items-center gap-4">
               {profile.totalRatings && profile.totalRatings > 0 ? (
                 <div className="flex items-center gap-2 bg-[#0b1220] px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-inner">
                    <StarRating value={profile.rating || 0} readonly />
                    <span className="text-slate-200 font-semibold">{profile.rating?.toFixed(1)}</span>
                    <span className="text-slate-500 text-sm">({profile.totalRatings} reviews)</span>
                 </div>
               ) : (
                 <p className="text-slate-500 text-sm italic">No ratings yet.</p>
               )}
               
               {profile.createdAt && (
                 <>
                   <span className="hidden md:inline text-slate-600">•</span>
                   <span className="text-slate-400 text-sm">Member since {new Date(profile.createdAt).getFullYear()}</span>
                 </>
               )}
            </div>
            
            {(profile.githubUrl || profile.linkedinUrl) && (
               <div className="flex gap-4 pt-3 items-center justify-center md:justify-start">
                  {profile.linkedinUrl && (
                     <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-400 transition-colors">
                        LinkedIn ↗
                     </a>
                  )}
                  {profile.githubUrl && (
                     <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
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
              <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 space-y-4 shadow-xl">
                <h2 className="text-white text-xl font-bold">About</h2>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
              </section>
            )}

            {/* Portfolio */}
            {profile.freelancerProfile?.portfolioLinks?.length > 0 && (
               <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 space-y-4 shadow-xl">
                  <h2 className="text-white text-xl font-bold">Portfolio</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {profile.freelancerProfile.portfolioLinks.map((link: any, i: number) => (
                        <a key={i} href={link.url} target="_blank" rel="noreferrer" className="block p-4 rounded-xl border border-slate-700/60 bg-[#0b1220] hover:border-slate-500 hover:bg-slate-800/80 transition-all card-hover">
                           <h3 className="text-white font-medium text-sm mb-1">{link.title}</h3>
                           <span className="text-indigo-400 text-xs font-semibold">View Project &rarr;</span>
                        </a>
                     ))}
                  </div>
               </section>
            )}

            {/* Reviews Feed */}
            <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 space-y-6 shadow-xl">
              <h2 className="text-white text-xl font-bold">Reviews</h2>
          
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="p-5 bg-[#0b1220] rounded-xl border border-slate-700/50 shadow-sm flex flex-col sm:flex-row gap-4 transition-all hover:border-slate-500/50">
                   <div className="flex-1">
                     <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                           {r.reviewer?.avatarUrl ? (
                             <img src={r.reviewer.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full border border-slate-600" />
                           ) : (
                             <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                                {r.reviewer?.fullName?.[0]}
                             </div>
                           )}
                           <span className="text-white font-medium">{r.reviewer?.fullName}</span>
                           <span className="text-slate-500 text-xs px-2 border-l border-slate-700">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <StarRating value={r.rating} readonly />
                     </div>
                     {r.job?.title && (
                       <p className="text-slate-500 text-xs mb-3 font-medium bg-slate-800/30 w-fit px-2 py-0.5 rounded border border-slate-700/30">Job: {r.job.title}</p>
                     )}
                     {r.comment && <p className="text-slate-300 text-sm leading-relaxed">{r.comment}</p>}
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-700/30 bg-[#0b1220] p-8 text-center">
               <span className="text-3xl block mb-2 opacity-40">⭐</span>
               <p className="text-slate-500 italic">This user hasn't received any reviews yet.</p>
            </div>
          )}
        </section>
        </div> {/* end col-span-2 */}

        {/* Sidebar Info */}
        <div className="space-y-6 md:col-span-1">
          {authUser?.id === profile.id && profile.role === "FREELANCER" && (
            <section className="rounded-2xl border border-indigo-500/30 bg-[#1e293b] p-6 space-y-4 shadow-xl">
               <h2 className="text-white text-sm font-bold flex items-center justify-between">
                 Your Profile Strength
                 <span className="text-[10px] font-normal uppercase tracking-wider text-slate-400 py-0.5 px-2 bg-slate-800 rounded">Private</span>
               </h2>
               <ProfileStrength score={profile.freelancerProfile?.profileStrength || 0} />
            </section>
          )}

          {profile.role === "FREELANCER" && profile.freelancerProfile?.skills?.length > 0 && (
             <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 space-y-4 shadow-xl">
               <h2 className="text-white text-lg font-bold">Skills</h2>
               <div className="flex flex-wrap gap-2">
                 {profile.freelancerProfile.skills.map((skill: string, i: number) => {
                   const hasBadge = profile.skillBadges?.some((b: any) => b.skill === skill);
                   return (
                     <span key={i} className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                       hasBadge 
                         ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                         : "bg-slate-700/50 text-slate-300 border-slate-600"
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
