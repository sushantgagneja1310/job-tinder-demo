import React, { useState, useEffect, useRef } from 'react';
import { Heart, X, Shield, Zap, AlertTriangle, Ghost, CheckCircle, Terminal, Cpu, ChevronRight, User, Code, Activity, Briefcase, TrendingUp, DollarSign, MapPin, Clock, Award, Target, Brain, Sparkles, Download, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Radar as RechartsRadar } from 'recharts';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

// === 1. DATA ENGINE ===
const SKILL_DATABASE = {
  'Engineer': {
    core: ['React', 'Node.js', 'Python', 'TypeScript', 'SQL', 'Git'],
    advanced: ['AWS', 'Docker', 'Kubernetes', 'GraphQL', 'Microservices', 'CI/CD'],
    emerging: ['Rust', 'Go', 'WebAssembly', 'Edge Computing', 'Blockchain', 'AI/ML']
  },
  'Designer': {
    core: ['Figma', 'UI/UX', 'Adobe XD', 'Sketch', 'Prototyping'],
    advanced: ['Motion Design', 'User Research', 'Design Systems', 'Accessibility', 'Framer'],
    emerging: ['3D Design', 'AR/VR', 'AI-Assisted Design', 'Voice UI', 'Spatial Computing']
  },
  'Manager': {
    core: ['Agile', 'Scrum', 'JIRA', 'Team Leadership', 'Communication'],
    advanced: ['OKRs', 'Strategy', 'Budgeting', 'Stakeholder Management', 'Roadmapping'],
    emerging: ['Data-Driven Decisions', 'Remote Team Management', 'AI Tools', 'Change Management']
  },
  'Founder': {
    core: ['Product Vision', 'MVP Development', 'Customer Discovery', 'Pitching'],
    advanced: ['Fundraising', 'Growth Hacking', 'Unit Economics', 'Hiring', 'Legal/Compliance'],
    emerging: ['Web3', 'AI Integration', 'Community Building', 'Creator Economy', 'Platform Strategy']
  }
};

const RED_FLAG_DATABASE = {
  critical: ['rockstar', 'ninja', 'guru', 'family', 'wear many hats', 'fast-paced', 'hit the ground running'],
  warning: ['urgent', 'asap', 'immediately', 'competitive salary', 'up to', 'passion', 'hustle'],
  positive: ['structured', 'work-life', 'mentorship', 'growth', 'benefits', 'remote', 'flexible']
};

const EXPANDED_JOB_DATABASE = [
  {
    id: 1,
    title: "Senior Full-Stack Engineer",
    company: "Stripe",
    location: "Bangalore, India",
    type: "Full-time",
    remote: "Hybrid",
    salary: "₹45-55 LPA",
    salaryMin: 4500000,
    salaryMax: 5500000,
    description: "Build payment infrastructure used by millions. Strong engineering culture with code reviews, testing, and documentation. Competitive benefits including health insurance, learning budget, and WLB focus.",
    requirements: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker'],
    preferredSkills: ['GraphQL', 'Kubernetes', 'Microservices'],
    experience: "5+ years",
    usesATS: true,
    companySize: "5000+",
    funding: "Public",
    glassdoorRating: 4.5,
    bg: "from-emerald-900/80 to-teal-900/80"
  },
  {
    id: 2,
    title: "Founding Engineer",
    company: "Stealth AI Startup",
    location: "Remote",
    type: "Full-time",
    remote: "Remote",
    salary: "₹8-12 LPA + Equity",
    salaryMin: 800000,
    salaryMax: 1200000,
    description: "Need a rockstar ninja to hustle 24/7 building our revolutionary AI platform. Must wear many hats and be available urgently. We're a family here and need someone passionate who can hit the ground running!",
    requirements: ['React', 'Python', 'TensorFlow', 'AWS'],
    preferredSkills: ['Fast learner', 'Hustle'],
    experience: "2+ years",
    usesATS: false,
    companySize: "1-10",
    funding: "Pre-seed",
    glassdoorRating: null,
    bg: "from-red-900/80 to-orange-900/80"
  },
  {
    id: 3,
    title: "Product Designer",
    company: "Airbnb",
    location: "Gurgaon, India",
    type: "Full-time",
    remote: "Hybrid",
    salary: "₹35-42 LPA",
    salaryMin: 3500000,
    salaryMax: 4200000,
    description: "Craft delightful experiences for millions of travelers. Join a world-class design team with strong mentorship, structured growth paths, and excellent work-life balance. Focus on accessibility and inclusive design.",
    requirements: ['Figma', 'UI/UX', 'User Research', 'Prototyping', 'Design Systems'],
    preferredSkills: ['Motion Design', 'Accessibility', 'Framer'],
    experience: "4+ years",
    usesATS: true,
    companySize: "5000+",
    funding: "Public",
    glassdoorRating: 4.3,
    bg: "from-pink-900/80 to-rose-900/80"
  },
  {
    id: 4,
    title: "Backend Engineer",
    company: "Razorpay",
    location: "Bangalore, India",
    type: "Full-time",
    remote: "Office",
    salary: "₹30-40 LPA",
    salaryMin: 3000000,
    salaryMax: 4000000,
    description: "Build scalable payment systems handling millions of transactions. Strong focus on mentorship, learning, and career growth. Competitive benefits and structured work environment.",
    requirements: ['Node.js', 'Python', 'PostgreSQL', 'Redis', 'AWS'],
    preferredSkills: ['Go', 'Kubernetes', 'Event-Driven Architecture'],
    experience: "3-5 years",
    usesATS: true,
    companySize: "1000-5000",
    funding: "Series E",
    glassdoorRating: 4.1,
    bg: "from-blue-900/80 to-indigo-900/80"
  }
];

// === 2. MATCHING ALGORITHM ===
const analyzeMatch = (userProfile, job) => {
  const userSkills = (userProfile.skills || []).map(s => s.toLowerCase());
  const requiredSkills = job.requirements.map(r => r.toLowerCase());
  const preferredSkills = (job.preferredSkills || []).map(p => p.toLowerCase());
  
  // Skill Matching
  const matchedRequired = requiredSkills.filter(req => 
    userSkills.some(us => us.includes(req) || req.includes(us))
  );
  const matchedPreferred = preferredSkills.filter(pref =>
    userSkills.some(us => us.includes(pref) || pref.includes(us))
  );
  
  const requiredScore = requiredSkills.length > 0 ? (matchedRequired.length / requiredSkills.length) * 70 : 0;
  const preferredScore = preferredSkills.length > 0 ? (matchedPreferred.length / preferredSkills.length) * 30 : 30;
  const skillScore = Math.round(requiredScore + preferredScore);
  
  // Red Flag Analysis
  const desc = job.description.toLowerCase();
  const criticalFlags = RED_FLAG_DATABASE.critical.filter(word => desc.includes(word));
  const warningFlags = RED_FLAG_DATABASE.warning.filter(word => desc.includes(word));
  const positiveFlags = RED_FLAG_DATABASE.positive.filter(word => desc.includes(word));
  
  const toxicityScore = (criticalFlags.length * 30) + (warningFlags.length * 10) - (positiveFlags.length * 5);
  
  let flagStatus = 'green';
  if (toxicityScore >= 50) flagStatus = 'red';
  else if (toxicityScore >= 20 || criticalFlags.length >= 2) flagStatus = 'orange';
  
  // ATS Score
  const atsScore = job.usesATS ? 75 : 95;
  
  // Culture Fit Score
  let cultureScore = 70;
  if (flagStatus === 'red') cultureScore = 25;
  else if (flagStatus === 'orange') cultureScore = 50;
  else cultureScore = 85 + (positiveFlags.length * 3);
  
  // Salary Analysis
  const avgSalary = (job.salaryMin + job.salaryMax) / 2;
  const salaryScore = avgSalary > 0 ? Math.min(100, (avgSalary / 5000000) * 100) : 50;
  
  // Vibe matching
  let vibeScore = 70;
  if (userProfile.vibe === 'structure') {
    if (job.companySize === '1-10') vibeScore = 30;
    else if (job.companySize === '5000+') vibeScore = 95;
  } else if (userProfile.vibe === 'chaos') {
    if (job.companySize === '1-10') vibeScore = 95;
    else if (job.companySize === '5000+') vibeScore = 40;
  }
  
  let overall = (skillScore * 0.35) + (cultureScore * 0.25) + (vibeScore * 0.20) + (atsScore * 0.10) + (salaryScore * 0.10);
  
  return {
    overall: Math.max(5, Math.min(98, Math.round(overall))),
    skillScore: Math.round(skillScore),
    atsScore: Math.round(atsScore),
    cultureScore: Math.round(cultureScore),
    salaryScore: Math.round(salaryScore),
    vibeScore: Math.round(vibeScore),
    flagStatus,
    criticalFlags,
    warningFlags,
    positiveFlags,
    matchedRequired,
    matchedPreferred,
    toxicityScore
  };
};

// === 3. VISUAL COMPONENTS ===

const NeuralBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#8b5cf6';
      
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();

        particles.forEach((p2, j) => {
          if (i === j) return;
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.2 - dist/1500})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });
      requestAnimationFrame(animate);
    };
    animate();
    return () => window.removeEventListener('resize', resize);
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 z-0 opacity-30 pointer-events-none" />;
};

const SystemLog = ({ messages }) => {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    if (!messages) return;
    setLogs([]); 
    messages.forEach((msg, i) => {
      setTimeout(() => setLogs(prev => [...prev, msg]), i * 200);
    });
  }, [messages]);

  return (
    <div className="fixed bottom-4 left-4 z-20 font-mono text-[10px] text-purple-400/60 pointer-events-none hidden lg:block max-w-xs">
      {logs.map((log, i) => (
        <div key={i} className="animate-in fade-in slide-in-from-left-2 mb-1">{log}</div>
      ))}
      <div className="animate-pulse">_</div>
    </div>
  );
};

const ProfileProtocol = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ name: '', role: 'Engineer', skills: [], vibe: '' });
  const [isUploading, setIsUploading] = useState(false);

  const allSkills = data.role ? SKILL_DATABASE[data.role] : SKILL_DATABASE['Engineer'];
  
  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      setIsUploading(true);
      setTimeout(() => onComplete(data), 2000);
    }
  };

  const toggleSkill = (s) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.includes(s) ? prev.skills.filter(i => i !== s) : [...prev.skills, s]
    }));
  };

  if (isUploading) return (
    <div className="h-screen flex flex-col items-center justify-center text-white z-20 relative">
      <Brain className="w-20 h-20 text-purple-500 animate-pulse mb-6" />
      <h2 className="text-3xl font-black tracking-widest mb-3">NEURAL SYNC</h2>
      <p className="text-slate-400 text-sm mb-4">Analyzing {data.skills.length} skill vectors...</p>
      <div className="w-80 h-3 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: '100%' }} 
          transition={{ duration: 2, ease: "easeInOut" }}
          className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 z-10 relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-black/50 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl"
      >
        <div className="flex justify-between mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 flex-1 mx-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/10'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}>
              <div className="flex items-center gap-3 mb-2">
                <User className="w-8 h-8 text-purple-400" />
                <h2 className="text-4xl font-black text-white">IDENTITY</h2>
              </div>
              <p className="text-slate-400 mb-8 text-sm">Your profile powers the matching algorithm</p>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs text-purple-400 font-bold ml-1 flex items-center gap-2 mb-2">
                    <Terminal className="w-3 h-3" /> DISPLAY NAME
                  </label>
                  <input 
                    value={data.name}
                    onChange={(e) => setData({...data, name: e.target.value})}
                    placeholder="Enter your name..."
                    className="w-full bg-white/5 border border-white/20 p-4 rounded-xl text-white text-lg focus:border-purple-500 focus:bg-white/10 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-purple-400 font-bold ml-1 flex items-center gap-2 mb-3">
                    <Briefcase className="w-3 h-3" /> CAREER PATH
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.keys(SKILL_DATABASE).map(role => (
                      <button 
                        key={role}
                        onClick={() => setData({...data, role, skills: []})}
                        className={`p-4 rounded-xl border-2 text-base font-bold transition-all relative overflow-hidden group ${data.role === role ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-purple-400 text-white scale-105' : 'border-white/20 text-slate-300 hover:bg-white/5 hover:border-white/40'}`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                        <span className="relative z-10">{role}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}>
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-8 h-8 text-purple-400" />
                <h2 className="text-4xl font-black text-white">SKILLS</h2>
              </div>
              <p className="text-slate-400 mb-2 text-sm">Select your {data.role} expertise</p>
              <div className="text-xs text-purple-400 mb-6">{data.skills.length} skills selected</div>
              
              <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                <div>
                  <div className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> CORE SKILLS
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allSkills.core.map(skill => (
                      <button 
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${data.skills.includes(skill) ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 scale-105' : 'border-white/20 text-slate-400 hover:border-emerald-500/50'}`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> ADVANCED SKILLS
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allSkills.advanced.map(skill => (
                      <button 
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${data.skills.includes(skill) ? 'bg-blue-500/20 border-blue-500 text-blue-200 scale-105' : 'border-white/20 text-slate-400 hover:border-blue-500/50'}`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> EMERGING TECH
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allSkills.emerging.map(skill => (
                      <button 
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${data.skills.includes(skill) ? 'bg-purple-500/20 border-purple-500 text-purple-200 scale-105' : 'border-white/20 text-slate-400 hover:border-purple-500/50'}`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}>
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-8 h-8 text-purple-400" />
                <h2 className="text-4xl font-black text-white">PREFERENCES</h2>
              </div>
              <p className="text-slate-400 mb-8 text-sm">What's your ideal work environment?</p>
              
              <div className="space-y-4">
                {[
                  { id: 'structure', icon: Shield, label: 'STABLE & STRUCTURED', desc: 'Established companies, clear processes, predictable growth', color: 'emerald' },
                  { id: 'chaos', icon: Zap, label: 'HIGH VELOCITY', desc: 'Startups, rapid iteration, high risk/high reward', color: 'orange' },
                  { id: 'balance', icon: Activity, label: 'BALANCED APPROACH', desc: 'Scale-ups, moderate pace, best of both worlds', color: 'purple' }
                ].map((v) => (
                  <button 
                    key={v.id}
                    onClick={() => setData({...data, vibe: v.id})}
                    className={`w-full p-4 rounded-xl border text-left transition-all group relative overflow-hidden ${data.vibe === v.id ? `bg-${v.color}-500/20 border-${v.color}-500` : 'border-white/10 hover:bg-white/5'}`}
                  >
                    <div className="flex items-start gap-4 relative z-10">
                      <div className={`p-3 rounded-lg ${data.vibe === v.id ? `bg-${v.color}-500 text-white` : 'bg-white/5 text-slate-400'}`}>
                        <v.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className={`font-bold text-lg ${data.vibe === v.id ? 'text-white' : 'text-slate-300'}`}>{v.label}</div>
                        <div className="text-xs text-slate-500 font-mono mt-1 leading-relaxed">{v.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={handleNext}
          className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black py-4 rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 text-lg shadow-lg shadow-purple-900/50"
        >
          {step === 3 ? 'INITIALIZE SYSTEM' : 'NEXT SEQUENCE'} <ChevronRight className="w-5 h-5" />
        </button>

      </motion.div>
    </div>
  );
};

const SwipeCard = ({ job, analysis, onSwipe }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-20, 20]); 
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);
  const isToxic = analysis.flagStatus === 'red';

  return (
    <motion.div
      style={{ x, rotate, cursor: 'grab' }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(e, info) => {
        if (info.offset.x > 100) onSwipe('right');
        else if (info.offset.x < -100) onSwipe('left');
      }}
      className={`absolute w-full max-w-md h-[700px] rounded-[32px] backdrop-blur-xl border-[1px] overflow-hidden shadow-2xl z-10 ${isToxic ? 'border-red-500/50 shadow-red-900/50' : 'border-white/20'}`}
      whileTap={{ cursor: 'grabbing', scale: 1.02 }}
    >
      {/* DYNAMIC BACKGROUND */}
      <div className={`absolute inset-0 bg-gradient-to-br ${job.bg} opacity-100 z-0`}></div>
      
      {/* STAMPS */}
      <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 left-8 z-30 border-4 border-emerald-400 text-emerald-400 font-black text-5xl px-4 py-2 rounded-xl -rotate-12 tracking-widest bg-black/20 backdrop-blur-sm">APPLY</motion.div>
      <motion.div style={{ opacity: nopeOpacity }} className="absolute top-10 right-8 z-30 border-4 border-red-500 text-red-500 font-black text-5xl px-4 py-2 rounded-xl rotate-12 tracking-widest bg-black/20 backdrop-blur-sm">PASS</motion.div>

      {/* CARD CONTENT */}
      <div className="relative z-10 h-full flex flex-col text-white">
        
        {/* HEADER */}
        <div className="p-6 pb-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-wrap gap-2">
               <span className="px-3 py-1 bg-black/30 backdrop-blur-md rounded-full text-xs font-bold border border-white/10 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {job.location}
               </span>
               <span className="px-3 py-1 bg-black/30 backdrop-blur-md rounded-full text-xs font-bold border border-white/10 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {job.type}
               </span>
            </div>
            <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-lg border border-white/10">
               <DollarSign className="w-4 h-4 text-emerald-400" />
               <span className="font-mono font-bold text-sm">{job.salary}</span>
            </div>
          </div>
          
          <h2 className="text-3xl font-black leading-tight mb-1 drop-shadow-lg">{job.title}</h2>
          <p className="text-lg opacity-90 font-medium flex items-center gap-2">
            {job.company} 
            {job.glassdoorRating && <span className="text-xs bg-yellow-500/20 text-yellow-200 px-2 py-0.5 rounded flex items-center gap-1">★ {job.glassdoorRating}</span>}
          </p>
        </div>

        {/* HUD DASHBOARD */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
           
           {/* 1. MATCH RADAR */}
           <div className="bg-black/40 rounded-2xl p-4 border border-white/10 backdrop-blur-md flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-bold tracking-wider mb-1">MATCH SCORE</div>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  {analysis.overall}%
                </div>
              </div>
              <div className="h-24 w-32">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                      { s: 'Tech', A: analysis.skillScore, full: 100 },
                      { s: 'Cult', A: analysis.cultureScore, full: 100 },
                      { s: 'Pay', A: analysis.salaryScore, full: 100 },
                      { s: 'Vibe', A: analysis.vibeScore, full: 100 },
                    ]}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="s" tick={{fontSize: 10, fill: '#94a3b8'}} />
                      <RechartsRadar dataKey="A" stroke="#c084fc" fill="#a855f7" fillOpacity={0.6} />
                    </RadarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* 2. TOXICITY METER */}
           <div className={`rounded-2xl p-4 border ${isToxic ? 'bg-red-950/40 border-red-500/50' : 'bg-black/40 border-white/10'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-bold flex items-center gap-2 ${isToxic ? 'text-red-400' : 'text-emerald-400'}`}>
                   {isToxic ? <AlertTriangle className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                   {isToxic ? 'TOXICITY DETECTED' : 'HEALTHY ENVIRONMENT'}
                </span>
                <span className="text-xs font-mono opacity-60">{analysis.toxicityScore}/100 RISK</span>
              </div>
              <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                 <div 
                    className={`h-full transition-all duration-1000 ${isToxic ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.min(100, analysis.toxicityScore)}%` }}
                 />
              </div>
              {analysis.criticalFlags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {analysis.criticalFlags.map(flag => (
                    <span key={flag} className="text-[10px] uppercase font-bold bg-red-500/20 text-red-200 px-2 py-1 rounded border border-red-500/30">
                       ⚠ "{flag}"
                    </span>
                  ))}
                </div>
              )}
           </div>

           {/* 3. TECH STACK MATCH */}
           <div className="bg-black/40 rounded-2xl p-4 border border-white/10">
              <div className="text-xs text-slate-400 font-bold tracking-wider mb-3">TECH STACK ALIGNMENT</div>
              <div className="flex flex-wrap gap-2">
                 {job.requirements.slice(0,6).map(req => {
                   const isMatch = analysis.matchedRequired.includes(req.toLowerCase());
                   return (
                     <span key={req} className={`text-xs px-2 py-1 rounded border ${isMatch ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
                       {req}
                     </span>
                   )
                 })}
              </div>
           </div>

           {/* 4. DESCRIPTION SNIPPET */}
           <div className="bg-black/40 rounded-2xl p-4 border border-white/10 text-sm text-slate-300 leading-relaxed">
              {job.description}
           </div>
        </div>
      </div>
    </motion.div>
  );
};

// === 4. MAIN CONTROLLER ===
export default function JobTinderApp() {
  const [view, setView] = useState('intro');
  const [userProfile, setUserProfile] = useState(null);
  const [jobIndex, setJobIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [direction, setDirection] = useState(null);

  const currentJob = EXPANDED_JOB_DATABASE[jobIndex];
  const analysis = currentJob && userProfile ? analyzeMatch(userProfile, currentJob) : null;

  const getSystemLogs = () => {
    if (!analysis) return [];
    return [
       `TARGET: ${currentJob.company.toUpperCase()}`,
       `ANALYZING SALARY VECTOR... ₹${currentJob.salaryMin}-${currentJob.salaryMax}`,
       `DETECTED ${analysis.criticalFlags.length} CRITICAL FLAGS`,
       `CULTURE COMPATIBILITY: ${analysis.cultureScore}%`,
       `RENDER_COMPLETE`
    ];
  };

  const handleSwipe = (dir) => {
    setDirection(dir);
    if (dir === 'right') {
      // TOXICITY INTERCEPTOR
      if (analysis.flagStatus === 'red' && !showWarning) {
        setShowWarning(true);
        setDirection(null);
        return;
      }
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setMatches([...matches, currentJob]);
    }

    setTimeout(() => {
      setShowWarning(false);
      setDirection(null);
      if (jobIndex < EXPANDED_JOB_DATABASE.length - 1) {
        setJobIndex(prev => prev + 1);
      } else {
        setView('matches');
      }
    }, 300);
  };

  if (view === 'intro') return (
    <div className="h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      <NeuralBackground />
      <div className="z-10 text-center p-8 max-w-2xl">
        <div className="mb-8 relative inline-block animate-in fade-in zoom-in duration-1000">
           <div className="absolute inset-0 bg-purple-600 blur-3xl opacity-30 animate-pulse"></div>
           <Briefcase className="w-32 h-32 text-white relative z-10" />
           <div className="absolute -bottom-4 -right-4 bg-purple-600 text-white text-xs font-black px-3 py-1 rounded-full border border-white/20">
             BETA 2.0
           </div>
        </div>
        <h1 className="text-7xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
          JOB<span className="text-purple-500">TINDER</span>
        </h1>
        <p className="text-slate-400 text-xl mb-10 font-mono">
          The first AI that protects you from toxic workplaces.<br/>
          <span className="text-purple-400 text-sm">NOW WITH SALARY INTELLIGENCE</span>
        </p>
        <button 
          onClick={() => setView('profile')}
          className="group relative px-10 py-5 bg-transparent overflow-hidden rounded-full border border-purple-500 text-purple-400 font-bold text-lg hover:text-white transition-all"
        >
          <div className="absolute inset-0 w-0 bg-purple-600 transition-all duration-[250ms] ease-out group-hover:w-full opacity-20"></div>
          <span className="relative flex items-center gap-3">INITIALIZE PROTOCOL <ChevronRight className="w-5 h-5" /></span>
        </button>
      </div>
    </div>
  );

  if (view === 'profile') return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      <NeuralBackground />
      <ProfileProtocol onComplete={(data) => { setUserProfile(data); setView('swipe'); }} />
    </div>
  );

  if (view === 'matches') return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative p-4">
      <NeuralBackground />
      <div className="z-10 w-full max-w-2xl">
        <div className="text-center mb-10">
           <h2 className="text-5xl font-black mb-2">PROTOCOL COMPLETE</h2>
           <p className="text-slate-400">You matched with {matches.length} companies</p>
        </div>
        
        <div className="grid gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          {matches.map((m,i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all group cursor-pointer">
               <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.bg} flex items-center justify-center text-lg font-bold shadow-lg`}>
                    {m.company[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-purple-400 transition-colors">{m.title}</h3>
                    <p className="text-slate-400 text-sm">{m.company}</p>
                  </div>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-emerald-400">{m.salary}</span>
                  <span className="text-xs text-slate-500">{m.location}</span>
               </div>
            </div>
          ))}
        </div>
        
        <button onClick={() => window.location.reload()} className="w-full mt-8 py-4 border border-white/10 rounded-xl hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-slate-400 hover:text-white">
          <Activity className="w-4 h-4" /> RESTART SIMULATION
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-black overflow-hidden flex items-center justify-center relative font-sans">
      <NeuralBackground />
      <SystemLog messages={getSystemLogs()} />
      
      {/* TOXICITY WARNING MODAL */}
      <AnimatePresence>
        {showWarning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-50 bg-red-950/80 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="bg-black border border-red-500 p-8 rounded-3xl max-w-sm text-center shadow-[0_0_100px_rgba(220,38,38,0.5)] relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
               
               <Ghost className="w-24 h-24 text-red-500 mx-auto mb-6 animate-bounce" />
               
               <h2 className="text-4xl font-black text-red-500 mb-2 tracking-tighter">TOXIC ALERT</h2>
               <div className="w-full h-px bg-red-900/50 my-4"></div>
               
               <p className="text-slate-300 mb-6 font-mono text-sm leading-relaxed">
                 SYSTEM DETECTED HIGH BURNOUT RISK.<br/>
                 KEYWORDS: <span className="text-red-400 font-bold">{analysis?.criticalFlags.join(', ').toUpperCase()}</span>
               </p>
               
               <div className="flex flex-col gap-3 relative z-10">
                 <button 
                    onClick={() => setShowWarning(false)} 
                    className="w-full py-4 bg-white text-black font-black rounded-xl hover:scale-105 transition-transform shadow-xl"
                 >
                    ABORT (RECOMMENDED)
                 </button>
                 <button 
                    onClick={() => handleSwipe('right')} 
                    className="w-full py-3 bg-transparent text-red-500 border border-red-800 rounded-xl text-xs font-mono hover:bg-red-950 hover:text-red-400 transition-colors"
                 >
                    OVERRIDE SAFETY PROTOCOLS
                 </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full max-w-md h-[700px] z-10 perspective-1000 flex items-center justify-center">
        <AnimatePresence>
           <SwipeCard 
             key={currentJob.id} 
             job={currentJob} 
             analysis={analysis} 
             onSwipe={handleSwipe} 
           />
        </AnimatePresence>
      </div>
    </div>
  );
}