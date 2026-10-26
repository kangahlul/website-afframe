import React, { useState, useEffect } from 'react';
import { Settings, Check, Phone, Mail, MapPin, Globe } from 'lucide-react';
import { useSite } from '../../context/SiteContext';

export const WebsiteSettingsManager: React.FC = () => {
  const { settings, updateSettings, refreshSiteData } = useSite();

  const [form, setForm] = useState({
    brand_name: '',
    tagline: '',
    brand_description: '',
    whatsapp_number: '',
    whatsapp_url: '',
    instagram_handle: '',
    instagram_url: '',
    email: '',
    address: '',
    footer_copyright: '',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (settings) {
      setForm({
        brand_name: settings.brand_name || 'AF Frame',
        tagline: settings.tagline || 'Capturing Meaningful Moments.',
        brand_description: settings.brand_description || '',
        whatsapp_number: settings.whatsapp_number || '085755152579',
        whatsapp_url: settings.whatsapp_url || 'https://wa.me/6285755152579',
        instagram_handle: settings.instagram_handle || '@_afframe',
        instagram_url: settings.instagram_url || 'https://www.instagram.com/_afframe/',
        email: settings.email || 'afframe.production@gmail.com',
        address: settings.address || 'Lamongan, Gresik, Surabaya & Sekitarnya, Jawa Timur',
        footer_copyright: settings.footer_copyright || '© 2026 AF Frame. All rights reserved. Capturing Meaningful Moments.',
      });
    }
  }, [settings]);

  const handleChange = (key: string, val: string) => {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      // Auto compute whatsapp url if whatsapp number is changed
      if (key === 'whatsapp_number') {
        const clean = val.replace(/[^0-9]/g, '').replace(/^0/, '62');
        next.whatsapp_url = `https://wa.me/${clean}`;
      }
      if (key === 'instagram_handle') {
        const cleanHandle = val.replace(/^@/, '');
        next.instagram_url = `https://www.instagram.com/${cleanHandle}/`;
      }
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateSettings(form);
      setSuccessMsg('Pengaturan website berhasil disimpan!');
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshSiteData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengaturan.');
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
            Pengaturan Umum Website
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Atur kontak WhatsApp, Instagram resmi, alamat operasional, dan hak cipta footer.
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
        {/* Brand Information */}
        <div className="p-6 bg-[#121215] border border-[#24242A] rounded-sm space-y-4">
          <h2 className="font-serif text-base text-white font-semibold border-b border-zinc-800 pb-2">
            Identitas Brand
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 block mb-1">Nama Brand</label>
              <input
                type="text"
                required
                value={form.brand_name}
                onChange={e => handleChange('brand_name', e.target.value)}
                className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Tagline Utama</label>
              <input
                type="text"
                required
                value={form.tagline}
                onChange={e => handleChange('tagline', e.target.value)}
                className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Deskripsi Ringkas Brand</label>
            <textarea
              rows={3}
              value={form.brand_description}
              onChange={e => handleChange('brand_description', e.target.value)}
              className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="p-6 bg-[#121215] border border-[#24242A] rounded-sm space-y-4">
          <h2 className="font-serif text-base text-white font-semibold border-b border-zinc-800 pb-2">
            Kontak & Media Sosial Resmi
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 block mb-1">Nomor WhatsApp Resmi</label>
              <input
                type="text"
                required
                value={form.whatsapp_number}
                onChange={e => handleChange('whatsapp_number', e.target.value)}
                className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
              />
              <p className="text-[10px] text-zinc-500 mt-1 font-mono">URL: {form.whatsapp_url}</p>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">Akun Instagram</label>
              <input
                type="text"
                required
                value={form.instagram_handle}
                onChange={e => handleChange('instagram_handle', e.target.value)}
                className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
              />
              <p className="text-[10px] text-zinc-500 mt-1 font-mono">URL: {form.instagram_url}</p>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">Email Resmi</label>
              <input
                type="email"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">Alamat / Wilayah Operasional</label>
              <input
                type="text"
                value={form.address}
                onChange={e => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
              />
            </div>
          </div>
        </div>

        {/* Footer & Copyright */}
        <div className="p-6 bg-[#121215] border border-[#24242A] rounded-sm space-y-4">
          <h2 className="font-serif text-base text-white font-semibold border-b border-zinc-800 pb-2">
            Footer Website
          </h2>

          <div>
            <label className="text-zinc-400 block mb-1">Teks Hak Cipta (Copyright Notice)</label>
            <input
              type="text"
              value={form.footer_copyright}
              onChange={e => handleChange('footer_copyright', e.target.value)}
              className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#C5A880] text-[#0C0C0D] font-semibold rounded text-xs uppercase tracking-wider"
          >
            {saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
          </button>
        </div>

      </form>
    </div>
  );
};
