import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban, Package, Inbox, Image, Clock, CheckCircle,
  AlertCircle, ArrowUpRight, Plus, RefreshCw, FileText,
  Users, Crown, DollarSign, Calendar, MapPin, MessageCircle,
  Sparkles, Palette, Layers, Globe, ChevronRight
} from 'lucide-react';
import { api } from '../../lib/api';

export const DashboardOverview: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inquiries' | 'clients'>('inquiries');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>('/dashboard/stats');
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const metrics = data?.metrics || {
    publishedProjects: 0,
    draftProjects: 0,
    totalCategories: 0,
    totalServices: 0,
    totalPackages: 0,
    totalInquiries: 0,
    newInquiries: 0,
    contactedInquiries: 0,
    quotedInquiries: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledInquiries: 0,
    totalClients: 0,
    activeClients: 0,
    vipClients: 0,
    leadClients: 0,
    pipelineValue: 0,
    totalMedia: 0,
  };

  const statusColors: Record<string, string> = {
    new: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    contacted: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    quoted: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    completed: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  const clientTypeLabels: Record<string, string> = {
    personal: '👤 Personal',
    couple_wedding: '💍 Wedding',
    corporate: '🏢 Korporat',
    student_graduation: '🎓 Wisuda',
    community_event: '🎪 Komunitas',
  };

  // Today date formatted in Indonesian
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="p-6 bg-[#121215] border border-[#24242A] rounded-sm relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-40 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono text-emerald-400 font-medium uppercase tracking-wider">
                Database Cloud Aktif & Terhubung
              </span>
              <span className="text-zinc-600 text-xs">•</span>
              <span className="text-[11px] text-zinc-400 font-sans">{todayFormatted}</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-white font-light">
              Selamat Datang di Studio Panel <span className="text-[#C5A880]">AFFRAME</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Ringkasan operasional harian studio: pantau permintaan reservasi, kelola data klien, dan atur seluruh konten visual website secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={fetchStats}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-[#18181D] hover:bg-[#22222A] text-xs text-zinc-300 border border-zinc-700 transition-colors cursor-pointer"
              title="Segarkan data terbaru"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
            <Link
              to="/admin/clients"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#1A1A22] hover:bg-[#242430] text-xs text-[#E2D2BC] border border-[#C5A880]/40 transition-colors font-medium"
            >
              <Users className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Kelola Klien</span>
            </Link>
            <Link
              to="/admin/inquiries"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#C5A880] hover:bg-[#B39366] text-xs font-semibold text-[#0C0C0D] transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Reservasi Baru</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 5 Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Total Clients (CRM) */}
        <div className="p-4 bg-[#121215] border border-[#24242A] hover:border-[#C5A880]/40 rounded-sm relative transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Data Pelanggan</span>
              <Users className="w-4 h-4 text-[#C5A880]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-serif text-white font-light">{metrics.totalClients}</span>
              <span className="text-[11px] text-purple-400 font-mono">({metrics.vipClients} VIP)</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <Link to="/admin/clients" className="text-[#C5A880] hover:underline flex items-center gap-1">
              <span>Buka CRM</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Metric 2: New Inquiries */}
        <div className="p-4 bg-[#121215] border border-[#24242A] hover:border-amber-500/40 rounded-sm relative transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Inquiry Baru</span>
              <Inbox className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-serif text-amber-300 font-light">{metrics.newInquiries}</span>
              <span className="text-[11px] text-zinc-500">butuh respon</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <Link to="/admin/inquiries" className="text-amber-400 hover:underline flex items-center gap-1">
              <span>{metrics.totalInquiries} Total</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Metric 3: Confirmed Bookings */}
        <div className="p-4 bg-[#121215] border border-[#24242A] hover:border-emerald-500/40 rounded-sm relative transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Booking Terkonfirmasi</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-serif text-emerald-300 font-light">{metrics.confirmedBookings}</span>
              <span className="text-[11px] text-zinc-500">deal aktif</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-emerald-400/90 text-[10px]">Telah DP / Jadwal Fix</span>
          </div>
        </div>

        {/* Metric 4: Pipeline Revenue */}
        <div className="p-4 bg-[#121215] border border-[#24242A] hover:border-[#C5A880]/40 rounded-sm relative transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Estimasi Nilai Transaksi</span>
              <DollarSign className="w-4 h-4 text-[#C5A880]" />
            </div>
            <div className="text-lg sm:text-xl font-serif text-[#C5A880] font-light truncate">
              Rp {Number(metrics.pipelineValue).toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500 text-[10px]">Akumulasi Klien</span>
          </div>
        </div>

        {/* Metric 5: Published Portfolio & Services */}
        <div className="p-4 bg-[#121215] border border-[#24242A] hover:border-blue-500/40 rounded-sm relative transition-all flex flex-col justify-between col-span-2 sm:col-span-1">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Katalog & Karya</span>
              <FolderKanban className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-serif text-white font-light">{metrics.publishedProjects}</span>
              <span className="text-[11px] text-zinc-500">karya ({metrics.totalPackages} paket)</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <Link to="/admin/portfolio" className="text-blue-400 hover:underline flex items-center gap-1">
              <span>{metrics.totalCategories} Kategori</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Pipeline Status Breakdown Bar */}
      <div className="p-4 bg-[#121215] border border-[#24242A] rounded-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <span>Alur Pipeline Reservasi Studio</span>
            <span className="text-[10px] text-zinc-500 font-normal">({metrics.totalInquiries} total inquiry)</span>
          </span>
          <Link to="/admin/inquiries" className="text-[11px] text-[#C5A880] hover:underline">
            Buka Tabel Reservasi →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
          <div className="p-2.5 rounded bg-[#18181D] border border-amber-500/20 text-center">
            <span className="text-[10px] uppercase text-zinc-400 block">1. Baru</span>
            <span className="text-lg font-serif font-bold text-amber-400">{metrics.newInquiries}</span>
          </div>
          <div className="p-2.5 rounded bg-[#18181D] border border-blue-500/20 text-center">
            <span className="text-[10px] uppercase text-zinc-400 block">2. Dihubungi</span>
            <span className="text-lg font-serif font-bold text-blue-400">{metrics.contactedInquiries}</span>
          </div>
          <div className="p-2.5 rounded bg-[#18181D] border border-purple-500/20 text-center">
            <span className="text-[10px] uppercase text-zinc-400 block">3. Penawaran</span>
            <span className="text-lg font-serif font-bold text-purple-400">{metrics.quotedInquiries}</span>
          </div>
          <div className="p-2.5 rounded bg-[#18181D] border border-emerald-500/20 text-center">
            <span className="text-[10px] uppercase text-zinc-400 block">4. Terkonfirmasi</span>
            <span className="text-lg font-serif font-bold text-emerald-400">{metrics.confirmedBookings}</span>
          </div>
          <div className="p-2.5 rounded bg-[#18181D] border border-zinc-700/30 text-center">
            <span className="text-[10px] uppercase text-zinc-400 block">5. Selesai</span>
            <span className="text-lg font-serif font-bold text-zinc-300">{metrics.completedBookings}</span>
          </div>
          <div className="p-2.5 rounded bg-[#18181D] border border-red-500/20 text-center">
            <span className="text-[10px] uppercase text-zinc-400 block">6. Batal</span>
            <span className="text-lg font-serif font-bold text-red-400">{metrics.cancelledInquiries}</span>
          </div>
        </div>
      </div>

      {/* Two-Column Operational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (7 cols): Tabbed Inquiries & Clients */}
        <div className="lg:col-span-7 bg-[#121215] border border-[#24242A] rounded-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            {/* Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('inquiries')}
                className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer transition-colors ${
                  activeTab === 'inquiries'
                    ? 'bg-[#C5A880] text-black'
                    : 'bg-[#18181D] text-zinc-400 hover:text-white'
                }`}
              >
                Inquiry & Reservasi Masuk
              </button>
              <button
                onClick={() => setActiveTab('clients')}
                className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer transition-colors ${
                  activeTab === 'clients'
                    ? 'bg-[#C5A880] text-black'
                    : 'bg-[#18181D] text-zinc-400 hover:text-white'
                }`}
              >
                Pelanggan Terbaru Terdaftar
              </button>
            </div>

            <Link
              to={activeTab === 'inquiries' ? '/admin/inquiries' : '/admin/clients'}
              className="text-xs text-[#C5A880] hover:underline"
            >
              Lihat Semua →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-zinc-900 animate-pulse rounded" />
              ))}
            </div>
          ) : activeTab === 'inquiries' ? (
            /* Recent Inquiries List */
            !data?.recentInquiries || data.recentInquiries.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-500">
                Belum ada inquiry yang masuk.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {data.recentInquiries.map((inq: any) => {
                  const cleanPhone = inq.whatsapp_number ? inq.whatsapp_number.replace(/[^0-9]/g, '').replace(/^0/, '62') : '';
                  return (
                    <div key={inq.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-[#C5A880] font-bold">{inq.inquiry_code}</span>
                          <span className="text-xs font-semibold text-white truncate">{inq.full_name}</span>
                          <span
                            className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${
                              statusColors[inq.status] || 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {inq.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 flex-wrap">
                          <span>{inq.service_name || 'Dokumentasi'}</span>
                          {inq.package_name && <span>({inq.package_name})</span>}
                          <span>•</span>
                          <span>📅 {inq.event_date}</span>
                          {inq.location && <span>• 📍 {inq.location}</span>}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <a
                          href={`https://wa.me/${cleanPhone}?text=Halo%20${encodeURIComponent(inq.full_name)},%20kami%20dari%20AF%20Frame`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-700/60 text-[11px] text-emerald-300 hover:bg-emerald-900/50 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-400" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Recent Clients List */
            !data?.recentClients || data.recentClients.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-500">
                Belum ada data pelanggan tersimpan.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {data.recentClients.map((client: any) => {
                  const cleanPhone = client.phone_whatsapp ? client.phone_whatsapp.replace(/[^0-9]/g, '').replace(/^0/, '62') : '';
                  return (
                    <div key={client.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full border border-[#C5A880]/50 bg-[#1E1E24] flex items-center justify-center font-serif text-xs font-semibold text-[#F8F6F0] shrink-0">
                          {client.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white truncate">{client.full_name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">({client.client_code})</span>
                          </div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                            <span>{clientTypeLabels[client.client_type] || 'Personal'}</span>
                            <span>•</span>
                            <span>{client.address_city || 'Lamongan'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <a
                          href={`https://wa.me/${cleanPhone}?text=Halo%20${encodeURIComponent(client.full_name)},%20kami%20dari%20AF%20Frame`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline font-mono"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Chat</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Right Column (5 cols): Portfolio Updates & Coverage */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recent Portfolio Projects */}
          <div className="bg-[#121215] border border-[#24242A] rounded-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h2 className="font-serif text-base text-white font-medium">Proyek Portofolio Terakhir</h2>
                <p className="text-[11px] text-zinc-400">Karya tayang di galeri publik.</p>
              </div>
              <Link to="/admin/portfolio" className="text-xs text-[#C5A880] hover:underline">
                Kelola →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-zinc-900 animate-pulse rounded" />
                ))}
              </div>
            ) : !data?.recentProjects || data.recentProjects.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                Belum ada proyek yang ditambahkan.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {data.recentProjects.map((p: any) => (
                  <div key={p.id} className="py-2.5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-sm overflow-hidden bg-black shrink-0 border border-zinc-800">
                      <img src={p.cover_image_url} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="text-xs font-medium text-white truncate">{p.title}</h3>
                      <p className="text-[10px] text-zinc-400">{p.category_name || 'Tanpa Kategori'}</p>
                    </div>
                    <span
                      className={`text-[9px] uppercase px-2 py-0.5 rounded ${
                        p.is_published ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                      }`}
                    >
                      {p.is_published ? 'Publik' : 'Draft'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Coverage & Status Card */}
          <div className="bg-[#121215] border border-[#24242A] rounded-sm p-5 space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Wilayah Operasional Utama</span>
            </h3>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              AFFRAME berfokus pada area <strong className="text-zinc-200">Lamongan, Gresik, Surabaya</strong>, dan kota-kota lain di Jawa Timur by request.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
              <div className="p-2 rounded bg-[#18181D] border border-zinc-800">
                <span className="font-semibold text-white block">Lamongan</span>
                <span className="text-[10px] text-emerald-400">Home Base</span>
              </div>
              <div className="p-2 rounded bg-[#18181D] border border-zinc-800">
                <span className="font-semibold text-white block">Gresik</span>
                <span className="text-[10px] text-[#C5A880]">Coverage</span>
              </div>
              <div className="p-2 rounded bg-[#18181D] border border-zinc-800">
                <span className="font-semibold text-white block">Surabaya</span>
                <span className="text-[10px] text-[#C5A880]">Coverage</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Administration Shortcuts Grid */}
      <div className="p-6 bg-[#121215] border border-[#24242A] rounded-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <h2 className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
            Pintasan Cepat Akses Modul CMS
          </h2>
          <span className="text-[11px] text-zinc-500">Kelola segala aspek website dalam 1 klik</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <Link
            to="/admin/clients"
            className="p-3.5 rounded bg-[#18181D] hover:bg-[#202026] border border-zinc-800 hover:border-[#C5A880]/50 text-zinc-200 flex flex-col justify-between gap-3 transition-all group"
          >
            <Users className="w-5 h-5 text-[#C5A880] group-hover:scale-110 transition-transform" />
            <div>
              <span className="font-semibold block text-white">Kelola Klien</span>
              <span className="text-[10px] text-zinc-400">Database & CRM</span>
            </div>
          </Link>

          <Link
            to="/admin/inquiries"
            className="p-3.5 rounded bg-[#18181D] hover:bg-[#202026] border border-zinc-800 hover:border-amber-500/50 text-zinc-200 flex flex-col justify-between gap-3 transition-all group"
          >
            <Inbox className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <div>
              <span className="font-semibold block text-white">Reservasi</span>
              <span className="text-[10px] text-zinc-400">Jadwal Acara</span>
            </div>
          </Link>

          <Link
            to="/admin/portfolio"
            className="p-3.5 rounded bg-[#18181D] hover:bg-[#202026] border border-zinc-800 hover:border-blue-500/50 text-zinc-200 flex flex-col justify-between gap-3 transition-all group"
          >
            <FolderKanban className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
            <div>
              <span className="font-semibold block text-white">Portofolio</span>
              <span className="text-[10px] text-zinc-400">Karya & Video</span>
            </div>
          </Link>

          <Link
            to="/admin/services"
            className="p-3.5 rounded bg-[#18181D] hover:bg-[#202026] border border-zinc-800 hover:border-emerald-500/50 text-zinc-200 flex flex-col justify-between gap-3 transition-all group"
          >
            <Package className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div>
              <span className="font-semibold block text-white">Layanan & Harga</span>
              <span className="text-[10px] text-zinc-400">Paket Wisuda dll</span>
            </div>
          </Link>

          <Link
            to="/admin/brand"
            className="p-3.5 rounded bg-[#18181D] hover:bg-[#202026] border border-zinc-800 hover:border-[#C5A880]/50 text-zinc-200 flex flex-col justify-between gap-3 transition-all group"
          >
            <Palette className="w-5 h-5 text-[#C5A880] group-hover:scale-110 transition-transform" />
            <div>
              <span className="font-semibold block text-white">Brand & Logo</span>
              <span className="text-[10px] text-zinc-400">Tipografi & Favicon</span>
            </div>
          </Link>

          <Link
            to="/admin/media"
            className="p-3.5 rounded bg-[#18181D] hover:bg-[#202026] border border-zinc-800 hover:border-purple-500/50 text-zinc-200 flex flex-col justify-between gap-3 transition-all group"
          >
            <Image className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <div>
              <span className="font-semibold block text-white">Media Library</span>
              <span className="text-[10px] text-zinc-400">Foto & Video</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
