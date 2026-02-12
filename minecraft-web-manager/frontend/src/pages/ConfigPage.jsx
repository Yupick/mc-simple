import { useState } from 'react';
import { Settings, FileText, Users, Shield } from 'lucide-react';
import ServerProperties from '../components/config/ServerProperties';
import Whitelist from '../components/config/Whitelist';
import Operators from '../components/config/Operators';

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState('properties');

  const tabs = [
    { id: 'properties', label: 'Server Properties', icon: FileText },
    { id: 'whitelist', label: 'Whitelist', icon: Users },
    { id: 'operators', label: 'Operadores', icon: Shield }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Settings className="w-8 h-8" />
          Configuración
        </h1>
        <p className="text-text-secondary mt-2">
          Administra la configuración del servidor, whitelist y operadores
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'properties' && <ServerProperties />}
        {activeTab === 'whitelist' && <Whitelist />}
        {activeTab === 'operators' && <Operators />}
      </div>
    </div>
  );
}
