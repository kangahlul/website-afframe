import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban, Package, Inbox, Image, Clock, CheckCircle,
  AlertCircle, ArrowUpRight, Plus, RefreshCw, FileText
} from 'lucide-react';
import { api } from '../../lib/api';

export const DashboardOverview: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    confirmedBookings: 0,
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-light">
            Ringkasan Dashboard CMS
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Data statistik real-time dari database AF Frame.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#1A1A20] hover:bg-[#25252D] text-xs text-zinc-300 border border-zinc-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan Data</span>
          </button>
          <Link
            to="/admin/portfolio"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#C5A880] hover:bg-[#B39366] text-xs font-semibold text-[#0C0C0D] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Proyek</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* New Inquiries */}
        <div className="p-5 bg-[#121215] border border-[#24242A] rounded-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Inquiry Baru</span>
            <Inbox className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif text-white font-light">{metrics.newInquiries}</span>
            <span className="text-xs text-zinc-500">dari {metrics.totalInquiries} total</span>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <Link to="/admin/inquiries" className="text-[#C5A880] hover:underline">
              Kelola Inquiry →
            </Link>
          </div>
        </div>

        {/* Confirmed Bookings */}
        <div className="p-5 bg-[#121215] border border-[#24242A] rounded-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Booking Terkonfirmasi</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif text-emerald-300 font-light">{metrics.confirmedBookings}</span>
            <span className="text-xs text-zinc-500">deal aktif</span>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Telah DP 50%</span>
          </div>
        </div>

        {/* Published Projects */}
        <div className="p-5 bg-[#121215] border border-[#24242A] rounded-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Proyek Portofolio</span>
            <FolderKanban className="w-4 h-4 text-[#C5A880]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif text-white font-light">{metrics.publishedProjects}</span>
            <span className="text-xs text-zinc-500">terbit ({metrics.draftProjects} draft)</span>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <Link to="/admin/portfolio" className="text-[#C5A880] hover:underline">
              {metrics.totalCategories} Kategori Aktif →
            </Link>
          </div>
        </div>

        {/* Services & Packages */}
        <div className="p-5 bg-[#121215] border border-[#24242A] rounded-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Paket Layanan</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif text-white font-light">{metrics.totalPackages}</span>
            <span className="text-xs text-zinc-500">paket di {metrics.totalServices} kategori</span>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <Link to="/admin/services" className="text-[#C5A880] hover:underline">
              Edit Harga & Paket →
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Inquiries & Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Inquiries List */}
        <div className="lg:col-span-7 bg-[#121215] border border-[#24242A] rounded-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg text-white font-medium">Inquiry Klien Terbaru</h2>
              <p className="text-xs text-zinc-400">Permintaan reservasi yang masuk melalui formulir publik.</p>
            </div>
            <Link to="/admin/inquiries" className="text-xs text-[#C5A880] hover:underline">
              Lihat Semua
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-zinc-900 animate-pulse rounded" />
              ))}
            </div>
          ) : !data?.recentInquiries || data.recentInquiries.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Belum ada data inquiry masuk.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80">
              {data.recentInquiries.map((inq: any) => (
                <div key={inq.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{inq.full_name}</span>
                      <span
                        className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${
                          statusColors[inq.status] || 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {inq.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-3">
                      <span>{inq.service_name || 'Layanan Umum'}</span>
                      <span>•</span>
                      <span>Tgl Acara: {inq.event_date}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <a
                      href={`https://wa.me/${inq.whatsapp_number.replace(/^0/, '62')}?text=Halo%20${encodeURIComponent(inq.full_name)},%20kami%20dari%20AF%20Frame`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#C5A880] hover:underline"
                    >
                      <span>WhatsApp</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Projects List */}
        <div className="lg:col-span-5 bg-[#121215] border border-[#24242A] rounded-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg text-white font-medium">Proyek Terakhir Diperbarui</h2>
              <p className="text-xs text-zinc-400">Konten portofolio di website publik.</p>
            </div>
            <Link to="/admin/portfolio" className="text-xs text-[#C5A880] hover:underline">
              Kelola
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
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
                <div key={p.id} className="py-3 flex items-center gap-3">
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

      </div>

      {/* Quick Administration Shortcuts */}
      <div className="p-6 bg-[#121215] border border-[#24242A] rounded-sm space-y-4">
        <h2 className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
          Akses Cepat Pengelolaan Website
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <Link
            to="/admin/brand"
            className="p-3 rounded bg-[#18181D] hover:bg-[#202026] border border-zinc-800 text-zinc-200 flex items-center gap-2 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-[#C5A880]" />
            <span>Ganti Logo & Warna</span>
          </Link>
          <Link
            to="/admin/sections"
            className="p-3 rounded bg-[#18181D] hover:bg-[#202026] border border-zinc-800 text-zinc-200 flex items-center gap-2 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Atur Urutan Section</span>
          </Link>
          <Link
            to="/admin/services"
            className="p-3 rounded bg-[#18181D] hover:bg-[#202026] border border-zinc-800 text-zinc-200 flex items-center gap-2 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Ubah Harga Paket</span>
          </Link>
          <Link
            to="/admin/media"
            className="p-3 rounded bg-[#18181D] hover:bg-[#202026] border border-zinc-800 text-zinc-200 flex items-center gap-2 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Unggah Foto Media</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
