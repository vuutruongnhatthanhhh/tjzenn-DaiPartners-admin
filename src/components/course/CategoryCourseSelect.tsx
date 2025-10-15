"use client";

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CategorySelect({
  value,
  onChange,
}: CategorySelectProps) {
  const categories = ["WEBSITE", "MOBILE", "BLOCKCHAIN", "KHÁC"];

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
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
}
