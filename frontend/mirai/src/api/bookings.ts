const apiUrl = import.meta.env.VITE_API_URL;

export async function postBooking(postRequest: {
  user_id: number;
  availability_slots: number[];
  type_id: number;
  notes: string;
}) {
  const res = await fetch(`${apiUrl}/booking`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postRequest),
  });

  if (!res.ok) {
    throw new Error(`creating booking failed with ${res.status}`);
  }
  return res.json();
}

export type PostBookingResponse = {
  booking_id: number;
};

export async function getBooking(getRequest: { booking_id: number }) {
  const res = await fetch(`${apiUrl}/booking/${getRequest.booking_id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`get booking failed with ${res.status}`);
  }
  return res.json();
}

export type GetBookingResponse = {
  booking_id: number;
  user_id: number;
  type_id: number;
  paid: boolean;
  cost: number;
  status: string;
  status_updated_at: string;
  status_updated_by: string;
  notes: string;
  slot_ids: number[];
  created_at: string;
  last_edited: string;
};

export async function getAllBookings() {
  const res = await fetch(`${apiUrl}/booking`);

  if (!res.ok) {
    throw new Error(`get all bookings failed with ${res.status}`);
  }
  return res.json();
}

export type GetAllBookingsResponse = {
  id: number;
  user_id: number;
  user_name: string;
  user_surname: string;
  user_email: string;
  user_last_login: string;
  employee_id: number;
  employee_name: string;
  employee_surname: string;
  employee_email: string;
  employee_title: string;
  type_id: number;
  type_title: string;
  paid: boolean;
  cost: number;
  status: string;
  status_updated_at: string;
  status_updated_by: string;
  notes: string;
  created_at: string;
  last_edited: string;
  start_time: string;
  end_time: string;
};

export async function getAllBookingsUser() {
  const res = await fetch(`${apiUrl}/booking/user`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`get all bookings for user failed with ${res.status}`);
  }

  return res.json();
}

export async function postManualPayment(id: number) {
  const res = await fetch(`${apiUrl}/booking/${id}/payment/manual`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`post manual payment failed iwth ${res.status}`);
  }
}

export async function postCancellation(id: number) {
  const res = await fetch(`${apiUrl}/booking/${id}/cancel`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`post manual cancellation failed iwth ${res.status}`);
  }
}

export async function postConfirm(id: number) {
  const res = await fetch(`${apiUrl}/booking/${id}/confirm`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`post manual confirmation failed iwth ${res.status}`);
  }
}

export async function postComplete(id: number) {
  const res = await fetch(`${apiUrl}/booking/${id}/complete`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`post manual completion failed iwth ${res.status}`);
  }
}
