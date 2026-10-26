import React, { useState, useEffect } from 'react';
import { Tags, Plus, Edit3, Trash2, Eye, EyeOff, Upload, Check, X } from 'lucide-react';
import { PortfolioCategory } from '../../types';
import { api } from '../../lib/api';

export const PortfolioCategoriesManager: React.FC = () => {
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ categories: PortfolioCategory[] }>('/portfolio/categories', { all: true });
      setCategories(res.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setDescription('');
    setCoverUrl('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop');
    setShowModal(true);
  };

  const openEdit = (cat: PortfolioCategory) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setCoverUrl(cat.cover_image_url || '');
    setShowModal(true);
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadFiles([file], 'portfolio');
      if (res.assets && res.assets[0]) {
        setCoverUrl(res.assets[0].url);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah cover');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSaving(true);
      if (editingId) {
        await api.put(`/portfolio/categories/${editingId}`, {
          name,
          slug,
          description,
          cover_image_url: coverUrl,
          thumbnail_url: coverUrl
        });
      } else {
        await api.post('/portfolio/categories', {
          name,
          slug,
          description,
          cover_image_url: coverUrl,
          thumbnail_url: coverUrl
        });
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan kategori');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cat: PortfolioCategory) => {
    if (window.confirm(`Hapus kategori "${cat.name}"? Seluruh proyek portofolio yang ada di kategori ini akan tetap aman (dipindahkan ke "Tanpa Kategori").`)) {
      try {
        await api.delete(`/portfolio/categories/${cat.id}`);
        fetchCategories();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus kategori');
      }
    }
  };

  const toggleVisibility = async (cat: PortfolioCategory) => {
    try {
      await api.put(`/portfolio/categories/${cat.id}`, { is_visible: cat.is_visible ? 0 : 1 });
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah visibilitas');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-light">
            Kategori Portofolio
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Kelola taksonomi kategori karya visual AF Frame (Corporate, Graduation, Wedding, Creative, dll).
          </p>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Kategori Baru</span>
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => (
          <div
            key={cat.id}
            className="bg-[#121215] border border-[#24242A] rounded-sm overflow-hidden flex flex-col justify-between"
          >
            {/* Cover image banner */}
            <div className="relative aspect-[16/9] bg-black">
              {cat.cover_image_url ? (
                <img src={cat.cover_image_url} alt={cat.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <Tags className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-transparent opacity-80" />
              <span className="absolute top-3 left-3 px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold bg-black/80 text-[#C5A880] rounded">
                Slug: {cat.slug}
              </span>
            </div>

            {/* Content */}
            <div className="p-4 flex-grow space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg text-white font-medium">{cat.name}</h3>
                <span className="text-[10px] text-zinc-500 bg-[#1A1A20] px-2 py-0.5 rounded">
                  {cat.project_count || 0} Karya
                </span>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {cat.description || 'Tidak ada deskripsi.'}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="p-3 bg-[#15151A] border-t border-zinc-800 flex items-center justify-between text-xs">
              <button
                onClick={() => toggleVisibility(cat)}
                className={`p-1 rounded ${cat.is_visible ? 'text-emerald-400' : 'text-zinc-600'}`}
                title={cat.is_visible ? 'Kategori Aktif' : 'Kategori Tersembunyi'}
              >
                {cat.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1 text-zinc-400 hover:text-white"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-1 text-zinc-600 hover:text-red-400"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Category Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#141418] border border-zinc-800 max-w-md w-full rounded-sm p-6 space-y-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-serif text-lg text-white">
                {editingId ? 'Edit Kategori Portofolio' : 'Tambah Kategori Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Nama Kategori</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Graduation"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Slug URL (Opsional)</label>
                <input
                  type="text"
                  placeholder="graduation"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Deskripsi Kategori</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Deskripsi singkat seputar karya dalam kategori ini..."
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Foto Sampul Kategori</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coverUrl}
                    onChange={e => setCoverUrl(e.target.value)}
                    placeholder="URL Gambar Sampul"
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                  <label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded cursor-pointer shrink-0">
                    <Upload className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handleUploadCover} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#C5A880] text-[#0C0C0D] font-semibold rounded text-xs uppercase"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
