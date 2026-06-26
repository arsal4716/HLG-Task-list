import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiGrid,
  FiCheckSquare,
  FiColumns,
  FiCalendar,
  FiUsers,
  FiBarChart2,
  FiAward,
  FiSettings,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ROLES } from '../utils/constants.js';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/tasks', label: 'Tasks', icon: FiCheckSquare },
  { to: '/board', label: 'Kanban', icon: FiColumns },
  { to: '/calendar', label: 'Calendar', icon: FiCalendar },
  { to: '/users', label: 'Team', icon: FiUsers, roles: [ROLES.OWNER, ROLES.MANAGER] },
  { to: '/reports', label: 'Reports', icon: FiBarChart2, roles: [ROLES.OWNER, ROLES.MANAGER] },
  { to: '/performance', label: 'Performance', icon: FiAward, roles: [ROLES.OWNER, ROLES.MANAGER] },
  { to: '/settings', label: 'Settings', icon: FiSettings, roles: [ROLES.OWNER] },
];

export const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();
  const items = NAV.filter((n) => !n.roles || n.roles.includes(user?.role));

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white font-bold shadow-sm">
          H
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">HLG Tasks</p>
          <p className="text-[11px] text-gray-400">Team Workspace</p>
        </div>
        <button onClick={onClose} className="btn-ghost ml-auto p-1.5 lg:hidden">
          <FiX className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-4 text-[11px] text-gray-400 dark:border-gray-800">
        © {new Date().getFullYear()} HLG Team
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:block">
        {content}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl dark:bg-gray-900"
          >
            {content}
          </motion.aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
