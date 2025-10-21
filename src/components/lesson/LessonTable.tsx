"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Youtube } from "lucide-react";
import CareerAdd from "@/components/career/CareerAdd";
import LessonUpdate from "@/components/lesson/LessonUpdate";
import { getAllLessons, deleteLesson } from "@/services/LessonService";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function LessonTable() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [course, setCourse] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [courseOptions, setCourseOptions] = useState<any[]>([]);

  const fetchLessons = async () => {
    try {
      const res = await getAllLessons({
        page,
        limit: 10,
        search: debouncedSearch,
        course,
      });

      if (res.data.length === 0 && page > 1) {
        setPage(1);
        return;
      }

      setLessons(res.data);
      setTotalPages(res.totalPages);
      setTotalLessons(res.total);
    } catch (err) {
      console.error("Lỗi khi fetch lessons:", err);
    }
  };

  const fetchCourses = async () => {
    const { data } = await supabase
      .from("courses")
      .select("id, title")
      .eq("isFree", true)
      .order("created_at", { ascending: false });
    setCourseOptions(data || []);
  };

  useEffect(() => {
    if (showAddModal || selectedLesson) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [showAddModal, selectedLesson]);

  useEffect(() => {
    fetchLessons();
    fetchCourses();
  }, [page, debouncedSearch, course]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: number) => {
    const lessonToDelete = lessons.find((l) => l.id === id);
    if (!lessonToDelete) return;

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa bài học "${lessonToDelete.title}"?`
    );
    if (confirmed) {
      try {
        await deleteLesson(id);
        await fetchLessons();

        toast.success("XÓA THÀNH CÔNG", {
          description: (
            <>
              <strong>{lessonToDelete.title}</strong> đã bị xoá khỏi hệ thống.
            </>
          ),
        });
      } catch (error: any) {
        toast.error("XÓA THẤT BẠI", {
          description: error.message,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] text-white p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">
          Quản lý bài học{" "}
          <span className="text-3xl font-bold text-green-600">
            ({totalLessons})
          </span>
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-buttonRoot rounded-xl"
        >
          <Plus className="w-4 h-4" /> Thêm bài học
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mt-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Tìm tiêu đề bài học"
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600 w-[300px]"
        />

        <select
          value={course}
          onChange={(e) => {
            setPage(1);
            setCourse(Number(e.target.value));
          }}
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600 w-[200px]"
        >
          <option value={0}>Tất cả khóa học</option>
          {courseOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr>
              <th className="px-4 py-2">Tiêu đề</th>
              <th className="px-4 py-2">Video</th>
              <th className="px-4 py-2 max-w-[160px]">Khóa học</th>
              <th className="px-4 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {lessons.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-400">
                  Không tìm thấy bài học nào
                </td>
              </tr>
            ) : (
              lessons.map((lesson) => (
                <tr
                  key={lesson.id}
                  className="bg-[#1c1c1e] hover:bg-[#2a2a2e] rounded-xl transition"
                >
                  <td className="px-4 py-3 rounded-l-xl max-w-[200px] truncate">
                    {lesson.title}
                  </td>
                  <td className="px-4 py-3 max-w-[240px] truncate text-blue-400">
                    <a href={lesson.videoUrl} target="_blank" rel="noreferrer">
                      <Youtube />
                    </a>
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate">
                    {lesson.course?.title ? (
                      lesson.course.title
                    ) : (
                      <span className="text-red-400 italic font-medium">
                        Khóa học đã bị xóa
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right rounded-r-xl">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedLesson(lesson)}
                        className="hover:text-yellow-400"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(lesson.id)}
                        className="hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {showAddModal && (
          <CareerAdd
            onClose={() => setShowAddModal(false)}
            onAdd={fetchLessons}
          />
        )}

        {selectedLesson && (
          <LessonUpdate
            lesson={selectedLesson}
            onClose={() => setSelectedLesson(null)}
            onUpdate={() => fetchLessons()}
          />
        )}
      </div>

      {lessons.length > 0 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
          >
            Trang trước
          </button>
          <span className="px-3 py-1 text-sm">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}
