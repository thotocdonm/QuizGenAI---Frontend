import React, { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, Sparkles, Brain, XCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "@/services/api";

const QuizGenerating: React.FC = () => {
  const [step, setStep] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const [success, setSuccess] = useState<boolean | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasRequestedRef = useRef(false);
  const formData = (location.state as any)?.formData;
  
  const steps = [
    "Đang phân tích nội dung...",
    "Trích xuất các ý chính...",
    "Tạo câu hỏi trắc nghiệm và đáp án...",
    "Thiết lập giải thích chi tiết...",
    "Hoàn tất bộ Quiz của bạn!",
  ];

  useEffect(() => {
    if (!formData) {
      navigate("/generate", { replace: true });
    }
  }, [formData, navigate]);

  useEffect(() => {
    if (!formData || hasRequestedRef.current) return;
    hasRequestedRef.current = true;

    const run = async () => {
      try {
        const response = await api.quiz.generate(formData);
        // Kiểm tra success linh hoạt (boolean hoặc string "true")
        const ok = response?.success === true || response?.success === "true";
        const id = ok
          ? response.quizId || response.data?._id || response.data?.id
          : null;
        
        setSuccess(ok);
        setQuizId(id ?? null);
        if (!ok) {
          setErrorMessage(response?.message || "Tạo quiz thất bại.");
        }
      } catch (err: any) {
        setSuccess(false);
        setErrorMessage(
          err?.response?.data?.message || "Không thể kết nối đến máy chủ.",
        );
      }
    };

    run();
  }, [formData]);

  const done = success !== null;

  useEffect(() => {
    if (done) {
      setStep(steps.length - 1);
      return;
    }
    const interval = setInterval(() => {
      setStep((prev) => Math.min(prev + 1, steps.length - 2)); // Chừa bước cuối cho lúc done
    }, 2000);
    return () => clearInterval(interval);
  }, [done, steps.length]);

  useEffect(() => {
    if (!done) return;
    
    // Nếu thành công, đợi 1 chút để user thấy bước cuối hoàn tất rồi mới chuyển trang
    const timer = setTimeout(() => {
      if (success && quizId) {
        navigate(`/quiz/${quizId}/edit`, { replace: true });
      } else {
        navigate("/generate", {
          replace: true,
          state: { errorMessage: errorMessage || "Tạo quiz thất bại." },
        });
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [done, success, quizId, errorMessage, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 transition-colors duration-300">
      <div className="max-w-md w-full text-center">
        {/* Animated Brain Icon Section */}
        <div className="relative mb-10 flex justify-center">
          <div className="absolute inset-0 bg-purple-400/20 dark:bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative bg-white dark:bg-gray-900 p-8 rounded-full shadow-2xl dark:shadow-none border border-gray-100 dark:border-gray-800 transition-colors">
            <Brain className="w-16 h-16 text-purple-600 dark:text-purple-400 animate-bounce" />
          </div>
        </div>

        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-10 tracking-tight transition-colors">
          AI đang làm phép màu...
        </h2>

        {/* Steps List */}
        <div className="space-y-5 text-left bg-white/50 dark:bg-gray-900/30 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 transition-colors">
          {steps.map((text, i) => {
            const isActive = i === step;
            const isCompleted = i < step;
            const isLastStep = i === steps.length - 1;

            return (
              <div
                key={i}
                className={`flex items-center space-x-4 transition-all duration-500 ${
                  i <= step ? "opacity-100 translate-x-0" : "opacity-20 -translate-x-2"
                }`}
              >
                <div className="flex-shrink-0">
                  {isCompleted || (isLastStep && success) ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-in zoom-in duration-300" />
                  ) : isActive && !done ? (
                    <Loader2 className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-spin" />
                  ) : isLastStep && success === false ? (
                    <XCircle className="w-6 h-6 text-red-500" />
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 rounded-full" />
                  )}
                </div>

                <span
                  className={`text-sm font-bold tracking-tight transition-colors ${
                    isActive ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Tip Box */}
        <div className="mt-12 p-5 bg-purple-50 dark:bg-purple-900/10 rounded-[1.5rem] border border-purple-100 dark:border-purple-900/20 flex items-start space-x-3 text-left transition-colors">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-purple-700 dark:text-purple-300 leading-relaxed">
            Mẹo: Quiz càng chi tiết khi nội dung bạn cung cấp có đầy đủ ngữ cảnh và dữ liệu.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuizGenerating;