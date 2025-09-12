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
  });

  if (!res.ok) {
    throw new Error(`Employee creation failed with ${res.status}`);
  }
  return res.json();
}

// get user by email and return details
export async function getAllEmployees() {
  const res = await fetch(`${apiUrl}/employee/`);

  if (!res.ok) {
    throw new Error(`Get all employees failed with ${res.status}`);
  }
  return res.json();
}
