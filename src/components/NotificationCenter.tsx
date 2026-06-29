import { useEffect, useState } from "react";
import { Notification } from "../types";
import { Bell, CheckCheck, Clock, X, MessageSquare, AlertTriangle, RefreshCw } from "lucide-react";

interface NotificationCenterProps {
  userId: string;
  onClose: () => void;
  onNavigateToIssue: (issueId: string) => void;
}

export default function NotificationCenter({ userId, onClose, onNavigateToIssue }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "STATUS_CHANGE":
        return <RefreshCw size={14} className="text-blue-600 animate-spin" />;
      case "NEW_COMMENT":
        return <MessageSquare size={14} className="text-emerald-600" />;
      case "DUPLICATE_FLAG":
        return <AlertTriangle size={14} className="text-amber-600 animate-pulse" />;
      default:
        return <Bell size={14} className="text-slate-500" />;
    }
  };

  return (
    <div id="notification_sidebar" className="fixed inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl border-l border-slate-100 p-5 z-50 flex flex-col justify-between">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-blue-600 animate-bounce" />
            <h3 className="font-bold text-slate-800 text-sm">Citizen Action Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Action Controls */}
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="w-full text-left flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 p-1.5 rounded-lg transition-all cursor-pointer"
          >
            <CheckCheck size={12} />
            Mark all notifications as read
          </button>
        )}

        {/* Notification List Scroll container */}
        <div className="space-y-2 overflow-y-auto max-h-[70vh] pr-1">
          {loading ? (
            <p className="text-xs text-slate-400 italic text-center py-10">Fetching feed...</p>
          ) : notifications.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-10 font-medium">Your civic tracking feed is quiet. No new alerts!</p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  onNavigateToIssue(notif.issueId);
                  onClose();
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                  notif.isRead 
                    ? "bg-white border-slate-50 text-slate-500" 
                    : "bg-blue-50/40 border-blue-100 text-slate-800 font-medium shadow-sm"
                } hover:border-slate-200`}
              >
                <div className={`p-2 h-fit rounded-xl ${notif.isRead ? "bg-slate-100 text-slate-400" : "bg-white text-blue-600 border border-blue-100"}`}>
                  {getNotificationIcon(notif.type)}
                </div>
                <div className="space-y-1 text-xs">
                  <p className="leading-snug">{notif.text}</p>
                  <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-0.5">
                    <Clock size={8} /> {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer message */}
      <div className="pt-3 border-t border-slate-50 text-[10px] text-slate-400 font-semibold text-center">
        CivicAlert Notification Center • Live Server Sync Active
      </div>
    </div>
  );
}
