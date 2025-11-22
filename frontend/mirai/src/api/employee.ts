const apiUrl = import.meta.env.VITE_API_URL;

export async function postEmployee(postRequest: {
  name: string;
  surname: string;
  email: string;
  title: string;
  description: string;
}) {
  const res = await fetch(`${apiUrl}/employee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postRequest),
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Employee creation failed with ${res.status}`);
  }
  return res.json();
}

export async function putEmployee(
  employeeId: number,
  putRequest: {
    name: string;
    surname: string;
    email: string;
    title: string;
    description: string;
  },
) {
  const res = await fetch(`${apiUrl}/employee/${employeeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(putRequest),
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Employee update failed with ${res.status}`);
  }
  return res.json();
}

export async function deleteEmployee(employeeId: number) {
  const res = await fetch(`${apiUrl}/employee/${employeeId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Employee delete failed with ${res.status}`);
  }
}

// get user by email and return details
export async function getAllEmployees() {
  const res = await fetch(`${apiUrl}/employee`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Get all employees failed with ${res.status}`);
  }
  return res.json();
}

export type GetEmployeeResponse = {
  employee_id: number;
  name: string;
  surname: string;
  email: string;
  title: string;
  description: string;
  created_at: string;
  last_login: string;
};
