import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Edit, Trash2, Loader2, AlertCircle, Plus } from 'lucide-react';
import { api } from '../services/api';

const QuizManage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await api.quiz.getQuizzes();
      // Backend của bạn trả về mảng trực tiếp cho getAllQuizzes
      setQuizzes(Array.isArray(response) ? response : response.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách quiz:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bộ Quiz này không?")) {
      try {
        await api.quiz.delete(id);
        setQuizzes(quizzes.filter(q => q._id !== id));
      } catch (err) {
        alert("Không thể xóa Quiz. Vui lòng thử lại.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 px-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Thư viện Quiz của tôi</h1>
          <p className="text-gray-500">Quản lý và theo dõi hiệu suất các bộ câu hỏi đã tạo.</p>
        </div>
        <button 
          onClick={() => navigate('/generate')}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus className="w-5 h-5" />
          <span>Tạo Quiz mới</span>
        </button>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-gray-200">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có bộ Quiz nào</h3>
          <p className="text-gray-500 mb-6">Hãy bắt đầu tạo bộ câu hỏi đầu tiên của bạn bằng AI.</p>
          <button onClick={() => navigate('/generate')} className="text-blue-600 font-bold hover:underline">Bắt đầu ngay</button>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
         
<table className="w-full text-left border-collapse">
  <thead>
    <tr className="bg-gray-50 border-b border-gray-100">
      <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Tên bộ Quiz</th>
      <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-center">Độ khó</th>
      <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-center">Số câu</th>
      <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-center">Lượt làm</th> {/* Cột mới */}
      <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-center">Thao tác</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-100">
    {quizzes.map((quiz) => (
      <tr key={quiz._id} className="hover:bg-gray-50/50 transition-colors">
        <td className="px-6 py-4">
          <div className="font-bold text-gray-900">{quiz.title}</div>
          <div className="text-xs text-gray-400 truncate max-w-[200px]">{quiz.topic}</div>
        </td>
        <td className="px-6 py-4 text-center">
          <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-tighter">
            {quiz.difficulty}
          </span>
        </td>
        <td className="px-6 py-4 text-center font-medium text-gray-500">
          {quiz.questions?.length || 0} câu
        </td>
        <td className="px-6 py-4 text-center font-bold text-blue-600">
          {quiz.attempts || 0} {/* Hiển thị số lượt làm từ Backend */}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center justify-center space-x-2">
            {/* NÚT CHƠI - Trỏ về /quiz/:id */}
            <button 
              onClick={() => navigate(`/quiz/${quiz._id}`)} 
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              title="Làm bài ngay"
            >
              <Play className="w-5 h-5 fill-current" />
            </button>

            {/* NÚT SỬA - Trỏ về /quiz/:id/edit */}
            <button 
              onClick={() => navigate(`/quiz/${quiz._id}/edit`)}
              className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
              title="Chỉnh sửa nội dung"
            >
              <Edit className="w-5 h-5" />
            </button>

            {/* NÚT XÓA */}
            <button 
              onClick={() => handleDelete(quiz._id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Xóa bộ Quiz"
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
      )}
    </div>
  );
};

export default QuizManage;