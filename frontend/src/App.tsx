import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from './components/layout/Navbar';
import { Home } from './components/pages/Home';
import { Dashboard } from './components/pages/Dashboard';
import { AIAgent } from './components/pages/AIAgent';
import { Payments } from './components/pages/Payments';
import { Groups } from './components/pages/Groups';
import { Pots } from './components/pages/Pots';
import { Escrow } from './components/pages/Escrow';
import { Vaults } from './components/pages/Vaults';
import { Usernames } from './components/pages/Usernames';
import { Settings } from './components/pages/Settings';
import { Help } from './components/pages/Help';
import { colors } from './lib/colors';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <Home onNavigate={setActiveTab} />;
      case 'payments':
        return <Payments />;
      case 'groups':
        return <Groups />;
      case 'pots':
        return <Pots />;
      case 'vaults':
        return <Vaults />;
      case 'escrow':
        return <Escrow />;
      case 'usernames':
        return <Usernames />;
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'ai-agent':
        return <AIAgent />;
      case 'settings':
        return <Settings />;
      case 'help':
        return <Help />;
      default:
        return <Home onNavigate={setActiveTab} />;
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 20% 30%, ${colors.neonGreen}08 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, ${colors.neonPurple}08 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, ${colors.neonBlue}06 0%, transparent 50%),
          linear-gradient(135deg, ${colors.cosmic} 0%, ${colors.cosmicLight} 100%)
        `,
      }}
    >
      {/* Enhanced animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Primary glow */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors.neonGreen}15, ${colors.neonGreen}08 40%, transparent 70%)`,
            top: '5%',
            left: '5%',
            filter: 'blur(40px)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Secondary glow */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors.neonPurple}15, ${colors.neonPurple}08 40%, transparent 70%)`,
            top: '50%',
            right: '10%',
            filter: 'blur(40px)',
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4],
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Tertiary glow */}
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors.neonBlue}12, ${colors.neonBlue}06 40%, transparent 70%)`,
            bottom: '20%',
            left: '30%',
            filter: 'blur(30px)',
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.2, 0.5, 0.2],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: i % 3 === 0 ? colors.neonGreen :
                i % 3 === 1 ? colors.neonPurple : colors.neonBlue,
              left: `${10 + i * 15}%`,
              top: `${20 + i * 10}%`,
              boxShadow: `0 0 10px currentColor`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Gradient overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${colors.cosmic}40 100%)`
        }}
      />

      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <motion.main
        key={activeTab}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.95 }}
        transition={{
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1]
        }}
        className="relative z-10"
      >
        {renderPage()}
      </motion.main>
    </div>
  );
}

export default App;