import React from 'react';
import { ROLES } from '../../constants/roles'; 

const FunctionSidebar = ({ user, onMenuClick, style }) => {
  if (!user) return null;

  // 메뉴 데이터 정의
  const commonFunctions = [
    { id: 'vital_signs', name: 'Vital', icon: '❤️' },
    { id: 'pacs_viewer', name: 'PACS', icon: '🖼️' },
    { id: 'lab_results', name: 'LAB(추후 없애야함)', icon: '🔬' },
    { id: 'lab', name: 'LAB', icon: '🔬' },
  ];

  const aiFunctions = [
    { id: 'ai_complication_import', name: '합병증 예측', icon: '🤕' },
    { id: 'ai_death_import', name: '생존 예측', icon: '💀' },
    { id: 'ai_gene_import', name: '유전자 분석', icon: '🧬' },
    { id: 'ai_sod2_import', name: 'SOD2 평가', icon: '📊' },
    { id: 'segmentation', name: '영상 분할(준비중)', icon: '🥟' },
  ];

  let roleSpecificFunctions = [];
  if (user.role === ROLES.NURSE) {
    roleSpecificFunctions = [{ id: 'nurse_tasks', name: '간호사 기능', icon: '🩺' }];
  } else if (user.role === ROLES.DOCTOR) {
    roleSpecificFunctions = [{ id: 'doctor_tasks', name: '의사 기능', icon: '👨‍⚕️' }];
  } else if (user.role === ROLES.TECHNICIAN) {
    roleSpecificFunctions = [{ id: 'technician_tasks', name: '검사 기능', icon: '🧪' }];
  }

  const handleMenuItemClick = (viewId) => {
    if (onMenuClick) {
      onMenuClick(viewId);
    } else {
      console.warn(`${viewId} 클릭: onMenuClick 핸들러가 전달되지 않았습니다.`);
    }
  };

  // 메뉴 리스트를 렌더링하는 헬퍼 컴포넌트
  const MenuList = ({ items }) => (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {items.map(func => (
        <li
          key={func.id}
          onClick={() => handleMenuItemClick(func.id)}
          style={{ padding: '8px', cursor: 'pointer', borderRadius: '4px', marginBottom: '5px', transition: 'background-color 0.2s', fontSize: '0.9em' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e9ecef'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <span style={{ marginRight: '10px' }}>{func.icon}</span>{func.name}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="function-sidebar" style={{ padding: '15px', borderRight: '1px solid #ddd', ...style }}>
      <div className="user-profile" style={{ textAlign: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #ddd' }}>
        <h4>{user.name} 님</h4>
        <p style={{ fontSize: '0.9em', color: '#666' }}>({user.role || '미정'})</p>
        <p style={{ fontSize: '0.8em', color: '#888' }}>사원번호: {user.id}</p>
      </div>

      <hr style={{ margin: '10px 0' }} />
      <h5>공통 기능</h5>
      <MenuList items={commonFunctions} />

      <hr style={{ margin: '10px 0' }} />
      <h5>AI 기능</h5>
      <MenuList items={aiFunctions} />

      {roleSpecificFunctions.length > 0 && (
        <>
          <hr style={{ margin: '10px 0' }} />
          <h5>{user.role} 주요 기능</h5>
          <MenuList items={roleSpecificFunctions} />
        </>
      )}

      <button onClick={() => handleMenuItemClick('main_dashboard')} style={{ marginTop: '20px', width: '100%', padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.9em' }}>
        메인 현황판
      </button>
    </div>
  );
};

export default FunctionSidebar;