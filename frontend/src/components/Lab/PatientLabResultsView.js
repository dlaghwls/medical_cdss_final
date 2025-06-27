// src/components/Lab/PatientLabResultsView.js (개선 - 시각적 정보 추가)
import React, { useState, useEffect, useMemo, useCallback } from 'react'; // useCallback 추가
import { fetchPatientResults } from '../../services/labApiService';
import LabResultDetailModal from './LabResultDetailModal'; // 모달 컴포넌트 임포트

const LAST_VIEWED_RESULT_DATE_KEY = 'lastViewedLabResultDate';

const PatientLabResultsView = ({ selectedPatient, resultsRefreshFlag }) => {
  const [allRawResults, setAllRawResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderGroup, setSelectedOrderGroup] = useState(null);
  const [lastViewedDate, setLastViewedDate] = useState(null); // 마지막으로 확인한 결과 날짜

  // 마지막으로 확인한 결과 날짜 로드
  useEffect(() => {
    if (selectedPatient?.uuid) {
      const storedDate = localStorage.getItem(`${LAST_VIEWED_RESULT_DATE_KEY}_${selectedPatient.uuid}`);
      if (storedDate) {
        setLastViewedDate(new Date(storedDate));
      } else {
        setLastViewedDate(null);
      }
    }
  }, [selectedPatient]);

  // 1. API 호출 및 원본 데이터 저장
  // useCallback으로 래핑하여 불필요한 재생성 방지
  const loadResults = useCallback(async () => {
    if (selectedPatient?.uuid) {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const response = await fetchPatientResults(selectedPatient.uuid);
        console.log("PatientLabResultsView: Raw API response data (all results from API):", response.data);
        response.data.forEach(item => {
            console.log("  Raw Item: PK:", item.pk, "Order ID:", item.fields.lab_order, "Type:", item.fields.test_type_display_name, "Item:", item.fields.test_item_name, "Value:", item.fields.result_value);
        });
        setAllRawResults(response.data);
      } catch (error) {
        console.error("PatientLabResultsView: 결과 조회 실패:", error);
        setErrorMessage("환자 검사 결과를 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setAllRawResults([]);
    }
  }, [selectedPatient]); // selectedPatient가 변경될 때만 loadResults 함수 재생성

  useEffect(() => {
    loadResults();
  }, [selectedPatient, resultsRefreshFlag, loadResults]); // loadResults를 의존성에 추가

  // 2. allRawResults를 기반으로 검사 주문별로 그룹화 및 정렬
  const sortedGroupedResults = useMemo(() => {
    const groupedByOrderId = allRawResults.reduce((acc, resultItem) => {
      const orderId = resultItem.fields.lab_order;
      const reportedAt = resultItem.fields.reported_at || new Date(0).toISOString();
      const testTypeDisplayName = resultItem.fields.test_type_display_name;

      if (!acc[orderId]) {
        acc[orderId] = {
          order_id: orderId,
          reported_at: reportedAt,
          test_type_display_name: testTypeDisplayName,
          items: []
        };
      }
      acc[orderId].items.push({
        pk: resultItem.pk,
        ...resultItem.fields
      });
      return acc;
    }, {});

    const sortedGroups = Object.values(groupedByOrderId).sort((a, b) => {
      const dateA = new Date(a.reported_at);
      const dateB = new Date(b.reported_at);
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;
      return dateB.getTime() - dateA.getTime();
    });

    console.log("PatientLabResultsView: Grouped and Sorted Results (for rendering list):", sortedGroups);
    sortedGroups.forEach(group => {
      console.log(`  Group: ${group.test_type_display_name} (Order ID: ${group.order_id}), Items Count: ${group.items.length}`);
    });

    return sortedGroups;
  }, [allRawResults]);

  // 날짜 형식 지정 함수 (목록 표시용, 시간 생략)
  const formatDateForList = (dateString) => {
    if (!dateString) return '날짜 정보 없음';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // 모달 열기 함수: 클릭된 orderGroup 데이터를 모달에 전달
  const handleOpenModal = (orderGroup) => {
    setSelectedOrderGroup(orderGroup);
    setIsModalOpen(true);

    // 모달을 열 때, 가장 최근의 결과를 '확인한' 것으로 간주하고 날짜를 업데이트
    const latestResultDate = sortedGroupedResults[0]?.reported_at;
    if (latestResultDate) {
        localStorage.setItem(`${LAST_VIEWED_RESULT_DATE_KEY}_${selectedPatient.uuid}`, latestResultDate);
        setLastViewedDate(new Date(latestResultDate));
    }
  };

  // 모달 닫기 함수
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrderGroup(null);
  };

  // 새로운 결과 개수 계산
  const newResultsCount = useMemo(() => {
    if (!lastViewedDate) return sortedGroupedResults.length; // 이전에 본 기록이 없으면 모두 새로움

    return sortedGroupedResults.filter(group => {
      const reportedAtDate = new Date(group.reported_at);
      return reportedAtDate.getTime() > lastViewedDate.getTime();
    }).length;
  }, [sortedGroupedResults, lastViewedDate]);

  const totalResultsCount = sortedGroupedResults.length;
  const reviewedResultsCount = totalResultsCount - newResultsCount;


  // 렌더링 조건부 로직
  if (!selectedPatient) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
        결과를 조회할 환자를 먼저 선택해주세요.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
        결과를 불러오는 중...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>
        {errorMessage}
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      boxShadow: '0px 2px 8px rgba(0,0,0,.05)',
      flexGrow: 1,
      minHeight: 0,
      overflowY: 'auto'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>
        {selectedPatient.display} 님 검사 결과 목록
      </h3>
      
      {/* 결과 요약 정보 */}
      <div style={{ marginBottom: '20px', padding: '10px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-around', fontSize: '0.95em' }}>
        <span style={{ color: '#007bff', fontWeight: 'bold' }}>
          총 결과: {totalResultsCount} 건
        </span>
        <span style={{ color: '#28a745', fontWeight: 'bold' }}>
          확인한 결과: {reviewedResultsCount} 건
        </span>
        <span style={{ color: '#ffc107', fontWeight: 'bold' }}>
          새로운 결과: {newResultsCount} 건
        </span>
      </div>

      {sortedGroupedResults.length === 0 ? (
        <p style={{ color: '#6c757d', textAlign: 'center' }}>표시할 검사 결과가 없습니다.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {sortedGroupedResults.map(orderGroup => {
            const isNew = lastViewedDate && (new Date(orderGroup.reported_at).getTime() > lastViewedDate.getTime());
            return (
              <div
                key={orderGroup.order_id}
                onClick={() => handleOpenModal(orderGroup)}
                style={{
                  border: isNew ? '2px solid #ffc107' : '1px solid #e9ecef', // 새로운 결과는 강조된 테두리
                  borderRadius: '8px',
                  padding: '15px 20px',
                  backgroundColor: isNew ? '#fffbe6' : '#fff', // 새로운 결과는 연한 노란색 배경
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s, border 0.2s, background-color 0.2s',
                  ':hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <h4 style={{ margin: 0, color: '#333', fontSize: '1.1em' }}>
                    {orderGroup.test_type_display_name}
                    {isNew && (
                        <span style={{
                            marginLeft: '10px',
                            backgroundColor: '#ffc107',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '5px',
                            fontSize: '0.75em',
                            fontWeight: 'bold'
                        }}>
                            New
                        </span>
                    )}
                  </h4>
                  <span style={{ fontSize: '0.9em', color: '#6c757d' }}>
                    {formatDateForList(orderGroup.reported_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LabResultDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        orderGroup={selectedOrderGroup}
        allPatientResults={allRawResults}
      />
    </div>
  );
};

export default PatientLabResultsView;
