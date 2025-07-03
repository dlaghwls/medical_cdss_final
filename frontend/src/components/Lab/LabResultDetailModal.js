// src/components/Lab/LabResultDetailModal.js (최종 수정 버전 - Hooks 규칙 준수)
import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const LabResultDetailModal = ({ isOpen, onClose, orderGroup, allPatientResults = [] }) => {
  const [showChartModal, setShowChartModal] = useState(false);
  const [selectedTestItemForChart, setSelectedTestItemForChart] = useState(null);
  const [itemTrendData, setItemTrendData] = useState([]);
  const [previousResult, setPreviousResult] = useState(null);

    const handleItemClick = (item) => {
    setSelectedTestItemForChart(item);
    setShowChartModal(true); // 차트 모달 열기
  };

  const handleCloseChartModal = () => {
    setShowChartModal(false);
    setSelectedTestItemForChart(null);
    setItemTrendData([]); // 차트 데이터 초기화
    setPreviousResult(null); // 이전 결과 초기화
  };

  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return '날짜 정보 없음';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
        ...(includeTime && { hour: '2-digit', minute: '2-digit', hour12: true })
      });
    } catch (e) {
      return dateString;
    }
  };

  const getResultValueStyle = (value, refLow, refHigh) => {
    const numValue = parseFloat(value);
    const numRefLow = parseFloat(refLow);
    const numRefHigh = parseFloat(refHigh);
    if (isNaN(numValue) || isNaN(numRefLow) || isNaN(numRefHigh)) {
      return { color: '#333' };
    }
    if (numValue < numRefLow) {
      return { color: 'blue', fontWeight: 'bold' };
    } else if (numValue > numRefHigh) {
      return { color: 'red', fontWeight: 'bold' };
    } else {
      return { color: '#333' };
    }
  };

  // 💡 useEffect는 이제 항상 호출되지만, 내부 로직은 조건부로 실행됩니다.
  useEffect(() => {
    if (!isOpen || !orderGroup || !selectedTestItemForChart || allPatientResults.length === 0) {
      setItemTrendData([]);
      setPreviousResult(null);
      return;
    }

    const itemUuid = selectedTestItemForChart.test_item;
    const currentItemValue = parseFloat(selectedTestItemForChart.result_value);
    const currentReportedDateMs = new Date(orderGroup.reported_at || new Date().toISOString()).getTime();

    const trend = allPatientResults
      .filter(result => result.fields.test_item === itemUuid)
      .map(result => ({
        date: new Date(result.fields.reported_at || result.fields.collected_at).getTime(),
        value: parseFloat(result.fields.result_value),
        reportedAt: result.fields.reported_at || result.fields.collected_at
      }))
      .filter(data => !isNaN(data.value) && !isNaN(data.date))
      .sort((a, b) => a.date - b.date);

    setItemTrendData(trend);

    let foundPreviousResult = null;
    let foundCurrentResultIndex = -1;

    for (let i = trend.length - 1; i >= 0; i--) {
        if (trend[i].date === currentReportedDateMs && trend[i].value === currentItemValue) {
            foundCurrentResultIndex = i;
            break;
        }
    }

    if (foundCurrentResultIndex > 0) {
        foundPreviousResult = trend[foundCurrentResultIndex - 1];
    }

    setPreviousResult(foundPreviousResult);

  }, [isOpen, orderGroup, selectedTestItemForChart, allPatientResults]); // 모든 관련 prop/상태를 의존성에 포함

  // 💡 모달이 열려있지 않으면 아무것도 렌더링하지 않습니다.
  // 이 return null은 훅 호출 후에 와야 합니다.
  if (!isOpen || !orderGroup) {
      return null;
  }

  // 인라인 스타일 객체 정의
  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '80vh',
    overflowY: 'auto',
    position: 'relative',
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '1.5em',
    cursor: 'pointer',
    color: '#666',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9em',
    marginTop: '15px',
  };

  const thStyle = {
    padding: '10px 15px',
    color: '#495057',
    textAlign: 'left',
    borderBottom: '1px solid #e9ecef',
  };

  const trClickableStyle = {
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  };

  const trHoverStyle = {
    backgroundColor: '#f8f9fa',
  };

  const tdStyle = {
    padding: '8px 15px',
    borderBottom: '1px solid #eee',
  };

  const formatXAxis = (tickItem) => {
    if (!tickItem) return '';
    try {
      return new Date(tickItem).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const getDiffStyle = (diffValue) => {
      if (isNaN(diffValue)) return { color: '#6c757d' };
      if (diffValue > 0) return { color: 'red', fontWeight: 'bold' };
      if (diffValue < 0) return { color: 'blue', fontWeight: 'bold' };
      return { color: '#333' };
  };

  return (
    <>
      <div style={modalOverlayStyle} onClick={onClose}>
        <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
          <button style={closeButtonStyle} onClick={onClose}>&times;</button>
          <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>
            {orderGroup.test_type_display_name} 상세 결과
          </h3>
          <p style={{ fontSize: '0.9em', color: '#6c757d', marginBottom: '20px' }}>
            보고 시간: {formatDate(orderGroup.reported_at, true)}
          </p>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>검사 항목</th>
                <th style={thStyle}>결과값</th>
                <th style={thStyle}>측정단위</th>
                <th style={thStyle}>정상범위</th>
                <th style={thStyle}>직전 대비</th>
              </tr>
            </thead>
            <tbody>
              {orderGroup.items.map(item => {
                const currentReportedDateMs = new Date(orderGroup.reported_at || new Date().toISOString()).getTime();
                const currentItemValue = parseFloat(item.result_value);

                const allResultsForItem = allPatientResults
                  .filter(result => result.fields.test_item === item.test_item)
                  .map(result => ({
                    date: new Date(result.fields.reported_at || result.fields.collected_at).getTime(),
                    value: parseFloat(result.fields.result_value),
                  }))
                  .filter(data => !isNaN(data.value) && !isNaN(data.date))
                  .sort((a, b) => a.date - b.date);

                let previousValueComparison = 'N/A';
                
                let currentIndex = -1;
                for (let i = 0; i < allResultsForItem.length; i++) {
                    if (allResultsForItem[i].date === currentReportedDateMs && allResultsForItem[i].value === currentItemValue) {
                        currentIndex = i;
                        break;
                    }
                }

                if (currentIndex > 0) {
                    const previousItemValue = allResultsForItem[currentIndex - 1].value;
                    const diff = currentItemValue - previousItemValue;
                    const sign = diff > 0 ? '+' : '';
                    previousValueComparison = `${sign}${diff.toFixed(2)}`;
                } else if (allResultsForItem.length === 1 && currentIndex === 0) {
                    previousValueComparison = 'N/A';
                }

                return (
                  <tr
                    key={item.pk}
                    onClick={() => handleItemClick(item)}
                    style={trClickableStyle}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = trHoverStyle.backgroundColor}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ ...tdStyle, fontWeight: 'bold' }}>{item.test_item_name}</td>
                    <td style={{ ...tdStyle, ...getResultValueStyle(item.result_value, item.test_item_ref_low, item.test_item_ref_high) }}>
                      {item.result_value}
                    </td>
                    <td style={tdStyle}>{item.test_item_unit}</td>
                    <td style={{ ...tdStyle, color: '#555' }}>
                      {item.test_item_ref_low} ~ {item.test_item_ref_high}
                    </td>
                    <td style={{ ...tdStyle, ...getDiffStyle(parseFloat(previousValueComparison)) }}>
                      {previousValueComparison}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 추이 그래프 모달 */}
      {showChartModal && selectedTestItemForChart && (
        <div style={modalOverlayStyle} onClick={handleCloseChartModal}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <button style={closeButtonStyle} onClick={handleCloseChartModal}>&times;</button>
            <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>
              {selectedTestItemForChart.test_item_name} 추이 그래프
            </h3>
            <p style={{ fontSize: '0.9em', color: '#6c757d', marginBottom: '20px' }}>
              측정단위: {selectedTestItemForChart.test_item_unit}
            </p>

            {itemTrendData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={itemTrendData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatXAxis}
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      scale="time"
                    />
                    <YAxis />
                    <Tooltip labelFormatter={(label) => formatDate(label, true)} formatter={(value) => [`${value} ${selectedTestItemForChart.test_item_unit}`, '결과값']} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      name={selectedTestItemForChart.test_item_name}
                    />
                    {parseFloat(selectedTestItemForChart.test_item_ref_low) !== undefined && !isNaN(parseFloat(selectedTestItemForChart.test_item_ref_low)) && (
                      <Line
                        type="monotone"
                        dataKey={() => parseFloat(selectedTestItemForChart.test_item_ref_low)}
                        stroke="#4CAF50"
                        strokeDasharray="5 5"
                        dot={false}
                        name={`참고 하한 (${selectedTestItemForChart.test_item_ref_low})`}
                      />
                    )}
                    {parseFloat(selectedTestItemForChart.test_item_ref_high) !== undefined && !isNaN(parseFloat(selectedTestItemForChart.test_item_ref_high)) && (
                      <Line
                        type="monotone"
                        dataKey={() => parseFloat(selectedTestItemForChart.test_item_ref_high)}
                        stroke="#FF5722"
                        strokeDasharray="5 5"
                        dot={false}
                        name={`참고 상한 (${selectedTestItemForChart.test_item_ref_high})`}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
                
                {previousResult && (
                  <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#e6f7ff',
                    border: '1px solid #91d5ff',
                    borderRadius: '8px',
                    fontSize: '0.95em',
                    color: '#333'
                  }}>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                      직전 결과 ({formatDate(previousResult.reportedAt, true)}):
                      <span style={{ marginLeft: '10px', ...getResultValueStyle(previousResult.value, selectedTestItemForChart.test_item_ref_low, selectedTestItemForChart.test_item_ref_high) }}>
                        {previousResult.value} {selectedTestItemForChart.test_item_unit}
                      </span>
                    </p>
                    <p style={{ margin: 0 }}>
                      현재 결과 대비 변화:
                      <span style={{ marginLeft: '10px', ...getDiffStyle(
                          (parseFloat(selectedTestItemForChart.result_value) - previousResult.value)
                      )}}>
                        {parseFloat(selectedTestItemForChart.result_value) - previousResult.value > 0 ? '+' : ''}
                        {(parseFloat(selectedTestItemForChart.result_value) - previousResult.value).toFixed(2)} {selectedTestItemForChart.test_item_unit}
                      </span>
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p style={{ textAlign: 'center', color: '#6c757d' }}>
                선택된 항목에 대한 이전 기록이 충분하지 않습니다.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default LabResultDetailModal;