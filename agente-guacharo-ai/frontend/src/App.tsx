import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ChatProvider } from './contexts/ChatContext';
import ChatPage from './pages/ChatPage';
import AnalysisPage from './pages/AnalysisPage';
import PredictionsPage from './pages/PredictionsPage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { GlobalStyles, AppContainer, MainContent } from './styles/GlobalStyles';

const App: React.FC = () => {
  return (
    <ChatProvider>
      <Router>
        <GlobalStyles />
        <AppContainer>
          <Header />
          <div style={{ display: 'flex', flex: 1 }}>
            <Sidebar />
            <MainContent>
              <Routes>
                <Route path="/" element={<ChatPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
                <Route path="/predictions" element={<PredictionsPage />} />
              </Routes>
            </MainContent>
          </div>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />
        </AppContainer>
      </Router>
    </ChatProvider>
  );
};

export default App;