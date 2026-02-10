import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2, Sparkles, Brain, XCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const QuizGenerating: React.FC = () => {
  const [step, setStep] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  const { success, quizId, errorMessage } = (location.state as any) || {};
  const steps = [
    "Đang phân tích nội dung...",
    "Trích xuất các ý chính...",
    "Tạo câu hỏi trắc nghiệm và đáp án...",
    "Thiết lập giải thích chi tiết...",
    "Hoàn tất bộ Quiz của bạn!",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;

        // stop when come to the last step
        clearInterval(interval);
        setDone(true);
        return prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [steps.length]);

  useEffect(() => {
    if (!done) return;

    if (success && quizId) {
      navigate(`/quiz/${quizId}/edit`, { replace: true });
    } else {
      navigate("/generate", {
        replace: true,
        state: { errorMessage: errorMessage || "Tạo quiz thất bại." },
      });
    }
  }, [done, success, quizId, errorMessage, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center">
        <div className="relative mb-8 flex justify-center">
          <div className="absolute inset-0 bg-blue-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
          <div className="relative bg-white p-6 rounded-full shadow-xl">
            <Brain className="w-16 h-16 text-blue-600 animate-bounce" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          AI đang làm phép màu...
        </h2>

        <div className="space-y-4 text-left">
          {steps.map((text, i) => (
            <div
              key={i}
              className={`flex items-center space-x-3 transition-opacity duration-500 ${i <= step ? "opacity-100" : "opacity-20"}`}
            >
              {/* {i < step ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : i === step ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-200 rounded-full" />
              )} */}
              {i < step ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : i === step ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              ) : done ? (
                success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )
              ) : (
                <div className="w-5 h-5 border-2 border-gray-200 rounded-full" />
              )}

              <span
                className={`font-medium ${i === step ? "text-blue-600" : "text-gray-600"}`}
              >
                {text}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-12 p-4 bg-blue-50 rounded-2xl flex items-start space-x-3 text-sm text-blue-700">
          <Sparkles className="w-5 h-5 flex-shrink-0" />
          <p>
            Mẹo: Quiz càng chi tiết khi Prompt của bạn cung cấp đủ ngữ cảnh.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuizGenerating;
