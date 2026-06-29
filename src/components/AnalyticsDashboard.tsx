import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { AnalyticsSummary, Category } from "../types";
import { 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Cpu, 
  Sparkles, 
  ShieldAlert, 
  ArrowUpRight, 
  Award, 
  BarChart3,
  Lightbulb,
  Droplets,
  Trash2,
  AlertTriangle
} from "lucide-react";

interface AnalyticsDashboardProps {
  onRefreshIssues: () => void;
}

export default function AnalyticsDashboard({ onRefreshIssues }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [prediction, setPrediction] = useState<{
    hotspots: {
      zoneName: string;
      latitude: number;
      longitude: number;
      riskCategory: string;
      riskDescription: string;
      severity: string;
      remedialAction: string;
    }[];
    overallCityVulnerabilityIndex: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    fetchPredictions();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictions = async () => {
    setPredicting(true);
    try {
      const res = await fetch("/api/predict-hotspots");
      if (res.ok) {
        const json = await res.json();
        setPrediction(json);
      }
    } catch (err) {
      console.error("Error predicting hotspots:", err);
    } finally {
      setPredicting(false);
    }
  };

  if (loading || !data) {
    return (
      <div id="analytics_loading" className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium text-sm">Synthesizing civic analytics...</p>
      </div>
    );
  }

  // Beautiful, professional, accessible colors
  const COLORS = ["#2563eb", "#10b981", "#3b82f6", "#f59e0b", "#f97316", "#64748b"];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "HIGH":
        return "bg-orange-50 text-orange-700 border-orange-100";
      case "MEDIUM":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <div id="analytics_dashboard" className="space-y-6">
      {/* 1. KEY METRICS STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reported */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reports</p>
            <h4 className="text-3xl font-bold text-slate-900 tracking-tight">{data.totalIssues}</h4>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              <TrendingUp size={10} className="mr-0.5" /> +14% this week
            </span>
          </div>
          <div className="bg-blue-50 p-3.5 rounded-2xl text-blue-600">
            <AlertCircle size={24} />
          </div>
        </div>

        {/* Resolved Issues */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved Issues</p>
            <h4 className="text-3xl font-bold text-slate-900 tracking-tight">{data.resolvedIssues}</h4>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              <CheckCircle size={10} className="mr-0.5" /> Direct resolution
            </span>
          </div>
          <div className="bg-emerald-50 p-3.5 rounded-2xl text-emerald-600">
            <CheckCircle size={24} />
          </div>
        </div>

        {/* Resolution Rate */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolution Rate</p>
            <h4 className="text-3xl font-bold text-slate-900 tracking-tight">{data.resolutionRate}%</h4>
            <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-2.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full" 
                style={{ width: `${data.resolutionRate}%` }}
              />
            </div>
          </div>
          <div className="bg-blue-50 p-3.5 rounded-2xl text-blue-600">
            <BarChart3 size={24} />
          </div>
        </div>

        {/* Active Contributors */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Citizens</p>
            <h4 className="text-3xl font-bold text-slate-900 tracking-tight">{data.topContributors.length}</h4>
            <span className="inline-flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
              <Users size={10} className="mr-0.5" /> High community activity
            </span>
          </div>
          <div className="bg-amber-50 p-3.5 rounded-2xl text-amber-600">
            <Award size={24} />
          </div>
        </div>
      </div>

      {/* 2. CHARTS VIEW - TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly trends Area Chart */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Weekly Incident & Resolution Trends</h3>
              <p className="text-xs text-slate-500">Reported issues vs completed resolutions</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weeklyTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.05)" }} />
                <Legend iconType="circle" fontSize={11} wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Area type="monotone" dataKey="reported" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReported)" name="Reported" />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorResolved)" name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Issue Distribution by Category</h3>
            <p className="text-xs text-slate-500">Breakdown of reported incident classification types</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-48 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Issues`, 'Total']} contentStyle={{ borderRadius: "16px", border: "1px solid #f1f5f9" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <p className="text-xs font-semibold text-slate-400">Total</p>
                <p className="text-xl font-bold text-slate-800">{data.totalIssues}</p>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="space-y-2">
              {data.byCategory.map((cat, idx) => (
                <div key={cat.name} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-600 capitalize">{cat.name.toLowerCase()}</span>
                  </div>
                  <span className="text-slate-900 font-semibold bg-slate-50 px-2 py-0.5 rounded-full">{cat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. AI PREDICTIVE HOTSPOTS & RISK ASSESSMENT */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Glow vector effect */}
        <div className="absolute -right-24 -top-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Cpu size={10} /> Powered by Gemini 2.5
              </span>
            </div>
            <h3 className="font-bold text-lg flex items-center gap-1.5 text-white">
              <Sparkles size={20} className="text-blue-400 animate-pulse" />
              AI Maintenance Hotspots & Predictive Risk
            </h3>
            <p className="text-xs text-slate-400">
              System analyzes cross-category reports, cluster densities, and dates to predict infrastructure vulnerabilities
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">City Vulnerability Index</p>
              <p className="text-2xl font-black text-rose-400 font-mono tracking-tight">
                {prediction?.overallCityVulnerabilityIndex || 64}
                <span className="text-xs text-slate-400 font-normal">/100</span>
              </p>
            </div>
            <button
              onClick={fetchPredictions}
              disabled={predicting}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 text-xs font-semibold rounded-xl border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {predicting ? (
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              Analyze Realtime
            </button>
          </div>
        </div>

        {/* Hotspots Breakdown */}
        {predicting ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 bg-white/5 rounded-2xl border border-white/5">
            <div className="w-8 h-8 border-3 border-blue-400/20 border-t-blue-400 rounded-full animate-spin mb-3" />
            <p className="text-xs font-medium">Gemini is compiling spatial correlation datasets...</p>
          </div>
        ) : prediction && prediction.hotspots ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prediction.hotspots.map((hot, index) => {
              const isCritical = hot.severity === "CRITICAL" || hot.severity === "HIGH";
              return (
                <div key={index} className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/50 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                        {hot.zoneName}
                      </h4>
                      <span className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-full border ${getSeverityBadge(hot.severity)}`}>
                        {hot.severity} Risk
                      </span>
                    </div>
                    <p className="text-xs text-blue-300 font-semibold">{hot.riskCategory}</p>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">{hot.riskDescription}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-700/50 space-y-1">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                      <ShieldAlert size={10} className="text-rose-400" /> Recommended Proactive Action:
                    </p>
                    <p className="text-xs text-slate-200 font-medium italic">{hot.remedialAction}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic text-center py-6">No historical data hotspots processed yet.</p>
        )}
      </div>

      {/* 4. LEADERBOARD / CITIZEN CONTRIBUTION GRID */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Top Civic Watchdogs & Contributions</h3>
            <p className="text-xs text-slate-500">Citizen leaderboard based on reported issue resolution milestones</p>
          </div>
          <Award size={20} className="text-blue-600 animate-bounce" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 font-bold">Rank</th>
                <th className="py-2.5 font-bold">Citizen Agent</th>
                <th className="py-2.5 font-bold text-center">Reports Filed</th>
                <th className="py-2.5 font-bold text-right">Contribution Points</th>
              </tr>
            </thead>
            <tbody>
              {data.topContributors.map((user, idx) => (
                <tr key={user.name} className="border-b border-slate-50 text-xs font-medium hover:bg-slate-50/50 transition-colors">
                  <td className="py-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      idx === 0 ? "bg-amber-100 text-amber-700" :
                      idx === 1 ? "bg-slate-100 text-slate-700" :
                      idx === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-50 text-slate-500"
                    }`}>
                      #{idx + 1}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-slate-800">{user.name}</td>
                  <td className="py-3 text-center font-bold text-blue-600">{user.reports}</td>
                  <td className="py-3 text-right font-black text-slate-900 font-mono">{user.points} XP</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
