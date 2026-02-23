import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Play,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import { api } from "@/services/api";
import { getAccessToken } from "@/utils/authUtils";

const QuizStart: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    if (!id) return;
    setStartError(null);

    const token = getAccessToken();
    if (!token) {
      const returnTo = `${location.pathname}${location.search}`;
      navigate("/auth", { state: { from: returnTo } });
      return;
    }

    const maxAttempts = Number(quiz?.maxAttempts);
    if (Number.isFinite(maxAttempts) && maxAttempts > 0) {
      setStarting(true);
      let shouldBlock = false;
      try {
        const attempts = await api.attempt.getUserAttempts();
        const quizId = String(id);
        const attemptCount = Array.isArray(attempts)
          ? attempts.filter((attempt) => {
              const attemptQuizId = String(
                attempt?.quiz?._id ?? attempt?.quiz ?? "",
              );
              const isDeleted = Boolean(attempt?.isDeleted);
              return attemptQuizId === quizId && !isDeleted;
            }).length
          : 0;

        if (attemptCount >= maxAttempts) {
          setStartError("Bạn đã hết số lần làm bài.");
          shouldBlock = true;
        }
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          // No attempts yet - allow start
        } else if (status === 401) {
          setStartError("Bạn cần đăng nhập để làm bài.");
          shouldBlock = true;
        } else {
          setStartError("Không thể bắt đầu quiz. Vui lòng thử lại.");
          shouldBlock = true;
        }
      } finally {
        setStarting(false);
      }
      if (shouldBlock) return;
    }

    sessionStorage.setItem(`quiz-start:${id}`, "1");
    navigate(`/quiz/${id}`, { state: { isFromStart: true } });
  };

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id) {
        setPageError("Thiếu quiz ID trên URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.quiz.getPublic(id);
        if (!response) {
          setPageError("Không tìm thấy quiz.");
          return;
        }
        setQuiz(response);
      } catch (err) {
        console.error("Lỗi lấy quiz (public):", err);
        setPageError("Không thể tải quiz. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  const questionCount = quiz?.questions?.length ?? 0;
  const timeLimitMinutes = useMemo(() => {
    if (!quiz || typeof quiz.timeLimit !== "number" || quiz.timeLimit <= 0) {
      return null;
    }
    // Backend lưu timeLimit theo giây, UI hiển thị theo phút.
    return Math.max(1, Math.round(quiz.timeLimit / 60));
  }, [quiz?.timeLimit]);

  const difficultyBadge = useMemo(() => {
    const level = String(quiz?.difficulty ?? "").toLowerCase();
    if (level.includes("dễ") || level.includes("easy")) {
      return "bg-emerald-100 text-emerald-700";
    }
    if (level.includes("khó") || level.includes("hard")) {
      return "bg-rose-100 text-rose-700";
    }
    return "bg-amber-100 text-amber-700";
  }, [quiz?.difficulty]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">
          Đang chuẩn bị bài quiz...
        </p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full text-center bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Không thể mở quiz
          </h2>
          <p className="text-gray-500 mb-6">{pageError}</p>
          <button
            onClick={() => navigate("/generate")}
            className="w-full bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all"
          >
            Quay lại trang tạo quiz
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500 font-medium">Không có dữ liệu quiz.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-24 pb-16 px-4 relative overflow-hidden">
      <div className="absolute -top-24 right-0 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 left-0 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-10 items-center">
          {/* Left: Hero content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Sẵn sàng bắt đầu</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-4">
              {quiz.title || "Bài Quiz"}
            </h1>

            <p className="text-gray-600 text-lg leading-relaxed max-w-xl">
              Hít một hơi thật sâu, tập trung và chọn đáp án tốt nhất. Bạn có
              thể quay lại câu trước và chỉ nộp bài khi đã chắc chắn.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-8">
              <button
                onClick={handleStart}
                disabled={starting}
                className="group flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {starting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                <span>{starting ? "Đang kiểm tra..." : "Bắt đầu làm bài"}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate("/")}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:text-blue-700 transition-all bg-white"
              >
                Thoát
              </button>
            </div>

            {startError && (
              <div className="mt-4 flex items-start gap-2 text-sm text-red-600 font-semibold">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span>{startError}</span>
              </div>
            )}

            <div className="mt-8 flex items-start gap-3 text-sm text-gray-500">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <p>
                Lưu ý: Đáp án đúng chỉ hiển thị sau khi bạn nộp bài. Hãy cố gắng
                hoàn thành trong một lần làm để có kết quả chính xác nhất.
              </p>
            </div>
          </div>

          {/* Right: Info Card */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-blue-100 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600" />

            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-600 font-bold mb-2">
                  Thông tin quiz
                </p>
                <h2 className="text-2xl font-black text-gray-900">
                  {quiz.title || "Bài Quiz"}
                </h2>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${difficultyBadge}`}
              >
                {quiz.difficulty || "Trung bình"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase">
                  <ClipboardList className="w-4 h-4" />
                  Số câu
                </div>
                <p className="text-2xl font-black text-gray-900 mt-2">
                  {questionCount}
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase">
                  <Clock className="w-4 h-4" />
                  Thời gian (phút)
                </div>
                <p className="text-2xl font-black text-gray-900 mt-2">
                  {timeLimitMinutes ?? "--"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                "Chọn một đáp án duy nhất cho mỗi câu hỏi.",
                "Bạn có thể quay lại để kiểm tra các câu trước.",
                "Nhấn nộp bài ở câu cuối để xem điểm và giải thích.",
              ].map((text, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-blue-50/60 rounded-2xl p-4 text-sm text-blue-800"
                >
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizStart;
