const apiUrl = import.meta.env.VITE_API_URL;

export async function postBookingType(postRequest: {
  title: string;
  description: string;
  fixed: boolean;
  cost: number;
  duration: number;
}) {
  const res = await fetch(`${apiUrl}/booking_type`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postRequest),
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`creating booking type failed with ${res.status}`);
  }
  return res.json();
}

export async function putBookingType(
  id: number,
  putRequest: {
    title: string;
    description: string;
    fixed: boolean;
    cost: number;
    duration: number;
  },
) {
  const res = await fetch(`${apiUrl}/booking_type/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(putRequest),
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`updating booking type failed with ${res.status}`);
  }
  return res.json();
}

export async function deleteBookingType(id: number) {
  const res = await fetch(`${apiUrl}/booking_type/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`deleting booking type failed with ${res.status}`);
  }
}

// get user by email and return details
export async function getAllBookingTypes() {
  const res = await fetch(`${apiUrl}/booking_type`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Get all booking types failed with ${res.status}`);
  }
  return res.json();
}

export type GetBookingTypeResponse = {
  type_id: number;
  title: string;
  description: string;
  fixed: boolean;
  cost: number;
  duration: number;
  created_at: string;
  last_edited: string;
};
