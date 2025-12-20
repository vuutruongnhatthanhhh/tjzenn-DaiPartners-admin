"use client";

import React, { useMemo, useState } from "react";

function isValidUrl(u: string) {
  try {
    if (!u) return true;
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

export default function QuoteCardView(props: any) {
  const node = props?.node;
  const updateAttributes = props?.updateAttributes;
  const selected = !!props?.selected;
  const deleteNode = props?.deleteNode;

  const attrs = (node?.attrs ?? {}) as {
    source?: string;
    href?: string;
    quote?: string;
  };

  const source = (attrs.source ?? "") as string;
  const href = (attrs.href ?? "") as string;
  const quote = (attrs.quote ?? "") as string;

  const [editing, setEditing] = useState(false);
  const hrefOk = useMemo(() => isValidUrl(href), [href]);

  const onDelete = () => {
    const ok = confirm("Bạn có chắc muốn xóa quote đã chọn");
    if (!ok) return;
    if (typeof deleteNode === "function") deleteNode();
  };

  return (
    <div
      data-quote-card-wrap="1"
      className={[
        "rounded-xl border border-white/10 bg-white/5 p-4",
        selected ? "ring-2 ring-white/20" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">Quote</div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/70">
            <span className="truncate max-w-[420px]">
              {source ? `Nguồn: ${source}` : "Nguồn: (chưa nhập)"}
            </span>

            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className={[
                  "underline underline-offset-2",
                  hrefOk ? "text-white/80 hover:text-white" : "text-red-300",
                ].join(" ")}
                onClick={(e) => {
                  if (editing) e.preventDefault();
                }}
              >
                Link
              </a>
            ) : (
              <span className="text-white/40">chưa có link</span>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-white/10 bg-black/30 px-3 py-1 text-xs text-white hover:bg-black/40"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? "Xong" : "Sửa"}
          </button>

          <button
            type="button"
            className="rounded-md border border-white/10 bg-red-500/80 px-3 py-1 text-xs text-white hover:bg-red-500"
            onClick={onDelete}
            title="Xóa quote"
          >
            Xóa
          </button>
        </div>
      </div>

      <div className="mt-3">
        {!editing ? (
          <blockquote className="border-l-2 border-white/20 pl-3 text-sm text-white/90 whitespace-pre-wrap">
            {quote || "…"}
          </blockquote>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field
              label="Tên bài báo"
              value={source}
              onChange={(v) => updateAttributes?.({ source: v })}
            />
            <Field
              label="Đường link"
              value={href}
              onChange={(v) => updateAttributes?.({ href: v })}
              error={!hrefOk ? "Link không hợp lệ" : ""}
            />
            <div className="md:col-span-2">
              <label className="block mb-1 text-xs text-white/70">
                Nội dung quote
              </label>
              <textarea
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/30 min-h-[110px]"
                value={quote}
                onChange={(e) => updateAttributes?.({ quote: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="block mb-1 text-xs text-white/70">{label}</label>
      <input
        className={[
          "w-full rounded-lg bg-black/40 border px-3 py-2 text-sm text-white outline-none",
          error ? "border-red-400/60" : "border-white/10 focus:border-white/30",
        ].join(" ")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <div className="mt-1 text-xs text-red-300">{error}</div> : null}
    </div>
  );
}
