const apiUrl = import.meta.env.VITE_API_URL;

export async function postLogin(postRequest: {
  email: string;
  password: string;
}) {
  const res = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postRequest),
  });

  if (!res.ok) {
    throw new Error(`Login failed with ${res.status}`);
  }
  return res.json();
}

export type Permissions = {
  role: ("USER" | "ADMIN")[];
};

export type LoginResponse = {
  message: string;
  email: string;
  id: number;
  permissions: Permissions;
};

export async function postLogout() {
  const res = await fetch(`${apiUrl}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Logout failed with ${res.status}`);
  }
  return res.json();
}

export type LogoutResponse = {
  message: string;
};

export async function postRegister(postRequest: {
  name: string;
  surname: string;
  email: string;
  password: string;
}) {
  const res = await fetch(`${apiUrl}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postRequest),
  });

  if (!res.ok) {
    throw new Error(`Register failed with ${res.status}`);
  }
  return res.json();
}

export type RegisterResponse = {
  message: string;
};

export async function getSessionStatus() {
  const res = await fetch(`${apiUrl}/auth/session/status`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Logout failed with ${res.status}`);
  }
  return res.json();
}

export type SessionStatusResponse = {
  userID: number;
  email: string;
  permissions: Permissions;
};

export async function postSessionRefresh() {
  const res = await fetch(`${apiUrl}/auth/session/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Logout failed with ${res.status}`);
  }
  return res.json();
}
