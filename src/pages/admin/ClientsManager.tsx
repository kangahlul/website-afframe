import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, Download, Plus, MessageCircle, Mail,
  MapPin, Building, DollarSign, Crown, CheckCircle2,
  Clock, Trash2, Edit, Eye, X, ArrowUpRight, Phone, Calendar,
  FileText, Sparkles, RefreshCw, LayoutGrid, Table as TableIcon
} from 'lucide-react';
import { InstagramIcon } from '../../components/common/InstagramIcon';
import { Client, ClientStats, Inquiry } from '../../types';
import { api } from '../../lib/api';

export const ClientsManager: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    totalClients: 0,
    leadCount: 0,
    activeCount: 0,
    vipCount: 0,
    completedCount: 0,
    totalSpendSum: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Detail Modal
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form Modal (Create / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_whatsapp: '',
    email: '',
    instagram_handle: '',
    company_brand: '',
    client_type: 'personal',
    address_city: 'Lamongan',
    status: 'active',
    total_spend: 0,
    notes: '',
  });

  // Delete Confirmation Modal
  const [deleteClientTarget, setDeleteClientTarget] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ clients: Client[]; stats: ClientStats }>('/clients', {
        search,
        status: statusFilter,
        client_type: typeFilter,
      });
      setClients(res.clients || []);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, statusFilter, typeFilter]);

  const fetchClientDetail = async (id: number) => {
    try {
      setDetailLoading(true);
      const res = await api.get<{ client: Client }>(`/clients/${id}`);
      setSelectedClient(res.client);
    } catch (err) {
      console.error('Failed to fetch client detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormMode('create');
    setEditingId(null);
    setFormData({
      full_name: '',
      phone_whatsapp: '',
      email: '',
      instagram_handle: '',
      company_brand: '',
      client_type: 'personal',
      address_city: 'Lamongan',
      status: 'active',
      total_spend: 0,
      notes: '',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (client: Client) => {
    setFormMode('edit');
    setEditingId(client.id);
    setFormData({
      full_name: client.full_name || '',
      phone_whatsapp: client.phone_whatsapp || '',
      email: client.email || '',
      instagram_handle: client.instagram_handle || '',
      company_brand: client.company_brand || '',
      client_type: client.client_type || 'personal',
      address_city: client.address_city || 'Lamongan',
      status: client.status || 'active',
      total_spend: client.total_spend || 0,
      notes: client.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.phone_whatsapp.trim()) {
      alert('Nama Lengkap dan Nomor WhatsApp wajib diisi.');
      return;
    }

    try {
      setFormSubmitting(true);
      if (formMode === 'create') {
        await api.post('/clients', formData);
      } else if (editingId) {
        await api.put(`/clients/${editingId}`, formData);
      }
      setIsFormOpen(false);
      fetchClients();
      if (selectedClient && selectedClient.id === editingId) {
        fetchClientDetail(editingId);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data pelanggan.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!deleteClientTarget) return;
    try {
      setIsDeleting(true);
      await api.delete(`/clients/${deleteClientTarget.id}`);
      setDeleteClientTarget(null);
      if (selectedClient?.id === deleteClientTarget.id) {
        setSelectedClient(null);
      }
      fetchClients();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus pelanggan.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await api.get<Blob>('/clients/export/csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `afframe-pelanggan-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Gagal mengekspor data pelanggan.');
    }
  };

  // Helper formatting
  const clientTypeLabels: Record<string, { label: string; icon: string }> = {
    personal: { label: 'Personal / Potret', icon: '👤' },
    couple_wedding: { label: 'Wedding & Couple', icon: '💍' },
    corporate: { label: 'Korporat & Brand', icon: '🏢' },
    student_graduation: { label: 'Wisuda & Pelajar', icon: '🎓' },
    community_event: { label: 'Komunitas & Event', icon: '🎪' },
  };

  const statusBadges: Record<string, { label: string; class: string }> = {
    lead: { label: 'Prospek / Lead', class: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    active: { label: 'Booking Aktif', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    vip: { label: 'VIP / Langganan', class: 'bg-purple-500/15 text-purple-300 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.15)]' },
    completed: { label: 'Selesai', class: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' },
  };

  const getCleanWa = (num: string) => {
    let clean = num.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    return clean;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-[#C5A880]/15 text-[#C5A880] border border-[#C5A880]/30 rounded">
              CRM Pelanggan
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-zinc-400 text-xs">Customer Relationship Management</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-light">
            Kelola Data Pelanggan & Klien
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Database lengkap pelanggan AFFRAME, kontak WhatsApp langsung, riwayat sesi dokumentasi, dan status VIP.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#18181D] hover:bg-[#22222A] text-zinc-300 border border-zinc-700 rounded-sm text-xs transition-colors cursor-pointer"
            title="Download database pelanggan dalam format Excel CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] font-semibold rounded-sm text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pelanggan Baru</span>
          </button>
        </div>
      </div>

      {/* Stats Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Clients */}
        <div className="p-4 bg-[#121215] border border-[#24242A] rounded-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Total Pelanggan</span>
            <Users className="w-4 h-4 text-[#C5A880]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-white font-light">
            {stats.totalClients}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Terdaftar di database studio</p>
        </div>

        {/* Active Clients */}
        <div className="p-4 bg-[#121215] border border-[#24242A] rounded-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Booking Aktif</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-emerald-300 font-light">
            {stats.activeCount}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Sesi berjalan & persiapan</p>
        </div>

        {/* VIP Clients */}
        <div className="p-4 bg-[#121215] border border-[#24242A] rounded-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Klien VIP / Repeat</span>
            <Crown className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-purple-300 font-light">
            {stats.vipCount}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Prioritas & pelanggan setia</p>
        </div>

        {/* Total Value */}
        <div className="p-4 bg-[#121215] border border-[#24242A] rounded-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Estimasi Nilai Proyek</span>
            <DollarSign className="w-4 h-4 text-[#C5A880]" />
          </div>
          <div className="text-xl sm:text-2xl font-serif text-[#C5A880] font-light">
            Rp {Number(stats.totalSpendSum).toLocaleString('id-ID')}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Akumulasi transaksi pelanggan</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#121215] border border-[#24242A] rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'active', label: 'Booking Aktif' },
            { id: 'vip', label: 'VIP / Repeat' },
            { id: 'lead', label: 'Lead Prospek' },
            { id: 'completed', label: 'Selesai' },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xs text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-[#C5A880] text-[#0C0C0D] font-semibold'
                  : 'bg-[#18181D] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Type Filter & Search & View Toggle */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Type dropdown */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#18181D] border border-zinc-700 rounded-sm text-xs text-zinc-300 focus:outline-none focus:border-[#C5A880]"
          >
            <option value="all">Semua Kategori Klien</option>
            <option value="personal">👤 Personal / Potret</option>
            <option value="couple_wedding">💍 Wedding & Couple</option>
            <option value="corporate">🏢 Korporat & Brand</option>
            <option value="student_graduation">🎓 Wisuda & Pelajar</option>
            <option value="community_event">🎪 Komunitas & Event</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-grow sm:w-60">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama, WA, instansi, kota..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#18181D] border border-zinc-700 rounded-sm text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#C5A880]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-zinc-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center border border-zinc-700 rounded-sm overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 ${viewMode === 'table' ? 'bg-[#C5A880] text-black' : 'bg-[#18181D] text-zinc-400 hover:text-white'}`}
              title="Tampilan Tabel"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-[#C5A880] text-black' : 'bg-[#18181D] text-zinc-400 hover:text-white'}`}
              title="Tampilan Kartu Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400 bg-[#121215] border border-[#24242A] rounded-sm space-y-3">
          <div className="w-6 h-6 border-2 border-[#C5A880] border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Memuat database pelanggan...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="p-12 text-center text-xs text-zinc-400 bg-[#121215] border border-[#24242A] rounded-sm space-y-4">
          <Users className="w-10 h-10 text-zinc-600 mx-auto stroke-[1.2]" />
          <div>
            <p className="text-sm font-semibold text-zinc-300">Tidak ada pelanggan ditemukan</p>
            <p className="text-zinc-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter status Anda.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] font-semibold rounded-sm text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pelanggan Baru</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-[#121215] border border-[#24242A] rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#16161B] text-zinc-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Pelanggan</th>
                  <th className="py-3 px-4 font-semibold">Kategori</th>
                  <th className="py-3 px-4 font-semibold">Kontak & WA</th>
                  <th className="py-3 px-4 font-semibold">Domisili</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Nilai / Booking</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {clients.map(client => {
                  const typeInfo = clientTypeLabels[client.client_type] || clientTypeLabels.personal;
                  const statusInfo = statusBadges[client.status] || statusBadges.active;
                  const initials = client.full_name.slice(0, 2).toUpperCase();
                  const cleanWa = getCleanWa(client.phone_whatsapp);

                  return (
                    <tr key={client.id} className="hover:bg-[#18181E] transition-colors">
                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border border-[#C5A880]/50 bg-[#1E1E24] flex items-center justify-center font-serif text-xs font-semibold text-[#F8F6F0] shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => fetchClientDetail(client.id)}
                              className="font-medium text-white hover:text-[#C5A880] transition-colors text-left truncate block"
                            >
                              {client.full_name}
                            </button>
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-0.5">
                              <span>{client.client_code}</span>
                              {client.company_brand && (
                                <>
                                  <span>•</span>
                                  <span className="text-zinc-400 truncate max-w-[150px]">{client.company_brand}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Client Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-300">
                          <span>{typeInfo.icon}</span>
                          <span>{typeInfo.label}</span>
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://wa.me/${cleanWa}?text=Halo%20${encodeURIComponent(client.full_name)},%20kami%20dari%20AF%20Frame`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline font-mono"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{client.phone_whatsapp}</span>
                          </a>
                          {client.instagram_handle && (
                            <a
                              href={`https://instagram.com/${client.instagram_handle.replace(/^@/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-500 hover:text-[#C5A880]"
                              title={`Instagram: ${client.instagram_handle}`}
                            >
                              <InstagramIcon className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* City */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-zinc-400">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-600" />
                          <span>{client.address_city || 'Lamongan'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.class}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Value / Bookings */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-medium text-zinc-200">
                          {client.total_spend ? `Rp ${Number(client.total_spend).toLocaleString('id-ID')}` : '-'}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {client.booking_count || 0} booking
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => fetchClientDetail(client.id)}
                            className="p-1.5 text-zinc-400 hover:text-[#C5A880] rounded hover:bg-zinc-800 transition-colors"
                            title="Lihat Detail & Riwayat"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(client)}
                            className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                            title="Edit Data Pelanggan"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteClientTarget(client)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-800 transition-colors"
                            title="Hapus Pelanggan"
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
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(client => {
            const typeInfo = clientTypeLabels[client.client_type] || clientTypeLabels.personal;
            const statusInfo = statusBadges[client.status] || statusBadges.active;
            const initials = client.full_name.slice(0, 2).toUpperCase();
            const cleanWa = getCleanWa(client.phone_whatsapp);

            return (
              <div
                key={client.id}
                className="p-5 bg-[#121215] border border-[#24242A] hover:border-[#C5A880]/50 rounded-sm transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full border border-[#C5A880]/50 bg-[#1E1E24] flex items-center justify-center font-serif text-sm font-semibold text-[#F8F6F0] shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => fetchClientDetail(client.id)}
                          className="font-medium text-white hover:text-[#C5A880] transition-colors text-left truncate block text-sm"
                        >
                          {client.full_name}
                        </button>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {client.client_code}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusInfo.class}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Badges / Category */}
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-[#18181D] text-zinc-300 border border-zinc-800">
                      {typeInfo.icon} {typeInfo.label}
                    </span>
                    {client.company_brand && (
                      <span className="px-2 py-0.5 rounded bg-[#18181D] text-zinc-400 border border-zinc-800 truncate max-w-[150px]">
                        🏢 {client.company_brand}
                      </span>
                    )}
                  </div>

                  {/* Info details */}
                  <div className="space-y-1.5 text-xs text-zinc-400 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">WhatsApp:</span>
                      <a
                        href={`https://wa.me/${cleanWa}?text=Halo%20${encodeURIComponent(client.full_name)},%20kami%20dari%20AF%20Frame`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline font-mono"
                      >
                        {client.phone_whatsapp}
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Kota:</span>
                      <span>{client.address_city || 'Lamongan'}</span>
                    </div>
                    {client.total_spend > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Total Transaksi:</span>
                        <span className="text-[#C5A880] font-medium font-serif text-sm">
                          Rp {Number(client.total_spend).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">
                    {client.booking_count || 0} Riwayat Sesi
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => fetchClientDetail(client.id)}
                      className="px-2.5 py-1 bg-[#18181D] hover:bg-zinc-800 text-zinc-300 text-xs rounded transition-colors"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => openEditModal(client)}
                      className="p-1 text-zinc-400 hover:text-white"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteClientTarget(client)}
                      className="p-1 text-zinc-500 hover:text-red-400"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: DETAIL CLIENT */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#26262D] rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedClient(null)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-zinc-800">
              <div className="w-14 h-14 rounded-full border border-[#C5A880] bg-[#1A1A22] flex items-center justify-center font-serif text-xl font-bold text-[#F8F6F0] shrink-0">
                {selectedClient.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-xl text-white font-medium truncate">
                    {selectedClient.full_name}
                  </h2>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadges[selectedClient.status]?.class}`}>
                    {statusBadges[selectedClient.status]?.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="font-mono text-[#C5A880]">{selectedClient.client_code}</span>
                  <span>•</span>
                  <span>{clientTypeLabels[selectedClient.client_type]?.label}</span>
                  {selectedClient.address_city && (
                    <>
                      <span>•</span>
                      <span>{selectedClient.address_city}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Contact Action Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <a
                href={`https://wa.me/${getCleanWa(selectedClient.phone_whatsapp)}?text=Halo%20${encodeURIComponent(selectedClient.full_name)},%20kami%20dari%20AF%20Frame`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/50 flex items-center justify-center gap-2 transition-colors font-medium"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Chat WhatsApp</span>
              </a>

              {selectedClient.email ? (
                <a
                  href={`mailto:${selectedClient.email}`}
                  className="p-2.5 rounded bg-[#18181D] border border-zinc-700 text-zinc-300 hover:bg-[#22222A] flex items-center justify-center gap-2 transition-colors"
                >
                  <Mail className="w-4 h-4 text-zinc-400" />
                  <span className="truncate">{selectedClient.email}</span>
                </a>
              ) : (
                <div className="p-2.5 rounded bg-[#16161A] border border-zinc-800 text-zinc-600 flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>Tanpa Email</span>
                </div>
              )}

              {selectedClient.instagram_handle ? (
                <a
                  href={`https://instagram.com/${selectedClient.instagram_handle.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded bg-[#18181D] border border-zinc-700 text-zinc-300 hover:bg-[#22222A] flex items-center justify-center gap-2 transition-colors"
                >
                  <InstagramIcon className="w-4 h-4 text-[#C5A880]" />
                  <span>{selectedClient.instagram_handle}</span>
                </a>
              ) : (
                <div className="p-2.5 rounded bg-[#16161A] border border-zinc-800 text-zinc-600 flex items-center justify-center gap-2">
                  <InstagramIcon className="w-4 h-4" />
                  <span>Tanpa Instagram</span>
                </div>
              )}
            </div>

            {/* Notes / Special Preferences */}
            {selectedClient.notes && (
              <div className="p-4 rounded bg-[#16161B] border border-zinc-800 space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold block">
                  📌 Catatan Khusus & Preferensi Klien:
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {selectedClient.notes}
                </p>
              </div>
            )}

            {/* Booking History Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="font-serif text-base text-white font-medium">
                  Riwayat Reservasi & Sesi Terhubung
                </h3>
                <span className="text-xs text-zinc-400 font-mono">
                  {selectedClient.bookings?.length || 0} riwayat
                </span>
              </div>

              {!selectedClient.bookings || selectedClient.bookings.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">
                  Belum ada riwayat reservasi yang terhubung dengan pelanggan ini.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {selectedClient.bookings.map(b => (
                    <div
                      key={b.id}
                      className="p-3.5 bg-[#16161A] border border-zinc-800 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#C5A880] font-semibold">{b.inquiry_code}</span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-white font-medium">{b.service_name || 'Dokumentasi'}</span>
                          {b.package_name && (
                            <span className="text-zinc-400">({b.package_name})</span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-3">
                          <span>📅 Tgl: {b.event_date}</span>
                          <span>📍 {b.location}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[9px] uppercase px-2 py-0.5 rounded-full border bg-zinc-800 text-zinc-300">
                          {b.status}
                        </span>
                        {b.budget_range && (
                          <span className="text-[#C5A880] font-serif font-medium">
                            {b.budget_range}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                onClick={() => {
                  const clientToEdit = selectedClient;
                  setSelectedClient(null);
                  openEditModal(clientToEdit);
                }}
                className="px-4 py-2 bg-[#18181D] hover:bg-[#22222A] text-zinc-200 border border-zinc-700 text-xs rounded transition-colors"
              >
                Edit Data Pelanggan
              </button>
              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] text-xs font-semibold rounded transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT CLIENT FORM */}
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
                {formMode === 'create' ? 'Tambah Pelanggan Baru' : 'Edit Data Pelanggan'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Isi rincian informasi kontak dan kategori pelanggan AFFRAME.
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">
                    Nama Lengkap <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Contoh: Dinda Ayu Maharani"
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">
                    Nomor WhatsApp / HP <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone_whatsapp}
                    onChange={e => setFormData({ ...formData, phone_whatsapp: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              {/* Email & Instagram */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">Alamat Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@domain.com"
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">Instagram Handle</label>
                  <input
                    type="text"
                    value={formData.instagram_handle}
                    onChange={e => setFormData({ ...formData, instagram_handle: e.target.value })}
                    placeholder="@username"
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              {/* Company & Client Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">Instansi / Brand / Perusahaan</label>
                  <input
                    type="text"
                    value={formData.company_brand}
                    onChange={e => setFormData({ ...formData, company_brand: e.target.value })}
                    placeholder="Opsional jika korporat/organisasi"
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">Kategori / Segmen Klien</label>
                  <select
                    value={formData.client_type}
                    onChange={e => setFormData({ ...formData, client_type: e.target.value })}
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  >
                    <option value="personal">👤 Personal / Individu</option>
                    <option value="couple_wedding">💍 Wedding & Couple</option>
                    <option value="corporate">🏢 Korporat & Brand</option>
                    <option value="student_graduation">🎓 Wisuda & Pelajar</option>
                    <option value="community_event">🎪 Komunitas & Event</option>
                  </select>
                </div>
              </div>

              {/* City, Status & Total Spend */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">Kota / Domisili</label>
                  <input
                    type="text"
                    value={formData.address_city}
                    onChange={e => setFormData({ ...formData, address_city: e.target.value })}
                    placeholder="Lamongan / Surabaya / Gresik"
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">Status Klien</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  >
                    <option value="lead">Prospek / Lead</option>
                    <option value="active">Booking Aktif</option>
                    <option value="vip">VIP / Repeat Client</option>
                    <option value="completed">Selesai</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">Total Transaksi (Rp)</label>
                  <input
                    type="number"
                    value={formData.total_spend}
                    onChange={e => setFormData({ ...formData, total_spend: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-zinc-300 block mb-1 font-medium">
                  Catatan Khusus & Preferensi Klien
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Contoh: Suka gaya sinematik moody hangat, request drone shoot, pembayaran termin..."
                  className="w-full px-3 py-2 bg-[#18181C] border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              {/* Submit / Cancel */}
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
                  {formSubmitting ? 'Menyimpan...' : formMode === 'create' ? 'Tambah Pelanggan' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteClientTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-red-900/60 rounded-sm w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif text-lg text-white font-medium flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              <span>Hapus Data Pelanggan?</span>
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus pelanggan <strong>"{deleteClientTarget.full_name}"</strong> ({deleteClientTarget.client_code})?
              Data riwayat booking yang terhubung tidak akan terhapus, namun relasi pelanggan akan dilepas.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteClientTarget(null)}
                className="px-4 py-2 bg-[#18181D] hover:bg-zinc-800 text-zinc-300 text-xs rounded"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteClient}
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
