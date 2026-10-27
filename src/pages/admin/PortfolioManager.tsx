import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban, Plus, Search, Edit3, Trash2, Eye, EyeOff,
  Star, ExternalLink, Image, Film, Check, X, Upload, ChevronUp, ChevronDown
} from 'lucide-react';
import { PortfolioProject, PortfolioCategory } from '../../types';
import { api } from '../../lib/api';
import { normalizeMediaUrl, getVideoEmbedUrl, isVideoUrl } from '../../lib/mediaUtils';

export const PortfolioManager: React.FC = () => {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [filterMediaType, setFilterMediaType] = useState<'all' | 'video' | 'photo'>('all');

  // Modal State (Add / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectDate, setProjectDate] = useState('');
  const [location, setLocation] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('video');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'square'>('portrait');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  // Gallery Photo Item interface
  interface ProjectImageItem {
    id?: number;
    image_url: string;
    caption?: string;
    alt_text?: string;
  }
  const [galleryImages, setGalleryImages] = useState<ProjectImageItem[]>([]);
  const [newGalleryInput, setNewGalleryInput] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Multi-Video for this project
  interface ProjectVideoItem {
    id?: number;
    title: string;
    video_url: string;
    orientation: 'portrait' | 'landscape' | 'square';
  }
  const [videos, setVideos] = useState<ProjectVideoItem[]>([]);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoOrientation, setNewVideoOrientation] = useState<'portrait' | 'landscape' | 'square'>('portrait');

  // Video Item In-Place Edit State
  const [editingVideoIndex, setEditingVideoIndex] = useState<number | null>(null);
  const [editVideoTitle, setEditVideoTitle] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editVideoOrientation, setEditVideoOrientation] = useState<'portrait' | 'landscape' | 'square'>('portrait');
  const [isUploadingEditVideo, setIsUploadingEditVideo] = useState(false);

  // Gallery Photo In-Place Edit / Replace State
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editPhotoCaption, setEditPhotoCaption] = useState('');
  const [isUploadingEditPhoto, setIsUploadingEditPhoto] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, catRes] = await Promise.all([
        api.get<{ projects: PortfolioProject[] }>('/portfolio/projects', {
          all: true,
          category: selectedCat !== 'all' ? selectedCat : undefined,
          search: search || undefined
        }),
        api.get<{ categories: PortfolioCategory[] }>('/portfolio/categories', { all: true }),
      ]);
      setProjects(projRes.projects || []);
      setCategories(catRes.categories || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCat, search]);

  const openAdd = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setCategoryId(categories.length > 0 ? categories[0].id : '');
    setShortDesc('');
    setFullDesc('');
    setClientName('');
    setProjectDate(new Date().toISOString().slice(0, 10));
    setLocation('Surabaya');
    setCoverUrl('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop');
    setVideoUrl('');
    setMediaType('video');
    setOrientation('portrait');
    setVideos([]);
    setNewVideoTitle('');
    setNewVideoUrl('');
    setNewVideoOrientation('portrait');
    setEditingVideoIndex(null);
    setEditVideoTitle('');
    setEditVideoUrl('');
    setEditingPhotoIndex(null);
    setEditPhotoUrl('');
    setEditPhotoCaption('');
    setNewPhotoUrl('');
    setNewPhotoCaption('');
    setIsFeatured(false);
    setIsPublished(true);
    setGalleryImages([]);
    setShowModal(true);
  };

  const openEdit = (p: PortfolioProject) => {
    setEditingId(p.id);
    setTitle(p.title);
    setSlug(p.slug);
    setCategoryId(p.category_id || '');
    setShortDesc(p.short_description || '');
    setFullDesc(p.full_description || '');
    setClientName(p.client_name || '');
    setProjectDate(p.project_date || '');
    setLocation(p.location || '');
    setCoverUrl(p.cover_image_url || '');
    setVideoUrl(p.featured_video_url || '');
    setMediaType(p.media_type || (p.featured_video_url && p.featured_video_url.trim() ? 'video' : 'photo'));
    setOrientation(p.orientation || 'portrait');

    // Populate multi-videos
    if (p.videos && p.videos.length > 0) {
      setVideos(p.videos.map(v => ({
        id: v.id,
        title: v.title || 'Video Acara',
        video_url: v.video_url,
        orientation: v.orientation || 'portrait'
      })));
    } else if (p.featured_video_url && p.featured_video_url.trim()) {
      setVideos([{
        title: 'Video Utama',
        video_url: p.featured_video_url,
        orientation: p.orientation || 'portrait'
      }]);
    } else {
      setVideos([]);
    }

    setNewVideoTitle('');
    setNewVideoUrl('');
    setNewVideoOrientation('portrait');
    setEditingVideoIndex(null);
    setEditVideoTitle('');
    setEditVideoUrl('');
    setEditingPhotoIndex(null);
    setEditPhotoUrl('');
    setEditPhotoCaption('');
    setNewPhotoUrl('');
    setNewPhotoCaption('');
    setIsFeatured(p.is_featured === 1);
    setIsPublished(p.is_published === 1);
    setGalleryImages(
      p.images && p.images.length > 0
        ? p.images.map(img => ({
            id: img.id,
            image_url: img.image_url,
            caption: img.caption || '',
            alt_text: img.alt_text || ''
          }))
        : []
    );
    setShowModal(true);
  };

  const addVideoItem = () => {
    if (!newVideoUrl.trim()) {
      alert('Harap masukkan tautan URL video atau unggah berkas video terlebih dahulu.');
      return;
    }
    const defaultTitle = newVideoTitle.trim() || `Video ${videos.length + 1} (${newVideoOrientation === 'portrait' ? 'Reels 9:16' : '16:9'})`;
    setVideos(prev => [
      ...prev,
      {
        title: defaultTitle,
        video_url: newVideoUrl.trim(),
        orientation: newVideoOrientation
      }
    ]);
    setNewVideoTitle('');
    setNewVideoUrl('');
    setMediaType('video');
  };

  const removeVideoItem = (index: number) => {
    if (editingVideoIndex === index) {
      setEditingVideoIndex(null);
    } else if (editingVideoIndex !== null && editingVideoIndex > index) {
      setEditingVideoIndex(editingVideoIndex - 1);
    }
    setVideos(prev => prev.filter((_, idx) => idx !== index));
  };

  const startEditVideo = (index: number) => {
    const vid = videos[index];
    if (!vid) return;
    setEditingVideoIndex(index);
    setEditVideoTitle(vid.title);
    setEditVideoUrl(vid.video_url);
    setEditVideoOrientation(vid.orientation || 'portrait');
  };

  const cancelEditVideo = () => {
    setEditingVideoIndex(null);
    setEditVideoTitle('');
    setEditVideoUrl('');
  };

  const saveEditVideo = () => {
    if (editingVideoIndex === null) return;
    if (!editVideoUrl.trim()) {
      alert('Tautan URL video tidak boleh kosong.');
      return;
    }
    const updatedVideos = [...videos];
    updatedVideos[editingVideoIndex] = {
      ...updatedVideos[editingVideoIndex],
      title: editVideoTitle.trim() || `Video ${editingVideoIndex + 1}`,
      video_url: editVideoUrl.trim(),
      orientation: editVideoOrientation
    };
    setVideos(updatedVideos);
    setEditingVideoIndex(null);
  };

  const handleUploadEditVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingEditVideo(true);
      const res = await api.uploadFiles([file], 'portfolio');
      if (res.assets && res.assets[0]) {
        setEditVideoUrl(res.assets[0].url);
        if (!editVideoTitle.trim()) {
          setEditVideoTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah video pengganti.');
    } finally {
      setIsUploadingEditVideo(false);
    }
  };

  const moveVideoItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= videos.length) return;
    const nextVideos = [...videos];
    const [moved] = nextVideos.splice(index, 1);
    nextVideos.splice(targetIdx, 0, moved);
    setVideos(nextVideos);
    if (editingVideoIndex === index) {
      setEditingVideoIndex(targetIdx);
    }
  };

  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingVideo(true);
      const res = await api.uploadFiles([file], 'portfolio');
      if (res.assets && res.assets[0]) {
        const uploadedUrl = res.assets[0].url;
        setNewVideoUrl(uploadedUrl);
        if (!newVideoTitle.trim()) {
          setNewVideoTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah video.');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadFiles([file], 'portfolio');
      if (res.assets && res.assets[0]) {
        setCoverUrl(res.assets[0].url);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah gambar sampul.');
    }
  };

  const handleUploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const res = await api.uploadFiles(Array.from(files), 'portfolio');
      if (res.assets) {
        const newItems: ProjectImageItem[] = res.assets.map((a: any, i: number) => ({
          image_url: a.url,
          caption: a.original_name ? a.original_name.replace(/\.[^/.]+$/, '') : `Foto ${galleryImages.length + i + 1}`,
          alt_text: title || 'Foto Dokumentasi'
        }));
        setGalleryImages(prev => [...prev, ...newItems]);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah galeri foto.');
    }
  };

  const handleUploadSinglePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingPhoto(true);
      const res = await api.uploadFiles([file], 'portfolio');
      if (res.assets && res.assets[0]) {
        setNewPhotoUrl(res.assets[0].url);
        if (!newPhotoCaption.trim()) {
          setNewPhotoCaption(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah foto.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const addPhotoItem = () => {
    if (!newPhotoUrl.trim()) {
      alert('Harap masukkan tautan URL foto atau unggah berkas foto terlebih dahulu.');
      return;
    }
    const defaultCaption = newPhotoCaption.trim() || `Foto ${galleryImages.length + 1}`;
    setGalleryImages(prev => [
      ...prev,
      {
        image_url: normalizeMediaUrl(newPhotoUrl.trim()),
        caption: defaultCaption,
        alt_text: defaultCaption
      }
    ]);
    setNewPhotoUrl('');
    setNewPhotoCaption('');
  };

  const addGalleryUrl = () => {
    if (newGalleryInput.trim()) {
      // Support comma or newline separated URLs
      const urls = newGalleryInput
        .split(/[\n,]+/)
        .map(u => normalizeMediaUrl(u.trim()))
        .filter(Boolean);
      const newItems: ProjectImageItem[] = urls.map((u, i) => ({
        image_url: u,
        caption: `Foto ${galleryImages.length + i + 1}`,
        alt_text: title || 'Foto Dokumentasi'
      }));
      setGalleryImages(prev => [...prev, ...newItems]);
      setNewGalleryInput('');
    }
  };

  const removeGalleryImage = (index: number) => {
    if (editingPhotoIndex === index) {
      setEditingPhotoIndex(null);
    } else if (editingPhotoIndex !== null && editingPhotoIndex > index) {
      setEditingPhotoIndex(editingPhotoIndex - 1);
    }
    setGalleryImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const startEditPhoto = (index: number) => {
    const img = galleryImages[index];
    if (!img) return;
    setEditingPhotoIndex(index);
    setEditPhotoUrl(img.image_url);
    setEditPhotoCaption(img.caption || '');
  };

  const cancelEditPhoto = () => {
    setEditingPhotoIndex(null);
    setEditPhotoUrl('');
    setEditPhotoCaption('');
  };

  const saveEditPhoto = () => {
    if (editingPhotoIndex === null) return;
    if (!editPhotoUrl.trim()) {
      alert('URL foto tidak boleh kosong.');
      return;
    }
    const updatedGallery = [...galleryImages];
    updatedGallery[editingPhotoIndex] = {
      ...updatedGallery[editingPhotoIndex],
      image_url: normalizeMediaUrl(editPhotoUrl.trim()),
      caption: editPhotoCaption.trim() || `Foto ${editingPhotoIndex + 1}`,
      alt_text: editPhotoCaption.trim() || title
    };
    setGalleryImages(updatedGallery);
    setEditingPhotoIndex(null);
    setEditPhotoUrl('');
    setEditPhotoCaption('');
  };

  const handleUploadEditPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingEditPhoto(true);
      const res = await api.uploadFiles([file], 'portfolio');
      if (res.assets && res.assets[0]) {
        setEditPhotoUrl(res.assets[0].url);
        if (!editPhotoCaption.trim()) {
          setEditPhotoCaption(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah foto pengganti.');
    } finally {
      setIsUploadingEditPhoto(false);
    }
  };

  const movePhotoItem = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= galleryImages.length) return;
    const nextGallery = [...galleryImages];
    const [moved] = nextGallery.splice(index, 1);
    nextGallery.splice(targetIdx, 0, moved);
    setGalleryImages(nextGallery);
    if (editingPhotoIndex === index) {
      setEditingPhotoIndex(targetIdx);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSaving(true);
      const payload = {
        title,
        slug,
        category_id: categoryId || null,
        short_description: shortDesc,
        full_description: fullDesc,
        client_name: clientName,
        project_date: projectDate,
        location,
        cover_image_url: coverUrl,
        featured_video_url: videos.length > 0 ? videos[0].video_url : videoUrl,
        media_type: mediaType,
        orientation: videos.length > 0 ? videos[0].orientation : orientation,
        is_featured: isFeatured ? 1 : 0,
        is_published: isPublished ? 1 : 0,
        gallery_images: galleryImages.map((img, idx) => ({
          image_url: img.image_url,
          caption: img.caption || '',
          alt_text: img.alt_text || title,
          sort_order: idx + 1
        })),
        videos: videos
      };

      if (editingId) {
        await api.put(`/portfolio/projects/${editingId}`, payload);
      } else {
        await api.post('/portfolio/projects', payload);
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan proyek portofolio.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Yakin ingin menghapus proyek "${name}"? Seluruh foto galeri terkait juga akan dihapus.`)) {
      try {
        await api.delete(`/portfolio/projects/${id}`);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus proyek');
      }
    }
  };

  const togglePublish = async (p: PortfolioProject) => {
    try {
      await api.put(`/portfolio/projects/${p.id}`, { is_published: p.is_published ? 0 : 1 });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status publikasi');
    }
  };

  const toggleFeatured = async (p: PortfolioProject) => {
    try {
      await api.put(`/portfolio/projects/${p.id}`, { is_featured: p.is_featured ? 0 : 1 });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status favorit');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-light">
            Pengelolaan Portofolio
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Tambah, edit, unggah galeri foto beresolusi tinggi, kelola video, dan status publikasi karya AFFRAME.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Proyek Baru</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col gap-3 bg-[#121215] p-4 rounded-sm border border-[#24242A]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCat('all')}
              className={`px-3 py-1.5 rounded-sm text-xs transition-colors shrink-0 ${
                selectedCat === 'all'
                  ? 'bg-[#C5A880] text-[#0C0C0D] font-semibold'
                  : 'bg-[#18181D] text-zinc-400 border border-zinc-800'
              }`}
            >
              Semua Kategori ({projects.length})
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.slug)}
                className={`px-3 py-1.5 rounded-sm text-xs transition-colors shrink-0 ${
                  selectedCat === c.slug
                    ? 'bg-[#C5A880] text-[#0C0C0D] font-semibold'
                    : 'bg-[#18181D] text-zinc-400 border border-zinc-800'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari judul proyek..."
              className="w-full pl-9 pr-4 py-2 bg-[#18181D] border border-zinc-800 rounded-sm text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#C5A880]"
            />
          </div>
        </div>

        {/* Media Type Sub-Filter Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60">
          <span className="text-[11px] text-zinc-500 font-medium mr-1">Tipe Media:</span>
          <button
            onClick={() => setFilterMediaType('all')}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              filterMediaType === 'all'
                ? 'bg-zinc-200 text-black font-semibold'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            Semua Format ({projects.length})
          </button>
          <button
            onClick={() => setFilterMediaType('video')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              filterMediaType === 'video'
                ? 'bg-amber-500 text-black font-semibold'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-amber-300'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Video & Reels ({projects.filter(p => p.media_type === 'video' || Boolean(p.featured_video_url && p.featured_video_url.trim()) || (p.videos && p.videos.length > 0)).length})</span>
          </button>
          <button
            onClick={() => setFilterMediaType('photo')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              filterMediaType === 'photo'
                ? 'bg-[#C5A880] text-black font-semibold'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Koleksi Foto ({projects.filter(p => p.media_type === 'photo' || (p.images && p.images.length > 0 && p.media_type !== 'video')).length})</span>
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-[#121215] border border-[#24242A] rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-500">Memuat portofolio...</div>
        ) : projects.length === 0 ? (
          <div className="p-16 text-center text-xs text-zinc-500 space-y-2">
            <p>Belum ada proyek portofolio yang cocok.</p>
            <button onClick={openAdd} className="text-[#C5A880] underline">Tambah Proyek Pertama</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#16161B] text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Proyek & Kover</th>
                  <th className="py-3 px-4">Format Media</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Keterangan / Deskripsi</th>
                  <th className="py-3 px-4">Klien & Lokasi</th>
                  <th className="py-3 px-4 text-center">Favorit</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi / Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {projects
                  .filter(p => {
                    const isVideo = p.media_type === 'video' || Boolean(p.featured_video_url && p.featured_video_url.trim()) || (p.videos && p.videos.length > 0);
                    if (filterMediaType === 'video') return isVideo;
                    if (filterMediaType === 'photo') return p.media_type === 'photo' || (p.images && p.images.length > 0 && p.media_type !== 'video');
                    return true;
                  })
                  .map(p => {
                    const isVideo = p.media_type === 'video' || Boolean(p.featured_video_url && p.featured_video_url.trim()) || (p.videos && p.videos.length > 0);
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Project & Cover */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-16 bg-black rounded overflow-hidden shrink-0 border border-zinc-800">
                              <img src={p.cover_image_url} alt={p.title} className="w-full h-full object-cover" />
                              {isVideo && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Film className="w-3.5 h-3.5 text-amber-300" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-medium text-white truncate max-w-xs">{p.title}</h4>
                              <p className="text-[11px] text-zinc-500 truncate max-w-xs">{p.short_description}</p>
                              <span className="text-[10px] text-zinc-600 font-mono">/{p.slug}</span>
                            </div>
                          </div>
                        </td>

                        {/* Format Media Badge */}
                        <td className="py-3 px-4">
                          {isVideo ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                <Film className="w-3 h-3" />
                                <span>{p.orientation === 'landscape' ? '16:9 Landscape' : p.orientation === 'square' ? '4:5 Standard' : '9:16 Portrait Reel'}</span>
                              </span>
                              <div className="text-[10px] text-zinc-500">
                                {(p.videos && p.videos.length > 1) ? `${p.videos.length} Video Acara` : 'Video Sinematik'}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#C5A880]/15 text-[#E2D2BC] border border-[#C5A880]/40">
                                <Image className="w-3 h-3 text-[#C5A880]" />
                                <span>Koleksi Foto</span>
                              </span>
                              {p.images && p.images.length > 0 && (
                                <div className="text-[10px] text-zinc-500">{p.images.length} foto galeri</div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-[#1C1C22] text-[#C5A880] border border-[#C5A880]/30">
                            {p.category_name || 'Tanpa Kategori'}
                          </span>
                        </td>

                        {/* Keterangan / Deskripsi */}
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-zinc-300 text-[11px] line-clamp-2 leading-relaxed">
                            {p.short_description || p.full_description || <span className="text-zinc-600 italic">Belum ada keterangan</span>}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => openEdit(p)}
                              className="text-[10px] text-[#C5A880] hover:underline flex items-center gap-1 cursor-pointer"
                              title="Edit Keterangan / Detail Proyek"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Edit Keterangan</span>
                            </button>
                          </div>
                        </td>

                        {/* Client & Location */}
                        <td className="py-3 px-4 text-zinc-400">
                          <div>{p.client_name || '-'}</div>
                          <div className="text-[10px] text-zinc-500">{p.location || 'Surabaya'}</div>
                        </td>

                        {/* Featured Star */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleFeatured(p)}
                            className={`p-1 rounded cursor-pointer ${
                              p.is_featured ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'
                            }`}
                            title={p.is_featured ? 'Hapus dari Favorit' : 'Tandai Favorit'}
                          >
                            <Star className={`w-4 h-4 ${p.is_featured ? 'fill-current' : ''}`} />
                          </button>
                        </td>

                        {/* Status Publish */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => togglePublish(p)}
                            className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold cursor-pointer border ${
                              p.is_published
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            {p.is_published ? 'Publik' : 'Draft'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/portfolio/${p.slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] transition-colors"
                              title="Buka Halaman Karya di Web Publik"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Lihat</span>
                            </Link>
                            <button
                              onClick={() => openEdit(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#C5A880]/15 hover:bg-[#C5A880]/25 text-[#E2D2BC] border border-[#C5A880]/40 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Edit Detail, Video, dan Galeri Foto Acara Ini"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#C5A880]" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, p.title)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/30 rounded text-[11px] transition-colors cursor-pointer"
                              title="Hapus Proyek Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Hapus</span>
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

      {/* Add / Edit Project Full Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#141418] border border-zinc-800 max-w-4xl w-full rounded-sm p-6 space-y-6 my-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-serif text-xl text-white">
                {editingId ? 'Edit Proyek Portofolio' : 'Tambah Proyek Portofolio Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 text-xs">
              {/* Row 1: Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">Judul Proyek *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Intimate Wedding Arya & Nadhira"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">Kategori Portofolio</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  >
                    <option value="">-- Tanpa Kategori --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Short Description */}
              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">Deskripsi Singkat (Ringkasan)</label>
                <input
                  type="text"
                  placeholder="Ringkasan 1 kalimat yang muncul pada kartu galeri..."
                  value={shortDesc}
                  onChange={e => setShortDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              {/* Row 3: Full Narrative Description */}
              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">Narasi Lengkap & Konsep Visual</label>
                <textarea
                  rows={4}
                  placeholder="Ceritakan proses kreatif, emosi momen, atau konsep teknis pengambilan foto/video..."
                  value={fullDesc}
                  onChange={e => setFullDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                />
              </div>

              {/* Row 4: Client, Date, Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-zinc-400 block mb-1">Nama Klien / Brand</label>
                  <input
                    type="text"
                    placeholder="Contoh: Arya & Nadhira"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Tanggal Acara / Sesi</label>
                  <input
                    type="date"
                    value={projectDate}
                    onChange={e => setProjectDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Lokasi Sesi</label>
                  <input
                    type="text"
                    placeholder="Contoh: Surabaya Barat"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200"
                  />
                </div>
              </div>

              {/* Row 5: Media Type & Orientation Selection */}
              <div className="pt-3 border-t border-zinc-800 space-y-4">
                <div>
                  <label className="text-zinc-300 block mb-2 font-semibold">Tipe Media Karya *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMediaType('video')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded border transition-all cursor-pointer ${
                        mediaType === 'video'
                          ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 font-semibold shadow-md'
                          : 'bg-[#18181D] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Film className="w-4 h-4 text-amber-400" />
                      <span>🎬 Video & Reels Sinematik</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaType('photo')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded border transition-all cursor-pointer ${
                        mediaType === 'photo'
                          ? 'bg-[#C5A880]/15 border-[#C5A880]/60 text-[#E2D2BC] font-semibold shadow-md'
                          : 'bg-[#18181D] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Image className="w-4 h-4 text-[#C5A880]" />
                      <span>📸 Koleksi Foto / Galeri</span>
                    </button>
                  </div>
                </div>

                {/* ========================================================
                    DYNAMIC MEDIA SECTIONS ACCORDING TO SELECTED TYPE
                    (Video first if mediaType === 'video', Photo first if mediaType === 'photo')
                    ======================================================== */}

                {/* 1. PHOTO COLLECTION SECTION */}
                <div className={`p-4 rounded-sm space-y-4 border transition-all ${
                  mediaType === 'photo'
                    ? 'bg-[#C5A880]/[0.05] border-[#C5A880]/40 ring-1 ring-[#C5A880]/20 order-1'
                    : 'bg-[#16161A] border-zinc-800 order-3'
                }`}>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-[#C5A880]" />
                      <label className="text-[#C5A880] font-bold text-xs">
                        {mediaType === 'photo' ? 'Koleksi Foto Utama Acara' : 'Galeri Foto Lampiran'} ({galleryImages.length} Foto)
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      {galleryImages.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Yakin ingin menghapus semua foto di acara ini?')) {
                              setGalleryImages([]);
                              setEditingPhotoIndex(null);
                            }
                          }}
                          className="px-2 py-1 bg-red-600/15 hover:bg-red-600/30 text-red-300 border border-red-600/30 rounded text-[11px] cursor-pointer"
                        >
                          Hapus Semua
                        </button>
                      )}
                      <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded cursor-pointer text-[11px] font-medium transition-colors">
                        <Upload className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>Unggah Banyak Foto (Batch)</span>
                        <input type="file" multiple accept="image/*" onChange={handleUploadGallery} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* Form to Add a Single Photo with Keterangan */}
                  <div className="p-3 bg-[#121215] border border-zinc-800 rounded-sm space-y-3">
                    <span className="text-zinc-200 font-semibold text-xs block">
                      + Tambah Foto Baru ke Koleksi Ini:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-zinc-400 block mb-1 text-[11px]">Judul / Keterangan Foto</label>
                        <input
                          type="text"
                          placeholder="Misal: Momen Akad Sakral, Detail Dekorasi, dll"
                          value={newPhotoCaption}
                          onChange={e => setNewPhotoCaption(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#18181D] border border-zinc-800 rounded text-zinc-200 text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-zinc-400 block mb-1 text-[11px]">Tautan URL atau Unggah Berkas Foto</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="URL gambar atau unggah langsung..."
                            value={newPhotoUrl}
                            onChange={e => setNewPhotoUrl(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-[#18181D] border border-zinc-800 rounded text-zinc-200 text-xs font-mono"
                          />
                          <label className="px-3 py-1.5 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] font-bold rounded cursor-pointer shrink-0 flex items-center gap-1 text-xs" title="Unggah Foto dari Perangkat">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isUploadingPhoto ? 'Mengunggah...' : 'Pilih Foto'}</span>
                            <input type="file" accept="image/*" onChange={handleUploadSinglePhoto} disabled={isUploadingPhoto} className="hidden" />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={addPhotoItem}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] font-bold rounded-sm text-xs cursor-pointer shadow transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambahkan Foto ke Koleksi</span>
                      </button>
                    </div>
                  </div>

                  {/* Active In-Place Edit / Replace Photo Box */}
                  {editingPhotoIndex !== null && (
                    <div className="p-3.5 bg-[#1A1A20] border-2 border-[#C5A880] rounded-sm space-y-3 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-[#C5A880]" />
                          <span className="text-[#C5A880] font-bold text-xs">
                            Edit Foto & Keterangan #{editingPhotoIndex + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={cancelEditPhoto}
                          className="text-zinc-400 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Batal</span>
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        {/* Live Thumbnail Preview */}
                        <div className="w-24 h-24 rounded overflow-hidden bg-black border border-zinc-700 shrink-0 relative shadow">
                          <img
                            src={editPhotoUrl || galleryImages[editingPhotoIndex]?.image_url}
                            alt="Preview Foto"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/80 text-[9px] text-[#C5A880] rounded font-mono">
                            #{editingPhotoIndex + 1}
                          </span>
                        </div>

                        {/* Fields: Caption & URL / Upload Replacement */}
                        <div className="flex-1 space-y-2.5 w-full">
                          <div>
                            <label className="text-zinc-300 text-[11px] block font-medium mb-1">
                              Judul / Keterangan Foto:
                            </label>
                            <input
                              type="text"
                              value={editPhotoCaption}
                              onChange={e => setEditPhotoCaption(e.target.value)}
                              placeholder="Keterangan momen foto ini..."
                              className="w-full px-3 py-1.5 bg-[#18181D] border border-zinc-700 rounded text-zinc-200 text-xs focus:outline-none focus:border-[#C5A880]"
                            />
                          </div>

                          <div>
                            <label className="text-zinc-300 text-[11px] block font-medium mb-1">
                              Tautan URL Foto atau Ganti Berkas Gambar:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editPhotoUrl}
                                onChange={e => setEditPhotoUrl(e.target.value)}
                                placeholder="URL foto pengganti..."
                                className="flex-1 px-3 py-1.5 bg-[#18181D] border border-zinc-700 rounded text-zinc-200 text-xs focus:outline-none focus:border-[#C5A880] font-mono"
                              />
                              <label className="px-3 py-1.5 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] font-bold rounded cursor-pointer shrink-0 flex items-center gap-1.5 text-xs transition-colors shadow">
                                <Upload className="w-3.5 h-3.5" />
                                <span>{isUploadingEditPhoto ? 'Mengunggah...' : 'Unggah Pengganti'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleUploadEditPhoto}
                                  disabled={isUploadingEditPhoto}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                        <button
                          type="button"
                          onClick={cancelEditPhoto}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={saveEditPhoto}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs shadow transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Simpan Perubahan Foto</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of Photos in Collection with Keterangan and Clear Edit Menus */}
                  {galleryImages.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {galleryImages.map((img, idx) => {
                        const isEditingThisPhoto = editingPhotoIndex === idx;

                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-3 p-2.5 rounded-sm bg-[#18181D] border transition-all ${
                              isEditingThisPhoto
                                ? 'border-2 border-[#C5A880] ring-2 ring-[#C5A880]/30'
                                : 'border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            {/* Photo Thumbnail */}
                            <div className="relative w-16 h-16 rounded overflow-hidden bg-black border border-zinc-700 shrink-0">
                              <img src={img.image_url} alt={img.caption || `Foto ${idx}`} className="w-full h-full object-cover" />
                              <span className="absolute bottom-0.5 left-0.5 px-1 py-0.2 bg-black/80 text-[8px] text-zinc-300 rounded font-mono">
                                #{idx + 1}
                              </span>
                            </div>

                            {/* Caption & Actions */}
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-white text-xs truncate" title={img.caption || `Foto ${idx + 1}`}>
                                {img.caption || `Foto ${idx + 1}`}
                              </h5>
                              <p className="text-[10px] text-zinc-500 font-mono truncate mt-0.5" title={img.image_url}>
                                {img.image_url}
                              </p>

                              {/* Action Row */}
                              <div className="flex items-center gap-1 mt-2">
                                <button
                                  type="button"
                                  onClick={() => startEditPhoto(idx)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded text-[10px] font-medium transition-colors cursor-pointer"
                                  title="Edit Keterangan atau Ganti Foto"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeGalleryImage(idx)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-600/20 rounded text-[10px] transition-colors cursor-pointer"
                                  title="Hapus Foto Ini"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                                <div className="flex items-center border border-zinc-800 rounded bg-[#121215] ml-auto">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => movePhotoItem(idx, 'left')}
                                    className="p-1 text-zinc-400 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer text-[10px]"
                                    title="Geser Urutan ke Kiri"
                                  >
                                    ◀
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === galleryImages.length - 1}
                                    onClick={() => movePhotoItem(idx, 'right')}
                                    className="p-1 text-zinc-400 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer text-[10px]"
                                    title="Geser Urutan ke Kanan"
                                  >
                                    ▶
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-[11px] text-zinc-500 bg-[#141418] border border-dashed border-zinc-800 rounded">
                      Belum ada foto dalam koleksi acara ini. Gunakan formulir di atas untuk menambahkan foto pertama beserta keterangannya.
                    </div>
                  )}

                  {/* Add Image by external URL (comma or newline separated) */}
                  <div className="flex gap-2 pt-2 border-t border-zinc-800/80">
                    <input
                      type="text"
                      placeholder="Atau tempel beberapa URL foto eksternal sekaligus (pisahkan koma atau baris baru)..."
                      value={newGalleryInput}
                      onChange={e => setNewGalleryInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-[#18181D] border border-zinc-800 rounded text-zinc-200 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={addGalleryUrl}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs cursor-pointer font-medium"
                    >
                      Tambah URL
                    </button>
                  </div>
                </div>

                {/* 2. COVER IMAGE / POSTER SECTION */}
                <div className="space-y-2 p-3 bg-[#16161A] border border-zinc-800 rounded-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-[#C5A880] block font-semibold text-xs">
                      Foto Sampul Utama / Poster Kartu *
                    </label>
                    {coverUrl && (
                      <button
                        type="button"
                        onClick={() => setCoverUrl('')}
                        className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus Sampul</span>
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="URL Gambar Sampul Utama..."
                      value={coverUrl}
                      onChange={e => setCoverUrl(normalizeMediaUrl(e.target.value))}
                      className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200 text-xs font-mono"
                    />
                    <label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded cursor-pointer shrink-0" title="Unggah Foto Sampul">
                      <Upload className="w-4 h-4" />
                      <input type="file" accept="image/*" onChange={handleUploadCover} className="hidden" />
                    </label>
                  </div>
                  {coverUrl && (
                    <div className="aspect-[16/9] w-40 bg-black rounded overflow-hidden border border-zinc-800 shadow-sm mt-1">
                      <img src={normalizeMediaUrl(coverUrl)} alt="Cover preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* 3. MULTI-VIDEO SECTION */}
                <div className={`p-4 rounded-sm space-y-4 border transition-all ${
                  mediaType === 'video'
                    ? 'bg-amber-500/[0.04] border-amber-500/30 ring-1 ring-amber-500/20'
                    : 'bg-[#16161A] border-zinc-800'
                }`}>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-amber-400" />
                      <label className="text-amber-300 font-semibold text-xs">
                        {mediaType === 'video' ? 'Daftar Video Utama Acara' : 'Video Sinematik Tambahan (Opsional)'} ({videos.length} Video)
                      </label>
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      Mendukung Reels Portrait 9:16 & Sinematik Landscape 16:9
                    </span>
                  </div>

                  {/* List of currently added videos */}
                  {videos.length > 0 ? (
                    <div className="space-y-3">
                      {videos.map((vid, idx) => {
                        const isEditingThis = editingVideoIndex === idx;

                        if (isEditingThis) {
                          return (
                            <div
                              key={idx}
                              className="p-3.5 bg-amber-500/10 border-2 border-amber-500/60 rounded-sm space-y-3 shadow-lg"
                            >
                              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                                <span className="text-amber-300 font-bold text-xs flex items-center gap-1.5">
                                  <Edit3 className="w-3.5 h-3.5" />
                                  Edit Data Video #{idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={cancelEditVideo}
                                  className="text-zinc-400 hover:text-white text-[11px] flex items-center gap-1 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Batal</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-zinc-300 block mb-1 text-[11px] font-medium">Judul / Keterangan Video</label>
                                  <input
                                    type="text"
                                    value={editVideoTitle}
                                    onChange={e => setEditVideoTitle(e.target.value)}
                                    placeholder="Misal: Reels Teaser 9:16"
                                    className="w-full px-2.5 py-1.5 bg-[#18181D] border border-amber-500/40 rounded text-zinc-200 text-xs focus:outline-none focus:border-amber-400"
                                  />
                                </div>

                                <div>
                                  <label className="text-zinc-300 block mb-1 text-[11px] font-medium">Format Orientasi Video</label>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setEditVideoOrientation('portrait')}
                                      className={`py-1.5 px-2 rounded text-[11px] font-medium text-center transition-colors cursor-pointer ${
                                        editVideoOrientation === 'portrait'
                                          ? 'bg-amber-500 text-black font-bold shadow'
                                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                      }`}
                                    >
                                      📱 9:16 Reels
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditVideoOrientation('landscape')}
                                      className={`py-1.5 px-2 rounded text-[11px] font-medium text-center transition-colors cursor-pointer ${
                                        editVideoOrientation === 'landscape'
                                          ? 'bg-amber-500 text-black font-bold shadow'
                                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                      }`}
                                    >
                                      🖥️ 16:9 Film
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditVideoOrientation('square')}
                                      className={`py-1.5 px-2 rounded text-[11px] font-medium text-center transition-colors cursor-pointer ${
                                        editVideoOrientation === 'square'
                                          ? 'bg-amber-500 text-black font-bold shadow'
                                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                      }`}
                                    >
                                      🔲 4:5 Feed
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="text-zinc-300 block mb-1 text-[11px] font-medium">Tautan URL Video atau Unggah Berkas MP4 Pengganti</label>
                                <div className="flex gap-2">
                                  <input
                                    type="url"
                                    value={editVideoUrl}
                                    onChange={e => setEditVideoUrl(e.target.value)}
                                    placeholder="Tautan YouTube Shorts, Google Drive, atau MP4..."
                                    className="w-full px-2.5 py-1.5 bg-[#18181D] border border-amber-500/40 rounded text-zinc-200 text-xs focus:outline-none focus:border-amber-400 font-mono"
                                  />
                                  <label
                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded cursor-pointer shrink-0 flex items-center gap-1.5 text-xs transition-colors"
                                    title="Unggah Berkas MP4 Pengganti"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>{isUploadingEditVideo ? 'Mengunggah...' : 'Unggah MP4'}</span>
                                    <input
                                      type="file"
                                      accept="video/mp4,video/webm"
                                      onChange={handleUploadEditVideo}
                                      disabled={isUploadingEditVideo}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-500/20">
                                <button
                                  type="button"
                                  onClick={cancelEditVideo}
                                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs cursor-pointer"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={saveEditVideo}
                                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs shadow-md transition-colors cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Simpan Perubahan Video</span>
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#18181D] border border-zinc-800 hover:border-zinc-700 rounded-sm transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                #{idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-semibold text-white text-xs truncate">{vid.title}</h5>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    vid.orientation === 'portrait'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                                  }`}>
                                    {vid.orientation === 'portrait' ? 'Reels 9:16' : vid.orientation === 'landscape' ? '16:9 Landscape' : '4:5 Standard'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-500 font-mono truncate max-w-md mt-0.5">
                                  {vid.video_url}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                              {/* Reorder Buttons */}
                              <div className="flex items-center border border-zinc-800 rounded bg-[#141418] mr-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => moveVideoItem(idx, 'up')}
                                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                  title="Pindahkan Urutan ke Atas"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === videos.length - 1}
                                  onClick={() => moveVideoItem(idx, 'down')}
                                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                  title="Pindahkan Urutan ke Bawah"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Edit Video Button */}
                              <button
                                type="button"
                                onClick={() => startEditVideo(idx)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded text-[11px] font-medium transition-colors cursor-pointer"
                                title="Edit Judul, URL, atau Format Video Ini"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Video</span>
                              </button>

                              {/* Delete Video Button */}
                              <button
                                type="button"
                                onClick={() => removeVideoItem(idx)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-600/15 hover:bg-red-600/30 text-red-300 border border-red-600/30 rounded text-[11px] font-medium transition-colors cursor-pointer"
                                title="Hapus Video Ini dari Acara"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus Video</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-[11px] text-zinc-500 bg-[#141418] border border-dashed border-zinc-800 rounded">
                      Belum ada video yang ditambahkan untuk acara ini. Gunakan formulir di bawah jika ingin menambahkan video.
                    </div>
                  )}

                  {/* Form to Add a New Video */}
                  <div className="p-3 bg-[#121215] border border-zinc-800 rounded-sm space-y-3">
                    <span className="text-zinc-200 font-semibold text-xs block">
                      + Tambah Video Baru ke Acara Ini:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-zinc-400 block mb-1 text-[11px]">Judul / Keterangan Video</label>
                        <input
                          type="text"
                          placeholder="Misal: Reels Teaser 9:16, Sinematik Akad, dll"
                          value={newVideoTitle}
                          onChange={e => setNewVideoTitle(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#18181D] border border-zinc-800 rounded text-zinc-200 text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-zinc-400 block mb-1 text-[11px]">Format Orientasi Video</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setNewVideoOrientation('portrait')}
                            className={`py-1.5 px-2 rounded text-[11px] font-medium text-center transition-colors cursor-pointer ${
                              newVideoOrientation === 'portrait'
                                ? 'bg-amber-500 text-black font-bold'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            📱 9:16 Reels
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewVideoOrientation('landscape')}
                            className={`py-1.5 px-2 rounded text-[11px] font-medium text-center transition-colors cursor-pointer ${
                              newVideoOrientation === 'landscape'
                                ? 'bg-amber-500 text-black font-bold'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            🖥️ 16:9 Film
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewVideoOrientation('square')}
                            className={`py-1.5 px-2 rounded text-[11px] font-medium text-center transition-colors cursor-pointer ${
                              newVideoOrientation === 'square'
                                ? 'bg-amber-500 text-black font-bold'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            🔲 4:5 Feed
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-zinc-400 block mb-1 text-[11px]">Tautan URL atau Unggah Berkas MP4</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="Tautan YouTube Shorts, Google Drive preview, TikTok, atau MP4..."
                          value={newVideoUrl}
                          onChange={e => setNewVideoUrl(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#18181D] border border-zinc-800 rounded text-zinc-200 text-xs font-mono"
                        />
                        <label className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-semibold" title="Unggah Berkas Video MP4">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingVideo ? 'Mengunggah...' : 'Unggah MP4'}</span>
                          <input type="file" accept="video/mp4,video/webm" onChange={handleUploadVideo} disabled={isUploadingVideo} className="hidden" />
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={addVideoItem}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-sm text-xs cursor-pointer shadow transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambahkan Video ke Acara Ini</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Switches: Featured & Published */}
              <div className="pt-2 border-t border-zinc-800 flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={e => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C5A880]"
                  />
                  <span className="text-zinc-300">Tampilkan sebagai Karya Unggulan (Featured)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={e => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C5A880]"
                  />
                  <span className="text-zinc-300">Publikasikan Langsung ke Website</span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-[#C5A880] text-[#0C0C0D] font-semibold rounded text-xs uppercase tracking-wider"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Proyek Portofolio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
