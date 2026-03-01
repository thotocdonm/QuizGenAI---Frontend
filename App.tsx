import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Generator from "./pages/Generator";
import QuizEdit from "./pages/QuizEdit";
import Auth from "./pages/Auth";
import QuizPlay from "./pages/QuizPlay";
import QuizGenerating from "./pages/QuizGenerating";
import ProtectedRoute from "./components/ProtectedRoute";
import QuizManage from "./pages/QuizManage";
import QuizHistory from "./pages/QuizHistory";
import QuizStart from "./pages/QuizStart";
import QuizSearch from "./pages/QuizSearch";
import AttemptDetail from "./pages/AttemptDetail";
import ListPoints from "./pages/ListPoints";
import { ThemeProvider } from "./context/ThemeContext";

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        {/* THAY ĐỔI: Thêm dark:bg-gray-950 để đổi màu nền toàn trang khi sang chế độ tối */}
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 selection:bg-purple-100 selection:text-purple-900 transition-colors duration-300">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/quiz/search"
                element={
                  <ProtectedRoute>
                    <QuizSearch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/generate"
                element={
                  <ProtectedRoute>
                    <Generator />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quiz/:id/edit"
                element={
                  <ProtectedRoute>
                    <QuizEdit />
                  </ProtectedRoute>
                }
              />
              <Route path="/quiz/:id/start" element={<QuizStart />} />
              <Route
                path="/quiz/:id"
                element={
                  <ProtectedRoute>
                    <QuizPlay />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <QuizHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage"
                element={
                  <ProtectedRoute>
                    <QuizManage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/generating"
                element={
                  <ProtectedRoute>
                    <QuizGenerating />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history/detail/:id"
                element={
                  <ProtectedRoute>
                    <AttemptDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage/:id"
                element={
                  <ProtectedRoute>
                    <ListPoints />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>

          {/* SỬA FOOTER: Xóa bỏ các class lặp lại, thêm dark mode gọn gàng */}
          <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-12 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                &copy; {new Date().getFullYear()} QuizAI. Built with Gemini 3 for
                the future of learning.
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
