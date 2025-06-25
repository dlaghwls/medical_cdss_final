import React, { useState, useEffect } from 'react';
import { fetchPatientResults } from '../../services/labApiService';

const PatientLabResultsView = ({ selectedPatient }) => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedPatient) {
      setIsLoading(true);
      fetchPatientResults(selectedPatient.uuid)
        .then(response => {
          // TODO: 실제 데이터 구조에 맞게 그룹화 필요
          setResults(response.data);
        })
        .catch(error => console.error("결과 조회 실패:", error))
        .finally(() => setIsLoading(false));
    }
  }, [selectedPatient]);

  if (!selectedPatient) {
    return <div>결과를 조회할 환자를 먼저 선택해주세요.</div>;
  }

  if (isLoading) {
    return <div>결과를 불러오는 중...</div>;
  }

  return (
    <div>
      <h3>{selectedPatient.display} 님 검사 결과</h3>
      {results.length === 0 ? (
        <p>표시할 검사 결과가 없습니다.</p>
      ) : (
        <ul>
          {/* TODO: 이 부분은 API 응답 데이터 구조에 맞춰서 더 보기 좋게 만들어야 합니다. */}
          {results.map((result, index) => (
            <li key={index}>
              {result.fields.test_item_name}: <strong>{result.fields.result_value}</strong> ({result.fields.reported_at})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PatientLabResultsView;