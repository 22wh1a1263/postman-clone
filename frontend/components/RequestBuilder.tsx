"use client";
import { useState, useEffect } from "react";
import KVEditor from "./KVEditor";
import MethodSelector from "./MethodSelector";
import type { KVItem, Tab } from "@/types";

interface Props {
  tab: Tab;
  onUpdate: (updates: Partial<Tab>) => void;
  onSend: () => void;
  environments: { id: number; name: string }[];
  selectedEnvId: number | null;
  onEnvChange: (id: number | null) => void;
}

const BODY_TABS = ["none", "raw", "form-data", "x-www-form-urlencoded"] as const;

export default function RequestBuilder({ tab, onUpdate, onSend, environments, selectedEnvId, onEnvChange }: Props) {
  const [activeTab, setActiveTab] = useState<"params" | "auth" | "headers" | "body">("params");

  const tabCount = (t: typeof activeTab) => {
    if (t === "params") return tab.params.filter(p => p.enabled && p.key).length;
    if (t === "headers") return tab.headers.filter(h => h.enabled && h.key).length;
    return 0;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* URL bar */}
      <div style={{ display: "flex", gap: 0, padding: "10px 12px", borderBottom: "1px solid #3a3a3a", flexShrink: 0, alignItems: "center" }}>
        <MethodSelector value={tab.method} onChange={m => onUpdate({ method: m })} />
        <input
          value={tab.url}
          onChange={e => onUpdate({ url: e.target.value })}
          onKeyDown={e => { if (e.key === "Enter") onSend(); }}
          placeholder="Enter request URL"
          style={{
            flex: 1, height: 36, borderRadius: 0, borderLeft: "none", borderRight: "none",
            fontSize: 13, fontFamily: "'JetBrains Mono', monospace", padding: "0 12px",
            background: "#1a1a1a",
          }}
        />
        <button
          className="btn-send"
          onClick={onSend}
          disabled={tab.loading}
          style={{ borderRadius: "0 3px 3px 0", height: 36 }}
        >
          {tab.loading ? "Sending..." : "Send"}
        </button>
        <select
          value={selectedEnvId ?? ""}
          onChange={e => onEnvChange(e.target.value ? Number(e.target.value) : null)}
          style={{ marginLeft: 8, height: 36, fontSize: 12, minWidth: 130 }}
        >
          <option value="">No Environment</option>
          {environments.map(env => (
            <option key={env.id} value={env.id}>{env.name}</option>
          ))}
        </select>
      </div>

      {/* Sub-tabs */}
      <div className="tab-bar" style={{ flexShrink: 0 }}>
        {(["params", "auth", "headers", "body"] as const).map(t => (
          <div
            key={t}
            className={`tab-item ${activeTab === t ? "active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            <span style={{ textTransform: "capitalize" }}>{t}</span>
            {tabCount(t) > 0 && (
              <span style={{ background: "#ff6c37", color: "white", borderRadius: 10, padding: "0 5px", fontSize: 10, lineHeight: "14px" }}>
                {tabCount(t)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {activeTab === "params" && (
          <KVEditor
            items={tab.params}
            onChange={params => onUpdate({ params })}
            keyPlaceholder="Parameter"
            valuePlaceholder="Value"
          />
        )}

        {activeTab === "headers" && (
          <KVEditor
            items={tab.headers}
            onChange={headers => onUpdate({ headers })}
            keyPlaceholder="Header"
            valuePlaceholder="Value"
          />
        )}

        {activeTab === "auth" && (
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: "#888", fontSize: 11, display: "block", marginBottom: 4 }}>Auth Type</label>
              <select value={tab.auth_type} onChange={e => onUpdate({ auth_type: e.target.value })} style={{ minWidth: 180 }}>
                <option value="none">No Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>
            {tab.auth_type === "bearer" && (
              <div>
                <label style={{ color: "#888", fontSize: 11, display: "block", marginBottom: 4 }}>Token</label>
                <input
                  value={tab.auth_token}
                  onChange={e => onUpdate({ auth_token: e.target.value })}
                  placeholder="Bearer token"
                  style={{ width: "100%", fontFamily: "monospace" }}
                />
              </div>
            )}
            {tab.auth_type === "basic" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ color: "#888", fontSize: 11, display: "block", marginBottom: 4 }}>Username</label>
                  <input value={tab.auth_username} onChange={e => onUpdate({ auth_username: e.target.value })} placeholder="Username" style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ color: "#888", fontSize: 11, display: "block", marginBottom: 4 }}>Password</label>
                  <input type="password" value={tab.auth_password} onChange={e => onUpdate({ auth_password: e.target.value })} placeholder="Password" style={{ width: "100%" }} />
                </div>
              </div>
            )}
            {tab.auth_type === "none" && (
              <div style={{ color: "#555", fontSize: 12, padding: 8 }}>No authentication will be sent with this request.</div>
            )}
          </div>
        )}

        {activeTab === "body" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ display: "flex", gap: 0, padding: "8px 12px", borderBottom: "1px solid #333", flexShrink: 0 }}>
              {BODY_TABS.map(bt => (
                <label key={bt} style={{ display: "flex", alignItems: "center", gap: 5, marginRight: 14, cursor: "pointer", fontSize: 12 }}>
                  <input
                    type="radio"
                    checked={tab.body_type === bt}
                    onChange={() => onUpdate({ body_type: bt })}
                    style={{ accentColor: "#ff6c37" }}
                  />
                  <span style={{ color: tab.body_type === bt ? "#e0e0e0" : "#666" }}>{bt}</span>
                </label>
              ))}
            </div>
            {tab.body_type === "none" && (
              <div style={{ padding: 24, color: "#555", fontSize: 12 }}>This request has no body.</div>
            )}
            {(tab.body_type === "raw" || tab.body_type === "x-www-form-urlencoded") && (
              <textarea
                value={tab.body_content}
                onChange={e => onUpdate({ body_content: e.target.value })}
                placeholder={tab.body_type === "raw" ? '{\n  "key": "value"\n}' : "key=value&key2=value2"}
                style={{
                  flex: 1, resize: "none", background: "#1a1a1a", border: "none",
                  borderRadius: 0, color: "#e0e0e0", fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace", padding: 12, outline: "none",
                  lineHeight: 1.6,
                }}
              />
            )}
            {tab.body_type === "form-data" && (
              <KVEditor
                items={tab.body_content ? JSON.parse(tab.body_content) : []}
                onChange={items => onUpdate({ body_content: JSON.stringify(items) })}
                keyPlaceholder="Key"
                valuePlaceholder="Value"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
