import React, { useState, useEffect } from 'react';
import { Palette, Upload, Image, Check, RefreshCw, Trash2, Link2, ExternalLink } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { api } from '../../lib/api';
import { normalizeMediaUrl } from '../../lib/mediaUtils';

export const BrandIdentityManager: React.FC = () => {
  const { settings, refreshSiteData, updateSettings } = useSite();

  const [form, setForm] = useState({
    brand_name: '',
    tagline: '',
    logo_text: '',
    logo_subtitle: '',
    logo_initials: '',
    logo_style: 'combined',
    logo_primary: '',
    logo_light: '',
    logo_dark: '',
    logo_monogram: '',
    favicon_url: '',
    og_image: '',
    primary_color: '#C5A880',
    bg_color: '#0C0C0D',
    accent_color: '#E2D2BC',
    heading_font: 'Cormorant Garamond',
    body_font: 'Plus Jakarta Sans',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (settings) {
      setForm({
        brand_name: settings.brand_name || 'AF Frame',
        tagline: settings.tagline || 'Capturing Meaningful Moments.',
        logo_text: settings.logo_text || settings.brand_name || 'AF FRAME',
        logo_subtitle: settings.logo_subtitle || settings.tagline || 'Photography & Cinematic Production',
        logo_initials: settings.logo_initials || 'AF',
        logo_style: settings.logo_style || 'combined',
        logo_primary: settings.logo_primary || '',
        logo_light: settings.logo_light || '',
        logo_dark: settings.logo_dark || '',
        logo_monogram: settings.logo_monogram || '',
        favicon_url: settings.favicon_url || '/favicon.svg',
        og_image: settings.og_image || '',
        primary_color: settings.primary_color || '#C5A880',
        bg_color: settings.bg_color || '#0C0C0D',
        accent_color: settings.accent_color || '#E2D2BC',
        heading_font: settings.heading_font || 'Cormorant Garamond',
        body_font: settings.body_font || 'Plus Jakarta Sans',
      });
    }
  }, [settings]);

  const handleChange = (key: string, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await api.uploadFiles([file], 'brand');
      if (res.assets && res.assets[0]) {
        handleChange(key, res.assets[0].url);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah logo');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      await updateSettings(form);
      setSuccessMsg('Pengaturan identitas brand & visual berhasil disimpan!');
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshSiteData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-light">
            Brand Identity & Media Visual
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Kelola logo, palet warna, tipografi, dan identitas visual AF Frame secara terpusat.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Logo Management */}
        <div className="p-6 bg-[#121215] border border-[#24242A] rounded-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-2">
            <div>
              <h2 className="font-serif text-lg text-white font-medium">
                1. Pengelolaan Logo, Teks Tipografi & Monogram
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Atur gaya logo, ubah teks nama brand, sub-judul keterangan, inisial lambang, serta unggah berkas logo gambar.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 bg-[#18181D] text-[#C5A880] border border-zinc-800 rounded self-start sm:self-auto">
              Gaya Aktif: {form.logo_style}
            </span>
          </div>

          {/* Real-Time Live Preview of Logo */}
          <div className="p-5 rounded border border-[#C5A880]/30 bg-[#0C0C0D] space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-mono font-semibold">
                Pratinjau Langsung Logo (Header & Footer)
              </span>
              <span className="text-[10px] text-zinc-500 font-sans">
                Berubah seketika saat Anda mengetik
              </span>
            </div>

            <div className="p-4 bg-[#111114] border border-white/10 rounded flex items-center justify-between flex-wrap gap-4">
              {/* Header preview */}
              <div className="flex items-center gap-3">
                {form.logo_style === 'image_only' && (form.logo_primary || form.logo_light) ? (
                  <img
                    src={normalizeMediaUrl(form.logo_primary || form.logo_light)}
                    alt="Logo Preview"
                    className="h-10 w-auto object-contain"
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm border border-[#C5A880]/60 flex items-center justify-center bg-[#131316] shadow-sm overflow-hidden shrink-0">
                      {form.logo_style === 'combined' && (form.logo_monogram || form.logo_primary || form.logo_light) ? (
                        <img
                          src={normalizeMediaUrl(form.logo_monogram || form.logo_primary || form.logo_light)}
                          alt="Monogram"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <span className="font-serif text-lg font-bold tracking-wider text-[#F8F6F0]">
                          {form.logo_initials || 'AF'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-serif text-2xl tracking-[0.2em] font-bold text-[#F8F6F0] leading-none">
                        {form.logo_text || form.brand_name || 'AF FRAME'}
                      </span>
                      <span className="text-[9px] uppercase tracking-[0.28em] text-[#C5A880] font-sans mt-1 font-medium">
                        {form.logo_subtitle || form.tagline || 'Photography & Cinematic Production'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tag note */}
              <div className="text-right text-[10px] text-zinc-500 font-mono">
                <span>Tampilan Header Glass Publik</span>
              </div>
            </div>
          </div>

          {/* Logo Style Selector */}
          <div>
            <label className="text-zinc-300 block mb-2 font-semibold text-xs">Pilih Gaya Tampilan Logo:</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <button
                type="button"
                onClick={() => handleChange('logo_style', 'combined')}
                className={`p-3.5 rounded border text-left transition-all cursor-pointer ${
                  form.logo_style === 'combined'
                    ? 'border-[#C5A880] bg-[#C5A880]/10 text-white'
                    : 'border-zinc-800 bg-[#16161B] text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
                  <span>🌟 Kombinasi Mewah</span>
                  {form.logo_style === 'combined' && <span className="text-[10px] text-[#C5A880] font-mono">(Aktif)</span>}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Ikon/Monogram di kiri + Teks Nama Brand & Sub-judul Emas di kanan. Paling elegan & profesional.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleChange('logo_style', 'text_emblem')}
                className={`p-3.5 rounded border text-left transition-all cursor-pointer ${
                  form.logo_style === 'text_emblem'
                    ? 'border-[#C5A880] bg-[#C5A880]/10 text-white'
                    : 'border-zinc-800 bg-[#16161B] text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
                  <span>🏛️ Emblem Tipografi</span>
                  {form.logo_style === 'text_emblem' && <span className="text-[10px] text-[#C5A880] font-mono">(Aktif)</span>}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Kotak inisial emas kustom + Teks Nama Brand & Sub-judul Emas tanpa gambar luar.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleChange('logo_style', 'image_only')}
                className={`p-3.5 rounded border text-left transition-all cursor-pointer ${
                  form.logo_style === 'image_only'
                    ? 'border-[#C5A880] bg-[#C5A880]/10 text-white'
                    : 'border-zinc-800 bg-[#16161B] text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
                  <span>🖼️ Hanya Gambar Logo</span>
                  {form.logo_style === 'image_only' && <span className="text-[10px] text-[#C5A880] font-mono">(Aktif)</span>}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Menampilkan berkas gambar logo penuh yang diunggah tanpa teks samping.
                </p>
              </button>
            </div>
          </div>

          {/* Logo Text Customization Fields */}
          <div className="p-4 bg-[#16161A] border border-zinc-800 rounded space-y-4">
            <span className="text-xs font-semibold text-[#C5A880] uppercase tracking-wider block">
              ✏️ Kustomisasi Teks Pada Logo
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
              <div className="sm:col-span-3">
                <label className="text-zinc-400 block mb-1">Huruf Inisial Lambang</label>
                <input
                  type="text"
                  maxLength={3}
                  value={form.logo_initials}
                  onChange={e => handleChange('logo_initials', e.target.value.toUpperCase())}
                  placeholder="AF"
                  className="w-full px-3 py-2 bg-[#121215] border border-zinc-700 rounded text-zinc-200 font-serif font-bold text-base tracking-wider uppercase text-center"
                />
                <p className="text-[10px] text-zinc-500 mt-1">2-3 huruf di kotak monogram</p>
              </div>

              <div className="sm:col-span-5">
                <label className="text-zinc-400 block mb-1">Teks Utama Logo (Nama Brand)</label>
                <input
                  type="text"
                  value={form.logo_text}
                  onChange={e => {
                    handleChange('logo_text', e.target.value);
                    handleChange('brand_name', e.target.value);
                  }}
                  placeholder="AF FRAME"
                  className="w-full px-3 py-2 bg-[#121215] border border-zinc-700 rounded text-zinc-200 font-serif font-bold text-base tracking-widest"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Judul utama dengan font serif emas</p>
              </div>

              <div className="sm:col-span-4">
                <label className="text-zinc-400 block mb-1">Sub-Teks Keterangan di Bawah Logo</label>
                <input
                  type="text"
                  value={form.logo_subtitle}
                  onChange={e => handleChange('logo_subtitle', e.target.value)}
                  placeholder="PHOTOGRAPHY & CINEMATIC PRODUCTION"
                  className="w-full px-3 py-2 bg-[#121215] border border-zinc-700 rounded text-zinc-200 text-xs uppercase tracking-wider font-sans"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Keterangan spesialisasi / tagline</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs pt-2">
            {/* Primary Logo */}
            <div className="space-y-3 p-4 bg-[#18181D] border border-zinc-800 rounded flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-zinc-300 block">Logo Utama (Header & Brand)</span>
                  {(form.logo_primary || form.logo_light) && (
                    <button
                      type="button"
                      onClick={() => {
                        handleChange('logo_primary', '');
                        handleChange('logo_light', '');
                      }}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px]"
                      title="Hapus Logo Utama (Kembali ke Teks Emas)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
                <div className="aspect-[3/1] bg-black/60 border border-dashed border-zinc-700 rounded flex items-center justify-center p-2 overflow-hidden mb-3">
                  {form.logo_primary || form.logo_light ? (
                    <img src={normalizeMediaUrl(form.logo_primary || form.logo_light)} alt="Primary Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-[#C5A880] font-serif text-base tracking-wider">AF FRAME (Teks Gold)</span>
                  )}
                </div>
                <label className="text-zinc-400 block mb-1 font-mono text-[11px]">Tautan / URL Logo:</label>
                <input
                  type="text"
                  placeholder="https://... atau paste link gambar"
                  value={form.logo_primary || form.logo_light}
                  onChange={e => {
                    const norm = normalizeMediaUrl(e.target.value);
                    handleChange('logo_primary', norm);
                    handleChange('logo_light', norm);
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#121215] border border-zinc-700 rounded text-zinc-200 text-xs mb-2"
                />
              </div>
              <label className="block text-center py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded cursor-pointer transition-colors font-medium">
                <span>📁 Unggah Berkas Logo Baru</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const res = await api.uploadFiles([file], 'brand');
                      if (res.assets && res.assets[0]) {
                        handleChange('logo_primary', res.assets[0].url);
                        handleChange('logo_light', res.assets[0].url);
                      }
                    } catch (err: any) {
                      alert(err.message || 'Gagal mengunggah logo');
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Monogram / Compact Logo */}
            <div className="space-y-3 p-4 bg-[#18181D] border border-zinc-800 rounded flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-zinc-300 block">Monogram / Compact Mark</span>
                  {form.logo_monogram && (
                    <button
                      type="button"
                      onClick={() => handleChange('logo_monogram', '')}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px]"
                      title="Hapus Monogram (Kembali ke Kotak AF)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
                <div className="aspect-[3/1] bg-black/60 border border-dashed border-zinc-700 rounded flex items-center justify-center p-2 overflow-hidden mb-3">
                  {form.logo_monogram ? (
                    <img src={normalizeMediaUrl(form.logo_monogram)} alt="Monogram" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="w-10 h-10 border border-[#C5A880] flex items-center justify-center font-serif text-lg font-bold text-[#F8F6F0]">AF</div>
                  )}
                </div>
                <label className="text-zinc-400 block mb-1 font-mono text-[11px]">Tautan / URL Monogram:</label>
                <input
                  type="text"
                  placeholder="https://... atau paste link"
                  value={form.logo_monogram}
                  onChange={e => handleChange('logo_monogram', normalizeMediaUrl(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#121215] border border-zinc-700 rounded text-zinc-200 text-xs mb-2"
                />
              </div>
              <label className="block text-center py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded cursor-pointer transition-colors font-medium">
                <span>📁 Unggah Berkas Monogram</span>
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'logo_monogram')} className="hidden" />
              </label>
            </div>

            {/* Favicon & OG Image */}
            <div className="space-y-3 p-4 bg-[#18181D] border border-zinc-800 rounded flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-zinc-300 block">Social Share Card (OG Image)</span>
                  {form.og_image && (
                    <button
                      type="button"
                      onClick={() => handleChange('og_image', '')}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px]"
                      title="Hapus OG Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
                <div className="aspect-[3/1] bg-black/60 border border-dashed border-zinc-700 rounded flex items-center justify-center p-2 overflow-hidden mb-3">
                  {form.og_image ? (
                    <img src={normalizeMediaUrl(form.og_image)} alt="OG Image" className="max-h-full max-w-full object-cover" />
                  ) : (
                    <span className="text-zinc-600 text-xs">Preview Social Card</span>
                  )}
                </div>
                <label className="text-zinc-400 block mb-1 font-mono text-[11px]">Tautan / URL Gambar OG:</label>
                <input
                  type="text"
                  placeholder="https://... atau paste link"
                  value={form.og_image}
                  onChange={e => handleChange('og_image', normalizeMediaUrl(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#121215] border border-zinc-700 rounded text-zinc-200 text-xs mb-2"
                />
              </div>
              <label className="block text-center py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded cursor-pointer transition-colors font-medium">
                <span>📁 Unggah Berkas Gambar OG</span>
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'og_image')} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Colors & Typography Design Tokens */}
        <div className="p-6 bg-[#121215] border border-[#24242A] rounded-sm space-y-6">
          <h2 className="font-serif text-lg text-white font-medium border-b border-zinc-800 pb-3">
            2. Palet Warna & Tipografi Editorial
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            {/* Primary Accent Color */}
            <div>
              <label className="text-zinc-400 block mb-2 font-medium">Warna Aksen Utama (Gold / Ivory)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={e => handleChange('primary_color', e.target.value)}
                  className="w-10 h-10 rounded border border-zinc-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={form.primary_color}
                  onChange={e => handleChange('primary_color', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="text-zinc-400 block mb-2 font-medium">Warna Latar Belakang (Dark)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.bg_color}
                  onChange={e => handleChange('bg_color', e.target.value)}
                  className="w-10 h-10 rounded border border-zinc-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={form.bg_color}
                  onChange={e => handleChange('bg_color', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>
            </div>

            {/* Heading Font */}
            <div>
              <label className="text-zinc-400 block mb-2 font-medium">Font Judul (Editorial Serif)</label>
              <select
                value={form.heading_font}
                onChange={e => handleChange('heading_font', e.target.value)}
                className="w-full px-3 py-2.5 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
              >
                <option value="Cormorant Garamond">Cormorant Garamond (Default Signature)</option>
                <option value="Playfair Display">Playfair Display</option>
                <option value="Cinzel">Cinzel</option>
                <option value="Bodoni Moda">Bodoni Moda</option>
              </select>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-6 rounded border border-zinc-800 bg-[#0C0C0D] space-y-3">
            <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-mono">
              Pratinjau Desain Token
            </span>
            <div className="space-y-1">
              <h3 className="font-serif text-3xl font-light text-[#F8F6F0]">
                Capturing Meaningful Moments.
              </h3>
              <p className="text-xs text-zinc-400">
                AF Frame Photography & Cinematic Creative Studio — Lamongan, Gresik, Surabaya.
              </p>
            </div>
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider bg-[#C5A880] text-[#0C0C0D]"
              >
                Tombol Utama
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-sm text-xs font-medium uppercase tracking-wider border border-zinc-700 text-zinc-300"
              >
                Tombol Sekunder
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-sm bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] font-semibold text-xs uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan Identitas Brand'}
          </button>
        </div>

      </form>
    </div>
  );
};
