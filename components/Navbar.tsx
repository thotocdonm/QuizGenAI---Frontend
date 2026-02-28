import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  BrainCircuit,
  LogOut,
  User,
  LayoutDashboard,
  ChevronDown,
  History,
  Sun,
  Moon,
} from "lucide-react";
import { clearToken } from "@/utils/authUtils";
import { useTheme } from "@/context/ThemeContext";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleLogoutRequest = () => {
    setIsDropdownOpen(false);
    setConfirmLogoutOpen(true);
  };

  return (
    <nav className="... dark:bg-gray-900/80">
    <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism shadow-sm bg-white dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="p-2 bg-purple-600 rounded-lg">
              <BrainCircuit className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
              QuizAI
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-600 hover:text-purple-600 font-medium"
            >
              Home
            </Link>
            <Link
              to="/generate"
              className="text-gray-600 hover:text-purple-600 font-medium"
            >
              Create Quiz
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-full hover:bg-gray-100 transition-all border border-gray-200"
                >
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">
                    {user.name}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <Link
                      to="/manage"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Quản lý Quiz</span>
                    </Link>

                    <Link
                      to="/history"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    >
                      <History className="w-4 h-4" />
                      <span>Lịch sử làm bài</span>
                    </Link>
                    <hr className="my-1 border-gray-50" />
                    <button
                      onClick={handleLogoutRequest}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="bg-purple-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-purple-700"
              >
                Sign In
              </Link>
            )}
<button 
        onClick={toggleTheme}
        className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-yellow-400 transition-all mr-2"
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

          </div>
        </div>
      </div>

      {confirmLogoutOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Đăng xuất?</h3>
              <p className="mt-2 text-sm text-gray-600">
                Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này không?
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setConfirmLogoutOpen(false)}
                  className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-white dark:bg-gray-900 dark:bg-gray-900 font-bold text-gray-700 hover:border-gray-400 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    setConfirmLogoutOpen(false);
                    handleLogout();
                  }}
                  className="px-4 py-2 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </nav>
      </nav>
  );
};

export default Navbar;
