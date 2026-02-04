import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Save,
  Play,
  Loader2,
  RefreshCcw,
  Wand2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// =====================
// Types
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
// Helpers
// =====================
const ensure4Options = (opts: string[]) => {
  const base = [...opts];
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

// =====================
// Component
// =====================
const QuizReviewEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDirty, setIsDirty] = useState(false);

  // Save / status UI
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "err">("idle");

  // Regenerate UI (stub)
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState("");

  // =====================
  // MOCK LOAD (xóa khi nối backend)
  // =====================
  useEffect(() => {
    setLoading(true);

    const mockQuiz: Quiz = {
      title: "Khám phá Địa lý Việt Nam",
      difficulty: "Trung bình",
      questions: [
        {
          question: "Đỉnh núi nào được mệnh danh là 'Nóc nhà Đông Dương'?",
          options: ["Fansipan", "Pusilung", "Tây Côn Lĩnh", "Bạch Mã"],
          correctAnswer: "Fansipan",
          explanation:
            "Fansipan là ngọn núi cao nhất Việt Nam và cũng là cao nhất trong ba nước Đông Dương, với độ cao 3.143m thuộc dãy núi Hoàng Liên Sơn.",
        },
        {
          question: "Tỉnh nào có diện tích lớn nhất Việt Nam?",
          options: ["Gia Lai", "Đắk Lắk", "Nghệ An", "Thanh Hóa"],
          correctAnswer: "Nghệ An",
          explanation: "Nghệ An là tỉnh có diện tích lớn nhất Việt Nam.",
        },
        {
          question:
            "Vịnh nào của Việt Nam được UNESCO công nhận là Kỳ quan thiên nhiên thế giới?",
          options: [
            "Vịnh Cam Ranh",
            "Vịnh Hạ Long",
            "Vịnh Xuân Đài",
            "Vịnh Vân Phong",
          ],
          correctAnswer: "Vịnh Hạ Long",
          explanation:
            "Vịnh Hạ Long thuộc tỉnh Quảng Ninh được UNESCO công nhận là Di sản thiên nhiên thế giới.",
        },
      ],
    };

    setTimeout(() => {
      setQuiz({
        ...mockQuiz,
        questions: mockQuiz.questions.map((q) => normalizeCorrectAnswer(q)),
      });
      setLoading(false);
    }, 600);
  }, [id]);

  // =====================
  // Derived
  // =====================
  const total = quiz?.questions.length ?? 0;
  const currentQ = useMemo(
    () => quiz?.questions[currentIndex],
    [quiz, currentIndex],
  );
  const progress = useMemo(() => {
    if (!quiz || quiz.questions.length === 0) return 0;
    return ((currentIndex + 1) / quiz.questions.length) * 100;
  }, [quiz, currentIndex]);

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
    options[optIndex] = value;

    let correctAnswer = q.correctAnswer;
    // Nếu sửa option mà đang là đáp án đúng, giữ đúng theo text mới (same slot)
    if (q.correctAnswer === q.options[optIndex]) {
      correctAnswer = value;
    }
    updateQuestion(qIndex, { options, correctAnswer });
  };

  const setCorrectByIndex = (qIndex: number, optIndex: number) => {
    if (!quiz) return;
    const q = quiz.questions[qIndex];
    updateQuestion(qIndex, { correctAnswer: q.options[optIndex] });
  };

  const addQuestion = () => {
    if (!quiz) return;
    const questions = [...quiz.questions, makeEmptyQuestion()];
    setQuiz({ ...quiz, questions });
    setCurrentIndex(questions.length - 1);
    setIsDirty(true);
    setSaveStatus("idle");
  };

  const removeQuestion = (index: number) => {
    if (!quiz) return;
    if (quiz.questions.length <= 1) return;

    const questions = quiz.questions.filter((_, i) => i !== index);
    setQuiz({ ...quiz, questions });

    const nextIndex = Math.min(index, questions.length - 1);
    setCurrentIndex(nextIndex);

    setIsDirty(true);
    setSaveStatus("idle");
  };

  const validateQuiz = (): string[] => {
    const errors: string[] = [];
    if (!quiz) return ["Quiz rỗng"];

    if (!quiz.title.trim()) errors.push("Tiêu đề quiz không được để trống.");

    quiz.questions.forEach((q, idx) => {
      const n = idx + 1;
      if (!q.question.trim()) errors.push(`Câu ${n}: nội dung câu hỏi trống.`);
      const opts = ensure4Options(q.options);
      if (opts.some((o) => !o.trim()))
        errors.push(`Câu ${n}: đáp án A/B/C/D không được trống.`);
      if (!opts.includes(q.correctAnswer) || !q.correctAnswer.trim())
        errors.push(`Câu ${n}: đáp án đúng phải trùng một trong A/B/C/D.`);
      if (!q.explanation.trim())
        errors.push(`Câu ${n}: phần giải thích trống.`);
    });

    return errors;
  };

  // =====================
  // Actions (stub save / regenerate)
  // =====================
  const handleSave = async () => {
    if (!quiz) return;

    const errors = validateQuiz();
    if (errors.length > 0) {
      setSaveStatus("err");
      return;
    }

    setSaving(true);
    setSaveStatus("idle");
    try {
      // TODO: thay bằng API thật
      // await api.quiz.update(id as string, quiz);
      await new Promise((r) => setTimeout(r, 700));

      setIsDirty(false);
      setSaveStatus("ok");
    } catch {
      setSaveStatus("err");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateCurrent = async () => {
    if (!quiz || !currentQ) return;

    setRegenLoading(true);
    try {
      // TODO: gọi AI/backend để regenerate câu hiện tại dựa theo regenPrompt + currentQ
      // const newQ = await api.quiz.regenerateQuestion(id, currentIndex, regenPrompt)
      await new Promise((r) => setTimeout(r, 900));

      // MOCK “regenerate” nhẹ: chỉ thêm hậu tố vào câu hỏi
      updateQuestion(currentIndex, {
        question: currentQ.question.trim()
          ? currentQ.question.trim() + " (đã chỉnh bởi AI)"
          : "Câu hỏi mới (đã tạo bởi AI)",
      });
      setRegenPrompt("");
    } finally {
      setRegenLoading(false);
    }
  };

  // =====================
  // UI
  // =====================
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">
          Đang tải bản nháp quiz...
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
            Không có dữ liệu quiz
          </p>
          <p className="text-gray-500">
            Không đủ dữ liệu để xác minh quiz theo ID hiện tại.
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

  const errors = validateQuiz();

  return (
    <div className="pt-24 pb-16 px-4 bg-[#f8fafc] min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header / Progress */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
            <div className="w-full">
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
            </div>

            <div className="text-right shrink-0">
              <div className="text-right">
                <span className="text-2xl font-black text-blue-600">
                  {currentIndex + 1}
                </span>
                <span className="text-gray-400 font-bold"> / {total}</span>
              </div>
              <div className="mt-2 h-2 w-52 bg-gray-200 rounded-full overflow-hidden ml-auto">
                <div
                  className="h-full bg-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
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
                  {errors.slice(0, 6).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                  {errors.length > 6 && (
                    <li className="font-bold">+{errors.length - 6} lỗi khác</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-blue-900/5 border border-gray-100 mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />

            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-blue-600 font-bold text-xs uppercase tracking-[0.2em]">
                  Câu hỏi {currentIndex + 1}
                </p>
                <p className="text-gray-400 text-xs font-bold mt-1">
                  Chỉnh nội dung / đáp án / giải thích
                </p>
              </div>

              <button
                onClick={() => removeQuestion(currentIndex)}
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
              value={currentQ.question}
              onChange={(e) =>
                updateQuestion(currentIndex, { question: e.target.value })
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
                {ensure4Options(currentQ.options).map((opt, i) => {
                  const isCorrect =
                    currentQ.correctAnswer === currentQ.options[i];
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all
                        ${isCorrect ? "border-emerald-300 bg-emerald-50" : "border-gray-100 bg-gray-50/50"}
                      `}
                    >
                      <input
                        type="radio"
                        name={`correct-${currentIndex}`}
                        checked={isCorrect}
                        onChange={() => setCorrectByIndex(currentIndex, i)}
                        className="w-5 h-5 accent-emerald-600"
                        aria-label={`Đáp án đúng ${String.fromCharCode(65 + i)}`}
                      />

                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black border-2 shrink-0
                          ${isCorrect ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-400 border-gray-200"}
                        `}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>

                      <input
                        value={opt}
                        onChange={(e) =>
                          updateOption(currentIndex, i, e.target.value)
                        }
                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none font-bold
                          ${isCorrect ? "border-emerald-200 focus:border-emerald-600 bg-white" : "border-gray-100 focus:border-blue-600 bg-white"}
                        `}
                        placeholder={`Nhập đáp án ${String.fromCharCode(65 + i)}...`}
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
                value={currentQ.explanation}
                onChange={(e) =>
                  updateQuestion(currentIndex, { explanation: e.target.value })
                }
                className="mt-2 w-full px-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-bold text-gray-800 min-h-[110px]"
                placeholder="Nhập giải thích..."
              />
            </div>

            {/* AI Regenerate (stub) */}
            <div className="mt-8 p-6 rounded-2xl border border-indigo-100 bg-indigo-50/50">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 text-indigo-700 font-black">
                  <Wand2 className="w-5 h-5" />
                  <span>Yêu cầu AI chỉnh lại câu này</span>
                </div>

                <button
                  onClick={handleRegenerateCurrent}
                  disabled={regenLoading}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all disabled:opacity-60"
                >
                  {regenLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <RefreshCcw className="w-5 h-5" />
                  )}
                  <span>Regenerate</span>
                </button>
              </div>

              <textarea
                value={regenPrompt}
                onChange={(e) => setRegenPrompt(e.target.value)}
                className="w-full px-4 py-4 rounded-2xl border-2 border-indigo-100 focus:border-indigo-600 focus:outline-none font-bold text-gray-800 bg-white min-h-[90px]"
                placeholder="VD: Viết lại câu hỏi ngắn gọn hơn, thay đổi đáp án gây nhiễu hợp lý, giữ đúng kiến thức."
              />
              <p className="text-xs text-indigo-700/80 font-bold mt-2">
                Hiện tại là mock. Khi nối backend, thay logic trong
                handleRegenerateCurrent().
              </p>
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="flex flex-col gap-4">
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((p) => p - 1)}
              disabled={currentIndex === 0}
              className="flex items-center space-x-2 px-6 py-3 font-bold text-gray-400 hover:text-blue-600 disabled:opacity-0 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Quay lại</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={addQuestion}
                className="flex items-center gap-2 bg-white border-2 border-gray-200 px-5 py-3 rounded-xl font-black text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm"
              >
                <Plus className="w-5 h-5" />
                <span>Thêm câu</span>
              </button>

              <button
                onClick={() => navigate(`/quiz/${id ?? "123"}`)}
                className="flex items-center gap-2 bg-white border-2 border-gray-200 px-5 py-3 rounded-xl font-black text-gray-700 hover:border-emerald-600 hover:text-emerald-700 transition-all shadow-sm"
                title="Chuyển sang trang làm bài (preview)"
              >
                <Play className="w-5 h-5" />
                <span>Preview làm bài</span>
              </button>

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

            {currentIndex < total - 1 ? (
              <button
                onClick={() => setCurrentIndex((p) => p + 1)}
                className="group flex items-center space-x-2 bg-white border-2 border-gray-200 px-6 py-3 rounded-xl font-bold text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm"
              >
                <span>Tiếp theo</span>
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </button>
            ) : (
              <div className="w-[120px]" />
            )}
          </div>

          {/* Save Status */}
          <div className="min-h-[24px]">
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
        </div>
      </div>
    </div>
  );
};

export default QuizReviewEdit;
