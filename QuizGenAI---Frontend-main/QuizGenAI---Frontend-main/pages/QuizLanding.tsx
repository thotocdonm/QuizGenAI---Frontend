import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, FileText, Globe, MessageSquare, ArrowRight } from 'lucide-react';

const QuizLanding: React.FC = () => {
  const navigate = useNavigate();

  const methods = [
    {
      icon: <MessageSquare className="w-8 h-8 text-blue-600" />,
      title: "Từ mô tả văn bản",
      desc: "Nhập chủ đề hoặc nội dung ngắn gọn để AI tự biên soạn.",
      color: "bg-blue-50",
      path: "/generate"
    },
    {
      icon: <FileText className="w-8 h-8 text-purple-600" />,
      title: "Tải lên tài liệu",
      desc: "Tạo câu hỏi từ file PDF, Docx hoặc hình ảnh bài học.",
      color: "bg-purple-50",
      path: "/generate"
    },
    {
      icon: <Globe className="w-8 h-8 text-indigo-600" />,
      title: "Từ đường dẫn URL",
      desc: "Dán link bài báo hoặc trang web để trích xuất câu hỏi.",
      color: "bg-indigo-50",
      path: "/generate"
    }
  ];

  return (
    <div className="pt-28 pb-20 px-4 min-h-screen bg-[#f9fafb]">
      <div className="max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-6">
          <Sparkles className="w-4 h-4" />
          <span>AI-POWERED GENERATOR</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6">
          Tạo Quiz chuyên nghiệp <br />
          <span className="text-blue-600">trong vài giây với AI</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
          Hệ thống thông minh của chúng tôi giúp chuyển đổi mọi kiến thức thành bộ câu hỏi trắc nghiệm sinh động và chính xác.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {methods.map((method, idx) => (
            <div 
              key={idx}
              onClick={() => navigate(method.path)}
              className="group cursor-pointer bg-white p-8 rounded-[2rem] border-2 border-transparent hover:border-blue-500 hover:shadow-2xl transition-all duration-300"
            >
              <div className={`${method.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {method.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{method.title}</h3>
              <p className="text-gray-500 mb-6">{method.desc}</p>
              <div className="flex items-center text-blue-600 font-bold group-hover:translate-x-2 transition-transform">
                <span>Bắt đầu ngay</span>
                <ArrowRight className="ml-2 w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizLanding;