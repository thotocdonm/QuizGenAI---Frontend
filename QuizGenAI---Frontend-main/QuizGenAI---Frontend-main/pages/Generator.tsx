import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, HelpCircle, Loader2 } from 'lucide-react';
import { Difficulty } from '../types';
import { api } from '../services/api'; // Đảm bảo đường dẫn này đúng với file api service của bạn

const Generator: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    prompt: '',
    numQuestions: 5,
    difficulty: Difficulty.MEDIUM
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Chuyển hướng sang trang loading (QuizGenerating mà tôi đã tạo cho bạn)
      // Hoặc bạn có thể giữ user ở đây và hiện spinner
      
      // Giả sử api của bạn đã có phương thức post hoặc dùng axios trực tiếp
      // Endpoint này phải khớp với backend: /api/quiz/generate

      // SỬA DÒNG NÀY: Gọi đúng hàm trong service quiz

      const response = await api.quiz.generate(formData); 
         // Lưu ý: Vì trong file api.ts hàm generate đã return response.data 
      // nên ở đây 'response' chính là object { success, message, data }
      if (response && response.success === "true") {
        const quizId = response.data._id;
        navigate(`/quiz/${quizId}`);
      } else {
        alert(response.message || "Có lỗi xảy ra khi tạo Quiz");
      }
    } catch (error: any) {
      console.error("Lỗi tạo Quiz:", error);
      alert(error.response?.data?.message || "Không thể tạo Quiz. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="pt-32 pb-16 px-4 flex justify-center items-center min-h-[90vh] bg-gray-50">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Quiz Generator</h1>
          <p className="text-gray-600">AI sẽ giúp bạn soạn câu hỏi chỉ trong vài giây.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center space-x-1">
                <span>Chủ đề Quiz / Prompt</span>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </label>
              <textarea
                required
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                placeholder="Ví dụ: Lịch sử Việt Nam triều đại nhà Trần, Kiến thức Python cơ bản..."
                className="w-full h-32 px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all resize-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Số lượng câu hỏi</label>
                <select
                  value={formData.numQuestions}
                  onChange={(e) => setFormData({ ...formData, numQuestions: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all"
                >
                  {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} Câu hỏi</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Độ khó</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all"
                >
                  {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-3 bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Đang khởi tạo câu hỏi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>Bắt đầu tạo Quiz</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Generator;