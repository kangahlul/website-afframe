import React, { useState, useEffect } from 'react';
import {
  Globe, Plus, Trash2, Edit3, ArrowUp, ArrowDown, Eye, EyeOff,
  Check, X, FileText, ExternalLink
} from 'lucide-react';
import { NavigationItem, DynamicPage } from '../../types';
import { api } from '../../lib/api';
import { useSite } from '../../context/SiteContext';

export const NavigationPagesManager: React.FC = () => {
  const { refreshSiteData } = useSite();
  const [navItems, setNavItems] = useState<NavigationItem[]>([]);
  const [pages, setPages] = useState<DynamicPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'nav' | 'pages'>('nav');
  const [locationFilter, setLocationFilter] = useState<'header' | 'footer'>('header');

  // Add / Edit Navigation Item Modal
  const [showNavModal, setShowNavModal] = useState(false);
  const [editingNavItem, setEditingNavItem] = useState<NavigationItem | null>(null);
  const [navLabel, setNavLabel] = useState('');
  const [navUrl, setNavUrl] = useState('');
  const [navLocation, setNavLocation] = useState<'header' | 'footer'>('header');
  const [navTarget, setNavTarget] = useState('_self');

  // Add / Edit Page Modal
  const [showPageModal, setShowPageModal] = useState(false);
  const [editingPage, setEditingPage] = useState<DynamicPage | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageDesc, setPageDesc] = useState('');
  const [pageSeoTitle, setPageSeoTitle] = useState('');
  const [pageSeoDesc, setPageSeoDesc] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [navRes, pageRes] = await Promise.all([
        api.get<{ items: NavigationItem[] }>('/content/navigation', { all: true }),
        api.get<{ pages: DynamicPage[] }>('/content/pages', { all: true }),
      ]);
      setNavItems(navRes.items || []);
      setPages(pageRes.pages || []);
    } catch (err) {
      console.error('Failed to load navigation or pages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddNav = () => {
    setEditingNavItem(null);
    setNavLabel('');
    setNavUrl('');
    setNavLocation(locationFilter);
    setNavTarget('_self');
    setShowNavModal(true);
  };

  const openEditNav = (item: NavigationItem) => {
    setEditingNavItem(item);
    setNavLabel(item.label);
    setNavUrl(item.url);
    setNavLocation(item.location);
    setNavTarget(item.target || '_self');
    setShowNavModal(true);
  };

  const handleSaveNav = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNavItem) {
        await api.put(`/content/navigation/${editingNavItem.id}`, {
          label: navLabel,
          url: navUrl,
          location: navLocation,
          target: navTarget
        });
      } else {
        await api.post('/content/navigation', {
          label: navLabel,
          url: navUrl,
          location: navLocation,
          target: navTarget
        });
      }
      setShowNavModal(false);
      fetchData();
      refreshSiteData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan menu navigasi');
    }
  };

  const handleDeleteNav = async (id: number) => {
    if (window.confirm('Hapus tautan navigasi ini?')) {
      try {
        await api.delete(`/content/navigation/${id}`);
        fetchData();
        refreshSiteData();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus tautan');
      }
    }
  };

  const toggleNavVisibility = async (item: NavigationItem) => {
    try {
      await api.put(`/content/navigation/${item.id}`, { is_visible: item.is_visible ? 0 : 1 });
      fetchData();
      refreshSiteData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah visibilitas');
    }
  };

  // Dynamic pages handlers
  const openAddPage = () => {
    setEditingPage(null);
    setPageTitle('');
    setPageSlug('');
    setPageDesc('');
    setPageSeoTitle('');
    setPageSeoDesc('');
    setShowPageModal(true);
  };

  const openEditPage = (page: DynamicPage) => {
    setEditingPage(page);
    setPageTitle(page.title);
    setPageSlug(page.slug);
    setPageDesc(page.description || '');
    setPageSeoTitle(page.seo_title || page.title);
    setPageSeoDesc(page.seo_description || page.description || '');
    setShowPageModal(true);
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPage) {
        await api.put(`/content/pages/${editingPage.id}`, {
          title: pageTitle,
          slug: pageSlug,
          description: pageDesc,
          seo_title: pageSeoTitle,
          seo_description: pageSeoDesc
        });
      } else {
        await api.post('/content/pages', {
          title: pageTitle,
          slug: pageSlug,
          description: pageDesc,
          seo_title: pageSeoTitle,
          seo_description: pageSeoDesc
        });
      }
      setShowPageModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan halaman.');
    }
  };

  const handleDeletePage = async (id: number) => {
    if (window.confirm('Hapus halaman kustom ini?')) {
      try {
        await api.delete(`/content/pages/${id}`);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus halaman.');
      }
    }
  };

  const filteredNav = navItems.filter(n => n.location === locationFilter);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-light">
            Navigation & Page Manager
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Kelola menu bar header, tautan footer, serta pembuatan halaman konten kustom AFFRAME.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'nav' ? (
            <button
              onClick={openAddNav}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Tautan Navigasi</span>
            </button>
          ) : (
            <button
              onClick={openAddPage}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Halaman Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 gap-6 text-xs">
        <button
          onClick={() => setActiveTab('nav')}
          className={`pb-3 font-semibold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'nav'
              ? 'border-[#C5A880] text-white'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Menu Navigasi ({navItems.length})
        </button>
        <button
          onClick={() => setActiveTab('pages')}
          className={`pb-3 font-semibold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'pages'
              ? 'border-[#C5A880] text-white'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Halaman Konten Dinamis ({pages.length})
        </button>
      </div>

      {/* TAB 1: NAVIGATION ITEMS */}
      {activeTab === 'nav' && (
        <div className="space-y-4">
          {/* Location filter (Header / Footer) */}
          <div className="flex gap-2">
            <button
              onClick={() => setLocationFilter('header')}
              className={`px-3 py-1.5 rounded text-xs uppercase tracking-wider font-medium transition-colors ${
                locationFilter === 'header'
                  ? 'bg-[#C5A880] text-[#0C0C0D] font-bold'
                  : 'bg-[#18181D] text-zinc-400 border border-zinc-800'
              }`}
            >
              Header Menu Bar
            </button>
            <button
              onClick={() => setLocationFilter('footer')}
              className={`px-3 py-1.5 rounded text-xs uppercase tracking-wider font-medium transition-colors ${
                locationFilter === 'footer'
                  ? 'bg-[#C5A880] text-[#0C0C0D] font-bold'
                  : 'bg-[#18181D] text-zinc-400 border border-zinc-800'
              }`}
            >
              Footer Links
            </button>
          </div>

          <div className="bg-[#121215] border border-[#24242A] rounded-sm divide-y divide-zinc-800/80">
            {filteredNav.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                Belum ada menu di lokasi ini.
              </div>
            ) : (
              filteredNav.map((item, idx) => (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-zinc-500 w-5">#{idx + 1}</span>
                    <div>
                      <h4 className="text-sm font-medium text-white">{item.label}</h4>
                      <code className="text-[11px] text-[#C5A880]">{item.url}</code>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleNavVisibility(item)}
                      className={`p-1.5 rounded ${item.is_visible ? 'text-emerald-400' : 'text-zinc-600'}`}
                      title={item.is_visible ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {item.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEditNav(item)}
                      className="p-1.5 rounded text-zinc-400 hover:text-white"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNav(item.id)}
                      className="p-1.5 rounded text-zinc-600 hover:text-red-400"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DYNAMIC PAGES */}
      {activeTab === 'pages' && (
        <div className="space-y-4">
          <div className="bg-[#121215] border border-[#24242A] rounded-sm divide-y divide-zinc-800/80">
            {pages.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                Belum ada halaman dinamis kustom.
              </div>
            ) : (
              pages.map(page => (
                <div key={page.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-white">{page.title}</h4>
                    <p className="text-xs text-zinc-500">URL Slug: /{page.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditPage(page)}
                      className="p-1.5 rounded text-zinc-400 hover:text-white"
                      title="Edit Halaman"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePage(page.id)}
                      className="p-1.5 rounded text-zinc-600 hover:text-red-400"
                      title="Hapus Halaman"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Navigation Modal */}
      {showNavModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowNavModal(false)}
        >
          <div
            className="bg-[#141418] border border-zinc-800 max-w-md w-full rounded-sm p-6 space-y-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-serif text-lg text-white">
                {editingNavItem ? 'Edit Tautan Navigasi' : 'Tambah Tautan Navigasi'}
              </h3>
              <button onClick={() => setShowNavModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNav} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Label Menu (Nama)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Paket & Harga"
                  value={navLabel}
                  onChange={e => setNavLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">URL / Tujuan Tautan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: /services atau /#about atau https://..."
                  value={navUrl}
                  onChange={e => setNavUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Lokasi Tautan</label>
                  <select
                    value={navLocation}
                    onChange={e => setNavLocation(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  >
                    <option value="header">Header Navbar</option>
                    <option value="footer">Footer Menu</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Target Tautan</label>
                  <select
                    value={navTarget}
                    onChange={e => setNavTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  >
                    <option value="_self">Tab Saat Ini (_self)</option>
                    <option value="_blank">Tab Baru (_blank)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNavModal(false)}
                  className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C5A880] text-[#0C0C0D] font-semibold rounded text-xs uppercase"
                >
                  Simpan Tautan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Page Modal */}
      {showPageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowPageModal(false)}
        >
          <div
            className="bg-[#141418] border border-zinc-800 max-w-lg w-full rounded-sm p-6 space-y-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-serif text-lg text-white">
                {editingPage ? 'Edit Halaman Konten' : 'Buat Halaman Konten Baru'}
              </h3>
              <button onClick={() => setShowPageModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePage} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Judul Halaman</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: FAQ Khusus Wisuda"
                  value={pageTitle}
                  onChange={e => setPageTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">URL Slug</label>
                <input
                  type="text"
                  placeholder="faq-wisuda"
                  value={pageSlug}
                  onChange={e => setPageSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Deskripsi Halaman</label>
                <textarea
                  rows={3}
                  value={pageDesc}
                  onChange={e => setPageDesc(e.target.value)}
                  placeholder="Deskripsi singkat konten halaman..."
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPageModal(false)}
                  className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C5A880] text-[#0C0C0D] font-semibold rounded text-xs uppercase"
                >
                  Simpan Halaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
