"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import ContestantPhoto from "@/components/ContestantPhoto";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

export default function PhotoUploader({ uploadAction, removeAction, url, name, hint, disabled = false }) {
  const [uploadState, upload, uploading] = useActionState(uploadAction, null);
  const [removeState, remove, removing] = useActionState(removeAction, null);
  const [, startTransition] = useTransition();
  const [clientError, setClientError] = useState(null);
  const [last, setLast] = useState(null); // which action ran most recently, so stale errors don't linger
  const inputRef = useRef(null);
  const busy = uploading || removing;
  const error = clientError ?? (last === "upload" ? uploadState?.error : last === "remove" ? removeState?.error : null);

  function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file after an error
    setClientError(null);
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type)) {
      setClientError("Choose a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setClientError("That photo is too large. The limit is 10 MB.");
      return;
    }
    const fd = new FormData();
    fd.append("photo", file);
    setLast("upload");
    startTransition(() => upload(fd));
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className={busy ? "animate-pulse" : ""}>
        <ContestantPhoto url={url} name={name} size="lg" />
      </div>
      <div className="flex flex-col gap-2">
        {!disabled && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center rounded-md bg-plum-700 px-3.5 py-2 text-sm font-medium text-white hover:bg-plum-800 disabled:bg-plum-400"
            >
              {uploading ? "Uploading…" : url ? "Replace photo" : "Upload photo"}
            </button>
            {url && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (!window.confirm("Remove this photo?")) return;
                  setClientError(null);
                  setLast("remove");
                  startTransition(() => remove(new FormData()));
                }}
                className="inline-flex items-center rounded-md border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:text-stone-400"
              >
                {removing ? "Removing…" : "Remove"}
              </button>
            )}
            <input ref={inputRef} type="file" name="photo" accept={ACCEPT} onChange={onPick} className="sr-only" tabIndex={-1} aria-label="Choose photo" />
          </div>
        )}
        {hint && <p className="max-w-xs text-xs text-stone-500">{hint}</p>}
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
