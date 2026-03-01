import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  Play,
  Edit,
  Trash2,
  Loader2,
  Plus,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuizManage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  // const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Số lượng bản ghi trên mỗi trang

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const quizRes = await api.quiz.getQuizzes();

        setQuizzes(
          Array.isArray(quizRes)
            ? quizRes
            : Array.isArray(quizRes.data)
              ? quizRes.data
              : [],
        );
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Tính toán dữ liệu phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuizzes = quizzes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(quizzes.length / itemsPerPage);

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "Bạn có chắc muốn xóa Quiz này? Dữ liệu không thể khôi phục.",
      )
    ) {
      try {
        const res = await api.quiz.delete(id);
        // Kiểm tra kết quả trả về từ backend
        if (res.success || res.success === "true") {
          setQuizzes((prev) => prev.filter((q) => q._id !== id));
          // Nếu xóa hết item ở trang hiện tại, tự động lùi về trang trước
          if (currentQuizzes.length === 1 && currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
          }
        }
      } catch (err) {
        alert("Xóa thất bại!");
      }
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors">
        <Loader2 className="animate-spin text-purple-600 w-12 h-12" />
      </div>
    );

  return (
    <div className="pt-28 pb-20 px-4 max-w-7xl mx-auto transition-colors duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-purple-600 rounded-2xl shadow-xl shadow-purple-200 dark:shadow-none transition-all">
            <LayoutGrid className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Quản lý Quiz
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Chỉnh sửa nội dung và theo dõi hiệu suất các bài tập.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/generate")}
          className="bg-purple-600 text-white px-7 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-200 dark:shadow-none transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Tạo bộ Quiz mới</span>
        </button>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 transition-colors shadow-sm">
          <AlertCircle className="mx-auto w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            Chưa có dữ liệu
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">
            Danh sách trống trơn. Hãy để AI giúp bạn tạo ra những bộ câu hỏi đầu
            tiên!
          </p>
          <button
            onClick={() => navigate("/generate")}
            className="text-purple-600 dark:text-purple-400 font-black hover:underline"
          >
            Bắt đầu ngay &rarr;
          </button>
        </div>
      ) : (
        <>
          {/* Table Container */}
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      Tên bộ Quiz
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
                      Độ khó
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
                      Số câu
                    </th>
                    {/* <th className="px-6 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Lượt làm</th> */}
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {currentQuizzes.map((quiz) => (
                    <tr
                      key={quiz._id}
                      className="hover:bg-purple-50/20 dark:hover:bg-purple-900/10 transition-colors group"
                    >
                      <td
                        onClick={() => navigate(`/manage/${quiz._id}`)}
                        className="px-8 py-6 font-black text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
                      >
                        {quiz.title}
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg text-[10px] font-black uppercase transition-colors">
                          {quiz.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-center font-bold text-gray-500 dark:text-gray-400">
                        {quiz.questions?.length || 0} câu
                      </td>
                      {/* <td className="px-6 py-6 text-center">
                          <div className="font-black text-purple-600 dark:text-purple-400 text-lg">{count}</div>
                        </td> */}
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => navigate(`/quiz/${quiz._id}`)}
                            className="p-2.5 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-all"
                            title="Chơi ngay"
                          >
                            <Play className="w-5 h-5 fill-current" />
                          </button>
                          <button
                            onClick={() => navigate(`/quiz/${quiz._id}/edit`)}
                            className="p-2.5 text-amber-500 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-xl transition-all"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(quiz._id)}
                            className="p-2.5 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all"
                            title="Xóa"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:border-purple-500 dark:hover:border-purple-500 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${
                      currentPage === i + 1
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-none"
                        : "bg-white dark:bg-gray-900 text-gray-400 border-2 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:border-purple-500 dark:hover:border-purple-500 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuizManage;
