import React, { useState } from 'react';
import {
  Bell,
  BookOpen,
  Bot,
  Calendar,
  Compass,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Search,
  Settings,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { BrandLockup } from './BrandMark';
import type { AppView, PublicProfile, UserAccount } from '../types';

export type DashboardTab = Exclude<AppView, 'landing' | 'signin' | 'register' | 'call'>;

interface DashboardLayoutProps {
  activeView: DashboardTab;
  userAccount: UserAccount;
  publicProfile: PublicProfile;
  unreadNotifications: number;
  onNavigate: (view: DashboardTab) => void;
  onSignOut: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
  { id: 'matchmaking', label: 'Buscar debate', icon: Search },
  { id: 'test', label: 'Test ideológico', icon: FileSpreadsheet },
  { id: 'profile', label: 'Mi perfil ideológico', icon: Compass },
  { id: 'topics', label: 'Temas de debate', icon: Library },
  { id: 'groups', label: 'Debates en grupo', icon: Users },
  { id: 'ai_trainer', label: 'Entrenamiento IA', icon: Bot },
  { id: 'friends', label: 'Amigos y salas', icon: UserPlus },
  { id: 'knowledge', label: 'Diccionario y actualidad', icon: BookOpen },
  { id: 'history', label: 'Historial e informes', icon: History },
  { id: 'calendar', label: 'Calendario y avisos', icon: Calendar },
  { id: 'settings', label: 'Ajustes', icon: Settings },
];

export function DashboardLayout({
  activeView,
  userAccount,
  publicProfile,
  unreadNotifications,
  onNavigate,
  onSignOut,
  children,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderSidebarContent = () => (
    <div className="h-full flex flex-col justify-between bg-white border-r border-[#E8E3D8] py-6 px-4">
      <div className="space-y-6">
        <div className="px-2">
          <BrandLockup size="sm" onClick={() => onNavigate('overview')} />
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-sm text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#292820] text-white'
                    : 'text-[#777367] hover:bg-[#FAF9F5] hover:text-[#292820]'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? 'text-[#E6D8B9]' : 'text-[#A18450]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'calendar' && unreadNotifications > 0 && (
                  <span className="font-mono-tabular text-[10px] px-1.5 py-0.5 rounded-full bg-[#A18450] text-white">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-[#E8E3D8] space-y-3">
        <div className="px-2 space-y-0.5">
          <p className="text-xs font-semibold text-[#292820] truncate">
            {userAccount.displayName}
          </p>
          <p className="text-[11px] text-[#777367] truncate">
            @{userAccount.username} · ELO {publicProfile.elo}
          </p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#777367] hover:text-[#793B2B] hover:bg-[#FAF9F5] rounded-sm cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#292820] flex flex-col lg:flex-row">
      {/* Barra móvil */}
      <header className="lg:hidden h-16 px-4 bg-white border-b border-[#E8E3D8] flex items-center justify-between sticky top-0 z-30">
        <BrandLockup size="sm" onClick={() => onNavigate('overview')} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('calendar')}
            className="relative p-2 text-[#777367] cursor-pointer"
            aria-label="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#A18450]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 text-[#292820] cursor-pointer"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Sidebar escritorio */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen overflow-y-auto">
        {renderSidebarContent()}
      </aside>

      {/* Drawer móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-72 max-w-[85vw] h-full overflow-y-auto relative">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 p-1.5 text-[#777367] z-10 cursor-pointer"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
            {renderSidebarContent()}
          </div>
          <div
            className="flex-1 bg-[#292820]/35"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Contenido principal */}
      <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-10 py-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
