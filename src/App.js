import React, { useState, useEffect, useRef } from 'react';
import { Heart, X, Shield, Zap, AlertTriangle, Ghost, CheckCircle, Terminal, Cpu, ChevronRight, User, Code, Activity, Briefcase, TrendingUp, DollarSign, MapPin, Clock, Award, Target, Brain, Sparkles, Download, Share2, Database, Server, Loader, RefreshCw, Bell, Settings, LogOut } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

const style = document.createElement('style');
style.textContent = `
  .custom-scrollbar::-webkit-scrollbar { width: 8px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.5); border-radius: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.8); }
`;
document.head.appendChild(style);

// ========================================
// AI-POWERED BACKEND
// ========================================

const ClaudeAPI = {
  call: async (messages, tools = null) => {
    try {
      // NOTE: This will fail without a real API key, triggering the fallback data mechanisms
      const body = { model: "claude-sonnet-4-20250514", max_tokens: 4000, messages };
      if (tools) body.tools = tools;
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // Missing API Key intentional for fallback demo
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error("API_FAIL");
      const data = await response.json();
      return data.content.map(item => item.type === "text" ? item.text : "").join("\n");
    } catch (error) {
      console.warn('API Unavailable, switching to local simulation data.');
      return null;
    }
  }
};

const BackendAPI = {
  storage: {
    get: async (key, shared = false) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (e) { return null; }
    },
    set: async (key, value, shared = false) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) { return false; }
    },
    list: async (prefix, shared = false) => {
      try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
        return keys || [];
      } catch (e) { return []; }
    }
  },

  resume: {
    analyze: async (file) => {
      try {
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Try API, fall back to mock
        const response = await ClaudeAPI.call([{
          role: "user",
          content: "Extract resume data"
        }]);
        
        if (!response) throw new Error("Fallback");
        
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (error) {
        // FALLBACK MOCK DATA
        return {
          name: "Candidate",
          role: "Engineer",
          skills: ["React", "JavaScript", "Node.js", "AWS", "Python"],
          vibe: "balance"
        };
      }
    }
  },

  jobs: {
    fetchLive: async (userProfile) => {
      const cached = await BackendAPI.storage.get('jobs_v3', true);
      if (cached && (Date.now() - cached.timestamp < 3600000)) return cached.jobs;

      let jobsData = [];
      
      try {
        const prompt = `Search for real ${userProfile.role} jobs...`;
        const response = await ClaudeAPI.call([{ role: "user", content: prompt }]);
        
        if (!response) throw new Error("Fallback");
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        jobsData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch (error) {
        // USE HARDCODED JOBS ON FAILURE
        jobsData = HARDCODED_JOBS[userProfile.role] || HARDCODED_JOBS['Engineer'];
      }

      const enhancedJobs = jobsData.map((job, i) => ({
        ...job,
        id: `live_${Date.now()}_${i}`,
        postedDate: new Date().toISOString(),
        preferredSkills: job.preferredSkills || [],
        usesATS: job.companySize !== "1-10",
        bg: ['from-purple-900/80 to-pink-900/80','from-blue-900/80 to-cyan-900/80','from-orange-900/80 to-red-900/80','from-green-900/80 to-emerald-900/80','from-violet-900/80 to-purple-900/80'][i%5]
      }));
      
      await BackendAPI.storage.set('jobs_v3', { jobs: enhancedJobs, timestamp: Date.now() }, true);
      return enhancedJobs;
    }
  },

  ai: {
    generateCoverLetter: async (job, userProfile, analysis) => {
      return await ClaudeAPI.call([{ role: "user", content: "Write cover letter" }]) || 
        `Dear Hiring Manager at ${job.company},\n\nI am writing to express my interest in the ${job.title} position. With my background in ${userProfile.role} and skills in ${userProfile.skills.slice(0,3).join(", ")}, I believe I am a strong candidate.\n\nI am particularly excited about ${job.company}'s mission and would love to bring my expertise to your team.`;
    },
    generateInterviewQuestions: async (job) => {
      return await ClaudeAPI.call([{ role: "user", content: "Interview prep" }]) ||
        "1. Tell me about yourself.\n2. Describe a challenging project you worked on.\n3. How do you handle tight deadlines?\n4. Technical question about your core stack.\n5. Do you have any questions for us?";
    },
    getSalaryInsights: async (job, userProfile) => {
      return await ClaudeAPI.call([{ role: "user", content: "Salary analysis" }]) ||
        `The offered salary of ${job.salary} is competitive for the ${job.location} market. Based on your skills, you are in a strong position to negotiate.`;
    },
    analyzeCompany: async (company) => {
      return await ClaudeAPI.call([{ role: "user", content: "Company analysis" }]) ||
        `- Strong market presence\n- Recent funding rounds secured\n- Positive employee sentiment on Glassdoor\n- focus on innovation`;
    }
  },

  analytics: {
    saveSwipe: async (userId, jobId, direction, matchScore) => {
      await BackendAPI.storage.set(`swipe_${userId}_${jobId}`, { userId, jobId, direction, matchScore, timestamp: Date.now() });
    },
    saveMatch: async (userId, job, analysis, userProfile) => {
      const key = `match_${userId}_${Date.now()}`;
      await BackendAPI.storage.set(key, { job, analysis, userProfile, timestamp: Date.now() });
      return key;
    },
    updateMatch: async (key, updates) => {
      const match = await BackendAPI.storage.get(key);
      if (match) await BackendAPI.storage.set(key, { ...match, ...updates });
    },
    getMatches: async (userId) => {
      const keys = await BackendAPI.storage.list(`match_${userId}_`);
      const matches = [];
      for (const key of keys) {
        const data = await BackendAPI.storage.get(key);
        if (data) matches.push({ ...data, key });
      }
      return matches.sort((a, b) => b.timestamp - a.timestamp);
    },
    getStats: async (userId) => {
      const keys = await BackendAPI.storage.list(`swipe_${userId}_`);
      let likes = 0, passes = 0;
      for (const key of keys) {
        const data = await BackendAPI.storage.get(key);
        if (data) { if (data.direction === 'right') likes++; else passes++; }
      }
      return { likes, passes, total: likes + passes };
    }
  }
};

// ========================================
// DATA & ANALYSIS
// ========================================

const SKILL_DATABASE = {
  'Engineer': { core: ['React','Node.js','Python','TypeScript','SQL'], advanced: ['AWS','Docker','Kubernetes','GraphQL'], emerging: ['Rust','Go','AI/ML'] },
  'Designer': { core: ['Figma','UI/UX','Adobe XD'], advanced: ['Motion Design','Design Systems'], emerging: ['3D Design','AR/VR'] },
  'Manager': { core: ['Agile','Scrum','Leadership'], advanced: ['OKRs','Strategy'], emerging: ['AI Tools','Remote Management'] },
  'Founder': { core: ['Product Vision','MVP','Pitching'], advanced: ['Fundraising','Growth Hacking'], emerging: ['Web3','AI Integration'] }
};

const HARDCODED_JOBS = {
  'Engineer': [
    {
      id: 'eng_1',
      title: 'Senior Full Stack Engineer',
      company: 'Razorpay',
      location: 'Bangalore, India',
      salary: '₹25-35 LPA',
      salaryMin: 2500000,
      salaryMax: 3500000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['React', 'Node.js', 'TypeScript', 'AWS', 'MongoDB'],
      description: 'Join our payments platform team to build scalable fintech solutions. Work on high-impact projects with modern tech stack. Great work-life balance and learning opportunities.',
      companySize: '500-5000',
      source: 'Direct',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Docker', 'Kubernetes'],
      usesATS: true,
      bg: 'from-purple-900/80 to-pink-900/80'
    },
    {
      id: 'eng_2',
      title: 'Frontend Developer',
      company: 'Swiggy',
      location: 'Bangalore, India',
      salary: '₹18-28 LPA',
      salaryMin: 1800000,
      salaryMax: 2800000,
      type: 'Full-time',
      remote: 'Office',
      requirements: ['React', 'JavaScript', 'CSS', 'Redux'],
      description: 'Build delightful user experiences for millions of users. Fast-paced environment with rockstar developers. We need someone who can hit the ground running and wear many hats.',
      companySize: '5000+',
      source: 'LinkedIn',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Next.js', 'TypeScript'],
      usesATS: true,
      bg: 'from-orange-900/80 to-red-900/80'
    },
    {
      id: 'eng_3',
      title: 'Backend Engineer',
      company: 'CRED',
      location: 'Bangalore, India',
      salary: '₹30-45 LPA',
      salaryMin: 3000000,
      salaryMax: 4500000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Python', 'Django', 'PostgreSQL', 'Redis', 'AWS'],
      description: 'Design and build APIs for our credit card rewards platform. Structured environment with mentorship programs and clear career growth paths. Work with cutting-edge technology.',
      companySize: '500-5000',
      source: 'AngelList',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Microservices', 'Kafka'],
      usesATS: true,
      bg: 'from-blue-900/80 to-cyan-900/80'
    },
    {
      id: 'eng_4',
      title: 'DevOps Engineer',
      company: 'Zerodha',
      location: 'Bangalore, India',
      salary: '₹22-32 LPA',
      salaryMin: 2200000,
      salaryMax: 3200000,
      type: 'Full-time',
      remote: 'Remote',
      requirements: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Python'],
      description: 'Manage infrastructure for India\'s largest stock broker. Excellent work-life balance, no pressure sales, structured processes with clear documentation.',
      companySize: '500-5000',
      source: 'Direct',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Ansible', 'Jenkins'],
      usesATS: false,
      bg: 'from-green-900/80 to-emerald-900/80'
    },
    {
      id: 'eng_5',
      title: 'AI/ML Engineer',
      company: 'Ola',
      location: 'Bangalore, India',
      salary: '₹28-40 LPA',
      salaryMin: 2800000,
      salaryMax: 4000000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Python', 'TensorFlow', 'PyTorch', 'SQL', 'AWS'],
      description: 'Build ML models for ride prediction and pricing. Urgent requirement, need passionate individuals who love to hustle. Competitive salary based on skills.',
      companySize: '5000+',
      source: 'Naukri',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Deep Learning', 'Computer Vision'],
      usesATS: true,
      bg: 'from-violet-900/80 to-purple-900/80'
    },
    {
      id: 'eng_6',
      title: 'Full Stack Developer',
      company: 'Freshworks',
      location: 'Chennai, India',
      salary: '₹20-30 LPA',
      salaryMin: 2000000,
      salaryMax: 3000000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
      description: 'Work on SaaS products used by Fortune 500 companies. Great benefits package including health insurance and stock options. Structured onboarding and mentorship.',
      companySize: '5000+',
      source: 'Direct',
      postedDate: new Date().toISOString(),
      preferredSkills: ['GraphQL', 'Redis'],
      usesATS: true,
      bg: 'from-purple-900/80 to-pink-900/80'
    },
    {
      id: 'eng_7',
      title: 'Mobile Developer (React Native)',
      company: 'PhonePe',
      location: 'Bangalore, India',
      salary: '₹25-38 LPA',
      salaryMin: 2500000,
      salaryMax: 3800000,
      type: 'Full-time',
      remote: 'Office',
      requirements: ['React Native', 'JavaScript', 'TypeScript', 'iOS', 'Android'],
      description: 'Build mobile experiences for 400M+ users. We are like a family here. Looking for ninjas who can handle ASAP requirements in this fast-paced startup environment.',
      companySize: '5000+',
      source: 'LinkedIn',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Redux', 'Native modules'],
      usesATS: true,
      bg: 'from-blue-900/80 to-cyan-900/80'
    },
    {
      id: 'eng_8',
      title: 'Blockchain Developer',
      company: 'Polygon',
      location: 'Remote, India',
      salary: '₹35-50 LPA',
      salaryMin: 3500000,
      salaryMax: 5000000,
      type: 'Full-time',
      remote: 'Remote',
      requirements: ['Solidity', 'Web3', 'JavaScript', 'Ethereum'],
      description: 'Build the future of Web3 infrastructure. Remote-first culture with flexible hours. Focus on innovation and cutting-edge blockchain technology.',
      companySize: '50-500',
      source: 'AngelList',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Smart Contracts', 'Rust'],
      usesATS: false,
      bg: 'from-orange-900/80 to-red-900/80'
    },
    {
      id: 'eng_9',
      title: 'Data Engineer',
      company: 'Flipkart',
      location: 'Bangalore, India',
      salary: '₹24-36 LPA',
      salaryMin: 2400000,
      salaryMax: 3600000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Python', 'Spark', 'Hadoop', 'SQL', 'AWS'],
      description: 'Build data pipelines for e-commerce analytics. Structured team with clear processes and growth opportunities. Benefits include health insurance and learning budget.',
      companySize: '5000+',
      source: 'Direct',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Airflow', 'Kafka'],
      usesATS: true,
      bg: 'from-green-900/80 to-emerald-900/80'
    },
    {
      id: 'eng_10',
      title: 'Founding Engineer',
      company: 'Early Stage Startup',
      location: 'Bangalore, India',
      salary: '₹15-25 LPA + Equity',
      salaryMin: 1500000,
      salaryMax: 2500000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['React', 'Node.js', 'AWS', 'MongoDB'],
      description: 'Join as first engineer and shape the product. Equity upside, direct impact on company direction. Need guru-level skills and passion to hustle. Wear many hats and build from scratch.',
      companySize: '1-10',
      source: 'AngelList',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Startup experience', 'Full ownership'],
      usesATS: false,
      bg: 'from-violet-900/80 to-purple-900/80'
    }
  ],
  'Designer': [
    {
      id: 'des_1',
      title: 'Senior Product Designer',
      company: 'Razorpay',
      location: 'Bangalore, India',
      salary: '₹20-30 LPA',
      salaryMin: 2000000,
      salaryMax: 3000000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Figma', 'UI/UX', 'Design Systems', 'Prototyping'],
      description: 'Design intuitive payment experiences for millions of merchants. Collaborative environment with structured design processes and mentorship opportunities.',
      companySize: '500-5000',
      source: 'Direct',
      postedDate: new Date().toISOString(),
      preferredSkills: ['User Research', 'Illustration'],
      usesATS: true,
      bg: 'from-purple-900/80 to-pink-900/80'
    },
    {
      id: 'des_2',
      title: 'UI/UX Designer',
      company: 'CRED',
      location: 'Bangalore, India',
      salary: '₹18-28 LPA',
      salaryMin: 1800000,
      salaryMax: 2800000,
      type: 'Full-time',
      remote: 'Office',
      requirements: ['Figma', 'UI/UX', 'Adobe XD', 'Prototyping'],
      description: 'Create stunning designs for premium credit card users. Fast-paced environment where you need to be a design rockstar. Urgent hiring for passionate designers.',
      companySize: '500-5000',
      source: 'LinkedIn',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Motion Design', 'After Effects'],
      usesATS: true,
      bg: 'from-blue-900/80 to-cyan-900/80'
    },
    {
      id: 'des_3',
      title: 'Product Designer',
      company: 'Swiggy',
      location: 'Bangalore, India',
      salary: '₹22-32 LPA',
      salaryMin: 2200000,
      salaryMax: 3200000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Figma', 'UI/UX', 'User Research', 'Design Systems'],
      description: 'Design food ordering experiences for millions. Great work-life balance with structured design sprints and regular user testing sessions.',
      companySize: '5000+',
      source: 'Direct',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Illustration', 'Animation'],
      usesATS: true,
      bg: 'from-orange-900/80 to-red-900/80'
    },
    {
      id: 'des_4',
      title: 'Visual Designer',
      company: 'Meesho',
      location: 'Bangalore, India',
      salary: '₹15-22 LPA',
      salaryMin: 1500000,
      salaryMax: 2200000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Adobe Creative Suite', 'Figma', 'Branding', 'Illustration'],
      description: 'Create visual identity for India\'s largest reselling platform. We\'re like a family here. Need ninja designers who can wear many hats and hit the ground running.',
      companySize: '500-5000',
      source: 'Naukri',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Typography', 'Marketing Design'],
      usesATS: true,
      bg: 'from-green-900/80 to-emerald-900/80'
    },
    {
      id: 'des_5',
      title: 'UX Researcher',
      company: 'Flipkart',
      location: 'Bangalore, India',
      salary: '₹18-26 LPA',
      salaryMin: 1800000,
      salaryMax: 2600000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['User Research', 'Usability Testing', 'Data Analysis', 'Figma'],
      description: 'Conduct research to improve e-commerce experiences. Structured research processes with dedicated budgets for user studies. Benefits include learning allowance.',
      companySize: '5000+',
      source: 'Direct',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Qualitative Research', 'Surveys'],
      usesATS: true,
      bg: 'from-violet-900/80 to-purple-900/80'
    },
    {
      id: 'des_6',
      title: 'Motion Designer',
      company: 'Lenskart',
      location: 'Delhi, India',
      salary: '₹16-24 LPA',
      salaryMin: 1600000,
      salaryMax: 2400000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['After Effects', 'Motion Design', 'Animation', 'Figma'],
      description: 'Create engaging animations for marketing campaigns. Creative freedom with supportive team. Work-life balance with flexible hours.',
      companySize: '5000+',
      source: 'LinkedIn',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Cinema 4D', '3D Animation'],
      usesATS: true,
      bg: 'from-purple-900/80 to-pink-900/80'
    },
    {
      id: 'des_7',
      title: 'Design System Lead',
      company: 'Paytm',
      location: 'Noida, India',
      salary: '₹25-35 LPA',
      salaryMin: 2500000,
      salaryMax: 3500000,
      type: 'Full-time',
      remote: 'Office',
      requirements: ['Design Systems', 'Figma', 'UI/UX', 'Component Libraries'],
      description: 'Build and maintain design system for 350M+ users. ASAP requirement for competitive salary. Fast-paced fintech environment.',
      companySize: '5000+',
      source: 'Naukri',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Tokens', 'Documentation'],
      usesATS: true,
      bg: 'from-blue-900/80 to-cyan-900/80'
    },
    {
      id: 'des_8',
      title: 'Founding Designer',
      company: 'Health-tech Startup',
      location: 'Bangalore, India',
      salary: '₹12-20 LPA + Equity',
      salaryMin: 1200000,
      salaryMax: 2000000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Figma', 'UI/UX', 'Branding', 'User Research'],
      description: 'Shape the design vision from day one. Equity upside with direct impact. Need passionate designer who can hustle and wear multiple hats in chaotic startup environment.',
      companySize: '1-10',
      source: 'AngelList',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Full ownership', 'Startup experience'],
      usesATS: false,
      bg: 'from-orange-900/80 to-red-900/80'
    },
    {
      id: 'des_9',
      title: 'Brand Designer',
      company: 'Nykaa',
      location: 'Mumbai, India',
      salary: '₹14-22 LPA',
      salaryMin: 1400000,
      salaryMax: 2200000,
      type: 'Full-time',
      remote: 'Office',
      requirements: ['Branding', 'Adobe Creative Suite', 'Typography', 'Figma'],
      description: 'Design brand campaigns for India\'s leading beauty platform. Structured creative processes with regular client presentations and growth opportunities.',
      companySize: '5000+',
      source: 'Direct',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Packaging Design', 'Print Design'],
      usesATS: true,
      bg: 'from-green-900/80 to-emerald-900/80'
    },
    {
      id: 'des_10',
      title: 'AR/VR Designer',
      company: 'Byju\'s',
      location: 'Bangalore, India',
      salary: '₹20-30 LPA',
      salaryMin: 2000000,
      salaryMax: 3000000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['3D Design', 'Unity', 'Blender', 'UI/UX'],
      description: 'Design immersive learning experiences using AR/VR. Cutting-edge technology with structured learning budget. Benefits include health insurance and education support.',
      companySize: '5000+',
      source: 'LinkedIn',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Game Design', 'Animation'],
      usesATS: true,
      bg: 'from-violet-900/80 to-purple-900/80'
    }
  ],
  'Manager': [
    {
      id: 'mgr_1',
      title: 'Engineering Manager',
      company: 'Razorpay',
      location: 'Bangalore, India',
      salary: '₹35-50 LPA',
      salaryMin: 3500000,
      salaryMax: 5000000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Agile', 'Scrum', 'Leadership', 'People Management', 'Technical Background'],
      description: 'Lead a team of 8-10 engineers building payment solutions. Structured management processes with clear OKRs. Mentorship programs and leadership development opportunities.',
      companySize: '500-5000',
      source: 'Direct',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Stakeholder Management', 'Technical Strategy'],
      usesATS: true,
      bg: 'from-purple-900/80 to-pink-900/80'
    },
    {
      id: 'mgr_2',
      title: 'Product Manager',
      company: 'CRED',
      location: 'Bangalore, India',
      salary: '₹30-45 LPA',
      salaryMin: 3000000,
      salaryMax: 4500000,
      type: 'Full-time',
      remote: 'Office',
      requirements: ['Product Strategy', 'Roadmap Planning', 'Analytics', 'User Research'],
      description: 'Drive product vision for credit rewards platform. Fast-paced environment needing rockstar PMs. Urgent requirement, competitive salary, must hit the ground running.',
      companySize: '500-5000',
      source: 'LinkedIn',
      postedDate: new Date().toISOString(),
      preferredSkills: ['A/B Testing', 'SQL'],
      usesATS: true,
      bg: 'from-blue-900/80 to-cyan-900/80'
    },
    {
      id: 'mgr_3',
      title: 'Scrum Master',
      company: 'Flipkart',
      location: 'Bangalore, India',
      salary: '₹18-28 LPA',
      salaryMin: 1800000,
      salaryMax: 2800000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Scrum', 'Agile', 'Facilitation', 'Team Coaching'],
      description: 'Facilitate agile ceremonies for multiple teams. Structured processes with certified training programs. Work-life balance with growth into leadership roles.',
      companySize: '5000+',
      source: 'Direct',
      postedDate: new Date().toISOString(),
      preferredSkills: ['CSM Certified', 'Jira'],
      usesATS: true,
      bg: 'from-orange-900/80 to-red-900/80'
    },
    {
      id: 'mgr_4',
      title: 'Technical Program Manager',
      company: 'Amazon India',
      location: 'Bangalore, India',
      salary: '₹40-60 LPA',
      salaryMin: 4000000,
      salaryMax: 6000000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Program Management', 'Technical Background', 'Stakeholder Management', 'Agile'],
      description: 'Manage cross-functional technical programs at scale. Structured environment with clear career progression. Benefits include stock options and comprehensive health coverage.',
      companySize: '5000+',
      source: 'Direct',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Cloud Technologies', 'Risk Management'],
      usesATS: true,
      bg: 'from-green-900/80 to-emerald-900/80'
    },
    {
      id: 'mgr_5',
      title: 'Delivery Manager',
      company: 'Swiggy',
      location: 'Bangalore, India',
      salary: '₹25-35 LPA',
      salaryMin: 2500000,
      salaryMax: 3500000,
      type: 'Full-time',
      remote: 'Office',
      requirements: ['Delivery Management', 'Agile', 'Client Management', 'Team Leadership'],
      description: 'Manage delivery timelines for consumer-facing features. We\'re like a family. Need passionate leaders who can wear many hats in this fast-paced environment.',
      companySize: '5000+',
      source: 'Naukri',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Risk Mitigation', 'Reporting'],
      usesATS: true,
      bg: 'from-violet-900/80 to-purple-900/80'
    },
    {
      id: 'mgr_6',
      title: 'Operations Manager',
      company: 'Zerodha',
      location: 'Bangalore, India',
      salary: '₹22-32 LPA',
      salaryMin: 2200000,
      salaryMax: 3200000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Operations', 'Process Optimization', 'Team Management', 'Analytics'],
      description: 'Optimize operations for stockbroking platform. Excellent work-life balance with structured processes. No sales pressure, focus on efficiency and team development.',
      companySize: '500-5000',
      source: 'Direct',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Six Sigma', 'Lean Management'],
      usesATS: false,
      bg: 'from-purple-900/80 to-pink-900/80'
    },
    {
      id: 'mgr_7',
      title: 'Growth Manager',
      company: 'Meesho',
      location: 'Bangalore, India',
      salary: '₹28-40 LPA',
      salaryMin: 2800000,
      salaryMax: 4000000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Growth Strategy', 'Analytics', 'A/B Testing', 'Product Marketing'],
      description: 'Drive user acquisition and retention strategies. ASAP hiring for competitive salary. Hustle required in this high-growth startup.',
      companySize: '500-5000',
      source: 'LinkedIn',
      postedDate: new Date().toISOString(),
      preferredSkills: ['SEO', 'Performance Marketing'],
      usesATS: true,
      bg: 'from-blue-900/80 to-cyan-900/80'
    },
    {
      id: 'mgr_8',
      title: 'VP Engineering',
      company: 'Freshworks',
      location: 'Chennai, India',
      salary: '₹60-90 LPA',
      salaryMin: 6000000,
      salaryMax: 9000000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Engineering Leadership', 'Strategy', 'Team Building', 'Technical Vision'],
      description: 'Lead engineering org of 100+ engineers. Structured leadership with clear strategy and OKRs. Stock options and comprehensive benefits package.',
      companySize: '5000+',
      source: 'Direct',
      postedDate: new Date().toISOString(),
      preferredSkills: ['SaaS Experience', 'Scaling Teams'],
      usesATS: true,
      bg: 'from-orange-900/80 to-red-900/80'
    },
    {
      id: 'mgr_9',
      title: 'Head of Product',
      company: 'Early Stage Fintech',
      location: 'Mumbai, India',
      salary: '₹50-80 LPA + Equity',
      salaryMin: 5000000,
      salaryMax: 8000000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Product Strategy', 'Team Leadership', 'Vision Setting', 'Fintech Experience'],
      description: 'Build product org from scratch. Equity upside with founding team. Need guru-level product leader who loves chaos and can wear all hats.',
      companySize: '10-50',
      source: 'AngelList',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Fundraising', 'Zero to One'],
      usesATS: false,
      bg: 'from-green-900/80 to-emerald-900/80'
    },
    {
      id: 'mgr_10',
      title: 'Project Manager',
      company: 'Tata Consultancy Services',
      location: 'Pune, India',
      salary: '₹15-25 LPA',
      salaryMin: 1500000,
      salaryMax: 2500000,
      type: 'Full-time',
      remote: 'Office',
      requirements: ['Project Management', 'PMP', 'Stakeholder Management', 'Waterfall/Agile'],
      description: 'Manage enterprise client projects with global teams. Structured environment with extensive training programs. Clear career progression and work-life balance.',
      companySize: '5000+',
      source: 'Naukri',
      postedDate: new Date().toISOString(),
      preferredSkills: ['MS Project', 'Client Facing'],
      usesATS: true,
      bg: 'from-violet-900/80 to-purple-900/80'
    }
  ],
  'Founder': [
    {
      id: 'fnd_1',
      title: 'Co-Founder / CTO',
      company: 'AI Startup (Stealth)',
      location: 'Bangalore, India',
      salary: '₹10-20 LPA + 10-15% Equity',
      salaryMin: 1000000,
      salaryMax: 2000000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Technical Leadership', 'Product Vision', 'Team Building', 'AI/ML'],
      description: 'Join as technical co-founder for AI-powered SaaS platform. Equity heavy compensation with long-term upside. Need passionate builder who embraces chaos.',
      companySize: '1-10',
      source: 'AngelList',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Fundraising', 'Zero to One'],
      usesATS: false,
      bg: 'from-purple-900/80 to-pink-900/80'
    },
    {
      id: 'fnd_2',
      title: 'Co-Founder / CPO',
      company: 'D2C Fashion Startup',
      location: 'Mumbai, India',
      salary: '₹12-18 LPA + 8-12% Equity',
      salaryMin: 1200000,
      salaryMax: 1800000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Product Vision', 'MVP', 'User Research', 'Growth Strategy'],
      description: 'Build India\'s next big fashion brand from scratch. Backed by top VCs, looking for product guru who can hustle and wear all hats. Zero to one experience required.',
      companySize: '1-10',
      source: 'AngelList',
      postedDate: new Date().toISOString(),
      preferredSkills: ['D2C Experience', 'Branding'],
      usesATS: false,
      bg: 'from-blue-900/80 to-cyan-900/80'
    },
    {
      id: 'fnd_3',
      title: 'Founding Engineer',
      company: 'Fintech Startup (YC Backed)',
      location: 'Bangalore, India',
      salary: '₹15-25 LPA + 2-5% Equity',
      salaryMin: 1500000,
      salaryMax: 2500000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Full Stack', 'Product Vision', 'Startup Experience', 'AWS'],
      description: 'First engineer hire at YC-backed fintech. Build everything from scratch, shape tech culture. Fast-paced, equity upside, direct impact. Need rockstar who loves chaos.',
      companySize: '1-10',
      source: 'YCombinator',
      postedDate: new Date().toISOString(),
      preferredSkills: ['React', 'Node.js', 'Fintech'],
      usesATS: false,
      bg: 'from-orange-900/80 to-red-900/80'
    },
    {
      id: 'fnd_4',
      title: 'Co-Founder / Growth Lead',
      company: 'EdTech Startup',
      location: 'Bangalore, India',
      salary: '₹8-15 LPA + 10-15% Equity',
      salaryMin: 800000,
      salaryMax: 1500000,
      type: 'Full-time',
      remote: 'Remote',
      requirements: ['Growth Hacking', 'Marketing', 'Analytics', 'Fundraising'],
      description: 'Join founding team to scale online learning platform. Wear many hats: marketing, sales, ops. Equity heavy, long-term upside. Pre-seed funded, need hustle mentality.',
      companySize: '1-10',
      source: 'AngelList',
      postedDate: new Date().toISOString(),
      preferredSkills: ['SEO', 'Content Marketing'],
      usesATS: false,
      bg: 'from-green-900/80 to-emerald-900/80'
    },
    {
      id: 'fnd_5',
      title: 'Founding Designer',
      company: 'SaaS Startup (Pre-seed)',
      location: 'Remote, India',
      salary: '₹10-18 LPA + 3-6% Equity',
      salaryMin: 1000000,
      salaryMax: 1800000,
      type: 'Full-time',
      remote: 'Remote',
      requirements: ['Product Vision', 'UI/UX', 'Branding', 'Figma'],
      description: 'Shape entire design vision from day one. Build design system, brand identity, product UX. Chaotic startup environment, passionate team. Need design ninja with full ownership mindset.',
      companySize: '1-10',
      source: 'AngelList',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Design Systems', 'Illustration'],
      usesATS: false,
      bg: 'from-violet-900/80 to-purple-900/80'
    },
    {
      id: 'fnd_6',
      title: 'Co-Founder / CMO',
      company: 'HealthTech Startup',
      location: 'Delhi, India',
      salary: '₹12-20 LPA + 8-10% Equity',
      salaryMin: 1200000,
      salaryMax: 2000000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Marketing Strategy', 'Brand Building', 'Growth', 'Fundraising'],
      description: 'Build marketing engine for telemedicine platform. Angel funded, hitting product-market fit. Need guru-level marketer who can scale from 0 to millions. Fast-paced, ASAP requirement.',
      companySize: '10-50',
      source: 'Direct',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Digital Marketing', 'PR'],
      usesATS: false,
      bg: 'from-purple-900/80 to-pink-900/80'
    },
    {
      id: 'fnd_7',
      title: 'Founding Data Scientist',
      company: 'AI Startup (Seed Funded)',
      location: 'Bangalore, India',
      salary: '₹18-28 LPA + 1-3% Equity',
      salaryMin: 1800000,
      salaryMax: 2800000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['AI/ML', 'Python', 'Product Vision', 'Research'],
      description: 'Build ML infrastructure from scratch. Seed funded by top VCs, working on cutting-edge AI. Wear many hats, shape tech direction. Need passionate ML ninja with startup hustle.',
      companySize: '1-10',
      source: 'AngelList',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Deep Learning', 'MLOps'],
      usesATS: false,
      bg: 'from-blue-900/80 to-cyan-900/80'
    },
    {
      id: 'fnd_8',
      title: 'Co-Founder / COO',
      company: 'Logistics Startup',
      location: 'Bangalore, India',
      salary: '₹15-25 LPA + 5-10% Equity',
      salaryMin: 1500000,
      salaryMax: 2500000,
      type: 'Full-time',
      remote: 'Office',
      requirements: ['Operations', 'Strategy', 'Team Building', 'Fundraising'],
      description: 'Join founding team to revolutionize last-mile delivery. Series A funded, scaling fast. Need operations rockstar who thrives in chaos and can hit the ground running. Competitive equity.',
      companySize: '10-50',
      source: 'AngelList',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Logistics', 'Supply Chain'],
      usesATS: false,
      bg: 'from-orange-900/80 to-red-900/80'
    },
    {
      id: 'fnd_9',
      title: 'Founding Product Manager',
      company: 'Web3 Startup',
      location: 'Remote, India',
      salary: '₹20-30 LPA + 2-5% Equity',
      salaryMin: 2000000,
      salaryMax: 3000000,
      type: 'Full-time',
      remote: 'Remote',
      requirements: ['Product Vision', 'Web3', 'Crypto', 'MVP'],
      description: 'Build Web3 infrastructure products. Crypto-native team, VC backed. Remote-first, global impact. Need passionate PM who embraces chaos and understands blockchain deeply. Equity upside huge.',
      companySize: '1-10',
      source: 'Crypto Jobs',
      postedDate: new Date().toISOString(),
      preferredSkills: ['DeFi', 'Smart Contracts'],
      usesATS: false,
      bg: 'from-green-900/80 to-emerald-900/80'
    },
    {
      id: 'fnd_10',
      title: 'Co-Founder / Head of Sales',
      company: 'B2B SaaS Startup',
      location: 'Mumbai, India',
      salary: '₹10-20 LPA + 8-12% Equity',
      salaryMin: 1000000,
      salaryMax: 2000000,
      type: 'Full-time',
      remote: 'Hybrid',
      requirements: ['Sales Strategy', 'Pitching', 'B2B', 'Fundraising'],
      description: 'Build sales machine for enterprise SaaS. Pre-seed funded, first customers onboarded. Need sales guru who can close deals and wear all hats. Family-like team, hustle required, ASAP hiring.',
      companySize: '1-10',
      source: 'AngelList',
      postedDate: new Date().toISOString(),
      preferredSkills: ['Enterprise Sales', 'Cold Outreach'],
      usesATS: false,
      bg: 'from-violet-900/80 to-purple-900/80'
    }
  ]
};

const RED_FLAG_DATABASE = {
  critical: ['rockstar','ninja','guru','family','wear many hats','fast-paced','hit the ground running'],
  warning: ['urgent','asap','competitive salary','passion','hustle'],
  positive: ['structured','work-life','mentorship','growth','benefits']
};

const analyzeMatch = (userProfile, job) => {
  const userSkills = (userProfile.skills || []).map(s => s.toLowerCase());
  const requiredSkills = job.requirements.map(r => r.toLowerCase());
  const matchedRequired = requiredSkills.filter(req => userSkills.some(us => us.includes(req) || req.includes(us)));
  const skillScore = Math.round((matchedRequired.length / (requiredSkills.length || 1)) * 100);
  
  const desc = job.description.toLowerCase();
  const criticalFlags = RED_FLAG_DATABASE.critical.filter(w => desc.includes(w));
  const warningFlags = RED_FLAG_DATABASE.warning.filter(w => desc.includes(w));
  const positiveFlags = RED_FLAG_DATABASE.positive.filter(w => desc.includes(w));
  const toxicityScore = (criticalFlags.length * 30) + (warningFlags.length * 10) - (positiveFlags.length * 5);
  
  let flagStatus = 'green';
  if (toxicityScore >= 50 || criticalFlags.length >= 2) flagStatus = 'red';
  else if (toxicityScore >= 20) flagStatus = 'orange';
  
  let cultureScore = flagStatus === 'red' ? 25 : flagStatus === 'orange' ? 50 : 85;
  const atsScore = job.usesATS ? 75 : 95;
  const salaryScore = Math.min(100, ((job.salaryMin + job.salaryMax) / 2 / 5000000) * 100);
  let vibeScore = 70;
  if (userProfile.vibe === 'structure') vibeScore = job.companySize === '5000+' ? 95 : 30;
  else if (userProfile.vibe === 'chaos') vibeScore = job.companySize === '1-10' ? 95 : 40;
  
  const overall = (skillScore * 0.35) + (cultureScore * 0.25) + (vibeScore * 0.20) + (atsScore * 0.10) + (salaryScore * 0.10);
  
  return { overall: Math.round(overall), skillScore, atsScore, cultureScore, salaryScore, vibeScore, flagStatus, criticalFlags, warningFlags, positiveFlags, matchedRequired, matchedPreferred: [], toxicityScore };
};

// ========================================
// UI COMPONENTS
// ========================================

const NeuralBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    resize();
    const particles = Array.from({ length: 50 }, () => ({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.5)*0.4 }));
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#8b5cf6';
      particles.forEach((p,i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
        particles.forEach((p2,j) => {
          if (i === j) return;
          const dx = p.x - p2.x, dy = p.y - p2.y, dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 150) { ctx.beginPath(); ctx.strokeStyle = `rgba(139,92,246,${0.2-dist/1500})`; ctx.lineWidth = 0.5; ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); }
        });
      });
      requestAnimationFrame(animate);
    };
    animate();
    return () => window.removeEventListener('resize', resize);
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 z-0 opacity-30 pointer-events-none" />;
};

const LoadingScreen = ({ message = "LOADING..." }) => (
  <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
    <Loader className="w-16 h-16 text-purple-500 animate-spin mb-6" />
    <p className="text-xl font-bold tracking-wider">{message}</p>
  </div>
);

const Building2 = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
  </svg>
);

const MatchDetailModal = ({ match, onClose, userId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [aiContent, setAiContent] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  const generateContent = async (type) => {
    if (aiContent[type] || isGenerating) return;
    setIsGenerating(true);
    let content = '';
    try {
      if (type === 'cover') content = await BackendAPI.ai.generateCoverLetter(match.job, match.userProfile || {}, match.analysis);
      else if (type === 'interview') content = await BackendAPI.ai.generateInterviewQuestions(match.job);
      else if (type === 'salary') content = await BackendAPI.ai.getSalaryInsights(match.job, match.userProfile || {});
      else if (type === 'company') content = await BackendAPI.ai.analyzeCompany(match.job.company);
      setAiContent(prev => ({ ...prev, [type]: content }));
      await BackendAPI.analytics.updateMatch(match.key, { [type + 'Letter']: content });
    } catch (error) {
      setAiContent(prev => ({ ...prev, [type]: 'Failed to generate. Try again.' }));
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (match.coverLetter) setAiContent(prev => ({ ...prev, cover: match.coverLetter }));
    if (match.interviewPrep) setAiContent(prev => ({ ...prev, interview: match.interviewPrep }));
    if (match.salaryInsights) setAiContent(prev => ({ ...prev, salary: match.salaryInsights }));
    if (match.companyIntel) setAiContent(prev => ({ ...prev, company: match.companyIntel }));
  }, [match]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-gradient-to-br from-slate-900 to-black border border-white/20 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className={`bg-gradient-to-br ${match.job.bg} p-6 border-b border-white/10`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-black text-white mb-2">{match.job.title}</h2>
              <p className="text-lg text-white/90 font-medium">{match.job.company}</p>
              <div className="flex gap-3 mt-3">
                <span className="text-xs bg-black/30 px-3 py-1 rounded-full border border-white/20 text-white">{match.job.location}</span>
                <span className="text-xs bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/50 text-emerald-200 font-bold">{match.analysis.overall}% Match</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X className="w-6 h-6 text-white" /></button>
          </div>
        </div>

        <div className="flex border-b border-white/10">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'cover', label: 'Cover Letter', icon: Code },
            { id: 'interview', label: 'Interview Prep', icon: Target },
            { id: 'salary', label: 'Salary Intel', icon: DollarSign },
            { id: 'company', label: 'Company', icon: Building2 }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-4 px-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === tab.id ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
              <tab.icon className="w-4 h-4" /><span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-xs text-slate-400 mb-1">Salary</div>
                  <div className="text-xl font-black text-emerald-400">{match.job.salary}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-xs text-slate-400 mb-1">Remote</div>
                  <div className="text-xl font-black text-purple-400">{match.job.remote}</div>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h3 className="text-sm font-bold text-purple-400 mb-3">Match Breakdown</h3>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div><div className="text-2xl font-black text-white mb-1">{match.analysis.skillScore}%</div><div className="text-xs text-slate-400">Tech</div></div>
                  <div><div className="text-2xl font-black text-white mb-1">{match.analysis.cultureScore}%</div><div className="text-xs text-slate-400">Culture</div></div>
                  <div><div className="text-2xl font-black text-white mb-1">{match.analysis.vibeScore}%</div><div className="text-xs text-slate-400">Vibe</div></div>
                  <div><div className="text-2xl font-black text-white mb-1">{match.analysis.salaryScore}%</div><div className="text-xs text-slate-400">Pay</div></div>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h3 className="text-sm font-bold text-purple-400 mb-2">Description</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{match.job.description}</p>
              </div>
            </div>
          )}

          {activeTab !== 'overview' && (
            <div className="space-y-4">
              {!aiContent[activeTab] ? (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-white mb-2">AI-Powered Content</h3>
                  <p className="text-slate-400 mb-6 text-sm">Generate personalized content using Claude</p>
                  <button onClick={() => generateContent(activeTab)} disabled={isGenerating} className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2 mx-auto">
                    {isGenerating ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex justify-end gap-2 mb-4">
                    <button onClick={() => copyToClipboard(aiContent[activeTab])} className="px-4 py-2 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-all flex items-center gap-2">
                      <Share2 className="w-4 h-4" />Copy
                    </button>
                    <button onClick={() => { setAiContent(prev => ({ ...prev, [activeTab]: null })); generateContent(activeTab); }} className="px-4 py-2 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-all flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />Regenerate
                    </button>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <pre className="whitespace-pre-wrap text-slate-200 leading-relaxed font-sans text-sm">{aiContent[activeTab]}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const ProfileProtocol = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ name: '', role: 'Engineer', skills: [], vibe: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const fileInputRef = useRef(null);
  const allSkills = data.role ? SKILL_DATABASE[data.role] : SKILL_DATABASE['Engineer'];

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeFile(file);
    setIsUploading(true);
    const extracted = await BackendAPI.resume.analyze(file);
    if (extracted) {
      setData({ name: extracted.name || '', role: extracted.role || 'Engineer', skills: extracted.skills || [], vibe: extracted.vibe || 'balance' });
      setStep(3);
    }
    setIsUploading(false);
  };

  const handleNext = () => { if (step < 3) setStep(step + 1); else { setIsUploading(true); setTimeout(() => onComplete(data), 2000); } };
  const toggleSkill = (s) => setData(prev => ({ ...prev, skills: prev.skills.includes(s) ? prev.skills.filter(i => i !== s) : [...prev.skills, s] }));

  if (isUploading) return (
    <div className="h-screen flex flex-col items-center justify-center text-white z-20 relative">
      <Brain className="w-20 h-20 text-purple-500 animate-pulse mb-6" />
      <h2 className="text-3xl font-black tracking-widest mb-3">{resumeFile ? 'ANALYZING RESUME...' : 'NEURAL SYNC'}</h2>
      <p className="text-slate-400 text-sm mb-4">{resumeFile ? 'Extracting skills...' : `Analyzing ${data.skills.length} skills...`}</p>
      <div className="w-80 h-3 bg-white/10 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2 }} className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 z-10 relative">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl bg-black/50 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="flex justify-between mb-8">
          {[0,1,2,3].map(i => <div key={i} className={`h-1.5 flex-1 mx-1 rounded-full transition-all ${i <= step ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/10'}`} />)}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-8 h-8 text-purple-400" />
                <h2 className="text-4xl font-black text-white">QUICK START</h2>
              </div>
              <p className="text-slate-400 mb-8 text-sm">Upload resume for instant setup</p>
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" />
              <div className="space-y-4">
                <button onClick={() => fileInputRef.current?.click()} className="w-full p-8 rounded-2xl border-2 border-dashed border-purple-500/50 hover:border-purple-500 bg-purple-500/10 hover:bg-purple-500/20 transition-all group">
                  <Download className="w-12 h-12 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-white font-bold mb-1">Upload Resume (PDF)</p>
                  <p className="text-slate-400 text-sm">AI will extract everything automatically</p>
                </button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                  <div className="relative flex justify-center text-sm"><span className="px-4 bg-black/50 text-slate-500">or manual setup</span></div>
                </div>
                <button onClick={handleNext} className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-medium">
                  Manual Setup <ChevronRight className="inline w-4 h-4 ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}>
              <div className="flex items-center gap-3 mb-2">
                <User className="w-8 h-8 text-purple-400" />
                <h2 className="text-4xl font-black text-white">IDENTITY</h2>
              </div>
              <p className="text-slate-400 mb-8 text-sm">What should we call you?</p>
              <input type="text" value={data.name} onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))} placeholder="Your Name" className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-lg placeholder-slate-500 focus:border-purple-500 focus:outline-none mb-6" />
              <div className="space-y-3">
                <p className="text-white font-bold mb-3">Role Type</p>
                {Object.keys(SKILL_DATABASE).map(role => (
                  <button key={role} onClick={() => setData(prev => ({ ...prev, role }))} className={`w-full p-4 rounded-xl border transition-all text-left ${data.role === role ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'}`}>
                    <div className="font-bold">{role}</div>
                    <div className="text-xs mt-1 opacity-70">{SKILL_DATABASE[role].core.slice(0,3).join(', ')}</div>
                  </button>
                ))}
              </div>
              <button onClick={handleNext} disabled={!data.name || !data.role} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:scale-105 transition-transform mt-6 disabled:opacity-50 disabled:hover:scale-100">
                Continue <ChevronRight className="inline w-5 h-5 ml-2" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}>
              <div className="flex items-center gap-3 mb-2">
                <Code className="w-8 h-8 text-purple-400" />
                <h2 className="text-4xl font-black text-white">TECH STACK</h2>
              </div>
              <p className="text-slate-400 mb-8 text-sm">Select your skills (pick 5-10)</p>
              <div className="space-y-6 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                {['core', 'advanced', 'emerging'].map(category => (
                  <div key={category}>
                    <h3 className="text-white font-bold mb-3 capitalize flex items-center gap-2">
                      {category === 'core' && <Shield className="w-4 h-4 text-blue-400" />}
                      {category === 'advanced' && <Zap className="w-4 h-4 text-yellow-400" />}
                      {category === 'emerging' && <Sparkles className="w-4 h-4 text-purple-400" />}
                      {category}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {allSkills[category].map(skill => (
                        <button key={skill} onClick={() => toggleSkill(skill)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${data.skills.includes(skill) ? 'bg-purple-500 text-white' : 'bg-white/5 border border-white/10 text-slate-300 hover:border-white/30'}`}>
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-medium">
                  Back
                </button>
                <button onClick={handleNext} disabled={data.skills.length < 3} className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100">
                  Continue ({data.skills.length} selected)
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}>
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-8 h-8 text-purple-400" />
                <h2 className="text-4xl font-black text-white">WORK VIBE</h2>
              </div>
              <p className="text-slate-400 mb-8 text-sm">What's your ideal work environment?</p>
              <div className="space-y-4">
                {[
                  { id: 'structure', label: 'Structure Lover', desc: 'Big tech, clear processes, 9-to-5', icon: Building2 },
                  { id: 'balance', label: 'Balanced', desc: 'Mix of stability and innovation', icon: Target },
                  { id: 'chaos', label: 'Chaos Embracer', desc: 'Startups, rapid change, all-in hustle', icon: Zap }
                ].map(vibe => (
                  <button key={vibe.id} onClick={() => setData(prev => ({ ...prev, vibe: vibe.id }))} className={`w-full p-6 rounded-xl border transition-all text-left ${data.vibe === vibe.id ? 'bg-purple-500/20 border-purple-500' : 'bg-white/5 border-white/10 hover:border-white/30'}`}>
                    <div className="flex items-center gap-4">
                      <vibe.icon className={`w-8 h-8 ${data.vibe === vibe.id ? 'text-purple-400' : 'text-slate-500'}`} />
                      <div>
                        <div className={`font-bold text-lg ${data.vibe === vibe.id ? 'text-white' : 'text-slate-300'}`}>{vibe.label}</div>
                        <div className="text-sm text-slate-400 mt-1">{vibe.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-medium">
                  Back
                </button>
                <button onClick={handleNext} disabled={!data.vibe} className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100">
                  Start Swiping <Heart className="inline w-5 h-5 ml-2" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const SwipeCard = ({ job, analysis, onSwipe }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  return (
    <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} style={{ x, rotate, opacity }} onDragEnd={(e, { offset, velocity }) => {
      const swipe = Math.abs(offset.x) > 100;
      if (swipe) onSwipe(offset.x > 0 ? 'right' : 'left');
    }} className="absolute inset-0 cursor-grab active:cursor-grabbing">
      <div className={`w-full h-full bg-gradient-to-br ${job.bg} rounded-3xl border border-white/20 shadow-2xl p-8 flex flex-col`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="text-3xl font-black text-white mb-2 leading-tight">{job.title}</h2>
            <p className="text-xl text-white/90 font-medium mb-3">{job.company}</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-black/30 border border-white/20 rounded-full text-xs text-white flex items-center gap-1">
                <MapPin className="w-3 h-3" />{job.location}
              </span>
              <span className="px-3 py-1 bg-black/30 border border-white/20 rounded-full text-xs text-white">{job.remote}</span>
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-xs text-emerald-200 font-bold">
                {analysis.overall}% Match
              </span>
            </div>
          </div>
          {analysis.flagStatus === 'red' && <AlertTriangle className="w-8 h-8 text-red-400" />}
          {analysis.flagStatus === 'orange' && <AlertTriangle className="w-8 h-8 text-yellow-400" />}
          {analysis.flagStatus === 'green' && <CheckCircle className="w-8 h-8 text-emerald-400" />}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-black text-white mb-1">{job.salary}</div>
            <div className="text-xs text-white/70">Annual Compensation</div>
          </div>

          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />Match Breakdown
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-xl font-black text-white">{analysis.skillScore}%</div>
                <div className="text-xs text-white/70">Skills</div>
              </div>
              <div>
                <div className="text-xl font-black text-white">{analysis.cultureScore}%</div>
                <div className="text-xs text-white/70">Culture</div>
              </div>
              <div>
                <div className="text-xl font-black text-white">{analysis.vibeScore}%</div>
                <div className="text-xs text-white/70">Vibe</div>
              </div>
              <div>
                <div className="text-xl font-black text-white">{analysis.atsScore}%</div>
                <div className="text-xs text-white/70">ATS</div>
              </div>
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Code className="w-4 h-4" />Requirements
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.requirements.map((req, i) => {
                const matched = analysis.matchedRequired.some(m => m.toLowerCase().includes(req.toLowerCase()));
                return (
                  <span key={i} className={`px-2 py-1 rounded text-xs font-medium ${matched ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-200' : 'bg-white/10 border border-white/20 text-white/70'}`}>
                    {req}
                  </span>
                );
              })}
            </div>
          </div>

          {(analysis.criticalFlags.length > 0 || analysis.warningFlags.length > 0) && (
            <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-4 border border-red-500/30">
              <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />Red Flags Detected
              </h3>
              <div className="space-y-1 text-xs">
                {analysis.criticalFlags.map((flag, i) => (
                  <div key={i} className="text-red-300">🚩 Critical: "{flag}"</div>
                ))}
                {analysis.warningFlags.map((flag, i) => (
                  <div key={i} className="text-yellow-300">⚠️ Warning: "{flag}"</div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-bold text-white mb-2">Description</h3>
            <p className="text-sm text-white/80 leading-relaxed">{job.description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MatchesView = ({ matches, onSelectMatch }) => {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Ghost className="w-20 h-20 text-slate-600 mb-4 opacity-50" />
        <h3 className="text-2xl font-bold text-white mb-2">No Matches Yet</h3>
        <p className="text-slate-400">Start swiping to find your perfect job!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      {matches.map((match, i) => (
        <motion.div key={match.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} onClick={() => onSelectMatch(match)} className={`bg-gradient-to-br ${match.job.bg} rounded-2xl border border-white/20 p-6 cursor-pointer hover:scale-105 transition-transform`}>
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-black text-white leading-tight">{match.job.title}</h3>
            <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-xs text-emerald-200 font-bold">
              {match.analysis.overall}%
            </span>
          </div>
          <p className="text-white/80 font-medium mb-3">{match.job.company}</p>
          <div className="space-y-2 text-xs text-white/70">
            <div className="flex items-center gap-2"><MapPin className="w-3 h-3" />{match.job.location}</div>
            <div className="flex items-center gap-2"><DollarSign className="w-3 h-3" />{match.job.salary}</div>
            <div className="flex items-center gap-2"><Clock className="w-3 h-3" />{new Date(match.timestamp).toLocaleDateString()}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const StatsView = ({ stats }) => {
  const chartData = [
    { name: 'Likes', value: stats.likes, color: '#10b981' },
    { name: 'Passes', value: stats.passes, color: '#ef4444' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-6 h-6 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Total Swipes</h3>
          </div>
          <div className="text-4xl font-black text-white">{stats.total}</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-900/50 to-green-900/50 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-6 h-6 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Liked</h3>
          </div>
          <div className="text-4xl font-black text-white">{stats.likes}</div>
        </div>
        <div className="bg-gradient-to-br from-red-900/50 to-orange-900/50 rounded-2xl border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-2">
            <X className="w-6 h-6 text-red-400" />
            <h3 className="text-sm font-bold text-white">Passed</h3>
          </div>
          <div className="text-4xl font-black text-white">{stats.passes}</div>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-6">Activity Ratio</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.1)" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '12px' }}
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-slate-400">Likes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-slate-400">Passes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========================================
// MAIN APPLICATION
// ========================================

const App = () => {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('profile'); // profile, swipe, matches, stats
  const [userProfile, setUserProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState({ likes: 0, passes: 0, total: 0 });
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [swipeDirection, setSwipeDirection] = useState(null);

  // Initialization
  useEffect(() => {
    const init = async () => {
      const storedProfile = await BackendAPI.storage.get('user_profile');
      if (storedProfile) {
        setUserProfile(storedProfile);
        await loadJobs(storedProfile);
        await loadUserData(storedProfile.id || 'user_1');
        setView('swipe');
      } else {
        setView('profile');
      }
      setLoading(false);
    };
    init();
  }, []);

  const loadJobs = async (profile) => {
    const liveJobs = await BackendAPI.jobs.fetchLive(profile);
    // Filter out jobs already swiped (mock logic)
    setJobs(liveJobs);
  };

  const loadUserData = async (userId) => {
    const userMatches = await BackendAPI.analytics.getMatches(userId);
    const userStats = await BackendAPI.analytics.getStats(userId);
    setMatches(userMatches);
    setStats(userStats);
  };

  const handleProfileComplete = async (data) => {
    setLoading(true);
    const profile = { ...data, id: `user_${Date.now()}` };
    await BackendAPI.storage.set('user_profile', profile);
    setUserProfile(profile);
    await loadJobs(profile);
    setView('swipe');
    setLoading(false);
  };

  const handleSwipe = async (direction) => {
    if (!jobs[currentJobIndex]) return;

    setSwipeDirection(direction);
    const job = jobs[currentJobIndex];
    const analysis = analyzeMatch(userProfile, job);
    
    // Animate out
    setTimeout(async () => {
      // Save Analytics
      await BackendAPI.analytics.saveSwipe(userProfile.id, job.id, direction, analysis.overall);
      
      if (direction === 'right') {
        await BackendAPI.analytics.saveMatch(userProfile.id, job, analysis, userProfile);
      }

      // Update Local State
      const newStats = await BackendAPI.analytics.getStats(userProfile.id);
      const newMatches = await BackendAPI.analytics.getMatches(userProfile.id);
      setStats(newStats);
      setMatches(newMatches);
      
      // Next Job
      setSwipeDirection(null);
      setCurrentJobIndex(prev => prev + 1);
    }, 200);
  };

  const handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (loading) return <LoadingScreen message="INITIALIZING SYSTEM..." />;

  return (
    <div className="h-screen w-full bg-black text-white overflow-hidden font-sans selection:bg-purple-500/30">
      <NeuralBackground />
      
      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 z-40 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Ghost className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter leading-none">GHOST<span className="text-purple-500">HUNT</span></h1>
            <p className="text-[10px] text-slate-400 tracking-widest font-bold">CAREER OS v2.0</p>
          </div>
        </div>
        
        {userProfile && (
          <div className="pointer-events-auto flex gap-3">
             <button onClick={handleReset} className="p-2 bg-white/5 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors" title="Reset Demo">
              <LogOut className="w-5 h-5" />
            </button>
            <button onClick={() => setView('profile')} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-black">
                {userProfile.name.charAt(0)}
              </div>
              <span className="text-sm font-bold hidden md:block">{userProfile.role}</span>
            </button>
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="relative h-full w-full pt-20 pb-24 max-w-4xl mx-auto px-4">
        <AnimatePresence mode="wait">
          {view === 'profile' && !userProfile && (
            <ProfileProtocol onComplete={handleProfileComplete} />
          )}

          {view === 'swipe' && userProfile && (
            <motion.div 
              key="swipe"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="h-full w-full relative flex flex-col justify-center"
            >
              {currentJobIndex < jobs.length ? (
                <div className="relative w-full max-w-md mx-auto aspect-[3/4] md:aspect-[4/5]">
                  {/* Stack Effect Cards */}
                  {jobs[currentJobIndex + 1] && (
                    <div className="absolute inset-0 bg-slate-800 rounded-3xl transform scale-95 translate-y-4 opacity-50" />
                  )}
                  
                  {/* Active Card */}
                  <SwipeCard 
                    job={jobs[currentJobIndex]} 
                    analysis={analyzeMatch(userProfile, jobs[currentJobIndex])}
                    onSwipe={handleSwipe}
                  />

                  {/* Controls */}
                  <div className="absolute -bottom-20 left-0 right-0 flex justify-center gap-6">
                    <button onClick={() => handleSwipe('left')} className="p-4 bg-black/50 border border-red-500/30 text-red-400 rounded-full hover:bg-red-500 hover:text-white hover:scale-110 transition-all shadow-lg shadow-red-900/20">
                      <X className="w-8 h-8" />
                    </button>
                    <button onClick={() => handleSwipe('right')} className="p-4 bg-black/50 border border-emerald-500/30 text-emerald-400 rounded-full hover:bg-emerald-500 hover:text-white hover:scale-110 transition-all shadow-lg shadow-emerald-900/20">
                      <Heart className="w-8 h-8" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center max-w-md mx-auto">
                  <CheckCircle className="w-24 h-24 text-purple-500 mx-auto mb-6 animate-bounce" />
                  <h2 className="text-3xl font-black text-white mb-4">ALL CAUGHT UP!</h2>
                  <p className="text-slate-400 mb-8">You've browsed all available jobs matching your profile.</p>
                  <button onClick={() => setView('matches')} className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform">
                    View Your Matches
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {view === 'matches' && (
            <motion.div key="matches" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto custom-scrollbar pb-20">
              <h2 className="text-2xl font-black text-white mb-6 sticky top-0 bg-black/80 backdrop-blur-xl py-4 z-10">YOUR MATCHES <span className="text-purple-500">({matches.length})</span></h2>
              <MatchesView matches={matches} onSelectMatch={setSelectedMatch} />
            </motion.div>
          )}

          {view === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto custom-scrollbar pb-20">
               <h2 className="text-2xl font-black text-white mb-6 sticky top-0 bg-black/80 backdrop-blur-xl py-4 z-10">ANALYTICS</h2>
              <StatsView stats={stats} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM NAV */}
      {userProfile && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 flex gap-8 shadow-2xl z-40">
          {[
            { id: 'swipe', icon: Radar, label: 'Discovery' },
            { id: 'matches', icon: Briefcase, label: 'Matches', badge: matches.length },
            { id: 'stats', icon: TrendingUp, label: 'Stats' }
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setView(item.id)} 
              className={`relative p-2 transition-all ${view === item.id ? 'text-purple-400 scale-110' : 'text-slate-500 hover:text-white'}`}
            >
              <item.icon className="w-6 h-6" />
              {item.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* MODALS */}
      <AnimatePresence>
        {selectedMatch && (
          <MatchDetailModal 
            match={selectedMatch} 
            userId={userProfile?.id} 
            onClose={() => setSelectedMatch(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
