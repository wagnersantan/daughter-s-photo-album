import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Copy, Crown } from 'lucide-react';

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

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'invites' | 'family' | 'categories' | 'timeline'>('invites');
  const [invites, setInvites] = useState<InviteLink[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('');

  // Milestone form
  const [msTitle, setMsTitle] = useState('');
  const [msDesc, setMsDesc] = useState('');
  const [msDate, setMsDate] = useState('');
  const [msIcon, setMsIcon] = useState('⭐');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [inv, prof, perm, rol, cat, ms] = await Promise.all([
      supabase.from('invite_links').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id, display_name'),
      supabase.from('user_permissions').select('*'),
      supabase.from('user_roles').select('*'),
      supabase.from('photo_categories').select('*').order('name'),
      supabase.from('milestones').select('*').order('milestone_date'),
    ]);
    if (inv.data) setInvites(inv.data);
    if (prof.data) setProfiles(prof.data);
    if (perm.data) setPermissions(perm.data);
    if (rol.data) setRoles(rol.data);
    if (cat.data) setCategories(cat.data);
    if (ms.data) setMilestones(ms.data);
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
    { key: 'family' as const, label: '👨‍👩‍👧 Família' },
    { key: 'categories' as const, label: '📁 Categorias' },
    { key: 'timeline' as const, label: '📅 Linha do Tempo' },
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
            <div className="space-y-2">
              {invites.map(inv => (
                <div key={inv.id} className="flex items-center justify-between bg-card p-3 rounded-lg border border-border">
                  <div>
                    <code className="text-sm font-mono text-foreground">{inv.code}</code>
                    <span className="ml-3 text-xs text-muted-foreground">
                      {inv.uses}/{inv.max_uses ?? '∞'} usos • {inv.active ? '✅ Ativo' : '❌ Inativo'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => copyCode(inv.code)} className="p-1.5 text-muted-foreground hover:text-foreground"><Copy className="w-4 h-4" /></button>
                    <button onClick={() => deleteInvite(inv.id)} className="p-1.5 text-destructive hover:opacity-80"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
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
      </div>
    </div>
  );
}
