import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Copy, Crown, Send } from 'lucide-react';

interface Profile {
  user_id: string;
  display_name: string;
}

interface InviteLink {
  id: string;
  code: string;
  uses: number;
  max_uses: number | null;
  active: boolean;
}

interface Permission {
  user_id: string;
  view_photos: boolean;
  upload_photos: boolean;
  send_messages: boolean;
  manage_users: boolean;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface Category {
  id: string;
  name: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  milestone_date: string;
  icon: string | null;
}

interface DiaryEntry {
  id: string;
  month_number: number;
  title: string;
  content: string | null;
  highlights: string | null;
}

interface SendLog {
  id: string;
  invite_code: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  relation: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'invites' | 'family' | 'categories' | 'timeline' | 'diary' | 'logs'>('invites');
  const [sendLogs, setSendLogs] = useState<SendLog[]>([]);
  const [invites, setInvites] = useState<InviteLink[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendForm, setSendForm] = useState<Record<string, { name: string; phone: string; relation: string }>>({});
  const [flowEnabled, setFlowEnabled] = useState<boolean>(true);
  const [togglingFlow, setTogglingFlow] = useState(false);

  // Milestone form
  const [msTitle, setMsTitle] = useState('');
  const [msDesc, setMsDesc] = useState('');
  const [msDate, setMsDate] = useState('');
  const [msIcon, setMsIcon] = useState('⭐');

  // Diary form
  const [dMonth, setDMonth] = useState('');
  const [dTitle, setDTitle] = useState('');
  const [dContent, setDContent] = useState('');
  const [dHighlights, setDHighlights] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [inv, prof, perm, rol, cat, ms, di, logs, settings] = await Promise.all([
      supabase.from('invite_links').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id, display_name'),
      supabase.from('user_permissions').select('*'),
      supabase.from('user_roles').select('*'),
      supabase.from('photo_categories').select('*').order('name'),
      supabase.from('milestones').select('*').order('milestone_date'),
      supabase.from('monthly_diary').select('*').order('month_number'),
      supabase.from('invite_send_logs').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('site_settings').select('value').eq('key', 'n8n_flow_enabled').maybeSingle(),
    ]);
    if (inv.data) setInvites(inv.data);
    if (prof.data) setProfiles(prof.data);
    if (perm.data) setPermissions(perm.data);
    if (rol.data) setRoles(rol.data);
    if (cat.data) setCategories(cat.data);
    if (ms.data) setMilestones(ms.data);
    if (di.data) setDiary(di.data);
    if (logs.data) setSendLogs(logs.data);
    setFlowEnabled((settings.data?.value ?? 'true') === 'true');
  };

  const toggleFlow = async () => {
    setTogglingFlow(true);
    const next = !flowEnabled;
    const { error } = await supabase
      .from('site_settings')
      .update({ value: next ? 'true' : 'false' })
      .eq('key', 'n8n_flow_enabled');
    setTogglingFlow(false);
    if (error) {
      toast.error('Erro ao alterar fluxo: ' + error.message);
      return;
    }
    setFlowEnabled(next);
    toast.success(next ? '✅ Fluxo de envio LIGADO' : '🛑 Fluxo de envio DESLIGADO');
  };

  const saveDiaryEntry = async () => {
    const monthNum = parseInt(dMonth);
    if (!monthNum || !dTitle.trim()) {
      toast.error('Informe o número do mês e o título');
      return;
    }
    const existing = diary.find(d => d.month_number === monthNum);
    if (existing) {
      const { error } = await supabase.from('monthly_diary').update({
        title: dTitle.trim(),
        content: dContent.trim() || null,
        highlights: dHighlights.trim() || null,
      }).eq('id', existing.id);
      if (error) toast.error('Erro ao atualizar');
      else { toast.success('Mês atualizado!'); resetDiaryForm(); fetchAll(); }
    } else {
      const { error } = await supabase.from('monthly_diary').insert({
        month_number: monthNum,
        title: dTitle.trim(),
        content: dContent.trim() || null,
        highlights: dHighlights.trim() || null,
        created_by: user?.id,
      });
      if (error) toast.error('Erro ao criar entrada');
      else { toast.success('Mês adicionado!'); resetDiaryForm(); fetchAll(); }
    }
  };

  const editDiaryEntry = (entry: DiaryEntry) => {
    setDMonth(String(entry.month_number));
    setDTitle(entry.title);
    setDContent(entry.content || '');
    setDHighlights(entry.highlights || '');
  };

  const resetDiaryForm = () => {
    setDMonth(''); setDTitle(''); setDContent(''); setDHighlights('');
  };

  const deleteDiaryEntry = async (id: string) => {
    await supabase.from('monthly_diary').delete().eq('id', id);
    toast.success('Entrada removida');
    fetchAll();
  };

  const createInvite = async () => {
    const maxUses = newMaxUses ? parseInt(newMaxUses) : null;
    const { error } = await supabase.from('invite_links').insert({
      created_by: user?.id,
      max_uses: maxUses,
    });
    if (error) toast.error('Erro ao criar convite');
    else { toast.success('Convite criado!'); setNewMaxUses(''); fetchAll(); }
  };

  const deleteInvite = async (id: string) => {
    await supabase.from('invite_links').delete().eq('id', id);
    toast.success('Convite removido');
    fetchAll();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  const copyInviteUrl = (code: string) => {
    const url = `https://albumsophia.lovable.app/register?invite=${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const sendInviteToN8n = async (inviteId: string) => {
    const form = sendForm[inviteId] || { name: '', phone: '', relation: '' };
    setSendingId(inviteId);
    try {
      const { data, error } = await supabase.functions.invoke('send-invite-n8n', {
        body: {
          invite_id: inviteId,
          recipient_name: form.name || null,
          recipient_phone: form.phone || null,
          relation: form.relation || null,
        },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      toast.success('Convite enviado para o n8n! 📲');
      setSendForm(prev => ({ ...prev, [inviteId]: { name: '', phone: '', relation: '' } }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Falha ao enviar: ' + msg);
    } finally {
      setSendingId(null);
    }
  };

  const togglePermission = async (userId: string, field: keyof Permission, value: boolean) => {
    await supabase.from('user_permissions').update({ [field]: !value }).eq('user_id', userId);
    fetchAll();
  };

  const promoteToAdmin = async (userId: string) => {
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' as const });
    if (error) toast.error('Erro ao promover');
    else { toast.success('Usuário promovido a admin!'); fetchAll(); }
  };

  const demoteFromAdmin = async (userId: string) => {
    await supabase.from('user_roles').delete().eq('user_id', userId);
    toast.success('Admin removido');
    fetchAll();
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const { error } = await supabase.from('photo_categories').insert({ name: newCategory.trim(), created_by: user?.id });
    if (error) toast.error('Erro ao criar categoria');
    else { toast.success('Categoria criada!'); setNewCategory(''); fetchAll(); }
  };

  const deleteCategory = async (id: string) => {
    await supabase.from('photo_categories').delete().eq('id', id);
    toast.success('Categoria removida');
    fetchAll();
  };

  const addMilestone = async () => {
    if (!msTitle.trim() || !msDate) return;
    const { error } = await supabase.from('milestones').insert({
      title: msTitle.trim(),
      description: msDesc.trim() || null,
      milestone_date: msDate,
      icon: msIcon || '⭐',
      created_by: user?.id,
    });
    if (error) toast.error('Erro ao criar marco');
    else { toast.success('Marco adicionado!'); setMsTitle(''); setMsDesc(''); setMsDate(''); setMsIcon('⭐'); fetchAll(); }
  };

  const deleteMilestone = async (id: string) => {
    await supabase.from('milestones').delete().eq('id', id);
    toast.success('Marco removido');
    fetchAll();
  };

  const isUserAdmin = (userId: string) => roles.some(r => r.user_id === userId && r.role === 'admin');
  const getName = (userId: string) => profiles.find(p => p.user_id === userId)?.display_name || 'Sem nome';

  const tabs = [
    { key: 'invites' as const, label: '🔗 Convites' },
    { key: 'logs' as const, label: '📨 Envios' },
    { key: 'family' as const, label: '👨‍👩‍👧 Família' },
    { key: 'categories' as const, label: '📁 Categorias' },
    { key: 'timeline' as const, label: '📅 Linha do Tempo' },
    { key: 'diary' as const, label: '📖 Diário Mensal' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-display font-bold text-foreground">Painel Admin</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Invites Tab */}
        {tab === 'invites' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={newMaxUses}
                onChange={e => setNewMaxUses(e.target.value)}
                placeholder="Máx. usos (vazio = ilimitado)"
                type="number"
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground w-48"
              />
              <button onClick={createInvite} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Criar Convite
              </button>
            </div>
            <div className="space-y-3">
              {invites.map(inv => {
                const form = sendForm[inv.id] || { name: '', phone: '', relation: '' };
                const updateForm = (field: 'name' | 'phone' | 'relation', val: string) =>
                  setSendForm(prev => ({ ...prev, [inv.id]: { ...form, [field]: val } }));
                return (
                  <div key={inv.id} className="bg-card p-4 rounded-lg border border-border space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <code className="text-sm font-mono text-foreground">{inv.code}</code>
                        <span className="ml-3 text-xs text-muted-foreground">
                          {inv.uses}/{inv.max_uses ?? '∞'} usos • {inv.active ? '✅ Ativo' : '❌ Inativo'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => copyCode(inv.code)} title="Copiar código" className="p-1.5 text-muted-foreground hover:text-foreground"><Copy className="w-4 h-4" /></button>
                        <button onClick={() => copyInviteUrl(inv.code)} title="Copiar link" className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:opacity-80">🔗 Link</button>
                        <button onClick={() => deleteInvite(inv.id)} title="Remover" className="p-1.5 text-destructive hover:opacity-80"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border">
                      <input
                        value={form.name}
                        onChange={e => updateForm('name', e.target.value)}
                        placeholder="Nome (ex: Vovó)"
                        className="px-2 py-1.5 text-sm border border-input rounded-md bg-background text-foreground"
                      />
                      <input
                        value={form.phone}
                        onChange={e => updateForm('phone', e.target.value)}
                        placeholder="WhatsApp +55..."
                        className="px-2 py-1.5 text-sm border border-input rounded-md bg-background text-foreground"
                      />
                      <input
                        value={form.relation}
                        onChange={e => updateForm('relation', e.target.value)}
                        placeholder="Parentesco (avó, tio...)"
                        className="px-2 py-1.5 text-sm border border-input rounded-md bg-background text-foreground"
                      />
                    </div>
                    <button
                      onClick={() => sendInviteToN8n(inv.id)}
                      disabled={sendingId === inv.id}
                      className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition inline-flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {sendingId === inv.id ? 'Enviando...' : 'Enviar via WhatsApp (n8n)'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Send Logs Tab */}
        {tab === 'logs' && (
          <div className="space-y-2">
            {sendLogs.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhum envio registrado ainda</p>}
            {sendLogs.map(log => (
              <div key={log.id} className="bg-card p-3 rounded-lg border border-border text-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      log.status === 'sent' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
                      log.status === 'failed' ? 'bg-destructive/20 text-destructive' :
                      'bg-secondary text-secondary-foreground'
                    }`}>
                      {log.status === 'sent' ? '✅ Enviado' : log.status === 'failed' ? '❌ Falhou' : '⏳ ' + log.status}
                    </span>
                    <span className="font-medium text-foreground">{log.recipient_name || 'Sem nome'}</span>
                    {log.relation && <span className="text-xs text-muted-foreground">({log.relation})</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  📱 {log.recipient_phone || '—'} • 🔗 <code>{log.invite_code}</code>
                </div>
                {log.error_message && (
                  <div className="mt-1 text-xs text-destructive">Erro: {log.error_message}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Family Tab */}
        {tab === 'family' && (
          <div className="space-y-3">
            {profiles.filter(p => p.user_id !== user?.id).map(p => {
              const perm = permissions.find(x => x.user_id === p.user_id);
              const admin = isUserAdmin(p.user_id);
              return (
                <div key={p.user_id} className="bg-card p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{p.display_name}</span>
                      {admin && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Admin</span>}
                    </div>
                    {admin ? (
                      <button onClick={() => demoteFromAdmin(p.user_id)} className="text-xs px-3 py-1 border border-destructive text-destructive rounded hover:bg-destructive hover:text-destructive-foreground transition">
                        Remover Admin
                      </button>
                    ) : (
                      <button onClick={() => promoteToAdmin(p.user_id)} className="text-xs px-3 py-1 border border-primary text-primary rounded hover:bg-primary hover:text-primary-foreground transition inline-flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Tornar Admin
                      </button>
                    )}
                  </div>
                  {perm && !admin && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        { key: 'view_photos' as const, label: 'Ver fotos' },
                        { key: 'upload_photos' as const, label: 'Enviar fotos' },
                        { key: 'send_messages' as const, label: 'Enviar recados' },
                        { key: 'manage_users' as const, label: 'Gerenciar usuários' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={perm[key] as boolean}
                            onChange={() => togglePermission(p.user_id, key, perm[key] as boolean)}
                            className="rounded accent-primary"
                          />
                          <span className="text-foreground">{label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Categories Tab */}
        {tab === 'categories' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                placeholder="Nome da categoria..."
                className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground"
                onKeyDown={e => e.key === 'Enter' && addCategory()}
              />
              <button onClick={addCategory} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between bg-card p-3 rounded-lg border border-border">
                  <span className="text-foreground">{cat.name}</span>
                  <button onClick={() => deleteCategory(cat.id)} className="p-1.5 text-destructive hover:opacity-80">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {categories.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhuma categoria criada</p>}
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {tab === 'timeline' && (
          <div className="space-y-6">
            <div className="bg-card p-4 rounded-lg border border-border space-y-3">
              <h3 className="font-display font-semibold text-foreground">Novo Marco</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={msTitle} onChange={e => setMsTitle(e.target.value)} placeholder="Título" className="px-3 py-2 border border-input rounded-md bg-background text-foreground" />
                <input value={msDate} onChange={e => setMsDate(e.target.value)} type="date" className="px-3 py-2 border border-input rounded-md bg-background text-foreground" />
                <input value={msIcon} onChange={e => setMsIcon(e.target.value)} placeholder="Emoji ícone" className="px-3 py-2 border border-input rounded-md bg-background text-foreground" />
                <input value={msDesc} onChange={e => setMsDesc(e.target.value)} placeholder="Descrição (opcional)" className="px-3 py-2 border border-input rounded-md bg-background text-foreground" />
              </div>
              <button onClick={addMilestone} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Adicionar Marco
              </button>
            </div>

            <div className="space-y-2">
              {milestones.map(ms => (
                <div key={ms.id} className="flex items-center justify-between bg-card p-3 rounded-lg border border-border">
                  <div>
                    <span className="mr-2">{ms.icon}</span>
                    <span className="font-medium text-foreground">{ms.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{new Date(ms.milestone_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <button onClick={() => deleteMilestone(ms.id)} className="p-1.5 text-destructive hover:opacity-80">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diary Tab */}
        {tab === 'diary' && (
          <div className="space-y-6">
            <div className="bg-card p-4 rounded-lg border border-border space-y-3">
              <h3 className="font-display font-semibold text-foreground">
                {dMonth && diary.find(d => d.month_number === parseInt(dMonth)) ? 'Editar mês' : 'Novo mês'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  value={dMonth}
                  onChange={e => setDMonth(e.target.value)}
                  type="number"
                  min="1"
                  placeholder="Nº (ex: 2)"
                  className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
                />
                <input
                  value={dTitle}
                  onChange={e => setDTitle(e.target.value)}
                  placeholder="Título (ex: Dois Meses)"
                  className="px-3 py-2 border border-input rounded-md bg-background text-foreground sm:col-span-2"
                />
              </div>
              <textarea
                value={dContent}
                onChange={e => setDContent(e.target.value)}
                placeholder="Como foi este mês? Conte tudo..."
                rows={5}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none"
              />
              <textarea
                value={dHighlights}
                onChange={e => setDHighlights(e.target.value)}
                placeholder="✨ Marquinhos / descobertas (sorriu, segurou a cabeça, etc.)"
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none"
              />
              <div className="flex gap-2">
                <button onClick={saveDiaryEntry} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Salvar mês
                </button>
                {dMonth && (
                  <button onClick={resetDiaryForm} className="px-4 py-2 border border-input text-foreground rounded-md hover:bg-secondary transition">
                    Limpar
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {diary.map(d => (
                <div key={d.id} className="flex items-center justify-between bg-card p-3 rounded-lg border border-border">
                  <div className="flex-1">
                    <span className="font-bold text-primary">Mês {d.month_number}</span>
                    <span className="ml-2 font-medium text-foreground">{d.title}</span>
                    {d.content && <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{d.content}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editDiaryEntry(d)} className="px-2 py-1 text-xs border border-primary text-primary rounded hover:bg-primary hover:text-primary-foreground transition">
                      Editar
                    </button>
                    <button onClick={() => deleteDiaryEntry(d.id)} className="p-1.5 text-destructive hover:opacity-80">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {diary.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhum mês registrado ainda</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
