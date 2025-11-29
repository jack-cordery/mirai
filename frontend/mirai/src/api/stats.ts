const apiUrl = import.meta.env.VITE_API_URL;

export type ByDate = "hour" | "day" | "week" | "month" | "year";

export async function getStats(by: ByDate) {
  const res = await fetch(`${apiUrl}/stats/${by}`, {
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

export type Data = {
  all: TotalPair;
  cancelled: TotalPair;
  completed: TotalPair;
  created: TotalPair;
  confirmed: TotalPair;
  open: TotalPair;
  open_not_paid: TotalPair;
  open_paid: TotalPair;
  paid: TotalPair;
};

export type DataByDate = {
  date: string;
  data: Data;
};

export type MetaData = {
  users: number;
  paid_monthly_delta: number;
  unpaid_monthly_delta: number;
  user_monthly_delta: number;
  completed_monthly_delta: number;
  confirmed_monthly_delta: number;
};

export type GetStatsResponse = {
  totals: Data;
  by_date: DataByDate[];
  meta: MetaData;
};
