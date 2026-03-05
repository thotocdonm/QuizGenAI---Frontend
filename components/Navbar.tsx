import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  LogOut,
  User,
  LayoutDashboard,
  ChevronDown,
  History,
  Search,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { clearToken } from "@/utils/authUtils";
import { useTheme } from "@/context/ThemeContext";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileUserOpen, setIsMobileUserOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const desktopUserRef = useRef<HTMLDivElement | null>(null);
  const mobileUserRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuPanelRef = useRef<HTMLDivElement | null>(null);
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    clearToken();
    navigate("/");
  };

  const handleLogoutRequest = () => {
    setIsDropdownOpen(false);
    setIsMobileUserOpen(false);
    setIsMobileMenuOpen(false);
    setConfirmLogoutOpen(true);
  };

  const handleSearchSubmit = (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    const keyword = searchKeyword.trim();
    setIsMobileMenuOpen(false);
    navigate(
      keyword
        ? `/quiz/search?keyword=${encodeURIComponent(keyword)}`
        : "/quiz/search",
    );
  };

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        isDropdownOpen &&
        desktopUserRef.current &&
        !desktopUserRef.current.contains(target)
      ) {
        setIsDropdownOpen(false);
      }

      if (
        isMobileUserOpen &&
        mobileUserRef.current &&
        !mobileUserRef.current.contains(target)
      ) {
        setIsMobileUserOpen(false);
      }

      if (isMobileMenuOpen) {
        const clickedMenuButton =
          mobileMenuButtonRef.current?.contains(target) ?? false;
        const clickedMenuPanel =
          mobileMenuPanelRef.current?.contains(target) ?? false;

        if (!clickedMenuButton && !clickedMenuPanel) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isDropdownOpen, isMobileUserOpen, isMobileMenuOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism shadow-sm bg-white dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/favicon.png" alt="QuizAI Logo" className="w-12 h-12" />
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

            {/* Tính năng Search từ phiên bản A */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2"
            >
              <div className="flex items-center gap-3 pl-3 pr-4 py-2 rounded-2xl bg-purple-50/80 dark:bg-purple-900/20 border border-purple-100/80 dark:border-purple-800/60 shadow-[0_10px_24px_rgba(124,58,237,0.12)] transition-all">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center text-purple-600 shadow-sm border border-purple-100/80 dark:border-gray-800">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="Enter keywords to search for quizzes..."
                  className="w-56 lg:w-72 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-purple-500/30 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700 hover:shadow-purple-500/40 active:scale-95 transition-all"
              >
                Search
              </button>
            </form>

            {user ? (
              <div ref={desktopUserRef} className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  // Sửa màu Nickname sang màu tối từ phiên bản B
                  className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-950 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-all border border-gray-200 dark:border-gray-800"
                >
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    {user.name}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-950 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/45 border border-gray-200 dark:border-gray-700 ring-1 ring-black/5 dark:ring-white/10 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <Link
                      to="/manage"
                      onClick={() => setIsDropdownOpen(false)}
                      // Sửa màu hover tối lại cho dropdown từ phiên bản B
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Quản lý Quiz</span>
                    </Link>

                    <Link
                      to="/history"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      <History className="w-4 h-4" />
                      <span>Lịch sử làm bài</span>
                    </Link>
                    <hr className="my-1 border-gray-50 dark:border-gray-800" />
                    <button
                      onClick={handleLogoutRequest}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            {user && (
              <div ref={mobileUserRef} className="relative">
                <button
                  onClick={() => setIsMobileUserOpen((open) => !open)}
                  className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 transition-all"
                  aria-label="User menu"
                  aria-expanded={isMobileUserOpen}
                >
                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <User className="w-4 h-4 text-purple-600" />
                  </div>
                </button>

                {isMobileUserOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-gray-950 shadow-2xl shadow-black/10 dark:shadow-black/45 border border-gray-200 dark:border-gray-700 ring-1 ring-black/5 dark:ring-white/10 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                      {user.name}
                    </div>
                    <hr className="my-1 border-gray-50 dark:border-gray-800" />
                    <Link
                      to="/manage"
                      onClick={() => setIsMobileUserOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Quản lý Quiz</span>
                    </Link>
                    <Link
                      to="/history"
                      onClick={() => setIsMobileUserOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      <History className="w-4 h-4" />
                      <span>Lịch sử làm bài</span>
                    </Link>
                    <button
                      onClick={handleLogoutRequest}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              ref={mobileMenuButtonRef}
              onClick={() => {
                setIsMobileUserOpen(false);
                setIsMobileMenuOpen((open) => !open);
              }}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 transition-all"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-yellow-400 transition-all"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div
            ref={mobileMenuPanelRef}
            className="md:hidden mt-3 rounded-2xl border border-gray-200 dark:border-gray-700 ring-1 ring-black/5 dark:ring-white/10 bg-white/95 dark:bg-gray-900/95 shadow-2xl shadow-black/10 dark:shadow-black/45 backdrop-blur-sm px-3 pb-4"
          >
            <div className="pt-3 space-y-4">
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-2"
              >
                <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-purple-50/80 dark:bg-purple-900/20 border border-purple-100/80 dark:border-purple-800/60 shadow-[0_10px_24px_rgba(124,58,237,0.12)] transition-all">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center text-purple-600 shadow-sm border border-purple-100/80 dark:border-gray-800">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    value={searchKeyword}
                    onChange={(event) => setSearchKeyword(event.target.value)}
                    placeholder="Search for quizzes to play..."
                    className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <button
                  type="submit"
                  className="shrink-0 px-4 py-4 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-purple-500/30 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700 hover:shadow-purple-500/40 active:scale-95 transition-all"
                >
                  Search
                </button>
              </form>
              <div className="grid gap-2">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200 font-semibold"
                >
                  Home
                </Link>
                <Link
                  to="/quiz/search"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200 font-semibold"
                >
                  Play Quiz Now
                </Link>
                <Link
                  to="/generate"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200 font-semibold"
                >
                  Create Quiz
                </Link>
              </div>

              {!user && (
                <Link
                  to="/auth"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-center px-5 py-3 rounded-xl bg-purple-600 text-white font-bold shadow-lg"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {confirmLogoutOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                Đăng xuất?
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này không?
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setConfirmLogoutOpen(false)}
                  className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-white dark:bg-gray-900 font-bold text-gray-700 dark:text-gray-300 hover:border-gray-400 transition-all"
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
  );
};

export default Navbar;
