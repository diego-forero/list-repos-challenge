const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface FetchOptions extends RequestInit {
  body?: string;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }

  return data;
}

// Auth API
export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  user: User;
}

export const authApi = {
  signup: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    apiFetch<void>('/auth/logout', {
      method: 'POST',
    }),

  me: () => apiFetch<AuthResponse>('/auth/me'),
};

// GitHub API
export interface GitHubStatus {
  connected: boolean;
  githubLogin?: string;
  githubUserId?: string;
}

export interface Repository {
  id: string;
  name: string;
  nameWithOwner: string;
  url: string;
  isPrivate: boolean;
  updatedAt: string;
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string } | null;
}

export interface ReposResponse {
  repos: Repository[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string;
  };
}

export const githubApi = {
  getStatus: () => apiFetch<GitHubStatus>('/github/me'),
  
  getRepos: () => apiFetch<ReposResponse>('/github/repos'),
  
  getOAuthUrl: () => `${API_URL}/github/oauth/start`,
};

// Favorites API
export interface Favorite {
  id: string;
  userId: string;
  repoId: string;
  repoName: string;
  createdAt: string;
}

export interface FavoritesResponse {
  favorites: Favorite[];
}

export const favoritesApi = {
  getAll: () => apiFetch<FavoritesResponse>('/favorites'),

  add: (repoId: string, repoName: string) =>
    apiFetch<{ favorite: Favorite }>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ repoId, repoName }),
    }),

  remove: (repoId: string) =>
    apiFetch<void>(`/favorites/${repoId}`, {
      method: 'DELETE',
    }),
};
