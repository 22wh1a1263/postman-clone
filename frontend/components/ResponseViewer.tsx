"use client";
import { useState } from "react";
import StatusBadge from "./StatusBadge";
import type { RunResponse } from "@/types";

interface Props {
  response: RunResponse | null;
  loading: boolean;
}

export default function ResponseViewer({ response, loading }: Props) {
  const [view, setView] = useState<"pretty" | "raw">("pretty");
  const [respTab, setRespTab] = useState<"body" | "headers">("body");

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#666" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, marginBottom: 8 }}>Sending request...</div>
          <div style={{ width: 32, height: 32, border: "3px solid #333", borderTopColor: "#ff6c37", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!response) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 8 }}>
        <div style={{ color: "#444", fontSize: 36 }}>→</div>
        <div style={{ color: "#555", fontSize: 13 }}>Enter a URL and click Send to see the response</div>
      </div>
    );
  }

  const formatJson = (text: string) => {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  };

  const colorizeJson = (text: string) => {
    return text.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) return `<span style="color:#54a0ff">${match}</span>`;
        return `<span style="color:#3ecf8e">${match}</span>`;
      } else if (/true|false/.test(match)) return `<span style="color:#ff9f43">${match}</span>`;
      else if (/null/.test(match)) return `<span style="color:#888">${match}</span>`;
      return `<span style="color:#a29bfe">${match}</span>`;
    });
  };

  const displayBody = view === "pretty" ? formatJson(response.body) : response.body;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Status bar */}
      <div style={{ borderBottom: "1px solid #3a3a3a", flexShrink: 0, background: "#252525" }}>
        <StatusBadge status={response.status} timeMs={response.time_ms} sizeBytes={response.size_bytes} />
      </div>

      {/* Response tabs */}
      <div className="tab-bar" style={{ flexShrink: 0 }}>
        {(["body", "headers"] as const).map(t => (
          <div key={t} className={`tab-item ${respTab === t ? "active" : ""}`} onClick={() => setRespTab(t)} style={{ textTransform: "capitalize" }}>
            {t}
            {t === "headers" && (
              <span style={{ color: "#888", marginLeft: 4 }}>({Object.keys(response.headers).length})</span>
            )}
          </div>
        ))}
        {respTab === "body" && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 0, padding: "0 8px" }}>
            {(["pretty", "raw"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  background: view === v ? "#333" : "none",
                  border: "1px solid #3a3a3a",
                  color: view === v ? "#e0e0e0" : "#666",
                  padding: "3px 10px",
                  cursor: "pointer",
                  fontSize: 11,
                  textTransform: "capitalize",
                  marginLeft: v === "raw" ? -1 : 0,
                }}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", background: "#1a1a1a" }}>
        {respTab === "body" && (
          <pre style={{ margin: 0, padding: 16, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {response.is_json && view === "pretty"
              ? <span dangerouslySetInnerHTML={{ __html: colorizeJson(displayBody) }} />
              : displayBody
            }
          </pre>
        )}
        {respTab === "headers" && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                <th style={{ textAlign: "left", padding: "8px 16px", color: "#555", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Header</th>
                <th style={{ textAlign: "left", padding: "8px 16px", color: "#555", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(response.headers).map(([k, v]) => (
                <tr key={k} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "6px 16px", color: "#54a0ff", fontFamily: "monospace", fontSize: 12 }}>{k}</td>
                  <td style={{ padding: "6px 16px", color: "#e0e0e0", fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
