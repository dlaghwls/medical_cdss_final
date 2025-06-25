import React, { useState, useEffect } from 'react';
import { fetchPendingOrders } from '../../services/labApiService';
import LabResultInputForm from './LabResultInputForm';

const PendingOrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = () => {
    setIsLoading(true);
    fetchPendingOrders()
      .then(response => {
        setOrders(response.data);
      })
      .catch(error => console.error("대기 중인 검사 목록 로딩 실패:", error))
      .finally(() => setIsLoading(false));
  };
  
  useEffect(() => {
    loadOrders();
  }, []);

  if (selectedOrder) {
    return <LabResultInputForm 
              order={selectedOrder} 
              onBack={() => setSelectedOrder(null)}
              onSuccess={() => {
                setSelectedOrder(null);
                loadOrders(); // 성공 시 목록 새로고침
              }} 
           />;
  }
  
  if (isLoading) {
    return <div>목록을 불러오는 중...</div>;
  }

  return (
    <div>
      <h3>결과 입력 대기 목록</h3>
       <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr style={{borderBottom: '2px solid black', textAlign: 'left'}}>
            <th style={{padding: '8px'}}>환자</th>
            <th style={{padding: '8px'}}>검사 종류</th>
            <th style={{padding: '8px'}}>요청 시간</th>
            <th style={{padding: '8px'}}>작업</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.pk} style={{borderBottom: '1px solid #ccc'}}>
              {/* TODO: API 응답에 patient_name, test_type_name 이 포함되어야 함 */}
              <td style={{padding: '8px'}}>{order.fields.patient_name || order.fields.patient}</td>
              <td style={{padding: '8px'}}>{order.fields.test_type_name || order.fields.test_type}</td>
              <td style={{padding: '8px'}}>{new Date(order.fields.created_at).toLocaleString()}</td>
              <td style={{padding: '8px'}}>
                <button onClick={() => setSelectedOrder(order)}>결과 입력</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PendingOrdersList;