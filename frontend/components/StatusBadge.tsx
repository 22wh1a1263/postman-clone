"use client";

interface Props {
  status: number;
  timeMs: number;
  sizeBytes: number;
}

export default function StatusBadge({ status, timeMs, sizeBytes }: Props) {
  const cls = status === 0 ? "status-0"
    : status < 300 ? "status-2xx"
    : status < 400 ? "status-3xx"
    : "status-4xx";

  const sizeStr = sizeBytes < 1024
    ? `${sizeBytes} B`
    : sizeBytes < 1024 * 1024
    ? `${(sizeBytes / 1024).toFixed(1)} KB`
    : `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;

  const statusText = status === 0 ? "Error"
    : status === 200 ? "200 OK"
    : status === 201 ? "201 Created"
    : status === 204 ? "204 No Content"
    : status === 400 ? "400 Bad Request"
    : status === 401 ? "401 Unauthorized"
    : status === 403 ? "403 Forbidden"
    : status === 404 ? "404 Not Found"
    : status === 500 ? "500 Internal Server Error"
    : String(status);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "6px 16px", fontSize: 12 }}>
      <span className={cls} style={{ fontWeight: 600 }}>{statusText}</span>
      <span style={{ color: "#888" }}>
        Time: <span style={{ color: timeMs < 500 ? "#3ecf8e" : timeMs < 1000 ? "#fbbf24" : "#f87171" }}>{timeMs} ms</span>
      </span>
      <span style={{ color: "#888" }}>
        Size: <span style={{ color: "#e0e0e0" }}>{sizeStr}</span>
      </span>
    </div>
  );
}
