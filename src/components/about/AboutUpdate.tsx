"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import EditorQuote from "@/components/editor/EditorQuote";
import { getAllPeople, type OurPeople } from "@/services/OurPeopleService";
import {
  updateAbout,
  getAboutPeopleIds,
  setAboutPeople,
  type About,
  type I18N,
} from "@/services/AboutService";

interface AboutUpdateProps {
  about: About;
  onClose: () => void;
  onUpdate: (updated: About) => void;
}

const emptyI18N: I18N = { vi: "", en: "" };

function getPeopleId(p: OurPeople): number | null {
  const raw: any = (p as any)?.id;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

const t = (i18n?: I18N, locale: "vi" | "en" = "vi") =>
  (i18n?.[locale] ?? i18n?.en ?? i18n?.vi ?? "").trim();

export default function AboutUpdate({
  about,
  onClose,
  onUpdate,
}: AboutUpdateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState<I18N>(about.title || { ...emptyI18N });
  const [content, setContent] = useState<I18N>(
    about.content || { ...emptyI18N }
  );

  const [people, setPeople] = useState<OurPeople[]>([]);
  const [peopleIds, setPeopleIds] = useState<number[]>([]);
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoadingPeople(true);

        const [resPeople, ids] = await Promise.all([
          getAllPeople({ page: 1, limit: 200, search: "" }),
          getAboutPeopleIds(about.id as number),
        ]);

        if (!mounted) return;

        setPeople(resPeople.data ?? []);
        setPeopleIds(ids ?? []);
      } catch {
        toast.error("Không tải được dữ liệu about/nhân sự");
      } finally {
        if (mounted) setIsLoadingPeople(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [about.id]);

  const togglePeople = (id: number, checked: boolean) => {
    setPeopleIds((prev) => {
      const set = new Set(prev);
      if (checked) set.add(id);
      else set.delete(id);
      return Array.from(set);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!(title.vi || title.en)) {
      toast.warning("Vui lòng nhập tiêu đề (VI hoặc EN)");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: Partial<About> = {
        title: { en: title.en || "", vi: title.vi || "" },
        content: { en: content.en || "", vi: content.vi || "" },
      };

      const updated = await updateAbout(about.id as number, payload);

      await setAboutPeople({
        aboutId: about.id as number,
        peopleIds,
      });

      toast.success("Cập nhật about thành công", {
        description: <strong>{t(title)}</strong>,
      });

      onUpdate(updated);
      onClose();
    } catch (err: any) {
      const message =
        err?.message || err?.error?.message || "Lỗi không xác định";
      toast.error("Cập nhật thất bại", { description: message });
      console.error("Update about error:", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-7xl h-[90vh] relative flex flex-col">
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Cập nhật about</h2>
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-400"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          id="update-about-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-4 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Title (EN)"
              value={title.en || ""}
              onChange={(v) => setTitle((p) => ({ ...p, en: v }))}
            />
            <Input
              label="Tiêu đề (VI)"
              value={title.vi || ""}
              onChange={(v) => setTitle((p) => ({ ...p, vi: v }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-white">Content (EN)</label>
              <EditorQuote
                initialContent={content.en || ""}
                onContentChange={(v) => setContent((p) => ({ ...p, en: v }))}
                folder="about"
              />
            </div>
            <div>
              <label className="block mb-1 text-white">Nội dung (VI)</label>
              <EditorQuote
                initialContent={content.vi || ""}
                onContentChange={(v) => setContent((p) => ({ ...p, vi: v }))}
                folder="about"
              />
            </div>
          </div>
          <div>
            <label className="block mb-2 text-white font-medium">
              Ban lãnh đạo
            </label>

            <div className="max-h-[220px] overflow-auto rounded-lg border border-gray-600 bg-black p-3 space-y-2">
              {isLoadingPeople ? (
                <div className="text-gray-400 text-sm">Đang tải…</div>
              ) : people.length === 0 ? (
                <div className="text-gray-400 text-sm">Không có nhân sự</div>
              ) : (
                people.map((p) => {
                  const pid = getPeopleId(p);
                  if (pid === null) return null;

                  const checked = peopleIds.includes(pid);
                  const label =
                    t(p.name as any) || (p.email ?? "").trim() || `#${pid}`;

                  return (
                    <label
                      key={String((p as any).id)}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/5 px-2 py-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => togglePeople(pid, e.target.checked)}
                      />
                      <span className="truncate">
                        {label}
                        <span className="text-gray-400">
                          {t(p.position as any)
                            ? ` — ${t(p.position as any)}`
                            : ""}
                        </span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </form>

        <div className="sticky bottom-0 z-10 bg-[#1c1c1e] px-6 py-4 border-t border-white/10">
          <button
            type="submit"
            form="update-about-form"
            className="w-full py-2 rounded-lg bg-buttonRoot text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu…
              </>
            ) : (
              "Cập nhật about"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label className="block mb-1 text-white">{label}</label>
      <input
        className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600 placeholder-gray-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
