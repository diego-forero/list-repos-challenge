import { useState, useMemo } from 'react';
import { Repository } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Star,
  GitFork,
  Lock,
  Globe,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RepoListProps {
  repos: Repository[];
  loading: boolean;
  error: string | null;
  favorites: Set<string>;
  onToggleFavorite: (repoId: string, repoName: string, isFavorite: boolean) => void;
}

export function RepoList({ repos, loading, error, favorites, onToggleFavorite }: RepoListProps) {
  const [search, setSearch] = useState('');

  const filteredRepos = useMemo(() => {
    if (!search.trim()) return repos;
    const query = search.toLowerCase();
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.nameWithOwner.toLowerCase().includes(query)
    );
  }, [repos, search]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="py-6 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Repositories ({repos.length})</span>
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {filteredRepos.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            {search ? 'No repositories match your search' : 'No repositories found'}
          </p>
        ) : (
          filteredRepos.map((repo) => {
            const isFavorite = favorites.has(repo.id);
            return (
              <div
                key={repo.id}
                className="group flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary hover:underline truncate"
                    >
                      {repo.nameWithOwner}
                    </a>
                    {repo.isPrivate ? (
                      <Badge variant="secondary" className="shrink-0">
                        <Lock className="mr-1 h-3 w-3" />
                        Private
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0">
                        <Globe className="mr-1 h-3 w-3" />
                        Public
                      </Badge>
                    )}
                  </div>
                  {repo.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {repo.primaryLanguage && (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        {repo.primaryLanguage.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {repo.stargazerCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="h-3 w-3" />
                      {repo.forkCount}
                    </span>
                    <span>
                      Updated {formatDistanceToNow(new Date(repo.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant={isFavorite ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleFavorite(repo.id, repo.nameWithOwner, isFavorite)}
                  >
                    <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                    {isFavorite ? 'Favorited' : 'Favorite'}
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={repo.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
