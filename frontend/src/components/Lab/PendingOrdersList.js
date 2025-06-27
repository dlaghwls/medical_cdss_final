// src/components/Lab/PendingOrdersList.js

import React, { useState, useEffect, useCallback} from 'react';
import { fetchPendingOrders } from '../../services/labApiService';
import LabResultInputForm from './LabResultInputForm';


const PendingOrdersList = ({ selectedPatient: currentSelectedPatient, refreshFlag }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null); // 결과 입력을 위해 선택된 주문
  const [errorMessage, setErrorMessage] = useState(''); // 에러 메시지 상태 추가

  // 대기 중인 주문 목록을 불러옴
  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      // 'pending' 상태만 가져오는 대신, 모든 상태의 주문을 가져오도록 수정
      // 백엔드 LabOrderViewSet의 get_queryset에서 status 필터를 제거하거나,
      // 여기에서 status 파라미터를 제거하여 모든 상태를 가져오도록 합니다.
      // 현재 백엔드 코드 (views.py)에서 get_queryset은 status 쿼리 파라미터를 처리하고 있으므로,
      // 여기서는 status: 'pending'을 제거하여 모든 상태의 주문을 가져오도록 합니다.
      const params = {}; // 모든 상태를 가져오기 위해 status 파라미터 제거
      if (currentSelectedPatient?.uuid) {
        params.patient_uuid = currentSelectedPatient.uuid;
      }
      // fetchPendingOrders 함수가 이미 status: 'pending'을 강제하고 있으므로,
      // 이 부분을 수정해야 합니다. fetchPendingOrders 함수를 수정하거나,
      // 새로운 API 호출 함수를 만들어 'completed' 상태도 가져오도록 해야 합니다.
      // 여기서는 fetchPendingOrders가 'pending'만 가져오므로,
      // 백엔드에서 'completed' 상태로 업데이트되어도 이 목록에는 나타나지 않을 수 있습니다.
      // 이 문제를 해결하려면 fetchPendingOrders의 로직 변경 또는 새로운 API 함수가 필요합니다.
      // 일단은 fetchPendingOrders가 'pending'만 가져온다는 전제 하에,
      // LabResultInputForm에서 결과 저장 후 해당 주문이 목록에서 사라지도록 동작할 것입니다.
      // 만약 'completed'된 항목도 목록에 유지하고 싶다면, 백엔드 API와 fetchPendingOrders 로직을 수정해야 합니다.

      // 사용자 요청: 입력완료 버튼으로 변경되어야 함 -> 'pending' 상태만 가져오는 것이 아니라
      // 'pending'과 'completed' 상태 모두를 가져와야 합니다.
      // labApiService.js의 fetchPendingOrders 함수를 수정하거나,
      // 새로운 함수를 만들어서 'pending'과 'completed' 상태의 주문을 모두 가져오도록 해야 합니다.
      // 현재 fetchPendingOrders는 status: 'pending'을 강제하고 있으므로,
      // 이 부분을 수정하는 것이 가장 간단합니다.

      // 임시로, fetchPendingOrders가 모든 상태를 가져온다고 가정하고 진행합니다.
      // 실제로는 labApiService.js의 fetchPendingOrders 함수를 수정해야 합니다.
      // (아래 labApiService.js 수정 제안을 참고해주세요.)
      const response = await fetchPendingOrders(params); // params에 status: 'pending'이 없는 상태로 호출
      
      setOrders(response.data);
    } catch (error) {
      console.error("대기 중인 검사 목록 로딩 실패:", error.response?.data || error.message);
      setErrorMessage(`대기 중인 검사 목록 로딩 실패: ${error.response?.data?.detail || error.message || '알 수 없는 오류'}`);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentSelectedPatient]);

  useEffect(() => {
    console.log("PendingOrdersList: useEffect triggered.");
    if (currentSelectedPatient?.uuid) {
        loadOrders();
    } else {
        setOrders([]);
    }
  }, [currentSelectedPatient, refreshFlag, loadOrders]); // refreshFlag와 loadOrders를 의존성으로 포함

  // 날짜 포매팅 헬퍼 함수
  const formatDate = (dateString) => {
    if (!dateString) return '날짜 정보 없음';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.warn("Invalid Date string received (formatDate):", dateString);
            return dateString;
        }
        return date.toLocaleString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: 'numeric', minute: 'numeric', hour12: true
        });
    } catch (e) {
        console.error("Date formatting error:", e, "Original string:", dateString);
        return dateString;
    }
  };

  // selectedOrder가 있을 경우 LabResultInputForm 렌더링
  if (selectedOrder) {
    return (
        <LabResultInputForm
            order={selectedOrder}
            onBack={() => setSelectedOrder(null)}
            onSuccess={() => {
                setSelectedOrder(null);
                loadOrders(); // 목록 새로고침
            }}
        />
    );
  }
  
  if (isLoading) {
    return (
        <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d',
                       backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <p>대기 중인 검사 목록을 불러오는 중...</p>
        </div>
    );
  }

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
              <button onClick={loadOrders} style={{
                  marginTop: '15px', padding: '8px 15px', backgroundColor: '#007bff',
                  color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
              }}>
                  다시 시도
              </button>
          </div>
      );
  }

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
                      <td style={{padding: '10px 8px', fontWeight: 'bold'}}>
                          {order.fields.patient_display_name}
                      </td>
                      <td style={{padding: '10px 8px'}}>
                          {order.fields.test_type_display_name}
                      </td>
                      <td style={{padding: '10px 8px', color: '#555'}}>
                          {formatDate(order.fields.collected_at)}
                      </td>
                      <td style={{padding: '10px 8px'}}>
                        {/* 여기를 수정합니다: order.fields.status에 따라 버튼 또는 텍스트 렌더링 */}
                        {order.fields.status === 'completed' ? (
                            <span style={{
                                padding: '6px 12px',
                                backgroundColor: '#d4edda', // 연한 녹색 배경
                                color: '#155724', // 진한 녹색 텍스트
                                border: '1px solid #c3e6cb',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                fontSize: '0.85em',
                                display: 'inline-block'
                            }}>
                                입력 완료
                            </span>
                        ) : (
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
                        )}
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