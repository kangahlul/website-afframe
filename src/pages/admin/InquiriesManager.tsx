import React, { useState, useEffect } from 'react';
import {
  Inbox, Search, Filter, Download, MessageSquare, Clock, MapPin,
  Calendar, User, Building, DollarSign, CheckCircle2, XCircle,
  FileText, Send, Eye, X, ArrowUpRight
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
    confirmed: { label: 'Booking Terkonfirmasi (DP 50%)', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    completed: { label: 'Selesai & File Dikirim', class: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' },
    cancelled: { label: 'Dibatalkan', class: 'bg-red-500/10 text-red-400 border-red-500/30' },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-light">
            Inquiries & Reservasi Klien
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Pantau dan kelola seluruh calon klien, status reservasi, histori catatan internal, serta ekspor CSV.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1A1A20] hover:bg-[#25252D] text-zinc-200 border border-zinc-700 rounded-sm text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#C5A880]" />
          <span>Ekspor ke CSV (Excel)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121215] p-4 rounded-sm border border-[#24242A]">
        {/* Status filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['all', 'new', 'contacted', 'quoted', 'confirmed', 'completed', 'cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-sm text-xs capitalize transition-colors shrink-0 ${
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
            placeholder="Cari kode, nama, whatsapp..."
            className="w-full pl-9 pr-4 py-2 bg-[#18181D] border border-zinc-800 rounded-sm text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#C5A880]"
          />
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-[#121215] border border-[#24242A] rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-500">Memuat data inquiry...</div>
        ) : inquiries.length === 0 ? (
          <div className="p-16 text-center text-xs text-zinc-500 space-y-2">
            <Inbox className="w-8 h-8 text-zinc-600 mx-auto" />
            <p>Tidak ada data inquiry pada kriteria ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#16161B] text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
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
                        <div className="flex items-center justify-end gap-2">
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
                            className="p-1.5 rounded bg-[#1A1A20] text-zinc-300 hover:text-white border border-zinc-700"
                            title="Lihat Detail Lengkap & Catatan"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

      {/* Inquiry Detail Drawer / Modal */}
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
                  className="px-4 py-2 bg-[#C5A880] text-[#0C0C0D] font-semibold text-xs rounded uppercase tracking-wider disabled:opacity-50"
                >
                  {isAddingNote ? '...' : 'Tambah Catatan'}
                </button>
              </form>
            </div>

            {/* Footer close */}
            <div className="pt-2 flex justify-end border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
