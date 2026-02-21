import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Clock, Award, Timer, Calendar, Loader2, BarChart3, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuizHistory: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await api.attempt.getUserAttempts();
        // Xử lý mảng rỗng nếu controller trả về 404
        setHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Lỗi fetch lịch sử:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Đổi giây sang mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="pt-28 pb-20 px-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
          <TrendingUp className="text-white w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900">Lịch sử rèn luyện</h1>
          <p className="text-gray-500 font-medium">Chi tiết kết quả và thời gian qua các lần thực hiện bài Quiz.</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-16 text-center border-2 border-dashed border-gray-200">
          <BarChart3 className="mx-auto w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Bạn chưa thực hiện bài thi nào.</p>
          <button onClick={() => navigate('/generate')} className="mt-4 text-blue-600 font-black">Làm bài ngay &rarr;</button>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b">
              <tr>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Bộ Quiz</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Lần</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Điểm số</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Thời gian</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Ngày làm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((item) => (
                <tr key={item._id} className="hover:bg-indigo-50/20 transition-all group">
                  <td className="px-8 py-5">
                    <div className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {item.quizTitle} {/* Lấy trực tiếp từ field quizTitle trong Model Attempt */}
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: {item.quiz?.substring(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-black">#{item.attemptNumber}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full font-black text-sm">
                      <Award className="w-4 h-4" /> {item.score} / {item.totalQuestions}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-gray-500">
                    <div className="flex items-center justify-center gap-1.5">
                      <Timer className="w-4 h-4 text-gray-300" /> {formatTime(item.duration)}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right text-gray-400 text-sm font-bold">
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
      )}
    </div>
  );
};

export default QuizHistory;