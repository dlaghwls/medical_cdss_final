import React, { useState, useEffect } from 'react';
import styles from '../../styles/prediction/SOD2PredictionView.module.css';
import {
  fetchPatientDetails,
  fetchStrokeInfoHistory,
  fetchLatestSOD2Assessment,
  assessSOD2Status,
} from '../../services/djangoApiService';

const SOD2PredictionView = ({ selectedPatient, onBackToPatientList, onBackToModuleSelect }) => {
  const [patientInfo, setPatientInfo] = useState({});
  const [strokeInfo, setStrokeInfo] = useState({});
  const [additionalInputs, setAdditionalInputs] = useState({
    stroke_date: '',
    nihss_score: '',
    reperfusion_treatment: false,
    reperfusion_time: '',
    hours_after_stroke: '',
  });
  const [sod2Results, setSOD2Results] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPatientData, setLoadingPatientData] = useState(false);
  const [error, setError] = useState(null);
  const [showInputForm, setShowInputForm] = useState(false);

  useEffect(() => {
    if (selectedPatient && selectedPatient.uuid) {
      loadPatientData(selectedPatient.uuid);
    }
  }, [selectedPatient]);

  const loadPatientData = async (patientUuid) => {
    setLoadingPatientData(true);
    setError(null);
    try {
      const [patientDetails, latestSOD2Assessment] = await Promise.all([
        fetchPatientDetails(patientUuid).catch(() => null),
        fetchLatestSOD2Assessment(patientUuid).catch(() => null),
      ]);

      const age = patientDetails?.person?.birthdate
        ? new Date().getFullYear() - new Date(patientDetails.person.birthdate).getFullYear()
        : null;

      setPatientInfo({
        age: age,
        gender: patientDetails?.person?.gender || 'M',
      });

      if (latestSOD2Assessment) {
        setStrokeInfo({
          stroke_type: latestSOD2Assessment.stroke_type,
          nihss_score: latestSOD2Assessment.nihss_score,
        });
        setAdditionalInputs({
          stroke_date: latestSOD2Assessment.stroke_date || '',
          nihss_score: latestSOD2Assessment.nihss_score?.toString() || '',
          reperfusion_treatment: latestSOD2Assessment.reperfusion_treatment || false,
          reperfusion_time: latestSOD2Assessment.reperfusion_time?.toString() || '',
          hours_after_stroke: latestSOD2Assessment.hours_after_stroke?.toString() || '',
        });
        setSOD2Results({
          patient_info: {
            age: latestSOD2Assessment.age || age,
            gender: latestSOD2Assessment.gender || patientDetails?.person?.gender,
            stroke_type: latestSOD2Assessment.stroke_type,
            nihss_score: latestSOD2Assessment.nihss_score,
            hours_after_stroke: latestSOD2Assessment.hours_after_stroke,
          },
          sod2_status: {
            current_level: latestSOD2Assessment.current_sod2_level,
            oxidative_stress_risk: latestSOD2Assessment.oxidative_stress_risk,
            prediction_confidence: latestSOD2Assessment.prediction_confidence,
            overall_status: latestSOD2Assessment.overall_status,
          },
          sod2_prediction_data: latestSOD2Assessment.sod2_prediction_data || [],
          exercise_recommendations: {
            can_start: latestSOD2Assessment.exercise_can_start,
            intensity: latestSOD2Assessment.exercise_intensity,
            monitoring_schedule:
              latestSOD2Assessment.exercise_recommendations || '정기적 재평가 필요',
            time_until_start: latestSOD2Assessment.time_until_start || 0,
            sod2_target: latestSOD2Assessment.sod2_target || 0,
          },
          clinical_recommendations: latestSOD2Assessment.clinical_recommendations || [],
          is_existing_assessment: true,
        });
      } else {
        const strokeData = await fetchStrokeInfoHistory(patientUuid).catch(() => []);
        const latestStroke = strokeData.length > 0 ? strokeData[strokeData.length - 1] : {};
        setStrokeInfo(latestStroke.stroke_info || {});
      }
    } catch (err) {
      setError(`환자 데이터 로드 실패: ${err.message}`);
    } finally {
      setLoadingPatientData(false);
    }
  };

  const handleInputChange = (field, value) => {
    setAdditionalInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSOD2Assessment = async () => {
    if (!selectedPatient) {
      setError('환자를 먼저 선택해주세요.');
      return;
    }
    const requiredFields = ['stroke_date', 'nihss_score', 'hours_after_stroke'];
    const missingFields = requiredFields.filter((field) => !additionalInputs[field]);
    if (missingFields.length > 0) {
      setError(`다음 필수 항목을 입력해주세요: ${missingFields.join(', ')}`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const assessmentData = {
        patient: selectedPatient.uuid,
        age: patientInfo.age || 65,
        gender: patientInfo.gender || 'M',
        stroke_info: {
          stroke_date: additionalInputs.stroke_date,
          stroke_type: strokeInfo.stroke_type || 'ischemic_reperfusion',
          nihss_score: parseInt(additionalInputs.nihss_score),
          reperfusion_treatment: additionalInputs.reperfusion_treatment,
          reperfusion_time: additionalInputs.reperfusion_time
            ? parseFloat(additionalInputs.reperfusion_time)
            : null,
          hours_after_stroke: parseFloat(additionalInputs.hours_after_stroke),
        },
      };
      const response = await assessSOD2Status(assessmentData);
      const results = response.result;
      setSOD2Results({
        ...results,
        is_new_assessment: true,
      });
      setShowInputForm(false);
    } catch (err) {
      setError(`SOD2 평가 실패: ${err.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const getRiskStyle = (riskLevel) => {
    const riskColors = {
      high: '#dc3545',
      medium: '#ffc107', 
      low: '#28a745',
      unknown: '#6c757d'
    };
    return { 
      color: riskColors[riskLevel] || riskColors.unknown,
      fontWeight: 'bold'
    };
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  // 간단한 차트 컴포넌트들 (라이브러리 없이)
  const SimpleLineChart = ({ data, title }) => {
    if (!data || data.length === 0) return null;
    
    const maxValue = Math.max(...data.map(d => d.sod2_level));
    const minValue = Math.min(...data.map(d => d.sod2_level));
    const range = maxValue - minValue || 1;
    const chartWidth = 400;
    const chartHeight = 150;
    
    // SVG path 데이터 생성
    const createPath = () => {
      return data.map((item, index) => {
        const x = (index / (data.length - 1)) * chartWidth;
        const y = chartHeight - ((item.sod2_level - minValue) / range) * chartHeight;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ');
    };

    return (
      <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>{title}</h4>
        <div style={{ position: 'relative', height: '250px', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}>
          {/* Y축 라벨 */}
          <div style={{ position: 'absolute', left: '5px', top: '20px', fontSize: '12px', color: '#666' }}>100%</div>
          <div style={{ position: 'absolute', left: '5px', top: '50%', fontSize: '12px', color: '#666' }}>50%</div>
          <div style={{ position: 'absolute', left: '5px', bottom: '40px', fontSize: '12px', color: '#666' }}>0%</div>
          
          {/* SVG 차트 영역 */}
          <div style={{ marginLeft: '40px', height: '180px', position: 'relative' }}>
            <svg width={chartWidth} height={chartHeight + 40} style={{ overflow: 'visible' }}>
              {/* 그리드 라인 */}
              <defs>
                
                <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width={chartWidth} height={chartHeight} fill="url(#grid)" />
              
              {/* 라인 차트 */}
              <path
                d={createPath()}
                fill="none"
                stroke="#007bff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* 데이터 포인트 */}
              {data.map((item, index) => {
                const x = (index / (data.length - 1)) * chartWidth;
                const y = chartHeight - ((item.sod2_level - minValue) / range) * chartHeight;
                const color = getRiskColor(item.risk_level);
                
                return (
                  <g key={index}>
                    {/* 포인트 */}
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      fill={color}
                      stroke="white"
                      strokeWidth="2"
                      style={{ cursor: 'pointer' }}
                    >
                      <title>{`${item.time}: ${(item.sod2_level * 100).toFixed(1)}% (${item.risk_level})`}</title>
                    </circle>
                    
                    {/* X축 라벨 */}
                    <text
                      x={x}
                      y={chartHeight + 20}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#666"
                      transform={`rotate(-45, ${x}, ${chartHeight + 20})`}
                    >
                      {item.time}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          
          {/* 범례 */}
          <div style={{ position: 'absolute', bottom: '5px', right: '10px', fontSize: '12px', color: '#666' }}>
            <span style={{ color: '#28a745' }}>● 낮음</span>
            <span style={{ color: '#ffc107', marginLeft: '10px' }}>● 보통</span>
            <span style={{ color: '#dc3545', marginLeft: '10px' }}>● 높음</span>
          </div>
        </div>
      </div>
    );
  };

  const SimpleBarChart = ({ data, title }) => {
    if (!data || data.length === 0) return null;
    
    return (
      <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>{title}</h4>
        <div style={{ display: 'flex', alignItems: 'end', height: '150px', gap: '8px', padding: '10px 0' }}>
          {data.map((item, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div
                style={{
                  height: `${item.confidence}px`,
                  backgroundColor: '#ffc107',
                  width: '100%',
                  maxWidth: '30px',
                  borderRadius: '3px 3px 0 0',
                  marginBottom: '5px',
                  transition: 'all 0.3s ease'
                }}
                title={`신뢰도: ${item.confidence.toFixed(1)}%`}
              />
              <div style={{ fontSize: '11px', color: '#666', textAlign: 'center' }}>{item.time}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 차트 데이터 준비
  const prepareChartData = () => {
    if (!sod2Results?.sod2_prediction_data) return [];
    
    return sod2Results.sod2_prediction_data.map(item => ({
      time: `${item.time}h`,
      sod2_level: item.predicted,
      confidence: item.confidence * 100,
      risk_level: item.risk_level
    }));
  };

  if (loadingPatientData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', marginBottom: '20px' }}>환자 데이터를 불러오는 중...</div>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid #f3f3f3', 
          borderTop: '4px solid #007bff', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite', 
          margin: '0 auto' 
        }}></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '30px', borderBottom: '2px solid #007bff', paddingBottom: '15px' }}>
        <h2 style={{ margin: '0', color: '#007bff', fontSize: '28px' }}>SOD2 항산화 상태 평가</h2>
        <p style={{ margin: '10px 0 0 0', color: '#666', fontSize: '16px' }}>
          미토콘드리아 SOD2 수준을 분석하여 산화 스트레스 상태와 운동 가능 시점을 평가합니다.
        </p>
      </div>

      {/* 환자 정보 */}
      {selectedPatient && (
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>환자 정보</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div><strong>이름:</strong> {selectedPatient.display || 'N/A'}</div>
            <div><strong>UUID:</strong> {selectedPatient.uuid}</div>
            <div><strong>나이:</strong> {patientInfo.age || 'N/A'}세</div>
            <div><strong>성별:</strong> {patientInfo.gender === 'M' ? '남성' : patientInfo.gender === 'F' ? '여성' : 'N/A'}</div>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #f5c6cb' }}>
          <strong>오류:</strong> {error}
        </div>
      )}

      {/* SOD2 결과가 있는 경우 */}
      {sod2Results && (
        <div style={{ marginBottom: '30px' }}>
          {/* 현재 상태 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            {/* SOD2 수준 */}
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #e9ecef' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>현재 SOD2 수준</h4>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
                {(sod2Results.sod2_status.current_level * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                신뢰도: {(sod2Results.sod2_status.prediction_confidence * 100).toFixed(1)}%
              </div>
            </div>

            {/* 산화 스트레스 위험도 */}
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #e9ecef' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>산화 스트레스 위험도</h4>
              <div style={{ fontSize: '24px', fontWeight: 'bold', ...getRiskStyle(sod2Results.sod2_status.oxidative_stress_risk) }}>
                {sod2Results.sod2_status.oxidative_stress_risk === 'low' ? '낮음' : 
                 sod2Results.sod2_status.oxidative_stress_risk === 'medium' ? '보통' : '높음'}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                전체 상태: {sod2Results.sod2_status.overall_status || '양호'}
              </div>
            </div>

            {/* 운동 권장사항 */}
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #e9ecef' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>운동 시작 가능</h4>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: sod2Results.exercise_recommendations.can_start ? '#28a745' : '#dc3545' 
              }}>
                {sod2Results.exercise_recommendations.can_start ? '가능' : '불가능'}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                권장 강도: {sod2Results.exercise_recommendations.intensity}%
              </div>
            </div>
          </div>

          {/* SOD2 수준 변화 차트 */}
          {sod2Results.sod2_prediction_data && sod2Results.sod2_prediction_data.length > 0 && (
            <SimpleLineChart 
              data={prepareChartData()} 
              title="SOD2 수준 예측 변화" 
            />
          )}

          {/* 시간별 신뢰도 차트 */}
          {sod2Results.sod2_prediction_data && sod2Results.sod2_prediction_data.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <SimpleBarChart 
                data={prepareChartData()} 
                title="시간별 예측 신뢰도" 
              />
            </div>
          )}

          {/* 임상 권장사항 */}
          {sod2Results.clinical_recommendations && sod2Results.clinical_recommendations.length > 0 && (
            <div style={{ backgroundColor: '#e7f3ff', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #b8daff' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#004085' }}>임상 권장사항</h4>
              <ul style={{ margin: '0', paddingLeft: '20px' }}>
                {sod2Results.clinical_recommendations.map((recommendation, index) => (
                  <li key={index} style={{ marginBottom: '8px', color: '#004085' }}>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 새 평가 입력 폼 */}
      {showInputForm && (
        <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>새 SOD2 평가 입력</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>뇌졸중 발생일 (YYYY-MM-DD):</label>
              <input
                type="date"
                value={additionalInputs.stroke_date}
                onChange={(e) => handleInputChange('stroke_date', e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>NIHSS 점수:</label>
              <input
                type="number"
                value={additionalInputs.nihss_score}
                onChange={(e) => handleInputChange('nihss_score', e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>뇌졸중 후 경과 시간 (시간):</label>
              <input
                type="number"
                step="0.1"
                value={additionalInputs.hours_after_stroke}
                onChange={(e) => handleInputChange('hours_after_stroke', e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
                <input
                  type="checkbox"
                  checked={additionalInputs.reperfusion_treatment}
                  onChange={(e) => handleInputChange('reperfusion_treatment', e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                재관류 치료 여부
              </label>
            </div>
            {additionalInputs.reperfusion_treatment && (
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>재관류 치료 시간 (시간):</label>
                <input
                  type="number"
                  step="0.1"
                  value={additionalInputs.reperfusion_time}
                  onChange={(e) => handleInputChange('reperfusion_time', e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 버튼들 */}
      <div style={{ display: 'flex', gap: '15px', marginTop: '30px', flexWrap: 'wrap' }}>
        <button
          onClick={onBackToModuleSelect}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ← 모듈 선택으로 돌아가기
        </button>
        
        <button
          onClick={onBackToPatientList}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          환자 목록으로 돌아가기
        </button>
        
        {!sod2Results && (
          <button
            onClick={() => setShowInputForm(!showInputForm)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {showInputForm ? '입력 취소' : '새 평가 시작'}
          </button>
        )}
        
        {showInputForm && (
          <button
            onClick={handleSOD2Assessment}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: loading ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {loading ? '평가 중...' : 'SOD2 평가 실행'}
          </button>
        )}
        
        {sod2Results && (
          <button
            onClick={() => {
              setSOD2Results(null);
              setShowInputForm(true);
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ffc107',
              color: '#212529',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            새 평가 실행
          </button>
        )}
      </div>

      {/* 로딩 애니메이션 CSS */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SOD2PredictionView;