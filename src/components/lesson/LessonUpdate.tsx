"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { updateLesson, Lesson } from "@/services/LessonService";
import { supabase } from "@/lib/supabaseClient";
import Editor from "@/components/editor/Editor";

interface UpdateLessonModalProps {
  onClose: () => void;
  lesson: Lesson;
  onUpdate: (lesson: Lesson) => void;
}

export default function LessonUpdate({
  onClose,
  lesson,
  onUpdate,
}: UpdateLessonModalProps) {
  const [form, setForm] = useState({
    title: lesson.title,
    videoUrl: lesson.videoUrl,
    content: lesson.content,
    course:
      typeof lesson.course === "object" && lesson.course !== null
        ? lesson.course.id
        : lesson.course ?? null,
  });

  const [courses, setCourses] = useState<{ id: number; title: string }[]>([]);

  useEffect(() => {
    supabase
      .from("courses")
      .select("id, title")
      .eq("isFree", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setCourses(data);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.course == null) return toast.warning("Vui lòng chọn khóa học");

    try {
      const updated = await updateLesson(lesson.id, {
        ...form,
        course: form.course ?? undefined,
      });
      toast.success("Cập nhật thành công");
      onUpdate(updated);
      onClose();
    } catch (err: any) {
      toast.error("Cập nhật thất bại", {
        description: err?.message || "Lỗi không xác định",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-md h-[90vh] relative flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Cập nhật bài học</h2>
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-400"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          id="update-lesson-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-4 space-y-4"
        >
          <Input
            label="Tiêu đề"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
          />
          <Input
            label="Video URL"
            value={form.videoUrl}
            onChange={(v) => setForm({ ...form, videoUrl: v })}
          />

          <div>
            <label className="block mb-1 text-white">Khóa học</label>
            <select
              className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600"
              value={form.course ?? ""}
              onChange={(e) =>
                setForm({ ...form, course: parseInt(e.target.value) })
              }
              required
            >
              <option value="" disabled>
                -- Chọn khóa học --
              </option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-white">
              Nội dung <span className="text-red-500">(1536 x 1024)</span>
            </label>
            <Editor
              initialContent={form.content}
              onContentChange={(content) => setForm({ ...form, content })}
              folder="course"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-[#1c1c1e] px-6 py-4 border-t border-white/10">
          <button
            type="submit"
            form="update-lesson-form"
            className="w-full py-2 rounded-lg bg-buttonRoot text-white font-semibold"
          >
            Cập nhật bài học
          </button>
        </div>
      </div>
    </div>
  );
}

const Input = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) => (
  <div>
    <label className="block mb-1 text-white">{label}</label>
    <input
      className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
    />
  </div>
);
