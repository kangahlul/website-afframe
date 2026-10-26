import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, Search, Filter, Trash2, Edit3, Copy, Check, Eye, AlertTriangle, Plus, X, Film, ImageIcon, Link2, ExternalLink
} from 'lucide-react';
import { MediaAsset } from '../../types';
import { api } from '../../lib/api';
import { normalizeMediaUrl, getVideoEmbedUrl, isVideoUrl } from '../../lib/mediaUtils';

export const MediaLibrary: React.FC = () => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('portfolio');
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // External media link modal (Images & Videos)
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [extUrl, setExtUrl] = useState('');
  const [extTitle, setExtTitle] = useState('');
  const [extCategory, setExtCategory] = useState('portfolio');
  const [extAlt, setExtAlt] = useState('');
  const [extDesc, setExtDesc] = useState('');

  // Edit / Preview asset modal
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editAltText, setEditAltText] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete check modal
  const [deleteAssetCandidate, setDeleteAssetCandidate] = useState<MediaAsset | null>(null);
  const [usageWarning, setUsageWarning] = useState<any>(null);
  const [isCheckingUsage, setIsCheckingUsage] = useState(false);

  const categories = [
    { id: 'all', label: 'Semua Media' },
    { id: 'brand', label: 'Brand & Logo' },
    { id: 'hero', label: 'Hero Section' },
    { id: 'portfolio', label: 'Portofolio' },
    { id: 'services', label: 'Layanan & Paket' },
    { id: 'backgrounds', label: 'Backgrounds' },
    { id: 'video', label: 'Video Showcase' },
    { id: 'general', label: 'Lainnya' },
  ];

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ assets: MediaAsset[] }>('/media', { category, search });
      setAssets(res.assets || []);
    } catch (err) {
      console.error('Failed to load media assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [category, search]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress(`Mengunggah ${files.length} berkas...`);
      await api.uploadFiles(Array.from(files), uploadCategory);
      setUploadProgress('Unggahan selesai!');
      setTimeout(() => setUploadProgress(''), 2000);
      fetchAssets();
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah berkas.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddExternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extUrl.trim()) return;

    try {
      const cleanUrl = normalizeMediaUrl(extUrl.trim());
      await api.post('/media/external', {
        url: cleanUrl,
        title: extTitle.trim() || 'Media Eksternal',
        category: extCategory,
        alt_text: extAlt.trim(),
        description: extDesc.trim()
      });
      setShowExternalModal(false);
      setExtUrl('');
      setExtTitle('');
      setExtAlt('');
      setExtDesc('');
      fetchAssets();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan tautan media.');
    }
  };

  const openEditModal = (asset: MediaAsset) => {
    setSelectedAsset(asset);
    setEditUrl(asset.url || '');
    setEditAltText(asset.alt_text || '');
    setEditDescription(asset.description || '');
    setEditCategory(asset.category || 'general');
    setEditTitle(asset.original_name || '');
  };

  const handleSaveEdit = async () => {
    if (!selectedAsset) return;
    try {
      setIsSavingEdit(true);
      await api.put(`/media/${selectedAsset.id}`, {
        url: editUrl.trim(),
        alt_text: editAltText,
        description: editDescription,
        category: editCategory,
        original_name: editTitle
      });
      setSelectedAsset(null);
      fetchAssets();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const checkUsageAndDelete = async (asset: MediaAsset) => {
    setDeleteAssetCandidate(asset);
    setIsCheckingUsage(true);
    setUsageWarning(null);

    try {
      const checkRes = await api.get<any>(`/media/usage-check/${asset.id}`);
      setUsageWarning(checkRes);
    } catch (err) {
      console.error('Error checking asset usage:', err);
    } finally {
      setIsCheckingUsage(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteAssetCandidate) return;
    try {
      await api.delete(`/media/${deleteAssetCandidate.id}`);
      setDeleteAssetCandidate(null);
      fetchAssets();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus berkas.');
    }
  };

  const copyUrl = (url: string, id: number) => {
    const fullUrl = url.startsWith('http') ? url : window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-light">
            Media Library
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Pusat penyimpanan & pengelolaan foto, video, logo, dan aset visual AF Frame.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category selection for quick upload */}
          <select
            value={uploadCategory}
            onChange={e => setUploadCategory(e.target.value)}
            className="px-3 py-2 bg-[#16161A] border border-zinc-800 rounded-sm text-xs text-zinc-300 focus:outline-none focus:border-[#C5A880]"
          >
            <option value="portfolio">Kategori: Portofolio</option>
            <option value="hero">Kategori: Hero Background</option>
            <option value="brand">Kategori: Brand & Logo</option>
            <option value="services">Kategori: Layanan</option>
            <option value="backgrounds">Kategori: Backgrounds</option>
            <option value="general">Kategori: Umum</option>
          </select>

          <input
            type="file"
            multiple
            accept="image/*,video/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? uploadProgress || 'Mengunggah...' : 'Unggah Berkas'}</span>
          </button>

          <button
            onClick={() => setShowExternalModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-[#1A1A20] hover:bg-[#25252D] text-zinc-300 border border-zinc-700 hover:border-[#C5A880] rounded-sm text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Tambah Media via Link</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121215] p-4 rounded-sm border border-[#24242A]">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-sm text-xs transition-colors shrink-0 ${
                category === cat.id
                  ? 'bg-[#C5A880] text-[#0C0C0D] font-semibold'
                  : 'bg-[#18181D] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari berkas media..."
            className="w-full pl-9 pr-4 py-2 bg-[#18181D] border border-zinc-800 rounded-sm text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#C5A880]"
          />
        </div>
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
            <div key={i} className="aspect-square bg-zinc-900 animate-pulse rounded-sm" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-zinc-800 rounded-sm space-y-3">
          <ImageIcon className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-sm text-zinc-400">Belum ada berkas media dalam kategori ini.</p>
          <p className="text-xs text-zinc-600">Klik "Unggah Berkas" untuk menambahkan foto atau video baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {assets.map(asset => {
            const isVideo = asset.mime_type.startsWith('video/') || asset.url.includes('youtube');

            return (
              <div
                key={asset.id}
                className="group relative bg-[#141418] border border-[#24242A] rounded-sm overflow-hidden flex flex-col justify-between hover:border-[#C5A880]/60 transition-all"
              >
                {/* Media thumbnail */}
                <div
                  className="aspect-square bg-black overflow-hidden relative cursor-pointer"
                  onClick={() => openEditModal(asset)}
                >
                  {isVideo ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-400">
                      <Film className="w-8 h-8 text-[#C5A880] mb-1" />
                      <span className="text-[10px] uppercase font-mono">Video</span>
                    </div>
                  ) : (
                    <img
                      src={asset.url}
                      alt={asset.alt_text || asset.original_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  )}

                  {/* Category badge */}
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-semibold bg-black/80 text-[#C5A880] rounded">
                    {asset.category}
                  </span>

                  {/* Hover actions overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        openEditModal(asset);
                      }}
                      className="p-1.5 bg-white/20 hover:bg-white text-black rounded transition-colors"
                      title="Lihat / Edit Info"
                    >
                      <Eye className="w-3.5 h-3.5 text-white hover:text-black" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        copyUrl(asset.url, asset.id);
                      }}
                      className="p-1.5 bg-white/20 hover:bg-[#C5A880] text-white hover:text-black rounded transition-colors"
                      title="Salin URL"
                    >
                      {copiedId === asset.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        checkUsageAndDelete(asset);
                      }}
                      className="p-1.5 bg-white/20 hover:bg-red-500 text-white rounded transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Caption / filename */}
                <div className="p-2.5 text-[11px] space-y-1">
                  <p className="font-medium text-zinc-300 truncate" title={asset.original_name}>
                    {asset.original_name}
                  </p>
                  <p className="text-[10px] text-zinc-500">{formatFileSize(asset.file_size)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Details Modal */}
      {selectedAsset && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedAsset(null)}
        >
          <div
            className="bg-[#141418] border border-zinc-800 max-w-2xl w-full rounded-sm overflow-hidden flex flex-col md:flex-row shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Media preview */}
            <div className="md:w-1/2 bg-black flex items-center justify-center p-4 min-h-[260px]">
              {selectedAsset.mime_type.startsWith('video/') ? (
                <video src={selectedAsset.url} controls className="max-h-[300px] max-w-full" />
              ) : (
                <img
                  src={selectedAsset.url}
                  alt={selectedAsset.alt_text}
                  className="max-h-[300px] max-w-full object-contain"
                />
              )}
            </div>

            {/* Metadata edit form */}
            <div className="p-6 md:w-1/2 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
                  <h3 className="font-serif text-lg text-white">Detail Media</h3>
                  <button onClick={() => setSelectedAsset(null)} className="text-zinc-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-zinc-400 block mb-1">Nama Tampilan</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">Teks Alt (SEO & Aksesibilitas)</label>
                    <input
                      type="text"
                      value={editAltText}
                      onChange={e => setEditAltText(e.target.value)}
                      placeholder="Deskripsi foto untuk pembaca layar..."
                      className="w-full px-3 py-1.5 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">Kategori Media</label>
                    <select
                      value={editCategory}
                      onChange={e => setEditCategory(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                    >
                      <option value="portfolio">Portofolio</option>
                      <option value="hero">Hero Background</option>
                      <option value="brand">Brand & Logo</option>
                      <option value="services">Layanan & Paket</option>
                      <option value="backgrounds">Backgrounds</option>
                      <option value="general">Umum</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">URL Media (Link atau Data URI)</label>
                    <input
                      type="text"
                      value={editUrl}
                      onChange={e => setEditUrl(e.target.value)}
                      placeholder="https://... atau data:image/..."
                      className="w-full px-3 py-1.5 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">Deskripsi Tambahan</label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      placeholder="Catatan internal media..."
                      className="w-full px-3 py-1.5 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                    />
                  </div>

                  <div className="pt-2 text-[10px] text-zinc-500 space-y-0.5 border-t border-zinc-800">
                    <p>URL: <span className="text-zinc-400 break-all">{selectedAsset.url}</span></p>
                    <p>Ukuran: {formatFileSize(selectedAsset.file_size)}</p>
                    <p>Format: {selectedAsset.mime_type}</p>
                    <p>Diunggah: {new Date(selectedAsset.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="flex-1 py-2 bg-[#C5A880] text-[#0C0C0D] rounded-sm font-semibold text-xs uppercase"
                >
                  {isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  onClick={() => copyUrl(selectedAsset.url, selectedAsset.id)}
                  className="px-3 py-2 bg-[#202026] text-zinc-300 rounded-sm text-xs hover:text-white"
                  title="Salin URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tambah Media via Link Modal */}
      {showExternalModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setShowExternalModal(false)}
        >
          <div
            className="bg-[#141418] border border-zinc-800 max-w-lg w-full rounded-sm p-6 space-y-4 my-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif text-lg text-white">Tambah Media via Link</h3>
              </div>
              <button onClick={() => setShowExternalModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExternal} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">URL / Link Media *</label>
                <input
                  type="url"
                  required
                  value={extUrl}
                  onChange={e => setExtUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... atau https://youtube.com/..."
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Mendukung link gambar langsung, Google Drive, Unsplash, YouTube, Vimeo, atau MP4.
                </p>
              </div>

              {/* Instant Live Preview */}
              {extUrl.trim() && (
                <div className="p-3 bg-black/60 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-400 block mb-2 font-mono uppercase tracking-wider">Preview Media:</span>
                  <div className="aspect-video max-h-48 w-full bg-black rounded overflow-hidden flex items-center justify-center">
                    {getVideoEmbedUrl(extUrl) ? (
                      <iframe
                        src={getVideoEmbedUrl(extUrl)!}
                        title="Preview Video"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    ) : isVideoUrl(extUrl) ? (
                      <video src={extUrl} controls className="w-full h-full object-contain" />
                    ) : (
                      <img
                        src={normalizeMediaUrl(extUrl)}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">Judul / Nama Media</label>
                  <input
                    type="text"
                    required
                    value={extTitle}
                    onChange={e => setExtTitle(e.target.value)}
                    placeholder="Contoh: Logo Emas AF Frame"
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">Kategori Media</label>
                  <select
                    value={extCategory}
                    onChange={e => setExtCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  >
                    <option value="brand">Brand & Logo</option>
                    <option value="portfolio">Portofolio</option>
                    <option value="hero">Hero Background</option>
                    <option value="services">Layanan & Paket</option>
                    <option value="backgrounds">Backgrounds</option>
                    <option value="video">Video Showcase</option>
                    <option value="general">Umum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Teks Alt (SEO & Aksesibilitas)</label>
                <input
                  type="text"
                  value={extAlt}
                  onChange={e => setExtAlt(e.target.value)}
                  placeholder="Deskripsi singkat gambar..."
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExternalModal(false)}
                  className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C5A880] text-[#0C0C0D] rounded font-semibold text-xs uppercase"
                >
                  Simpan Media
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Usage Warning & Delete Confirmation Modal */}
      {deleteAssetCandidate && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setDeleteAssetCandidate(null)}
        >
          <div
            className="bg-[#141418] border border-zinc-800 max-w-md w-full rounded-sm p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-serif text-lg text-white">Konfirmasi Penghapusan Media</h3>
            </div>

            {isCheckingUsage ? (
              <p className="text-xs text-zinc-400">Memeriksa apakah berkas sedang digunakan...</p>
            ) : usageWarning?.inUse ? (
              <div className="p-3 bg-red-950/40 border border-red-800 rounded text-xs text-red-200 space-y-2">
                <p className="font-semibold">⚠️ Peringatan: Berkas ini sedang digunakan pada:</p>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  {usageWarning.usages.map((u: any, idx: number) => (
                    <li key={idx}>
                      <span className="font-medium">{u.type}:</span> {u.details}
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-red-300">
                  Menghapus berkas ini dapat menyebabkan gambar rusak pada halaman terkait.
                </p>
              </div>
            ) : (
              <p className="text-xs text-zinc-400">
                Apakah Anda yakin ingin menghapus berkas <strong className="text-white">{deleteAssetCandidate.original_name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteAssetCandidate(null)}
                className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded text-xs"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold text-xs"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
