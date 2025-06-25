import React, { useState } from 'react';
import LabOrderForm from './LabOrderForm';
import PatientLabResultsView from './PatientLabResultsView';
import PendingOrdersList from './PendingOrdersList';

const LabPage = ({ user, selectedPatient }) => {
  // TODO: user.role 인증이 구현되면 아래 코드로 교체하세요.
  // const userRole = user?.role; // 'nurse', 'tec'
  
  // 임시 역할 전환기
  const [viewAs, setViewAs] = useState('nurse'); 
  const userRole = viewAs;

  const [activeNurseTab, setActiveNurseTab] = useState('order');

  const renderRoleSwitcher = () => (
    <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', border: '1px solid #ccc' }}>
      <h4>임시 뷰 전환 (개발용)</h4>
      <button onClick={() => setViewAs('nurse')} style={{ backgroundColor: viewAs === 'nurse' ? '#007bff' : 'grey', color: 'white', marginRight: '10px' }}>간호사 뷰</button>
      <button onClick={() => setViewAs('tec')} style={{ backgroundColor: viewAs === 'tec' ? '#007bff' : 'grey', color: 'white' }}>검사 담당자 뷰</button>
      <p style={{marginTop: '5px'}}>현재 뷰: <strong>{viewAs}</strong></p>
    </div>
  );

  const renderNurseView = () => (
    <div>
        <div style={{ marginBottom: '20px' }}>
            <button onClick={() => setActiveNurseTab('order')} style={{ marginRight: '10px', fontWeight: activeNurseTab === 'order' ? 'bold' : 'normal' }}>검사 요청</button>
            <button onClick={() => setActiveNurseTab('results')} style={{ fontWeight: activeNurseTab === 'results' ? 'bold' : 'normal' }}>결과 조회</button>
        </div>
        {activeNurseTab === 'order' ? 
            <LabOrderForm selectedPatient={selectedPatient} user={user} /> :
            <PatientLabResultsView selectedPatient={selectedPatient} />
        }
    </div>
  );

  const renderTechnicianView = () => (
    <PendingOrdersList />
  );

  return (
    <div style={{ padding: '20px' }}>
      {renderRoleSwitcher()}
      <h2>랩 검사 (Lab Tests)</h2>
      
      {/* // user.role 인증 구현 후 사용할 실제 렌더링 로직
        {userRole === 'nurse' && renderNurseView()}
        {userRole === 'tec' && renderTechnicianView()}
        {!userRole && <div>역할이 지정되지 않은 사용자입니다.</div>}
      */}
      
      {/* 임시 렌더링 로직 */}
      {userRole === 'nurse' && renderNurseView()}
      {userRole === 'tec' && renderTechnicianView()}
    </div>
  );
};

export default LabPage;