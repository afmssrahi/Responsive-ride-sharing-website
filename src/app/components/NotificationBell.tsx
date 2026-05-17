import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { notifications as notifApi } from "../services/api";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const load = () => {
    notifApi.getAll().then(res => {
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    }).catch(() => {});
  };

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await notifApi.markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  return (
    <div className="relative">
      <button onClick={() => { setOpen(!open); if (!open) markAllRead(); }} className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
            <div className="p-3 border-b border-gray-100 flex justify-between items-center">
              <span className="font-semibold text-sm text-gray-900">Notifications</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">No notifications</div>
              ) : (
                notifications.map((n: any) => (
                  <div key={n.id} className={`p-4 border-b border-gray-50 flex gap-3 ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                    <div className="mt-0.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Bell className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
