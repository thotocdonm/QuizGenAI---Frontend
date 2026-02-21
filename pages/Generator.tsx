import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, HelpCircle, Loader2, AlertCircle } from "lucide-react";

type QuestionType =
  | "multipleStatements"
  | "singleChoice"
  | "multipleChoice"
  | "mixed";

const questionTypeOptions: Array<{
  value: QuestionType;
  label: string;
}> = [
  {
    value: "multipleStatements",
    label: "Câu hỏi nhiều mệnh đề",
  },
  {
    value: "singleChoice",
    label: "Trắc nghiệm",
  },
  {
    value: "multipleChoice",
    label: "Chọn nhiều đáp án",
  },
  {
    value: "mixed",
    label: "Cả 3 loại câu hỏi trên",
  },
];

const Generator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    topic: "", // Theo yêu cầu Jira (trước đây là prompt)
    numQuestions: 5,
    difficulty: "medium", // lowercase theo ví dụ request body của Jira
    questionType: "singleChoice" as QuestionType,
  });

  // 1. Hàm Validation input theo yêu cầu Jira
  const validateForm = () => {
    if (formData.title.trim().length < 5) {
      setError("Tiêu đề Quiz phải có ít nhất 5 ký tự.");
      return false;
    }
    if (formData.topic.trim().length < 10) {
      setError("Chủ đề/Nội dung phải chi tiết hơn (ít nhất 10 ký tự).");
      return false;
    }
    setError(null);
    return true;
  };

  useEffect(() => {
    const message = (location.state as any)?.errorMessage;
    if (message) setError(message);
  }, [location.state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra validation trước khi gửi
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    navigate("/generating", {
      state: { formData: { ...formData } },
    });
  };

  return (
    <div className="pt-32 pb-16 px-4 flex justify-center items-center min-h-[90vh] bg-gray-50">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Quiz Generator
          </h1>
          <p className="text-gray-600 font-medium">
            Cấu hình các thông số để AI tạo bộ câu hỏi cho bạn.
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 border border-gray-100">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm font-bold">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Field: Title - Mới thêm theo Jira */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Quiz Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ví dụ: Kiểm tra Toán cơ bản"
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
              />
            </div>

            {/* Field: Topic */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center space-x-1">
                <span>Quiz Topic / Content</span>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </label>
              <textarea
                required
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                placeholder="Dán nội dung bài học hoặc mô tả chủ đề tại đây (ít nhất 10 ký tự)..."
                className="w-full h-40 px-5 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all resize-none font-medium"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Field: Number of Questions */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Số lượng câu hỏi
                </label>
                <select
                  value={formData.numQuestions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numQuestions: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700"
                >
                  {[5, 10, 15, 20, 25, 30].map((n) => (
                    <option key={n} value={n}>
                      {n} câu
                    </option>
                  ))}
                </select>
              </div>

              {/* Field: Difficulty */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Độ khó
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData({ ...formData, difficulty: e.target.value })
                  }
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700"
                >
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>

              {/* Field: Question Type */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Loại câu hỏi
                </label>
                <select
                  value={formData.questionType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      questionType: e.target.value as QuestionType,
                    })
                  }
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700"
                >
                  {questionTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-3 bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>ĐANG TẠO...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>START GENERATION</span>
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
