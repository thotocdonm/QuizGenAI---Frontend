import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  Info,
} from "lucide-react";
import { api } from "@/services/api";
// import { api } from '../services/api'; // <--- TẠM THỜI KHÓA KHI DÙNG MOCK DATA

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  showCancel = true,
  danger = false,
  onConfirm,
  onCancel,
}) => {
 if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm px-4 transition-all duration-300">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <h3 className="text-lg font-black text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
          {description}
        </p>
        
        <div className="mt-6 flex items-center justify-end gap-3">
          {showCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-bold text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all active:scale-95"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 ${
              danger
                ? "bg-red-500 hover:bg-red-600 shadow-red-200 dark:shadow-none"
                : "bg-purple-600 hover:bg-purple-700 shadow-purple-200 dark:shadow-none"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
const QuizPlay: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isPreview = Boolean((location.state as any)?.isPreview);
  const isFromStart = Boolean((location.state as any)?.isFromStart);
  const hasStartFlag = id
    ? sessionStorage.getItem(`quiz-start:${id}`) === "1"
    : false;
  type UserAnswer = number | number[];

  useEffect(() => {
    if (!id) {
      navigate("/", { replace: true });
      return;
    }
    if (isPreview) return;
    if (isFromStart || hasStartFlag) return;

    navigate(`/quiz/${id}/start`, { replace: true });
  }, [id, isPreview, isFromStart, hasStartFlag, navigate]);

  useEffect(() => {
    return () => {
      if (!id) return;
      sessionStorage.removeItem(`quiz-start:${id}`);
    };
  }, [id]);

  // States
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, UserAnswer>>(
    {},
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isCountdownMode, setIsCountdownMode] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [timeLeftSec, setTimeLeftSec] = useState<number | null>(null);
  const autoSubmittedRef = useRef(false);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [confirmSubmittedOpen, setConfirmSubmittedOpen] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const quizKey = quiz?._id ?? quiz?.id;

  // ==================================
  // LOGIC LẤY DỮ LIỆU THẬT TỪ BACKEND
  // ==================================
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        if (isPreview) {
          const response = await api.quiz.getById(id as string);
          if (response) {
            setQuiz(response);
          }
        } else {
          const publicQuiz = await api.quiz.getPublic(id as string);
          let resolvedQuiz = publicQuiz;

          // Try enriching payload for owner (public endpoint does not include questionType/correctAnswer).
          try {
            const ownerQuiz = await api.quiz.getById(id as string);
            if (ownerQuiz?.questions?.length) resolvedQuiz = ownerQuiz;
          } catch {
            // Non-owner users will receive 403 here; keep public quiz.
          }

          if (resolvedQuiz) {
            setQuiz(resolvedQuiz);
          }
        }
      } catch (err) {
        console.error("Lỗi lấy chi tiết quiz (public):", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id, isPreview]);
  // ============================================================

  useEffect(() => {
    if (!id || isPreview) return;
    if (!quiz) return;

    const maxAttempts = Number(quiz?.maxAttempts);
    if (!Number.isFinite(maxAttempts) || maxAttempts <= 0) return;

    let cancelled = false;

    const checkAttempts = async () => {
      try {
        const attempts = await api.attempt.getUserAttempts();
        if (cancelled) return;
        const attemptCount = Array.isArray(attempts)
          ? attempts.filter((attempt) => {
              const attemptQuizId = String(
                attempt?.quiz?._id ?? attempt?.quiz ?? "",
              );
              const isDeleted = Boolean(attempt?.isDeleted);
              return attemptQuizId === String(id) && !isDeleted;
            }).length
          : 0;

        if (attemptCount >= maxAttempts) {
          navigate(`/quiz/${id}/start`, { replace: true });
        }
      } catch (err: any) {
        if (cancelled) return;
        const status = err?.response?.status;
        if (status === 401) {
          navigate(`/quiz/${id}/start`, { replace: true });
        }
      }
    };

    checkAttempts();

    return () => {
      cancelled = true;
    };
  }, [id, isPreview, quiz?.maxAttempts, quizKey, navigate]);
  useEffect(() => {
    if (!quiz) {
      setIsCountdownMode(false);
      setElapsedSec(0);
      setTimeLeftSec(null);
      autoSubmittedRef.current = false;
      return;
    }

    const raw = Number(quiz.timeLimit);

    // Không có timeLimit hoặc timeLimit = 0 => đếm xuôi từ 00:00
    if (!Number.isFinite(raw) || raw <= 0) {
      setIsCountdownMode(false);
      setElapsedSec(0);
      setTimeLeftSec(null);
      autoSubmittedRef.current = false;
      return;
    }

    // Backend lưu theo giây
    const totalSec = Math.max(1, Math.round(raw));
    setIsCountdownMode(true);
    setElapsedSec(0);
    setTimeLeftSec(totalSec);
    autoSubmittedRef.current = false;
  }, [quizKey, quiz?.timeLimit]);

  // useEffect(() => {
  //   if (!quiz) {
  //     setTimeLeftSec(null);
  //     setInitialTimeSec(null);
  //     return;
  //   }
  //   const fallbackTimeLimitSec = 0 * 60;
  //   const totalSec =
  //     typeof quiz.timeLimit === "number" && quiz.timeLimit > 0
  //       ? Math.max(0, Math.round(quiz.timeLimit))
  //       : fallbackTimeLimitSec;
  //   setTimeLeftSec(totalSec);
  //   setInitialTimeSec(totalSec);
  //   autoSubmittedRef.current = false;
  // }, [quiz?._id, quiz?.timeLimit]);
  //==================================
  //=== thêm timeLimit bên backend ===
  //==================================
  //   useEffect(() => {
  //   if (!quiz) {
  //     setTimeLeftSec(null);
  //     return;
  //   }
  //   if (typeof quiz.timeLimit !== "number" || quiz.timeLimit <= 0) {
  //     setTimeLeftSec(null);
  //     return;
  //   }
  //   // Backend lưu timeLimit theo giây.
  //   setTimeLeftSec(Math.round(quiz.timeLimit));
  // }, [quiz?._id, quiz?.timeLimit]);

  useEffect(() => {
    if (isSubmitted) return;
    if (!quiz) return;
    if (isCountdownMode && (timeLeftSec === null || timeLeftSec <= 0)) return;

    const timerId = window.setTimeout(() => {
      setElapsedSec((prev) => prev + 1);
      if (isCountdownMode) {
        setTimeLeftSec((prev) =>
          prev === null ? null : Math.max(0, prev - 1),
        );
      }
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [quizKey, isSubmitted, isCountdownMode, timeLeftSec, elapsedSec]);

  const resolveQuestionType = (question: any): string => {
    const rawType = question?.questionType ?? quiz?.questionType;
    if (typeof rawType === "string" && rawType.trim()) {
      return rawType.trim();
    }
    if (Array.isArray(question?.correctAnswer)) {
      return "multipleChoice";
    }
    return "singleChoice";
  };

  const QUESTION_TYPE_LABEL: Record<string, string> = {
    multipleStatements: "Chọn đáp án đúng nhất về các mệnh đề",
    singleChoice: "Chọn một đáp án đúng",
    multipleChoice: "Có thể chọn nhiều đáp án",
  };

  const getQuestionTypeLabel = (question: any) => {
    const type = resolveQuestionType(question);
    return QUESTION_TYPE_LABEL[type] ?? "Câu hỏi";
  };

  const isMultipleChoiceQuestion = (question: any) =>
    resolveQuestionType(question) === "multipleChoice";

  const normalizeAnswerArray = (value: unknown): number[] =>
    Array.isArray(value)
      ? [
          ...new Set(
            value.map((v) => Number(v)).filter((v) => Number.isInteger(v)),
          ),
        ].sort((a, b) => a - b)
      : typeof value === "number" && Number.isInteger(value)
        ? [value]
        : [];

  const hasAnswered = (question: any, answer: UserAnswer | undefined) => {
    if (isMultipleChoiceQuestion(question)) {
      return Array.isArray(answer) && answer.length > 0;
    }
    return typeof answer === "number";
  };

  const isAnswerCorrect = (question: any, answer: UserAnswer | undefined) => {
    if (!hasAnswered(question, answer)) return false;
    if (isMultipleChoiceQuestion(question)) {
      const selected = normalizeAnswerArray(answer);
      const correct = normalizeAnswerArray(question?.correctAnswer);
      return (
        selected.length === correct.length &&
        selected.every((value, idx) => value === correct[idx])
      );
    }
    return Number(answer) === Number(question?.correctAnswer);
  };

  // Xử lý chọn đáp án
  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    if (isMultipleChoiceQuestion(currentQuiz)) {
      setUserAnswers((prev) => {
        const existing = prev[currentIndex];
        const selected = normalizeAnswerArray(existing);
        const next = selected.includes(optionIndex)
          ? selected.filter((value) => value !== optionIndex)
          : [...selected, optionIndex].sort((a, b) => a - b);

        return { ...prev, [currentIndex]: next };
      });
      return;
    }
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
  };

  // Xử lý nộp bài
  const handleSubmitQuiz = async () => {
    if (!id || !quiz) return;
    if (isPreview) {
      const localScore = quiz.questions.reduce(
        (acc: number, q: any, idx: number) =>
          acc + (isAnswerCorrect(q, userAnswers[idx]) ? 1 : 0),
        0,
      );
      setScore(localScore);
      setIsSubmitted(true);
      setConfirmSubmittedOpen(true);
      return;
    }
    try {
      setLoading(true);
      const answersPayload = quiz.questions.map((q: any, idx: number) => {
        const selected = userAnswers[idx];
        if (isMultipleChoiceQuestion(q)) {
          return Array.isArray(selected) && selected.length > 0
            ? normalizeAnswerArray(selected)
            : null;
        }
        return typeof selected === "number" ? selected : null;
      });
      const durationSec = Math.max(0, elapsedSec);
      const result = await api.quiz.submit(id, answersPayload, durationSec);
      setScore(result?.attempt?.score ?? 0);
      if (result?.quiz?.questions?.length) setQuiz(result?.quiz);
      setIsSubmitted(true);
      setConfirmSubmittedOpen(true);
    } catch (err) {
      console.error("Lỗi lấy quiz full khi nộp bài:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isCountdownMode) return;
    if (timeLeftSec === null) return;
    if (timeLeftSec > 0) return;
    if (isSubmitted) return;
    if (autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    handleSubmitQuiz();
  }, [isCountdownMode, timeLeftSec, isSubmitted, handleSubmitQuiz]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950 transition-colors duration-300">
        <Loader2 className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">
          Đang tải bộ câu hỏi...
        </p>
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 transition-colors duration-300">
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          Không có dữ liệu quiz.
        </p>
      </div>
    );
  }

  const totalQuestions = quiz.questions.length;
  const currentQuiz = quiz.questions[currentIndex];
  const currentQuestionTypeLabel = getQuestionTypeLabel(currentQuiz);
  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const answeredCount = quiz.questions.reduce(
    (acc: number, q: any, idx: number) =>
      acc + (hasAnswered(q, userAnswers[idx]) ? 1 : 0),
    0,
  );
  const unansweredCount = totalQuestions - answeredCount;
  const displaySeconds = isCountdownMode ? (timeLeftSec ?? 0) : elapsedSec;
  const timeDisplay = `${String(Math.floor(displaySeconds / 60)).padStart(
    2,
    "0",
  )}:${String(displaySeconds % 60).padStart(2, "0")}`;
  const handleExitRequest = () => {
    if (!id) {
      navigate("/", { replace: true });
      return;
    }
    if (isSubmitted) {
      navigate(`/quiz/${id}/start`);
      return;
    }
    setConfirmExitOpen(true);
  };

  const handleSubmitRequest = () => {
    if (isSubmitted) return;
    if (unansweredCount > 0) {
      setConfirmSubmitOpen(true);
      return;
    }
    handleSubmitQuiz();
  };

  const handleRetryRequest = async () => {
    if (!id || !quiz) return;
    if (isPreview) {
      window.location.reload();
      return;
    }
    setRetryError(null);

    const maxAttempts = Number(quiz?.maxAttempts);
    if (!Number.isFinite(maxAttempts) || maxAttempts <= 0) {
      window.location.reload();
      return;
    }

    setRetrying(true);
    let attemptCount = 0;
    try {
      const attempts = await api.attempt.getUserAttempts();
      attemptCount = Array.isArray(attempts)
        ? attempts.filter((attempt) => {
            const attemptQuizId = String(
              attempt?.quiz?._id ?? attempt?.quiz ?? "",
            );
            const isDeleted = Boolean(attempt?.isDeleted);
            return attemptQuizId === String(id) && !isDeleted;
          }).length
        : 0;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status !== 404) {
        if (status === 401) {
          setRetryError("Bạn cần đăng nhập để làm lại bài.");
        } else {
          setRetryError("Không thể kiểm tra số lượt làm. Vui lòng thử lại.");
        }
        setRetrying(false);
        return;
      }
    }

    if (attemptCount >= maxAttempts) {
      setRetryError("Bạn đã hết lượt làm bài.");
      setRetrying(false);
      return;
    }

    setRetrying(false);
    window.location.reload();
  };

  return (
    <div className="pt-24 pb-16 px-4 bg-[#f8fafc] dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr,280px] gap-8">
          <div>
            {/* Progress Bar & Header */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                    {quiz.title}
                  </h1>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs font-bold uppercase">
                      {quiz.difficulty}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-purplele-600 dark:text-purple-400">
                    {currentIndex + 1}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 font-bold">
                    {" "}
                    / {quiz.questions.length}
                  </span>
                </div>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 dark:bg-purple-500 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 md:p-12 shadow-xl shadow-purple-900/5 border border-gray-100 dark:border-gray-800 mb-8 relative overflow-hidden transition-colors">
              <div className="absolute top-0 left-0 w-2 h-full bg-purple-600"></div>

              <div className="flex items-center gap-3 mb-2">
                <p className="text-purple-600 dark:text-purple-400 font-bold text-xl tracking-[0.05em]">
                  Câu hỏi {currentIndex + 1}:
                </p>
                <span className="ml-auto px-4 py-1.5 rounded-full text-sm font-extrabold tracking-wide text-purple-700 dark:text-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 shadow-[0_6px_18px_rgba(59,130,246,0.18)]">
                  {currentQuestionTypeLabel}
                </span>
              </div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-8 leading-relaxed whitespace-pre-line">
                {currentQuiz.text}
              </h2>

              <div className="grid gap-4">
                {currentQuiz.options.map((option: string, i: number) => {
                  const selectedAnswer = userAnswers[currentIndex];
                  const isSelected = isMultipleChoiceQuestion(currentQuiz)
                    ? Array.isArray(selectedAnswer) &&
                      selectedAnswer.includes(i)
                    : selectedAnswer === i;
                  const isCorrect = isSubmitted
                    ? isMultipleChoiceQuestion(currentQuiz)
                      ? Array.isArray(currentQuiz.correctAnswer) &&
                        currentQuiz.correctAnswer.includes(i)
                      : i === currentQuiz.correctAnswer
                    : false;
                  const isWrong = isSubmitted && isSelected && !isCorrect;
                  const badgeClass = isCorrect
                    ? "bg-green-500 text-white border-green-500"
                    : isWrong
                      ? "bg-red-500 text-white border-red-500"
                      : isSelected
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-gray-700";
                  return (
                    <button
                      key={i}
                      disabled={isSubmitted}
                      onClick={() => handleSelectOption(i)}
                      className={`
                    flex items-center p-5 rounded-2xl border-2 transition-all duration-200 text-left font-bold
                    ${isSelected ? "border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 shadow-md" : "border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 hover:border-purple-200 dark:hover:border-purple-800 text-gray-600 dark:text-gray-400"}
                    ${isCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 shadow-none" : ""}
                    ${isWrong ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 shadow-none" : ""}
                  `}
                    >
                      <span
                        className={`
                    w-10 h-10 rounded-xl flex items-center justify-center mr-4 shrink-0 border-2 transition-colors
                    ${badgeClass}
                  `}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>

              {/* Explanation after Submit */}
              {isSubmitted && (
                <div className="mt-8 p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 animate-in fade-in zoom-in duration-500">
                  <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold mb-2">
                    <Info className="w-5 h-5" />
                    <span>Giải thích:</span>
                  </div>
                  <p className="text-emerald-800 dark:text-emerald-200 text-sm leading-relaxed">
                    {currentQuiz.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                disabled={currentIndex === 0}
                className="flex items-center space-x-2 px-6 py-3 font-bold text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-0 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Câu trước</span>
              </button>

              {isPreview && (
                <button
                  onClick={() => navigate(`/quiz/${id}/edit`)}
                  className="flex items-center space-x-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 px-6 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:border-purple-600 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all shadow-sm"
                >
                  <span>Trở lại trang edit</span>
                </button>
              )}

              {currentIndex < quiz.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="group flex items-center space-x-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 px-8 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:border-purple-600 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all shadow-sm"
                >
                  <span>Tiếp theo</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                !isSubmitted && (
                  <button
                    onClick={handleSubmitRequest}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-purple-700 transition-all shadow-xl active:scale-95 animate-bounce-short"
                  >
                    <span>Nộp bài ngay</span>
                    <Send className="w-5 h-5" />
                  </button>
                )
              )}
            </div>

            {/* Final Results Section */}
            {isSubmitted && (
              <div className="mt-12 bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 text-center shadow-2xl border border-purple-100 dark:border-purple-900/30 overflow-hidden relative transition-colors">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-600"></div>

                <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </div>

                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                  Kết quả làm bài
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">
                  Bạn đã trả lời đúng
                  <span className="text-purple-600 dark:text-purple-400 font-black text-3xl px-2">
                    {score}
                  </span>
                  trên tổng số {quiz.questions.length} câu.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={handleRetryRequest}
                    disabled={retrying}
                    className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {retrying ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <RefreshCcw className="w-5 h-5" />
                    )}
                    <span>
                      {retrying ? "Đang kiểm tra..." : "Làm lại bài này"}
                    </span>
                  </button>
                  <button
                    onClick={() => navigate("/", { replace: true })}
                    className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-100 dark:border-gray-700 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    Thoát về trang chủ
                  </button>
                </div>
                {retryError && (
                  <div className="mt-4 flex items-start justify-center gap-2 text-sm text-red-600 dark:text-red-400 font-semibold">
                    <AlertCircle className="w-4 h-4 mt-0.5" />
                    <span>{retryError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

         {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden pr-2">
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 transition-colors">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 font-bold mb-3">
                    Thời gian
                  </p>
                  <div
                    className={`text-3xl font-black ${
                      isCountdownMode &&
                      timeLeftSec !== null &&
                      timeLeftSec <= 60
                        ? "text-red-500"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {timeDisplay}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 transition-colors">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 font-bold mb-4">
                    Danh sách câu hỏi
                  </p>
                  <div className="grid grid-cols-4 gap-3 max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                    {quiz.questions.map((q: any, idx: number) => {
                      const answerValue = userAnswers[idx];
                      const isAnswered = hasAnswered(q, answerValue);
                      const isCurrent = idx === currentIndex;
                      const isCorrect = isSubmitted
                        ? isAnswerCorrect(q, answerValue)
                        : false;
                      const statusClass = isSubmitted
                        ? !isAnswered
                          ? "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
                          : isCorrect
                            ? "bg-emerald-500 text-white"
                            : "bg-red-500 text-white"
                        : isAnswered
                          ? "bg-purple-500 text-white hover:bg-purple-600"
                          : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700";
                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentIndex(idx)}
                          className={`w-12 h-12 rounded-full font-bold transition-colors ${
                            statusClass
                          } ${isCurrent ? "ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-900" : ""}`}
                          aria-label={`Đi tới câu ${idx + 1}`}
                          type="button"
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-5 text-xs text-gray-400 dark:text-gray-500 font-bold">
                    Tổng: {totalQuestions} câu
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs font-bold">
                    <span className="text-purple-600 dark:text-purple-400">
                      Đã làm: {answeredCount}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">
                      Chưa làm: {unansweredCount}
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 transition-colors">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 font-bold mb-4">
                    Điều khiển
                  </p>
                  <div className="grid gap-2">
                    <button
                      onClick={handleSubmitRequest}
                      disabled={isSubmitted}
                      className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl font-black hover:bg-purple-700 transition-all shadow-xl active:scale-95 disabled:opacity-60"
                    >
                      <Send className="w-4 h-4" />
                      <span>Nộp bài</span>
                    </button>
                    <button
                      onClick={handleExitRequest}
                      className="px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-black text-gray-700 dark:text-gray-200 hover:border-gray-900 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm"
                    >
                      Thoát
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>



      
      <ConfirmDialog
        open={confirmExitOpen}
        title="Thoát khỏi bài làm?"
        description="Bạn đang làm bài. Nếu thoát, bài làm sẽ không được lưu lại?"
        confirmText="Thoát"
        cancelText="Ở lại"
        danger
        onCancel={() => setConfirmExitOpen(false)}
        onConfirm={() => {
          setConfirmExitOpen(false);
          if (!id) {
            navigate("/", { replace: true });
          } else {
            navigate(`/quiz/${id}/start`);
          }
        }}
      />

      <ConfirmDialog
        open={confirmSubmitOpen}
        title="Nộp bài ngay?"
        description={`Bạn còn ${unansweredCount} câu chưa làm. Vẫn nộp bài?`}
        confirmText="Nộp bài"
        cancelText="Quay lại"
        onCancel={() => setConfirmSubmitOpen(false)}
        onConfirm={() => {
          setConfirmSubmitOpen(false);
          handleSubmitQuiz();
        }}
      />

      <ConfirmDialog
        open={confirmSubmittedOpen}
        title="Đã nộp bài"
        description="Bài làm của bạn đã được nộp thành công."
        confirmText="OK"
        showCancel={false}
        onCancel={() => setConfirmSubmittedOpen(false)}
        onConfirm={() => setConfirmSubmittedOpen(false)}
      />
    </div>
  );
};

export default QuizPlay;