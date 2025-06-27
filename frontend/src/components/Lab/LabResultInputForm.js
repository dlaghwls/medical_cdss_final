// src/components/Lab/LabResultInputForm.js (개선)

import React, { useState, useEffect } from 'react';
import { fetchTestItems, createLabResults } from '../../services/labApiService';

// props에서 selectedPatient와 testType을 제거하고 order만 사용합니다.
const LabResultInputForm = ({ order, onBack, onSuccess }) => {
  const [items, setItems] = useState([]);
  const [results, setResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // order 객체에서 필요한 정보만 추출하여 사용합니다.
  const currentOrderPatient = order?.fields?.patient_display_name;
  const currentOrderTestType = order?.fields?.test_type_display_name;
  const currentOrderPK = order?.pk;
  const currentOrderTestTypeUUID = order?.fields?.test_type;

  useEffect(() => {
    if (currentOrderTestTypeUUID) {
      fetchTestItems(currentOrderTestTypeUUID)
        .then(response => {
          setItems(response.data);
          const initialResults = {};
          response.data.forEach(item => {
            initialResults[item.pk] = '';
          });
          setResults(initialResults);
        })
        .catch(error => {
            console.error("검사 항목 로딩 실패:", error);
            setMessage("검사 항목을 불러오는 데 실패했습니다.");
        });
    } else {
        setMessage("유효한 검사 주문 정보가 없습니다.");
    }
  }, [currentOrderTestTypeUUID]); // 의존성 배열에 order 대신 UUID만 포함

  const handleResultChange = (itemId, value) => {
    setResults(prevResults => ({
      ...prevResults,
      [itemId]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("저장 중...");

    if (!currentOrderPK) {
        setMessage('검사 주문 정보가 불완전하여 결과를 저장할 수 없습니다.');
        setIsLoading(false);
        return;
    }

    const resultsData = Object.entries(results)
      .filter(([, value]) => value !== '')
      .map(([itemId, value]) => ({
        lab_order: currentOrderPK,
        test_item: itemId,
        result_value: value,
        note: '',
      }));
      
    if (resultsData.length === 0) {
        setMessage('하나 이상의 결과 값을 입력해주세요.');
        setIsLoading(false);
        return;
    }

    createLabResults(resultsData)
      .then(() => {
        setMessage("결과가 성공적으로 저장되었습니다.");
        setTimeout(() => {
            if (onSuccess) onSuccess();
        }, 3000);
      })
      .catch(error => {
        setMessage(`오류 발생: ${error.message || error}`);
        console.error("결과 저장 실패:", error.response?.data || error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      boxShadow: '0px 2px 8px rgba(0,0,0,.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '0', color: '#333' }}>결과 입력</h3>
        <button
          onClick={onBack}
          style={{
            padding: '8px 15px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9em',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#5a6268'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#6c757d'}
        >
          &larr; 목록으로 돌아가기
        </button>
      </div>

      <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
        <p style={{ margin: '5px 0', fontSize: '1em' }}>
            <strong>환자:</strong> {currentOrderPatient || '환자 정보 없음'}
        </p>
        <p style={{ margin: '5px 0', fontSize: '1em' }}>
            <strong>검사 종류:</strong> {currentOrderTestType || '검사 종류 없음'}
        </p>
        {!currentOrderPK && (
            <p style={{ color: '#dc3545', fontSize: '0.9em' }}>
                ⚠️ 이 검사에는 아직 유효한 주문 ID가 없습니다. 결과 저장 시 오류가 발생할 수 있습니다.
            </p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {items.length === 0 && !isLoading && !message ? (
            <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>
                검사 항목을 불러오는 중이거나, 항목이 없습니다.
            </p>
        ) : (
            items.map(item => (
                <div key={item.pk} style={{ margin: '10px 0', display: 'flex', alignItems: 'center' }}>
                  <label htmlFor={item.pk} style={{ display: 'inline-block', width: '180px', fontWeight: 'bold', color: '#555' }}>
                    {item.fields.name} ({item.fields.unit})
                  </label>
                  <input
                    type="text"
                    id={item.pk}
                    value={results[item.pk] || ''}
                    onChange={(e) => handleResultChange(item.pk, e.target.value)}
                    style={{
                      width: '120px',
                      padding: '8px',
                      fontSize: '0.9em',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ marginLeft: '15px', color: '#888', fontSize: '0.85em' }}>
                    (참고 범위: {item.fields.ref_low} ~ {item.fields.ref_high})
                  </span>
                </div>
            ))
        )}
        
        {message && (
          <div style={{
              marginTop: '15px',
              marginBottom: '15px',
              padding: '10px',
              fontWeight: 'bold',
              fontSize: '0.9em',
              borderRadius: '4px',
              backgroundColor: message.includes('오류') ? '#ffebee' : (message.includes('성공') ? '#e6ffe6' : '#f0f0f0'),
              color: message.includes('오류') ? '#dc3545' : (message.includes('성공') ? '#28a745' : '#6c757d'),
              border: `1px solid ${message.includes('오류') ? '#dc3545' : (message.includes('성공') ? '#28a745' : '#ccc')}`
          }}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !currentOrderPK || items.length === 0}
          style={{
            marginTop: '25px',
            padding: '12px 25px',
            fontSize: '1em',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: (isLoading || !currentOrderPK || items.length === 0) ? '#a0c7ed' : '#28a745',
            borderRadius: '5px',
            border: 'none',
            cursor: (isLoading || !currentOrderPK || items.length === 0) ? 'not-allowed' : 'pointer',
            boxShadow: '0px 2px 5px rgba(0,0,0,.1)',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={e => !isLoading && (e.currentTarget.style.backgroundColor = '#218838')}
          onMouseLeave={e => !isLoading && (e.currentTarget.style.backgroundColor = '#28a745')}
        >
          {isLoading ? '저장 중...' : '결과 저장하기'}
        </button>
      </form>
    </div>
  );
};

export default LabResultInputForm;