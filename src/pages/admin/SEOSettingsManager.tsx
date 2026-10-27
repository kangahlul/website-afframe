import React, { useState, useEffect } from 'react';
import { Search, Check, Globe, Share2, Upload, Trash2 } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { api } from '../../lib/api';
import { normalizeMediaUrl } from '../../lib/mediaUtils';

export const SEOSettingsManager: React.FC = () => {
  const { settings, updateSettings, refreshSiteData } = useSite();

  const [form, setForm] = useState({
    seo_title: '',
    seo_description: '',
    og_image: '',
    canonical_url: 'https://afframe.com',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (settings) {
      setForm({
        seo_title: settings.seo_title || 'AFFRAME — Capturing Meaningful Moments | Photography & Cinematic Production',
        seo_description: settings.seo_description || 'Layanan dokumentasi foto & cinematic video profesional di Lamongan, Gresik, Surabaya.',
        og_image: settings.og_image || '',
        canonical_url: settings.canonical_url || 'https://afframe.com',
      });
    }
  }, [settings]);

  const handleChange = (key: string, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const handleUploadOg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadFiles([file], 'brand');
      if (res.assets && res.assets[0]) {
        handleChange('og_image', res.assets[0].url);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah foto OG');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateSettings(form);
      setSuccessMsg('Pengaturan SEO & Open Graph berhasil disimpan!');
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshSiteData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengaturan SEO.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-light">
            Pengaturan SEO & Metadata Sosial
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Optimalkan visibilitas pencarian Google, judul tab browser, serta thumbnail kartu share WhatsApp & Instagram.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Search Engine Optimization */}
        <div className="p-6 bg-[#121215] border border-[#24242A] rounded-sm space-y-4">
          <h2 className="font-serif text-base text-white font-semibold border-b border-zinc-800 pb-2">
            Metadata Mesin Pencari (Google SERP)
          </h2>

          <div>
            <label className="text-zinc-400 block mb-1 font-semibold">
              SEO Meta Title ({form.seo_title.length} karakter)
            </label>
            <input
              type="text"
              required
              value={form.seo_title}
              onChange={e => handleChange('seo_title', e.target.value)}
              className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
            />
            <p className="text-[10px] text-zinc-500 mt-0.5">Disarankan antara 50-60 karakter untuk hasil Google terbaik.</p>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1 font-semibold">
              Meta Description ({form.seo_description.length} karakter)
            </label>
            <textarea
              rows={3}
              required
              value={form.seo_description}
              onChange={e => handleChange('seo_description', e.target.value)}
              className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200 font-sans"
            />
            <p className="text-[10px] text-zinc-500 mt-0.5">Disarankan antara 120-160 karakter.</p>
          </div>

          {/* Google SERP Live Preview */}
          <div className="p-4 bg-[#0C0C0D] border border-zinc-800 rounded mt-4 space-y-1">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">
              Pratinjau Snippet Google
            </span>
            <div className="font-sans text-xs text-blue-400 hover:underline cursor-pointer truncate">
              {form.seo_title}
            </div>
            <div className="font-sans text-[11px] text-emerald-500 truncate">
              https://afframe.com › indonesia
            </div>
            <p className="font-sans text-xs text-zinc-400 line-clamp-2">
              {form.seo_description}
            </p>
          </div>
        </div>

        {/* Open Graph / Social Sharing */}
        <div className="p-6 bg-[#121215] border border-[#24242A] rounded-sm space-y-4">
          <h2 className="font-serif text-base text-white font-semibold border-b border-zinc-800 pb-2">
            Open Graph Media Card (WhatsApp / Facebook / Twitter)
          </h2>

          <div>
            <label className="text-zinc-400 block mb-1 font-semibold">Gambar Pratinjau Tautan (OG Image 1200x630)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={form.og_image}
                onChange={e => handleChange('og_image', normalizeMediaUrl(e.target.value))}
                placeholder="URL Gambar Beresolusi Tinggi"
                className="flex-1 px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200 font-mono text-xs"
              />
              <label className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded cursor-pointer shrink-0 flex items-center gap-1.5 transition-colors">
                <Upload className="w-4 h-4" />
                <span>Unggah</span>
                <input type="file" accept="image/*" onChange={handleUploadOg} className="hidden" />
              </label>
              {form.og_image && (
                <button
                  type="button"
                  onClick={() => handleChange('og_image', '')}
                  className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 rounded transition-colors"
                  title="Hapus Gambar OG"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {form.og_image && (
              <div className="relative aspect-[1.91/1] w-72 bg-black rounded overflow-hidden border border-zinc-800 group mt-2">
                <img src={form.og_image} alt="OG Card" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleChange('og_image', '')}
                    className="p-1 bg-black/80 text-red-400 hover:text-red-300 rounded-full"
                    title="Hapus"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#C5A880] text-[#0C0C0D] font-semibold rounded text-xs uppercase tracking-wider"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan SEO'}
          </button>
        </div>
      </form>
    </div>
  );
};
