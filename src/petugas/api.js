function getToken() {
  return (
    window.localStorage.getItem("mcis_token") ||
    window.sessionStorage.getItem("mcis_token")
  );
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok || json?.success === false) {
    const error = new Error(json?.message || `Permintaan gagal (status ${res.status}).`);
    error.errors = json?.errors || {};
    throw error;
  }
  return json?.data;
}
