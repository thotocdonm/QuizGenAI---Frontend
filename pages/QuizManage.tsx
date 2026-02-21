import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Play, Edit, Trash2, Loader2, Plus, LayoutGrid, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuizManage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Gọi song song danh sách Quiz và danh sách Attempts
        const [quizRes, attemptRes] = await Promise.all([
          api.quiz.getQuizzes(),
          api.attempt.getUserAttempts().catch(() => []) // Nếu 404 thì coi như chưa có lượt nào
        ]);

        setQuizzes(Array.isArray(quizRes) ? quizRes : (quizRes.data || []));
        setAttempts(Array.isArray(attemptRes) ? attemptRes : []);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa Quiz này? Dữ liệu không thể khôi phục.")) {
      try {
        await api.quiz.delete(id);
        setQuizzes(prev => prev.filter(q => q._id !== id));
      } catch (err) {
        alert("Xóa thất bại!");
      }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="pt-28 pb-20 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <LayoutGrid className="text-blue-600" /> Quản lý Quiz
          </h1>
          <p className="text-gray-500">Xem thống kê lượt làm bài và chỉnh sửa nội dung.</p>
        </div>
        <button onClick={() => navigate('/generate')} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100">
          <Plus className="w-5 h-5" /> Tạo Quiz mới
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b">
            <tr>
              <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase">Bộ Quiz</th>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase text-center">Độ khó</th>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase text-center">Câu hỏi</th>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase text-center">Lượt làm</th>
              <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quizzes.map((quiz) => {
              // Logic: Đếm xem có bao nhiêu attempt thuộc về quiz này
              const count = attempts.filter(a => (a.quiz?._id || a.quiz) === quiz._id).length;

              return (
                <tr key={quiz._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5 font-black text-gray-900">{quiz.title}</td>
                  <td className="px-6 py-5 text-center">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase">{quiz.difficulty}</span>
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-gray-500">{quiz.questions?.length || 0}</td>
                  <td className="px-6 py-5 text-center font-black text-blue-600 text-lg">
                    {count}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center space-x-2">
                      <button onClick={() => navigate(`/quiz/${quiz._id}`)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"><Play className="w-5 h-5 fill-current" /></button>
                      <button onClick={() => navigate(`/quiz/${quiz._id}/edit`)} className="p-2 text-amber-500 hover:bg-amber-100 rounded-xl transition-all"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => handleDelete(quiz._id)} className="p-2 text-red-500 hover:bg-red-100 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {quizzes.length === 0 && <div className="p-20 text-center text-gray-400">Bạn chưa tạo Quiz nào.</div>}
      </div>
    </div>
  );
};

export default QuizManage;