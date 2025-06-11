import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router future={{ v7_startTransition: true }}>
          <div className="App">
            <Routes>
              {/* 公开路由 */}
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              
              {/* 受保护的路由 */}
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              
              {/* 默认重定向 */}
              <Route path="/" element={<Navigate to="/chat" replace />} />
              
              {/* 404页面 */}
              <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
            
            {/* 全局通知 */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
