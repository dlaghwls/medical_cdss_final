// // src/components/Common/Header.js
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../../contexts/AuthContext'; // AuthContext 임포트
// import ChatModal from './ChatModal';
// const Header = ({ user }) => {
//   const { logout } = useAuth(); // useAuth 훅을 사용하여 logout 함수 가져오기
//   const [currentTime, setCurrentTime] = useState(new Date());
//   const [isHovered, setIsHovered] = useState(false); // 버튼 호버 상태 관리
//   const [isChatModalOpen, setIsChatModalOpen] = useState(false);
//   // 1초마다 현재 시간을 업데이트하는 Effect
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setCurrentTime(new Date());
//     }, 1000);

//     // 컴포넌트가 언마운트될 때 타이머 정리
//     return () => {
//       clearInterval(timer);
//     };
//   }, []); // 빈 배열을 전달하여 컴포넌트가 처음 마운트될 때 한 번만 실행

//   const handleLogout = () => {
//     logout(); // 로그아웃 함수 호출
//   };

//   // 날짜와 시간을 "YYYY.MM.DD HH:mm:ss" 형식으로 포맷
//   const formatDateTime = (date) => {
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     const hours = String(date.getHours()).padStart(2, '0');
//     const minutes = String(date.getMinutes()).padStart(2, '0');
//     const seconds = String(date.getSeconds()).padStart(2, '0');
//     return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
//   };
  
//   // --- 스타일 정의 ---
//   const headerStyle = {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: '15px 30px', // 좀 더 여유로운 패딩
//     backgroundColor: '#2c3e50', // 세련된 짙은 남색
//     color: 'white',
//     boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' // 부드러운 그림자 효과
//   };

//   const logoStyle = {
//     fontSize: '1.8rem',
//     fontWeight: 'bold',
//     letterSpacing: '1px' // 글자 간격으로 고급스러움 추가
//   };

//   const navStyle = {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '25px' // 요소 간 간격 증가
//   };
  
//   const timeStyle = {
//     fontSize: '1rem',
//     fontFamily: "'JetBrains Mono', monospace", // 고정폭 글꼴로 숫자 깜빡임 방지
//     letterSpacing: '0.5px'
//   };

//   const buttonStyle = {
//     padding: '8px 16px',
//     backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)', // 호버 효과
//     color: 'white',
//     border: '1px solid rgba(255, 255, 255, 0.5)',
//     borderRadius: '8px', // 둥근 모서리
//     cursor: 'pointer',
//     fontSize: '0.9rem',
//     fontWeight: '500',
//     transition: 'background-color 0.3s ease' // 부드러운 색상 전환 효과
//   };


//   return (
//     <>
//     <header style={headerStyle}>
//       <div className="logo" style={logoStyle}>
//         StrokeCare+
//       </div>
//       <nav style={navStyle}>
//         {/* 실시간 날짜 및 시간 표시 */}
//         <span style={timeStyle}>
//           {formatDateTime(currentTime)}
//         </span>

//         {/* 사용자 정보 및 로그아웃 버튼 */}
//         {user ? (
//           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
//             <span style={{ fontSize: '1.1rem' }}>
//               {user.name || user.id} 님
//             </span>
//             <button
//               onClick={handleLogout}
//               style={buttonStyle}
//               onMouseEnter={() => setIsHovered(true)}
//               onMouseLeave={() => setIsHovered(false)}
//             >
//               로그아웃
//             </button>
//           </div>
//         ) : (
//           <span style={{ fontSize: '1.1rem' }}>로그인이 필요합니다.</span>
//         )}
//       </nav>
//     </header>
//     {isChatModalOpen && (
//       <ChatModal 
//           user={user}
//           onClose={() => setIsChatModalOpen(false)} 
//         />
//       )}
//     </>
//   );
// };

// export default Header;

// /src/components/Common/Header.js (수정 완료)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ChatModal from './ChatModal'; // ChatModal 컴포넌트를 import 합니다.

const Header = ({ user }) => {
  const { logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 채팅 모달의 열림/닫힘 상태
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // 버튼 호버 상태 (각 버튼을 구별하기 위해 객체 사용)
  const [hoverState, setHoverState] = useState({
    logout: false,
    message: false,
  });

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

              {/* ✨ 2. 메시지 버튼을 추가합니다. */}
              <button
                onClick={() => setIsChatModalOpen(true)}
                style={getButtonStyle(hoverState.message)}
                onMouseEnter={() => handleMouseEnter('message')}
                onMouseLeave={() => handleMouseLeave('message')}
              >
                <MessageIcon />
                메시지
              </button>

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
