'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface Props {
  value?: string | null;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  description?: string;
  accept?: string;
  /** Visual size: square (default) or wide hero ratio. */
  variant?: 'square' | 'wide' | 'avatar';
  className?: string;
}

const variantClass = {
  square: 'w-28 h-28',
  wide: 'w-full max-w-md aspect-[16/9]',
  avatar: 'w-20 h-20 rounded-full',
};

export default function ImageUpload({
  value,
  onChange,
  folder = 'uploads',
  label,
  description,
  accept = 'image/*,video/mp4,video/webm,image/gif',
  variant = 'square',
  className,
}: Props) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onChange(data.url);
      toast.success('Uploaded');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  const isVideo = value?.match(/\.(mp4|webm|mov)$/i);

  return (
    <div className={className}>
      {label && <label className="admin-label">{label}</label>}
      {description && <p className="text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)] -mt-1 mb-2">{description}</p>}

      <div className="flex items-start gap-4 flex-wrap">
        {value ? (
          <div className={cn('relative group rounded-xl overflow-hidden border border-[var(--color-admin-border)] dark:border-[var(--color-admin-border-dark)] bg-[var(--color-admin-surface-2)] dark:bg-[var(--color-admin-surface-2-dark)]', variantClass[variant])}>
            {isVideo ? (
              <video src={value} className="w-full h-full object-cover" muted />
            ) : (
              <Image src={value} alt="" fill className="object-cover" unoptimized sizes="200px" />
            )}
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              aria-label="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className={cn('flex items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-admin-border-strong)] dark:border-[var(--color-admin-border-strong-dark)] bg-[var(--color-admin-surface-2)] dark:bg-[var(--color-admin-surface-2-dark)] text-[var(--color-admin-faint)] dark:text-[var(--color-admin-faint-dark)]', variantClass[variant])}>
            <ImageIcon className="w-7 h-7" />
          </div>
        )}

        <label
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={cn('admin-dropzone min-w-[14rem] flex-1', busy && 'pointer-events-none opacity-60')}
        >
          {busy ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mb-1.5" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mb-1.5" />
              <span className="font-medium text-[var(--color-admin-ink-2)] dark:text-[var(--color-admin-ink-2-dark)]">
                {value ? 'Replace file' : 'Click to upload'}
              </span>
              <span className="text-[11px] mt-1">or drag & drop</span>
            </>
          )}
          <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" disabled={busy} />
        </label>
      </div>
    </div>
  );
}
