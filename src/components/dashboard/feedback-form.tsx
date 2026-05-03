"use client";

import { ChangeEvent, useState } from "react";

type Props = {
  title: string;
  eyebrow: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  referenceLabel: string;
  onReferenceLabelChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onSubmit: () => Promise<void> | void;
  disabled: boolean;
  buttonLabel: string;
  fileLabel?: string;
  accept?: string;
};

export function FeedbackForm({
  title,
  eyebrow,
  placeholder,
  value,
  onChange,
  referenceLabel,
  onReferenceLabelChange,
  onFileChange,
  onSubmit,
  disabled,
  buttonLabel,
  fileLabel = "Optional reference image",
  accept = "image/png,image/jpeg,image/webp",
}: Props) {
  const [fileName, setFileName] = useState("");

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setFileName(file?.name ?? "");
    onFileChange(file);
  };

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="note-form">
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} placeholder={placeholder} />
        <input value={referenceLabel} onChange={(event) => onReferenceLabelChange(event.target.value)} placeholder="Optional reference label" />
        <label className="upload-field">
          <span>{fileName || fileLabel}</span>
          <input type="file" accept={accept} onChange={handleFile} />
        </label>
        <button className="primary-button" disabled={disabled} type="button" onClick={onSubmit}>
          {buttonLabel}
        </button>
      </div>
    </section>
  );
}
