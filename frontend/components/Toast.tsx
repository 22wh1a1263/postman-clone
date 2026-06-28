"use client";
import { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const icon = type === "success" ? <CheckCircle size={14} className="text-pm-success" />
    : type === "error" ? <AlertCircle size={14} className="text-pm-error" />
    : <Info size={14} className="text-pm-info" />;

  return (
    <div className="toast flex items-center gap-8px" style={{ gap: 8 }}>
      {icon}
      <span style={{ color: "#e0e0e0" }}>{message}</span>
      <button onClick={onClose} style={{ marginLeft: 8, background: "none", border: "none", color: "#888", cursor: "pointer" }}>
        <X size={12} />
      </button>
    </div>
  );
}
