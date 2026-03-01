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
type QuestionType = "multipleStatements" | "singleChoice" | "multipleChoice";

type QuizQuestion = {
  questionType: QuestionType;
  question: string;
  options: string[];
  correctAnswer: number | number[];
  explanation: string;
};

type Quiz = {
  title: string;
  difficulty: Difficulty;
  questionType?: QuestionType | "mixed" | string;
  timeLimit?: number; // UI lưu theo phút, 0 hoặc undefined = không giới hạn
  maxAttempts?: number; // 0 hoặc undefined = không giới hạn
  private: boolean;
  questions: QuizQuestion[];
};

// =====================
// Types (Backend shape)
// quizController.getQuizById -> res.json(quiz) (NOT wrapped)
// questions: { text, options, correctAnswer(index), explanation }
// =====================
type BackendQuestion = {
  questionType?: QuestionType;
  text: string;
  options: string[];
  correctAnswer: number | number[];
  explanation?: string;
};

type BackendQuiz = {
  _id: string;
  title: string;
  topic?: string;
  numQuestions?: number;
  difficulty: string;
  questionType?: QuestionType | "mixed" | string;
  timeLimit?: number; // backend lưu theo giây
  maxAttempts?: number;
  private?: boolean;
  questions: BackendQuestion[];
  owner?: string;
};

const SECONDS_PER_MINUTE = 60;

// =====================
// Helpers
// =====================
const isQuestionType = (value: unknown): value is QuestionType =>
  value === "multipleStatements" ||
  value === "singleChoice" ||
  value === "multipleChoice";

const resolveQuestionType = (
  value?: unknown,
  fallback: QuestionType = "singleChoice",
): QuestionType => (isQuestionType(value) ? value : fallback);

const ensureOptionsByType = (type: QuestionType, opts: string[]) => {
  const base = [...(opts ?? [])].map((o) => o ?? "");
  while (base.length < 4) base.push("");
  return base.slice(0, 4);
};

const hasFourStatements = (text: string) => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const required = ["1.", "2.", "3.", "4."];
  const hasAll = required.every((prefix) =>
    lines.some((line) => line.startsWith(prefix)),
  );
  const count = lines.filter((line) => /^[1-4]\./.test(line)).length;
  return hasAll && count === 4;
};

const normalizeCorrectAnswer = (
  type: QuestionType,
  raw: number | number[],
  maxOptions: number,
): number | number[] => {
  if (type === "multipleChoice") {
    const values = Array.isArray(raw) ? raw : [];
    const unique = [...new Set(values)]
      .map((v) => Number(v))
      .filter(
        (v) => Number.isInteger(v) && v >= 0 && v < Math.max(maxOptions, 1),
      );
    return unique.length > 0 ? unique : [0];
  }
  const idx = Number(raw);
  return Number.isInteger(idx) && idx >= 0 && idx < Math.max(maxOptions, 1)
    ? idx
    : 0;
};

const normalizeUIQuestion = (q: QuizQuestion): QuizQuestion => {
  const questionType = resolveQuestionType(q.questionType);
  const options = ensureOptionsByType(questionType, q.options);
  const correctAnswer = normalizeCorrectAnswer(
    questionType,
    q.correctAnswer,
    options.length,
  );
  return { ...q, questionType, options, correctAnswer };
};

const resolveQuizQuestionType = (
  questions: QuizQuestion[],
): Quiz["questionType"] => {
  if (questions.length === 0) return "singleChoice";
  const types = questions.map((q) => resolveQuestionType(q.questionType));
  const uniqueTypes = new Set(types);
  return uniqueTypes.size === 1 ? types[0] : "mixed";
};

const buildQuestionIssues = (q: QuizQuestion): string[] => {
  const issues: string[] = [];
  const type = resolveQuestionType(q.questionType);
  const opts = ensureOptionsByType(type, q.options);

  if (!q.question.trim()) issues.push("Nội dung câu hỏi trống.");

  if (type === "multipleStatements" && !hasFourStatements(q.question)) {
    issues.push(
      "Dạng Nhiều mệnh đề cần đủ 4 mệnh đề (1., 2., 3., 4.) mỗi dòng.",
    );
  }

  if (type === "multipleStatements" || type === "singleChoice") {
    if (opts.some((o) => !o.trim()))
      issues.push("Đáp án A/B/C/D không được trống.");
    const answer = Number(q.correctAnswer);
    if (!Number.isInteger(answer) || answer < 0 || answer > 3) {
      issues.push("Đáp án đúng phải là 1 lựa chọn A/B/C/D.");
    }
  }

  if (type === "multipleChoice") {
    if (opts.some((o) => !o.trim()))
      issues.push("Đáp án A/B/C/D không được trống.");
    const answers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
    if (answers.length === 0) {
      issues.push("Cần chọn ít nhất 1 đáp án đúng.");
    }
    const hasInvalid = answers.some(
      (value) =>
        !Number.isInteger(Number(value)) ||
        Number(value) < 0 ||
        Number(value) > 3,
    );
    if (hasInvalid) {
      issues.push("Đáp án đúng không hợp lệ.");
    }
  }

  if (!q.explanation.trim()) issues.push("Phần giải thích trống.");

  return issues;
};

const makeEmptyQuestion = (
  questionType: QuestionType = "singleChoice",
): QuizQuestion => ({
  questionType,
  question: "",
  options: ensureOptionsByType(questionType, []),
  correctAnswer: questionType === "multipleChoice" ? [0] : 0,
  explanation: "",
});

// backend -> UI
const mapBackendQuizToUI = (bq: BackendQuiz): Quiz => {
  const rootType =
    bq.questionType === "mixed"
      ? null
      : resolveQuestionType(bq.questionType, "singleChoice");
  return {
    title: bq.title ?? "",
    difficulty: bq.difficulty ?? "Trung bình",
    questionType: bq.questionType ?? "singleChoice",
    timeLimit:
      typeof bq.timeLimit === "number"
        ? Math.max(0, Math.round(bq.timeLimit / SECONDS_PER_MINUTE))
        : 0,
    maxAttempts:
      typeof bq.maxAttempts === "number"
        ? Math.max(0, Math.round(bq.maxAttempts))
        : 0,
    private: bq.private ?? false,
    questions: (bq.questions ?? []).map((q) =>
      normalizeUIQuestion({
        questionType: resolveQuestionType(
          q.questionType,
          rootType ?? "singleChoice",
        ),
        question: q.text ?? "",
        options: q.options ?? [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation ?? "",
      }),
    ),
  };
};

// UI -> backend (for save later)
const mapUIQuizToBackend = (quiz: Quiz): Partial<BackendQuiz> => {
  return {
    title: quiz.title,
    numQuestions: quiz.questions.length,
    difficulty: quiz.difficulty,
    questionType: quiz.questionType,
    private: quiz.private,
    timeLimit:
      typeof quiz.timeLimit === "number"
        ? Math.max(0, Math.round(quiz.timeLimit * SECONDS_PER_MINUTE))
        : 0,
    maxAttempts:
      typeof quiz.maxAttempts === "number"
        ? Math.max(0, Math.round(quiz.maxAttempts))
        : 0,
    questions: quiz.questions.map((q) => {
      const normalized = normalizeUIQuestion(q);
      return {
        questionType: normalized.questionType,
        text: q.question,
        options: normalized.options,
        correctAnswer: normalized.correctAnswer,
        explanation: q.explanation,
      };
    }),
  };
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
        <h3 className="text-lg font-black text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          {showCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-white font-bold text-gray-700 hover:border-gray-400 transition-all"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl font-bold text-white transition-all ${
              danger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const QuizEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const questionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const lastAddedIndexRef = useRef<number | null>(null);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [originalQuiz, setOriginalQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"save" | null>(null);
  const [shareResult, setShareResult] = useState<string | null>(null);
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
    if (quiz.timeLimit !== undefined && quiz.timeLimit < 0)
      list.push("Thời gian làm bài phải >= 0.");
    if (quiz.maxAttempts !== undefined && quiz.maxAttempts < 0)
      list.push("Số lần làm tối đa phải >= 0.");
    quiz.questions.forEach((q, idx) => {
      const n = idx + 1;
      const issues = buildQuestionIssues(q);
      issues.forEach((issue) => list.push(`Câu ${n}: ${issue}`));
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
      i === index ? normalizeUIQuestion({ ...q, ...patch }) : q,
    );
    const questionType = resolveQuizQuestionType(questions);
    setQuiz({ ...quiz, questions, questionType });
    setIsDirty(true);
    setSaveStatus("idle");
  };
  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    if (!quiz) return;
    const q = quiz.questions[qIndex];
    const options = [...ensureOptionsByType(q.questionType, q.options)];
    options[optIndex] = value;
    updateQuestion(qIndex, { options });
  };
  const setCorrectByIndex = (qIndex: number, optIndex: number) => {
    if (!quiz) return;
    const q = quiz.questions[qIndex];
    const questionType = resolveQuestionType(q.questionType);
    if (questionType === "multipleChoice") {
      const selected = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
      const isSelected = selected.includes(optIndex);
      if (isSelected && selected.length === 1) return;
      const next = isSelected
        ? selected.filter((value) => value !== optIndex)
        : [...selected, optIndex].sort((a, b) => a - b);
      updateQuestion(qIndex, { correctAnswer: next });
      return;
    }
    updateQuestion(qIndex, { correctAnswer: optIndex });
  };
  const addQuestion = () => {
    if (!quiz) return;
    const defaultType =
      quiz.questionType === "mixed"
        ? resolveQuestionType(
            quiz.questions[quiz.questions.length - 1]?.questionType,
            "singleChoice",
          )
        : resolveQuestionType(quiz.questionType, "singleChoice");
    const questions = [...quiz.questions, makeEmptyQuestion(defaultType)];
    lastAddedIndexRef.current = questions.length - 1;
    const questionType = resolveQuizQuestionType(questions);
    setQuiz({ ...quiz, questions, questionType });
    setIsDirty(true);
    setSaveStatus("idle");
  };
  const removeQuestion = (index: number) => {
    if (!quiz) return;
    if (quiz.questions.length <= 1) return;

    const questions = quiz.questions.filter((_, i) => i !== index);
    const questionType = resolveQuizQuestionType(questions);
    setQuiz({ ...quiz, questions, questionType });
    setIsDirty(true);
    setSaveStatus("idle");
  };
  const scrollToQuestion = (index: number) => {
    const node = questionRefs.current[index];
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!quiz) return;
    const idx = lastAddedIndexRef.current;
    if (idx === null) return;
    lastAddedIndexRef.current = null;
    requestAnimationFrame(() => scrollToQuestion(idx));
  }, [quiz?.questions.length]);
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
    const url = `${window.location.origin}/quiz/${id}/start`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        window.prompt("Copy URL:", url);
      }
      setShareResult("Đã copy link!");
    } catch {
      window.prompt("Copy URL:", url);
      setShareResult("Chưa thể copy link này.");
    }
  };

  const handleConfirmAction = async () => {
    if (confirmAction === "save") {
      await handleSave();
    }
    setConfirmAction(null);
  };
  // =====================
  // UI
  // =====================
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <Loader2 className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest text-[10px] animate-pulse">
          Đang nạp dữ liệu Quiz...
        </p>
      </div>
    );
  }
  if (!quiz || total === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-gray-950 px-4 transition-colors duration-300">
        <div className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 border border-gray-100 dark:border-gray-800 shadow-2xl text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <p className="font-black text-gray-900 dark:text-white text-2xl mb-2 tracking-tight">
            Không thể mở trang chỉnh sửa
          </p>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {pageError || "Không đủ dữ liệu để xác minh quiz theo ID hiện tại."}
          </p>
          <button
            onClick={() => navigate("/generate")}
            className="mt-8 w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-4 rounded-2xl font-black hover:opacity-90 transition-all active:scale-95"
          >
            Quay về trang tạo quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-4 bg-[#f8fafc] dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr,270px] gap-8">
          {/* Sidebar question list */}
          <aside className="hidden lg:block lg:order-2">
            <div className="sticky top-28">
              <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
                {/* Card: Danh sách câu hỏi */}
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 font-black mb-5 ml-1">
                    Danh sách câu hỏi
                  </p>
                  <div className="grid grid-cols-4 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {quiz.questions.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => scrollToQuestion(idx)}
                        className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-black text-xs hover:bg-purple-600 hover:text-white dark:hover:bg-purple-500 transition-all active:scale-90"
                        aria-label={`Đi tới câu ${idx + 1}`}
                        type="button"
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                  <div className="mt-6 text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest ml-1">
                    Tổng cộng: {total} câu
                  </div>
                </div>

                {/* Card: Điều khiển */}
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 font-black mb-5 ml-1">
                    Bảng điều khiển
                  </p>
                  <div className="grid gap-3">
                    <button
                      onClick={addQuestion}
                      className="flex items-center justify-center gap-2 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 px-4 py-3 rounded-2xl font-black text-gray-700 dark:text-gray-300 hover:border-purple-600 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all shadow-sm active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Thêm câu</span>
                    </button>

                    {isDirty && (
                      <button
                        onClick={handleCancel}
                        className="flex items-center justify-center gap-2 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 px-4 py-3 rounded-2xl font-black text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
                      >
                        <span className="text-sm">Huỷ thay đổi</span>
                      </button>
                    )}

                    <button
                      onClick={() => setConfirmAction("save")}
                      disabled={saving || errors.length > 0 || !isDirty}
                      className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-2xl font-black hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 dark:shadow-none active:scale-95 disabled:opacity-40 disabled:grayscale"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span className="text-sm text-white">Lưu Quiz</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={handleShare}
                        className="flex items-center justify-center px-3 py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-800 font-black text-[10px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all uppercase"
                      >
                        Share
                      </button>
                      <button
                        onClick={() => navigate("/generate")}
                        className="flex items-center justify-center px-3 py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-800 font-black text-[10px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all uppercase"
                      >
                        Quay về
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:order-1">
            {/* Header Section */}
            <div className="mb-8">
              <p className="text-purple-600 dark:text-purple-400 font-black text-xs uppercase tracking-[0.2em] mb-3 ml-1">
                Review & Edit (AI Draft)
              </p>

              <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-6 md:p-8 transition-colors duration-300">
                <div className="mb-6">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.18em] ml-1">
                    Tiêu đề bộ Quiz
                  </label>
                  <div className="mt-2 flex flex-col md:flex-row md:items-center gap-4">
                    <input
                      value={quiz.title}
                      onChange={(e) => updateQuiz({ title: e.target.value })}
                      className="w-full md:flex-1 px-6 py-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:border-purple-500 focus:outline-none font-bold text-gray-900 dark:text-white transition-all placeholder-gray-400"
                      placeholder="VD: Khám phá Địa lý Việt Nam"
                    />
                    <label className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 cursor-pointer select-none shrink-0 min-w-[220px]">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.18em]">
                          Chia sẻ cộng đồng
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest ${
                            quiz.private
                              ? "text-gray-400 dark:text-gray-500"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {quiz.private ? "Riêng tư" : "Công khai"}
                        </span>
                      </div>
                      <span
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                          quiz.private
                            ? "bg-gray-300 dark:bg-gray-700"
                            : "bg-emerald-500"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            quiz.private ? "translate-x-1" : "translate-x-6"
                          }`}
                        />
                      </span>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={!quiz.private}
                        onChange={(e) =>
                          updateQuiz({ private: !e.target.checked })
                        }
                        aria-label="Chia sẻ quiz lên cộng đồng"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Difficulty Setting */}
                  <div>
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.18em] ml-1">
                      Độ khó
                    </label>
                    <select
                      value={quiz.difficulty}
                      onChange={(e) =>
                        updateQuiz({ difficulty: e.target.value })
                      }
                      className="mt-2 w-full px-4 py-3.5 rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 focus:border-purple-500 focus:outline-none font-bold text-gray-700 dark:text-gray-300 transition-all cursor-pointer"
                    >
                      <option value="Dễ" className="dark:bg-gray-900">
                        Dễ
                      </option>
                      <option value="Trung bình" className="dark:bg-gray-900">
                        Trung bình
                      </option>
                      <option value="Khó" className="dark:bg-gray-900">
                        Khó
                      </option>
                    </select>
                  </div>

                  {/* Time Limit Setting */}
                  <div>
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.18em] ml-1">
                      Thời gian (phút)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={quiz.timeLimit ?? ""}
                      onChange={(e) =>
                        updateQuiz({
                          timeLimit:
                            e.target.value === ""
                              ? undefined
                              : Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="mt-2 w-full px-4 py-3.5 rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 focus:border-purple-500 focus:outline-none font-bold text-gray-900 dark:text-white transition-all"
                      placeholder="0 = không giới hạn"
                    />
                  </div>

                  {/* Max Attempts Setting */}
                  <div>
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.18em] ml-1">
                      Lượt làm tối đa
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={quiz.maxAttempts ?? ""}
                      onChange={(e) =>
                        updateQuiz({
                          maxAttempts:
                            e.target.value === ""
                              ? undefined
                              : Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="mt-2 w-full px-4 py-3.5 rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 focus:border-purple-500 focus:outline-none font-bold text-gray-900 dark:text-white transition-all"
                      placeholder="0 = không giới hạn"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-800 flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors">
                    Đang chỉnh sửa
                  </span>
                  {isDirty ? (
                    <span className="text-[10px] text-amber-500 dark:text-amber-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />{" "}
                      Chưa lưu thay đổi
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Đã đồng bộ dữ liệu
                    </span>
                  )}
                </div>
              </div>

              {/* Validation summary */}
              <div className="mt-4">
                {errors.length === 0 ? (
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm ml-1 transition-colors">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Dữ liệu hợp lệ, có thể lưu và đưa vào làm bài.</span>
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-[1.5rem] p-5 transition-colors">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-black mb-3">
                      <AlertCircle className="w-5 h-5" />
                      <span>
                        Cần chỉnh sửa trước khi lưu ({errors.length} điểm)
                      </span>
                    </div>
                    <ul className="text-amber-900/80 dark:text-amber-300/70 text-sm list-disc pl-5 space-y-1 font-medium">
                      {errors.slice(0, 8).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                      {errors.length > 8 && (
                        <li className="font-bold opacity-60">
                          + {errors.length - 8} lỗi khác...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* All questions list */}
            <div className="space-y-8 mb-8">
              {quiz.questions.map((q, qIndex) => {
                const questionIssues = buildQuestionIssues(q);
                return (
                  <div
                    key={qIndex}
                    ref={(el) => {
                      questionRefs.current[qIndex] = el;
                    }}
                    className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-purple-900/5 border border-gray-100 dark:border-gray-800 relative overflow-hidden transition-all duration-300 scroll-mt-28 group"
                  >
                    {/* Accent line */}
                    <div className="absolute top-0 left-0 w-2 h-full bg-purple-600 transition-all group-hover:w-3" />

                    <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-10">
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-purple-600 dark:text-purple-400 font-black text-3xl tracking-tighter">
                            Câu {qIndex + 1}
                          </p>
                          <select
                            value={resolveQuestionType(q.questionType)}
                            onChange={(e) =>
                              updateQuestion(qIndex, {
                                questionType: resolveQuestionType(
                                  e.target.value,
                                  "singleChoice",
                                ),
                              })
                            }
                            className="px-3 py-1.5 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 focus:border-purple-500 focus:outline-none transition-all cursor-pointer"
                          >
                            <option value="multipleStatements">
                              Nhiều mệnh đề
                            </option>
                            <option value="singleChoice">Chọn 1 đáp án</option>
                            <option value="multipleChoice">
                              Chọn nhiều đáp án
                            </option>
                          </select>
                        </div>
                        <p className="text-gray-400 dark:text-gray-500 text-xs font-bold mt-2 ml-1">
                          Tùy chỉnh nội dung câu hỏi và đáp án bên dưới
                        </p>
                      </div>

                      <button
                        onClick={() => removeQuestion(qIndex)}
                        disabled={quiz.questions.length <= 1}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-gray-100 dark:border-gray-800 text-gray-400 hover:text-red-500 hover:border-red-100 dark:hover:bg-red-900/20 transition-all disabled:opacity-30 active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">
                          Xóa câu
                        </span>
                      </button>
                    </div>

                    {/* Individual Question Issues */}
                    {questionIssues.length > 0 && (
                      <div className="mb-8 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 p-5 transition-colors">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-black text-xs uppercase tracking-widest">
                          <AlertCircle className="w-4 h-4" />
                          <span>Cần lưu ý cho câu hỏi này</span>
                        </div>
                        <ul className="mt-3 text-amber-900/80 dark:text-amber-300/70 text-sm list-disc pl-5 space-y-1 font-medium">
                          {questionIssues.map((issue, issueIndex) => (
                            <li key={issueIndex}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mb-10">
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">
                        Nội dung câu hỏi
                      </label>
                      <textarea
                        value={q.question}
                        onChange={(e) =>
                          updateQuestion(qIndex, { question: e.target.value })
                        }
                        className="mt-3 w-full px-6 py-5 rounded-[2rem] border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 focus:bg-white dark:focus:bg-gray-800 focus:border-purple-500 focus:outline-none font-bold text-gray-900 dark:text-white min-h-[160px] transition-all leading-relaxed placeholder-gray-400"
                        placeholder="Nhập nội dung câu hỏi tại đây..."
                      />
                    </div>

                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-4 px-1">
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                          {q.questionType === "multipleStatements"
                            ? "Tổ hợp mệnh đề"
                            : "Các lựa chọn đáp án"}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest italic opacity-60">
                          {q.questionType === "multipleChoice"
                            ? "Chọn nhiều"
                            : "Chọn duy nhất"}
                        </span>
                      </div>

                      <div className="grid gap-4">
                        {ensureOptionsByType(q.questionType, q.options).map(
                          (opt, optIndex) => {
                            const selectedIndexes = Array.isArray(
                              q.correctAnswer,
                            )
                              ? q.correctAnswer
                              : [Number(q.correctAnswer)];
                            const isCorrect =
                              selectedIndexes.includes(optIndex);
                            const optionTag = String.fromCharCode(
                              65 + optIndex,
                            );

                            return (
                              <div
                                key={optIndex}
                                className={`flex items-center gap-4 p-5 rounded-[1.5rem] border-2 transition-all duration-300
                              ${
                                isCorrect
                                  ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-900/20 shadow-md shadow-emerald-100 dark:shadow-none"
                                  : "border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30"
                              }
                            `}
                              >
                                <input
                                  type={
                                    q.questionType === "multipleChoice"
                                      ? "checkbox"
                                      : "radio"
                                  }
                                  name={`correct-${qIndex}`}
                                  checked={isCorrect}
                                  onChange={() =>
                                    setCorrectByIndex(qIndex, optIndex)
                                  }
                                  className="w-6 h-6 accent-emerald-600 dark:accent-emerald-500 cursor-pointer shrink-0"
                                />

                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border-2 transition-all
                              ${
                                isCorrect
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200 dark:shadow-none"
                                  : "bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-gray-700"
                              }
                            `}
                                >
                                  {optionTag}
                                </div>

                                <input
                                  value={opt}
                                  onChange={(e) =>
                                    updateOption(
                                      qIndex,
                                      optIndex,
                                      e.target.value,
                                    )
                                  }
                                  className={`w-full bg-transparent outline-none font-bold transition-all
                                ${
                                  isCorrect
                                    ? "text-emerald-900 dark:text-emerald-100 placeholder-emerald-300"
                                    : "text-gray-700 dark:text-gray-300 placeholder-gray-400"
                                }
                              `}
                                  placeholder={`Nhập đáp án ${optionTag}...`}
                                />
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-50 dark:border-gray-800">
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">
                        Giải thích đáp án (Từ AI)
                      </label>
                      <textarea
                        value={q.explanation}
                        onChange={(e) =>
                          updateQuestion(qIndex, {
                            explanation: e.target.value,
                          })
                        }
                        className="mt-3 w-full px-6 py-5 rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-purple-50/30 dark:bg-purple-900/5 focus:border-purple-500 focus:outline-none font-medium text-gray-800 dark:text-gray-200 min-h-[120px] transition-all leading-relaxed text-sm italic"
                        placeholder="AI chưa tạo giải thích cho câu này..."
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom controls */}
            <div className="flex flex-col gap-6 mt-12">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={addQuestion}
                    className="flex items-center gap-2 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 px-6 py-3 rounded-2xl font-black text-gray-700 dark:text-gray-300 hover:border-purple-600 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all shadow-sm active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Thêm câu hỏi mới</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {isDirty && (
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 px-6 py-3 rounded-2xl font-black text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95"
                    >
                      <span>Huỷ thay đổi</span>
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmAction("save")}
                    disabled={saving || errors.length > 0 || !isDirty}
                    className="flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 dark:shadow-none active:scale-95 disabled:opacity-40 disabled:grayscale"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    <span>Lưu bộ Quiz</span>
                  </button>
                </div>
              </div>

              {/* Status Message Display */}
              <div className="min-h-[32px] flex justify-center">
                {saveStatus === "ok" && (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm animate-in fade-in zoom-in">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Dữ liệu đã được cập nhật thành công!</span>
                  </div>
                )}
                {saveStatus === "err" && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-black text-sm animate-in shake duration-300">
                    <AlertCircle className="w-5 h-5" />
                    <span>
                      {errors.length > 0
                        ? "Vui lòng sửa các lỗi đỏ phía trên trước khi lưu."
                        : "Lỗi hệ thống khi lưu. Vui lòng thử lại."}
                    </span>
                  </div>
                )}
                {saveStatus === "idle" && isDirty && (
                  <div className="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    Bạn có thay đổi chưa lưu
                  </div>
                )}
              </div>

              {/* Secondary Actions */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => navigate("/generate")}
                  className="px-6 py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 font-black text-xs uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
                >
                  Quay về tạo quiz
                </button>

                <button
                  onClick={handleShare}
                  className="px-6 py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 font-black text-xs uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
                >
                  Share Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Re-styled Confirm Dialogs for Dark Mode */}
      <ConfirmDialog
        open={confirmAction === "save"}
        title="Xác nhận lưu thay đổi?"
        description="Toàn bộ nội dung câu hỏi và cấu hình bộ Quiz sẽ được cập nhật lại vào hệ thống."
        confirmText="Lưu ngay"
        cancelText="Để sau"
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      <ConfirmDialog
        open={shareResult !== null}
        title="Chia sẻ bộ Quiz"
        description={shareResult ?? ""}
        confirmText="Tuyệt vời"
        showCancel={false}
        onCancel={() => setShareResult(null)}
        onConfirm={() => setShareResult(null)}
      />
    </div>
  );
};

export default QuizEdit;
