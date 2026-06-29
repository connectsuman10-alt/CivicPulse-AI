import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Issue, Comment, User, Notification, IssueStatus, Category } from "./types";
import { 
  Building2, 
  Map, 
  PlusCircle, 
  BarChart3, 
  ShieldAlert, 
  User as UserIcon, 
  Bell, 
  LogOut, 
  Search, 
  SlidersHorizontal,
  Plus,
  Compass,
  ArrowRight
} from "lucide-react";

import IssueCard from "./components/IssueCard";
import IssueDetailsModal from "./components/IssueDetailsModal";
import NewIssueForm from "./components/NewIssueForm";
import InteractiveMap from "./components/InteractiveMap";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import NotificationCenter from "./components/NotificationCenter";
import ProfileSection from "./components/ProfileSection";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  // Authentication & Session States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [authRole, setAuthRole] = useState<"CITIZEN" | "ADMIN">("CITIZEN");
  const [authLoading, setAuthLoading] = useState(false);

  // App Core States
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "map" | "report" | "analytics" | "admin" | "profile">("dashboard");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date" | "priority" | "votes">("date");

  // Predictive AI Toggle
  const [showPredictiveHotspots, setShowPredictiveHotspots] = useState(false);
  const [predictiveData, setPredictiveData] = useState<any[]>([]);

  // Fetch initial issues database
  const fetchIssues = async () => {
    try {
      const res = await fetch("/api/issues");
      if (res.ok) {
        const data = await res.json();
        setIssues(data);
      }
    } catch (err) {
      console.error("Error fetching issues:", err);
    } finally {
      setLoadingIssues(false);
    }
  };

  // Fetch notifications count for user
  const fetchNotificationCount = async (userId: string) => {
    try {
      const res = await fetch(`/api/notifications/${userId}`);
      if (res.ok) {
        const data: Notification[] = await res.json();
        setNotificationCount(data.filter(n => !n.isRead).length);
      }
    } catch (err) {
      console.error("Error fetching notifications count:", err);
    }
  };

  // Hotspots predictive list
  const fetchPredictiveHotspots = async () => {
    try {
      const res = await fetch("/api/predict-hotspots");
      if (res.ok) {
        const json = await res.json();
        setPredictiveData(json.hotspots);
      }
    } catch (err) {
      console.error("Error prefetching predictions:", err);
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchPredictiveHotspots();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchNotificationCount(currentUser.id);
      const interval = setInterval(() => {
        fetchNotificationCount(currentUser.id);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Auth Submit Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;
    setAuthLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setActiveTab(data.user.role === "ADMIN" ? "admin" : "dashboard");
      } else {
        // If email not found, register them automatically as citizen
        handleAutoRegister(authEmail);
      }
    } catch (err) {
      console.error("Login failed:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAutoRegister = async (email: string) => {
    const name = email.split("@")[0].replace(".", " ");
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formattedName, email, role: authRole })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setActiveTab(data.user.role === "ADMIN" ? "admin" : "dashboard");
      }
    } catch (err) {
      console.error("Auto registration failed:", err);
    }
  };

  const handleDemoLogin = (email: string) => {
    setAuthEmail(email);
    // Submit login action
    setAuthLoading(true);
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    })
      .then(res => res.json())
      .then(data => {
        setCurrentUser(data.user);
        setActiveTab(data.user.role === "ADMIN" ? "admin" : "dashboard");
      })
      .catch(err => console.error("Demo login error:", err))
      .finally(() => setAuthLoading(false));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthEmail("");
    setAuthName("");
  };

  // Issue Action Handlers
  const handleVoteIssue = async (issueId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/issues/${issueId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        const data = await res.json();
        // Update local issues state
        setIssues(prev => prev.map(issue => {
          if (issue.id === issueId) {
            return { ...issue, upvotes: data.upvotes };
          }
          return issue;
        }));
        
        // Also update selectedIssue details if open
        if (selectedIssue && selectedIssue.id === issueId) {
          setSelectedIssue(prev => prev ? { ...prev, upvotes: data.upvotes } : null);
        }

        // Award points locally to simulate reward reactivity instantly!
        setCurrentUser(prev => prev ? { ...prev, points: prev.points + 2 } : null);
      }
    } catch (err) {
      console.error("Error upvoting issue:", err);
    }
  };

  const handleAddComment = async (issueId: string, text: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/issues/${issueId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          text
        })
      });

      if (res.ok) {
        const newComment: Comment = await res.json();
        setIssues(prev => prev.map(issue => {
          if (issue.id === issueId) {
            return { ...issue, comments: [...issue.comments, newComment] };
          }
          return issue;
        }));

        if (selectedIssue && selectedIssue.id === issueId) {
          setSelectedIssue(prev => prev ? { ...prev, comments: [...prev.comments, newComment] } : null);
        }
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleUpdateStatus = async (
    issueId: string,
    updates: { status: IssueStatus; assignedTo?: string; department?: string; resolvedImage?: string }
  ) => {
    try {
      const res = await fetch(`/api/issues/${issueId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        const updatedIssue = await res.json();
        // Sync local lists
        setIssues(prev => prev.map(issue => (issue.id === issueId ? updatedIssue : issue)));
        if (selectedIssue && selectedIssue.id === issueId) {
          setSelectedIssue(updatedIssue);
        }
        
        // Award points locally if resolved
        if (updates.status === "RESOLVED" && currentUser && currentUser.id === updatedIssue.reportedById) {
          setCurrentUser(prev => prev ? { ...prev, points: prev.points + 100 } : null);
        }
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleIssueAdded = (newIssue: Issue) => {
    setIssues(prev => [newIssue, ...prev]);
    setActiveTab("dashboard");
    // Celebrate addition
    setCurrentUser(prev => prev ? { ...prev, points: prev.points + 25 } : null);
  };

  // Multi-Filter Sort Implementation
  const filteredIssuesList = issues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "ALL" || issue.category === categoryFilter;
    const matchesStatus = statusFilter === "ALL" || issue.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "priority") {
      return b.priorityScore - a.priorityScore;
    }
    if (sortBy === "votes") {
      return b.upvotes.length - a.upvotes.length;
    }
    // Default Date Sort
    return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
  });

  const handleNavigateToIssue = (issueId: string) => {
    const issue = issues.find(i => i.id === issueId);
    if (issue) {
      setSelectedIssue(issue);
    }
  };

  // RENDER APP
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col justify-between">
      
      {/* 1. AUTHENTICATION SPLASH SCREEN */}
      <AnimatePresence mode="wait">
        {!currentUser ? (
          <motion.div
            key="auth-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex items-center justify-center p-4 min-h-[100vh] bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-950 relative overflow-hidden"
          >
            {/* Glowing background shapes */}
            <div className="absolute -right-24 -top-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-md w-full bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl shadow-2xl backdrop-blur-md space-y-6 text-white text-center">
              <div className="space-y-2">
                <div className="bg-blue-600/20 text-blue-400 border border-blue-500/30 p-3 w-fit mx-auto rounded-2xl animate-pulse">
                  <Building2 size={32} />
                </div>
                <h2 className="text-2xl font-black tracking-tight">CivicPulse Smart Cities</h2>
                <p className="text-xs text-slate-400 leading-normal font-medium">
                  Connect directly with local municipal services. Report road damages, utility failures, and track resolutions.
                </p>
              </div>

              {/* Quick demo credentials triggers */}
              <div className="space-y-2 text-left bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50">
                <p className="text-[10px] font-black tracking-wider uppercase text-slate-500 mb-1.5 flex items-center gap-1">
                  <Compass size={11} /> Quick Login Credentials for Demo
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <button
                    onClick={() => handleDemoLogin("citizen@civicalert.gov")}
                    className="p-2.5 rounded-xl bg-blue-600/15 border border-blue-500/30 hover:bg-blue-600/30 transition-all font-bold text-blue-300 text-left cursor-pointer"
                  >
                    Citizen Account
                    <span className="block text-[8px] text-slate-400 font-normal mt-0.5">Alex Rivera</span>
                  </button>
                  <button
                    onClick={() => handleDemoLogin("admin@civicalert.gov")}
                    className="p-2.5 rounded-xl bg-rose-600/15 border border-rose-500/30 hover:bg-rose-600/30 transition-all font-bold text-rose-300 text-left cursor-pointer"
                  >
                    Admin Account
                    <span className="block text-[8px] text-slate-400 font-normal mt-0.5">Sarah Jenkins</span>
                  </button>
                </div>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter email to sign in or register..."
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/40 border border-slate-800 focus:border-blue-500 outline-none transition-all text-xs text-white"
                  />
                </div>

                {authEmail && (
                  <div className="space-y-2.5 animate-fadeIn">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Registration Role</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAuthRole("CITIZEN")}
                        className={`flex-grow py-2 rounded-xl text-xs font-bold border transition-all ${
                          authRole === "CITIZEN" 
                            ? "bg-blue-600 border-blue-600 text-white" 
                            : "bg-slate-950/40 border-slate-800 text-slate-400"
                        }`}
                      >
                        Citizen Watchdog
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthRole("ADMIN")}
                        className={`flex-grow py-2 rounded-xl text-xs font-bold border transition-all ${
                          authRole === "ADMIN" 
                            ? "bg-rose-600 border-rose-600 text-white" 
                            : "bg-slate-950/40 border-slate-800 text-slate-400"
                        }`}
                      >
                        Municipal Admin
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-blue-600/15 cursor-pointer disabled:opacity-50"
                >
                  {authLoading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Access Platform <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          /* 2. CORE APPLICATION WORKSPACE */
          <motion.div
            key="app-workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-grow flex flex-col md:flex-row min-h-[100vh] bg-slate-50"
          >
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex w-64 bg-slate-900 flex-col border-r border-slate-800 shrink-0 text-white">
              <div className="p-6 flex-grow flex flex-col">
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
                  <h1 className="text-xl font-bold text-white tracking-tight">CivicPulse AI</h1>
                </div>

                <nav className="space-y-1 flex-grow">
                  {currentUser.role === "ADMIN" && (
                    <button
                      onClick={() => setActiveTab("admin")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left text-xs font-semibold cursor-pointer ${
                        activeTab === "admin" 
                          ? "bg-blue-600/15 text-blue-400 border-blue-500/25" 
                          : "text-slate-400 hover:text-white border-transparent hover:bg-slate-800/40"
                      }`}
                    >
                      <ShieldAlert size={16} />
                      <span>Admin Control</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left text-xs font-semibold cursor-pointer ${
                      activeTab === "dashboard" 
                        ? "bg-blue-600/15 text-blue-400 border-blue-500/25" 
                        : "text-slate-400 hover:text-white border-transparent hover:bg-slate-800/40"
                    }`}
                  >
                    <Compass size={16} />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("map")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left text-xs font-semibold cursor-pointer ${
                      activeTab === "map" 
                        ? "bg-blue-600/15 text-blue-400 border-blue-500/25" 
                        : "text-slate-400 hover:text-white border-transparent hover:bg-slate-800/40"
                    }`}
                  >
                    <Map size={16} />
                    <span>Live Map</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("report")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left text-xs font-semibold cursor-pointer ${
                      activeTab === "report" 
                        ? "bg-blue-600/15 text-blue-400 border-blue-500/25" 
                        : "text-slate-400 hover:text-white border-transparent hover:bg-slate-800/40"
                    }`}
                  >
                    <PlusCircle size={16} />
                    <span>Report Issue</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("analytics")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left text-xs font-semibold cursor-pointer ${
                      activeTab === "analytics" 
                        ? "bg-blue-600/15 text-blue-400 border-blue-500/25" 
                        : "text-slate-400 hover:text-white border-transparent hover:bg-slate-800/40"
                    }`}
                  >
                    <BarChart3 size={16} />
                    <span>AI Analytics</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left text-xs font-semibold cursor-pointer ${
                      activeTab === "profile" 
                        ? "bg-blue-600/15 text-blue-400 border-blue-500/25" 
                        : "text-slate-400 hover:text-white border-transparent hover:bg-slate-800/40"
                    }`}
                  >
                    <UserIcon size={16} />
                    <span>My Profile</span>
                  </button>
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-sm">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{currentUser.name}</p>
                      <p className="text-[10px] text-blue-400 font-bold font-mono uppercase tracking-wider">{currentUser.points} XP</p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* MAIN AREA */}
            <div className="flex-grow flex flex-col min-h-screen overflow-x-hidden relative pb-16 md:pb-0">
              {/* TOP HEADER */}
              <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sm:px-8 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="md:hidden bg-blue-600 text-white p-2 rounded-xl">
                    <Building2 size={16} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider md:block hidden">CivicPulse AI</span>
                    <svg className="w-3.5 h-3.5 text-slate-300 md:block hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    <span className="font-semibold text-slate-700 uppercase tracking-wider">
                      {activeTab === "dashboard" ? "Open Issues" : activeTab}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Notification Bell */}
                  <button
                    type="button"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100/50 text-slate-600 transition-all cursor-pointer"
                  >
                    <Bell size={16} />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white animate-bounce">
                        {notificationCount}
                      </span>
                    )}
                  </button>

                  <div className="h-6 w-px bg-slate-200" />

                  {/* Logged in User Profile controls */}
                  <button
                    onClick={handleLogout}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 cursor-pointer"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </header>

              {/* RESPONSIVE MOBILE NAVIGATION FOOTER RAIL */}
              <div className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 h-16 flex items-center justify-around px-2 z-40 shadow-xl text-slate-400">
                {currentUser.role === "ADMIN" && (
                  <button
                    onClick={() => setActiveTab("admin")}
                    className={`flex flex-col items-center gap-1 text-[9px] font-extrabold ${
                      activeTab === "admin" ? "text-blue-400" : "text-slate-400"
                    }`}
                  >
                    <ShieldAlert size={16} />
                    Admin
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`flex flex-col items-center gap-1 text-[9px] font-extrabold ${
                    activeTab === "dashboard" ? "text-blue-400" : "text-slate-400"
                  }`}
                >
                  <Compass size={16} />
                  Issues
                </button>
                <button
                  onClick={() => setActiveTab("map")}
                  className={`flex flex-col items-center gap-1 text-[9px] font-extrabold ${
                    activeTab === "map" ? "text-blue-400" : "text-slate-400"
                  }`}
                >
                  <Map size={16} />
                  Live Map
                </button>
                <button
                  onClick={() => setActiveTab("report")}
                  className={`flex flex-col items-center gap-1 text-[9px] font-extrabold ${
                    activeTab === "report" ? "text-blue-400" : "text-slate-400"
                  }`}
                >
                  <PlusCircle size={16} />
                  Report
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`flex flex-col items-center gap-1 text-[9px] font-extrabold ${
                    activeTab === "analytics" ? "text-blue-400" : "text-slate-400"
                  }`}
                >
                  <BarChart3 size={16} />
                  AI
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex flex-col items-center gap-1 text-[9px] font-extrabold ${
                    activeTab === "profile" ? "text-blue-400" : "text-slate-400"
                  }`}
                >
                  <UserIcon size={16} />
                  Profile
                </button>
              </div>

              {/* TAB BODY PAGES CONTAINER */}
              <main className="p-4 sm:p-8 flex flex-col gap-6 flex-grow w-full relative max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                
                {/* A. OPEN INCIDENTS DASHBOARD TAB */}
                {activeTab === "dashboard" && (
                  <motion.div
                    key="dashboard-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                     {/* Filter controls section */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                      {/* Search Input */}
                      <div className="relative w-full md:w-80">
                        <input
                          type="text"
                          placeholder="Search issues by keyword, area, street..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-white text-slate-800"
                        />
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>

                      {/* Dropdown Filters */}
                      <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700"
                        >
                          <option value="ALL">All Categories</option>
                          <option value="POTHOLE">Potholes</option>
                          <option value="GARBAGE">Garbage & Sanitation</option>
                          <option value="WATER_LEAK">Water Leakage</option>
                          <option value="STREETLIGHT">Streetlighting</option>
                          <option value="ROAD_DAMAGE">Road Damage</option>
                        </select>

                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700"
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="REPORTED">Reported</option>
                          <option value="VERIFIED">Verified</option>
                          <option value="ASSIGNED">Assigned</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>

                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700"
                        >
                          <option value="date">Sort by Date</option>
                          <option value="priority">Sort by AI Severity</option>
                          <option value="votes">Sort by Upvotes</option>
                        </select>

                        <button
                          onClick={() => setActiveTab("report")}
                          className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 cursor-pointer shadow-sm shadow-blue-600/10 ml-auto md:ml-0"
                        >
                          <Plus size={14} /> Report New
                        </button>
                      </div>
                    </div>

                    {/* Main issue listing cards grid */}
                    {loadingIssues ? (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-3" />
                        <p className="text-xs font-medium">Syncing with municipal database...</p>
                      </div>
                    ) : filteredIssuesList.length === 0 ? (
                      <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 max-w-md mx-auto space-y-3 shadow-sm">
                        <SlidersHorizontal size={28} className="text-slate-300 mx-auto" />
                        <h4 className="font-bold text-slate-800 text-sm">No Open Reports Found</h4>
                        <p className="text-xs text-slate-400 font-medium">No reports match your filters. Be the first to file a verified report in this area!</p>
                        <button
                          onClick={() => setActiveTab("report")}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer inline-block shadow-sm"
                        >
                          Submit Report
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredIssuesList.map(issue => (
                          <div key={issue.id} className="h-full">
                            <IssueCard
                              issue={issue}
                              onSelect={setSelectedIssue}
                              onVote={handleVoteIssue}
                              currentUserId={currentUser.id}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* B. DETAILED LIVE VECTOR MAP TAB */}
                {activeTab === "map" && (
                  <motion.div
                    key="map-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="h-[520px] lg:h-[580px] space-y-4"
                  >
                    {/* Hotspot Toggle banner inside map page */}
                    <div className="bg-slate-900 text-white p-4 rounded-3xl border border-slate-800 shadow-md flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h4 className="font-bold text-xs flex items-center gap-1"><Compass size={14} className="text-blue-400" /> AI Spatial Risk Overlay</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Toggle predictive hotspot models calculated by municipal database records</p>
                      </div>
                      <button
                        onClick={() => setShowPredictiveHotspots(!showPredictiveHotspots)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[10px] border cursor-pointer transition-all ${
                          showPredictiveHotspots 
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                            : "bg-white/10 border-white/10 text-slate-300 hover:bg-white/20"
                        }`}
                      >
                        {showPredictiveHotspots ? "Disable AI Heatmaps" : "Enable Predictive Hotspots"}
                      </button>
                    </div>

                    <div className="h-full">
                      <InteractiveMap
                        issues={issues}
                        onSelectIssue={setSelectedIssue}
                        showHotspots={showPredictiveHotspots}
                        predictiveHotspots={predictiveData}
                      />
                    </div>
                  </motion.div>
                )}

                {/* C. INCIDENT SUBMISSION REPORT TAB */}
                {activeTab === "report" && (
                  <motion.div
                    key="report-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <NewIssueForm
                      currentUser={currentUser}
                      onIssueAdded={handleIssueAdded}
                      onNavigateToIssue={handleNavigateToIssue}
                      allIssues={issues}
                    />
                  </motion.div>
                )}

                {/* D. AI ANALYTICS DASHBOARD TAB */}
                {activeTab === "analytics" && (
                  <motion.div
                    key="analytics-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <AnalyticsDashboard onRefreshIssues={fetchIssues} />
                  </motion.div>
                )}

                {/* E. CITIZEN GAMIFIED PROFILE TAB */}
                {activeTab === "profile" && (
                  <motion.div
                    key="profile-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <ProfileSection
                      user={currentUser}
                      totalSubmissions={issues.filter(i => i.reportedById === currentUser.id).length}
                      resolvedSubmissions={issues.filter(i => i.reportedById === currentUser.id && i.status === "RESOLVED").length}
                    />
                  </motion.div>
                )}

                {/* F. ADMIN CONSOLE TABLE TAB */}
                {activeTab === "admin" && currentUser.role === "ADMIN" && (
                  <motion.div
                    key="admin-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <AdminPanel
                      issues={issues}
                      onSelectIssue={setSelectedIssue}
                      onUpdateStatus={handleUpdateStatus}
                    />
                  </motion.div>
                )}

              </AnimatePresence>
            </main>

            {/* NOTIFICATION CENTER POPUP SIDE DRAWER */}
            <AnimatePresence>
              {showNotifications && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                  <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs" onClick={() => setShowNotifications(false)} />
                  <NotificationCenter
                    userId={currentUser.id}
                    onClose={() => setShowNotifications(false)}
                    onNavigateToIssue={handleNavigateToIssue}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* DETAIL INCIDENT INSPECTOR MODAL */}
            <AnimatePresence>
              {selectedIssue && (
                <IssueDetailsModal
                  issue={selectedIssue}
                  currentUser={currentUser}
                  onClose={() => setSelectedIssue(null)}
                  onVote={handleVoteIssue}
                  onAddComment={handleAddComment}
                  onUpdateStatus={handleUpdateStatus}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}
