export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ||
  'https://sportsschoolbackend-production.up.railway.app/v1';

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function createApiClient(token, onUnauthorized) {
  async function request(path, { method = 'GET', body, headers = {} } = {}) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(
        'No se pudo conectar. Revisa Internet y el origen CORS permitido en el backend.',
      );
    }

    const result = await response.json().catch(() => null);
    if (response.status === 401 && token) {
      onUnauthorized?.();
    }
    if (!response.ok) {
      const message = Array.isArray(result?.message)
        ? result.message.join(', ')
        : result?.message;
      throw new ApiError(
        typeof message === 'string'
          ? message
          : `La solicitud falló (HTTP ${response.status}).`,
        response.status,
      );
    }
    return result;
  }

  return {
    get: (path) => request(path),
    post: (path, body, headers) =>
      request(path, { method: 'POST', body, headers }),
  };
}

export function isExpiredSession(session) {
  return !session || !session.expiresAt || Date.now() >= session.expiresAt;
}

export function readStoredSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem('sportsSchoolAdminSession'));
    return isExpiredSession(value) ? null : value;
  } catch {
    return null;
  }
}
