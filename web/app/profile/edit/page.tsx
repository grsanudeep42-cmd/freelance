"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { api } from "../../../lib/api";
import { ProfileStrength } from "../../../components/ProfileStrength";
import StarRating from "../../../components/StarRating";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Raw user data from DB
  const [user, setUser] = useState<any>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  
  // Social Links
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Freelancer specific
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [hourlyRate, setHourlyRate] = useState<number | "">("");
  const [portfolioLinks, setPortfolioLinks] = useState<{title: string, url: string}[]>([]);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/profile/me");
      const d = res.data?.data;
      if (!d) throw new Error("Could not load profile");
      
      setUser(d);
      setFullName(d.fullName || "");
      setBio(d.bio || "");
      setIsAgeVerified(d.isAgeVerified || false);
      setLinkedinUrl(d.linkedinUrl || "");
      setGithubUrl(d.githubUrl || "");

      if (d.role === "FREELANCER" && d.freelancerProfile) {
        setSkills(d.freelancerProfile.skills || []);
        setHourlyRate(d.freelancerProfile.hourlyRate || "");
        setPortfolioLinks(d.freelancerProfile.portfolioLinks || []);
        setWebsiteUrl(d.freelancerProfile.websiteUrl || "");
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !skills.includes(val) && skills.length < 10) {
        setSkills([...skills, val]);
        setSkillInput("");
      }
    }
  };

  const removeSkill = (sk: string) => {
    setSkills(skills.filter(s => s !== sk));
  };

  const addPortfolioLink = () => {
    if (portfolioLinks.length < 5) {
      setPortfolioLinks([...portfolioLinks, { title: "", url: "" }]);
    }
  };

  const updatePortfolioLink = (index: number, field: "title" | "url", value: string) => {
    const fresh = [...portfolioLinks];
    fresh[index][field] = value;
    setPortfolioLinks(fresh);
  };

  const removePortfolioLink = (index: number) => {
    setPortfolioLinks(portfolioLinks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload: any = {
        fullName,
        bio,
        linkedinUrl: linkedinUrl || "",
        githubUrl: githubUrl || "",
        isAgeVerified
      };

      if (user?.role === "FREELANCER") {
        payload.skills = skills;
        payload.hourlyRate = hourlyRate === "" ? undefined : Number(hourlyRate);
        payload.websiteUrl = websiteUrl || "";
        // filter out empty portfolio links
        payload.portfolioLinks = portfolioLinks.filter(p => p.title.trim() && p.url.trim());
      }

      await api.put("/profile/me", payload);
      showToast("Profile updated!");
      loadProfile(); // reload to get updated strength score and canonical data
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-appBg px-4 py-8 flex items-center justify-center">
          <p className="text-slate-400 animate-pulse">Loading profile...</p>
        </main>
      </ProtectedRoute>
    );
  }

  const isFreelancer = user?.role === "FREELANCER";
  // Fallback data for live preview if not saved yet
  const liveStrength = isFreelancer ? (user?.freelancerProfile?.profileStrength || 0) : 0;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-appBg px-4 py-8 page-enter relative">
        
        {/* TOAST */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg font-medium animate-in slide-in-from-bottom-5">
            {toastMessage}
          </div>
        )}

        <div className="mx-auto w-full max-w-6xl space-y-6">
          <header className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-white tracking-tight">Edit Profile</h1>
              <p className="mt-1 text-slate-400 text-sm">Keep your profile updated to stand out.</p>
            </div>
            <button
               onClick={handleSave}
               disabled={saving}
               className="btn-primary py-2 px-6 rounded-xl shrink-0 disabled:opacity-50"
            >
               {saving ? "Saving..." : "Save Profile"}
            </button>
          </header>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* L E F T :  L I V E   P R E V I E W */}
            <div className="lg:col-span-1 space-y-6 sticky top-24">
               <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-600/20" />
                 
                 <div className="relative pt-8 flex flex-col items-center text-center">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="avatar" className="w-24 h-24 rounded-full border-4 border-[#1e293b] object-cover shadow-lg" />
                    ) : (
                      <div className="w-24 h-24 rounded-full border-4 border-[#1e293b] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                        {fullName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-2 font-medium">Image upload coming soon</p>
                    
                    <h2 className="text-white text-xl font-bold mt-4 line-clamp-1">{fullName || "Your Name"}</h2>
                    
                    <span className={`mt-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${isFreelancer ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"}`}>
                       {isFreelancer ? "FREELANCER" : "CLIENT"}
                    </span>

                    {(user?.totalRatings ?? 0) > 0 ? (
                      <div className="flex items-center gap-1.5 mt-4">
                        <StarRating value={user?.rating || 0} readonly />
                        <span className="text-slate-300 text-sm font-semibold">{user?.rating?.toFixed(1)}</span>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs italic mt-4">No ratings yet</p>
                    )}
                 </div>

                 {isFreelancer && (
                    <div className="mt-8 pt-6 border-t border-slate-700/50 space-y-6">
                      <ProfileStrength score={liveStrength} />
                      
                      {skills.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Top Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {skills.slice(0, 5).map((sk, i) => (
                               <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 border border-slate-700/60 rounded text-xs font-medium">
                                 {sk}
                               </span>
                            ))}
                            {skills.length > 5 && (
                              <span className="px-2 py-1 bg-transparent text-slate-500 text-xs font-medium">+{skills.length - 5} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                 )}

                 <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                   <p className="text-blue-300 text-xs font-medium">ℹ️ Your profile is public. Clients can view this card and the details you provide.</p>
                 </div>
               </div>
            </div>

            {/* R I G H T :  E D I T   F O R M */}
            <div className="lg:col-span-2 space-y-6">
               
               {/* SECTION 1: Basic Info */}
               <section className="glass-card p-6 space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                    <h2 className="text-white font-bold text-lg">Basic Info</h2>
                  </div>

                  <div>
                     <label className="block text-slate-400 text-sm font-medium mb-1.5">Full Name</label>
                     <input 
                       type="text" 
                       value={fullName}
                       onChange={(e) => setFullName(e.target.value)}
                       className="w-full bg-[#0b1220] border border-slate-700/60 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                     />
                  </div>

                  <div>
                     <label className="flex items-baseline justify-between text-slate-400 text-sm font-medium mb-1.5">
                       <span>Bio / About Me</span>
                       <span className={`text-xs ${bio.length > 500 ? "text-red-400" : "text-slate-500"}`}>{bio.length}/500</span>
                     </label>
                     <textarea 
                       value={bio}
                       onChange={(e) => setBio(e.target.value)}
                       placeholder="Tell clients what makes you great..."
                       className="w-full h-32 bg-[#0b1220] border border-slate-700/60 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                     />
                     <p className="text-slate-500 text-xs mt-1.5">A good bio of 50+ chars increases your profile strength.</p>
                  </div>

                  <div className="pt-2">
                     <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-700/50 bg-[#0f172a] cursor-pointer hover:border-slate-600 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={isAgeVerified}
                          onChange={(e) => setIsAgeVerified(e.target.checked)}
                          className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                        />
                        <div>
                          <p className="text-white text-sm font-semibold">I confirm I am 18 years or older</p>
                          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                            Required for financial transactions on SkillBridge as per Indian law. 
                            Misrepresenting your age may result in immediate account suspension and withholding of escrowed funds.
                          </p>
                        </div>
                     </label>
                  </div>
               </section>

               {/* SECTION 2: Skills & Rate (FREELANCER ONLY) */}
               {isFreelancer && (
                  <section className="glass-card p-6 space-y-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                      <h2 className="text-white font-bold text-lg">Skills & Rates</h2>
                    </div>

                    <div>
                      <label className="flex justify-between items-baseline mb-1.5">
                        <span className="text-slate-400 text-sm font-medium">Skills</span>
                        <span className="text-slate-500 text-xs">{skills.length}/10 max</span>
                      </label>
                      <div className="w-full bg-[#0b1220] border border-slate-700/60 rounded-xl p-2 focus-within:border-emerald-500/50 transition-colors flex flex-wrap gap-2 items-center min-h-[50px]">
                         {skills.map(sk => (
                            <span key={sk} className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg text-sm text-emerald-300 border border-slate-700">
                               {sk}
                               <button onClick={() => removeSkill(sk)} className="text-slate-400 hover:text-red-400">&times;</button>
                            </span>
                         ))}
                         {skills.length < 10 && (
                           <input 
                             type="text"
                             value={skillInput}
                             onChange={(e) => setSkillInput(e.target.value)}
                             onKeyDown={handleAddSkill}
                             placeholder={skills.length === 0 ? "Type a skill and press Enter..." : "Add another..."}
                             className="flex-1 min-w-[120px] bg-transparent text-white px-2 py-1 outline-none text-sm placeholder:text-slate-600"
                           />
                         )}
                      </div>
                    </div>

                    <div>
                       <label className="block text-slate-400 text-sm font-medium mb-1.5">Hourly Rate (₹)</label>
                       <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                         <input 
                           type="number"
                           min="50"
                           max="50000"
                           value={hourlyRate}
                           onChange={(e) => setHourlyRate(e.target.value === "" ? "" : Number(e.target.value))}
                           placeholder="e.g. 500"
                           className="w-full bg-[#0b1220] border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                         />
                       </div>
                    </div>
                  </section>
               )}

               {/* SECTION 3: Social & Portfolio */}
               <section className="glass-card p-6 space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                    <h2 className="text-white font-bold text-lg">Links & Portfolio</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div>
                        <label className="block text-slate-400 text-sm font-medium mb-1.5">LinkedIn URL</label>
                        <input 
                          type="url"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          placeholder="https://linkedin.com/in/..."
                          className="w-full bg-[#0b1220] border border-slate-700/60 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                        />
                     </div>
                     <div>
                        <label className="block text-slate-400 text-sm font-medium mb-1.5">GitHub URL</label>
                        <input 
                          type="url"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          placeholder="https://github.com/..."
                          className="w-full bg-[#0b1220] border border-slate-700/60 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                        />
                     </div>
                     {isFreelancer && (
                       <div className="md:col-span-2">
                          <label className="block text-slate-400 text-sm font-medium mb-1.5">Personal Website URL</label>
                          <input 
                            type="url"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            placeholder="https://yourdomain.com"
                            className="w-full bg-[#0b1220] border border-slate-700/60 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                          />
                       </div>
                     )}
                  </div>

                  {isFreelancer && (
                    <div className="pt-4 border-t border-slate-700/50 space-y-4">
                       <div className="flex items-center justify-between">
                         <div>
                            <p className="text-slate-300 font-semibold mb-0.5">Portfolio Links</p>
                            <p className="text-slate-500 text-xs">Showcase your best past work ({portfolioLinks.length}/5)</p>
                         </div>
                         <button 
                           onClick={addPortfolioLink}
                           disabled={portfolioLinks.length >= 5}
                           className="bg-slate-800 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 disabled:opacity-50 transition-colors"
                         >
                            + Add Link
                         </button>
                       </div>

                       {portfolioLinks.length === 0 ? (
                         <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-4 text-center">
                            <p className="text-slate-500 text-sm italic">Add URLs to live projects, design files, or code repos.</p>
                         </div>
                       ) : (
                         <div className="space-y-3">
                           {portfolioLinks.map((p, idx) => (
                              <div key={idx} className="flex flex-col sm:flex-row gap-3 bg-[#0b1220] p-3 rounded-xl border border-slate-700/60">
                                 <input 
                                   type="text" 
                                   value={p.title}
                                   onChange={(e) => updatePortfolioLink(idx, "title", e.target.value)}
                                   placeholder="Project Title"
                                   className="sm:w-1/3 bg-transparent text-white text-sm outline-none px-2 py-1 border-b border-slate-700 focus:border-purple-500/50"
                                 />
                                 <input 
                                   type="url" 
                                   value={p.url}
                                   onChange={(e) => updatePortfolioLink(idx, "url", e.target.value)}
                                   placeholder="https://..."
                                   className="flex-1 bg-transparent text-white text-sm outline-none px-2 py-1 border-b border-slate-700 focus:border-purple-500/50"
                                 />
                                 <button onClick={() => removePortfolioLink(idx)} className="text-red-400 hover:text-red-300 text-sm font-medium px-2 self-end sm:self-center">
                                    Remove
                                 </button>
                              </div>
                           ))}
                         </div>
                       )}
                    </div>
                  )}
               </section>

               <div className="flex justify-end pt-2">
                  <button
                     onClick={handleSave}
                     disabled={saving}
                     className="btn-primary py-3 px-8 rounded-xl disabled:opacity-50 text-base"
                  >
                     {saving ? "Saving changes..." : "Save Profile"}
                  </button>
               </div>

            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
