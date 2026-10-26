import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit3, Trash2, Eye, EyeOff, Upload, Check, X, Image as ImageIcon } from 'lucide-react';
import { ServiceArea } from '../../types';
import { api } from '../../lib/api';
import { normalizeMediaUrl } from '../../lib/mediaUtils';

export const ServiceAreasManager: React.FC = () => {
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ areas: ServiceArea[] }>('/content/service-areas', { all: true });
      setAreas(res.areas || []);
    } catch (err) {
      console.error('Failed to load service areas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setImageUrl('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop');
    setIsPrimary(true);
    setShowModal(true);
  };

  const openEdit = (a: ServiceArea) => {
    setEditingId(a.id);
    setName(a.name);
    setDescription(a.description);
    setImageUrl(a.image_url || '');
    setIsPrimary(a.is_primary === 1);
    setShowModal(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadFiles([file], 'backgrounds');
      if (res.assets && res.assets[0]) {
        setImageUrl(res.assets[0].url);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah foto');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    try {
      setIsSaving(true);
      if (editingId) {
        await api.put(`/content/service-areas/${editingId}`, {
          name,
          description,
          image_url: imageUrl,
          is_primary: isPrimary ? 1 : 0
        });
      } else {
        await api.post('/content/service-areas', {
          name,
          description,
          image_url: imageUrl,
          is_primary: isPrimary ? 1 : 0
        });
      }
      setShowModal(false);
      fetchAreas();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan wilayah layanan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (a: ServiceArea) => {
    if (window.confirm(`Hapus wilayah "${a.name}"?`)) {
      try {
        await api.delete(`/content/service-areas/${a.id}`);
        fetchAreas();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus');
      }
    }
  };

  const toggleVisibility = async (a: ServiceArea) => {
    try {
      await api.put(`/content/service-areas/${a.id}`, { is_visible: a.is_visible ? 0 : 1 });
      fetchAreas();
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
            Pengelolaan Wilayah Layanan (Coverage)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Atur kota cakupan utama (Lamongan, Gresik, Surabaya) serta opsi jangkauan antar kota lainnya.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Wilayah</span>
        </button>
      </div>

      {/* Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {areas.map(a => (
          <div
            key={a.id}
            className="bg-[#121215] border border-[#24242A] rounded-sm overflow-hidden flex flex-col justify-between"
          >
            <div className="aspect-[16/9] bg-black overflow-hidden relative">
              <img src={a.image_url} alt={a.name} className="w-full h-full object-cover" />
              {a.is_primary === 1 && (
                <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] uppercase font-bold bg-[#C5A880] text-[#0C0C0D] rounded">
                  Area Utama
                </span>
              )}
            </div>

            <div className="p-4 space-y-2 flex-grow">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C5A880]" />
                <h3 className="font-serif text-lg text-white font-medium">{a.name}</h3>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed font-sans">{a.description}</p>
            </div>

            <div className="p-3 bg-[#15151A] border-t border-zinc-800 flex items-center justify-between text-xs">
              <button
                onClick={() => toggleVisibility(a)}
                className={`p-1 rounded ${a.is_visible ? 'text-emerald-400' : 'text-zinc-600'}`}
                title={a.is_visible ? 'Aktif' : 'Tersembunyi'}
              >
                {a.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(a)}
                  className="p-1 text-zinc-400 hover:text-white"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(a)}
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

      {/* Add / Edit Modal */}
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
                {editingId ? 'Edit Wilayah Layanan' : 'Tambah Wilayah Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Nama Kota / Wilayah</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Surabaya"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Deskripsi & Layanan di Wilayah Ini</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail cakupan..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">URL / File Foto Lanskap</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={e => setImageUrl(normalizeMediaUrl(e.target.value))}
                    placeholder="URL Foto..."
                    className="flex-1 px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200 font-mono text-xs"
                  />
                  <label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded cursor-pointer shrink-0 flex items-center gap-1.5 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Unggah</span>
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="px-2.5 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 rounded transition-colors"
                      title="Hapus Foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {imageUrl && (
                  <div className="relative aspect-[16/9] w-full rounded bg-black border border-zinc-800 overflow-hidden group">
                    <img src={imageUrl} alt="Pratinjau Area" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="p-1 bg-black/80 text-red-400 hover:text-red-300 rounded-full"
                        title="Hapus"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="primary_check"
                  checked={isPrimary}
                  onChange={e => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 rounded text-[#C5A880]"
                />
                <label htmlFor="primary_check" className="text-zinc-300">Tandai sebagai Area Utama</label>
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
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
