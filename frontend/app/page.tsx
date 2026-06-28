"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, X, Settings, Zap } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import RequestBuilder from "@/components/RequestBuilder";
import ResponseViewer from "@/components/ResponseViewer";
import EnvironmentModal from "@/components/EnvironmentModal";
import Toast, { type ToastType } from "@/components/Toast";
import * as api from "@/lib/api";
import type { Collection, SavedRequest, Environment, HistoryItem, Tab, KVItem } from "@/types";

const METHOD_COLORS: Record<string, string> = {
  GET: "#3ecf8e", POST: "#ff9f43", PUT: "#54a0ff",
  PATCH: "#a29bfe", DELETE: "#f87171", HEAD: "#fd79a8", OPTIONS: "#81ecec",
};

const newTab = (overrides?: Partial<Tab>): Tab => ({
  id: crypto.randomUUID(),
  label: "New Request",
  method: "GET",
  url: "",
  headers: [],
  params: [],
  body_type: "none",
  body_content: "",
  auth_type: "none",
  auth_token: "",
  auth_username: "",
  auth_password: "",
  response: null,
  loading: false,
  ...overrides,
});

export default function Home() {
  const [tabs, setTabs] = useState<Tab[]>([newTab()]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [requests, setRequests] = useState<Record<number, SavedRequest[]>>({});
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedEnvId, setSelectedEnvId] = useState<number | null>(null);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveCollectionId, setSaveCollectionId] = useState<number | null>(null);
  const [renameCollection, setRenameCollection] = useState<Collection | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [splitHeight, setSplitHeight] = useState(55);
  const draggingH = useRef(false);
  const draggingV = useRef(false);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    api.getCollections().then(data => {
      setCollections(data);
      data.forEach(col => {
        api.getRequests(col.id).then(reqs => {
          setRequests(prev => ({ ...prev, [col.id]: reqs }));
        });
      });
    });
    api.getEnvironments().then(setEnvironments);
    api.getHistory().then(setHistory);
  }, []);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const updateTab = (id: string, updates: Partial<Tab>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addTab = () => {
    const tab = newTab();
    setTabs(prev => [...prev, tab]);
    setActiveTabId(tab.id);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id);
      if (next.length === 0) {
        const fresh = newTab();
        setActiveTabId(fresh.id);
        return [fresh];
      }
      if (activeTabId === id) setActiveTabId(next[next.length - 1].id);
      return next;
    });
  };

  const sendRequest = async () => {
    const tab = activeTab;
    if (!tab.url.trim()) { showToast("Please enter a URL", "error"); return; }
    updateTab(tab.id, { loading: true, response: null });
    try {
      const resp = await api.runRequest({
        method: tab.method, url: tab.url, headers: tab.headers, params: tab.params,
        body_type: tab.body_type, body_content: tab.body_content,
        auth_type: tab.auth_type, auth_token: tab.auth_token,
        auth_username: tab.auth_username, auth_password: tab.auth_password,
        environment_id: selectedEnvId,
      });
      updateTab(tab.id, { loading: false, response: resp });
      api.getHistory().then(setHistory);
    } catch (err: any) {
      updateTab(tab.id, { loading: false });
      showToast(err?.response?.data?.detail || "Request failed", "error");
    }
  };

  const openSavedRequest = (req: SavedRequest) => {
    const existing = tabs.find(t => t.saved_request_id === req.id);
    if (existing) { setActiveTabId(existing.id); return; }
    const tab = newTab({
      label: req.name, method: req.method, url: req.url,
      headers: JSON.parse(req.headers), params: JSON.parse(req.params),
      body_type: req.body_type, body_content: req.body_content, auth_type: req.auth_type,
      auth_token: (() => { try { return JSON.parse(req.auth_data).token || ""; } catch { return ""; } })(),
      auth_username: (() => { try { return JSON.parse(req.auth_data).username || ""; } catch { return ""; } })(),
      auth_password: (() => { try { return JSON.parse(req.auth_data).password || ""; } catch { return ""; } })(),
      saved_request_id: req.id,
    });
    setTabs(prev => [...prev, tab]);
    setActiveTabId(tab.id);
  };

  const openHistory = (h: HistoryItem) => {
    try {
      const tab = newTab({
        label: `${h.method} ${new URL(h.url).pathname}`,
        method: h.method, url: h.url,
        headers: JSON.parse(h.headers), params: JSON.parse(h.params),
        body_type: h.body_type, body_content: h.body_content, auth_type: h.auth_type,
      });
      setTabs(prev => [...prev, tab]);
      setActiveTabId(tab.id);
    } catch {}
  };

  const handleNewCollection = async () => {
    const name = prompt("Collection name:");
    if (!name?.trim()) return;
    const col = await api.createCollection(name.trim());
    setCollections(prev => [...prev, col]);
    setRequests(prev => ({ ...prev, [col.id]: [] }));
    showToast(`Collection "${col.name}" created`);
  };

  const handleDeleteCollection = async (id: number) => {
    if (!confirm("Delete this collection and all its requests?")) return;
    await api.deleteCollection(id);
    setCollections(prev => prev.filter(c => c.id !== id));
    setRequests(prev => { const n = { ...prev }; delete n[id]; return n; });
    showToast("Collection deleted", "info");
  };

  const submitRename = async () => {
    if (!renameCollection) return;
    const updated = await api.updateCollection(renameCollection.id, { name: renameValue });
    setCollections(prev => prev.map(c => c.id === updated.id ? updated : c));
    setRenameCollection(null);
    showToast("Collection renamed");
  };

  const handleDeleteRequest = async (id: number) => {
    await api.deleteRequest(id);
    setRequests(prev => {
      const n = { ...prev };
      for (const k of Object.keys(n)) n[Number(k)] = n[Number(k)].filter(r => r.id !== id);
      return n;
    });
    showToast("Request deleted", "info");
  };

  const handleSaveRequest = async () => {
    if (!saveCollectionId || !saveName.trim()) return;
    const tab = activeTab;
    const authData: Record<string, string> = {};
    if (tab.auth_type === "bearer") authData.token = tab.auth_token;
    if (tab.auth_type === "basic") { authData.username = tab.auth_username; authData.password = tab.auth_password; }
    const saved = await api.createRequest({
      collection_id: saveCollectionId, name: saveName, method: tab.method, url: tab.url,
      headers: JSON.stringify(tab.headers), params: JSON.stringify(tab.params),
      body_type: tab.body_type, body_content: tab.body_content,
      auth_type: tab.auth_type, auth_data: JSON.stringify(authData),
    });
    setRequests(prev => ({ ...prev, [saveCollectionId]: [...(prev[saveCollectionId] || []), saved] }));
    updateTab(tab.id, { label: saveName, saved_request_id: saved.id });
    setShowSaveModal(false);
    showToast("Request saved");
  };

  const onMouseDownSidebar = (e: React.MouseEvent) => {
    draggingH.current = true;
    const startX = e.clientX, startW = sidebarWidth;
    const onMove = (ev: MouseEvent) => { if (!draggingH.current) return; setSidebarWidth(Math.max(180, Math.min(500, startW + ev.clientX - startX))); };
    const onUp = () => { draggingH.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  };

  const onMouseDownSplit = (e: React.MouseEvent) => {
    draggingV.current = true;
    const container = (e.currentTarget as HTMLElement).parentElement!;
    const rect = container.getBoundingClientRect();
    const startY = e.clientY, startH = splitHeight;
    const onMove = (ev: MouseEvent) => { if (!draggingV.current) return; setSplitHeight(Math.max(20, Math.min(80, startH + ((ev.clientY - startY) / rect.height) * 100))); };
    const onUp = () => { draggingV.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Top nav */}
      <div style={{ display: "flex", alignItems: "center", height: 44, background: "#1a1a1a", borderBottom: "1px solid #3a3a3a", padding: "0 16px", gap: 12, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Zap size={18} style={{ color: "#ff6c37" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#e0e0e0" }}>API Client</span>
        </div>
        <div style={{ height: 20, width: 1, background: "#3a3a3a" }} />
        <span style={{ fontSize: 12, color: "#555" }}>My Workspace</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowEnvModal(true)} className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
          <Settings size={13} /> Environments
        </button>
        <button onClick={() => { setSaveName(activeTab.label); setSaveCollectionId(collections[0]?.id || null); setShowSaveModal(true); }} className="btn-ghost" style={{ fontSize: 12 }}>
          Save
        </button>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ width: sidebarWidth, flexShrink: 0, overflow: "hidden" }}>
          <Sidebar
            collections={collections} requests={requests} history={history}
            onNewCollection={handleNewCollection}
            onRenameCollection={col => { setRenameCollection(col); setRenameValue(col.name); }}
            onDeleteCollection={handleDeleteCollection}
            onOpenRequest={openSavedRequest} onOpenHistory={openHistory}
            onDeleteRequest={handleDeleteRequest}
            onClearHistory={async () => { await api.clearHistory(); setHistory([]); showToast("History cleared", "info"); }}
            onDeleteHistory={async (id) => { await api.deleteHistoryItem(id); setHistory(prev => prev.filter(h => h.id !== id)); }}
            onNewRequest={col_id => { setSaveCollectionId(col_id); setSaveName(activeTab.method + " New Request"); setShowSaveModal(true); }}
            activeTabId={activeTabId}
          />
        </div>
        <div className="resize-handle-h" onMouseDown={onMouseDownSidebar} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div className="tab-bar" style={{ flexShrink: 0 }}>
            {tabs.map(tab => (
              <div key={tab.id} className={`tab-item ${tab.id === activeTabId ? "active" : ""}`} onClick={() => setActiveTabId(tab.id)} style={{ maxWidth: 200 }}>
                <span style={{ color: METHOD_COLORS[tab.method] || "#888", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{tab.method}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{tab.label}</span>
                <button onClick={e => closeTab(tab.id, e)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "0 2px", flexShrink: 0, display: "flex", alignItems: "center" }} onMouseOver={e => (e.currentTarget.style.color = "#f87171")} onMouseOut={e => (e.currentTarget.style.color = "#555")}><X size={11} /></button>
              </div>
            ))}
            <button onClick={addTab} style={{ padding: "0 12px", background: "none", border: "none", color: "#555", cursor: "pointer", display: "flex", alignItems: "center" }} onMouseOver={e => (e.currentTarget.style.color = "#ff6c37")} onMouseOut={e => (e.currentTarget.style.color = "#555")} title="New tab"><Plus size={13} /></button>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ height: `${splitHeight}%`, overflow: "hidden", flexShrink: 0, display: "flex", flexDirection: "column" }}>
              <RequestBuilder tab={activeTab} onUpdate={u => updateTab(activeTabId, u)} onSend={sendRequest} environments={environments} selectedEnvId={selectedEnvId} onEnvChange={setSelectedEnvId} />
            </div>
            <div className="resize-handle-v" onMouseDown={onMouseDownSplit} />
            <div style={{ flex: 1, overflow: "hidden" }}>
              <ResponseViewer response={activeTab.response} loading={activeTab.loading} />
            </div>
          </div>
        </div>
      </div>

      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
              Save Request <button onClick={() => setShowSaveModal(false)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}><X size={16} /></button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", color: "#888", fontSize: 11, marginBottom: 4 }}>Request Name</label>
              <input value={saveName} onChange={e => setSaveName(e.target.value)} style={{ width: "100%" }} autoFocus />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "#888", fontSize: 11, marginBottom: 4 }}>Collection</label>
              <select value={saveCollectionId ?? ""} onChange={e => setSaveCollectionId(Number(e.target.value))} style={{ width: "100%" }}>
                {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button className="btn-send" onClick={handleSaveRequest}>Save</button>
            </div>
          </div>
        </div>
      )}

      {renameCollection && (
        <div className="modal-overlay" onClick={() => setRenameCollection(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
              Rename Collection <button onClick={() => setRenameCollection(null)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}><X size={16} /></button>
            </div>
            <input value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === "Enter" && submitRename()} style={{ width: "100%", marginBottom: 16 }} autoFocus />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => setRenameCollection(null)}>Cancel</button>
              <button className="btn-send" onClick={submitRename}>Rename</button>
            </div>
          </div>
        </div>
      )}

      {showEnvModal && (
        <EnvironmentModal environments={environments} onClose={() => setShowEnvModal(false)}
          onCreate={async (name) => { const e = await api.createEnvironment(name); setEnvironments(p => [...p, e]); showToast(`Environment "${name}" created`); }}
          onUpdate={async (id, name, vars) => { const e = await api.updateEnvironment(id, { name, variables: JSON.stringify(vars) }); setEnvironments(p => p.map(x => x.id === id ? e : x)); showToast("Saved"); }}
          onDelete={async (id) => { await api.deleteEnvironment(id); setEnvironments(p => p.filter(e => e.id !== id)); if (selectedEnvId === id) setSelectedEnvId(null); }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
