import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Image, Palette, Layers, Globe, FolderKanban,
  Tags, Package, Inbox, Info, Sparkles, HelpCircle, FileText,
  MapPin, Settings, Search, UserCheck, LogOut, Menu, X, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSite } from '../../context/SiteContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { normalizeMediaUrl } from '../../lib/mediaUtils';

interface NavMenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

export const AdminLayout: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { settings } = useSite();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If loading, show elegant skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0C0C0D] flex items-center justify-center text-zinc-400 text-xs tracking-widest uppercase">
        Memverifikasi sesi CMS...
      </div>
    );
  }

  // If unauthenticated, redirect to login
  if (!isAuthenticated) {
    navigate('/admin/login');
    return null;
  }

  const menuSections: { title: string; items: NavMenuItem[] }[] = [
    {
      title: 'Utama',
      items: [
        { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Media Library', path: '/admin/media', icon: <Image className="w-4 h-4" /> },
        { label: 'Inquiries & Booking', path: '/admin/inquiries', icon: <Inbox className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Tampilan & Halaman',
      items: [
        { label: 'Brand Identity & Media', path: '/admin/brand', icon: <Palette className="w-4 h-4" /> },
        { label: 'Website Section Manager', path: '/admin/sections', icon: <Layers className="w-4 h-4" /> },
        { label: 'Navigation & Pages', path: '/admin/navigation', icon: <Globe className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Portofolio & Layanan',
      items: [
        { label: 'Proyek Portofolio', path: '/admin/portfolio', icon: <FolderKanban className="w-4 h-4" /> },
        { label: 'Kategori Portofolio', path: '/admin/categories', icon: <Tags className="w-4 h-4" /> },
        { label: 'Layanan & Paket', path: '/admin/services', icon: <Package className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Konten Website',
      items: [
        { label: 'Tentang AF Frame', path: '/admin/about', icon: <Info className="w-4 h-4" /> },
        { label: 'Kenapa Kami (Benefits)', path: '/admin/benefits', icon: <Sparkles className="w-4 h-4" /> },
        { label: 'FAQ', path: '/admin/faq', icon: <HelpCircle className="w-4 h-4" /> },
        { label: 'Syarat & Ketentuan', path: '/admin/terms', icon: <FileText className="w-4 h-4" /> },
        { label: 'Wilayah Layanan', path: '/admin/service-areas', icon: <MapPin className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Konfigurasi Sistem',
      items: [
        { label: 'Pengaturan Website', path: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
        { label: 'Pengaturan SEO', path: '/admin/seo', icon: <Search className="w-4 h-4" /> },
        { label: 'Akun Administrator', path: '/admin/account', icon: <UserCheck className="w-4 h-4" /> },
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#0C0C0D] text-zinc-200 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111114] border-r border-[#202026] flex flex-col justify-between transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand header in sidebar */}
          <div className="p-4 border-b border-[#202026] flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-2 group min-w-0">
              <BrandLogo size="sm" showSubtitle={false} />
              <span className="text-[9px] uppercase tracking-wider text-[#C5A880] font-mono px-1.5 py-0.5 bg-[#18181D] border border-zinc-800 rounded shrink-0">
                CMS
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-zinc-400 hover:text-white shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links list */}
          <div className="flex-grow overflow-y-auto p-4 space-y-6">
            {menuSections.map((sec, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold px-2.5 block mb-1">
                  {sec.title}
                </span>
                {sec.items.map((item, iIdx) => {
                  const isActive =
                    item.path === '/admin'
                      ? location.pathname === '/admin'
                      : location.pathname.startsWith(item.path);

                  return (
                    <Link
                      key={iIdx}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#C5A880] text-[#0C0C0D] font-semibold shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                      }`}
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer User Area */}
          <div className="p-4 border-t border-[#202026] bg-[#0E0E11] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="truncate">
                <p className="font-medium text-white truncate">{user?.username || 'Admin'}</p>
                <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                title="Keluar (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="h-16 bg-[#111114]/80 backdrop-blur-md border-b border-[#202026] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-medium text-zinc-400 hidden sm:inline">
              AF Frame Content Management System
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#1A1A20] hover:bg-[#25252D] text-xs font-medium text-zinc-300 hover:text-white border border-zinc-700/80 transition-colors"
            >
              <span>Lihat Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="p-4 sm:p-6 lg:p-8 flex-grow">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
