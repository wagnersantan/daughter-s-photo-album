import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Verify invite code
    const { data: invite, error: inviteError } = await supabase
      .from('invite_links')
      .select('*')
      .eq('code', inviteCode)
      .eq('active', true)
      .maybeSingle();

    if (inviteError || !invite) {
      toast.error('Código de convite inválido ou expirado');
      setLoading(false);
      return;
    }

    if (invite.max_uses && invite.uses >= invite.max_uses) {
      toast.error('Este convite já atingiu o limite de usos');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Increment invite uses
    await supabase
      .from('invite_links')
      .update({ uses: invite.uses + 1 })
      .eq('id', invite.id);

    toast.success('Conta criada! Verifique seu email para confirmar.');
    setLoading(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold text-foreground">👶 Criar Conta</h1>
          <p className="mt-2 text-muted-foreground">Você precisa de um convite para participar</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Código de Convite</label>
            <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)} required
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Seu Nome</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition">
            {loading ? 'Criando conta...' : 'Cadastrar'}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Já tem conta? <Link to="/login" className="text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
