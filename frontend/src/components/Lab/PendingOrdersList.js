// src/components/Lab/PendingOrdersList.js

import React, { useState, useEffect } from 'react';
// fetchTestTypes를 사용하여 검사 종류 이름을 매핑할 것입니다.
import { fetchPendingOrders, fetchTestTypes } from '../../services/labApiService'; 
import LabResultInputForm from './LabResultInputForm';

// LabPage로부터 selectedPatient prop을 받도록 변경합니다.
const PendingOrdersList = ({ selectedPatient: currentSelectedPatient }) => { 
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null); // 결과 입력을 위해 선택된 주문
  const [testTypesMap, setTestTypesMap] = useState({}); // 검사 종류 UUID -> 이름 매핑 맵
  const [errorMessage, setErrorMessage] = useState(''); // 에러 메시지 상태 추가

  // 1. 모든 검사 종류를 불러와 매핑 맵 생성
  useEffect(() => {
    const loadTestTypes = async () => {
      try {
        const response = await fetchTestTypes();
        const map = {};
        response.data.forEach(type => {
          map[type.pk] = type.fields.name; // UUID를 키로, 이름을 값으로 저장
        });
        setTestTypesMap(map);
      } catch (error) {
        console.error("검사 종류 불러오기 실패:", error);
        setErrorMessage("검사 종류를 불러오는 데 실패했습니다.");
      }
    };
    loadTestTypes();
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 2. 대기 중인 주문 목록을 불러옴
  const loadOrders = async () => {
    setIsLoading(true);
    setErrorMessage(''); // 새 로딩 시작 시 에러 메시지 초기화
    try {
      // fetchPendingOrders 함수가 patient_uuid를 인자로 받아 필터링할 수 있도록 수정되어야 합니다.
      // 현재 API는 params: { status: 'pending' }만 있지만, 만약 patient_uuid 필터링이 필요하다면
      // 백엔드 API와 labApiService의 fetchPendingOrders 함수를 수정해야 합니다.
      const response = await fetchPendingOrders(); 
      
      // Django processApiResponse에서 이미 { pk, fields: {...} } 형태로 가공되어 오므로 바로 사용
      const processedOrders = response.data.map(order => {
        // 환자 UUID와 검사 종류 UUID를 이름으로 변환합니다.
        // patient_name_display 또는 patient_name 필드가 API 응답에 직접 포함되어 오면 더 좋습니다.
        // 현재 스크린샷과 API 응답을 가정하여 order.fields.patient와 order.fields.test_type 사용
        return {
          ...order,
          fields: {
            ...order.fields,
            // 환자 이름: order.fields.patient_display_name 또는 order.fields.patient에서 직접 가져오기
            // 스크린샷에 "1000TEST1 - 하늘 김"처럼 나오는 것이 patient 필드라고 가정
            patient_display_name: order.fields.patient_name || order.fields.patient || '알 수 없음',
            // 검사 종류 이름: testTypesMap을 사용하여 UUID를 이름으로 변환
            test_type_display_name: testTypesMap[order.fields.test_type] || order.fields.test_type || '알 수 없음',
          }
        };
      });
      setOrders(processedOrders);
    } catch (error) {
      console.error("대기 중인 검사 목록 로딩 실패:", error);
      setErrorMessage(`대기 중인 검사 목록 로딩 실패: ${error.message || '알 수 없는 오류'}`);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 선택된 환자 또는 testTypesMap이 변경될 때 주문 목록을 다시 불러옴
  useEffect(() => {
    // testTypesMap이 로드된 후에만 주문을 로드하여 검사 종류 이름 매핑이 가능하게 합니다.
    if (Object.keys(testTypesMap).length > 0) { 
        loadOrders();
    }
    // TODO: 만약 특정 환자 필터링이 백엔드에서 구현된다면, [currentSelectedPatient, testTypesMap]으로 변경
  }, [testTypesMap]); // testTypesMap이 로드되거나 변경될 때마다 실행

  // 날짜 포매팅 헬퍼 함수
  const formatDate = (dateString) => {
    if (!dateString) return '날짜 정보 없음';
    try {
        // Django DateTimeField는 기본적으로 ISO 8601 형식 (예: "2025-06-26T17:21:00Z")을 반환합니다.
        // 이 형식은 new Date()가 직접 파싱할 수 있어야 합니다.
        const date = new Date(dateString);
        if (isNaN(date.getTime())) { // Invalid Date 체크
            // 만약 '2025년 6월 26일 5:21 오후' 같은 사용자 친화적 형식으로 온다면
            // 직접 파싱 로직이 필요할 수 있습니다.
            // 하지만 API 응답은 ISO 형식을 따르는 것이 일반적이므로 이 부분을 더 간소화합니다.
            console.warn("Invalid Date string received:", dateString);
            return dateString; // 파싱 실패 시 원본 문자열 반환
        }
        // 한국어 로케일로 변환하여 보기 좋게 표시
        return date.toLocaleString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: 'numeric', minute: 'numeric', hour12: true
        });
    } catch (e) {
        console.error("Date formatting error:", e, "Original string:", dateString);
        return dateString; // 에러 발생 시 원본 문자열 반환
    }
  };

  // selectedOrder가 있을 경우 LabResultInputForm 렌더링
  if (selectedOrder) {
    return (
        <LabResultInputForm 
            // LabResultInputForm은 이제 order 객체만으로도 환자 정보와 검사 종류를 추출할 수 있습니다.
            order={selectedOrder} 
            onBack={() => setSelectedOrder(null)} // 뒤로가기 버튼 클릭 시 목록으로 돌아가기
            onSuccess={() => { // 결과 입력 성공 시
                setSelectedOrder(null); // 입력 폼 닫기
                loadOrders(); // 목록 새로고침
            }} 
        />
    );
  }
  
  // 로딩 중일 때 표시
  if (isLoading) {
    return (
        <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d', 
                       backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <p>대기 중인 검사 목록을 불러오는 중...</p>
        </div>
    );
  }

  // 오류 메시지가 있을 때 표시
  if (errorMessage) {
      return (
          <div style={{ 
              padding: '20px', 
              border: '1px solid #dc3545', 
              borderRadius: '8px', 
              backgroundColor: '#ffebee',
              textAlign: 'center',
              color: '#dc3545',
              fontWeight: 'bold'
          }}>
              <p>{errorMessage}</p>
              {/* 오류 발생 시에도 다시 시도할 수 있도록 버튼 제공 */}
              <button onClick={loadOrders} style={{
                  marginTop: '15px', padding: '8px 15px', backgroundColor: '#007bff',
                  color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
              }}>
                  다시 시도
              </button>
          </div>
      );
  }

  // 환자가 선택되지 않았을 때 표시
  if (!currentSelectedPatient) {
      return (
          <div style={{ 
              padding: '20px', 
              border: '1px solid #e0e0e0', 
              borderRadius: '8px', 
              backgroundColor: '#ffffff',
              textAlign: 'center',
              color: '#6c757d'
          }}>
              <p>환자를 선택해야 대기 중인 검사 목록을 볼 수 있습니다.</p>
          </div>
      );
  }


  // 기본 목록 렌더링
  return (
    <div style={{ 
        padding: '20px', 
        backgroundColor: '#ffffff', 
        borderRadius: '8px', 
        border: '1px solid #e0e0e0', 
        boxShadow: '0px 2px 8px rgba(0,0,0,.05)' 
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>결과 입력 대기 목록</h3>
       {orders.length === 0 ? (
           <p style={{ color: '#6c757d', textAlign: 'center' }}>
               선택된 환자의 대기 중인 검사 요청이 없습니다.
           </p>
       ) : (
           <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.9em'}}>
            <thead>
              <tr style={{borderBottom: '2px solid #e9ecef', textAlign: 'left', backgroundColor: '#f8f9fa'}}>
                <th style={{padding: '12px 8px', color: '#495057'}}>환자</th>
                <th style={{padding: '12px 8px', color: '#495057'}}>검사 종류</th>
                <th style={{padding: '12px 8px', color: '#495057'}}>요청 시간</th>
                <th style={{padding: '12px 8px', color: '#495057'}}>작업</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                    <tr key={order.pk} style={{borderBottom: '1px solid #eee', transition: 'background-color 0.2s'}}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      {/* order.fields.patient_display_name 또는 order.fields.patient를 사용하여 환자 이름 표시 */}
                      <td style={{padding: '10px 8px', fontWeight: 'bold'}}>
                          {order.fields.patient_display_name || order.fields.patient || '정보 없음'}
                      </td>
                      {/* testTypesMap을 사용하여 검사 종류 UUID를 이름으로 변환 */}
                      <td style={{padding: '10px 8px'}}>
                          {order.fields.test_type_display_name || testTypesMap[order.fields.test_type] || order.fields.test_type || '알 수 없음'}
                      </td>
                      {/* formatDate 함수를 사용하여 요청 시간 표시 */}
                      <td style={{padding: '10px 8px', color: '#555'}}>
                          {formatDate(order.fields.created_at)}
                      </td>
                      <td style={{padding: '10px 8px'}}>
                        <button 
                            onClick={() => setSelectedOrder(order)}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85em',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0056b3'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#007bff'}
                        >
                            결과 입력
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
       )}
    </div>
  );
};

export default PendingOrdersList;