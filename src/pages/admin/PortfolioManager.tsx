import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban, Plus, Search, Edit3, Trash2, Eye, EyeOff,
  Star, ExternalLink, Image, Film, Check, X, Upload
} from 'lucide-react';
import { PortfolioProject, PortfolioCategory } from '../../types';
import { api } from '../../lib/api';
import { normalizeMediaUrl, getVideoEmbedUrl, isVideoUrl } from '../../lib/mediaUtils';

export const PortfolioManager: React.FC = () => {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  // Modal State (Add / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectDate, setProjectDate] = useState('');
  const [location, setLocation] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newGalleryInput, setNewGalleryInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, catRes] = await Promise.all([
        api.get<{ projects: PortfolioProject[] }>('/portfolio/projects', {
          all: true,
          category: selectedCat !== 'all' ? selectedCat : undefined,
          search: search || undefined
        }),
        api.get<{ categories: PortfolioCategory[] }>('/portfolio/categories', { all: true }),
      ]);
      setProjects(projRes.projects || []);
      setCategories(catRes.categories || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCat, search]);

  const openAdd = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setCategoryId(categories.length > 0 ? categories[0].id : '');
    setShortDesc('');
    setFullDesc('');
    setClientName('');
    setProjectDate(new Date().toISOString().slice(0, 10));
    setLocation('Surabaya');
    setCoverUrl('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop');
    setVideoUrl('');
    setIsFeatured(false);
    setIsPublished(true);
    setGalleryImages([]);
    setShowModal(true);
  };

  const openEdit = (p: PortfolioProject) => {
    setEditingId(p.id);
    setTitle(p.title);
    setSlug(p.slug);
    setCategoryId(p.category_id || '');
    setShortDesc(p.short_description || '');
    setFullDesc(p.full_description || '');
    setClientName(p.client_name || '');
    setProjectDate(p.project_date || '');
    setLocation(p.location || '');
    setCoverUrl(p.cover_image_url || '');
    setVideoUrl(p.featured_video_url || '');
    setIsFeatured(p.is_featured === 1);
    setIsPublished(p.is_published === 1);
    setGalleryImages(p.images ? p.images.map(img => img.image_url) : []);
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
      alert(err.message || 'Gagal mengunggah gambar sampul.');
    }
  };

  const handleUploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const res = await api.uploadFiles(Array.from(files), 'portfolio');
      if (res.assets) {
        const newUrls = res.assets.map((a: any) => a.url);
        setGalleryImages(prev => [...prev, ...newUrls]);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah galeri foto.');
    }
  };

  const addGalleryUrl = () => {
    if (newGalleryInput.trim()) {
      // Support comma or newline separated URLs
      const urls = newGalleryInput
        .split(/[\n,]+/)
        .map(u => normalizeMediaUrl(u.trim()))
        .filter(Boolean);
      setGalleryImages(prev => [...prev, ...urls]);
      setNewGalleryInput('');
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSaving(true);
      const payload = {
        title,
        slug,
        category_id: categoryId || null,
        short_description: shortDesc,
        full_description: fullDesc,
        client_name: clientName,
        project_date: projectDate,
        location,
        cover_image_url: coverUrl,
        featured_video_url: videoUrl,
        is_featured: isFeatured ? 1 : 0,
        is_published: isPublished ? 1 : 0,
        gallery_images: galleryImages
      };

      if (editingId) {
        await api.put(`/portfolio/projects/${editingId}`, payload);
      } else {
        await api.post('/portfolio/projects', payload);
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan proyek portofolio.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Yakin ingin menghapus proyek "${name}"? Seluruh foto galeri terkait juga akan dihapus.`)) {
      try {
        await api.delete(`/portfolio/projects/${id}`);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus proyek');
      }
    }
  };

  const togglePublish = async (p: PortfolioProject) => {
    try {
      await api.put(`/portfolio/projects/${p.id}`, { is_published: p.is_published ? 0 : 1 });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status publikasi');
    }
  };

  const toggleFeatured = async (p: PortfolioProject) => {
    try {
      await api.put(`/portfolio/projects/${p.id}`, { is_featured: p.is_featured ? 0 : 1 });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status favorit');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-light">
            Pengelolaan Portofolio
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Tambah, edit, unggah galeri foto beresolusi tinggi, kelola video, dan status publikasi karya AF Frame.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Proyek Baru</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121215] p-4 rounded-sm border border-[#24242A]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 rounded-sm text-xs transition-colors shrink-0 ${
              selectedCat === 'all'
                ? 'bg-[#C5A880] text-[#0C0C0D] font-semibold'
                : 'bg-[#18181D] text-zinc-400 border border-zinc-800'
            }`}
          >
            Semua ({projects.length})
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.slug)}
              className={`px-3 py-1.5 rounded-sm text-xs transition-colors shrink-0 ${
                selectedCat === c.slug
                  ? 'bg-[#C5A880] text-[#0C0C0D] font-semibold'
                  : 'bg-[#18181D] text-zinc-400 border border-zinc-800'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari judul proyek..."
            className="w-full pl-9 pr-4 py-2 bg-[#18181D] border border-zinc-800 rounded-sm text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#C5A880]"
          />
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-[#121215] border border-[#24242A] rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-500">Memuat portofolio...</div>
        ) : projects.length === 0 ? (
          <div className="p-16 text-center text-xs text-zinc-500 space-y-2">
            <p>Belum ada proyek portofolio yang cocok.</p>
            <button onClick={openAdd} className="text-[#C5A880] underline">Tambah Proyek Pertama</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#16161B] text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Proyek & Kover</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Klien & Lokasi</th>
                  <th className="py-3 px-4 text-center">Favorit</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {projects.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Project & Cover */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-black rounded overflow-hidden shrink-0 border border-zinc-800">
                          <img src={p.cover_image_url} alt={p.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-white truncate max-w-xs">{p.title}</h4>
                          <p className="text-[11px] text-zinc-500 truncate max-w-xs">{p.short_description}</p>
                          <span className="text-[10px] text-zinc-600 font-mono">/{p.slug}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-[#1C1C22] text-[#C5A880] border border-[#C5A880]/30">
                        {p.category_name || 'Tanpa Kategori'}
                      </span>
                    </td>

                    {/* Client & Location */}
                    <td className="py-3 px-4 text-zinc-400">
                      <div>{p.client_name || '-'}</div>
                      <div className="text-[10px] text-zinc-500">{p.location || 'Surabaya'}</div>
                    </td>

                    {/* Featured Star */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleFeatured(p)}
                        className={`p-1 rounded cursor-pointer ${
                          p.is_featured ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                        title={p.is_featured ? 'Hapus dari Favorit' : 'Tandai Favorit'}
                      >
                        <Star className={`w-4 h-4 ${p.is_featured ? 'fill-current' : ''}`} />
                      </button>
                    </td>

                    {/* Status Publish */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => togglePublish(p)}
                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold cursor-pointer border ${
                          p.is_published
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {p.is_published ? 'Publik' : 'Draft'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/portfolio/${p.slug}`}
                          target="_blank"
                          className="p-1.5 text-zinc-400 hover:text-white"
                          title="Lihat di Web"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-zinc-400 hover:text-[#C5A880]"
                          title="Edit Proyek"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.title)}
                          className="p-1.5 text-zinc-600 hover:text-red-400"
                          title="Hapus Proyek"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Project Full Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#141418] border border-zinc-800 max-w-4xl w-full rounded-sm p-6 space-y-6 my-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-serif text-xl text-white">
                {editingId ? 'Edit Proyek Portofolio' : 'Tambah Proyek Portofolio Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 text-xs">
              {/* Row 1: Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">Judul Proyek *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Intimate Wedding Arya & Nadhira"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">Kategori Portofolio</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  >
                    <option value="">-- Tanpa Kategori --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Short Description */}
              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">Deskripsi Singkat (Ringkasan)</label>
                <input
                  type="text"
                  placeholder="Ringkasan 1 kalimat yang muncul pada kartu galeri..."
                  value={shortDesc}
                  onChange={e => setShortDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              {/* Row 3: Full Narrative Description */}
              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">Narasi Lengkap & Konsep Visual</label>
                <textarea
                  rows={4}
                  placeholder="Ceritakan proses kreatif, emosi momen, atau konsep teknis pengambilan foto/video..."
                  value={fullDesc}
                  onChange={e => setFullDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              {/* Row 4: Client, Date, Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-zinc-400 block mb-1">Nama Klien / Brand</label>
                  <input
                    type="text"
                    placeholder="Contoh: Arya & Nadhira"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Tanggal Acara / Sesi</label>
                  <input
                    type="date"
                    value={projectDate}
                    onChange={e => setProjectDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Lokasi Sesi</label>
                  <input
                    type="text"
                    placeholder="Contoh: Surabaya Barat"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                </div>
              </div>

              {/* Row 5: Cover Image & Featured Video URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[#C5A880] block font-semibold">Foto Kover Utama</label>
                    {coverUrl && (
                      <button
                        type="button"
                        onClick={() => setCoverUrl('')}
                        className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="URL Gambar atau unggah berkas"
                      value={coverUrl}
                      onChange={e => setCoverUrl(normalizeMediaUrl(e.target.value))}
                      className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                    />
                    <label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded cursor-pointer shrink-0" title="Unggah Berkas">
                      <Upload className="w-4 h-4" />
                      <input type="file" accept="image/*" onChange={handleUploadCover} className="hidden" />
                    </label>
                  </div>
                  {coverUrl && (
                    <div className="aspect-[16/9] w-40 bg-black rounded overflow-hidden border border-zinc-800 shadow-sm">
                      <img src={normalizeMediaUrl(coverUrl)} alt="Cover preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-400 block font-semibold">URL Video Showcase (Opsional)</label>
                    {videoUrl && (
                      <button
                        type="button"
                        onClick={() => setVideoUrl('')}
                        className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... atau https://vimeo.com/..."
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                  <p className="text-[10px] text-zinc-500">Mendukung tautan YouTube, Vimeo, atau berkas MP4 langsung.</p>
                  
                  {/* Live Video Preview */}
                  {videoUrl.trim() && (
                    <div className="aspect-video w-48 bg-black rounded overflow-hidden border border-zinc-800 mt-2">
                      {getVideoEmbedUrl(videoUrl) ? (
                        <iframe
                          src={getVideoEmbedUrl(videoUrl)!}
                          title="Video Preview"
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      ) : (
                        <video src={videoUrl} controls className="w-full h-full object-contain" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 6: Multi-Images Gallery */}
              <div className="pt-2 border-t border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[#C5A880] font-semibold">Galeri Foto Tambahan ({galleryImages.length} foto)</label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded cursor-pointer text-[11px]">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Beberapa Foto Sekaligus</span>
                    <input type="file" multiple accept="image/*" onChange={handleUploadGallery} className="hidden" />
                  </label>
                </div>

                {/* Gallery thumbnails grid */}
                {galleryImages.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {galleryImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative aspect-square rounded overflow-hidden bg-black border border-zinc-800 group">
                        <img src={imgUrl} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add image by URL */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Atau tambahkan URL foto eksternal..."
                    value={newGalleryInput}
                    onChange={e => setNewGalleryInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#18181D] border border-zinc-800 rounded text-zinc-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={addGalleryUrl}
                    className="px-3 py-1.5 bg-zinc-800 text-zinc-200 rounded text-xs"
                  >
                    Tambah URL
                  </button>
                </div>
              </div>

              {/* Switches: Featured & Published */}
              <div className="pt-2 border-t border-zinc-800 flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={e => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C5A880]"
                  />
                  <span className="text-zinc-300">Tampilkan sebagai Karya Unggulan (Featured)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={e => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C5A880]"
                  />
                  <span className="text-zinc-300">Publikasikan Langsung ke Website</span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 flex justify-end gap-2 border-t border-zinc-800">
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
                  className="px-6 py-2 bg-[#C5A880] text-[#0C0C0D] font-semibold rounded text-xs uppercase tracking-wider"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Proyek Portofolio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
