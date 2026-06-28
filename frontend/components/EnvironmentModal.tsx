"use client";
import { useState } from "react";
import { Plus, Trash2, X, Settings2 } from "lucide-react";
import KVEditor from "./KVEditor";
import type { Environment, KVItem } from "@/types";

interface Props {
  environments: Environment[];
  onClose: () => void;
  onCreate: (name: string) => void;
  onUpdate: (id: number, name: string, variables: KVItem[]) => void;
  onDelete: (id: number) => void;
}

export default function EnvironmentModal({ environments, onClose, onCreate, onUpdate, onDelete }: Props) {
  const [selected, setSelected] = useState<Environment | null>(environments[0] || null);
  const [newName, setNewName] = useState("");
  const [editName, setEditName] = useState(selected?.name || "");
  const [editVars, setEditVars] = useState<KVItem[]>(
    selected ? JSON.parse(selected.variables) : []
  );

  const selectEnv = (env: Environment) => {
    setSelected(env);
    setEditName(env.name);
    setEditVars(JSON.parse(env.variables));
  };

  const save = () => {
    if (!selected) return;
    onUpdate(selected.id, editName, editVars);
    // optimistic update
    setSelected({ ...selected, name: editName, variables: JSON.stringify(editVars) });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ minWidth: 700, maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Settings2 size={16} style={{ color: "#ff6c37" }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Manage Environments</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}><X size={16} /></button>
        </div>
        <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0 }}>
          {/* Left: list */}
          <div style={{ width: 200, display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
            {environments.map(env => (
              <div
                key={env.id}
                onClick={() => selectEnv(env)}
                style={{
                  padding: "8px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12,
                  background: selected?.id === env.id ? "rgba(255,108,55,0.15)" : "transparent",
                  color: selected?.id === env.id ? "#ff6c37" : "#ccc",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  border: selected?.id === env.id ? "1px solid rgba(255,108,55,0.3)" : "1px solid transparent",
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{env.name}</span>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(env.id); if (selected?.id === env.id) setSelected(null); }}
                  style={{ background: "none", border: "none", color: "#444", cursor: "pointer", padding: "0 2px" }}
                  onMouseOver={e => (e.currentTarget.style.color = "#f87171")}
                  onMouseOut={e => (e.currentTarget.style.color = "#444")}
                ><Trash2 size={11} /></button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && newName.trim()) { onCreate(newName.trim()); setNewName(""); } }}
                placeholder="New env name..."
                style={{ flex: 1, fontSize: 11, padding: "4px 6px" }}
              />
              <button
                className="btn-ghost"
                onClick={() => { if (newName.trim()) { onCreate(newName.trim()); setNewName(""); } }}
                style={{ padding: "4px 8px" }}
              ><Plus size={12} /></button>
            </div>
          </div>
          {/* Right: editor */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
            {selected ? (
              <>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  style={{ marginBottom: 8, fontSize: 13, fontWeight: 600 }}
                />
                <div style={{ flex: 1, overflow: "auto", background: "#1e1e1e", borderRadius: 4 }}>
                  <KVEditor items={editVars} onChange={setEditVars} keyPlaceholder="Variable" valuePlaceholder="Value" />
                </div>
                <button className="btn-send" onClick={save} style={{ marginTop: 10, alignSelf: "flex-end" }}>Save</button>
              </>
            ) : (
              <div style={{ color: "#555", fontSize: 12, padding: 12 }}>Select or create an environment to edit variables.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
