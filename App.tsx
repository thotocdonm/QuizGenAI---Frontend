
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Generator from './pages/Generator';
import Auth from './pages/Auth';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 selection:bg-blue-100 selection:text-blue-900">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/generate" element={<Generator />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </main>
        
        {/* Simple Footer */}
        <footer className="bg-white border-t border-gray-100 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-500 text-sm font-medium">
              &copy; {new Date().getFullYear()} QuizAI. Built with Gemini 3 for the future of learning.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
