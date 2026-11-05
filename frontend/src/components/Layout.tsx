import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useRole } from '../contexts/RoleContext';
import type { Role } from '../types';
import ConnectionIndicator from './ConnectionIndicator';
import RoleSwitcher from './RoleSwitcher';

interface NavItem {
  to: string;
  label: string;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Overview', roles: ['AWW', 'ASHA_ANM', 'Facility', 'Supervisor'] },
  { to: '/children', label: 'Children Registry', roles: ['AWW', 'Supervisor'] },
  { to: '/trust-gate', label: 'Trust Gate', roles: ['AWW', 'Supervisor'] },
  { to: '/blindspot', label: 'BlindSpot Coverage', roles: ['Supervisor'] },
  { to: '/referrals', label: 'Referral Worklist', roles: ['ASHA_ANM', 'Supervisor'] },
  { to: '/facility', label: 'Facility Desk', roles: ['Facility'] },
  { to: '/offline', label: 'Offline Queue', roles: ['AWW', 'ASHA_ANM', 'Facility', 'Supervisor'] },
  { to: '/cause-finder', label: 'Cause Finder', roles: ['AWW', 'ASHA_ANM'] },
  { to: '/supervisor', label: 'Supervisor View', roles: ['Supervisor'] },
];

export default function Layout() {
  const { currentRole, currentUser } = useRole();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(currentRole));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-navy-900 text-white flex items-center px-4 py-2.5 gap-3 z-30">
        <button
          className="md:hidden text-white p-1"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <h1 className="text-lg font-bold tracking-wide">POSHANLOOP</h1>
        <span className="hidden sm:inline text-xs text-navy-300 ml-1">
          Maternal &amp; Early-Childhood Nutrition Follow-up
        </span>
        <div className="ml-auto flex items-center gap-3">
          <ConnectionIndicator />
          <span className="hidden md:inline text-sm text-navy-200">
            {currentUser.name} ({currentRole.replace('_', '/')})
          </span>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <nav
          className={`fixed md:static top-0 left-0 h-full md:h-auto w-60 bg-white border-r border-gray-200 z-20 transform transition-transform md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:flex md:flex-col pt-14 md:pt-0`}
          aria-label="Main navigation"
        >
          <div className="px-3 py-3 border-b border-gray-100">
            <RoleSwitcher inline />
          </div>
          <ul className="flex-1 py-2">
            {visibleItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-800 border-r-2 border-teal-600 font-medium'
                        : 'text-navy-700 hover:bg-navy-50'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto bg-slate-50 min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
