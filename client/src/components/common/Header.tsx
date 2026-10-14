import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, LogOut, User, Clock, Building2 } from 'lucide-react';
import { ApiClient } from '../../services/api';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [timeStr, setTimeStr] = useState<string>('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('en-GB', {
          timeZone: 'Asia/Colombo',
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      ApiClient.get<any[]>('/notifications')
        .then((res) => {
          if (res.success && res.data) setNotifications(res.data);
        })
        .catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60">
          <Clock className="w-3.5 h-3.5 text-brand-600" />
          <span>Colombo (Asia/Colombo): {timeStr}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span>Currency: LKR (Rs.)</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white p-3 shadow-lg border border-slate-200 z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Notifications
                </span>
                <span className="text-[11px] text-slate-400">{unreadCount} unread</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No notifications</p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className="p-2 rounded-lg bg-slate-50 text-xs">
                      <p className="font-semibold text-slate-800">{n.title}</p>
                      <p className="text-slate-600 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-900">{user?.fullName}</span>
            <span className="text-[10px] font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
              {user?.role?.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-950 text-xs font-bold text-white uppercase shadow-sm">
            {user?.firstName?.[0] || 'U'}
          </div>

          <button
            onClick={logout}
            title="Sign out"
            className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
