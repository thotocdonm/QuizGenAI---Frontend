import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Generator from "./pages/Generator";
import QuizEdit from "./pages/QuizEdit";
import Auth from "./pages/Auth";
// Thêm import cho các trang mới
import QuizDetail from "./pages/QuizDetail";
import QuizGenerating from "./pages/QuizGenerating";
import ProtectedRoute from "./components/ProtectedRoute"; // 1. Import gác cổng

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 selection:bg-blue-100 selection:text-blue-900">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Landing />} />

            <Route path="/auth" element={<Auth />} />
            {/* Thêm các Route mới vào đây */}

            {/* 2. Bọc các trang cần bảo vệ vào ProtectedRoute */}
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
            <Route
              path="/quiz/:id"
              element={
                <ProtectedRoute>
                  <QuizDetail />
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
          </Routes>
        </main>

        {/* Simple Footer */}
        <footer className="bg-white border-t border-gray-100 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-500 text-sm font-medium">
              &copy; {new Date().getFullYear()} QuizAI. Built with Gemini 3 for
              the future of learning.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
