"use client";
import { Plus, Trash2 } from "lucide-react";
import type { KVItem } from "@/types";

interface Props {
  items: KVItem[];
  onChange: (items: KVItem[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export default function KVEditor({ items, onChange, keyPlaceholder = "Key", valuePlaceholder = "Value" }: Props) {
  const update = (index: number, field: keyof KVItem, value: string | boolean) => {
    const next = items.map((item, i) => i === index ? { ...item, [field]: value } : item);
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...items, { key: "", value: "", enabled: true }]);
  };

  return (
    <div style={{ width: "100%" }}>
      <table className="kv-table">
        <thead>
          <tr style={{ borderBottom: "1px solid #333" }}>
            <th style={{ width: 24, padding: "4px 8px" }}></th>
            <th style={{ textAlign: "left", padding: "4px 8px", color: "#555", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>{keyPlaceholder}</th>
            <th style={{ textAlign: "left", padding: "4px 8px", color: "#555", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>{valuePlaceholder}</th>
            <th style={{ width: 30 }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="kv-row">
              <td style={{ padding: "0 4px", textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={e => update(i, "enabled", e.target.checked)}
                  style={{ accentColor: "#ff6c37", width: 13, height: 13, cursor: "pointer" }}
                />
              </td>
              <td>
                <input
                  className="kv-input"
                  value={item.key}
                  placeholder={keyPlaceholder}
                  onChange={e => update(i, "key", e.target.value)}
                  style={{ opacity: item.enabled ? 1 : 0.4 }}
                />
              </td>
              <td>
                <input
                  className="kv-input"
                  value={item.value}
                  placeholder={valuePlaceholder}
                  onChange={e => update(i, "value", e.target.value)}
                  style={{ opacity: item.enabled ? 1 : 0.4 }}
                />
              </td>
              <td>
                <button
                  onClick={() => remove(i)}
                  style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "4px 6px" }}
                  onMouseOver={e => (e.currentTarget.style.color = "#f87171")}
                  onMouseOut={e => (e.currentTarget.style.color = "#555")}
                >
                  <Trash2 size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={add}
        style={{ display: "flex", alignItems: "center", gap: 4, margin: "8px 8px", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12 }}
        onMouseOver={e => (e.currentTarget.style.color = "#ff6c37")}
        onMouseOut={e => (e.currentTarget.style.color = "#555")}
      >
        <Plus size={12} /> Add row
      </button>
    </div>
  );
}
