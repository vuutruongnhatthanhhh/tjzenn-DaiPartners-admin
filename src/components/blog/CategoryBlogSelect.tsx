import React from "react";

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
}

const categories = [
  { value: "KHÁM PHÁ", label: "KHÁM PHÁ" },
  { value: "BLOCKCHAIN", label: "BLOCKCHAIN" },
  { value: "WEB & MOBILE", label: "WEB & MOBILE" },
];

export default function CategoryBlogSelect({
  value,
  onChange,
}: CategorySelectProps) {
  return (
    <div>
      <label className="block mb-1 text-white">Danh mục</label>
      <select
        className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="" disabled>
          -- Chọn danh mục --
        </option>
        {categories.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
