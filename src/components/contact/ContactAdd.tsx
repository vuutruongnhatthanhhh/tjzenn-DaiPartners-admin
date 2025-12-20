"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createContact, type Contact } from "@/services/ContactService";
import { getAllOffices } from "@/services/OfficeService";
import { getAllPeople } from "@/services/OurPeopleService";
import type { Office } from "@/services/OfficeService";
import type { OurPeople } from "@/services/OurPeopleService";

interface ContactAddProps {
  onClose: () => void;
  onAdd: (contact: Contact) => void;
}

const t = (i18n?: { vi?: string; en?: string }, locale: "vi" | "en" = "vi") =>
  (i18n?.[locale] ?? i18n?.en ?? i18n?.vi ?? "").trim();

export default function ContactAdd({ onClose, onAdd }: ContactAddProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<number | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [ggMapEmbed, setGgMapEmbed] = useState<string>(""); // <-- mới thêm

  const [offices, setOffices] = useState<Office[]>([]);
  const [people, setPeople] = useState<OurPeople[]>([]);
  const [loadingOffices, setLoadingOffices] = useState(true);
  const [loadingPeople, setLoadingPeople] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingOffices(true);
        const resOff = await getAllOffices({ page: 1, limit: 200 });
        if (mounted) setOffices(resOff.data ?? []);
      } catch {
        toast.error("Không tải được danh sách văn phòng");
      } finally {
        if (mounted) setLoadingOffices(false);
      }
    })();

    (async () => {
      try {
        setLoadingPeople(true);
        const resPe = await getAllPeople({ page: 1, limit: 200, search: "" });
        if (mounted) setPeople(resPe.data ?? []);
      } catch {
        toast.error("Không tải được danh sách nhân sự");
      } finally {
        if (mounted) setLoadingPeople(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!selectedOffice || !selectedPerson) {
      toast.warning("Vui lòng chọn cả văn phòng và người liên hệ");
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createContact(
        selectedOffice,
        selectedPerson,
        ggMapEmbed.trim() || null // truyền gg_map_embed (null nếu để trống)
      );

      toast.success("Đã tạo liên kết contact thành công");
      onAdd(created);
      onClose();
    } catch (err: any) {
      toast.error("Thêm contact thất bại", {
        description: err?.message || "Lỗi không xác định",
      });
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
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-4xl h-[90vh] relative flex flex-col">
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">
            Thêm liên kết Contact
          </h2>
          <button
            className="absolute top-6 right-6 text-white"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-6 space-y-8"
        >
          {/* Chọn Văn phòng */}
          <div>
            <label className="block mb-3 text-white font-medium">
              Chọn Văn phòng
            </label>
            <select
              value={selectedOffice ?? ""}
              onChange={(e) =>
                setSelectedOffice(Number(e.target.value) || null)
              }
              className="w-full px-4 py-3 rounded-lg bg-black text-white border border-gray-600"
              disabled={loadingOffices}
            >
              <option value="">-- Chọn văn phòng --</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {t(o.title)} ({t(o.address)})
                </option>
              ))}
            </select>
            {loadingOffices && (
              <p className="text-sm text-gray-400 mt-1">
                Đang tải văn phòng...
              </p>
            )}
          </div>

          {/* Chọn Người liên hệ */}
          <div>
            <label className="block mb-3 text-white font-medium">
              Chọn Người liên hệ
            </label>
            <select
              value={selectedPerson ?? ""}
              onChange={(e) =>
                setSelectedPerson(Number(e.target.value) || null)
              }
              className="w-full px-4 py-3 rounded-lg bg-black text-white border border-gray-600"
              disabled={loadingPeople}
            >
              <option value="">-- Chọn người --</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {t(p.name)} — {t(p.position)} ({p.email})
                </option>
              ))}
            </select>
            {loadingPeople && (
              <p className="text-sm text-gray-400 mt-1">Đang tải nhân sự...</p>
            )}
          </div>

          {/* Link Google Maps Embed */}
          <div>
            <label className="block mb-3 text-white font-medium">
              Link Google Maps Embed (tùy chọn)
            </label>
            <input
              type="url"
              placeholder="https://www.google.com/maps/embed?pb=..."
              value={ggMapEmbed}
              onChange={(e) => setGgMapEmbed(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-black text-white border border-gray-600 placeholder-gray-500"
            />
            <p className="text-sm text-gray-400 mt-2">
              Vào Google Maps → Share → Embed a map → Copy phần src của iframe
              và dán vào đây. Để trống nếu chưa có.
            </p>
          </div>
        </form>

        <div className="sticky bottom-0 z-10 bg-[#1c1c1e] px-6 py-4 border-t border-white/10">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg bg-buttonRoot text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Thêm liên kết Contact"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
