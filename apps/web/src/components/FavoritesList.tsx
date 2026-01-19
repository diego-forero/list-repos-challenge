import { Favorite, Repository } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink, Trash2 } from 'lucide-react';

interface FavoritesListProps {
  favorites: Favorite[];
  repos: Repository[];
  onRemoveFavorite: (repoId: string) => void;
}

export function FavoritesList({ favorites, repos, onRemoveFavorite }: FavoritesListProps) {
  const getRepoUrl = (repoId: string) => {
    const repo = repos.find((r) => r.id === repoId);
    return repo?.url;
  };

  if (favorites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-warning" />
            Favorite Repositories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-muted-foreground">
            No favorite repositories yet. Star some repos to see them here!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-warning text-warning" />
          Favorite Repositories ({favorites.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {favorites.map((fav) => {
          const repoUrl = getRepoUrl(fav.repoId);
          return (
            <div
              key={fav.id}
              className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Star className="h-4 w-4 shrink-0 fill-warning text-warning" />
                {repoUrl ? (
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline truncate"
                  >
                    {fav.repoName}
                  </a>
                ) : (
                  <span className="font-medium truncate">{fav.repoName}</span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {repoUrl && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveFavorite(fav.repoId)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
