import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';

export default function Navbar() {
  const { user, isAdmin, profile, signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-display text-lg font-bold text-foreground">👶 Sophia</Link>
        <div className="flex items-center gap-3">
          {profile && <span className="text-sm text-muted-foreground hidden sm:block">{profile.display_name}</span>}
          {isAdmin && (
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition">
              <Settings className="w-5 h-5" />
            </Link>
          )}
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground transition">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
