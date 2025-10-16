"use client";

import { useEffect, useRef, useState } from "react";
import { X, Trash2, Search, Upload } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

type CvItem = {
  name: string;
  path: string;
  url: string;
  size?: number;
  updated_at?: string;
};

export default function CvBox({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  const BUCKET = "images-storage";
  const FOLDER = "cv";

  const LIST_CHUNK = 50; // mỗi lần gọi list lấy 50

  const [items, setItems] = useState<CvItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [q, setQ] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safeName = (name: string) =>
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-");

  const toUrl = (path: string) =>
    supabase.storage.from(BUCKET).getPublicUrl(path).data?.publicUrl || "";

  // ===== Tải toàn bộ danh sách (theo lô) rồi mới render một lần =====
  async function fetchAll() {
    try {
      setLoading(true);

      let nextOffset = 0;
      const all: CvItem[] = [];

      while (true) {
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .list(FOLDER, {
            limit: LIST_CHUNK,
            offset: nextOffset,
            sortBy: { column: "updated_at", order: "desc" },
          });
        if (error) throw error;

        if (!data || data.length === 0) break;
        nextOffset += data.length;

        // lọc bỏ folder/ẩn/placeholder
        const batch = (data || []).filter(
          (x: any) =>
            x.name &&
            !x.name.endsWith("/") &&
            !x.name.startsWith(".") &&
            x.name !== ".emptyFolderPlaceholder"
        );

        // lọc theo search (client-side) để giảm map không cần thiết
        const filtered = q
          ? batch.filter((f: any) =>
              f.name.toLowerCase().includes(q.toLowerCase())
            )
          : batch;

        // map sang CvItem
        for (const f of filtered) {
          const path = `${FOLDER}/${f.name}`;
          all.push({
            name: f.name,
            path,
            url: toUrl(path),
            size: (f as any).metadata?.size ?? undefined,
            updated_at: (f as any).updated_at ?? undefined,
          });
        }

        // nếu trả ít hơn LIST_CHUNK thì hết rồi
        if (data.length < LIST_CHUNK) break;
      }

      setItems(all);
    } catch (err: any) {
      toast.error("Không tải được danh sách CV", {
        description: err?.message || "Lỗi không xác định",
      });
    } finally {
      setLoading(false);
    }
  }

  // mở popup → fetch toàn bộ
  useEffect(() => {
    if (!open) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // debounce search 300ms → fetch toàn bộ với bộ lọc mới
  useEffect(() => {
    if (!open) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchAll();
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // ===== upload =====
  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.warning(`"${file.name}" quá 10MB, Không thể upload.`);
          continue;
        }
        const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
        const base = safeName(file.name.replace(/\.[^/.]+$/, ""));
        const filename = `${base}-${Date.now()}.${ext}`;
        const path = `${FOLDER}/${filename}`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });
        if (error) {
          toast.error(`Tải "${file.name}" thất bại`, {
            description: error.message,
          });
        } else {
          toast.success(`Đã tải "${file.name}"`);
        }
      }
      await fetchAll();
    } catch (err: any) {
      toast.error("Tải lên thất bại", {
        description: err?.message || "Lỗi không xác định",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ===== delete =====
  const deleteItem = async (item: CvItem) => {
    if (!confirm(`Xoá file "${item.name}" khỏi Storage?`)) return;
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([item.path]);
      if (error) throw error;
      toast.success("Đã xoá file");
      await fetchAll();
    } catch (err: any) {
      toast.error("Xoá thất bại", {
        description: err?.message || "Lỗi không xác định",
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] w-full max-w-3xl rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <input
                className="pl-9 pr-3 py-2 rounded-lg bg-black text-white border border-white/10 w-full"
                placeholder="Tìm theo tên file…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 opacity-70" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:justify-end">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.rtf,.txt"
                multiple
                className="hidden"
                onChange={(e) => uploadFiles(e.target.files)}
              />
              <button
                className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white inline-flex items-center gap-2 disabled:opacity-60 w-full sm:w-auto"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Tải lên file"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Đang tải…" : "Tải lên"}
              </button>
              <button className="text-white" onClick={onClose}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-auto p-4">
          {loading && items.length === 0 ? (
            <p className="text-gray-300">Đang tải…</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <p className="text-gray-400">
                Không có file trong thư mục{" "}
                <span className="font-semibold">cv/</span>
              </p>
              <button
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white inline-flex items-center gap-2 disabled:opacity-60"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Đang tải…" : "Tải lên file"}
              </button>
              <p className="text-xs text-gray-500">
                Hỗ trợ: PDF, DOC, DOCX, RTF, TXT (≤ 10MB)
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((it) => (
                <li
                  key={it.path}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-white/10 bg-black/40"
                >
                  <div className="min-w-0">
                    <a
                      className="block truncate underline hover:opacity-80 text-white"
                      href={it.url}
                      title={it.name}
                      download={it.name}
                      target="_blank"
                    >
                      {it.name}
                    </a>
                    <div className="text-xs text-gray-400">
                      {typeof it.size === "number"
                        ? `${Math.round(it.size / 1024)} KB`
                        : ""}
                      {it.updated_at
                        ? ` • cập nhật: ${new Date(
                            it.updated_at
                          ).toLocaleDateString("vi-VN")}`
                        : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-500"
                      onClick={() => {
                        onSelect(it.url);
                        onClose();
                      }}
                    >
                      Chọn
                    </button>
                    <button
                      className="p-2 rounded bg-red-600 hover:bg-red-500"
                      onClick={() => deleteItem(it)}
                      title="Xoá khỏi Storage"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
