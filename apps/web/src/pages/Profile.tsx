import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { githubApi, favoritesApi, Repository, Favorite } from '@/lib/api';
import { GitHubConnection } from '@/components/GitHubConnection';
import { RepoList } from '@/components/RepoList';
import { FavoritesList } from '@/components/FavoritesList';
import { Button } from '@/components/ui/button';
import { LogOut, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [githubConnected, setGithubConnected] = useState(false);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const favoriteIds = new Set(favorites.map((f) => f.repoId));

  const loadRepos = useCallback(async () => {
    if (!githubConnected) return;
    
    try {
      setReposLoading(true);
      setReposError(null);
      const data = await githubApi.getRepos();
      setRepos(data.repos);
    } catch (err) {
      setReposError(err instanceof Error ? err.message : 'Failed to load repositories');
    } finally {
      setReposLoading(false);
    }
  }, [githubConnected]);

  const loadFavorites = useCallback(async () => {
    try {
      const data = await favoritesApi.getAll();
      setFavorites(data.favorites);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    if (githubConnected) {
      loadRepos();
    }
  }, [githubConnected, loadRepos]);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await logout();
      navigate('/login');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to logout',
      });
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleToggleFavorite = async (repoId: string, repoName: string, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        // Optimistic update
        setFavorites((prev) => prev.filter((f) => f.repoId !== repoId));
        await favoritesApi.remove(repoId);
        toast({
          title: 'Removed from favorites',
          description: repoName,
        });
      } else {
        // Optimistic update
        const tempFavorite: Favorite = {
          id: `temp-${repoId}`,
          userId: user?.id || '',
          repoId,
          repoName,
          createdAt: new Date().toISOString(),
        };
        setFavorites((prev) => [...prev, tempFavorite]);
        
        const { favorite } = await favoritesApi.add(repoId, repoName);
        // Replace temp with real favorite
        setFavorites((prev) =>
          prev.map((f) => (f.id === tempFavorite.id ? favorite : f))
        );
        toast({
          title: 'Added to favorites',
          description: repoName,
        });
      }
    } catch (err) {
      // Revert on error
      loadFavorites();
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update favorite',
      });
    }
  };

  const handleRemoveFavorite = async (repoId: string) => {
    const fav = favorites.find((f) => f.repoId === repoId);
    if (fav) {
      handleToggleFavorite(repoId, fav.repoName, true);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <span className="text-lg font-bold text-primary-foreground">HB</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold">HelloBuild</h1>
              <p className="text-sm text-muted-foreground">GitHub Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user?.email}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logoutLoading}
            >
              {logoutLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sidebar */}
          <div className="space-y-6">
            <GitHubConnection onConnectionChange={setGithubConnected} />
            <FavoritesList
              favorites={favorites}
              repos={repos}
              onRemoveFavorite={handleRemoveFavorite}
            />
          </div>

          {/* Repositories */}
          <div className="lg:col-span-2">
            {githubConnected ? (
              <RepoList
                repos={repos}
                loading={reposLoading}
                error={reposError}
                favorites={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
              />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card p-12 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Connect GitHub</h3>
                <p className="mt-2 text-muted-foreground">
                  Connect your GitHub account to view and manage your repositories
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
