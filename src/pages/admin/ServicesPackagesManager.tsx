import React, { useState, useEffect } from 'react';
import {
  Package, Plus, Edit3, Trash2, Copy, Eye, EyeOff, Star,
  Check, X, Clock, DollarSign, Layers
} from 'lucide-react';
import { Service, ServicePackage } from '../../types';
import { api } from '../../lib/api';

export const ServicesPackagesManager: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Add / Edit Package Modal
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<number | null>(null);
  const [pkgServiceId, setPkgServiceId] = useState<number | ''>('');
  const [pkgName, setPkgName] = useState('');
  const [regularPrice, setRegularPrice] = useState<number>(0);
  const [promoPrice, setPromoPrice] = useState<number>(0);
  const [duration, setDuration] = useState('');
  const [isQuotation, setIsQuotation] = useState(false);
  const [isPriceHidden, setIsPriceHidden] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [deliverablesText, setDeliverablesText] = useState('');
  const [isSavingPkg, setIsSavingPkg] = useState(false);

  // Add / Edit Service Category Modal
  const [showSvcModal, setShowSvcModal] = useState(false);
  const [editingSvcId, setEditingSvcId] = useState<number | null>(null);
  const [svcName, setSvcName] = useState('');
  const [svcDesc, setSvcDesc] = useState('');
  const [svcIcon, setSvcIcon] = useState('Camera');

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ services: Service[] }>('/services', { all: true });
      setServices(res.services || []);
      if (!selectedServiceId && res.services && res.services.length > 0) {
        setSelectedServiceId(res.services[0].id);
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const currentService = services.find(s => s.id === selectedServiceId) || services[0];

  // Package Modal Openers
  const openAddPackage = () => {
    setEditingPkgId(null);
    setPkgServiceId(selectedServiceId || (services[0]?.id || ''));
    setPkgName('PLATINUM');
    setRegularPrice(500000);
    setPromoPrice(400000);
    setDuration('2 jam');
    setIsQuotation(false);
    setIsPriceHidden(false);
    setIsFeatured(false);
    setIsPublished(true);
    setDeliverablesText('Durasi 2 jam\n25 Foto edited\nSemua file dikirim via Google Drive\n1 video cinematic 30-60 detik');
    setShowPkgModal(true);
  };

  const openEditPackage = (pkg: ServicePackage) => {
    setEditingPkgId(pkg.id);
    setPkgServiceId(pkg.service_id);
    setPkgName(pkg.package_name);
    setRegularPrice(pkg.regular_price);
    setPromoPrice(pkg.promotional_price);
    setDuration(pkg.duration || '');
    setIsQuotation(pkg.is_quotation_based === 1);
    setIsPriceHidden(pkg.is_price_hidden === 1);
    setIsFeatured(pkg.is_featured === 1);
    setIsPublished(pkg.is_published === 1);
    setDeliverablesText(Array.isArray(pkg.deliverables) ? pkg.deliverables.join('\n') : '');
    setShowPkgModal(true);
  };

  const handleDuplicate = async (pkg: ServicePackage) => {
    try {
      await api.post(`/services/packages/${pkg.id}/duplicate`);
      fetchServices();
    } catch (err: any) {
      alert(err.message || 'Gagal menduplikasi paket');
    }
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim() || !pkgServiceId) return;

    try {
      setIsSavingPkg(true);
      const deliverablesArray = deliverablesText.split('\n').map(s => s.trim()).filter(Boolean);

      const payload = {
        service_id: pkgServiceId,
        package_name: pkgName,
        regular_price: Number(regularPrice),
        promotional_price: Number(promoPrice),
        duration,
        is_quotation_based: isQuotation ? 1 : 0,
        is_price_hidden: isPriceHidden ? 1 : 0,
        is_featured: isFeatured ? 1 : 0,
        is_published: isPublished ? 1 : 0,
        deliverables: deliverablesArray
      };

      if (editingPkgId) {
        await api.put(`/services/packages/${editingPkgId}`, payload);
      } else {
        await api.post('/services/packages', payload);
      }

      setShowPkgModal(false);
      fetchServices();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan paket.');
    } finally {
      setIsSavingPkg(false);
    }
  };

  const handleDeletePackage = async (pkg: ServicePackage) => {
    if (window.confirm(`Hapus paket "${pkg.package_name}"?`)) {
      try {
        await api.delete(`/services/packages/${pkg.id}`);
        fetchServices();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus paket');
      }
    }
  };

  const togglePackagePublish = async (pkg: ServicePackage) => {
    try {
      await api.put(`/services/packages/${pkg.id}`, { is_published: pkg.is_published ? 0 : 1 });
      fetchServices();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah visibilitas');
    }
  };

  const togglePackageFeatured = async (pkg: ServicePackage) => {
    try {
      await api.put(`/services/packages/${pkg.id}`, { is_featured: pkg.is_featured ? 0 : 1 });
      fetchServices();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah favorit');
    }
  };

  // Service Category Modals
  const openAddService = () => {
    setEditingSvcId(null);
    setSvcName('');
    setSvcDesc('');
    setSvcIcon('Camera');
    setShowSvcModal(true);
  };

  const openEditService = (s: Service) => {
    setEditingSvcId(s.id);
    setSvcName(s.name);
    setSvcDesc(s.short_description || '');
    setSvcIcon(s.icon_name || 'Camera');
    setShowSvcModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svcName.trim()) return;

    try {
      if (editingSvcId) {
        await api.put(`/services/${editingSvcId}`, {
          name: svcName,
          short_description: svcDesc,
          icon_name: svcIcon
        });
      } else {
        await api.post('/services', {
          name: svcName,
          short_description: svcDesc,
          icon_name: svcIcon
        });
      }
      setShowSvcModal(false);
      fetchServices();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan kategori layanan');
    }
  };

  const handleDeleteService = async (s: Service) => {
    if (window.confirm(`Hapus seluruh kategori "${s.name}" beserta SEMUA paket di dalamnya?`)) {
      try {
        await api.delete(`/services/${s.id}`);
        fetchServices();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus kategori');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-light">
            Pengelolaan Layanan & Paket
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Ubah harga normal & promo katalog resmi, durasi, deliverable Google Drive, serta fitur duplikasi paket.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={openAddService}
            className="px-3 py-2 bg-[#1A1A20] hover:bg-[#25252D] text-zinc-300 border border-zinc-700 rounded-sm text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer"
          >
            + Kategori Layanan
          </button>
          <button
            onClick={openAddPackage}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Paket Baru</span>
          </button>
        </div>
      </div>

      {/* Service Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {services.map(svc => (
          <div key={svc.id} className="relative group shrink-0">
            <button
              onClick={() => setSelectedServiceId(svc.id)}
              className={`px-4 py-2 rounded-sm text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                selectedServiceId === svc.id
                  ? 'bg-[#C5A880] text-[#0C0C0D] shadow-md'
                  : 'bg-[#141418] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <span>{svc.name.replace(' Photography & Videography', '').replace(' Documentation Profesional', '')}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-black/20 rounded font-mono">
                {svc.packages?.length || 0}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* Current Category Info Banner */}
      {currentService && (
        <div className="p-4 bg-[#121215] border border-[#24242A] rounded-sm flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-white">{currentService.name}</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{currentService.short_description || 'Kategori layanan resmi AF Frame.'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEditService(currentService)}
              className="p-1.5 text-zinc-400 hover:text-white"
              title="Edit Kategori Ini"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteService(currentService)}
              className="p-1.5 text-zinc-600 hover:text-red-400"
              title="Hapus Kategori"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Package Cards for Current Service */}
      {currentService && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentService.packages?.map(pkg => (
            <div
              key={pkg.id}
              className={`p-6 rounded-sm bg-[#121215] border flex flex-col justify-between transition-all ${
                pkg.is_featured ? 'border-[#C5A880] shadow-lg shadow-[#C5A880]/10' : 'border-[#24242A]'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-2xl font-light text-white tracking-wide">
                      {pkg.package_name}
                    </span>
                    {pkg.duration && (
                      <span className="text-[10px] bg-[#1A1A20] text-zinc-400 px-2 py-0.5 rounded font-mono">
                        {pkg.duration}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => togglePackageFeatured(pkg)}
                    className={`p-1 ${pkg.is_featured ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'}`}
                    title={pkg.is_featured ? 'Paket Favorit' : 'Tandai Favorit'}
                  >
                    <Star className={`w-4 h-4 ${pkg.is_featured ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Pricing Display */}
                <div className="py-3 border-y border-zinc-800 my-3">
                  {pkg.is_quotation_based ? (
                    <span className="font-serif text-lg text-white">By Quotation</span>
                  ) : pkg.is_price_hidden ? (
                    <span className="text-xs text-zinc-400 italic">Harga Tersembunyi</span>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-2xl text-[#E2D2BC] font-semibold">
                        Rp {pkg.promotional_price > 0 ? pkg.promotional_price.toLocaleString('id-ID') : pkg.regular_price.toLocaleString('id-ID')}
                      </span>
                      {pkg.promotional_price > 0 && pkg.promotional_price < pkg.regular_price && (
                        <span className="text-xs text-zinc-500 line-through">
                          Rp {pkg.regular_price.toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {pkg.promotional_price > 0 ? 'Harga Promo Aktif' : 'Harga Standar'}
                  </p>
                </div>

                {/* Deliverables */}
                <div className="space-y-1.5 mb-6 text-xs text-zinc-300">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block mb-1">
                    Output & Deliverables:
                  </span>
                  {pkg.deliverables?.map((d, dIdx) => (
                    <div key={dIdx} className="flex items-start gap-2 text-[11px] text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] shrink-0 mt-1.5" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => togglePackagePublish(pkg)}
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                    pkg.is_published ? 'bg-emerald-950 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {pkg.is_published ? 'Publik' : 'Draft'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDuplicate(pkg)}
                    className="p-1 text-zinc-400 hover:text-white"
                    title="Duplikasi Paket Ini"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEditPackage(pkg)}
                    className="p-1 text-zinc-400 hover:text-[#C5A880]"
                    title="Edit Paket"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePackage(pkg)}
                    className="p-1 text-zinc-600 hover:text-red-400"
                    title="Hapus Paket"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Package Modal */}
      {showPkgModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setShowPkgModal(false)}
        >
          <div
            className="bg-[#141418] border border-zinc-800 max-w-2xl w-full rounded-sm p-6 space-y-4 my-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-serif text-lg text-white">
                {editingPkgId ? 'Edit Paket Layanan' : 'Tambah Paket Baru'}
              </h3>
              <button onClick={() => setShowPkgModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 block mb-1">Kategori Layanan Induk</label>
                  <select
                    value={pkgServiceId}
                    onChange={e => setPkgServiceId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Nama Paket</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: GOLD / DIAMOND / STANDART"
                    value={pkgName}
                    onChange={e => setPkgName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                </div>
              </div>

              {/* Pricing & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-zinc-400 block mb-1">Harga Normal (Rp)</label>
                  <input
                    type="number"
                    value={regularPrice}
                    onChange={e => setRegularPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Harga Promo (Rp)</label>
                  <input
                    type="number"
                    value={promoPrice}
                    onChange={e => setPromoPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Durasi / Standby</label>
                  <input
                    type="text"
                    placeholder="Contoh: 1 jam / 8 jam standby"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                </div>
              </div>

              {/* Deliverables Textarea */}
              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">
                  Daftar Deliverables & Fasilitas (1 butir per baris)
                </label>
                <textarea
                  rows={5}
                  value={deliverablesText}
                  onChange={e => setDeliverablesText(e.target.value)}
                  placeholder="Contoh:&#10;20 foto terbaik edited&#10;Free all documentation files&#10;Bonus 1 video cinematic 30-90s&#10;Google Drive delivery"
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200 font-mono text-xs leading-relaxed"
                />
              </div>

              {/* Switches */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-zinc-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={e => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C5A880]"
                  />
                  <span>Favorit</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={e => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C5A880]"
                  />
                  <span>Publik</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isQuotation}
                    onChange={e => setIsQuotation(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C5A880]"
                  />
                  <span>By Quotation</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPriceHidden}
                    onChange={e => setIsPriceHidden(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C5A880]"
                  />
                  <span>Sembunyikan Harga</span>
                </label>
              </div>

              {/* Submit */}
              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowPkgModal(false)}
                  className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingPkg}
                  className="px-5 py-2 bg-[#C5A880] text-[#0C0C0D] font-semibold rounded text-xs uppercase"
                >
                  {isSavingPkg ? 'Menyimpan...' : 'Simpan Paket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Category Modal */}
      {showSvcModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowSvcModal(false)}
        >
          <div
            className="bg-[#141418] border border-zinc-800 max-w-md w-full rounded-sm p-6 space-y-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-serif text-lg text-white">
                {editingSvcId ? 'Edit Kategori Layanan' : 'Tambah Kategori Layanan Baru'}
              </h3>
              <button onClick={() => setShowSvcModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Nama Layanan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Graduation Photography & Videography"
                  value={svcName}
                  onChange={e => setSvcName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={svcDesc}
                  onChange={e => setSvcDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSvcModal(false)}
                  className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C5A880] text-[#0C0C0D] font-semibold rounded text-xs uppercase"
                >
                  Simpan Layanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
