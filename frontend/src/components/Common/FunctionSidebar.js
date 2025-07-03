import React from 'react';
// ROLES 상수는 더 이상 필요 없으므로 import에서 제거합니다.

// CSS 파일을 import 합니다.
import './FunctionSidebar.css';

// 현재 활성화된 메뉴를 알기 위해 'activeView' prop을 받습니다.
const FunctionSidebar = ({ user, onMenuClick, style, activeView }) => {
  if (!user) return null;

  // 메뉴 데이터에서 icon 속성 제거
  const commonFunctions = [
    { id: 'vital_signs', name: 'Vital' },
    { id: 'pacs_viewer', name: 'PACS' },
    { id: 'lab', name: 'LAB' },
  ];

  const aiFunctions = [
    { id: 'ai_complication_import', name: '합병증 예측' },
    { id: 'ai_death_import', name: '예후 예측' },
    { id: 'segmentation_browser', name: '영상 분할' },
    { id: 'ai_gene_import', name: '유전자 분석' },
    { id: 'ai_sod2_import', name: 'SOD2 평가' },
    
  ];

  // 역할별 기능 섹션은 더 이상 필요 없으므로 제거합니다.

  const handleMenuItemClick = (viewId) => {
    if (onMenuClick) {
      onMenuClick(viewId);
    } else {
      console.warn(`${viewId} 클릭: onMenuClick 핸들러가 전달되지 않았습니다.`);
    }
  };

  const MenuList = ({ items }) => (
    <ul className="menu-list">
      {items.map(func => (
        <li
          key={func.id}
          className={`menu-item ${activeView === func.id ? 'active' : ''}`}
          onClick={() => handleMenuItemClick(func.id)}
        >
          {/* 아이콘 렌더링 부분 삭제 */}
          {func.name}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="sidebar-container" style={style}>
      <div className="profile-section">
        <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px'}}>
          {user.name} 님
        </div>
        <div style={{ fontSize: '0.95rem', color: '#777' }}>
          {user.role || '미정'}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#777', marginTop: '4px' }}>
          사원번호: <span style={{ fontWeight: '500' }}>{user.employee_id}</span>
        </div>
      </div>

      <button
        onClick={() => handleMenuItemClick('main_dashboard')}
        className={`main-action-button ${activeView === 'main_dashboard' ? 'active' : ''}`}
      >
        환자 요약
      </button>

      <div className="menu-group">
        <h5 className="menu-group-title">환자 정보</h5>
        <MenuList items={commonFunctions} />
      </div>

      <div className="menu-group">
        <h5 className="menu-group-title">진단 보조</h5>
        <MenuList items={aiFunctions} />
      </div>

      {/* 역할별 기능 섹션 렌더링 부분을 제거합니다. */}
    </div>
  );
};

export default FunctionSidebar;