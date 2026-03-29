/**
 * Tangle-me: CSRF Token Helper
 * Add this to your script.js or include as a separate file.
 * 
 * Usage:
 *   // Replace bare fetch() POST calls with csrfFetch():
 *   const resp = await csrfFetch('/api/post-ad.php', {
 *     method: 'POST',
 *     body: formData
 *   });
 */

let _csrfToken = null;

/**
 * Fetch a fresh CSRF token from the server
 */
async function fetchCsrfToken() {
    try {
        const resp = await fetch('/api/middleware/csrf.php?action=token');
        const data = await resp.json();
        _csrfToken = data.token;
        // Also update any meta tag
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) meta.content = _csrfToken;
        return _csrfToken;
    } catch (e) {
        console.error('Failed to fetch CSRF token:', e);
        return null;
    }
}

/**
 * Wrapper around fetch() that auto-includes the CSRF token
 * for POST/PUT/DELETE requests.
 */
async function csrfFetch(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    
    // Only add CSRF token for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        // Ensure we have a token
        if (!_csrfToken) {
            await fetchCsrfToken();
        }
        
        if (_csrfToken) {
            if (options.body instanceof FormData) {
                // Append to FormData
                options.body.append('csrf_token', _csrfToken);
            } else if (typeof options.body === 'string' || !options.body) {
                // Add as header for JSON requests
                options.headers = options.headers || {};
                options.headers['X-CSRF-Token'] = _csrfToken;
            }
        }
    }
    
    const resp = await fetch(url, options);
    
    // If we get a 403 CSRF error, refresh token and retry once
    if (resp.status === 403) {
        const data = await resp.clone().json().catch(() => null);
        if (data && data.error && data.error.includes('CSRF')) {
            await fetchCsrfToken();
            // Retry with new token
            if (_csrfToken) {
                if (options.body instanceof FormData) {
                    options.body.set('csrf_token', _csrfToken);
                } else {
                    options.headers = options.headers || {};
                    options.headers['X-CSRF-Token'] = _csrfToken;
                }
            }
            return fetch(url, options);
        }
    }
    
    return resp;
}

// Fetch initial CSRF token on page load
document.addEventListener('DOMContentLoaded', fetchCsrfToken);
