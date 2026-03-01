import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Clock,
  Award,
  Timer,
  Calendar,
  Loader2,
  BarChart3,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuizHistory: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Số lượng bản ghi mỗi trang

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await api.attempt.getUserAttempts();
        console.log("attempt data:", data);
        setHistory(
          Array.isArray(data)
            ? data
            : Array.isArray(data.data)
              ? data.data
              : []
        );
      } catch (err) {
        console.error("Lỗi fetch lịch sử:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Tính toán dữ liệu phân trang
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = history.slice(indexOfFirstItem, indexOfLastItem);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Loader2 className="animate-spin text-purple-600 w-10 h-10" />
    </div>
  );

  return (
    <div className="pt-28 pb-20 px-4 max-w-6xl mx-auto transition-colors duration-300">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-purple-600 rounded-2xl shadow-lg shadow-purple-200 dark:shadow-none">
          <TrendingUp className="text-white w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Lịch sử rèn luyện</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Chi tiết kết quả qua từng lần thực hiện bài Quiz.</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-16 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 transition-colors">
          <BarChart3 className="mx-auto w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Bạn chưa thực hiện bài thi nào.</p>
          <button
            onClick={() => navigate('/generate')}
            className="mt-4 text-purple-600 dark:text-purple-400 font-black hover:underline"
          >
            Làm bài ngay &rarr;
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-8 py-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Bộ Quiz</th>
                    <th className="px-6 py-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Lần</th>
                    <th className="px-6 py-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Điểm số</th>
                    <th className="px-6 py-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Thời gian</th>
                    <th className="px-8 py-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Ngày làm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {currentItems.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-purple-50/30 dark:hover:bg-purple-900/20 transition-all group cursor-pointer"
                      onClick={() => navigate(`/history/detail/${item._id}`)}
                    >
                      <td className="px-8 py-5">
                        <div className="font-black text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {item.quizTitle}
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter mt-1">
                          ID: {item.quiz?.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-black">
                          #{item.attemptNumber}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full font-black text-sm transition-colors">
                          <Award className="w-4 h-4" />
                          <span>{item.score} / {item.totalQuestions}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center font-bold text-gray-500 dark:text-gray-400">
                        <div className="flex items-center justify-center gap-1.5">
                          <Timer className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                          <span>{formatTime(item.duration)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right text-gray-400 dark:text-gray-500 text-sm font-bold">
                        <div className="flex items-center justify-end gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Section */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-none"
                        : "bg-white dark:bg-gray-900 text-gray-400 border-2 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizHistory;