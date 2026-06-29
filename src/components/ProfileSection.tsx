import { User } from "../types";
import { Award, Star, Compass, Shield, Check, Calendar, Activity, Zap, ListTodo } from "lucide-react";

interface ProfileSectionProps {
  user: User;
  totalSubmissions: number;
  resolvedSubmissions: number;
}

export default function ProfileSection({ user, totalSubmissions, resolvedSubmissions }: ProfileSectionProps) {
  
  // Custom badges list
  const badgeIcons: Record<string, { desc: string; iconColor: string; bg: string }> = {
    "First Responder": { desc: "Submitted your first civic report to the municipality", iconColor: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
    "Eagle Eye": { desc: "Spotted and detailed a critical infrastructure hazard", iconColor: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
    "Pothole Patrol": { desc: "Helped map public road damages", iconColor: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
    "City Guardian": { desc: "Admin rank verification status active", iconColor: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
    "Master Solver": { desc: "Dispatched over 10 resolved actions", iconColor: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
    "Bronze Watchdog": { desc: "Reached 100 civic contribution points milestone", iconColor: "text-amber-700", bg: "bg-amber-100/50 border-amber-200" },
    "Silver Sentinel": { desc: "Reached 250 civic contribution points milestone", iconColor: "text-slate-600", bg: "bg-slate-100 border-slate-200" },
    "Civic Hero": { desc: "Successfully reported an issue that was completely resolved", iconColor: "text-rose-600", bg: "bg-rose-50 border-rose-100" }
  };

  const nextLevelXP = user.points >= 1000 ? 5000 : user.points >= 500 ? 1000 : user.points >= 200 ? 500 : 200;
  const currentLevel = user.points >= 1000 ? 4 : user.points >= 500 ? 3 : user.points >= 200 ? 2 : 1;
  const xpPercentage = Math.min(100, Math.round((user.points / nextLevelXP) * 100));

  return (
    <div id="citizen_profile_section" className="space-y-6">
      {/* 1. HERO BIO CARD */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
        {/* Glow visual backdrops */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-50/50 rounded-full blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-blue-600 text-white flex items-center justify-center font-black text-2xl border-4 border-slate-50 shadow-md">
            {user.name.charAt(0)}
          </div>
          <span className="absolute bottom-0 right-0 bg-amber-500 border-2 border-white rounded-full p-1 text-white flex items-center justify-center shadow-sm">
            <Star size={10} className="fill-white" />
          </span>
        </div>

        <div className="space-y-2 flex-grow text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <h3 className="font-bold text-slate-800 text-lg leading-snug">{user.name}</h3>
            <span className={`w-fit mx-auto sm:mx-0 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${
              user.role === "ADMIN" ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-blue-50 border-blue-100 text-blue-700"
            }`}>
              {user.role} RANK
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Joined CivicAlert on {new Date(user.joinedAt).toLocaleDateString()}</p>

          {/* XP Progress Bar */}
          <div className="space-y-1.5 pt-1.5 max-w-md mx-auto sm:mx-0">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
              <span className="text-blue-600 uppercase">Civic Watchdog Level {currentLevel}</span>
              <span>{user.points} / {nextLevelXP} XP</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${xpPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Points */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contribution Balance</p>
            <h4 className="text-2xl font-bold text-slate-800 font-mono tracking-tight">{user.points} XP</h4>
            <span className="text-[9px] text-slate-400 font-medium block">Awarded for active reports & votes</span>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
            <Zap size={20} className="fill-blue-600" />
          </div>
        </div>

        {/* Total Reports */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Issues Reported</p>
            <h4 className="text-2xl font-bold text-slate-800 font-mono tracking-tight">{totalSubmissions} Reports</h4>
            <span className="text-[9px] text-slate-400 font-medium block">All uploaded civic notifications</span>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
            <ListTodo size={20} />
          </div>
        </div>

        {/* Resolved Issues */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed Fixes</p>
            <h4 className="text-2xl font-bold text-emerald-600 font-mono tracking-tight">{resolvedSubmissions} Resolved</h4>
            <span className="text-[9px] text-emerald-600 font-medium block">100 XP awarded per completed fix!</span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
            <Award size={20} className="fill-emerald-50 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* 3. ACHIEVEMENTS & BADGES milestone catalog */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-1.5">
          <Compass size={18} className="text-blue-600" /> Earned Badges & Civic Achievements
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {user.badges.map((badgeName) => {
            const badgeMeta = badgeIcons[badgeName] || { desc: "Honorary badge awarded for civic support", iconColor: "text-slate-600", bg: "bg-slate-50 border-slate-100" };
            return (
              <div key={badgeName} className={`p-4 rounded-2xl border flex gap-3 items-start transition-all ${badgeMeta.bg} hover:-translate-y-0.5 hover:shadow-sm`}>
                <div className={`p-2 bg-white rounded-xl shadow-xs border border-white flex-shrink-0 ${badgeMeta.iconColor}`}>
                  <Award size={18} className="fill-current" />
                </div>
                <div className="space-y-0.5">
                  <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                    {badgeName}
                    <Check size={11} className="text-emerald-500 font-black" />
                  </h5>
                  <p className="text-[10px] text-slate-400 leading-snug font-medium">{badgeMeta.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
