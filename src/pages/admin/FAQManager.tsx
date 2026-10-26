import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Edit3, Trash2, Eye, EyeOff, Check, X } from 'lucide-react';
import { FaqItem } from '../../types';
import { api } from '../../lib/api';

export const FAQManager: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ faqs: FaqItem[] }>('/content/faqs', { all: true });
      setFaqs(res.faqs || []);
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setQuestion('');
    setAnswer('');
    setCategory('booking');
    setShowModal(true);
  };

  const openEdit = (f: FaqItem) => {
    setEditingId(f.id);
    setQuestion(f.question);
    setAnswer(f.answer);
    setCategory(f.category || 'general');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    try {
      setIsSaving(true);
      if (editingId) {
        await api.put(`/content/faqs/${editingId}`, {
          question,
          answer,
          category
        });
      } else {
        await api.post('/content/faqs', {
          question,
          answer,
          category
        });
      }
      setShowModal(false);
      fetchFaqs();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan FAQ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (f: FaqItem) => {
    if (window.confirm(`Hapus pertanyaan FAQ "${f.question}"?`)) {
      try {
        await api.delete(`/content/faqs/${f.id}`);
        fetchFaqs();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus');
      }
    }
  };

  const togglePublish = async (f: FaqItem) => {
    try {
      await api.put(`/content/faqs/${f.id}`, { is_published: f.is_published ? 0 : 1 });
      fetchFaqs();
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
            Pengelolaan FAQ (Pertanyaan Umum)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Kelola pertanyaan dan jawaban seputar booking, DP 50%, durasi pengerjaan, dan ketentuan portofolio.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah FAQ Baru</span>
        </button>
      </div>

      {/* FAQ Accordion Items List */}
      <div className="bg-[#121215] border border-[#24242A] rounded-sm divide-y divide-zinc-800/80">
        {faqs.map((faq, idx) => (
          <div key={faq.id} className="p-4 flex items-start justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-zinc-500 font-bold">#{idx + 1}</span>
                <h4 className="text-sm font-medium text-white">{faq.question}</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">{faq.answer}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => togglePublish(faq)}
                className={`p-1.5 rounded ${faq.is_published ? 'text-emerald-400' : 'text-zinc-600'}`}
                title={faq.is_published ? 'Publik' : 'Draft'}
              >
                {faq.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => openEdit(faq)}
                className="p-1.5 text-zinc-400 hover:text-white"
                title="Edit FAQ"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(faq)}
                className="p-1.5 text-zinc-600 hover:text-red-400"
                title="Hapus"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit FAQ Modal */}
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
                {editingId ? 'Edit FAQ' : 'Tambah FAQ Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Pertanyaan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Berapa persen uang muka (DP)?"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Jawaban</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Jawaban resmi AF Frame..."
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
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
                  {isSaving ? 'Menyimpan...' : 'Simpan FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
