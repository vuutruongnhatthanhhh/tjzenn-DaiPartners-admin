"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { createLesson } from "@/services/LessonService";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Editor from "@/components/editor/Editor";

interface AddLessonModalProps {
  onClose: () => void;
  onAdd: (lesson: {
    title: string;
    videoUrl: string;
    content: string;
    course: number;
  }) => void;
}

export default function LessonAdd({ onClose, onAdd }: AddLessonModalProps) {
  const [form, setForm] = useState({
    title: "",
    videoUrl: "",
    content: "",
    course: "",
  });
  const [courses, setCourses] = useState<{ id: number; title: string }[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title")
        .eq("isFree", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCourses(data);
      } else {
        toast.error("Lỗi khi tải danh sách khóa học");
      }
    };

    fetchCourses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newLesson = await createLesson({
        ...form,
        course: Number(form.course),
      });

      toast.success("TẠO BÀI HỌC THÀNH CÔNG", {
        description: (
          <>
            <strong>{form.title}</strong> đã được thêm vào khóa học.
          </>
        ),
      });

      onAdd(newLesson);
      onClose();
    } catch (err: any) {
      toast.error("TẠO BÀI HỌC THẤT BẠI", {
        description: err.message || "Lỗi không xác định",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-md h-[90vh] relative flex flex-col">
        {/* Header form */}
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Thêm bài học</h2>
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-400"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          id="add-lesson-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-4 space-y-4"
        >
          <div>
            <label className="block mb-1 text-white">Tiêu đề</label>
            <input
              className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-white">Video URL</label>
            <input
              className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600"
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-white">Khóa học (free)</label>
            <select
              className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600"
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
              required
            >
              <option value="" disabled>
                -- Chọn khóa học --
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className=" block mb-1 text-white">
              Nội dung <span className="text-red-500">(Ảnh 1536 x 1024)</span>
            </label>

            <Editor
              initialContent={form.content}
              onContentChange={(content) =>
                setForm((prev) => ({ ...prev, content }))
              }
              folder="course"
            />
          </div>
        </form>

        {/* Footer form */}
        <div className="sticky bottom-0 z-10 bg-[#1c1c1e] px-6 py-4 border-t border-white/10">
          <button
            type="submit"
            form="add-lesson-form"
            className="w-full py-2 rounded-lg bg-buttonRoot text-white font-semibold"
          >
            Thêm bài học
          </button>
        </div>
      </div>
    </div>
  );
}
