// src/layouts/MainLayout.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Common/Sidebar';
import MainView from '../components/Common/MainView';
// import './MainLayout.css'; // 필요시 CSS

const MainLayout = ({ children }) => { // children은 현재 사용하지 않지만, 일반적인 레이아웃 패턴
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('main_dashboard'); // 기본으로 보여줄 뷰

  
  if (!user) {
    // 이 경우는 ProtectedRoute에 의해 거의 발생하지 않지만, 안전장치
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login'); // AuthContext에서 처리하므로 중복될 수 있지만 명시적
  };

  const handleMenuClick = (viewId) => {
    setCurrentView(viewId);
  };

  return (
    <div className="main-layout">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#343a40', color: 'white' }}>
        <h1>StrokeCare+ 병원 시스템</h1>
        <div>

          
          <span style={{marginRight: '15px'}}>사용자: {user.name}</span>
          <button onClick={handleLogout} style={{padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px'}}>로그아웃</button>
        </div>
      </header>
      <div style={{ display: 'flex' }}>
        <Sidebar user={user} onMenuClick={handleMenuClick} />
        <MainView currentViewId={currentView} user={user} />
        {/* {children}  만약 MainLayout이 DashboardPage 자체를 감싸는 경우 children을 사용 */}
      </div>
      {/* <footer style={{padding: '10px', textAlign: 'center', borderTop: '1px solid #eee', backgroundColor: '#f8f9fa'}}>
        © 2025 Medical CDSS Project
      </footer> */}
    </div>
  );
};

export default MainLayout;