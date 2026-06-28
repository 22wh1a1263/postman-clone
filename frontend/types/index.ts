export interface KVItem {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface SavedRequest {
  id: number;
  collection_id: number;
  name: string;
  method: string;
  url: string;
  headers: string;
  params: string;
  body_type: string;
  body_content: string;
  auth_type: string;
  auth_data: string;
  created_at: string;
  updated_at: string;
}

export interface Environment {
  id: number;
  name: string;
  variables: string;
  created_at: string;
  updated_at: string;
}

export interface HistoryItem {
  id: number;
  method: string;
  url: string;
  headers: string;
  params: string;
  body_type: string;
  body_content: string;
  auth_type: string;
  auth_data: string;
  response_status: number | null;
  response_time: number | null;
  response_size: number | null;
  created_at: string;
}

export interface RunResponse {
  status: number;
  status_text: string;
  time_ms: number;
  size_bytes: number;
  headers: Record<string, string>;
  body: string;
  is_json: boolean;
}

export interface Tab {
  id: string;
  label: string;
  method: string;
  url: string;
  headers: KVItem[];
  params: KVItem[];
  body_type: string;
  body_content: string;
  auth_type: string;
  auth_token: string;
  auth_username: string;
  auth_password: string;
  response: RunResponse | null;
  loading: boolean;
  saved_request_id?: number;
}
