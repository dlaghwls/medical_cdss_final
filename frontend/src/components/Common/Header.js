
// /src/components/Common/Header.js (수정 완료)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ChatModal from './ChatModal'; // ChatModal 컴포넌트를 import 합니다.
import NotificationBadge from './NotificationBadge'; 
import { apiClient } from '../../services/djangoApiService';

const Header = ({ user }) => {
  const { logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 채팅 모달의 열림/닫힘 상태
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  // 버튼 호버 상태 (각 버튼을 구별하기 위해 객체 사용)
  const [hoverState, setHoverState] = useState({
    logout: false,
    message: false,
  });
  
  useEffect(() => {
    if (!user) return; // 로그인 상태가 아닐 때는 실행하지 않음

    const fetchUnreadCount = async () => {
      try {
        const response = await apiClient.get('/chat/unread-count/');
        setTotalUnreadCount(response.data.unread_count);
      } catch (error) {
        console.error("Failed to fetch unread message count:", error);
      }
    };
    
    fetchUnreadCount(); // 처음 로드될 때 한번 즉시 호출
    const intervalId = setInterval(fetchUnreadCount, 10000); // 그 후 10초마다 반복

    return () => clearInterval(intervalId); // 컴포넌트가 사라질 때 반복을 멈춤
  }, [user]); // user 상태가 바뀔 때(로그인/로그아웃) 다시 실행
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
  };
  
  const handleMouseEnter = (button) => {
    setHoverState(prevState => ({ ...prevState, [button]: true }));
  };

  const handleMouseLeave = (button) => {
    setHoverState(prevState => ({ ...prevState, [button]: false }));
  };

  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
  };

  // --- 스타일 정의 ---
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 30px',
    backgroundColor: '#2c3e50',
    color: 'white',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  };

  const logoStyle = {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    letterSpacing: '1px'
  };

  const navStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '25px'
  };
  
  const timeStyle = {
    fontSize: '1rem',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.5px'
  };
  
  const getButtonStyle = (isHovered) => ({
    padding: '8px 16px',
    backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'background-color 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  });
  const buttonContainerStyle = { position: 'relative', display: 'inline-block' };
  const MessageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
    </svg>
  );

  return (
    // ✨ 1. <></> (Fragment)로 전체를 감싸줍니다.
    <>
      <header style={headerStyle}>
        <div className="logo" style={logoStyle}>
          StrokeCare+
        </div>
        <nav style={navStyle}>
          <span style={timeStyle}>
            {formatDateTime(currentTime)}
          </span>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '1.1rem' }}>
                {user.name || user.employee_id} 님
              </span>

              {/* ✨ 수정된 메시지 버튼 부분 */}
              <div style={buttonContainerStyle}>
                <button
                  onClick={() => setIsChatModalOpen(true)}
                  style={getButtonStyle(hoverState.message)}
                  onMouseEnter={() => handleMouseEnter('message')}
                  onMouseLeave={() => handleMouseLeave('message')}
                >
                  <MessageIcon />
                  메시지
                </button>
                <NotificationBadge count={totalUnreadCount} />
              </div>

              <button
                onClick={handleLogout}
                style={getButtonStyle(hoverState.logout)}
                onMouseEnter={() => handleMouseEnter('logout')}
                onMouseLeave={() => handleMouseLeave('logout')}
              >
                로그아웃
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '1.1rem' }}>로그인이 필요합니다.</span>
          )}
        </nav>
      </header>
      
      {/* ✨ 3. 올바른 JSX 문법으로 ChatModal을 렌더링합니다. */}
      {isChatModalOpen && (
        <ChatModal 
          user={user}
          onClose={() => setIsChatModalOpen(false)} 
        />
      )}
    </>
  );
};

export default Header;
