// Token stored in sessionStorage → auto-cleared when tab/browser closes
// Mitigates XSS persistence risk vs localStorage

const KEY = 'token';

export const getToken   = ()      => sessionStorage.getItem(KEY);
export const setToken   = (token) => sessionStorage.setItem(KEY, token);
export const clearToken = ()      => sessionStorage.removeItem(KEY);

// Decode JWT exp claim without any library
export const isTokenExpired = () => {
  const token = getToken();
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};
