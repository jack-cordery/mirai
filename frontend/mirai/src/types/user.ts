import { z } from "zod";

export type GetUserResponse = {
  user_id: number;
  name: string;
  surname: string;
  email: string;
  created_at: string;
  last_login: string;
};

export type RoleRequestStatus = "APPROVED" | "PENDING" | "REJECTED";

export type GetAllRequestsResponse = {
  id: number;
  requesting_user_id: number;
  requested_role_id: number;
  status: RoleRequestStatus;
  comment: string;
  approving_user_id: number;
  created_at: string;
  approved_at: string;
  requesting_user_name: string;
  requesting_user_surname: string;
  requesting_user_email: string;
  requesting_user_created_at: string;
  requesting_user_last_login: string;
  requested_role_name: string;
  requested_role_description: string;
  approving_user_name: string;
  approving_user_surname: string;
  approving_user_email: string;
  approving_user_created_at: string;
  approving_user_last_login: string;
};

export const RequestDataSchema = z.object({
  id: z.number(),
  status: z.string(),
  comment: z.string(),
  created_at: z.string(),
  approved_at: z.string(),
  requesting_user_email: z.string(),
  requested_role_name: z.string(),
  approving_user_email: z.string(),
});
