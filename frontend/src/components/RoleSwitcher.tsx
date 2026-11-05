import React from 'react';
import type { Role } from '../types';
import { useRole } from '../contexts/RoleContext';

interface Props {
  inline?: boolean;
}

export default function RoleSwitcher({ inline }: Props) {
  const { currentRole, setCurrentRole, currentUser, demoUsers } = useRole();

  return (
    <div className={inline ? '' : 'mb-4'}>
      <div className="bg-amber-50 border border-amber-300 rounded px-3 py-2 text-sm text-amber-900">
        <span className="font-semibold">⚙ Demo Mode</span> — Role switching is a prototype feature, not production authentication
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-sm text-navy-700 font-medium mr-1">Role:</span>
        {demoUsers.map((u) => (
          <button
            key={u.id}
            onClick={() => setCurrentRole(u.role)}
            className={`px-3 py-1 text-sm rounded border transition-colors ${
              currentRole === u.role
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-navy-700 border-navy-200 hover:border-teal-400'
            }`}
            aria-pressed={currentRole === u.role}
          >
            {u.role.replace('_', '/')}
          </button>
        ))}
        <span className="ml-2 text-sm text-navy-500">
          Signed in as <strong>{currentUser.name}</strong>
        </span>
      </div>
    </div>
  );
}
