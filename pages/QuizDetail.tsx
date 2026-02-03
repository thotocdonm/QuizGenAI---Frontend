import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  RefreshCcw,
  Info
} from 'lucide-react';
// import { api } from '../services/api'; // <--- TẠM THỜI KHÓA KHI DÙNG MOCK DATA

const QuizDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // States
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // ============================================================
  // BẮT ĐẦU VÙNG DỮ LIỆU MẪU (MOCK DATA) - XÓA KHI NỐI BACKEND
  // ============================================================
  useEffect(() => {
    const loadMockData = () => {
      setLoading(true);
      const mockQuiz = {
        title: "Khám phá Địa lý Việt Nam",
        difficulty: "Trung bình",
        questions: [
          {
            question: "Đỉnh núi nào được mệnh danh là 'Nóc nhà Đông Dương'?",
            options: ["Fansipan", "Pusilung", "Tây Côn Lĩnh", "Bạch Mã"],
            correctAnswer: "Fansipan",
            explanation: "Fansipan là ngọn núi cao nhất Việt Nam và cũng là cao nhất trong ba nước Đông Dương, với độ cao 3.143m thuộc dãy núi Hoàng Liên Sơn."
          },
          {
            question: "Tỉnh nào có diện tích lớn nhất Việt Nam?",
            options: ["Gia Lai", "Đắk Lắk", "Nghệ An", "Thanh Hóa"],
            correctAnswer: "Nghệ An",
            explanation: "Nghệ An là tỉnh có diện tích lớn nhất Việt Nam với hơn 16.490 km²."
          },
          {
            question: "Vịnh nào của Việt Nam được UNESCO công nhận là Kỳ quan thiên nhiên thế giới?",
            options: ["Vịnh Cam Ranh", "Vịnh Hạ Long", "Vịnh Xuân Đài", "Vịnh Vân Phong"],
            correctAnswer: "Vịnh Hạ Long",
            explanation: "Vịnh Hạ Long thuộc tỉnh Quảng Ninh đã nhiều lần được UNESCO công nhận là Di sản thiên nhiên thế giới về giá trị thẩm mỹ và địa chất."
          }
        ]
      };
      
      // Giả lập thời gian chờ AI/Backend 1 giây
      setTimeout(() => {
        setQuiz(mockQuiz);
        setLoading(false);
      }, 1000);
    };

    loadMockData();
  }, []);
  // ============================================================
  // KẾT THÚC VÙNG DỮ LIỆU MẪU
  // ============================================================


  /* 
  // ============================================================
  // LOGIC LẤY DỮ LIỆU THẬT TỪ BACKEND (SẼ DÙNG SAU NÀY)
  // ============================================================
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await api.quiz.getById(id as string);
        if (response.success === "true") {
          setQuiz(response.data);
        }
      } catch (err) {
        console.error("Lỗi lấy chi tiết quiz:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id !== "123") { // Chỉ gọi API khi ID không phải là ID test
       fetchQuiz();
    }
  }, [id]);
  // ============================================================
  */

  // Xử lý chọn đáp án
  const handleSelectOption = (option: string) => {
    if (isSubmitted) return; 
    setUserAnswers({ ...userAnswers, [currentIndex]: option });
  };

  // Xử lý nộp bài
  const handleSubmitQuiz = () => {
    let correctCount = 0;
    quiz.questions.forEach((q: any, index: number) => {
      if (userAnswers[index] === q.correctAnswer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setIsSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Đang tải bộ câu hỏi...</p>
      </div>
    );
  }

  const currentQ = quiz.questions[currentIndex];
  const progress = ((currentIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="pt-24 pb-16 px-4 bg-[#f8fafc] min-h-screen">
      <div className="max-w-3xl mx-auto">
        
        {/* Progress Bar & Header */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900 mb-1">{quiz.title}</h1>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase">{quiz.difficulty}</span>
                <span className="text-xs text-gray-400 font-bold">DỮ LIỆU MẪU</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-blue-600">{currentIndex + 1}</span>
              <span className="text-gray-400 font-bold"> / {quiz.questions.length}</span>
            </div>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-blue-900/5 border border-gray-100 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
          
          <p className="text-blue-600 font-bold text-xs mb-4 uppercase tracking-[0.2em]">Câu hỏi {currentIndex + 1}</p>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-8 leading-relaxed">
            {currentQ.question}
          </h2>

          <div className="grid gap-4">
            {currentQ.options.map((option: string, i: number) => {
              const isSelected = userAnswers[currentIndex] === option;
              const isCorrect = isSubmitted && option === currentQ.correctAnswer;
              const isWrong = isSubmitted && isSelected && option !== currentQ.correctAnswer;

              return (
                <button
                  key={i}
                  disabled={isSubmitted}
                  onClick={() => handleSelectOption(option)}
                  className={`
                    flex items-center p-5 rounded-2xl border-2 transition-all duration-200 text-left font-bold
                    ${isSelected ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md' : 'border-gray-50 bg-gray-50/50 hover:border-blue-200 text-gray-600'}
                    ${isCorrect ? 'border-green-500 bg-green-50 text-green-700 shadow-none' : ''}
                    ${isWrong ? 'border-red-500 bg-red-50 text-red-700 shadow-none' : ''}
                  `}
                >
                  <span className={`
                    w-10 h-10 rounded-xl flex items-center justify-center mr-4 shrink-0 border-2 transition-colors
                    ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-100'}
                    ${isCorrect ? 'bg-green-500 text-white border-green-500' : ''}
                    ${isWrong ? 'bg-red-500 text-white border-red-500' : ''}
                  `}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>

          {/* Explanation after Submit */}
          {isSubmitted && (
            <div className="mt-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in fade-in zoom-in duration-500">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold mb-2">
                <Info className="w-5 h-5" />
                <span>Giải thích từ AI</span>
              </div>
              <p className="text-emerald-800 text-sm leading-relaxed">{currentQ.explanation}</p>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex(prev => prev - 1)}
            disabled={currentIndex === 0}
            className="flex items-center space-x-2 px-6 py-3 font-bold text-gray-400 hover:text-blue-600 disabled:opacity-0 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Quay lại</span>
          </button>

          {currentIndex < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(prev => prev + 1)}
              className="group flex items-center space-x-2 bg-white border-2 border-gray-200 px-8 py-3 rounded-xl font-bold text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm"
            >
              <span>Tiếp theo</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            !isSubmitted && (
              <button
                onClick={handleSubmitQuiz}
                className="flex items-center space-x-2 bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl active:scale-95 animate-bounce-short"
              >
                <span>Nộp bài ngay</span>
                <Send className="w-5 h-5" />
              </button>
            )
          )}
        </div>

        {/* Final Results Section */}
        {isSubmitted && (
          <div className="mt-12 bg-white rounded-[2.5rem] p-10 text-center shadow-2xl border border-blue-100 overflow-hidden relative">
             <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600"></div>
            
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-blue-600" />
            </div>
            
            <h2 className="text-3xl font-black text-gray-900 mb-2">Kết quả làm bài</h2>
            <p className="text-gray-500 text-lg mb-8">
                Bạn đã trả lời đúng 
                <span className="text-blue-600 font-black text-3xl px-2">{score}</span> 
                trên tổng số {quiz.questions.length} câu.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-800 transition-all shadow-lg"
              >
                <RefreshCcw className="w-5 h-5" />
                <span>Làm lại bài này</span>
              </button>
              <button 
                onClick={() => navigate('/generate')}
                className="bg-white text-gray-700 border-2 border-gray-100 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all"
              >
                Tạo Quiz khác
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizDetail;