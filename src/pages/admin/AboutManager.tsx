import React, { useState, useEffect } from 'react';
import { Info, Check, Upload, ArrowUpRight, Trash2 } from 'lucide-react';
import { WebsiteSection } from '../../types';
import { api } from '../../lib/api';
import { useSite } from '../../context/SiteContext';
import { normalizeMediaUrl } from '../../lib/mediaUtils';

export const AboutManager: React.FC = () => {
  const { refreshSiteData } = useSite();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadAbout() {
      try {
        setLoading(true);
        const res = await api.get<{ section: WebsiteSection }>('/sections/about');
        if (res.section) {
          setSectionId(res.section.id);
          setTitle(res.section.title);
          setSubtitle(res.section.subtitle || '');
          setDescription(res.section.description || '');
          setImageUrl(res.section.background_media_url || '');
        }
      } catch (err) {
        console.error('Failed to load about section:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAbout();
  }, []);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadFiles([file], 'brand');
      if (res.assets && res.assets[0]) {
        setImageUrl(res.assets[0].url);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah gambar');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionId) return;

    try {
      setSaving(true);
      await api.put(`/sections/${sectionId}`, {
        title,
        subtitle,
        description,
        background_media_url: imageUrl
      });
      setSuccessMsg('Bagian Tentang AFFRAME berhasil diperbarui!');
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshSiteData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-light">
            Pengelolaan Tentang AFFRAME
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Ubah narasi brand, filosofi visual, serta foto representasi studio.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 bg-[#121215] border border-[#24242A] rounded-sm space-y-5 text-xs">
        <div>
          <label className="text-zinc-400 block mb-1 font-semibold">Judul Section</label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
          />
        </div>

        <div>
          <label className="text-zinc-400 block mb-1 font-semibold">Eyebrow / Sub-judul</label>
          <input
            type="text"
            value={subtitle}
            onChange={e => setSubtitle(e.target.value)}
            className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
          />
        </div>

        <div>
          <label className="text-zinc-400 block mb-1 font-semibold">Narasi Brand (Katalog Resmi)</label>
          <textarea
            rows={5}
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200 leading-relaxed font-sans text-xs"
          />
        </div>

        <div>
          <label className="text-zinc-400 block mb-1 font-semibold">Foto Representasi Studio</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={imageUrl}
              onChange={e => setImageUrl(normalizeMediaUrl(e.target.value))}
              placeholder="URL Gambar atau unggah berkas"
              className="flex-1 px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200 font-mono text-xs"
            />
            <label className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded cursor-pointer shrink-0 flex items-center gap-1.5 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Unggah</span>
              <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
            </label>
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 rounded transition-colors"
                title="Hapus Foto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          {imageUrl && (
            <div className="relative aspect-[16/9] max-w-sm bg-black rounded overflow-hidden border border-zinc-800 group mt-2">
              <img src={imageUrl} alt="About AFFRAME" className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="p-1.5 bg-black/80 text-red-400 hover:text-red-300 rounded-full"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#C5A880] text-[#0C0C0D] font-semibold rounded text-xs uppercase tracking-wider"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan Tentang Kami'}
          </button>
        </div>
      </form>
    </div>
  );
};
