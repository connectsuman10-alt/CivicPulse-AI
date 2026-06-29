import React, { useState } from "react";
import { Issue, Comment, User, IssueStatus, Severity } from "../types";
import { 
  X, 
  MapPin, 
  Clock, 
  ThumbsUp, 
  MessageSquare, 
  CheckCircle2, 
  User as UserIcon, 
  Cpu, 
  Send,
  AlertTriangle,
  Bookmark,
  Activity,
  UserCheck,
  ShieldAlert,
  Wrench,
  Camera
} from "lucide-react";

interface IssueDetailsModalProps {
  issue: Issue;
  currentUser: User;
  onClose: () => void;
  onVote: (issueId: string) => void;
  onAddComment: (issueId: string, text: string) => void;
  onUpdateStatus?: (issueId: string, updates: { status: IssueStatus; assignedTo?: string; department?: string; resolvedImage?: string }) => void;
}

export default function IssueDetailsModal({
  issue,
  currentUser,
  onClose,
  onVote,
  onAddComment,
  onUpdateStatus
}: IssueDetailsModalProps) {
  const [commentText, setCommentText] = useState("");
  
  // Admin fields
  const [adminStatus, setAdminStatus] = useState<IssueStatus>(issue.status);
  const [adminAssignee, setAdminAssignee] = useState(issue.assignedTo || "");
  const [adminDept, setAdminDept] = useState(issue.department || "");
  const [resolvedPhoto, setResolvedPhoto] = useState("");
  const [showAdminConsole, setShowAdminConsole] = useState(currentUser.role === "ADMIN");

  const timelineSteps: { label: string; status: IssueStatus; desc: string }[] = [
    { label: "Reported", status: "REPORTED", desc: "Citizen file uploaded and AI evaluated" },
    { label: "Verified", status: "VERIFIED", desc: "Citizen upvotes or Admin validated accuracy" },
    { label: "Assigned", status: "ASSIGNED", desc: "Dispatched to responsible city division" },
    { label: "In Progress", status: "IN_PROGRESS", desc: "Municipal technicians on site working" },
    { label: "Resolved", status: "RESOLVED", desc: "Repairs finalized and community updated" }
  ];

  const getStatusIndex = (status: IssueStatus) => {
    switch (status) {
      case "REPORTED": return 0;
      case "VERIFIED": return 1;
      case "ASSIGNED": return 2;
      case "IN_PROGRESS": return 3;
      case "RESOLVED": return 4;
      default: return 0;
    }
  };

  const currentStatusIndex = getStatusIndex(issue.status);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(issue.id, commentText);
    setCommentText("");
  };

  const handleAdminUpdate = () => {
    if (onUpdateStatus) {
      onUpdateStatus(issue.id, {
        status: adminStatus,
        assignedTo: adminAssignee || undefined,
        department: adminDept || undefined,
        resolvedImage: adminStatus === "RESOLVED" ? (resolvedPhoto || "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80") : undefined
      });
      alert("Municipal database updated successfully!");
    }
  };

  const getSeverityLabelColor = (severity: Severity) => {
    switch (severity) {
      case "CRITICAL": return "text-red-600 bg-red-50 border-red-100";
      case "HIGH": return "text-orange-600 bg-orange-50 border-orange-100";
      case "MEDIUM": return "text-amber-600 bg-amber-50 border-amber-100";
      default: return "text-sky-600 bg-sky-50 border-sky-100";
    }
  };

  const hasUpvoted = issue.upvotes.includes(currentUser.id);

  return (
    <div id="issue_details_overlay" className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      {/* Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:grid md:grid-cols-12">
        
        {/* LEFT COLUMN: Visual Media & Timeline (Col span 5) */}
        <div className="md:col-span-5 bg-slate-50 border-r border-slate-100 flex flex-col overflow-y-auto">
          {/* Main Photo block */}
          <div className="relative h-56 md:h-64 flex-shrink-0">
            <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <button
              onClick={onClose}
              className="md:hidden absolute top-3.5 right-3.5 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Side-by-Side Resolution Photo (If resolved) */}
          {issue.status === "RESOLVED" && (
            <div className="p-4 border-b border-slate-100 space-y-1.5 bg-emerald-50/50">
              <span className="text-[9px] font-black tracking-wider uppercase text-emerald-800 flex items-center gap-1">
                <CheckCircle2 size={12} /> Resolved Proof Photo
              </span>
              <img 
                src={issue.resolvedImage || "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80"} 
                alt="Resolved proof" 
                className="w-full h-32 object-cover rounded-xl border border-emerald-100 shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Interactive Timeline Tracker */}
          <div className="p-5 flex-grow space-y-4">
            <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Activity size={12} className="text-blue-600" />
              Resolution Tracking Timeline
            </h5>
            
            <div className="relative pl-5 space-y-4">
              {/* Timeline continuous guide line */}
              <div className="absolute left-[7px] top-1.5 bottom-1.5 w-[2px] bg-slate-200" />

              {timelineSteps.map((step, idx) => {
                const isPassed = idx <= currentStatusIndex;
                const isCurrent = idx === currentStatusIndex;
                return (
                  <div key={step.status} className="relative flex items-start gap-3">
                    {/* Circle Node indicator */}
                    <div className={`absolute -left-[23px] w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isPassed 
                        ? "bg-blue-600 border-blue-600 shadow-sm shadow-blue-600/30" 
                        : "bg-white border-slate-300"
                    }`}>
                      {isPassed && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>

                    <div className="space-y-0.5">
                      <p className={`text-xs font-bold ${
                        isCurrent ? "text-blue-600 font-black" :
                        isPassed ? "text-slate-700" : "text-slate-400"
                      }`}>
                        {step.label} {isCurrent && "• Active"}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-normal font-medium">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Info Content & Conversation Engine (Col span 7) */}
        <div className="md:col-span-7 flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header Block */}
          <div className="p-5 border-b border-slate-100 flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full border ${getSeverityLabelColor(issue.severity)}`}>
                  {issue.severity} severity
                </span>
                <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase">
                  Score: {issue.priorityScore}/100
                </span>
                {issue.isDuplicate && (
                  <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase flex items-center gap-0.5">
                    <AlertTriangle size={10} /> Duplicate report
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-800 text-lg leading-snug">{issue.title}</h3>
              <p className="text-[10px] text-slate-400 font-semibold flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1"><MapPin size={11} />{issue.address}</span>
                <span className="flex items-center gap-1"><Clock size={11} />Reported {new Date(issue.reportedAt).toLocaleDateString()}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="hidden md:block bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-xl transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Details Scrollable Section */}
          <div className="p-5 flex-grow overflow-y-auto space-y-5">
            {/* Citizen Original Report */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Citizen Observation</p>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">{issue.description}</p>
              <div className="flex items-center gap-2 pt-1 text-[10px] font-semibold text-slate-400 bg-slate-50/50 p-2 rounded-xl border border-slate-100/30">
                <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  {issue.reportedBy.charAt(0)}
                </div>
                <span>Filed by {issue.reportedBy}</span>
              </div>
            </div>

            {/* AI Diagnosis Details */}
            <div className="bg-blue-50/70 border border-blue-100/50 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-1 text-[10px] font-black text-blue-900 uppercase tracking-wider">
                <Cpu size={14} className="text-blue-600 animate-pulse" />
                Gemini AI Municipal Dispatch Report
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Responsible Municipal Sector</span>
                  <span className="font-semibold text-slate-800">{issue.department}</span>
                </div>
                {issue.assignedTo && (
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Dispatched Squad</span>
                    <span className="font-semibold text-slate-800">{issue.assignedTo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Verification upvote trigger bar */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-700">Seen this issue too?</p>
                <p className="text-[10px] text-slate-400 font-semibold">Verify to push up priority ranking</p>
              </div>
              <button
                type="button"
                onClick={() => onVote(issue.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  hasUpvoted 
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20" 
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <ThumbsUp size={12} className={hasUpvoted ? "fill-white text-white" : ""} />
                {hasUpvoted ? "Verified!" : "Verify Issue"}
                <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[10px] ml-1">
                  {issue.upvotes.length}
                </span>
              </button>
            </div>

            {/* Admin console trigger */}
            {currentUser.role === "ADMIN" && (
              <div className="border border-blue-150 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdminConsole(!showAdminConsole)}
                  className="w-full bg-blue-50 hover:bg-blue-100 px-4 py-2.5 text-xs font-bold text-blue-950 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5"><ShieldAlert size={14} className="text-blue-600" /> Admin Command Center</span>
                  <span className="text-[10px] text-blue-600 font-semibold">{showAdminConsole ? "Hide" : "Show"}</span>
                </button>

                {showAdminConsole && (
                  <div className="p-4 bg-blue-50/20 space-y-3 text-xs border-t border-blue-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Update Resolution Status</label>
                        <select
                          value={adminStatus}
                          onChange={(e) => setAdminStatus(e.target.value as IssueStatus)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                        >
                          <option value="REPORTED">Reported</option>
                          <option value="VERIFIED">Verified</option>
                          <option value="ASSIGNED">Assigned</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Assign Department</label>
                        <input
                          type="text"
                          value={adminDept}
                          onChange={(e) => setAdminDept(e.target.value)}
                          placeholder="e.g. Sanitation Division"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Dispatch Maintenance Crew</label>
                        <input
                          type="text"
                          value={adminAssignee}
                          onChange={(e) => setAdminAssignee(e.target.value)}
                          placeholder="e.g. Hydraulics Squad 4"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>

                      {adminStatus === "RESOLVED" && (
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Resolution Image URL</label>
                          <input
                            type="text"
                            value={resolvedPhoto}
                            onChange={(e) => setResolvedPhoto(e.target.value)}
                            placeholder="Proof of fix URL..."
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                          />
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAdminUpdate}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-[11px] flex items-center gap-1 shadow-sm shadow-blue-600/10 cursor-pointer"
                      >
                        <UserCheck size={12} />
                        Apply Dispatch Commands
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Citizen Comments conversation block */}
            <div className="space-y-3">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <MessageSquare size={12} />
                Community Verification & Discussion
              </h5>

              {/* Message Feed list */}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {issue.comments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic font-medium">No community comments posted. Be the first to verify or comment!</p>
                ) : (
                  issue.comments.map((comm) => (
                    <div key={comm.id} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl space-y-1 text-xs">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span className="text-slate-700 font-bold">{comm.userName}</span>
                        <span>{new Date(comm.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-600 font-normal leading-normal">{comm.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment Form */}
              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question or add verification details..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-grow px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-white"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-md shadow-blue-600/10"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
