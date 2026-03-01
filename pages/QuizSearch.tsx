import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Loader2,
  AlertCircle,
  Play,
  ClipboardList,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api } from "@/services/api";

const ITEMS_PER_PAGE = 6;

const QuizSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = (searchParams.get("keyword") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || "1"));

  const [queryInput, setQueryInput] = useState(keyword);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({
    page,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQueryInput(keyword);
  }, [keyword]);

  useEffect(() => {
    let active = true;

    if (!keyword) {
      setQuizzes([]);
      setPagination({
        page,
        limit: ITEMS_PER_PAGE,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: page > 1,
      });
      setError(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    const fetchQuizzes = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.quiz.searchPublic({
          keyword,
          page,
          limit: ITEMS_PER_PAGE,
        });

        const payload = response?.quizzes ?? response;
        const data = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];

        if (!active) return;

        setQuizzes(data);

        if (payload?.pagination) {
          setPagination(payload.pagination);
        } else {
          setPagination({
            page,
            limit: ITEMS_PER_PAGE,
            total: data.length,
            totalPages: data.length ? 1 : 0,
            hasNext: false,
            hasPrev: page > 1,
          });
        }
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        if (status === 401) {
          setError("Bạn cần đăng nhập để tìm kiếm quiz công khai.");
        } else {
          setError("Không thể tải danh sách quiz. Vui lòng thử lại.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchQuizzes();
    return () => {
      active = false;
    };
  }, [keyword, page]);

  const updateParams = (nextKeyword: string, nextPage: number) => {
    const params = new URLSearchParams();
    const trimmed = nextKeyword.trim();
    if (trimmed) params.set("keyword", trimmed);
    if (nextPage > 1) params.set("page", String(nextPage));
    setSearchParams(params);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateParams(queryInput, 1);
  };

  const handlePageChange = (nextPage: number) => {
    updateParams(keyword, nextPage);
  };

  const formatTimeLimit = (seconds?: number | null) => {
    if (!seconds || seconds <= 0) return "Không giới hạn";
    const minutes = Math.max(1, Math.round(seconds / 60));
    return `${minutes} phút`;
  };

  const formatMaxAttempts = (maxAttempts?: number | null) => {
    if (!maxAttempts || maxAttempts <= 0) return "Không giới hạn";
    return `${maxAttempts} lần`;
  };

  const getDifficultyClasses = (difficulty?: string) => {
    const level = String(difficulty || "").toLowerCase();
    if (level.includes("dễ") || level.includes("easy")) {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    }
    if (level.includes("khó") || level.includes("hard")) {
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
    }
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  };

  const hasKeyword = keyword.length > 0;
  const total =
    typeof pagination?.total === "number" ? pagination.total : quizzes.length;
  const totalPages =
    typeof pagination?.totalPages === "number" ? pagination.totalPages : 0;
  const currentPage =
    typeof pagination?.page === "number" ? pagination.page : page;

  return (
    <div className="pt-24 pb-20 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/20">
                <Search className="text-white w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                  Play Quiz Together
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  {hasKeyword
                    ? `Result for "${keyword}"`
                    : "Enter keywords to explore the public quiz."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="w-full lg:flex-1">
              <div className="flex items-center gap-3 w-full">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    value={queryInput}
                    onChange={(event) => setQueryInput(event.target.value)}
                    placeholder="Enter keywords to search..."
                    className="w-full pl-14 pr-5 py-4 rounded-3xl bg-white dark:bg-gray-900 text-base text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-4 rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-base font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="min-h-[40vh] flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
          ) : !hasKeyword ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-10 text-center border border-gray-200 dark:border-gray-800">
              <AlertCircle className="mx-auto w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Enter keywords to start searching for public quizzes.
              </p>
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-10 text-center border border-gray-200 dark:border-gray-800">
              <AlertCircle className="mx-auto w-12 h-12 text-red-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                {error}
              </p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-10 text-center border border-gray-200 dark:border-gray-800">
              <AlertCircle className="mx-auto w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Không tìm thấy quiz phù hợp. Hãy thử từ khóa khác nhé.
              </p>
            </div>
          ) : (
            <>
              {totalPages > 1 && (
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() =>
                      handlePageChange(Math.max(currentPage - 1, 1))
                    }
                    disabled={currentPage <= 1}
                    className="p-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:border-purple-500 dark:hover:border-purple-500 disabled:opacity-30 transition-all shadow-sm"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNumber = i + 1;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${
                            currentPage === pageNumber
                              ? "bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-none"
                              : "bg-white dark:bg-gray-900 text-gray-400 border-2 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() =>
                      handlePageChange(Math.min(currentPage + 1, totalPages))
                    }
                    disabled={currentPage >= totalPages}
                    className="p-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:border-purple-500 dark:hover:border-purple-500 disabled:opacity-30 transition-all shadow-sm"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-semibold">
                    Found {total} quiz:
                  </span>
                  {keyword && (
                    <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-3 py-1 text-xs font-bold">
                      #{keyword}
                    </span>
                  )}
                </div>
                {keyword && (
                  <button
                    onClick={() => updateParams("", 1)}
                    className="text-sm font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {quizzes.map((quiz) => {
                  const questionCount =
                    quiz?.numQuestions ?? quiz?.questions?.length ?? 0;

                  return (
                    <div
                      key={quiz._id}
                      className="rounded-2xl border border-gray-200 dark:border-gray-700/70 bg-white dark:bg-gray-900/70 px-6 py-5 shadow-sm dark:shadow-lg dark:shadow-black/30 hover:border-purple-200 dark:hover:border-purple-600/60 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-900/50 flex items-center justify-center">
                            <ClipboardList className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <h3 className="text-lg font-black text-gray-900 dark:text-white leading-snug">
                                {quiz?.title || "Quiz chưa đặt tên"}
                              </h3>
                              <span
                                className={`shrink-0 px-3 py-1 text-xs font-black rounded-full ${getDifficultyClasses(
                                  quiz?.difficulty,
                                )}`}
                              >
                                {quiz?.difficulty || "Không rõ"}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <span className="inline-flex items-center gap-1.5">
                                <ClipboardList className="w-4 h-4" />
                                {questionCount} câu
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {formatTimeLimit(quiz?.timeLimit)}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <ClipboardList className="w-4 h-4" />
                                {formatMaxAttempts(quiz?.maxAttempts)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/quiz/${quiz._id}/start`)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 text-white px-5 py-3 text-sm font-black hover:bg-gray-800 transition-all active:scale-95 dark:bg-gray-800/90 dark:text-gray-100 dark:border dark:border-gray-700/80 dark:hover:bg-gray-700/80 dark:hover:border-purple-500/60"
                        >
                          <Play className="w-4 h-4" />
                          Play Quiz
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizSearch;
