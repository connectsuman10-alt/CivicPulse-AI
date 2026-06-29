import { Issue, Category, Severity } from "../types";
import { 
  MapPin, 
  Clock, 
  MessageSquare, 
  ChevronRight, 
  Droplets, 
  Trash2, 
  Lightbulb, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle,
  ThumbsUp
} from "lucide-react";

interface IssueCardProps {
  issue: Issue;
  onSelect: (issue: Issue) => void;
  onVote: (issueId: string) => void;
  currentUserId: string;
}

export default function IssueCard({ issue, onSelect, onVote, currentUserId }: IssueCardProps) {
  
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

  const getSeverityBadgeClass = (severity: Severity) => {
    switch (severity) {
      case "CRITICAL": return "bg-red-50 text-red-700 border-red-100";
      case "HIGH": return "bg-orange-50 text-orange-700 border-orange-100";
      case "MEDIUM": return "bg-amber-50 text-amber-700 border-amber-100";
      default: return "bg-sky-50 text-sky-700 border-sky-100";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "RESOLVED": return "bg-emerald-500 text-white";
      case "IN_PROGRESS": return "bg-blue-600 text-white animate-pulse";
      case "ASSIGNED": return "bg-blue-600 text-white";
      case "VERIFIED": return "bg-amber-500 text-white";
      default: return "bg-slate-500 text-white";
    }
  };

  const getRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const hasUpvoted = issue.upvotes.includes(currentUserId);

  return (
    <div id={`issue_card_${issue.id}`} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200/55 transition-all overflow-hidden flex flex-col justify-between h-full group">
      {/* Visual Header Image */}
      <div className="relative h-44 overflow-hidden bg-slate-50">
        <img
          src={issue.imageUrl}
          alt={issue.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        
        {/* Badges on overlay */}
        <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 items-start">
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getSeverityBadgeClass(issue.severity)}`}>
            {issue.severity}
          </span>
        </div>

        <div className="absolute top-3.5 right-3.5">
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm ${getStatusBadgeClass(issue.status)}`}>
            {issue.status}
          </span>
        </div>
      </div>

      {/* Card Content Description */}
      <div className="p-4 flex-grow space-y-3">
        {/* Category & Date */}
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100/50">
            {getCategoryIcon(issue.category)}
            <span className="uppercase tracking-wider text-[9px]">{issue.category.replace("_", " ")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={10} />
            <span>{getRelativeTime(issue.reportedAt)}</span>
          </div>
        </div>

        {/* Title */}
        <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
          {issue.title}
        </h4>

        {/* Description snippet */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {issue.description}
        </p>

        {/* Address Location tag */}
        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 truncate">
          <MapPin size={11} className="text-slate-300 flex-shrink-0" />
          <span className="truncate">{issue.address}</span>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
        {/* Upvotes & Comments metrics */}
        <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onVote(issue.id);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
              hasUpvoted 
                ? "bg-blue-50 text-blue-700 border-blue-100 shadow-sm" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <ThumbsUp size={10} className={hasUpvoted ? "fill-blue-600" : ""} />
            <span>{issue.upvotes.length}</span>
          </button>

          <div className="flex items-center gap-1 text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-xl">
            <MessageSquare size={10} />
            <span>{issue.comments.length}</span>
          </div>
        </div>

        {/* Action Inspect Button */}
        <button
          onClick={() => onSelect(issue)}
          className="flex items-center gap-0.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer group/btn"
        >
          Inspect
          <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
