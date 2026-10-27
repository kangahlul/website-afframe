import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit3, Trash2, Eye, EyeOff, Check, X } from 'lucide-react';
import { TermsContent } from '../../types';
import { api } from '../../lib/api';

export const TermsManager: React.FC = () => {
  const [terms, setTerms] = useState<TermsContent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [clauseNumber, setClauseNumber] = useState(1);
  const [clauseText, setClauseText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ terms: TermsContent[] }>('/content/terms', { all: true });
      setTerms(res.terms || []);
    } catch (err) {
      console.error('Failed to load terms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setTitle('');
    setClauseNumber(terms.length + 1);
    setClauseText('');
    setShowModal(true);
  };

  const openEdit = (t: TermsContent) => {
    setEditingId(t.id);
    setTitle(t.title);
    setClauseNumber(t.clause_number);
    setClauseText(t.clause_text);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clauseText.trim()) return;

    try {
      setIsSaving(true);
      if (editingId) {
        await api.put(`/content/terms/${editingId}`, {
          title,
          clause_number: clauseNumber,
          clause_text: clauseText
        });
      } else {
        await api.post('/content/terms', {
          title,
          clause_number: clauseNumber,
          clause_text: clauseText
        });
      }
      setShowModal(false);
      fetchTerms();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan ketentuan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (t: TermsContent) => {
    if (window.confirm(`Hapus pasal "${t.title}"?`)) {
      try {
        await api.delete(`/content/terms/${t.id}`);
        fetchTerms();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus');
      }
    }
  };

  const togglePublish = async (t: TermsContent) => {
    try {
      await api.put(`/content/terms/${t.id}`, { is_published: t.is_published ? 0 : 1 });
      fetchTerms();
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
            Pengelolaan Syarat & Ketentuan (S&K)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Kelola 7 butir pasal operasional resmi AFFRAME sesuai halaman 3 katalog.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Pasal S&K</span>
        </button>
      </div>

      {/* Clauses list */}
      <div className="bg-[#121215] border border-[#24242A] rounded-sm divide-y divide-zinc-800/80">
        {terms.map((t, idx) => (
          <div key={t.id} className="p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 max-w-2xl">
              <span className="font-mono text-xs text-[#C5A880] font-bold w-6 pt-0.5">
                §{t.clause_number || idx + 1}
              </span>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">{t.title}</h4>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">{t.clause_text}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => togglePublish(t)}
                className={`p-1.5 rounded ${t.is_published ? 'text-emerald-400' : 'text-zinc-600'}`}
                title={t.is_published ? 'Publik' : 'Draft'}
              >
                {t.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => openEdit(t)}
                className="p-1.5 text-zinc-400 hover:text-white"
                title="Edit Pasal"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(t)}
                className="p-1.5 text-zinc-600 hover:text-red-400"
                title="Hapus"
              >
                <Trash2 className="w-4 h-4" />
              </button>
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
                {editingId ? 'Edit Pasal Ketentuan' : 'Tambah Pasal Ketentuan'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Nomor Urut Pasal</label>
                <input
                  type="number"
                  required
                  value={clauseNumber}
                  onChange={e => setClauseNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Judul Pasal</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Konfirmasi Booking & Pelunasan"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Isi Klausul</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Isi klausul..."
                  value={clauseText}
                  onChange={e => setClauseText(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
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
