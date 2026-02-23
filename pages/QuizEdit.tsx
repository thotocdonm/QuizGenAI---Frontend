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
                : "bg-blue-600 hover:bg-blue-700"
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
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr,270px] gap-8">
          {/* Sidebar question list */}
          <aside className="hidden lg:block lg:order-2">
            <div className="sticky top-28">
              <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden pr-2">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold mb-4">
                    Danh sách câu hỏi
                  </p>
                  <div className="grid grid-cols-4 gap-3 max-h-[300px] overflow-y-auto overflow-x-hidden pr-1">
                    {quiz.questions.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => scrollToQuestion(idx)}
                        className="w-12 h-12 rounded-full bg-gray-200 text-gray-700 font-bold hover:bg-blue-600 hover:text-white transition-colors"
                        aria-label={`Đi tới câu ${idx + 1}`}
                        type="button"
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 text-xs text-gray-400 font-bold">
                    Tổng: {total} câu
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold mb-4">
                    Điều khiển
                  </p>
                  <div className="grid gap-2">
                    <button
                      onClick={addQuestion}
                      className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 px-4 py-2 rounded-xl font-black text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm câu</span>
                    </button>
                    {isDirty && (
                      <button
                        onClick={handleCancel}
                        className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 px-4 py-2 rounded-xl font-black text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-all shadow-sm"
                      >
                        <span>Huỷ thay đổi</span>
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmAction("save")}
                      disabled={saving || errors.length > 0 || !isDirty}
                      className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-black hover:bg-blue-700 transition-all shadow-xl active:scale-95 disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Lưu quiz</span>
                    </button>
                    {/* <button
                      onClick={handlePreviewClick}
                      className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 px-4 py-2 rounded-xl font-black text-gray-700 hover:border-emerald-600 hover:text-emerald-700 transition-all shadow-sm"
                      title="Chuyển sang trang làm bài (preview)"
                    >
                      <Play className="w-4 h-4" />
                      <span>Preview làm bài</span>
                    </button> */}
                    <button
                      onClick={handleShare}
                      className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-white font-black text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-all"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => navigate("/generate")}
                      className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-white font-black text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-all"
                    >
                      Quay về
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:order-1">
            {/* Header */}
            <div className="mb-8">
              <p className="text-blue-600 font-bold text-xs uppercase tracking-[0.2em] mb-2">
                Review & Edit (AI Draft)
              </p>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                <div>
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

                <div className="mt-4 grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-[0.18em]">
                      Độ khó
                    </label>
                    <select
                      value={quiz.difficulty}
                      onChange={(e) =>
                        updateQuiz({ difficulty: e.target.value })
                      }
                      className="mt-2 w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-bold text-gray-700 bg-white"
                    >
                      <option value="Dễ">Dễ</option>
                      <option value="Trung bình">Trung bình</option>
                      <option value="Khó">Khó</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-[0.18em]">
                      Thời gian (phút)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={quiz.timeLimit ?? ""}
                      onChange={(e) =>
                        updateQuiz({
                          timeLimit:
                            e.target.value === ""
                              ? undefined
                              : Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="mt-2 w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-bold text-gray-900"
                      placeholder="VD: 45"
                    />
                    <p className="mt-1 text-xs text-gray-400 font-bold">
                      0 = không giới hạn
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-[0.18em]">
                      Số lần làm tối đa
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={quiz.maxAttempts ?? ""}
                      onChange={(e) =>
                        updateQuiz({
                          maxAttempts:
                            e.target.value === ""
                              ? undefined
                              : Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="mt-2 w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-bold text-gray-900"
                      placeholder="VD: 3"
                    />
                    <p className="mt-1 text-xs text-gray-400 font-bold">
                      0 = không giới hạn
                    </p>
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
                        <li className="font-bold">
                          +{errors.length - 8} lỗi khác
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* All questions */}
            <div className="space-y-6 mb-8">
              {quiz.questions.map((q, qIndex) => {
                const questionIssues = buildQuestionIssues(q);
                return (
                  <div
                    key={qIndex}
                    ref={(el) => {
                      questionRefs.current[qIndex] = el;
                    }}
                    className="bg-white rounded-[2rem] p-8 md:p-10 shadow-xl shadow-blue-900/5 border border-gray-100 relative overflow-hidden scroll-mt-28"
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
                        <div className="mt-2">
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
                            className="px-3 py-1 rounded-lg border-2 border-gray-100 bg-white text-xs font-black text-gray-600 focus:border-blue-600 focus:outline-none"
                          >
                            <option value="multipleStatements">
                              Câu hỏi nhiều mệnh đề
                            </option>
                            <option value="singleChoice">Chọn 1 đáp án</option>
                            <option value="multipleChoice">
                              Chọn nhiều đáp án
                            </option>
                          </select>
                        </div>
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
                    {questionIssues.length > 0 && (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-center gap-2 text-amber-800 font-black text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>Cần chỉnh ({questionIssues.length})</span>
                        </div>
                        <ul className="mt-2 text-amber-900 text-sm list-disc pl-5 space-y-1">
                          {questionIssues.map((issue, issueIndex) => (
                            <li key={issueIndex}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
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
                          {q.questionType === "multipleStatements"
                            ? "Đáp án (tổ hợp mệnh đề)"
                            : "Đáp án (A/B/C/D)"}
                        </span>
                        <span className="text-xs text-gray-400 font-bold">
                          {q.questionType === "multipleChoice"
                            ? "Chọn checkbox để đặt các đáp án đúng"
                            : "Chọn radio để đặt đáp án đúng"}
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
                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all
                              ${
                                isCorrect
                                  ? "border-emerald-300 bg-emerald-50"
                                  : "border-gray-100 bg-gray-50/50"
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
                                  className="w-5 h-5 accent-emerald-600"
                                  aria-label={`Đáp án đúng ${optionTag}`}
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
                                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none font-bold
                                ${
                                  isCorrect
                                    ? "border-emerald-200 focus:border-emerald-600 bg-white"
                                    : "border-gray-100 focus:border-blue-600 bg-white"
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
                    <div className="mt-8">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-[0.18em]">
                        Giải thích (hiển thị sau khi làm bài)
                      </label>
                      <textarea
                        value={q.explanation}
                        onChange={(e) =>
                          updateQuestion(qIndex, {
                            explanation: e.target.value,
                          })
                        }
                        className="mt-2 w-full px-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-bold text-gray-800 min-h-[110px]"
                        placeholder="Nhập giải thích..."
                      />
                    </div>
                  </div>
                );
              })}
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
                    onClick={() => setConfirmAction("save")}
                    disabled={saving || errors.length > 0 || !isDirty}
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
                {/* <button
                  onClick={handlePreviewClick}
                  className="flex items-center gap-2 bg-white border-2 border-gray-200 px-5 py-3 rounded-xl font-black text-gray-700 hover:border-emerald-600 hover:text-emerald-700 transition-all shadow-sm"
                  title="Chuyển sang trang làm bài (preview)"
                >
                  <Play className="w-5 h-5" />
                  <span>Preview làm bài</span>
                </button> */}
                <button
                  onClick={handleShare}
                  className="px-5 py-3 rounded-xl border-2 border-gray-200 bg-white font-black text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-all"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === "save"}
        title="Xác nhận lưu quiz?"
        description="Bạn có chắc chắn muốn lưu các thay đổi hiện tại?"
        confirmText="Lưu"
        cancelText="Hủy"
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      <ConfirmDialog
        open={shareResult !== null}
        title="Chia sẻ"
        description={shareResult ?? ""}
        confirmText="OK"
        showCancel={false}
        onCancel={() => setShareResult(null)}
        onConfirm={() => setShareResult(null)}
      />
    </div>
  );
};

export default QuizEdit;
