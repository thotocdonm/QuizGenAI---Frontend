import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Clock, Award, BookOpen, Loader2 } from 'lucide-react';

const QuizHistory: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await api.quiz.getHistory();
        
        // Kiểm tra log xem dữ liệu về đến máy khách chưa
        console.log("Dữ liệu lịch sử từ API:", response);

        // Đảm bảo lấy đúng mảng data từ object { success: true, data: [...] }
        if (response.success === true || response.success === "true") {
          setHistory(response.data || []);
        }
      } catch (err) {
        console.error("Lỗi fetch lịch sử:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="pt-28 pb-20 px-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center space-x-3">
        <Clock className="w-8 h-8 text-blue-600" />
        <span>Lịch sử làm Quiz</span>
      </h1>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-bold text-gray-600">Bộ Quiz</th>
              <th className="px-6 py-4 font-bold text-gray-600">Chủ đề</th>
              <th className="px-6 py-4 font-bold text-gray-600 text-center">Điểm số</th>
              <th className="px-6 py-4 font-bold text-gray-600 text-center">Thời gian hoàn thành</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-bold text-gray-900">{item.quizTitle}</td>
                <td className="px-6 py-4 text-gray-500">{item.topic}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold">
                    <Award className="w-3 h-3" />
                    <span>{item.score} / {item.totalQuestions}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-gray-400 text-sm">
                  {new Date(item.completedAt).toLocaleString('vi-VN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.length === 0 && (
          <div className="p-12 text-center text-gray-400">Bạn chưa thực hiện bài thi nào.</div>
        )}
      </div>
    </div>
  );
};

export default QuizHistory;