import { useEffect, useState } from 'react';
import { githubApi, GitHubStatus } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';

interface GitHubConnectionProps {
  onConnectionChange: (connected: boolean) => void;
}

export function GitHubConnection({ onConnectionChange }: GitHubConnectionProps) {
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const data = await githubApi.getStatus();
      setStatus(data);
      onConnectionChange(data.connected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check GitHub status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = githubApi.getOAuthUrl();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
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
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub Connection
        </CardTitle>
        <CardDescription>
          Connect your GitHub account to view and manage your repositories
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status?.connected ? (
          <div className="flex items-center gap-3 rounded-lg bg-success/10 p-4">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div className="flex-1">
              <p className="font-medium text-foreground">Connected as</p>
              <a
                href={`https://github.com/${status.githubLogin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                @{status.githubLogin}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ) : (
          <Button onClick={handleConnect} className="btn-github w-full">
            <Github className="h-5 w-5" />
            Connect GitHub Account
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
