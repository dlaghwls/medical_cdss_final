import React, { useState, useEffect } from 'react';
import { fetchTestItems, createLabResults } from '../../services/labApiService';

const LabResultInputForm = ({ order, onBack, onSuccess }) => {
  const [items, setItems] = useState([]);
  const [results, setResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (order) {
      fetchTestItems(order.fields.test_type)
        .then(response => {
          setItems(response.data);
          // 초기 결과 상태 객체 생성
          const initialResults = {};
          response.data.forEach(item => {
            initialResults[item.pk] = '';
          });
          setResults(initialResults);
        })
        .catch(error => console.error("검사 항목 로딩 실패:", error));
    }
  }, [order]);

  const handleResultChange = (itemId, value) => {
    setResults(prevResults => ({
      ...prevResults,
      [itemId]: value,
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // API 형식에 맞게 데이터 변환
    const resultsData = Object.entries(results)
      .filter(([, value]) => value !== '') // 입력된 값만 전송
      .map(([itemId, value]) => ({
        lab_order: order.pk,
        test_item: itemId,
        result_value: value,
        note: '', // 필요시 노트 필드 추가
      }));
      
    if (resultsData.length === 0) {
        setMessage('하나 이상의 결과 값을 입력해주세요.');
        setIsLoading(false);
        return;
    }

    createLabResults(resultsData)
      .then(() => {
        setMessage("결과가 성공적으로 저장되었습니다.");
        setTimeout(onSuccess, 1500); // 1.5초 후 성공 콜백 호출
      })
      .catch(error => {
        setMessage(`오류 발생: ${error.message}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div>
      <button onClick={onBack}>&larr; 목록으로 돌아가기</button>
      <h3>결과 입력</h3>
      {/* TODO: 환자, 검사명 등 order의 상세 정보 표시 */}
      <p><strong>환자:</strong> {order.fields.patient_name || order.fields.patient}</p>
      <p><strong>검사:</strong> {order.fields.test_type_name || order.fields.test_type}</p>
      
      <form onSubmit={handleSubmit}>
        {items.map(item => (
          <div key={item.pk} style={{margin: '10px 0'}}>
            <label htmlFor={item.pk} style={{display: 'inline-block', width: '150px'}}>
              {item.fields.name} ({item.fields.unit})
            </label>
            <input
              type="text"
              id={item.pk}
              value={results[item.pk] || ''}
              onChange={(e) => handleResultChange(item.pk, e.target.value)}
              style={{width: '100px'}}
            />
            <span style={{marginLeft: '10px', color: 'grey'}}>
              (참고: {item.fields.ref_low} ~ {item.fields.ref_high})
            </span>
          </div>
        ))}
        <button type="submit" disabled={isLoading} style={{marginTop: '20px'}}>
          {isLoading ? '저장 중...' : '결과 저장하기'}
        </button>
      </form>
      {message && <p style={{color: message.includes('오류') ? 'red' : 'green'}}>{message}</p>}
    </div>
  );
};

export default LabResultInputForm;