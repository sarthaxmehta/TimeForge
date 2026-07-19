import React from 'react';
import { SUBJECT_COLORS } from '../store/useStore';

export default function ColorPicker({ value, onChange, label = 'Color' }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="color-swatches">
        {SUBJECT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`color-swatch ${value === c ? 'selected' : ''}`}
            style={{ background: c }}
            onClick={() => onChange(c)}
            title={c}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>
    </div>
  );
}
