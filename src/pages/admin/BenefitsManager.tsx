import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Edit3, Trash2, Eye, EyeOff, Check, X } from 'lucide-react';
import { BenefitItem } from '../../types';
import { api } from '../../lib/api';

export const BenefitsManager: React.FC = () => {
  const [benefits, setBenefits] = useState<BenefitItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('Sparkles');
  const [isSaving, setIsSaving] = useState(false);

  const fetchBenefits = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ benefits: BenefitItem[] }>('/content/benefits', { all: true });
      setBenefits(res.benefits || []);
    } catch (err) {
      console.error('Failed to load benefits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenefits();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setIconName('Sparkles');
    setShowModal(true);
  };

  const openEdit = (b: BenefitItem) => {
    setEditingId(b.id);
    setTitle(b.title);
    setDescription(b.description);
    setIconName(b.icon_name || 'Sparkles');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      setIsSaving(true);
      if (editingId) {
        await api.put(`/content/benefits/${editingId}`, {
          title,
          description,
          icon_name: iconName
        });
      } else {
        await api.post('/content/benefits', {
          title,
          description,
          icon_name: iconName
        });
      }
      setShowModal(false);
      fetchBenefits();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan keunggulan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (b: BenefitItem) => {
    if (window.confirm(`Hapus keunggulan "${b.title}"?`)) {
      try {
        await api.delete(`/content/benefits/${b.id}`);
        fetchBenefits();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus');
      }
    }
  };

  const toggleVisibility = async (b: BenefitItem) => {
    try {
      await api.put(`/content/benefits/${b.id}`, { is_visible: b.is_visible ? 0 : 1 });
      fetchBenefits();
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
            Kenapa Kami? (Value Propositions)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Kelola butir-butir keunggulan signature AFFRAME (Natural Moment, Social Media Ready, Bonus Video, dll).
          </p>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Keunggulan</span>
        </button>
      </div>

      {/* Benefits List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((b, idx) => (
          <div
            key={b.id}
            className="p-5 bg-[#121215] border border-[#24242A] rounded-sm flex flex-col justify-between hover:border-[#C5A880]/50 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-serif text-base text-[#C5A880] font-bold">0{idx + 1}.</span>
                <span className="text-[10px] text-zinc-500 font-mono">Icon: {b.icon_name}</span>
              </div>
              <h3 className="font-serif text-xl text-white font-medium mb-2">{b.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">{b.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
              <button
                onClick={() => toggleVisibility(b)}
                className={`p-1 rounded ${b.is_visible ? 'text-emerald-400' : 'text-zinc-600'}`}
                title={b.is_visible ? 'Aktif' : 'Tersembunyi'}
              >
                {b.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(b)}
                  className="p-1 text-zinc-400 hover:text-white"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(b)}
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
                {editingId ? 'Edit Keunggulan' : 'Tambah Keunggulan Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Judul Keunggulan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Natural Moment"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Deskripsi Ringkas</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Menangkap momen tulus tanpa rasa kaku..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Pilihan Icon</label>
                <select
                  value={iconName}
                  onChange={e => setIconName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                >
                  <option value="Sparkles">Sparkles (Estetik / Kualitas)</option>
                  <option value="Share2">Share2 (Social Media Ready)</option>
                  <option value="Video">Video (Cinematic)</option>
                  <option value="Zap">Zap (Fast Delivery)</option>
                  <option value="ShieldCheck">ShieldCheck (Fleksibel & Aman)</option>
                  <option value="Camera">Camera (Fotografi)</option>
                  <option value="Heart">Heart (Momen Emosional)</option>
                </select>
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
