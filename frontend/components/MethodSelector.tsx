"use client";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const METHOD_COLORS: Record<string, string> = {
  GET: "#3ecf8e",
  POST: "#ff9f43",
  PUT: "#54a0ff",
  PATCH: "#a29bfe",
  DELETE: "#f87171",
  HEAD: "#fd79a8",
  OPTIONS: "#81ecec",
};

interface Props {
  value: string;
  onChange: (method: string) => void;
}

export default function MethodSelector({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        color: METHOD_COLORS[value] || "#e0e0e0",
        fontWeight: 700,
        fontSize: 13,
        background: "#1a1a1a",
        border: "1px solid #3a3a3a",
        borderRadius: "3px 0 0 3px",
        padding: "0 10px",
        height: 36,
        minWidth: 110,
        cursor: "pointer",
        outline: "none",
      }}
    >
      {METHODS.map(m => (
        <option key={m} value={m} style={{ color: METHOD_COLORS[m] }}>{m}</option>
      ))}
    </select>
  );
}
