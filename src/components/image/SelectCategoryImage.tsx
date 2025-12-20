"use client";

import React from "react";

interface ImageCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
}

const SelectCategory: React.FC<ImageCategorySelectProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="inline-block w-[150px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded border border-gray-300 bg-white text-black"
      >
        <option value="blog">Bài viết</option>
        <option value="people">Đội ngũ</option>
        <option value="offices">Văn phòng</option>
      </select>
    </div>
  );
};

export default SelectCategory;
