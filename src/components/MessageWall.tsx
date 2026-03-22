import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profile?: { display_name: string };
}

export default function MessageWall() {
  const { user, permissions } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const fetchMessages = async () => {
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (!msgs) return;

    // Fetch profiles for all unique user_ids
    const userIds = [...new Set(msgs.map(m => m.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    setMessages(msgs.map(m => ({ ...m, profile: profileMap.get(m.user_id) })));
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase.from('messages').insert({
      content: newMessage.trim(),
      user_id: user.id,
    });

    if (error) toast.error('Erro ao enviar recado');
    else { setNewMessage(''); fetchMessages(); }
  };

  return (
    <section className="py-16 px-4 max-w-3xl mx-auto" id="recados">
      <h2 className="text-3xl font-display font-bold text-center text-foreground mb-8">💌 Mural de Recados</h2>

      {/* All messages are visible to everyone logged in */}
      <div className="space-y-4 mb-8">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum recado ainda. Deixe o primeiro!</p>
        ) : (
          messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="bg-card p-4 rounded-lg border border-border"
            >
              <p className="text-foreground">{msg.content}</p>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{msg.profile?.display_name || 'Familiar'}</span>
                <span>{new Date(msg.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Send form - visible to those with permission */}
      {permissions.send_messages && (
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Escreva um recado para a Sophia..."
            className="flex-1 px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition">
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </section>
  );
}
