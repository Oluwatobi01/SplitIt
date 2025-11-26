import React from 'react';
import { NavLink } from 'react-router-dom';

const BottomNav: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-lg border-t border-slate-200 dark:border-white/10 pb-safe">
      <div className="grid grid-cols-4 items-center justify-items-center p-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2 px-3 rounded-full transition-colors ${
              isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <p className="text-xs font-bold">Home</p>
        </NavLink>

        <NavLink
          to="/groups"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2 px-3 rounded-full transition-colors ${
              isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
          <p className="text-xs font-medium">Groups</p>
        </NavLink>

        <NavLink
          to="/activity"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2 px-3 rounded-full transition-colors ${
              isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
          <p className="text-xs font-medium">Activity</p>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2 px-3 rounded-full transition-colors ${
              isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          <p className="text-xs font-medium">Profile</p>
        </NavLink>
      </div>
    </div>
  );
};

export default BottomNav;