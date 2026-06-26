import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiMoon, FiSun, FiBell, FiLogOut, FiUser, FiChevronDown } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useSocket } from '../contexts/SocketContext.jsx';
import { notificationService } from '../services/index.js';
import { Avatar } from '../components/ui/Avatar.jsx';
import { TimerWidget } from '../components/task/TimerWidget.jsx';

export const Navbar = ({ onMenu }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const { data: unread } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationService.unreadCount(),
    refetchInterval: 60000,
  });
  const count = unread?.data?.count || 0;

  useEffect(() => {
    const onClick = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/80 px-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
      <button onClick={onMenu} className="btn-ghost p-2 lg:hidden">
        <FiMenu className="h-5 w-5" />
      </button>

      <div className="hidden items-center gap-2 sm:flex">
        <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span className="text-xs text-gray-400">{connected ? 'Live' : 'Offline'}</span>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <TimerWidget />

        <button onClick={toggleTheme} className="btn-ghost p-2" aria-label="Toggle theme">
          {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
        </button>

        <Link to="/notifications" className="btn-ghost relative p-2" aria-label="Notifications">
          <FiBell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Link>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Avatar user={user} size="md" />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-tight">{user?.name}</p>
              <p className="text-[11px] text-gray-400">{user?.role}</p>
            </div>
            <FiChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 animate-slide-up overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="truncate text-xs text-gray-400">{user?.email}</p>
              </div>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
                <FiUser className="h-4 w-4" /> My Profile
              </Link>
              <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                <FiLogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
