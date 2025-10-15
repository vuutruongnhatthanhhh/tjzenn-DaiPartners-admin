"use client";

import { useEffect, useState } from "react";
import { X, Trash } from "lucide-react";
import { createCourse } from "@/services/CourseService";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import CategoryCourseSelect from "@/components/course/CategoryCourseSelect";
import ImageBox from "@/components/image/ImageBox";
import { slugify } from "@/utils/slugify";

interface AddCourseModalProps {
  onClose: () => void;
  onAdded?: () => void;
}

interface User {
  id: number;
  name: string;
}

export default function CourseAdd({ onClose, onAdded }: AddCourseModalProps) {
  const [form, setForm] = useState({
    title: "",
    url: "",
    image: "",
    shortDescription: "",
    category: "",
    isHide: false,
    isFree: true,
    price: 0,
    goals: [] as string[],
    includes: [] as string[],
    accordion: [] as { chapter: string; lessons: string[] }[],
    videoDemo: "",
    chapterCount: 0,
    lessonCount: 0,
    hourCount: 0,
    author: null as number | null,
  });

  const [users, setUsers] = useState<User[]>([]);
  const [showImagePopup, setShowImagePopup] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("users").select("id, name");
      if (!error && data) setUsers(data);
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image) {
      toast.warning("Vui lòng chọn ảnh khóa học");
      return;
    }

    try {
      if (form.author == null) {
        toast.error("Vui lòng chọn tác giả");
        return;
      }

      await createCourse({
        ...form,
        author: form.author,
      });

      toast.success("Thêm khóa học thành công");
      onClose();
      onAdded?.();
    } catch (err) {
      if (err instanceof Error) {
        if (
          err?.message?.includes("duplicate key value") &&
          err?.message?.includes("courses_url_key")
        ) {
          toast.error("URL khóa học đã tồn tại. Vui lòng chọn URL khác.");
        } else {
          toast.error("Thêm khóa học thất bại");
          console.error(err);
        }
      } else {
        toast.error("Thêm khóa học thất bại (unknown error)");
        console.error(err);
      }
    }
  };

  const addChapter = () => {
    setForm({
      ...form,
      accordion: [...form.accordion, { chapter: "", lessons: [] }],
    });
  };

  const removeChapter = (index: number) => {
    const newAccordion = [...form.accordion];
    newAccordion.splice(index, 1);
    setForm({ ...form, accordion: newAccordion });
  };

  const updateChapter = (index: number, chapter: string) => {
    const newAccordion = [...form.accordion];
    newAccordion[index].chapter = chapter;
    setForm({ ...form, accordion: newAccordion });
  };

  const addLesson = (chapterIndex: number) => {
    const newAccordion = [...form.accordion];
    newAccordion[chapterIndex].lessons.push("");
    setForm({ ...form, accordion: newAccordion });
  };

  const updateLesson = (
    chapterIndex: number,
    lessonIndex: number,
    value: string
  ) => {
    const newAccordion = [...form.accordion];
    newAccordion[chapterIndex].lessons[lessonIndex] = value;
    setForm({ ...form, accordion: newAccordion });
  };

  const removeLesson = (chapterIndex: number, lessonIndex: number) => {
    const newAccordion = [...form.accordion];
    newAccordion[chapterIndex].lessons.splice(lessonIndex, 1);
    setForm({ ...form, accordion: newAccordion });
  };

  const formatNumberWithDots = (num: number) =>
    num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-md h-[90vh] relative flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">
            Thêm khóa học{" "}
            <span className={form.isFree ? "text-green-400" : "text-red-400"}>
              {form.isFree ? "miễn phí" : "trả phí"}
            </span>
          </h2>
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-400"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          id="add-course-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-4 space-y-4"
        >
          {/* Tab switch free / premium */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${
                form.isFree
                  ? "bg-green-600 text-white border-green-700"
                  : "bg-[#2c2c2e] text-gray-400 border-gray-600"
              }`}
              onClick={() => setForm({ ...form, isFree: true })}
            >
              Miễn phí
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${
                !form.isFree
                  ? "bg-red-400 text-white border-red-500"
                  : "bg-[#2c2c2e] text-gray-400 border-gray-600"
              }`}
              onClick={() => setForm({ ...form, isFree: false })}
            >
              Trả phí
            </button>
          </div>

          <InputField
            label="Tên khóa học"
            value={form.title}
            onChange={(v) =>
              setForm({
                ...form,
                title: v,
                // Automatically generate URL from title
                url: slugify(v),
              })
            }
          />
          <InputField
            label="URL"
            value={form.url}
            onChange={(v) => setForm({ ...form, url: v })}
          />
          <div>
            <label className="block mb-1 text-white">
              Ảnh khóa học <span className="text-red-500">(1536 x 1024)</span>
            </label>
            {form.image ? (
              <div className="relative w-32 h-32 mb-2">
                <img
                  src={form.image}
                  alt={form.title}
                  className="w-full h-full object-cover rounded border border-gray-700"
                />
                <button
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-2 text-xs"
                  onClick={() => setForm({ ...form, image: "" })}
                >
                  ✕
                </button>
              </div>
            ) : null}

            <button
              type="button"
              className="text-sm text-blue-400"
              onClick={() => setShowImagePopup(true)}
            >
              + Chọn ảnh từ thư viện
            </button>
          </div>

          <InputField
            label="Mô tả ngắn"
            value={form.shortDescription}
            onChange={(v) => setForm({ ...form, shortDescription: v })}
          />
          <CategoryCourseSelect
            value={form.category}
            onChange={(v) => setForm({ ...form, category: v })}
          />

          {/* Author */}
          <div>
            <label className="block mb-1 text-white">Tác giả</label>
            <select
              className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600"
              value={form.author ?? ""}
              onChange={(e) =>
                setForm({ ...form, author: parseInt(e.target.value) })
              }
              required
            >
              <option value="" disabled>
                -- Chọn tác giả --
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* visible when premium */}
          {!form.isFree && (
            <>
              <InputField
                label="Giá khóa học (VND)"
                value={form.price === 0 ? "" : formatNumberWithDots(form.price)}
                onChange={(v) => {
                  // Remove dots and parse to integer
                  const raw = v.replace(/\./g, "");
                  const parsed = parseInt(raw || "0");
                  setForm({ ...form, price: parsed });
                }}
              />
              <InputField
                label="Video demo (URL youtube)"
                value={form.videoDemo}
                onChange={(v) => setForm({ ...form, videoDemo: v })}
              />
              <InputField
                label="Số chương"
                value={form.chapterCount.toString()}
                onChange={(v) =>
                  setForm({ ...form, chapterCount: parseInt(v || "0") })
                }
              />
              <InputField
                label="Số bài giảng"
                value={form.lessonCount.toString()}
                onChange={(v) =>
                  setForm({ ...form, lessonCount: parseInt(v || "0") })
                }
              />
              <InputField
                label="Tổng số giờ học"
                value={form.hourCount.toString()}
                onChange={(v) =>
                  setForm({ ...form, hourCount: parseInt(v || "0") })
                }
              />
              {/* Goals  */}
              <div>
                <label className="block mb-1 text-white">
                  Những gì bạn sẽ học
                </label>
                {form.goals.map((goal, index) => (
                  <div key={index} className="flex items-center gap-2 mb-1">
                    <input
                      value={goal}
                      onChange={(e) => {
                        const updatedGoals = [...form.goals];
                        updatedGoals[index] = e.target.value;
                        setForm({ ...form, goals: updatedGoals });
                      }}
                      className="flex-1 px-2 py-1 rounded bg-black text-white border border-gray-600"
                      placeholder={`Những gì sẽ học ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updatedGoals = [...form.goals];
                        updatedGoals.splice(index, 1);
                        setForm({ ...form, goals: updatedGoals });
                      }}
                    >
                      <Trash className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, goals: [...form.goals, ""] })
                  }
                  className="text-sm text-blue-400 mt-1"
                >
                  + Thêm
                </button>
              </div>

              {/* Includes */}
              <div>
                <label className="block mb-1 text-white">
                  Khóa học bao gồm
                </label>
                {form.includes.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 mb-1">
                    <input
                      value={item}
                      onChange={(e) => {
                        const updatedIncludes = [...form.includes];
                        updatedIncludes[index] = e.target.value;
                        setForm({ ...form, includes: updatedIncludes });
                      }}
                      className="flex-1 px-2 py-1 rounded bg-black text-white border border-gray-600"
                      placeholder={`Khóa học bao gồm ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updatedIncludes = [...form.includes];
                        updatedIncludes.splice(index, 1);
                        setForm({ ...form, includes: updatedIncludes });
                      }}
                    >
                      <Trash className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, includes: [...form.includes, ""] })
                  }
                  className="text-sm text-blue-400 mt-1"
                >
                  + Thêm
                </button>
              </div>

              {/* Accordion*/}
              <div>
                <label className="block mb-1 text-white">
                  Nội dung khóa học
                </label>

                {form.accordion.map((chapter, chapterIndex) => (
                  <div
                    key={chapterIndex}
                    className="mb-4 border border-white/10 rounded p-2 relative"
                  >
                    <button
                      type="button"
                      onClick={() => removeChapter(chapterIndex)}
                      className="absolute top-1 right-1 text-red-400 hover:text-red-300"
                      title="Xoá chương"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                    <InputField
                      label={`Chương ${chapterIndex + 1}`}
                      value={chapter.chapter}
                      onChange={(v) => updateChapter(chapterIndex, v)}
                    />
                    <div className="pl-2">
                      {chapter.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lessonIndex}
                          className="flex items-center gap-2 mb-1"
                        >
                          <input
                            value={lesson}
                            onChange={(e) =>
                              updateLesson(
                                chapterIndex,
                                lessonIndex,
                                e.target.value
                              )
                            }
                            className="flex-1 px-2 py-1 rounded bg-black text-white border border-gray-600"
                            placeholder={`Bài học`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              removeLesson(chapterIndex, lessonIndex)
                            }
                          >
                            <Trash className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addLesson(chapterIndex)}
                        className="text-xs text-green-400 mt-1"
                      >
                        + Thêm bài học
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addChapter}
                  className="text-sm text-blue-400 mb-2"
                >
                  + Thêm chương
                </button>
              </div>
            </>
          )}

          <div>
            <label className="block mb-1 text-white">Trạng thái hiển thị</label>
            <select
              className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600"
              value={form.isHide ? "hidden" : "visible"}
              onChange={(e) =>
                setForm({ ...form, isHide: e.target.value === "hidden" })
              }
            >
              <option value="visible">Hiển thị</option>
              <option value="hidden">Ẩn</option>
            </select>
          </div>
        </form>

        {/* Footer form */}
        <div className="sticky bottom-0 z-10 bg-[#1c1c1e] px-6 py-4 border-t border-white/10">
          <button
            type="submit"
            form="add-course-form"
            className="w-full py-2 rounded-lg bg-buttonRoot text-white font-semibold"
          >
            Thêm mới
          </button>
        </div>
      </div>
      {showImagePopup && (
        <ImageBox
          open={showImagePopup}
          onClose={() => setShowImagePopup(false)}
          folder="course"
          handleImageSelect={(url) => {
            setForm({ ...form, image: url });
            setShowImagePopup(false);
          }}
        />
      )}
    </div>
  );
}

const InputField = ({
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
