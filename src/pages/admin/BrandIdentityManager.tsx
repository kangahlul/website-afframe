import React, { useState, useEffect } from 'react';
import { Palette, Upload, Image, Check, RefreshCw } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { api } from '../../lib/api';

export const BrandIdentityManager: React.FC = () => {
  const { settings, refreshSiteData, updateSettings } = useSite();

  const [form, setForm] = useState({
    brand_name: '',
    tagline: '',
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
          <h2 className="font-serif text-lg text-white font-medium border-b border-zinc-800 pb-3">
            1. Pengelolaan Logo & Monogram
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Primary Logo */}
            <div className="space-y-3 p-4 bg-[#18181D] border border-zinc-800 rounded">
              <span className="font-semibold text-zinc-300 block">Logo Utama (Header & Brand)</span>
              <div className="aspect-[3/1] bg-black/60 border border-dashed border-zinc-700 rounded flex items-center justify-center p-2 overflow-hidden">
                {form.logo_primary || form.logo_light ? (
                  <img src={form.logo_primary || form.logo_light} alt="Primary Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[#C5A880] font-serif text-base tracking-wider">AF FRAME (Gold)</span>
                )}
              </div>
              <input
                type="text"
                placeholder="URL Logo atau unggah berkas"
                value={form.logo_primary || form.logo_light}
                onChange={e => {
                  handleChange('logo_primary', e.target.value);
                  handleChange('logo_light', e.target.value);
                }}
                className="w-full px-2.5 py-1.5 bg-[#121215] border border-zinc-700 rounded text-zinc-200 text-xs"
              />
              <label className="block text-center py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded cursor-pointer transition-colors">
                <span>Pilih Berkas Logo</span>
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
            <div className="space-y-3 p-4 bg-[#18181D] border border-zinc-800 rounded">
              <span className="font-semibold text-zinc-300 block">Monogram / Compact Mark</span>
              <div className="aspect-[3/1] bg-black/60 border border-dashed border-zinc-700 rounded flex items-center justify-center p-2 overflow-hidden">
                {form.logo_monogram ? (
                  <img src={form.logo_monogram} alt="Monogram" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="w-10 h-10 border border-[#C5A880] flex items-center justify-center font-serif text-lg font-bold text-[#F8F6F0]">AF</div>
                )}
              </div>
              <input
                type="text"
                placeholder="URL Monogram"
                value={form.logo_monogram}
                onChange={e => handleChange('logo_monogram', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#121215] border border-zinc-700 rounded text-zinc-200 text-xs"
              />
              <label className="block text-center py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded cursor-pointer transition-colors">
                <span>Pilih Berkas Monogram</span>
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'logo_monogram')} className="hidden" />
              </label>
            </div>

            {/* Favicon & OG Image */}
            <div className="space-y-3 p-4 bg-[#18181D] border border-zinc-800 rounded">
              <span className="font-semibold text-zinc-300 block">Favicon & Social Share (OG)</span>
              <div className="aspect-[3/1] bg-black/60 border border-dashed border-zinc-700 rounded flex items-center justify-center p-2 overflow-hidden">
                {form.og_image ? (
                  <img src={form.og_image} alt="OG Image" className="max-h-full max-w-full object-cover" />
                ) : (
                  <span className="text-zinc-600 text-xs">Preview Social Card</span>
                )}
              </div>
              <input
                type="text"
                placeholder="URL OG Image"
                value={form.og_image}
                onChange={e => handleChange('og_image', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#121215] border border-zinc-700 rounded text-zinc-200 text-xs"
              />
              <label className="block text-center py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded cursor-pointer transition-colors">
                <span>Pilih Berkas Gambar OG</span>
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
