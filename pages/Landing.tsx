
import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Zap, Target, Layers, ArrowRight, CheckCircle } from 'lucide-react';

const Landing: React.FC = () => {
  return (
    <div className="pt-24 pb-16">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-6 animate-bounce">
          <Zap className="w-4 h-4" />
          <span>New: AI Quiz Generation with Gemini 3</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 leading-tight">
          Turn any topic into a <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Perfect Quiz</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
          Create custom quizzes for education, training, or fun using the power of Generative AI. 
          Save hours of manual writing and get instant results.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Link 
            to="/generate" 
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl hover:-translate-y-1"
          >
            <span>Get Started for Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a 
            href="#features" 
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg text-gray-700 hover:bg-gray-100 transition-all border border-gray-200"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Stats/Social Proof */}
      <section className="max-w-5xl mx-auto px-4 mt-24 py-12 border-y border-gray-100 flex flex-wrap justify-around text-center gap-8">
        <div>
          <p className="text-4xl font-bold text-gray-900">10k+</p>
          <p className="text-gray-500 font-medium">Quizzes Generated</p>
        </div>
        <div>
          <p className="text-4xl font-bold text-gray-900">99%</p>
          <p className="text-gray-500 font-medium">Topic Accuracy</p>
        </div>
        <div>
          <p className="text-4xl font-bold text-gray-900">&lt;5s</p>
          <p className="text-gray-500 font-medium">Generation Time</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything you need to master topics</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Our AI handles the heavy lifting so you can focus on learning and engaging your audience.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Brain className="w-8 h-8 text-blue-600" />,
              title: "Topic Agnostic",
              desc: "From advanced physics to 90s pop culture, our AI understands any subject you throw at it."
            },
            {
              icon: <Target className="w-8 h-8 text-indigo-600" />,
              title: "Custom Difficulty",
              desc: "Choose from Easy, Medium, or Hard modes to match the knowledge level of your participants."
            },
            {
              icon: <Layers className="w-8 h-8 text-purple-600" />,
              title: "Smart Explanations",
              desc: "Every question comes with a detailed explanation to ensure the learning process never stops."
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="mb-6 bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-16">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 -mr-20 -mt-20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900 opacity-20 -ml-20 -mb-20 rounded-full blur-3xl"></div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-8 relative z-10">Ready to build your first quiz?</h2>
          <p className="text-blue-100 text-xl max-w-2xl mx-auto mb-10 relative z-10">
            Join thousands of teachers, students, and curious minds. No credit card required.
          </p>
          <Link 
            to="/generate" 
            className="inline-flex items-center space-x-2 bg-white text-blue-700 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-gray-100 transition-all shadow-xl active:scale-95 relative z-10"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-6 h-6" />
          </Link>
          
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm font-medium text-blue-200 relative z-10">
            <span className="flex items-center space-x-2"><CheckCircle className="w-4 h-4" /> <span>Free to use</span></span>
            <span className="flex items-center space-x-2"><CheckCircle className="w-4 h-4" /> <span>No installation</span></span>
            <span className="flex items-center space-x-2"><CheckCircle className="w-4 h-4" /> <span>AI Powered</span></span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
