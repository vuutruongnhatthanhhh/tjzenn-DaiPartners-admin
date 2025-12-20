"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateContact, type Contact } from "@/services/ContactService";
import { getAllOffices } from "@/services/OfficeService";
import { getAllPeople } from "@/services/OurPeopleService";
import type { Office } from "@/services/OfficeService";
import type { OurPeople } from "@/services/OurPeopleService";

interface ContactUpdateProps {
  contact: Contact;
  onClose: () => void;
  onUpdate: (updated: Contact) => void;
}

const t = (i18n?: { vi?: string; en?: string }, locale: "vi" | "en" = "vi") =>
  (i18n?.[locale] ?? i18n?.en ?? i18n?.vi ?? "").trim();

export default function ContactUpdate({
  contact,
  onClose,
  onUpdate,
}: ContactUpdateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<number>(
    contact.id_office
  );
  const [selectedPerson, setSelectedPerson] = useState<number>(
    contact.id_people
  );
  const [ggMapEmbed, setGgMapEmbed] = useState<string>(
    contact.gg_map_embed ?? ""
  ); // <-- load từ contact hiện tại

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

    try {
      setIsSubmitting(true);
      const updated = await updateContact(contact.id, {
        id_office: selectedOffice,
        id_people: selectedPerson,
        gg_map_embed: ggMapEmbed.trim() || null, // nếu để trống thì set null
      });

      toast.success("Cập nhật liên kết contact thành công");
      onUpdate(updated);
      onClose();
    } catch (err: any) {
      toast.error("Cập nhật thất bại", {
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
            Sửa liên kết Contact
          </h2>
          <button
            className="absolute top-6 right-6 text-white"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-6 space-y-8"
        >
          {/* Văn phòng */}
          <div>
            <label className="block mb-3 text-white font-medium">
              Văn phòng hiện tại
            </label>
            <select
              value={selectedOffice}
              onChange={(e) => setSelectedOffice(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg bg-black text-white border border-gray-600"
              disabled={loadingOffices}
            >
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

          {/* Người liên hệ */}
          <div>
            <label className="block mb-3 text-white font-medium">
              Người liên hệ hiện tại
            </label>
            <select
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg bg-black text-white border border-gray-600"
              disabled={loadingPeople}
            >
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
              và dán vào đây. Để trống nếu muốn xóa.
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
                Đang cập nhật...
              </>
            ) : (
              "Cập nhật liên kết"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
