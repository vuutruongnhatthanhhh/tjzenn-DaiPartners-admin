"use client";
import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import CourseAdd from "@/components/course/CourseAdd";
import CourseUpdate from "@/components/course/CourseUpdate";
import { getAllCourses, deleteCourse } from "@/services/CourseService";
import { toast } from "sonner";

export default function CourseTable() {
  const [courses, setCourses] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [author, setAuthor] = useState<number | null>(null);
  const [isFree, setIsFree] = useState<string>("");
  const [isHide, setIsHide] = useState<string>("");

  const [totalCourses, setTotalCourses] = useState(0);

  const fetchCourses = async () => {
    try {
      const res = await getAllCourses({
        page,
        limit: 10,
        search: debouncedSearch,
        category,
        author,
        isFree: isFree !== "" ? isFree === "true" : undefined,
        isHide: isHide !== "" ? isHide === "true" : undefined,
      });

      setCourses(res.data);
      setTotalPages(res.totalPages);
      setTotalCourses(res.total);
    } catch (err) {
      toast.error("Lỗi khi lấy danh sách khoá học");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page, debouncedSearch, category, author, isFree, isHide]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="min-h-screen bg-[#0f0f10] text-white p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">
          Quản lý khóa học{" "}
          <span className="text-green-500 text-2xl">({totalCourses})</span>
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-buttonRoot rounded-xl"
        >
          <Plus className="w-4 h-4" /> Thêm khóa học
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Tìm theo tiêu đề..."
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600 w-[280px]"
        />

        <select
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600"
        >
          <option value="">Tất cả chủ đề</option>
          <option value="WEBSITE">Website</option>
          <option value="MOBILE">Mobile</option>
          <option value="BLOCKCHAIN">Blockchain</option>
          <option value="KHÁC">Khác</option>
        </select>

        <select
          value={isFree}
          onChange={(e) => {
            setPage(1);
            setIsFree(e.target.value);
          }}
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600"
        >
          <option value="">Miễn phí / Trả phí</option>
          <option value="true">Miễn phí</option>
          <option value="false">Trả phí</option>
        </select>

        <select
          value={isHide}
          onChange={(e) => {
            setPage(1);
            setIsHide(e.target.value);
          }}
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600"
        >
          <option value="">Hiện / Ẩn</option>
          <option value="false">Hiển thị</option>
          <option value="true">Đã ẩn</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr>
              <th className="px-4 py-2">Tên khóa học</th>
              <th className="px-4 py-2">Danh mục</th>
              <th className="px-4 py-2">Miễn phí</th>
              <th className="px-4 py-2 max-w-[160px] whitespace-nowrap truncate">
                Hiển thị
              </th>
              <th className="px-4 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-6">
                  Không tìm thấy khóa học nào
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr
                  key={course.id}
                  className="bg-[#1c1c1e] hover:bg-[#2a2a2e] rounded-xl transition"
                >
                  <td className="px-4 py-3 rounded-l-xl max-w-[200px] truncate">
                    {course.title}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs md:text-sm font-medium whitespace-nowrap ${
                        course.category === "WEBSITE"
                          ? "bg-blue-500/20 text-blue-400"
                          : course.category === "MOBILE"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : course.category === "BLOCKCHAIN"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-gray-500/20 text-gray-300"
                      }`}
                    >
                      {course.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                        course.isFree
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      } max-w-[160px] whitespace-nowrap truncate`}
                    >
                      {course.isFree ? "Miễn phí" : "Trả phí"}
                    </span>
                  </td>
                  <td className="px-4 py-3 ">
                    {course.isHide ? (
                      <X className="text-red-500" />
                    ) : (
                      <Check className="text-green-500" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right rounded-r-xl">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedCourse(course)}
                        className="hover:text-yellow-400"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            if (
                              confirm(
                                `Xác nhận xoá khóa học: "${course.title}"?`
                              )
                            ) {
                              await deleteCourse(course.id);
                              toast.success("Xoá khóa học thành công");
                              fetchCourses();
                            }
                          } catch (err) {
                            toast.error(err.message);
                            console.error(err.message);
                          }
                        }}
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
          <CourseAdd
            onClose={() => setShowAddModal(false)}
            onAdded={fetchCourses}
          />
        )}
        {selectedCourse && (
          <CourseUpdate
            course={selectedCourse}
            onClose={() => setSelectedCourse(null)}
            onUpdated={fetchCourses}
          />
        )}
      </div>

      {/* Pagination */}
      {courses.length > 0 && (
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
