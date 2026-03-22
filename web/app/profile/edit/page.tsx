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
        <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8 flex items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400 animate-pulse text-sm font-medium">Loading profile...</p>
        </main>
      </ProtectedRoute>
    );
  }

  const isFreelancer = user?.role === "FREELANCER";
  const liveStrength = isFreelancer ? (user?.freelancerProfile?.profileStrength || 0) : 0;

  const inputClass = "w-full rounded-xl px-4 py-3 text-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors disabled:opacity-50";

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8 relative">
        
        {/* TOAST */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg font-medium animate-in slide-in-from-bottom-5">
            {toastMessage}
          </div>
        )}

        <div className="mx-auto w-full max-w-6xl space-y-6">
          <header className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Edit Profile</h1>
              <p className="mt-0.5 text-slate-500 dark:text-slate-400 text-sm">Keep your profile updated to stand out.</p>
            </div>
            <button
               onClick={handleSave}
               disabled={saving}
               className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors shrink-0 disabled:opacity-50 px-6 py-2.5 text-sm"
            >
               {saving ? "Saving..." : "Save Profile"}
            </button>
          </header>

          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* L E F T :  L I V E   P R E V I E W */}
            <div className="lg:col-span-1 space-y-6 sticky top-24">
               <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 text-center relative overflow-hidden">
                 <div className="h-16 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-t-2xl -mx-6 -mt-6 mb-6 absolute top-0 inset-x-0" />
                 
                 <div className="relative pt-8 flex flex-col items-center text-center">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="avatar" className="w-20 h-20 rounded-full border-4 border-white dark:border-[#111827] object-cover shadow-sm bg-white dark:bg-[#111827] -mt-10" />
                    ) : (
                      <div className="w-20 h-20 rounded-full border-4 border-white dark:border-[#111827] bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-3xl font-bold shadow-sm -mt-10">
                        {fullName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2 font-medium">Image upload coming soon</p>
                    
                    <h2 className="text-slate-900 dark:text-white text-lg font-bold mt-3 line-clamp-1">{fullName || "Your Name"}</h2>
                    
                    <span className={`mt-2 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${isFreelancer ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30" : "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"}`}>
                       {isFreelancer ? "FREELANCER" : "CLIENT"}
                    </span>

                    {(user?.totalRatings ?? 0) > 0 ? (
                      <div className="flex items-center gap-1.5 mt-4">
                        <StarRating value={user?.rating || 0} readonly />
                        <span className="text-slate-900 dark:text-white text-sm font-semibold">{user?.rating?.toFixed(1)}</span>
                      </div>
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 text-xs italic mt-4">No ratings yet</p>
                    )}
                 </div>

                 {isFreelancer && (
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-6">
                      <ProfileStrength score={liveStrength} />
                      
                      {skills.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider text-left">Top Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {skills.slice(0, 5).map((sk, i) => (
                               <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium">
                                 {sk}
                               </span>
                            ))}
                            {skills.length > 5 && (
                              <span className="px-2 py-1 bg-transparent text-slate-500 dark:text-slate-400 text-xs font-medium">+{skills.length - 5} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                 )}

                 <div className="mt-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-3 text-xs text-center text-emerald-700 dark:text-emerald-400">
                   <p className="font-medium">ℹ️ Your profile is public. Clients can view this card and the details you provide.</p>
                 </div>
               </div>
            </div>

            {/* R I G H T :  E D I T   F O R M */}
            <div className="lg:col-span-2 space-y-6">
               
               {/* SECTION 1: Basic Info */}
               <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                    <h2 className="text-slate-900 dark:text-white font-bold text-lg">Basic Info</h2>
                  </div>

                  <div>
                     <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5">Full Name</label>
                     <input 
                       type="text" 
                       value={fullName}
                       onChange={(e) => setFullName(e.target.value)}
                       className={inputClass}
                     />
                  </div>

                  <div>
                     <label className="flex items-baseline justify-between text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5">
                       <span>Bio / About Me</span>
                       <span className={`text-xs ${bio.length > 500 ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>{bio.length}/500</span>
                     </label>
                     <textarea 
                       value={bio}
                       onChange={(e) => setBio(e.target.value)}
                       placeholder="Tell clients what makes you great..."
                       className={`${inputClass} h-32 resize-none`}
                     />
                     <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5">A good bio of 50+ chars increases your profile strength.</p>
                  </div>

                  <div className="pt-2">
                     <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-[#0f172a] cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={isAgeVerified}
                          onChange={(e) => setIsAgeVerified(e.target.checked)}
                          className="mt-0.5 w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 accent-emerald-500"
                        />
                        <div>
                          <p className="text-slate-900 dark:text-white text-sm font-semibold">I confirm I am 18 years or older</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">
                            Required for financial transactions on SkillBridge as per Indian law. 
                            Misrepresenting your age may result in immediate account suspension and withholding of escrowed funds.
                          </p>
                        </div>
                     </label>
                  </div>
               </section>

               {/* SECTION 2: Skills & Rate (FREELANCER ONLY) */}
               {isFreelancer && (
                  <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                      <h2 className="text-slate-900 dark:text-white font-bold text-lg">Skills & Rates</h2>
                    </div>

                    <div>
                      <label className="flex justify-between items-baseline mb-1.5">
                        <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">Skills</span>
                        <span className="text-slate-500 dark:text-slate-400 text-xs">{skills.length}/10 max</span>
                      </label>
                      <div className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-2 focus-within:ring-1 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-colors flex flex-wrap gap-2 items-center min-h-[50px]">
                         {skills.map(sk => (
                            <span key={sk} className="flex items-center gap-1.5 bg-emerald-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-sm text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-slate-700">
                               {sk}
                               <button onClick={() => removeSkill(sk)} className="text-slate-400 hover:text-red-400 transition-colors">&times;</button>
                            </span>
                         ))}
                         {skills.length < 10 && (
                           <input 
                             type="text"
                             value={skillInput}
                             onChange={(e) => setSkillInput(e.target.value)}
                             onKeyDown={handleAddSkill}
                             placeholder={skills.length === 0 ? "Type a skill and press Enter..." : "Add another..."}
                             className="flex-1 min-w-[150px] bg-transparent text-slate-900 dark:text-white px-2 py-1 outline-none text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                           />
                         )}
                      </div>
                    </div>

                    <div>
                       <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5">Hourly Rate (₹)</label>
                       <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                         <input 
                           type="number"
                           min="50"
                           max="50000"
                           value={hourlyRate}
                           onChange={(e) => setHourlyRate(e.target.value === "" ? "" : Number(e.target.value))}
                           placeholder="e.g. 500"
                           className="w-full rounded-xl pl-9 pr-4 py-3 text-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                         />
                       </div>
                    </div>
                  </section>
               )}

               {/* SECTION 3: Social & Portfolio */}
               <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                    <h2 className="text-slate-900 dark:text-white font-bold text-lg">Links & Portfolio</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div>
                        <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5">LinkedIn URL</label>
                        <input 
                          type="url"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          placeholder="https://linkedin.com/in/..."
                          className={inputClass}
                        />
                     </div>
                     <div>
                        <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5">GitHub URL</label>
                        <input 
                          type="url"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          placeholder="https://github.com/..."
                          className={inputClass}
                        />
                     </div>
                     {isFreelancer && (
                       <div className="md:col-span-2">
                          <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5">Personal Website URL</label>
                          <input 
                            type="url"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            placeholder="https://yourdomain.com"
                            className={inputClass}
                          />
                       </div>
                     )}
                  </div>

                  {isFreelancer && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50 space-y-4">
                       <div className="flex items-center justify-between">
                         <div>
                            <p className="text-slate-900 dark:text-white font-semibold flex items-center gap-2">Portfolio Links</p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Showcase your best past work ({portfolioLinks.length}/5)</p>
                         </div>
                         <button 
                           onClick={addPortfolioLink}
                           disabled={portfolioLinks.length >= 5}
                           className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                         >
                            + Add Link
                         </button>
                       </div>

                       {portfolioLinks.length === 0 ? (
                         <div className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 text-center">
                            <p className="text-slate-500 dark:text-slate-400 text-sm italic">Add URLs to live projects, design files, or code repos.</p>
                         </div>
                       ) : (
                         <div className="space-y-3">
                           {portfolioLinks.map((p, idx) => (
                              <div key={idx} className="flex flex-col sm:flex-row gap-3 bg-slate-50 dark:bg-[#0f172a] p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 transition-colors">
                                 <input 
                                   type="text" 
                                   value={p.title}
                                   onChange={(e) => updatePortfolioLink(idx, "title", e.target.value)}
                                   placeholder="Project Title"
                                   className="sm:w-1/3 bg-transparent text-slate-900 dark:text-white text-sm outline-none px-2 py-1 border-b border-slate-200 dark:border-slate-700 focus:border-emerald-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                 />
                                 <input 
                                   type="url" 
                                   value={p.url}
                                   onChange={(e) => updatePortfolioLink(idx, "url", e.target.value)}
                                   placeholder="https://..."
                                   className="flex-1 bg-transparent text-slate-900 dark:text-white text-sm outline-none px-2 py-1 border-b border-slate-200 dark:border-slate-700 focus:border-emerald-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                 />
                                 <button onClick={() => removePortfolioLink(idx)} className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500 text-sm font-medium px-2 self-end sm:self-center transition-colors">
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
                     className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors py-3 px-8 text-base disabled:opacity-50 shadow-sm"
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
