import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import VoiceQA from './components/VoiceQA';
import PaperExplainer from './components/PaperExplainer';
import LandRecordExplorer from './components/LandRecordExplorer';
import RulesPage from './components/RulesPage';
import CitizenHelp from './components/CitizenHelp';
import { LanguageProvider } from './i18n';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');

  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-stone-800 font-sans antialiased w-full max-w-full overflow-x-hidden">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 w-full max-w-full">
          {activeTab === 'landing' && <LandingPage setActiveTab={setActiveTab} />}
          {activeTab === 'ask' && <VoiceQA setActiveTab={setActiveTab} />}
          {activeTab === 'paper' && <PaperExplainer setActiveTab={setActiveTab} />}
          {activeTab === 'record' && <LandRecordExplorer setActiveTab={setActiveTab} />}
          {activeTab === 'rules' && <RulesPage setActiveTab={setActiveTab} />}
          {activeTab === 'help' && <CitizenHelp setActiveTab={setActiveTab} />}
        </main>

        <Footer setActiveTab={setActiveTab} />
      </div>
    </LanguageProvider>
  );
}
