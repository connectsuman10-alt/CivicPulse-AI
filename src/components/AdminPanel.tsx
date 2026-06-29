import { useState } from "react";
import { Issue, IssueStatus, Category, Severity } from "../types";
import { 
  ShieldAlert, 
  Search, 
  MapPin, 
  UserCheck, 
  Activity, 
  CheckCircle, 
  Clock, 
  Filter, 
  Eye, 
  ChevronRight,
  AlertTriangle,
  Droplets,
  Trash2,
  Lightbulb
} from "lucide-react";

interface AdminPanelProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onUpdateStatus: (issueId: string, updates: { status: IssueStatus; assignedTo?: string; department?: string; resolvedImage?: string }) => void;
}

export default function AdminPanel({ issues, onSelectIssue, onUpdateStatus }: AdminPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const getCategoryIcon = (category: Category, size = 14) => {
    switch (category) {
      case "POTHOLE": return <AlertTriangle size={size} className="text-amber-500" />;
      case "GARBAGE": return <Trash2 size={size} className="text-emerald-500" />;
      case "WATER_LEAK": return <Droplets size={size} className="text-blue-500" />;
      case "STREETLIGHT": return <Lightbulb size={size} className="text-yellow-500" />;
      case "ROAD_DAMAGE": return <ShieldAlert size={size} className="text-orange-500" />;
      default: return <ShieldAlert size={size} className="text-slate-500" />;
    }
  };

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case "CRITICAL": return "text-red-700 bg-red-50 border-red-100";
      case "HIGH": return "text-orange-700 bg-orange-50 border-orange-100";
      case "MEDIUM": return "text-amber-700 bg-amber-50 border-amber-100";
      default: return "text-sky-700 bg-sky-50 border-sky-100";
    }
  };

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case "RESOLVED": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800 border-blue-200";
      case "ASSIGNED": return "bg-blue-100 text-blue-800 border-blue-200";
      case "VERIFIED": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // Extract all unique departments for filters
  const departments = Array.from(new Set(issues.map(i => i.department).filter(Boolean)));

  // Filter & Search issues list
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = filterDept === "ALL" || issue.department === filterDept;
    const matchesStatus = filterStatus === "ALL" || issue.status === filterStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div id="admin_control_page" className="space-y-6">
      {/* Admin Title Block */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 justify-between flex-wrap">
        <div className="flex items-center gap-2">
          <div className="bg-rose-50 p-2.5 rounded-2xl text-rose-600">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Municipal Admin Command Center</h3>
            <p className="text-xs text-slate-500">Dispatch technical squads, verify citizen reports, and audit civic statuses</p>
          </div>
        </div>
        <div className="text-[10px] bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl text-emerald-800 font-bold flex items-center gap-1.5 animate-pulse">
          <CheckCircle size={12} /> Database Connection Stable
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search tickets by title, area, keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-white"
          />
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Multi-Filter options */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter size={12} />
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Municipal Sectors</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="REPORTED">Reported</option>
            <option value="VERIFIED">Verified</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* DATADENSE TABLE SPREADSHEET */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4 py-3 font-black">ID</th>
                <th className="p-4 py-3 font-black">Report Details</th>
                <th className="p-4 py-3 font-black">Responsible Dept</th>
                <th className="p-4 py-3 font-black text-center">Severity</th>
                <th className="p-4 py-3 font-black text-center">Status</th>
                <th className="p-4 py-3 font-black text-center">Verifications</th>
                <th className="p-4 py-3 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 italic">
                    No active municipal tickets match the current filter selection.
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => (
                  <tr key={issue.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors font-medium">
                    {/* ID */}
                    <td className="p-4 font-mono text-slate-400 font-semibold">{issue.id}</td>

                    {/* Report info */}
                    <td className="p-4 max-w-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {getCategoryIcon(issue.category)}
                          <p className="font-bold text-slate-800 text-xs truncate leading-snug">{issue.title}</p>
                        </div>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate font-semibold">
                          <MapPin size={9} /> {issue.address}
                        </p>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="p-4 font-semibold text-slate-600 truncate max-w-[150px]">{issue.department}</td>

                    {/* Severity */}
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getSeverityColor(issue.severity)}`}>
                        {issue.severity}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${getStatusBadge(issue.status)}`}>
                        {issue.status}
                      </span>
                    </td>

                    {/* Upvotes / Verifications count */}
                    <td className="p-4 text-center text-slate-700 font-bold font-mono">
                      {issue.upvotes.length} Votes
                    </td>

                    {/* Action buttons */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => onSelectIssue(issue)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-xl border border-blue-100/50 flex items-center gap-1 justify-end ml-auto cursor-pointer"
                      >
                        <Eye size={12} /> Inspect & Dispatch
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
