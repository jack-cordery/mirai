const apiUrl = import.meta.env.VITE_API_URL;

export async function postBookingType(postRequest: {
  title: string;
  description: string;
  fixed: boolean;
  cost: number;
}) {
  const res = await fetch(`${apiUrl}/booking_type`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postRequest),
  });

  if (!res.ok) {
    throw new Error(`creating booking type failed with ${res.status}`);
  }
  return res.json();
}

// get user by email and return details
export async function getAllBookingTypes() {
  const res = await fetch(`${apiUrl}/booking_type/`);

  if (!res.ok) {
    throw new Error(`Get all booking types failed with ${res.status}`);
  }
  return res.json();
}
