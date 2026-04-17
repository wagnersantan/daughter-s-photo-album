import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface DiaryEntry {
  id: string;
  month_number: number;
  title: string;
  content: string | null;
  highlights: string | null;
  photo_path: string | null;
}

const MONTH_COLORS = [
  'bg-bubblegum/30 border-primary/30',
  'bg-sunshine/30 border-accent/40',
  'bg-lavender/30 border-secondary/40',
  'bg-mint/30 border-mint/50',
  'bg-coral/20 border-coral/40',
];

export default function MonthlyDiary() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    supabase
      .from('monthly_diary')
      .select('*')
      .order('month_number', { ascending: true })
      .then(({ data }) => {
        if (data) setEntries(data);
      });
  }, []);

  if (entries.length === 0) return null;

  return (
    <section className="py-16 px-4 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl md:text-5xl font-display font-bold mb-3">
          <span className="bg-gradient-to-r from-primary to-coral bg-clip-text text-transparent">
            Diário Mensal
          </span>
        </h2>
        <p className="text-muted-foreground">Cada mês uma nova aventura 💫</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {entries.map((entry, i) => {
          const colorClass = MONTH_COLORS[i % MONTH_COLORS.length];
          const photoUrl = entry.photo_path
            ? supabase.storage.from('photos').getPublicUrl(entry.photo_path).data.publicUrl
            : null;

          return (
            <motion.article
              key={entry.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-3xl border-2 p-6 ${colorClass} shadow-soft hover:shadow-playful transition-all hover:-translate-y-1`}
            >
              <div className="absolute -top-4 -left-2 bg-primary text-primary-foreground rounded-full px-4 py-1.5 text-sm font-display font-bold shadow-playful">
                Mês {entry.month_number}
              </div>

              <h3 className="text-2xl font-display font-bold text-foreground mt-3 mb-3">
                {entry.title}
              </h3>

              {photoUrl && (
                <div className="photo-frame mb-4 rotate-[-1deg]">
                  <img src={photoUrl} alt={entry.title} className="w-full h-48 object-cover rounded-xl" />
                </div>
              )}

              {entry.content && (
                <p className="text-foreground/85 leading-relaxed whitespace-pre-wrap mb-3">
                  {entry.content}
                </p>
              )}

              {entry.highlights && (
                <div className="mt-4 p-3 bg-white/60 rounded-xl border border-white">
                  <p className="text-xs uppercase tracking-wider font-bold text-primary mb-1">
                    ✨ Marquinhos
                  </p>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{entry.highlights}</p>
                </div>
              )}
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
