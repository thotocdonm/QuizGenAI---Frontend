
import React, { useState } from 'react';
import { Sparkles, HelpCircle } from 'lucide-react';
import { Difficulty } from '../types';

const Generator: React.FC = () => {
  const [formData, setFormData] = useState({
    prompt: '',
    numQuestions: 5,
    difficulty: Difficulty.MEDIUM
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Form submitted! You can now connect this to your backend API.');
    console.log('Form Data:', formData);
  };

  return (
    <div className="pt-32 pb-16 px-4 flex justify-center items-center min-h-[90vh]">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Quiz Generator</h1>
          <p className="text-gray-600">Configure your quiz settings below.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center space-x-1">
                <span>Quiz Topic / Prompt</span>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                placeholder="e.g. Science, History, Coding..."
                className="w-full h-32 px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all resize-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Number of Questions</label>
                <select
                  value={formData.numQuestions}
                  onChange={(e) => setFormData({ ...formData, numQuestions: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all"
                >
                  {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} Questions</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all"
                >
                  {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-3 bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl active:scale-95"
            >
              <Sparkles className="w-6 h-6" />
              <span>Start Implementation</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Generator;
