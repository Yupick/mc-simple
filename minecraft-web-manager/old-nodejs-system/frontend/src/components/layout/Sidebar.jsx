import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  Globe,
  Plug,
  Database,
  Settings,
  ChevronDown,
  ChevronRight,
  Activity
} from 'lucide-react';
// import ServerStatusWidget from '../widgets/ServerStatusWidget';

const menuGroups = [
  {
    id: 'main',
    name: '',
    items: [
      {
        name: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard',
      },
    ],
  },
  {
    id: 'control',
    name: 'Control',
    expandable: true,
    items: [
      {
        name: 'Servidor',
        icon: Server,
        path: '/servidor',
      },
    ],
  },
  {
    id: 'management',
    name: 'Gestión',
    expandable: true,
    items: [
      {
        name: 'Mundos',
        icon: Globe,
        path: '/mundos',
      },
      {
        name: 'Plugins',
        icon: Plug,
        path: '/plugins',
      },
      {
        name: 'Backups',
        icon: Database,
        path: '/backups',
      },
    ],
  },
  {
    id: 'settings',
    name: '',
    items: [
      {
        name: 'Configuración',
        icon: Settings,
        path: '/configuracion',
      },
    ],
  },
];

export default function Sidebar() {
  const [expandedGroups, setExpandedGroups] = useState({
    control: true,
    management: true,
  });

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <aside className="w-[280px] bg-white border-r border-slate-200 min-h-screen flex flex-col shadow-soft">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-sm">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Minecraft</h1>
            <p className="text-xs text-text-secondary">Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {menuGroups.map((group) => (
          <div key={group.id} className="space-y-2">
            {/* Group Header */}
            {group.name && (
              <div
                className={`flex items-center justify-between px-3 py-1 ${
                  group.expandable ? 'cursor-pointer hover:bg-slate-50 rounded-md' : ''
                }`}
                onClick={() => group.expandable && toggleGroup(group.id)}
              >
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {group.name}
                </span>
                {group.expandable && (
                  expandedGroups[group.id] ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )
                )}
              </div>
            )}

            {/* Group Items */}
            {(!group.expandable || expandedGroups[group.id]) && (
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
                        isActive
                          ? 'bg-primary-50 text-primary-600 border-l-3 border-primary-500 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={`w-5 h-5 transition-colors ${
                            isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        <span className="font-medium text-sm">{item.name}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Server Status Widget */}
      <div className="p-4 border-t border-slate-200">
        {/* <ServerStatusWidget /> */}
        <div className="text-xs text-slate-500 text-center">
          Panel Web v1.0
        </div>
      </div>
    </aside>
  );
}
