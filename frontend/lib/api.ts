import axios from "axios";
import type { Collection, SavedRequest, Environment, HistoryItem, RunResponse, KVItem } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const api = axios.create({ baseURL: BASE });

// Collections
export const getCollections = () => api.get<Collection[]>("/api/collections").then(r => r.data);
export const createCollection = (name: string, description = "") =>
  api.post<Collection>("/api/collections", { name, description }).then(r => r.data);
export const updateCollection = (id: number, data: Partial<Collection>) =>
  api.put<Collection>(`/api/collections/${id}`, data).then(r => r.data);
export const deleteCollection = (id: number) =>
  api.delete(`/api/collections/${id}`).then(r => r.data);

// Requests
export const getRequests = (collectionId: number) =>
  api.get<SavedRequest[]>(`/api/collections/${collectionId}/requests`).then(r => r.data);
export const createRequest = (data: Omit<SavedRequest, "id" | "created_at" | "updated_at">) =>
  api.post<SavedRequest>("/api/requests", data).then(r => r.data);
export const updateRequest = (id: number, data: Partial<SavedRequest>) =>
  api.put<SavedRequest>(`/api/requests/${id}`, data).then(r => r.data);
export const deleteRequest = (id: number) =>
  api.delete(`/api/requests/${id}`).then(r => r.data);

// Environments
export const getEnvironments = () => api.get<Environment[]>("/api/environments").then(r => r.data);
export const createEnvironment = (name: string, variables = "[]") =>
  api.post<Environment>("/api/environments", { name, variables }).then(r => r.data);
export const updateEnvironment = (id: number, data: Partial<Environment>) =>
  api.put<Environment>(`/api/environments/${id}`, data).then(r => r.data);
export const deleteEnvironment = (id: number) =>
  api.delete(`/api/environments/${id}`).then(r => r.data);

// History
export const getHistory = () => api.get<HistoryItem[]>("/api/history").then(r => r.data);
export const clearHistory = () => api.delete("/api/history").then(r => r.data);
export const deleteHistoryItem = (id: number) =>
  api.delete(`/api/history/${id}`).then(r => r.data);

// Runner
export const runRequest = (payload: {
  method: string;
  url: string;
  headers: KVItem[];
  params: KVItem[];
  body_type: string;
  body_content: string;
  auth_type: string;
  auth_token?: string;
  auth_username?: string;
  auth_password?: string;
  environment_id?: number | null;
}) => api.post<RunResponse>("/api/run", payload).then(r => r.data);
