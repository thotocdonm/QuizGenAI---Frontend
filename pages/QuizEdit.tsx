import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  Save,
  Play,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { api } from "../services/api";

// =====================
// Types (UI)
// =====================
type Difficulty = "Dễ" | "Trung bình" | "Khó" | string;

type QuizQuestion = {
  question: string;
  options: string[]; // A,B,C,D
  correctAnswer: string; // must match one of options
  explanation: string;
};

type Quiz = {
  title: string;
  difficulty: Difficulty;
  questions: QuizQuestion[];
};

// =====================
// Types (Backend shape)
// quizController.getQuizById -> res.json(quiz) (NOT wrapped)
// questions: { text, options, correctAnswer(index), explanation }
// =====================
type BackendQuestion = {
  text: string;
  options: string[];
  correctAnswer: number; // 0..3
  explanation?: string;
};

type BackendQuiz = {
  _id: string;
  title: string;
  difficulty: string;
  questions: BackendQuestion[];
  owner?: string;
};

// =====================
// Helpers
// =====================
const ensure4Options = (opts: string[]) => {
  const base = [...(opts ?? [])];
  while (base.length < 4) base.push("");
  return base.slice(0, 4);
};

const normalizeCorrectAnswer = (q: QuizQuestion): QuizQuestion => {
  const options = ensure4Options(q.options);
  const correct =
    options.includes(q.correctAnswer) && q.correctAnswer.trim() !== ""
      ? q.correctAnswer
      : options.find((o) => o.trim() !== "") || "";
  return { ...q, options, correctAnswer: correct };
};

const makeEmptyQuestion = (): QuizQuestion => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  explanation: "",
});

// backend -> UI
const mapBackendQuizToUI = (bq: BackendQuiz): Quiz => {
  return {
    title: bq.title ?? "",
    difficulty: bq.difficulty ?? "Trung bình",
    questions: (bq.questions ?? []).map((q) => {
      const options = ensure4Options(q.options ?? []);
      const idx = typeof q.correctAnswer === "number" ? q.correctAnswer : -1;
      const correctAnswer =
        idx >= 0 && idx < options.length ? options[idx] : "";

      return normalizeCorrectAnswer({
        question: q.text ?? "",
        options,
        correctAnswer,
        explanation: q.explanation ?? "",
      });
    }),
  };
};

// UI -> backend (for save later)
const mapUIQuizToBackend = (quiz: Quiz): Partial<BackendQuiz> => {
  return {
    title: quiz.title,
    difficulty: quiz.difficulty,
    questions: quiz.questions.map((q) => {
      const options = ensure4Options(q.options);
      const idx = options.findIndex((o) => o === q.correctAnswer);
      return {
        text: q.question,
        options,
        correctAnswer: idx >= 0 ? idx : 0,
        explanation: q.explanation,
      };
    }),
  };
};

const QuizEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [originalQuiz, setOriginalQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const shareTimerRef = useRef<number | null>(null);
  // Save / status UI
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "err">("idle");
  // =====================
  // LOAD REAL DATA BY ID
  // =====================
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id) {
        setPageError("Thiếu quiz ID trên URL.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setPageError(null);
      try {
        // api.quiz.getById -> axiosInstance.get(`/quiz/${id}`) -> return response.data
        // backend getQuizById -> res.status(200).json(quiz)
        const res = await api.quiz.getById(id);
        if (!res || !res._id) {
          setPageError("Không đủ dữ liệu để xác minh quiz theo ID hiện tại.");
          setQuiz(null);
          return;
        }
        const uiQuiz = mapBackendQuizToUI(res as BackendQuiz);
        setQuiz(uiQuiz);
        setOriginalQuiz(uiQuiz);
        setIsDirty(false);
        setSaveStatus("idle");
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 403)
          setPageError("Bạn không có quyền chỉnh sửa quiz này.");
        else if (status === 401) setPageError("Bạn cần đăng nhập để tiếp tục.");
        else
          setPageError(
            err?.response?.data?.message || "Không thể tải quiz từ máy chủ.",
          );
        setQuiz(null);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);
  // =====================
  // Derived
  // =====================
  const total = quiz?.questions.length ?? 0;
  const errors = useMemo(() => {
    const list: string[] = [];
    if (!quiz) return ["Quiz rỗng"];
    if (!quiz.title.trim()) list.push("Tiêu đề quiz không được để trống.");
    quiz.questions.forEach((q, idx) => {
      const n = idx + 1;
      if (!q.question.trim()) list.push(`Câu ${n}: nội dung câu hỏi trống.`);
      const opts = ensure4Options(q.options);
      if (opts.some((o) => !o.trim()))
        list.push(`Câu ${n}: đáp án A/B/C/D không được trống.`);
      if (!opts.includes(q.correctAnswer) || !q.correctAnswer.trim())
        list.push(`Câu ${n}: đáp án đúng phải trùng một trong A/B/C/D.`);
      if (!q.explanation.trim()) list.push(`Câu ${n}: phần giải thích trống.`);
    });
    return list;
  }, [quiz]);
  // =====================
  // Mutations
  // =====================
  const updateQuiz = (patch: Partial<Quiz>) => {
    if (!quiz) return;
    setQuiz({ ...quiz, ...patch });
    setIsDirty(true);
    setSaveStatus("idle");
  };
  const updateQuestion = (index: number, patch: Partial<QuizQuestion>) => {
    if (!quiz) return;
    const questions = quiz.questions.map((q, i) =>
      i === index ? normalizeCorrectAnswer({ ...q, ...patch }) : q,
    );
    setQuiz({ ...quiz, questions });
    setIsDirty(true);
    setSaveStatus("idle");
  };
  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    if (!quiz) return;
    const q = quiz.questions[qIndex];
    const options = [...q.options];
    const old = options[optIndex];
    options[optIndex] = value;
    let correctAnswer = q.correctAnswer;
    // nếu option cũ đang là đáp án đúng, cập nhật theo text mới của cùng slot
    if (q.correctAnswer === old) correctAnswer = value;

    updateQuestion(qIndex, { options, correctAnswer });
  };
  const setCorrectByIndex = (qIndex: number, optIndex: number) => {
    if (!quiz) return;
    const q = quiz.questions[qIndex];
    const options = ensure4Options(q.options);
    updateQuestion(qIndex, { options, correctAnswer: options[optIndex] });
  };
  const addQuestion = () => {
    if (!quiz) return;
    const questions = [...quiz.questions, makeEmptyQuestion()];
    setQuiz({ ...quiz, questions });
    setIsDirty(true);
    setSaveStatus("idle");
  };
  const removeQuestion = (index: number) => {
    if (!quiz) return;
    if (quiz.questions.length <= 1) return;

    const questions = quiz.questions.filter((_, i) => i !== index);
    setQuiz({ ...quiz, questions });
    setIsDirty(true);
    setSaveStatus("idle");
  };
  // =====================
  // Actions (save)
  // =====================
  const handleSave = async (): Promise<boolean> => {
    if (!quiz || !id) return false;

    if (errors.length > 0) {
      setSaveStatus("err");
      return false;
    }
    setSaving(true);
    setSaveStatus("idle");
    try {
      const payload = mapUIQuizToBackend(quiz);
      await api.quiz.update(id, payload);

      setOriginalQuiz(quiz);
      setIsDirty(false);
      setSaveStatus("ok");
      return true;
    } catch {
      setSaveStatus("err");
      return false;
    } finally {
      setSaving(false);
    }
  };
  const handleCancel = () => {
    if (!originalQuiz) return;
    setQuiz(originalQuiz);
    setIsDirty(false);
    setSaveStatus("idle");
  };
  const handlePreviewClick = async () => {
    if (!id) return;
    if (isDirty) {
      const shouldContinue = window.confirm(
        "Có thay đổi chưa lưu. Bạn có muốn tiếp tục đến trang preview mà không lưu thay đổi?",
      );
      if (!shouldContinue) return;
    }
    navigate(`/quiz/${id}`, { state: { isPreview: true } });
  };
  const handleShare = async () => {
    const url = `${window.location.origin}/quiz/${id}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        window.prompt("Copy URL:", url);
      }
      setShareMessage("Đã copy link!");
    } catch {
      window.prompt("Copy URL:", url);
      setShareMessage("Chưa thể copy link này.");
    }
    if (shareTimerRef.current) {
      window.clearTimeout(shareTimerRef.current);
    }
    shareTimerRef.current = window.setTimeout(() => {
      setShareMessage(null);
      shareTimerRef.current = null;
    }, 5000);
  };
  // =====================
  // UI
  // =====================
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">
          Đang tải quiz...
        </p>
      </div>
    );
  }
  if (!quiz || total === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-xl text-center">
          <AlertCircle className="w-10 h-10 mx-auto text-red-500 mb-3" />
          <p className="font-black text-gray-900 text-xl mb-2">
            Không thể mở trang chỉnh sửa
          </p>
          <p className="text-gray-500">
            {pageError || "Không đủ dữ liệu để xác minh quiz theo ID hiện tại."}
          </p>
          <button
            onClick={() => navigate("/generate")}
            className="mt-6 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all"
          >
            Quay về trang tạo quiz
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="pt-24 pb-16 px-4 bg-[#f8fafc] min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-blue-600 font-bold text-xs uppercase tracking-[0.2em] mb-2">
            Review & Edit (AI Draft)
          </p>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-[0.18em]">
                  Tiêu đề quiz
                </label>
                <input
                  value={quiz.title}
                  onChange={(e) => updateQuiz({ title: e.target.value })}
                  className="mt-2 w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-bold text-gray-900"
                  placeholder="VD: Khám phá Địa lý Việt Nam"
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-[0.18em]">
                  Độ khó
                </label>
                <select
                  value={quiz.difficulty}
                  onChange={(e) => updateQuiz({ difficulty: e.target.value })}
                  className="mt-2 w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-bold text-gray-700 bg-white"
                >
                  <option value="Dễ">Dễ</option>
                  <option value="Trung bình">Trung bình</option>
                  <option value="Khó">Khó</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase">
                Đang chỉnh sửa
              </span>
              {isDirty ? (
                <span className="text-xs text-gray-400 font-bold">
                  CHƯA LƯU
                </span>
              ) : (
                <span className="text-xs text-emerald-600 font-bold">
                  ĐÃ LƯU
                </span>
              )}
              <span className="ml-auto text-xs text-gray-400 font-bold">
                Tổng: {total} câu
              </span>
            </div>
          </div>

          {/* Validation summary */}
          <div className="mt-4">
            {errors.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Dữ liệu hợp lệ, có thể lưu và đưa vào làm bài.</span>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-amber-800 font-black mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>Cần chỉnh trước khi lưu ({errors.length})</span>
                </div>
                <ul className="text-amber-900 text-sm list-disc pl-5 space-y-1">
                  {errors.slice(0, 8).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                  {errors.length > 8 && (
                    <li className="font-bold">+{errors.length - 8} lỗi khác</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
        {/* All questions */}
        <div className="space-y-6 mb-8">
          {quiz.questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="bg-white rounded-[2rem] p-8 md:p-10 shadow-xl shadow-blue-900/5 border border-gray-100 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-blue-600 font-bold text-xl tracking-[0.2em]">
                    Câu hỏi {qIndex + 1}
                  </p>
                  <p className="text-gray-400 text-xs font-bold mt-1">
                    Chỉnh nội dung / đáp án / giải thích
                  </p>
                </div>
                <button
                  onClick={() => removeQuestion(qIndex)}
                  disabled={quiz.questions.length <= 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-100 text-gray-600 font-bold hover:border-red-200 hover:text-red-600 transition-all disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa câu</span>
                </button>
              </div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-[0.18em]">
                Nội dung câu hỏi
              </label>
              <textarea
                value={q.question}
                onChange={(e) =>
                  updateQuestion(qIndex, { question: e.target.value })
                }
                className="mt-2 w-full px-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-bold text-gray-900 min-h-[120px]"
                placeholder="Nhập câu hỏi..."
              />
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-[0.18em]">
                    Đáp án (A/B/C/D)
                  </span>
                  <span className="text-xs text-gray-400 font-bold">
                    Chọn radio để đặt đáp án đúng
                  </span>
                </div>
                <div className="grid gap-4">
                  {ensure4Options(q.options).map((opt, optIndex) => {
                    const optionsSafe = ensure4Options(q.options);
                    const isCorrect = q.correctAnswer === optionsSafe[optIndex];
                    return (
                      <div
                        key={optIndex}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all
                          ${
                            isCorrect
                              ? "border-emerald-300 bg-emerald-50"
                              : "border-gray-100 bg-gray-50/50"
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={isCorrect}
                          onChange={() => setCorrectByIndex(qIndex, optIndex)}
                          className="w-5 h-5 accent-emerald-600"
                          aria-label={`Đáp án đúng ${String.fromCharCode(
                            65 + optIndex,
                          )}`}
                        />
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black border-2 shrink-0
                            ${
                              isCorrect
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-gray-400 border-gray-200"
                            }
                          `}
                        >
                          {String.fromCharCode(65 + optIndex)}
                        </div>
                        <input
                          value={opt}
                          onChange={(e) =>
                            updateOption(qIndex, optIndex, e.target.value)
                          }
                          className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none font-bold
                            ${
                              isCorrect
                                ? "border-emerald-200 focus:border-emerald-600 bg-white"
                                : "border-gray-100 focus:border-blue-600 bg-white"
                            }
                          `}
                          placeholder={`Nhập đáp án ${String.fromCharCode(
                            65 + optIndex,
                          )}...`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-8">
                <label className="text-xs font-black text-gray-500 uppercase tracking-[0.18em]">
                  Giải thích (hiển thị sau khi làm bài)
                </label>
                <textarea
                  value={q.explanation}
                  onChange={(e) =>
                    updateQuestion(qIndex, { explanation: e.target.value })
                  }
                  className="mt-2 w-full px-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-bold text-gray-800 min-h-[110px]"
                  placeholder="Nhập giải thích..."
                />
              </div>
            </div>
          ))}
        </div>
        {/* Bottom controls */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={addQuestion}
                className="flex items-center gap-2 bg-white border-2 border-gray-200 px-5 py-3 rounded-xl font-black text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm"
              >
                <Plus className="w-5 h-5" />
                <span>Thêm câu</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isDirty && (
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-white border-2 border-gray-200 px-5 py-3 rounded-xl font-black text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-all shadow-sm"
                >
                  <span>Huỷ thay đổi</span>
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || errors.length > 0}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl active:scale-95 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>Lưu quiz</span>
              </button>
            </div>
          </div>
          <div className="min-h-[24px] flex justify-center">
            {saveStatus === "ok" && (
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Đã lưu thành công.</span>
              </div>
            )}
            {saveStatus === "err" && (
              <div className="flex items-center gap-2 text-red-600 font-bold">
                <AlertCircle className="w-5 h-5" />
                <span>
                  Không thể lưu.{" "}
                  {errors.length > 0
                    ? "Vui lòng sửa các lỗi hiển thị phía trên."
                    : "Có lỗi hệ thống."}
                </span>
              </div>
            )}
            {saveStatus === "idle" && isDirty && (
              <div className="text-gray-400 font-bold text-sm">
                Có thay đổi chưa lưu.
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate("/generate")}
              className="px-5 py-3 rounded-xl border-2 border-gray-200 bg-white font-black text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-all"
            >
              Quay về tạo quiz
            </button>
            <button
              onClick={handlePreviewClick}
              className="flex items-center gap-2 bg-white border-2 border-gray-200 px-5 py-3 rounded-xl font-black text-gray-700 hover:border-emerald-600 hover:text-emerald-700 transition-all shadow-sm"
              title="Chuyển sang trang làm bài (preview)"
            >
              <Play className="w-5 h-5" />
              <span>Preview làm bài</span>
            </button>
            <button
              onClick={handleShare}
              className="px-5 py-3 rounded-xl border-2 border-gray-200 bg-white font-black text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-all"
            >
              Share
            </button>
          </div>

          {shareMessage && (
            <div className="flex justify-center">
              <span className="text-sm font-bold text-emerald-700">
                {shareMessage}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizEdit;
