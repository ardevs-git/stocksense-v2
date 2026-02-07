
import React from 'react';

const AboutDeveloper: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Profile Header Card */}
      <div className="bg-card rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="h-32 bg-gradient-to-r from-primary to-primary-dark opacity-90"></div>
        <div className="px-8 pb-8">
          <div className="relative -mt-16 mb-6 flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="w-32 h-32 rounded-2xl bg-white p-1 shadow-lg border border-gray-100">
              <img 
                src="https://i.ibb.co/BVXJ7b69/1766566426611.png" 
                /* FIX: Removed duplicate alt attribute "1766566426611" to fix JSX error on line 15 */
                alt="Akash Kumar" 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-text-primary">Akash Kumar</h1>
              <p className="text-primary font-medium text-lg">Data Science Student | Aspiring Data Engineer | Tech Entrepreneur</p>
            </div>
          </div>

          <div className="prose prose-blue max-w-none text-text-secondary">
            <p className="text-lg leading-relaxed">
              I am a passionate technology professional with a strong foundation in Data Science, Analytics, and Software Development. 
              Currently pursuing BCA with a specialization in Data Science, I focus on building real-world, scalable digital solutions 
              that combine data, automation, and user-centric design.
            </p>
            <p className="text-lg leading-relaxed mt-4">
              With hands-on experience in EDA, Power BI, Python, SQL, React, and AI-driven systems, I believe in solving practical problems 
              using technology rather than just learning theory.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* What I Do Section */}
        <div className="bg-card p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">💼</span>
            </div>
            <h2 className="text-2xl font-bold text-text-primary">What I Do</h2>
          </div>
          <ul className="space-y-4">
            <li className="flex items-start gap-4">
              <span className="text-xl">📊</span>
              <div>
                <p className="font-bold text-text-primary">Data Analysis & Visualization</p>
                <p className="text-sm text-text-secondary">Exploratory Data Analysis (EDA), Power BI, and Advanced Excel reporting.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-xl">🤖</span>
              <div>
                <p className="font-bold text-text-primary">AI & ML Project Development</p>
                <p className="text-sm text-text-secondary">Building intelligent systems using modern AI frameworks.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-xl">🧠</span>
              <div>
                <p className="font-bold text-text-primary">Decision Support Systems</p>
                <p className="text-sm text-text-secondary">Creating data-driven tools to assist in strategic business planning.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-xl">🌐</span>
              <div>
                <p className="font-bold text-text-primary">Web & App Development</p>
                <p className="text-sm text-text-secondary">Crafting responsive interfaces with React, Expo, and robust APIs.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-xl">🏢</span>
              <div>
                <p className="font-bold text-text-primary">Business-Focused Solutions</p>
                <p className="text-sm text-text-secondary">Specializing in industry systems for restaurants and events.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Skills & Tools */}
        <div className="bg-card p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">🛠</span>
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Skills & Tools</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Programming</p>
              <div className="flex flex-wrap gap-2">
                {['Python', 'SQL', 'JavaScript'].map(skill => (
                  <span key={skill} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-bold rounded-lg border border-blue-100">{skill}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Data Science</p>
              <div className="flex flex-wrap gap-2">
                {['Pandas', 'NumPy', 'Power BI', 'Excel'].map(skill => (
                  <span key={skill} className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-bold rounded-lg border border-green-100">{skill}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Web & App</p>
              <div className="flex flex-wrap gap-2">
                {['React', 'React Native', 'Expo'].map(skill => (
                  <span key={skill} className="px-3 py-1.5 bg-purple-50 text-purple-700 text-sm font-bold rounded-lg border border-purple-100">{skill}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">AI & Systems</p>
              <div className="flex flex-wrap gap-2">
                {['Gemini AI', 'ML Basics', 'Automation', 'System Design'].map(skill => (
                  <span key={skill} className="px-3 py-1.5 bg-orange-50 text-orange-700 text-sm font-bold rounded-lg border border-orange-100">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vision & Belief Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-primary/5 p-8 rounded-2xl border border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🚀</span>
            <h3 className="text-xl font-bold text-primary">My Vision</h3>
          </div>
          <p className="text-text-secondary leading-relaxed italic">
            "To become a high-impact Data Engineer / Data Scientist who builds intelligent systems that help businesses grow, 
            optimize operations, and make smarter decisions. I aim to bridge the gap between raw data and meaningful insights."
          </p>
        </div>
        <div className="bg-card p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-center">
          <div className="text-center">
            <p className="text-3xl mb-4">🤝</p>
            <h3 className="text-xl font-bold text-text-primary mb-2">My Belief</h3>
            <p className="text-2xl font-bold text-primary leading-tight">
              “Technology should simplify life, not complicate it.”
            </p>
            <p className="text-sm text-text-secondary mt-4">
              Every project I build focuses on clarity, efficiency, and real value for users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutDeveloper;
