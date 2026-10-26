import React, { useState, useEffect } from 'react';
import {
  Layers, Eye, EyeOff, ArrowUp, ArrowDown, Edit3, Trash2,
  Check, Image, Plus, Sparkles, X, AlertTriangle
} from 'lucide-react';
import { WebsiteSection } from '../../types';
import { api } from '../../lib/api';
import { useSite } from '../../context/SiteContext';

export const WebsiteSectionManager: React.FC = () => {
  const { refreshSiteData } = useSite();
  const [sections, setSections] = useState<WebsiteSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Edit Section Modal
  const [editingSection, setEditingSection] = useState<WebsiteSection | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCta1Text, setFormCta1Text] = useState('');
  const [formCta1Url, setFormCta1Url] = useState('');
  const [formCta2Text, setFormCta2Text] = useState('');
  const [formCta2Url, setFormCta2Url] = useState('');
  const [formBgUrl, setFormBgUrl] = useState('');
  const [formBgType, setFormBgType] = useState<'image' | 'video' | 'none'>('image');
  const [formOverlay, setFormOverlay] = useState(65);
  const [formAlignment, setFormAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [isSavingSection, setIsSavingSection] = useState(false);

  // Add custom section modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newTitle, setNewTitle] = useState('');

  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ sections: WebsiteSection[] }>('/sections', { all: true });
      setSections(res.sections || []);
    } catch (err) {
      console.error('Failed to load sections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const openEdit = (sec: WebsiteSection) => {
    setEditingSection(sec);
    setFormTitle(sec.title);
    setFormSubtitle(sec.subtitle || '');
    setFormDescription(sec.description || '');
    setFormCta1Text(sec.cta_primary_text || '');
    setFormCta1Url(sec.cta_primary_url || '');
    setFormCta2Text(sec.cta_secondary_text || '');
    setFormCta2Url(sec.cta_secondary_url || '');
    setFormBgUrl(sec.background_media_url || '');
    setFormBgType(sec.background_type || 'image');
    setFormOverlay(sec.overlay_opacity || 65);
    setFormAlignment(sec.text_alignment || 'center');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;

    try {
      setIsSavingSection(true);
      await api.put(`/sections/${editingSection.id}`, {
        title: formTitle,
        subtitle: formSubtitle,
        description: formDescription,
        cta_primary_text: formCta1Text,
        cta_primary_url: formCta1Url,
        cta_secondary_text: formCta2Text,
        cta_secondary_url: formCta2Url,
        background_media_url: formBgUrl,
        background_type: formBgType,
        overlay_opacity: formOverlay,
        text_alignment: formAlignment
      });

      setEditingSection(null);
      setSuccessMsg('Section berhasil diperbarui!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchSections();
      refreshSiteData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan section.');
    } finally {
      setIsSavingSection(false);
    }
  };

  const toggleVisibility = async (sec: WebsiteSection) => {
    try {
      const nextVisible = sec.is_visible ? 0 : 1;
      await api.put(`/sections/${sec.id}`, { is_visible: nextVisible });
      fetchSections();
      refreshSiteData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah visibilitas');
    }
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);

    // Update sort_order numbers
    const reordered = newSections.map((s, idx) => ({
      id: s.id,
      sort_order: idx + 1,
      is_visible: s.is_visible
    }));

    try {
      setSavingOrder(true);
      setSections(newSections);
      await api.post('/sections/reorder', { items: reordered });
      refreshSiteData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah urutan section');
      fetchSections();
    } finally {
      setSavingOrder(false);
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newTitle) return;

    try {
      await api.post('/sections', {
        section_key: newKey.toLowerCase().replace(/\s+/g, '_'),
        title: newTitle,
        sort_order: sections.length + 1
      });
      setShowAddModal(false);
      setNewKey('');
      setNewTitle('');
      fetchSections();
      refreshSiteData();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan section');
    }
  };

  const handleDelete = async (sec: WebsiteSection) => {
    if (window.confirm(`Yakin ingin menghapus section "${sec.title}"?`)) {
      try {
        await api.delete(`/sections/${sec.id}`);
        fetchSections();
        refreshSiteData();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus section');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-light">
            Website Section Manager
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Atur urutan, visibilitas, teks headline, latar belakang, dan tombol aksi pada landing page AF Frame.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Section Baru</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Sections Table / Cards List */}
      <div className="bg-[#121215] border border-[#24242A] rounded-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-[#16161B] flex items-center justify-between text-xs text-zinc-400 font-medium">
          <span>Struktur Urutan Tampilan Beranda</span>
          {savingOrder && <span className="text-[#C5A880]">Menyimpan urutan...</span>}
        </div>

        <div className="divide-y divide-zinc-800/80">
          {sections.map((sec, idx) => (
            <div
              key={sec.id}
              className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                sec.is_visible ? 'hover:bg-white/[0.02]' : 'bg-[#0E0E11] opacity-60'
              }`}
            >
              {/* Order & Title Info */}
              <div className="flex items-center gap-4 min-w-0">
                <span className="font-mono text-xs text-zinc-500 w-6 text-center font-bold">
                  #{idx + 1}
                </span>

                <div className="space-y-0.5 truncate">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-white truncate">{sec.title}</h3>
                    <code className="text-[10px] text-[#C5A880] px-1.5 py-0.5 bg-[#18181D] rounded font-mono">
                      {sec.section_key}
                    </code>
                  </div>
                  <p className="text-xs text-zinc-400 truncate max-w-md">
                    {sec.subtitle || sec.description || 'Tidak ada deskripsi'}
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Move Up */}
                <button
                  disabled={idx === 0}
                  onClick={() => moveOrder(idx, 'up')}
                  className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20 cursor-pointer"
                  title="Pindah ke Atas"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                {/* Move Down */}
                <button
                  disabled={idx === sections.length - 1}
                  onClick={() => moveOrder(idx, 'down')}
                  className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20 cursor-pointer"
                  title="Pindah ke Bawah"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                {/* Visibility Toggle */}
                <button
                  onClick={() => toggleVisibility(sec)}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    sec.is_visible
                      ? 'text-emerald-400 hover:bg-emerald-950/40'
                      : 'text-zinc-500 hover:bg-zinc-800'
                  }`}
                  title={sec.is_visible ? 'Sembunyikan dari Publik' : 'Tampilkan di Publik'}
                >
                  {sec.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Edit */}
                <button
                  onClick={() => openEdit(sec)}
                  className="p-1.5 rounded text-zinc-300 hover:text-[#C5A880] hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Edit Konten Section"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {/* Delete (only for custom non-core sections) */}
                {!['hero', 'selected_works', 'packages', 'booking_cta'].includes(sec.section_key) && (
                  <button
                    onClick={() => handleDelete(sec)}
                    className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="Hapus Section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Section Modal */}
      {editingSection && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setEditingSection(null)}
        >
          <div
            className="bg-[#141418] border border-zinc-800 max-w-2xl w-full rounded-sm p-6 space-y-6 my-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="font-serif text-xl text-white">Edit Konten Section</h3>
                <code className="text-xs text-[#C5A880]">{editingSection.section_key}</code>
              </div>
              <button onClick={() => setEditingSection(null)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 block mb-1">Judul Utama (Headline)</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Sub-judul / Eyebrow Text</label>
                  <input
                    type="text"
                    value={formSubtitle}
                    onChange={e => setFormSubtitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Deskripsi Narasi</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              {/* CTAs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80">
                <div className="space-y-2">
                  <label className="text-[#C5A880] font-semibold block">Tombol Utama (CTA 1)</label>
                  <input
                    type="text"
                    placeholder="Label Tombol (e.g. Lihat Paket)"
                    value={formCta1Text}
                    onChange={e => setFormCta1Text(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                  <input
                    type="text"
                    placeholder="URL Tujuan (e.g. #packages)"
                    value={formCta1Url}
                    onChange={e => setFormCta1Url(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-zinc-400 font-semibold block">Tombol Sekunder (CTA 2)</label>
                  <input
                    type="text"
                    placeholder="Label Tombol (e.g. Konsultasi)"
                    value={formCta2Text}
                    onChange={e => setFormCta2Text(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                  <input
                    type="text"
                    placeholder="URL Tujuan (e.g. #booking)"
                    value={formCta2Url}
                    onChange={e => setFormCta2Url(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                </div>
              </div>

              {/* Background Media & Overlay */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-zinc-400 block mb-1">URL Background Media (Foto / Video)</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/... atau /uploads/..."
                      value={formBgUrl}
                      onChange={e => setFormBgUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Tipe Media</label>
                    <select
                      value={formBgType}
                      onChange={e => setFormBgType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                    >
                      <option value="image">Gambar (Foto)</option>
                      <option value="video">Video (MP4)</option>
                      <option value="none">Tanpa Media (Warna Solid)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-zinc-400 block mb-1">Kegelapan Overlay ({formOverlay}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formOverlay}
                      onChange={e => setFormOverlay(Number(e.target.value))}
                      className="w-full accent-[#C5A880]"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Posisi Perataan Teks</label>
                    <select
                      value={formAlignment}
                      onChange={e => setFormAlignment(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                    >
                      <option value="center">Tengah (Center)</option>
                      <option value="left">Kiri (Left)</option>
                      <option value="right">Kanan (Right)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingSection}
                  className="px-5 py-2 bg-[#C5A880] text-[#0C0C0D] font-semibold rounded text-xs uppercase tracking-wider"
                >
                  {isSavingSection ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Section Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-[#141418] border border-zinc-800 max-w-md w-full rounded-sm p-6 space-y-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-serif text-lg text-white">Tambah Section Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Section Key (Unik)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. promo_ramadhan"
                  value={newKey}
                  onChange={e => setNewKey(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Judul Section</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Penawaran Spesial Musim Wisuda"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C5A880] text-[#0C0C0D] font-semibold rounded text-xs uppercase"
                >
                  Tambahkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
