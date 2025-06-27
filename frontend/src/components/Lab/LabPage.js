// src/components/Lab/LabPage.js (개선 - 최종)

import React, { useState, useCallback } from 'react';
import LabOrderForm from './LabOrderForm';
import PatientLabResultsView from './PatientLabResultsView';
import PendingOrdersList from './PendingOrdersList';

const LabPage = ({ user, selectedPatient }) => {
  const [activeTab, setActiveTab] = useState('request');
  const [orderRefreshFlag, setOrderRefreshFlag] = useState(0);
  const [resultsRefreshFlag, setResultsRefreshFlag] = useState(0); // 결과 조회를 위한 플래그 추가

  const tabStyle = (isActive) => ({
    padding: '12px 20px',
    marginRight: '5px',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: isActive ? '#007bff' : '#f8f9fa',
    color: isActive ? 'white' : '#495057',
    borderRadius: '8px 8px 0 0',
    fontWeight: isActive ? 'bold' : 'normal',
    fontSize: '14px',
    transition: 'all 0.2s ease-in-out',
    border: isActive ? '2px solid #007bff' : '2px solid #dee2e6',
    borderBottom: isActive ? '2px solid white' : '2px solid #dee2e6'
  });

  // 검사 요청 성공 시 PendingOrdersList 및 PatientLabResultsView 갱신을 트리거합니다.
  const handleOrderSuccess = useCallback(() => {
    setOrderRefreshFlag(prev => prev + 1); // PendingOrdersList 갱신
    setResultsRefreshFlag(prev => prev + 1); // PatientLabResultsView 갱신 (선택 사항)
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // 탭 변경 시에도 대기 목록 및 결과 목록 갱신 (필요시)
    setOrderRefreshFlag(prev => prev + 1);
    setResultsRefreshFlag(prev => prev + 1);
  };

  if (!selectedPatient) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '50px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h3 style={{ color: '#6c757d' }}>환자를 선택해주세요</h3>
        <p style={{ color: '#6c757d' }}>
          왼쪽 사이드바에서 환자를 선택하면 랩 검사 관리를 시작할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h3 style={{ margin: 0, color: '#333' }}>랩 검사 관리</h3>
        <div style={{ fontSize: '0.9em', color: '#6c757d', textAlign: 'right' }}>
          <strong>환자:</strong> {selectedPatient.display}<br />
          <small>UUID: {selectedPatient.uuid.substring(0, 8)}...</small>
        </div>
      </div>

      <div style={{
        marginBottom: '20px',
        borderBottom: '2px solid #dee2e6',
        paddingBottom: '0'
      }}>
        <button onClick={() => handleTabChange('request')} style={tabStyle(activeTab === 'request')}>
          검사 요청
        </button>
        <button onClick={() => handleTabChange('view')} style={tabStyle(activeTab === 'view')}>
          결과 조회
        </button>
      </div>

      <div style={{
        flexGrow: 1,
        minHeight: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {activeTab === 'request' && (
          <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '4px' }}>
            <LabOrderForm
              selectedPatient={selectedPatient}
              user={user}
              onOrderSuccess={handleOrderSuccess}
            />
            <div style={{
              marginTop: '30px',
              padding: '20px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: '#ffffff'
            }}>
              <h4 style={{ marginBottom: '15px' }}>대기 중인 검사 요청 목록</h4>
              <PendingOrdersList
                selectedPatient={selectedPatient}
                refreshFlag={orderRefreshFlag}
              />
            </div>
          </div>
        )}

        {activeTab === 'view' && (
          <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '4px' }}>
            <PatientLabResultsView selectedPatient={selectedPatient} refreshFlag={resultsRefreshFlag} />
          </div>
        )}
      </div>
    </div>
  );
};

export default LabPage;
