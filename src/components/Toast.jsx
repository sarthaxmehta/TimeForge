import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

const toasts = [];
let listeners = [];

export function showToast(message, type = 'info') {
  const id = Date.now();
  toasts.push({ id, message, type });
  listeners.forEach((fn) => fn([...toasts]));
  setTimeout(() => {
    const idx = toasts.findIndex((t) => t.id === id);
    if (idx !== -1) toasts.splice(idx, 1);
    listeners.forEach((fn) => fn([...toasts]));
  }, 3000);
}

export default function ToastContainer() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fn = (updated) => setItems(updated);
    listeners.push(fn);
    return () => { listeners = listeners.filter((l) => l !== fn); };
  }, []);

  const icons = {
    success: <CheckCircle size={18} color="var(--color-success)" />,
    error:   <XCircle size={18} color="var(--color-danger)" />,
    info:    <Info size={18} color="var(--color-primary)" />,
  };

  return (
    <div className="toast-container">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {icons[t.type] || icons.info}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
