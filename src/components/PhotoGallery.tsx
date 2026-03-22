import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Photo {
  id: string;
  storage_path: string;
  caption: string | null;
  user_id: string;
  created_at: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

export default function PhotoGallery() {
  const { user, permissions, isAdmin } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = async () => {
    let query = supabase.from('photos').select('*').order('created_at', { ascending: false });
    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }
    const { data } = await query;
    if (data) setPhotos(data);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('photo_categories').select('*').order('name');
    if (data) setCategories(data);
  };

  useEffect(() => {
    fetchPhotos();
    fetchCategories();
  }, [selectedCategory]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from('photos').upload(path, file);
    if (uploadErr) { toast.error('Erro ao enviar foto'); setUploading(false); return; }

    const { error: insertErr } = await supabase.from('photos').insert({
      user_id: user.id,
      storage_path: path,
      caption: '',
      category_id: selectedCategory !== 'all' ? selectedCategory : null,
    });

    if (insertErr) toast.error('Erro ao salvar foto');
    else { toast.success('Foto enviada!'); fetchPhotos(); }
    setUploading(false);
  };

  const handleDelete = async (photo: Photo) => {
    await supabase.storage.from('photos').remove([photo.storage_path]);
    await supabase.from('photos').delete().eq('id', photo.id);
    toast.success('Foto removida');
    fetchPhotos();
  };

  const handleSaveCaption = async (photoId: string) => {
    await supabase.from('photos').update({ caption: captionText }).eq('id', photoId);
    setEditingCaption(null);
    toast.success('Legenda salva!');
    fetchPhotos();
  };

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <section className="py-16 px-4 max-w-6xl mx-auto" id="fotos">
      <h2 className="text-3xl font-display font-bold text-center text-foreground mb-4">📸 Galeria de Fotos</h2>

      {/* Category filter */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
            selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'
          }`}
        >
          Todas
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Upload button */}
      {permissions.upload_photos && (
        <div className="text-center mb-8">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Enviando...' : 'Enviar Foto'}
          </button>
        </div>
      )}

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Nenhuma foto ainda. Seja o primeiro a compartilhar!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo, i) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="photo-frame group"
            >
              <div className="relative aspect-square overflow-hidden rounded">
                <img
                  src={getPhotoUrl(photo.storage_path)}
                  alt={photo.caption || 'Foto da Sophia'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {(user?.id === photo.user_id || isAdmin) && (
                  <button
                    onClick={() => handleDelete(photo)}
                    className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Caption */}
              <div className="mt-2 min-h-[2rem]">
                {editingCaption === photo.id ? (
                  <div className="flex gap-1">
                    <input
                      value={captionText}
                      onChange={e => setCaptionText(e.target.value)}
                      className="flex-1 text-xs px-2 py-1 border border-input rounded bg-background text-foreground"
                      placeholder="Escreva a legenda..."
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleSaveCaption(photo.id)}
                    />
                    <button onClick={() => handleSaveCaption(photo.id)} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">
                      ✓
                    </button>
                  </div>
                ) : (
                  <p
                    onClick={() => {
                      if (user?.id === photo.user_id || isAdmin) {
                        setEditingCaption(photo.id);
                        setCaptionText(photo.caption || '');
                      }
                    }}
                    className={`text-xs text-muted-foreground text-center italic ${
                      (user?.id === photo.user_id || isAdmin) ? 'cursor-pointer hover:text-foreground' : ''
                    }`}
                  >
                    {photo.caption || (user?.id === photo.user_id || isAdmin ? 'Clique para adicionar legenda' : '')}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
