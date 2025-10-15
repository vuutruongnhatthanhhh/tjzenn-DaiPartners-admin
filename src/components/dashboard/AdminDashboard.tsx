"use client";
import { useEffect, useState } from "react";
import { Users, GraduationCap, Newspaper } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";
import { getAllUsers } from "@/services/UserService";
import { getAllCourses } from "@/services/CourseService";
import { getAllBlogs } from "@/services/BlogService";

type ChartData = Record<string, { name: string; value: number }[]>;

export default function AdminDashboard() {
  const [selectedChart, setSelectedChart] = useState("Người dùng");
  const [userCount, setUserCount] = useState<number | null>(null);
  const [courseCount, setCourseCount] = useState<number | null>(null);
  const [blogCount, setBlogCount] = useState<number | null>(null);
  const [chartData, setChartData] = useState<ChartData>({
    "Người dùng": [],
    "Khóa học": [],
    "Bài viết": [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [userRes, courseRes, blogRes] = await Promise.all([
          getAllUsers({ limit: 1000 }),
          getAllCourses({ limit: 1000 }),
          getAllBlogs({ limit: 1000 }),
        ]);

        setUserCount(userRes.total);
        setCourseCount(courseRes.total);
        setBlogCount(blogRes.total);

        // group users by role
        const userGroups: Record<string, number> = {};
        userRes.data.forEach((u) => {
          userGroups[u.role] = (userGroups[u.role] || 0) + 1;
        });

        // group courses by category
        const courseGroups: Record<string, number> = {};
        courseRes.data.forEach((c) => {
          courseGroups[c.category] = (courseGroups[c.category] || 0) + 1;
        });

        // group blogs by category
        const blogGroups: Record<string, number> = {};
        blogRes.data.forEach((b) => {
          blogGroups[b.category] = (blogGroups[b.category] || 0) + 1;
        });

        setChartData({
          "Người dùng": Object.entries(userGroups).map(([k, v]) => ({
            name: k,
            value: v,
          })),
          "Khóa học": Object.entries(courseGroups).map(([k, v]) => ({
            name: k,
            value: v,
          })),
          "Bài viết": Object.entries(blogGroups).map(([k, v]) => ({
            name: k,
            value: v,
          })),
        });
      } catch (err) {
        console.error("Lỗi khi lấy thống kê:", err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f10] text-white p-6 space-y-6">
      <h1 className="text-4xl font-bold mb-6">TJZenn Admin Dashboard</h1>

      {/* Statistical */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: <Users className="h-8 w-8 text-green-400" />,
            title: "Người dùng",
            value: userCount !== null ? userCount.toString() : "...",
          },
          {
            icon: <GraduationCap className="h-8 w-8 text-yellow-400" />,
            title: "Khóa học",
            value: courseCount !== null ? courseCount.toString() : "...",
          },
          {
            icon: <Newspaper className="h-8 w-8 text-purple-400" />,
            title: "Bài viết",
            value: blogCount !== null ? blogCount.toString() : "...",
          },
        ].map(({ icon, title, value }) => (
          <div
            key={title}
            onClick={() => setSelectedChart(title)}
            className="bg-[#1c1c1e] cursor-pointer hover:bg-[#2a2a2e] rounded-xl p-6 flex flex-col justify-between shadow-lg transition"
          >
            <div className="flex items-center gap-4 mb-4">
              {icon}
              <h2 className="text-xl font-semibold">{title}</h2>
            </div>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="mt-10 bg-[#1c1c1e] rounded-2xl shadow-lg">
        <div className="h-[22rem]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData[selectedChart]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" hide />
              <YAxis stroke="#ccc" allowDecimals={false} />
              <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                <LabelList
                  dataKey="value"
                  position="insideTop"
                  className="text-sm fill-white"
                />
                <LabelList
                  dataKey="name"
                  position="insideBottom"
                  className="text-xs fill-white"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
