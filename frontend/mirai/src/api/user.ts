const apiUrl = import.meta.env.VITE_API_URL;

export async function postUser(postRequest: {
  name: string;
  surname: string;
  email: string;
}) {
  const res = await fetch(`${apiUrl}/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postRequest),
  });

  if (!res.ok) {
    throw new Error(`User creation failed with ${res.status}`);
  }
  return res.json();
}

// get user by email and return details
export async function checkUser(postRequest: { email: string }) {
  const res = await fetch(`${apiUrl}/userByEmail?email=${postRequest.email}`);

  if (!res.ok) {
    throw new Error(`User check failed with ${res.status}`);
  }
  return res.json();
}
