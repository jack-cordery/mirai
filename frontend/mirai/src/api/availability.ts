import type {
  PostAvailabilitySlotRequest,
  PutAvailabilitySlotRequest,
} from "@/types/booking";

const apiUrl = import.meta.env.VITE_API_URL;

export async function postAvailabilitySlot(
  postRequest: PostAvailabilitySlotRequest,
) {
  const res = await fetch(`${apiUrl}/availability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postRequest),
  });

  if (!res.ok) {
    throw new Error(`availability slot creation failed with ${res.status}`);
  }
  return res.json();
}

export async function putAvailabilitySlot(
  putRequest: PutAvailabilitySlotRequest,
) {
  const res = await fetch(`${apiUrl}/availability`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(putRequest),
  });

  if (!res.ok) {
    throw new Error(`availability slot edit has failed with ${res.status}`);
  }
  return res.json();
}

export async function getAllAvailability() {
  const res = await fetch(`${apiUrl}/availability/`);

  if (!res.ok) {
    throw new Error(`Get all availability slots failed with ${res.status}`);
  }
  return res.json();
}
