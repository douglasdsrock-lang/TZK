'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard, useAuth } from '@/components/AuthGuard';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DashboardHome } from '@/components/DashboardHome';
import { Ranking } from '@/components/Ranking';
import { AchievementsGrid } from '@/components/AchievementsGrid';
import { AccountSettings } from '@/components/AccountSettings';
import { StudentManagement } from '@/components/StudentManagement';
import { AchievementManagement } from '@/components/AchievementManagement';
import { MissionManagement } from '@/components/MissionManagement';
import { CommunicationManagement } from '@/components/CommunicationManagement';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { NotificationSystem } from '@/components/NotificationSystem';
import { supabase } from '@/lib/supabase';
import { getCharacterById } from '@/lib/characters';
import { soundManager } from '@/lib/sounds';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [showWelcomePreview, setShowWelcomePreview] = useState(false);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const handlePreview = () => setShowWelcomePreview(true);
    window.addEventListener('show-welcome-preview', handlePreview);
    return () => window.removeEventListener('show-welcome-preview', handlePreview);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchStudentData = async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      let finalData = data;
      if (!finalData && user.email) {
        const { data: dataByEmail } = await supabase
          .from('students')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();
        finalData = dataByEmail;
      }

      if (finalData) {
        setStudentData({
          ...finalData,
          characterId: finalData.character_id
        });
      }
    };

    fetchStudentData();

    // Subscribe to changes
    const channel = supabase
      .channel('student_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'students',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        setStudentData({
          ...payload.new,
          characterId: (payload.new as any).character_id
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const character = getCharacterById(studentData?.characterId);
  const themeColor = character?.color || '#F74C00';

  if (user && studentData && (!studentData.characterId || showWelcomePreview)) {
    return (
      <WelcomeScreen 
        user={user} 
        studentData={studentData} 
        onComplete={() => {
          setShowWelcomePreview(false);
          // Refresh student data after selection
          const fetchStudentData = async () => {
            const { data } = await supabase
              .from('students')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();
            if (data) setStudentData({ ...data, characterId: data.character_id });
          };
          fetchStudentData();
        }} 
      />
    );
  }

  const handleTabChange = (tab: string) => {
    soundManager.playClick();
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardHome themeColor={themeColor} setActiveTab={handleTabChange} />;
      case 'ranking':
        return <Ranking themeColor={themeColor} />;
      case 'achievements':
        return <AchievementsGrid themeColor={themeColor} />;
      case 'account':
        return <AccountSettings />;
      case 'management':
        return isAdmin ? <StudentManagement /> : <DashboardHome themeColor={themeColor} setActiveTab={handleTabChange} />;
      case 'achievement-management':
        return isAdmin ? <AchievementManagement /> : <DashboardHome themeColor={themeColor} setActiveTab={handleTabChange} />;
      case 'mission-management':
        return isAdmin ? <MissionManagement /> : <DashboardHome themeColor={themeColor} setActiveTab={handleTabChange} />;
      case 'communication':
        return isAdmin ? <CommunicationManagement /> : <DashboardHome themeColor={themeColor} setActiveTab={handleTabChange} />;
      default:
        return <DashboardHome themeColor={themeColor} setActiveTab={handleTabChange} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0A0A0B] text-white">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        themeColor={themeColor}
        studentData={studentData}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          setActiveTab={handleTabChange} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          themeColor={themeColor}
        />
        
        <main className="flex-1 p-4 md:p-8 pt-12 md:pt-16 overflow-visible">
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </main>
      </div>
      <NotificationSystem />
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
