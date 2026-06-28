"use client";
import { useState } from "react";
import {
  FolderOpen, ChevronDown, ChevronRight, Plus, Trash2, Pencil,
  Clock, Search, X, MoreHorizontal, RefreshCw
} from "lucide-react";
import type { Collection, SavedRequest, HistoryItem, Tab } from "@/types";

const METHOD_COLORS: Record<string, string> = {
  GET: "#3ecf8e", POST: "#ff9f43", PUT: "#54a0ff",
  PATCH: "#a29bfe", DELETE: "#f87171", HEAD: "#fd79a8", OPTIONS: "#81ecec",
};

interface Props {
  collections: Collection[];
  requests: Record<number, SavedRequest[]>;
  history: HistoryItem[];
  onNewCollection: () => void;
  onRenameCollection: (col: Collection) => void;
  onDeleteCollection: (id: number) => void;
  onOpenRequest: (req: SavedRequest) => void;
  onOpenHistory: (h: HistoryItem) => void;
  onDeleteRequest: (id: number) => void;
  onClearHistory: () => void;
  onDeleteHistory: (id: number) => void;
  onNewRequest: (collectionId: number) => void;
  activeTabId?: string;
}

export default function Sidebar({
  collections, requests, history,
  onNewCollection, onRenameCollection, onDeleteCollection,
  onOpenRequest, onOpenHistory, onDeleteRequest, onClearHistory,
  onDeleteHistory, onNewRequest, activeTabId,
}: Props) {
  const [activePanel, setActivePanel] = useState<"collections" | "history">("collections");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [search, setSearch] = useState("");
  const [hoveredReq, setHoveredReq] = useState<number | null>(null);
  const [hoveredColl, setHoveredColl] = useState<number | null>(null);
  const [hoveredHist, setHoveredHist] = useState<number | null>(null);

  const toggle = (id: number) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const filteredCollections = search
    ? collections.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (requests[c.id] || []).some(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.url.toLowerCase().includes(search.toLowerCase()))
      )
    : collections;

  const filteredHistory = search
    ? history.filter(h => h.url.toLowerCase().includes(search.toLowerCase()))
    : history;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#2c2c2c", borderRight: "1px solid #3a3a3a" }}>
      {/* Panel tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #3a3a3a", flexShrink: 0 }}>
        {(["collections", "history"] as const).map(panel => (
          <button
            key={panel}
            onClick={() => setActivePanel(panel)}
            style={{
              flex: 1, padding: "10px 0", background: "none", border: "none",
              borderBottom: activePanel === panel ? "2px solid #ff6c37" : "2px solid transparent",
              color: activePanel === panel ? "#e0e0e0" : "#666",
              cursor: "pointer", fontSize: 12, fontWeight: 500,
              textTransform: "capitalize",
            }}
          >
            {panel === "collections" ? <><FolderOpen size={12} style={{ display: "inline", marginRight: 4 }} />{panel}</> 
             : <><Clock size={12} style={{ display: "inline", marginRight: 4 }} />{panel}</>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: "8px", flexShrink: 0, borderBottom: "1px solid #333" }}>
        <div style={{ position: "relative" }}>
          <Search size={12} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            style={{ width: "100%", paddingLeft: 26, paddingRight: search ? 26 : 8, height: 28, fontSize: 12 }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer" }}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {activePanel === "collections" && (
          <>
            <div className="section-header">
              <span>Collections</span>
              <button
                onClick={onNewCollection}
                title="New Collection"
                style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 2 }}
                onMouseOver={e => (e.currentTarget.style.color = "#ff6c37")}
                onMouseOut={e => (e.currentTarget.style.color = "#555")}
              >
                <Plus size={13} />
              </button>
            </div>
            {filteredCollections.length === 0 && (
              <div style={{ padding: "16px 12px", color: "#555", fontSize: 12, textAlign: "center" }}>
                {search ? "No results" : "No collections yet. Create one to get started."}
              </div>
            )}
            {filteredCollections.map(col => (
              <div key={col.id}>
                <div
                  className="sidebar-item"
                  onMouseEnter={() => setHoveredColl(col.id)}
                  onMouseLeave={() => setHoveredColl(null)}
                  onClick={() => toggle(col.id)}
                  style={{ userSelect: "none" }}
                >
                  {expanded[col.id]
                    ? <ChevronDown size={12} style={{ color: "#666", flexShrink: 0 }} />
                    : <ChevronRight size={12} style={{ color: "#666", flexShrink: 0 }} />
                  }
                  <FolderOpen size={13} style={{ color: "#ff6c37", flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{col.name}</span>
                  {hoveredColl === col.id && (
                    <div style={{ display: "flex", gap: 2 }} onClick={e => e.stopPropagation()}>
                      <button
                        title="Add request"
                        onClick={() => onNewRequest(col.id)}
                        style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "2px 3px" }}
                        onMouseOver={e => (e.currentTarget.style.color = "#3ecf8e")}
                        onMouseOut={e => (e.currentTarget.style.color = "#555")}
                      ><Plus size={11} /></button>
                      <button
                        title="Rename"
                        onClick={() => onRenameCollection(col)}
                        style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "2px 3px" }}
                        onMouseOver={e => (e.currentTarget.style.color = "#54a0ff")}
                        onMouseOut={e => (e.currentTarget.style.color = "#555")}
                      ><Pencil size={11} /></button>
                      <button
                        title="Delete"
                        onClick={() => onDeleteCollection(col.id)}
                        style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "2px 3px" }}
                        onMouseOver={e => (e.currentTarget.style.color = "#f87171")}
                        onMouseOut={e => (e.currentTarget.style.color = "#555")}
                      ><Trash2 size={11} /></button>
                    </div>
                  )}
                </div>
                {expanded[col.id] && (
                  <div style={{ paddingLeft: 12 }}>
                    {(requests[col.id] || []).length === 0 && (
                      <div style={{ padding: "6px 16px", color: "#444", fontSize: 11 }}>No requests</div>
                    )}
                    {(requests[col.id] || []).map(req => (
                      <div
                        key={req.id}
                        className="sidebar-item"
                        onMouseEnter={() => setHoveredReq(req.id)}
                        onMouseLeave={() => setHoveredReq(null)}
                        onClick={() => onOpenRequest(req)}
                        style={{ paddingLeft: 16 }}
                      >
                        <span style={{ color: METHOD_COLORS[req.method] || "#888", fontSize: 10, fontWeight: 700, minWidth: 42, flexShrink: 0 }}>{req.method}</span>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{req.name}</span>
                        {hoveredReq === req.id && (
                          <button
                            onClick={e => { e.stopPropagation(); onDeleteRequest(req.id); }}
                            style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "2px 3px" }}
                            onMouseOver={e => (e.currentTarget.style.color = "#f87171")}
                            onMouseOut={e => (e.currentTarget.style.color = "#555")}
                          ><Trash2 size={10} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {activePanel === "history" && (
          <>
            <div className="section-header">
              <span>Recent</span>
              {history.length > 0 && (
                <button
                  onClick={onClearHistory}
                  title="Clear history"
                  style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 2, fontSize: 11 }}
                  onMouseOver={e => (e.currentTarget.style.color = "#f87171")}
                  onMouseOut={e => (e.currentTarget.style.color = "#555")}
                >
                  Clear
                </button>
              )}
            </div>
            {filteredHistory.length === 0 && (
              <div style={{ padding: "16px 12px", color: "#555", fontSize: 12, textAlign: "center" }}>
                {search ? "No results" : "No history yet. Send a request!"}
              </div>
            )}
            {filteredHistory.map(h => (
              <div
                key={h.id}
                className="sidebar-item"
                onMouseEnter={() => setHoveredHist(h.id)}
                onMouseLeave={() => setHoveredHist(null)}
                onClick={() => onOpenHistory(h)}
              >
                <span style={{ color: METHOD_COLORS[h.method] || "#888", fontSize: 10, fontWeight: 700, minWidth: 42, flexShrink: 0 }}>{h.method}</span>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>
                    {h.url.replace(/^https?:\/\//, "")}
                  </div>
                  {h.response_status && (
                    <div style={{ fontSize: 10, color: h.response_status < 300 ? "#3ecf8e" : "#f87171" }}>
                      {h.response_status} · {h.response_time}ms
                    </div>
                  )}
                </div>
                {hoveredHist === h.id && (
                  <button
                    onClick={e => { e.stopPropagation(); onDeleteHistory(h.id); }}
                    style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "2px 3px" }}
                    onMouseOver={e => (e.currentTarget.style.color = "#f87171")}
                    onMouseOut={e => (e.currentTarget.style.color = "#555")}
                  ><Trash2 size={10} /></button>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
