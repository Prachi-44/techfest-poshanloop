import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Role, DemoUser } from '../types';

const DEMO_USERS: DemoUser[] = [
  { id: 'aww-1', name: 'Sunita Devi', role: 'AWW', centre: 'AWC Rampur', block: 'Sadar' },
  { id: 'asha-1', name: 'Meena Kumari', role: 'ASHA_ANM', centre: 'SC Rampur', block: 'Sadar' },
  { id: 'facility-1', name: 'Dr. Priya Singh', role: 'Facility', centre: 'PHC Sadar', block: 'Sadar' },
  { id: 'supervisor-1', name: 'Ravi Kumar', role: 'Supervisor', block: 'Sadar' },
];

interface RoleContextValue {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  currentUser: DemoUser;
  demoUsers: DemoUser[];
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRoleState] = useState<Role>(() => {
    return (localStorage.getItem('demoRole') as Role) || 'Supervisor';
  });

  const setCurrentRole = useCallback((role: Role) => {
    setCurrentRoleState(role);
    localStorage.setItem('demoRole', role);
  }, []);

  const currentUser = DEMO_USERS.find((u) => u.role === currentRole) || DEMO_USERS[3];

  return (
    <RoleContext.Provider value={{ currentRole, setCurrentRole, currentUser, demoUsers: DEMO_USERS }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
