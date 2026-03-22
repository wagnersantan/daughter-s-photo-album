import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  milestone_date: string;
  icon: string | null;
}

export default function Timeline() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    supabase
      .from('milestones')
      .select('*')
      .order('milestone_date', { ascending: true })
      .then(({ data }) => {
        if (data) setMilestones(data);
      });
  }, []);

  if (milestones.length === 0) return null;

  return (
    <section className="py-16 px-4 max-w-4xl mx-auto">
      <h2 className="text-3xl font-display font-bold text-center text-foreground mb-12">
        Linha do Tempo
      </h2>
      <div className="relative">
        <div className="absolute left-1/2 -translate-x-px w-0.5 h-full bg-border" />
        <div className="space-y-12">
          {milestones.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`flex items-center gap-4 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
            >
              <div className={`flex-1 ${i % 2 === 0 ? 'text-right' : 'text-left'}`}>
                <div className="bg-card p-4 rounded-lg inline-block">
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.milestone_date).toLocaleDateString('pt-BR')}
                  </p>
                  <h3 className="font-display font-semibold text-foreground">{m.title}</h3>
                  {m.description && <p className="text-sm text-muted-foreground mt-1">{m.description}</p>}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-lg shrink-0 z-10">
                {m.icon || '⭐'}
              </div>
              <div className="flex-1" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
