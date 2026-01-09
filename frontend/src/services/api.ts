/* eslint-disable @typescript-eslint/no-explicit-any */

// Simple frontend API wrapper for DoraProject backend
// Exports typed functions for each backend endpoint so components can import them directly.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function fetchJSON<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };

  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers,
  });

  const text = await res.text();
  let payload: any = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch (e) {
    // not JSON
    payload = text;
  }

  if (!res.ok) {
    const message = payload?.detail ?? payload ?? res.statusText;
    throw new Error(String(message));
  }

  return payload as T;
}

/* ---------------- Types ---------------- */

// Authentication
export type LoginRequest = { device_id: string; email?: string; password?: string };
export type LoginResponse = { token: string; user_id: number; is_anonymous: boolean };
export type AccountWipeRequest = { user_id: number };
export type AccountWipeResponse = { success: boolean; message: string };

// Journals
export type JournalCreateRequest = { user_id: number; journal_description: string; expiration_type: "7_days" | "30_days" | "delete_manually" };
export type SuccessResponse = { success: boolean; message?: string };
export type JournalEntry = { id: number; date: string; journal: string; expires_at?: string | null };

// Counseling
export type StartCounselingRequest = { user_id: number };
export type StartCounselingResponse = { conversation_id: number; counseling: string };
export type FollowUpRequest = { conversation_id: number; message: string };
export type FollowUpResponse = { counseling: string };

// Check-in
export type CheckInRequest = { user_id: number; check_in_data: string; wearable_data?: string };
export type CheckInResponse = { sanitized_text: string; recommended_intervention_ids: string; ai_reasoning: string };

// Wearable
export type WearableDataRequest = { user_id: number; wearable_data: string };
export type WearableDataResponse = { success: boolean };
export type WearableDataSummary = { date: string; wearable_data_summary: string };
export type WearableCheckResponse = { success: boolean; created_at?: string | null };

// Interventions Library
export type Intervention = {
  id: number;
  name: string;
  category: string;
  estimated_time: string;
  stress_range: { min: number; max: number };
  trigger_case: string;
  steps: string[];
  target_outcome: string;
  times_completed?: number | null;
  last_completed?: string | null;
};
export type InterventionsResponse = { count: number; interventions: Intervention[] };
export type CompleteInterventionRequest = { user_id: number; intervention_id: string };
export type CompleteInterventionResponse = { success: boolean };

/* ---------------- Authentication ---------------- */
export async function authLogin(body: LoginRequest): Promise<LoginResponse> {
  return fetchJSON<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function authWipeAccount(body: AccountWipeRequest): Promise<AccountWipeResponse> {
  return fetchJSON<AccountWipeResponse>("/auth/account/wipe", {
    method: "DELETE",
    body: JSON.stringify(body),
  });
}

/* ---------------- Journal ---------------- */
export async function journalCreate(body: JournalCreateRequest): Promise<SuccessResponse> {
  return fetchJSON<SuccessResponse>("/journal/create", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function journalHistory(user_id: number): Promise<JournalEntry[]> {
  return fetchJSON<JournalEntry[]>(`/journal/history?user_id=${encodeURIComponent(String(user_id))}`);
}

export async function journalDelete(entry_id: number): Promise<SuccessResponse> {
  return fetchJSON<SuccessResponse>(`/journal/entry/${entry_id}`, {
    method: "DELETE",
  });
}

/* ---------------- Counseling ---------------- */
export async function counselingStart(body: StartCounselingRequest): Promise<StartCounselingResponse> {
  return fetchJSON<StartCounselingResponse>("/counseling/start", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function counselingFollowup(body: FollowUpRequest): Promise<FollowUpResponse> {
  return fetchJSON<FollowUpResponse>("/counseling/followup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/* ---------------- Check-in (AI) ---------------- */
export async function checkinAnalyze(body: CheckInRequest): Promise<CheckInResponse> {
  return fetchJSON<CheckInResponse>("/check-in/analyze", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/* ---------------- Wearable ---------------- */
export async function wearableSave(body: WearableDataRequest): Promise<WearableDataResponse> {
  return fetchJSON<WearableDataResponse>("/user/wearable", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function wearableView(user_id: number): Promise<WearableDataSummary[]> {
  return fetchJSON<WearableDataSummary[]>(`/user/wearable/view?user_id=${encodeURIComponent(String(user_id))}`);
}

export async function wearableCheck(user_id: number): Promise<WearableCheckResponse> {
  return fetchJSON<WearableCheckResponse>(`/user/wearable/check?user_id=${encodeURIComponent(String(user_id))}`);
}

/* ---------------- Interventions Library ---------------- */
export async function libraryGetInterventions(params?: {
  intervention_ids?: number[];
  user_id?: number;
}): Promise<InterventionsResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.intervention_ids) {
    params.intervention_ids.forEach(id => queryParams.append("intervention_ids", String(id)));
  }
  
  if (params?.user_id !== undefined) {
    queryParams.append("user_id", String(params.user_id));
  }
  
  const queryString = queryParams.toString();
  const path = `/library/interventions${queryString ? `?${queryString}` : ""}`;
  
  return fetchJSON<InterventionsResponse>(path);
}

export async function libraryCompleteIntervention(body: CompleteInterventionRequest): Promise<CompleteInterventionResponse> {
  return fetchJSON<CompleteInterventionResponse>("/library/interventions/complete", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/* ---------------- Exports ---------------- */
export default {
  setAuthToken,
  authLogin,
  authWipeAccount,
  journalCreate,
  journalHistory,
  journalDelete,
  counselingStart,
  counselingFollowup,
  checkinAnalyze,
  wearableSave,
  wearableView,
  wearableCheck,
  libraryGetInterventions,
  libraryCompleteIntervention,
};
