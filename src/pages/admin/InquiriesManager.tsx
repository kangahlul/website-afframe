import React, { useState, useEffect } from 'react';
import {
  Inbox, Search, Filter, Download, MessageSquare, Clock, MapPin,
  Calendar, User, Building, DollarSign, CheckCircle2, XCircle,
  FileText, Send, Eye, X, ArrowUpRight, Plus, Edit, Trash2, Users
} from 'lucide-react';
import { Inquiry, InquiryNote } from '../../types';
import { api } from '../../lib/api';

export const InquiriesManager: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Selected Detail Modal
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Form Modal (Manual Create / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    full_name: string;
    whatsapp_number: string;
    email: string;
    instagram_handle: string;
    company: string;
    service_name: string;
    package_name: string;
    event_date: string;
    event_time: string;
    location: string;
    budget_range: string;
    additional_notes: string;
    status: 'new' | 'contacted' | 'quoted' | 'confirmed' | 'completed' | 'cancelled';
  }>({
    full_name: '',
    whatsapp_number: '',
    email: '',
    instagram_handle: '',
    company: '',
    service_name: 'Graduation Photography & Videography',
    package_name: 'GOLD',
    event_date: new Date().toISOString().slice(0, 10),
    event_time: '08:00',
    location: 'Lamongan',
    budget_range: 'Rp 250.000 - Rp 500.000',
    additional_notes: '',
    status: 'confirmed',
  });

  // Delete Target Modal
  const [deleteTarget, setDeleteTarget] = useState<Inquiry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ inquiries: Inquiry[] }>('/inquiries', {
        status: statusFilter,
        search
      });
      setInquiries(res.inquiries || []);
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, search]);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await api.put(`/inquiries/${id}/status`, { status: newStatus });
      fetchInquiries();
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status inquiry');
    }
  };

  const openCreateModal = () => {
    setFormMode('create');
    setEditingId(null);
    setFormData({
      full_name: '',
      whatsapp_number: '',
      email: '',
      instagram_handle: '',
      company: '',
      service_name: 'Graduation Photography & Videography',
      package_name: 'GOLD',
      event_date: new Date().toISOString().slice(0, 10),
      event_time: '08:00',
      location: 'Lamongan',
      budget_range: 'Rp 250.000 - Rp 500.000',
      additional_notes: '',
      status: 'confirmed',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (inq: Inquiry) => {
    setFormMode('edit');
    setEditingId(inq.id);
    setFormData({
      full_name: inq.full_name || '',
      whatsapp_number: inq.whatsapp_number || '',
      email: inq.email || '',
      instagram_handle: inq.instagram_handle || '',
      company: inq.company || '',
      service_name: inq.service_name || '',
      package_name: inq.package_name || '',
      event_date: inq.event_date || '',
      event_time: inq.event_time || '',
      location: inq.location || '',
      budget_range: inq.budget_range || '',
      additional_notes: inq.additional_notes || '',
      status: inq.status || 'new',
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.whatsapp_number.trim() || !formData.event_date) {
      alert('Nama Lengkap, Nomor WhatsApp, dan Tanggal Acara wajib diisi.');
      return;
    }

    try {
      setFormSubmitting(true);
      if (formMode === 'create') {
        await api.post('/inquiries/admin', formData);
      } else if (editingId) {
        await api.put(`/inquiries/${editingId}`, formData);
      }
      setIsFormOpen(false);
      fetchInquiries();
      if (selectedInquiry && selectedInquiry.id === editingId) {
        const res = await api.get<{ inquiry: Inquiry }>(`/inquiries/${editingId}`);
        setSelectedInquiry(res.inquiry);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data reservasi.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteInquiry = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.delete(`/inquiries/${deleteTarget.id}`);
      setDeleteTarget(null);
      if (selectedInquiry?.id === deleteTarget.id) {
        setSelectedInquiry(null);
      }
      fetchInquiries();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus reservasi.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry || !newNote.trim()) return;

    try {
      setIsAddingNote(true);
      const res = await api.post<{ notes: InquiryNote[] }>(`/inquiries/${selectedInquiry.id}/notes`, {
        note: newNote.trim()
      });
      setSelectedInquiry(prev => prev ? { ...prev, notes: res.notes } : null);
      setNewNote('');
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan catatan.');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await api.get<Blob>('/inquiries/export/csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `afframe-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert('Gagal mengekspor data ke CSV.');
    }
  };

  const statusBadges: Record<string, { label: string; class: string }> = {
    new: { label: 'Baru Masuk', class: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    contacted: { label: 'Dihubungi', class: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    quoted: { label: 'Diberi Penawaran', class: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
    confirmed: { label: 'Booking Terkonfirmasi (DP)', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    completed: { label: 'Selesai & File Dikirim', class: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' },
    cancelled: { label: 'Dibatalkan', class: 'bg-red-500/10 text-red-400 border-red-500/30' },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-[#C5A880]/15 text-[#C5A880] border border-[#C5A880]/30 rounded">
              Pipeline Reservasi
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-zinc-400 text-xs">Jadwal Acara & Pemesanan Paket</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-light">
            Inquiries & Reservasi Klien
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Pantau dan kelola seluruh calon klien, status reservasi, histori catatan internal, serta ekspor CSV.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#18181D] hover:bg-[#22222A] text-zinc-300 border border-zinc-700 rounded-sm text-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] font-semibold rounded-sm text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Reservasi Manual</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121215] p-4 rounded-sm border border-[#24242A]">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['all', 'new', 'contacted', 'quoted', 'confirmed', 'completed', 'cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-sm text-xs capitalize transition-colors shrink-0 cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#C5A880] text-[#0C0C0D] font-bold'
                  : 'bg-[#18181D] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {st === 'all' ? 'Semua Status' : statusBadges[st]?.label || st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari kode, nama, whatsapp, lokasi..."
            className="w-full pl-9 pr-4 py-2 bg-[#18181D] border border-zinc-800 rounded-sm text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#C5A880]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-[#121215] border border-[#24242A] rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-500">Memuat data inquiry...</div>
        ) : inquiries.length === 0 ? (
          <div className="p-16 text-center text-xs text-zinc-500 space-y-3">
            <Inbox className="w-8 h-8 text-zinc-600 mx-auto" />
            <p>Tidak ada data inquiry pada kriteria ini.</p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#C5A880] text-black font-semibold rounded text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Reservasi</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#16161B] text-zinc-400 uppercase tracking-wider border-b border-zinc-800 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Kode & Klien</th>
                  <th className="py-3 px-4">Layanan & Paket</th>
                  <th className="py-3 px-4">Tgl & Lokasi Acara</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {inquiries.map(inq => {
                  const badge = statusBadges[inq.status] || { label: inq.status, class: 'bg-zinc-800 text-zinc-400' };
                  const cleanPhone = inq.whatsapp_number.replace(/[^0-9]/g, '').replace(/^0/, '62');

                  return (
                    <tr key={inq.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[10px] text-[#C5A880] font-bold">
                            {inq.inquiry_code}
                          </span>
                          <h4 className="font-medium text-white">{inq.full_name}</h4>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                            <span>{inq.whatsapp_number}</span>
                            {inq.company && <span>• {inq.company}</span>}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-300">
                        <div className="font-medium text-white">{inq.service_name || '-'}</div>
                        <div className="text-[11px] text-[#E2D2BC]">{inq.package_name ? `Paket ${inq.package_name}` : 'Kustom'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-400">
                        <div className="flex items-center gap-1.5 text-zinc-200">
                          <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
                          <span>{inq.event_date} {inq.event_time ? `(${inq.event_time})` : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{inq.location}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={inq.status}
                          onChange={e => updateStatus(inq.id, e.target.value)}
                          className={`text-[10px] uppercase font-semibold px-2 py-1 rounded border bg-[#141418] cursor-pointer ${badge.class}`}
                        >
                          <option value="new">Baru Masuk</option>
                          <option value="contacted">Dihubungi</option>
                          <option value="quoted">Diberi Penawaran</option>
                          <option value="confirmed">Booking Terkonfirmasi</option>
                          <option value="completed">Selesai & Terkirim</option>
                          <option value="cancelled">Dibatalkan</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`https://wa.me/${cleanPhone}?text=Halo%20${encodeURIComponent(inq.full_name)},%20kami%20dari%20AF%20Frame%20menanggapi%20inquiry%20${encodeURIComponent(inq.inquiry_code)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-400 hover:bg-emerald-900/50"
                            title="Buka Chat WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => setSelectedInquiry(inq)}
                            className="p-1.5 rounded bg-[#1A1A20] text-zinc-300 hover:text-[#C5A880] border border-zinc-700"
                            title="Lihat Detail Lengkap & Catatan"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(inq)}
                            className="p-1.5 rounded bg-[#1A1A20] text-zinc-400 hover:text-white border border-zinc-700"
                            title="Edit Rincian Reservasi"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(inq)}
                            className="p-1.5 rounded bg-[#1A1A20] text-zinc-500 hover:text-red-400 border border-zinc-700"
                            title="Hapus Reservasi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="bg-[#141418] border border-zinc-800 max-w-2xl w-full rounded-sm p-6 space-y-6 my-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-mono">
                  Detail Reservasi
                </span>
                <h3 className="font-serif text-xl text-white">{selectedInquiry.inquiry_code}</h3>
              </div>
              <button onClick={() => setSelectedInquiry(null)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Client Info Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-[#18181D] rounded text-xs">
              <div>
                <span className="text-zinc-500 block">Nama Lengkap</span>
                <span className="font-medium text-white text-sm">{selectedInquiry.full_name}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Nomor WhatsApp</span>
                <a
                  href={`https://wa.me/${selectedInquiry.whatsapp_number.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#C5A880] hover:underline"
                >
                  {selectedInquiry.whatsapp_number} ↗
                </a>
              </div>
              <div>
                <span className="text-zinc-500 block">Email</span>
                <span className="text-zinc-300">{selectedInquiry.email || '-'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Instagram</span>
                <span className="text-zinc-300">{selectedInquiry.instagram_handle || '-'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Layanan & Paket</span>
                <span className="text-zinc-300 font-medium">
                  {selectedInquiry.service_name} — {selectedInquiry.package_name || 'Kustom'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Perusahaan / Brand</span>
                <span className="text-zinc-300">{selectedInquiry.company || '-'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Jadwal Acara</span>
                <span className="text-zinc-300">{selectedInquiry.event_date} {selectedInquiry.event_time}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Lokasi Kegiatan</span>
                <span className="text-zinc-300">{selectedInquiry.location}</span>
              </div>
              {selectedInquiry.budget_range && (
                <div className="col-span-2">
                  <span className="text-zinc-500 block">Estimasi Budget Klien</span>
                  <span className="text-[#E2D2BC] font-medium">{selectedInquiry.budget_range}</span>
                </div>
              )}
            </div>

            {/* Additional notes from client */}
            {selectedInquiry.additional_notes && (
              <div className="p-3 bg-[#18181D] border-l-2 border-[#C5A880] text-xs">
                <span className="text-zinc-500 block mb-1">Catatan dari Klien:</span>
                <p className="text-zinc-300 whitespace-pre-line">{selectedInquiry.additional_notes}</p>
              </div>
            )}

            {/* Internal Staff Notes */}
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <h4 className="text-xs uppercase tracking-wider text-zinc-300 font-semibold">
                Catatan Internal Tim AF Frame
              </h4>

              {/* Notes list */}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {!selectedInquiry.notes || selectedInquiry.notes.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 italic">Belum ada catatan internal.</p>
                ) : (
                  selectedInquiry.notes.map((n, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-[#18181D] border border-zinc-800/80 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                        <span className="font-semibold text-[#C5A880]">{n.author_name}</span>
                        <span>{new Date(n.created_at).toLocaleString('id-ID')}</span>
                      </div>
                      <p className="text-zinc-300">{n.note}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tambah catatan internal (e.g. Klien request tambahan 1 kamera)..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-xs text-zinc-200"
                />
                <button
                  type="submit"
                  disabled={isAddingNote || !newNote.trim()}
                  className="px-4 py-2 bg-[#C5A880] text-[#0C0C0D] font-semibold text-xs rounded uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  {isAddingNote ? '...' : 'Tambah Catatan'}
                </button>
              </form>
            </div>

            {/* Footer close */}
            <div className="pt-3 flex justify-between border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  const toEdit = selectedInquiry;
                  setSelectedInquiry(null);
                  openEditModal(toEdit);
                }}
                className="px-3.5 py-2 bg-[#18181D] hover:bg-zinc-800 text-zinc-200 text-xs rounded border border-zinc-700 transition-colors"
              >
                Edit Rincian Reservasi
              </button>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-2 bg-[#C5A880] hover:bg-[#B39366] text-black font-semibold text-xs rounded"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL CREATE / EDIT INQUIRY */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#26262D] rounded-sm w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-5 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-xl text-white font-medium">
                {formMode === 'create' ? 'Tambah Reservasi Manual' : 'Edit Rincian Reservasi'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Masukkan pemesanan dari WhatsApp, studio offline, atau klien langsung.
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Client Name & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">
                    Nama Klien <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Contoh: Sarah Angelina"
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">
                    Nomor WhatsApp <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.whatsapp_number}
                    onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    placeholder="Contoh: 085755152579"
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              {/* Service & Package */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">Layanan</label>
                  <input
                    type="text"
                    value={formData.service_name}
                    onChange={e => setFormData({ ...formData, service_name: e.target.value })}
                    placeholder="Misal: Wedding, Graduation, Corporate..."
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">Pilihan Paket</label>
                  <input
                    type="text"
                    value={formData.package_name}
                    onChange={e => setFormData({ ...formData, package_name: e.target.value })}
                    placeholder="Misal: GOLD, DIAMOND, STANDART..."
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              {/* Event Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">
                    Tanggal Acara <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">Waktu Acara</label>
                  <input
                    type="text"
                    value={formData.event_time}
                    onChange={e => setFormData({ ...formData, event_time: e.target.value })}
                    placeholder="Contoh: 08:00 - 14:00 WIB"
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              {/* Location & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">
                    Lokasi Acara <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Contoh: Grand City Convex Surabaya"
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">Status Reservasi</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  >
                    <option value="new">Baru Masuk</option>
                    <option value="contacted">Dihubungi</option>
                    <option value="quoted">Diberi Penawaran</option>
                    <option value="confirmed">Booking Terkonfirmasi (DP)</option>
                    <option value="completed">Selesai & Terkirim</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>
              </div>

              {/* Budget & Additional Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">Budget / Nilai Kesepakatan</label>
                  <input
                    type="text"
                    value={formData.budget_range}
                    onChange={e => setFormData({ ...formData, budget_range: e.target.value })}
                    placeholder="Contoh: Rp 3.800.000"
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">Perusahaan / Instansi (Opsional)</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Jika ada"
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-medium">Catatan & Kebutuhan Khusus</label>
                <textarea
                  rows={3}
                  value={formData.additional_notes}
                  onChange={e => setFormData({ ...formData, additional_notes: e.target.value })}
                  placeholder="Catatan konsep pemotretan, permintaan khusus, dll..."
                  className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-[#18181D] hover:bg-zinc-800 text-zinc-300 rounded transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] font-semibold rounded transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? 'Menyimpan...' : formMode === 'create' ? 'Tambah Reservasi' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-red-900/60 rounded-sm w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif text-lg text-white font-medium flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              <span>Hapus Reservasi?</span>
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus reservasi <strong>"{deleteTarget.inquiry_code}"</strong> atas nama <strong>{deleteTarget.full_name}</strong>?
              Data catatan internal yang terkait juga akan dihapus.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-[#18181D] hover:bg-zinc-800 text-zinc-300 text-xs rounded"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteInquiry}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
