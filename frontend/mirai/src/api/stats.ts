const apiUrl = import.meta.env.VITE_API_URL;

export async function getStats() {
  const res = await fetch(`${apiUrl}/stats`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`get stats failed with ${res.status}`);
  }
  return res.json();
}

type TotalPair = {
  frequency: number;
  cost: number;
};

export type GetStatsResponse = {
  total: TotalPair;
  cancelled: TotalPair;
  completed: TotalPair;
  created: TotalPair;
  open: TotalPair;
  open_not_paid: TotalPair;
  open_paid: TotalPair;
  total_paid: TotalPair;
};
