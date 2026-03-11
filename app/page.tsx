'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DashboardHome } from '@/components/DashboardHome';
import { AchievementsGrid } from '@/components/AchievementsGrid';
import { StudentManagement } from '@/components/StudentManagement';
import { AchievementManagement } from '@/components/AchievementManagement';
import { MissionManagement } from '@/components/MissionManagement';
import { Ranking } from '@/components/Ranking';
import { AccountSettings } from '@/components/AccountSettings';
import { motion, AnimatePresence } from 'motion/react';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardHome />;
      case 'achievements':
        return <AchievementsGrid />;
      case 'ranking':
        return <Ranking />;
      case 'management':
        return <StudentManagement />;
      case 'achievement-management':
        return <AchievementManagement />;
      case 'mission-management':
        return <MissionManagement />;
      case 'account':
        return <AccountSettings />;
      default:
        return <DashboardHome />;
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsSidebarOpen(false); // Close sidebar on mobile when a tab is selected
  };

  return (
    <div className="flex min-h-screen bg-[#0A0A0B]">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header 
          setActiveTab={handleTabChange} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
        
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return <DashboardContent />;
}
