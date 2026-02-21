import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ChevronLeft, CheckCircle2, XCircle, Info, Timer, Award } from 'lucide-react';

const AttemptDetail: React.FC = () => {
  const { quizId, number } = useParams();
  const [attempt, setAttempt] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Gọi song song: 1. Dữ liệu lần làm, 2. Nội dung bộ Quiz gốc
        const [attemptRes, quizRes] = await Promise.all([
          api.attempt.getAttemptByNumber(quizId!, Number(number)),
          api.quiz.getById(quizId!)
        ]);

        // Vì Backend getAttemptByQuizId trả về Mảng, ta lấy phần tử đầu tiên
        setAttempt(Array.isArray(attemptRes) ? attemptRes[0] : attemptRes);
        setQuiz(quizRes.data || quizRes); 
      } catch (err) {
        console.error("Lỗi lấy chi tiết:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [quizId, number]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold">Đang tải kết quả...</div>;
  if (!attempt || !quiz) return <div className="min-h-screen flex items-center justify-center">Không tìm thấy dữ liệu.</div>;

  return (
    <div className="pt-28 pb-20 px-4 max-w-4xl mx-auto">
      <button onClick={() => navigate('/history')} className="flex items-center text-gray-500 hover:text-blue-600 mb-8 font-bold transition-colors">
        <ChevronLeft className="w-5 h-5" /> Trở lại lịch sử
      </button>

      {/* Header tóm tắt */}
      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 mb-10 flex flex-col md:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">{attempt.quizTitle}</h1>
          <span className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">Lần làm thứ #{attempt.attemptNumber}</span>
        </div>
        <div className="flex gap-6 mt-6 md:mt-0">
          <div className="text-center px-8 py-4 bg-emerald-50 rounded-3xl border border-emerald-100">
            <Award className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
            <p className="text-2xl font-black text-emerald-700">{attempt.score}/{attempt.totalQuestions}</p>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Điểm số</p>
          </div>
          <div className="text-center px-8 py-4 bg-blue-50 rounded-3xl border border-blue-100">
            <Timer className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-black text-blue-700">{Math.floor(attempt.duration / 60)}:{(attempt.duration % 60).toString().padStart(2,'0')}</p>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Thời gian</p>
          </div>
        </div>
      </div>

      {/* Chi tiết từng câu hỏi */}
      <div className="space-y-8">
        {quiz.questions.map((q: any, idx: number) => {
          const userAnswer = attempt.answers[idx]; // Lấy đáp án user đã chọn từ attempt
          const isCorrect = Number(userAnswer) === Number(q.correctAnswer);

          return (
            <div key={idx} className={`bg-white rounded-[2rem] p-8 border-2 ${isCorrect ? 'border-emerald-100' : 'border-red-100'} shadow-sm relative overflow-hidden`}>
              <div className="flex justify-between items-center mb-6">
                <span className="font-black text-gray-400">CÂU {idx + 1}</span>
                {isCorrect ? <CheckCircle2 className="text-emerald-500 w-6 h-6" /> : <XCircle className="text-red-500 w-6 h-6" />}
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-8">{q.text}</h2>

              <div className="grid gap-4 mb-8">
                {q.options.map((opt: string, i: number) => {
                  const isUserChosen = Number(userAnswer) === i;
                  const isRight = Number(q.correctAnswer) === i;

                  let cardStyle = "border-gray-50 bg-gray-50 text-gray-500";
                  if (isRight) cardStyle = "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md shadow-emerald-100";
                  else if (isUserChosen && !isRight) cardStyle = "border-red-500 bg-red-50 text-red-700";

                  return (
                    <div key={i} className={`p-5 rounded-2xl border-2 font-bold flex justify-between items-center ${cardStyle}`}>
                      <span>{String.fromCharCode(65 + i)}. {opt}</span>
                      {isRight && <span className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded-md uppercase">Đáp án đúng</span>}
                      {isUserChosen && !isRight && <span className="text-[10px] bg-red-600 text-white px-2 py-1 rounded-md uppercase">Bạn chọn sai</span>}
                    </div>
                  );
                })}
              </div>

              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center gap-2 text-blue-700 font-bold mb-2 text-sm uppercase tracking-wider">
                  <Info className="w-4 h-4" /> Giải thích từ AI
                </div>
                <p className="text-blue-800 text-sm leading-relaxed">{q.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttemptDetail;