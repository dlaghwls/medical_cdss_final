import React, { useState } from 'react';

import LabOrderForm from './LabOrderForm';
import PatientLabResultsView from './PatientLabResultsView';
import LabResultInputForm from './LabResultInputForm';
import PendingOrdersList from './PendingOrdersList';

const LabPage = ({ user, selectedPatient }) => {
  // 'request': 검사 요청 탭
  // 'view': 결과 조회 탭
  const [activeTab, setActiveTab] = useState('request'); 

  // '검사 요청' 후 하단에 결과 입력 폼을 띄울지 여부
  const [showInputFormAfterOrder, setShowInputFormAfterOrder] = useState(false);
  // '검사 요청' 후 결과 입력 폼에 미리 채워질 검사 종류
  const [testTypeFromOrdered, setTestTypeFromOrdered] = useState(null);


  // GeneManagementView와 유사한 탭 스타일 함수
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

  // LabOrderForm에서 검사 요청 성공 시 호출될 콜백 함수
  const handleOrderSuccess = (orderedTestType) => {
    // 검사 요청 성공 시 해당 검사 종류의 결과 입력 폼을 하단에 띄우기
    setTestTypeFromOrdered(orderedTestType);
    setShowInputFormAfterOrder(true);
    // 요청 성공 후 스크롤을 결과 입력 폼으로 이동시키는 로직을 추가할 수도 있습니다.
    // 예: setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 100);
  };

  // 탭 변경 시 상태 초기화
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    // 탭이 바뀌면 요청 후 입력 폼 상태 초기화 (다른 탭으로 이동하면 입력 폼은 숨김)
    setShowInputFormAfterOrder(false);
    setTestTypeFromOrdered(null);
  };


  // 환자가 선택되지 않았을 때 표시할 메시지
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
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
          {/* 페이지 제목 및 선택된 환자 정보 */}
          <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '2px solid #e9ecef'
          }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, color: '#333' }}>
                      랩 검사 관리
                  </h3>
              </div>
              <div style={{ 
                  fontSize: '0.9em', 
                  color: '#6c757d',
                  textAlign: 'right'
              }}>
                  <strong>환자:</strong> {selectedPatient.display}<br/>
                  <small>UUID: {selectedPatient.uuid.substring(0, 8)}...</small>
              </div>
          </div>

          {/* 탭 네비게이션 */}
          <div style={{ 
              marginBottom: '20px',
              borderBottom: '2px solid #dee2e6',
              paddingBottom: '0'
          }}>
              <button 
                  onClick={() => handleTabChange('request')}
                  style={tabStyle(activeTab === 'request')}
              >
                  검사 요청
              </button>
              <button 
                  onClick={() => handleTabChange('view')}
                  style={tabStyle(activeTab === 'view')}
              >
                  결과 조회
              </button>
          </div>

          {/* 탭 내용 */}
          <div style={{ 
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '0 8px 8px 8px',
              minHeight: '400px'
          }}>
              {/* '검사 요청' 탭 내용 */}
              {activeTab === 'request' && (
                  <>
                      {/* LabOrderForm에 검사 요청 성공 시 호출될 콜백 함수 전달 */}
                      <LabOrderForm 
                          selectedPatient={selectedPatient} 
                          user={user} 
                          onOrderSuccess={handleOrderSuccess} 
                      />
                      {/* 검사 요청 후 결과 입력 폼이 필요한 경우 렌더링 */}
                      {showInputFormAfterOrder && (
                          <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                              <h4 style={{ marginBottom: '15px' }}>요청된 검사 ({testTypeFromOrdered ? testTypeFromOrdered : '종류 알 수 없음'}) 결과 입력</h4>
                              <LabResultInputForm 
                                  selectedPatient={selectedPatient} 
                                  testType={testTypeFromOrdered} 
                                  // 결과 입력 후 입력 폼을 숨기거나 메시지를 표시할 콜백을 추가할 수 있습니다.
                                  // onResultSubmitSuccess={() => setShowInputFormAfterOrder(false)}
                              />
                          </div>
                      )}
                      {/* 여기에 PendingOrdersList를 넣는다면, '검사 요청' 탭에 요청 목록이 함께 보이게 됩니다. */}
                      <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                          <h4 style={{ marginBottom: '15px' }}>대기 중인 검사 요청 목록</h4>
                          {/* PendingOrdersList에 selectedPatient prop을 넘겨 필터링 가능하게 할 수도 있습니다. */}
                          <PendingOrdersList selectedPatient={selectedPatient} />
                      </div>
                  </>
              )}

              {/* '결과 조회' 탭 내용 */}
              {activeTab === 'view' && (
                  <PatientLabResultsView selectedPatient={selectedPatient} />
              )}
          </div>
      </div>
  );
};

export default LabPage;