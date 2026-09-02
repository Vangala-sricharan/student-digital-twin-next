/**
 * Strict GitHub Profile URL Validator conforming to V3 Specification.
 */
export interface GitHubUrlValidationResult {
  valid: boolean;
  username?: string;
  normalizedUrl?: string;
  error?: string;
}

const RESERVED_GITHUB_PATHS = new Set([
  'explore',
  'features',
  'enterprise',
  'pricing',
  'settings',
  'orgs',
  'organizations',
  'topics',
  'trending',
  'collections',
  'events',
  'marketplace',
  'security',
  'login',
  'join',
  'pulls',
  'issues',
  'notifications',
]);

export function validateGitHubProfileUrl(rawInput: string): GitHubUrlValidationResult {
  const trimmed = (rawInput || '').trim();

  if (!trimmed) {
    return {
      valid: false,
      error: 'INVALID GITHUB URL\nPlease enter a valid GitHub profile URL.',
    };
  }

  // Must contain github.com domain
  let urlString = trimmed;
  if (!/^https?:\/\//i.test(urlString)) {
    if (urlString.startsWith('github.com/') || urlString.startsWith('www.github.com/')) {
      urlString = 'https://' + urlString;
    } else {
      return {
        valid: false,
        error: 'INVALID GITHUB URL\nPlease enter a valid GitHub profile URL (e.g. https://github.com/username).',
      };
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return {
      valid: false,
      error: 'INVALID GITHUB URL\nPlease enter a valid GitHub profile URL.',
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== 'github.com' && hostname !== 'www.github.com') {
    return {
      valid: false,
      error: 'INVALID GITHUB URL\nDomain must be github.com (e.g. https://github.com/username).',
    };
  }

  // Path segments analysis
  const segments = parsed.pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return {
      valid: false,
      error: 'INVALID GITHUB URL\nPlease provide a username in the GitHub profile URL (e.g. https://github.com/username).',
    };
  }

  if (segments.length > 1) {
    return {
      valid: false,
      error: 'INVALID GITHUB PROFILE URL\nPlease provide a user profile URL, not a repository or sub-path (e.g. https://github.com/username).',
    };
  }

  const username = segments[0];

  if (RESERVED_GITHUB_PATHS.has(username.toLowerCase())) {
    return {
      valid: false,
      error: 'INVALID GITHUB PROFILE URL\nProvided path is a reserved GitHub system route.',
    };
  }

  // GitHub usernames: 1-39 chars alphanumeric or single hyphens
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username)) {
    return {
      valid: false,
      error: 'INVALID GITHUB URL\nUsername contains invalid characters.',
    };
  }

  return {
    valid: true,
    username,
    normalizedUrl: `https://github.com/${username}`,
  };
}
