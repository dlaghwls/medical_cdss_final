import React, { useState, useEffect } from 'react';
import styles from '../../styles/prediction/ComplicationPredictionView.module.css';
import {
  predictComplications,
  fetchComplicationsHistory,
  fetchStrokeInfoHistory,
  fetchPatientDetails
} from '../../services/djangoApiService';

const ComplicationPredictionView = ({ selectedPatient, onPatientSelect, onBackToPatientList }) => {
  const [currentPatient, setCurrentPatient] = useState(selectedPatient);
  const [labData, setLabData] = useState({
    complications: {},
    medications: {},
    stroke_info: {},
    patient_info: {}
  });
  const [additionalInputs, setAdditionalInputs] = useState({
    heart_rate: '', systolic_bp: '', diastolic_bp: '', temperature: '', oxygen_saturation: '',
    wbc: '', hemoglobin: '', creatinine: '', bun: '', glucose: ''
  });
  const [predictionResults, setPredictionResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingLabData, setLoadingLabData] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentPatient?.uuid) loadPatientLabData(currentPatient.uuid);
  }, [currentPatient]);

  const loadPatientLabData = async (uuid) => {
    setLoadingLabData(true);
    setError(null);
    try {
      const [complicationsData, strokeData, patientDetails] = await Promise.all([
        fetchComplicationsHistory(uuid).catch(() => []),
        fetchStrokeInfoHistory(uuid).catch(() => []),
        fetchPatientDetails(uuid).catch(() => null)
      ]);
      const latestComplications = complicationsData.at(-1) || {};
      const latestStroke = strokeData.at(-1) || {};
      const age = patientDetails?.person?.birthdate
        ? new Date().getFullYear() - new Date(patientDetails.person.birthdate).getFullYear()
        : null;
      setLabData({
        complications: latestComplications.complications || {},
        medications: latestComplications.medications || {},
        stroke_info: latestStroke.stroke_info || {},
        patient_info: { age, gender: patientDetails?.person?.gender || 'M' }
      });
    } catch (err) {
      setError(`LAB 데이터 로드 실패: ${err.message}`);
    } finally {
      setLoadingLabData(false);
    }
  };

  const handleInputChange = (field, value) => {
    setAdditionalInputs(prev => ({ ...prev, [field]: value }));
  };

  const handlePredict = async () => {
    if (!currentPatient) return setError('환자를 먼저 선택해주세요.');
    const required = ['heart_rate', 'systolic_bp', 'diastolic_bp', 'temperature', 'oxygen_saturation'];
    const missing = required.filter(f => !additionalInputs[f]);
    if (missing.length > 0) return setError(`다음 항목을 입력해주세요: ${missing.join(', ')}`);

    setLoading(true);
    setError(null);
    try {
      const data = {
        patient_uuid: currentPatient.uuid, // ← 이 줄 추가!
        age: labData.patient_info.age || 65,
        gender: labData.patient_info.gender || 'M',
        vital_signs: {
          heart_rate: +additionalInputs.heart_rate,
          systolic_bp: +additionalInputs.systolic_bp,
          diastolic_bp: +additionalInputs.diastolic_bp,
          temperature: +additionalInputs.temperature,
          respiratory_rate: 16,
          oxygen_saturation: +additionalInputs.oxygen_saturation
        },
        lab_results: {
          wbc: +additionalInputs.wbc || 8.0,
          hemoglobin: +additionalInputs.hemoglobin || 14.0,
          creatinine: +additionalInputs.creatinine || 1.0,
          bun: +additionalInputs.bun || 15.0,
          glucose: +additionalInputs.glucose || 100.0,
          sodium: 140.0,
          potassium: 4.0
        },
        complications: labData.complications,
        medications: labData.medications
      };
      const results = await predictComplications(data);
      setPredictionResults(results);
    } catch (err) {
      setError(`예측 실패: ${err.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const getRiskStyle = (level) => {
    const map = {
      HIGH: styles.riskHigh,
      MEDIUM: styles.riskMedium,
      LOW: styles.riskLow
    };
    return map[level] || styles.riskUnknown;
  };

  const getComplicationName = (key) => ({
    pneumonia: '폐렴',
    acute_kidney_injury: '급성 신장손상',
    heart_failure: '심부전'
  })[key] || key;

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.pageTitle}>🔮 AI 합병증 예측 (의사 전용)</h3>

      <div className={styles.patientCard}>
        {currentPatient ? (
          <>
            <div className={styles.patientInfo}>
              <p><span className={styles.label}>UUID:</span> {currentPatient.uuid}</p>
              <p><span className={styles.label}>나이:</span> {labData.patient_info.age}세</p>
              <p><span className={styles.label}>성별:</span> {labData.patient_info.gender === 'M' ? '남성' : '여성'}</p>
            </div>
            <button className={styles.backButton} onClick={onBackToPatientList}>환자 재선택</button>
            {loadingLabData && <div className={styles.loadingNotice}>📊 LAB 데이터를 불러오는 중...</div>}
            {!loadingLabData && (
              <div className={styles.labSummaryBox}>
                <h5>✅ 로드된 LAB 요약</h5>
                <div className={styles.labGrid}>
                  <div><strong>합병증:</strong> {Object.keys(labData.complications).filter(k => labData.complications[k]).join(', ') || '없음'}</div>
                  <div><strong>투약:</strong> {Object.keys(labData.medications).filter(k => labData.medications[k]).join(', ') || '없음'}</div>
                  <div><strong>뇌졸중 유형:</strong> {labData.stroke_info.stroke_type || '정보 없음'}</div>
                  <div><strong>NIHSS 점수:</strong> {labData.stroke_info.nihss_score || '정보 없음'}</div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={styles.noticeBox}>
            <p>환자를 선택해주세요.</p>
            <button className={styles.primaryButton} onClick={onBackToPatientList}>환자 선택하기</button>
          </div>
        )}
      </div>

      {currentPatient && !loadingLabData && (
        <>
          <div className={styles.inputSection}>
            <h4>2️⃣ 추가 정보 입력</h4>
            <p className={styles.inputHint}>정확한 예측을 위해 활력징후와 검사결과를 입력해주세요.</p>

            <div className={styles.inputSubSection}>
              <h5>🫀 핵심 활력징후 (필수)</h5>
              <div className={styles.inputGrid}>
                {['심박수', '수축기혈압', '이완기혈압', '체온', '산소포화도'].map((label, idx) => {
                  const fields = ['heart_rate', 'systolic_bp', 'diastolic_bp', 'temperature', 'oxygen_saturation'];
                  const field = fields[idx];
                  const placeholders = ['80', '120', '80', '36.5', '98'];
                  return (
                    <div key={field} className={styles.inputBox}>
                      <label>{label} *</label>
                      <input
                        type="number"
                        value={additionalInputs[field]}
                        onChange={e => handleInputChange(field, e.target.value)}
                        className={styles.inputField}
                        placeholder={`예: ${placeholders[idx]}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.inputSubSection}>
              <h5>🧪 주요 검사결과 (선택사항)</h5>
              <p className={styles.optionalNote}>입력하지 않으면 정상값이 자동 적용됩니다.</p>
              <div className={styles.inputGrid}>
                {['wbc', 'hemoglobin', 'creatinine', 'bun', 'glucose'].map((field, idx) => {
                  const labels = ['백혈구', '헤모글로빈', '크레아티닌', 'BUN', '혈당'];
                  const placeholders = ['8.0', '14.0', '1.0', '15.0', '100.0'];
                  return (
                    <div key={field} className={styles.inputBox}>
                      <label>{labels[idx]}</label>
                      <input
                        type="number"
                        value={additionalInputs[field]}
                        onChange={e => handleInputChange(field, e.target.value)}
                        className={styles.inputField}
                        placeholder={`예: ${placeholders[idx]}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={styles.buttonWrapper}>
            <button onClick={handlePredict} disabled={loading} className={styles.predictButton}>
              {loading ? '🔄 예측 분석 중...' : '🔮 AI 합병증 예측 시작'}
            </button>
          </div>

          {error && <div className={styles.errorMsg}>❌ {error}</div>}

          {predictionResults && (
            <div className={styles.resultSection}>
              <h4>3️⃣ AI 예측 결과</h4>
              <p className={styles.analysisTime}>분석 시간: {new Date().toLocaleString()}</p>
              <div className={styles.resultGrid}>
                {Object.entries(predictionResults).map(([key, result]) => (
                  result?.probability && (
                    <div key={key} className={`${styles.resultBox} ${getRiskStyle(result.risk_level)}`}>
                      <h5>{getComplicationName(key)}</h5>
                      <div className={styles.percent}>{(result.probability * 100).toFixed(1)}%</div>
                      <div className={styles.riskLevel}>위험도: {result.risk_level}</div>
                      {result.model_confidence && (
                        <div className={styles.confidence}>모델 신뢰도: {(result.model_confidence * 100).toFixed(1)}%</div>
                      )}
                    </div>
                    
                  )
                ))}
              </div>
              <div className={styles.clinicalBox}>
                <h5>📋 임상 권장사항</h5>
                <ul>
                  <li>높은 위험도(HIGH): 집중 모니터링 및 예방 조치 강화</li>
                  <li>중간 위험도(MEDIUM): 정기적 관찰 및 조기 개입 준비</li>
                  <li>낮은 위험도(LOW): 표준 프로토콜에 따른 관리</li>
                </ul>
                <p className={styles.disclaimer}>
                  ※ 본 예측 결과는 의료진의 판단을 보조하며, 실제 진료는 종합적 판단에 따릅니다.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ComplicationPredictionView;



