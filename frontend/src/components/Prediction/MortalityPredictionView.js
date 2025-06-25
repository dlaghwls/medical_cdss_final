import React, { useState, useEffect } from 'react';
import styles from '../../styles/prediction/MortalityPredictionView.module.css';
import {
  predictMortality,
  fetchComplicationsHistory,
  fetchStrokeInfoHistory,
  fetchPatientDetails,
  submitMortalityPredictionData
} from '../../services/djangoApiService';

const MortalityPredictionView = ({ selectedPatient, onPatientSelect, onBackToPatientList }) => {
  const [currentPatient, setCurrentPatient] = useState(selectedPatient);
  const [labData, setLabData] = useState({
    complications: {},
    medications: {},
    stroke_info: {},
    patient_info: {}
  });
  const [additionalInputs, setAdditionalInputs] = useState({
    // 환자 기본정보
    admission_type: '1', // 1=응급실, 2=외래, 3=전원
    charlson_score: '',
    
    // 활력징후 (평균값)
    SBP_art_mean: '', DBP_art_mean: '', 
    NIBP_sys_mean: '', NIBP_dias_mean: '', NIBP_mean_mean: '',
    RespRate_mean: '', GCS_mean: '',
    
    // 검사결과 (평균값)
    BUN_chart_mean: '', CK_lab_mean: '', 
    CRP_chart_mean: '', CRP_lab_mean: '',
    Creatinine_chart_mean: '', Creatinine_lab_mean: '',
    
    // 활력징후 (최대값)
    SBP_art_max: '', DBP_art_max: '',
    NIBP_sys_max: '', NIBP_dias_max: '', NIBP_mean_max: '',
    RespRate_max: '', GCS_max: '',
    
    // 검사결과 (최대값)  
    BUN_chart_max: '', CK_lab_max: '',
    CRP_chart_max: '', CRP_lab_max: '',
    Creatinine_chart_max: '', Creatinine_lab_max: ''
  });
  const [predictionResults, setPredictionResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingLabData, setLoadingLabData] = useState(false);
  const [error, setError] = useState(null);
  
  // 데이터 등록 관련 상태 추가
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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

  // 데이터 등록 핸들러 추가
  const handleSubmitData = async () => {
    if (!predictionResults) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    
    try {
      const predictionData = {
        patient_uuid: currentPatient.uuid,
        age: labData.patient_info.age,
        gender: labData.patient_info.gender,
        admission_type: additionalInputs.admission_type,
        charlson_score: parseFloat(additionalInputs.charlson_score),
        systolic_bp: parseFloat(additionalInputs.SBP_art_mean),
        diastolic_bp: parseFloat(additionalInputs.DBP_art_mean),
        resp_rate: parseFloat(additionalInputs.RespRate_mean),
        gcs_score: parseFloat(additionalInputs.GCS_mean),
        bun: parseFloat(additionalInputs.BUN_chart_mean),
        creatinine: parseFloat(additionalInputs.Creatinine_chart_mean),
        crp: parseFloat(additionalInputs.CRP_chart_mean),
        ck: parseFloat(additionalInputs.CK_lab_mean),
        mortality_probability: predictionResults.mortality_probability,
        risk_level: getRiskLevel(predictionResults.mortality_probability),
        model_confidence: predictionResults.model_confidence,
        prediction_result: predictionResults
      };
      
      console.log("[MortalityPredictionView] Submitting data:", predictionData);
      
      const response = await submitMortalityPredictionData(predictionData);
      console.log("[MortalityPredictionView] Submit success:", response);
      
      setSubmitSuccess(true);
    } catch (error) {
      console.error("[MortalityPredictionView] Submit error:", error);
      setSubmitError(error.message || '데이터 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePredict = async () => {
    if (!currentPatient) return setError('환자를 먼저 선택해주세요.');
    
    // 필수 입력값 검증
    const required = ['charlson_score', 'SBP_art_mean', 'DBP_art_mean', 'RespRate_mean', 'GCS_mean'];
    const missing = required.filter(f => !additionalInputs[f]);
    if (missing.length > 0) return setError(`다음 필수 항목을 입력해주세요: ${missing.join(', ')}`);

    setLoading(true);
    setError(null);
    // 새로운 예측 시 이전 등록 상태 초기화
    setSubmitSuccess(false);
    setSubmitError(null);
    
    try {
      const now = new Date();
      const data = {
        patient_uuid: currentPatient.uuid,
        
        // 환자 기본정보
        admission_type: parseInt(additionalInputs.admission_type),
        age_at_admission: labData.patient_info.age || 65,
        gender_M: labData.patient_info.gender === 'M' ? 1 : 0,
        admit_year: now.getFullYear(),
        admit_month: now.getMonth() + 1,
        admit_day: now.getDate(),
        charlson_score: parseFloat(additionalInputs.charlson_score),
        
        // 검사결과 (평균)
        BUN_chart_mean: parseFloat(additionalInputs.BUN_chart_mean) || 15.0,
        CK_lab_mean: parseFloat(additionalInputs.CK_lab_mean) || 100.0,
        CRP_chart_mean: parseFloat(additionalInputs.CRP_chart_mean) || 3.0,
        CRP_lab_mean: parseFloat(additionalInputs.CRP_lab_mean) || 3.0,
        Creatinine_chart_mean: parseFloat(additionalInputs.Creatinine_chart_mean) || 1.0,
        Creatinine_lab_mean: parseFloat(additionalInputs.Creatinine_lab_mean) || 1.0,
        
        // 활력징후 (평균)
        DBP_art_mean: parseFloat(additionalInputs.DBP_art_mean),
        GCS_mean: parseFloat(additionalInputs.GCS_mean),
        NIBP_dias_mean: parseFloat(additionalInputs.NIBP_dias_mean) || parseFloat(additionalInputs.DBP_art_mean),
        NIBP_mean_mean: parseFloat(additionalInputs.NIBP_mean_mean) || 90.0,
        NIBP_sys_mean: parseFloat(additionalInputs.NIBP_sys_mean) || parseFloat(additionalInputs.SBP_art_mean),
        RespRate_mean: parseFloat(additionalInputs.RespRate_mean),
        SBP_art_mean: parseFloat(additionalInputs.SBP_art_mean),
        
        // 검사결과 (최대값)
        BUN_chart_max: parseFloat(additionalInputs.BUN_chart_max) || parseFloat(additionalInputs.BUN_chart_mean) || 18.0,
        CK_lab_max: parseFloat(additionalInputs.CK_lab_max) || parseFloat(additionalInputs.CK_lab_mean) || 120.0,
        CRP_chart_max: parseFloat(additionalInputs.CRP_chart_max) || parseFloat(additionalInputs.CRP_chart_mean) || 5.0,
        CRP_lab_max: parseFloat(additionalInputs.CRP_lab_max) || parseFloat(additionalInputs.CRP_lab_mean) || 5.0,
        Creatinine_chart_max: parseFloat(additionalInputs.Creatinine_chart_max) || parseFloat(additionalInputs.Creatinine_chart_mean) || 1.2,
        Creatinine_lab_max: parseFloat(additionalInputs.Creatinine_lab_max) || parseFloat(additionalInputs.Creatinine_lab_mean) || 1.2,
        
        // 활력징후 (최대값)
        DBP_art_max: parseFloat(additionalInputs.DBP_art_max) || parseFloat(additionalInputs.DBP_art_mean) + 10,
        GCS_max: parseFloat(additionalInputs.GCS_max) || parseFloat(additionalInputs.GCS_mean),
        NIBP_dias_max: parseFloat(additionalInputs.NIBP_dias_max) || parseFloat(additionalInputs.NIBP_dias_mean) + 10,
        NIBP_mean_max: parseFloat(additionalInputs.NIBP_mean_max) || parseFloat(additionalInputs.NIBP_mean_mean) + 10,
        NIBP_sys_max: parseFloat(additionalInputs.NIBP_sys_max) || parseFloat(additionalInputs.NIBP_sys_mean) + 15,
        RespRate_max: parseFloat(additionalInputs.RespRate_max) || parseFloat(additionalInputs.RespRate_mean) + 5,
        SBP_art_max: parseFloat(additionalInputs.SBP_art_max) || parseFloat(additionalInputs.SBP_art_mean) + 15
      };
      
      const results = await predictMortality(data);
      setPredictionResults(results);
    } catch (err) {
      setError(`사망률 예측 실패: ${err.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const getRiskStyle = (probability) => {
    if (probability >= 0.5) return styles.riskHigh;
    if (probability >= 0.2) return styles.riskMedium;
    return styles.riskLow;
  };

  const getRiskLevel = (probability) => {
    if (probability >= 0.5) return 'HIGH';
    if (probability >= 0.2) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.pageTitle}>💀 30일 사망률 예측 (의사 전용)</h3>

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
            <p className={styles.inputHint}>30일 사망률 예측을 위해 다음 정보를 입력해주세요.</p>

            <div className={styles.inputSubSection}>
              <h5>🏥 환자 기본정보 (필수)</h5>
              <div className={styles.inputGrid}>
                <div className={styles.inputBox}>
                  <label>입원 유형 *</label>
                  <select
                    value={additionalInputs.admission_type}
                    onChange={e => handleInputChange('admission_type', e.target.value)}
                    className={styles.inputField}
                  >
                    <option value="1">응급실</option>
                    <option value="2">외래</option>
                    <option value="3">전원</option>
                  </select>
                </div>
                <div className={styles.inputBox}>
                  <label>찰슨 동반질환 지수 *</label>
                  <input
                    type="number"
                    value={additionalInputs.charlson_score}
                    onChange={e => handleInputChange('charlson_score', e.target.value)}
                    className={styles.inputField}
                    placeholder="예: 3"
                    step="1"
                    min="0"
                    max="20"
                  />
                </div>
              </div>
            </div>

            <div className={styles.inputSubSection}>
              <h5>🫀 핵심 활력징후 (필수)</h5>
              <div className={styles.inputGrid}>
                <div className={styles.inputBox}>
                  <label>수축기혈압(평균) *</label>
                  <input
                    type="number"
                    value={additionalInputs.SBP_art_mean}
                    onChange={e => handleInputChange('SBP_art_mean', e.target.value)}
                    className={styles.inputField}
                    placeholder="예: 130"
                  />
                </div>
                <div className={styles.inputBox}>
                  <label>이완기혈압(평균) *</label>
                  <input
                    type="number"
                    value={additionalInputs.DBP_art_mean}
                    onChange={e => handleInputChange('DBP_art_mean', e.target.value)}
                    className={styles.inputField}
                    placeholder="예: 80"
                  />
                </div>
                <div className={styles.inputBox}>
                  <label>호흡수(평균) *</label>
                  <input
                    type="number"
                    value={additionalInputs.RespRate_mean}
                    onChange={e => handleInputChange('RespRate_mean', e.target.value)}
                    className={styles.inputField}
                    placeholder="예: 18"
                  />
                </div>
                <div className={styles.inputBox}>
                  <label>GCS 점수(평균) *</label>
                  <input
                    type="number"
                    value={additionalInputs.GCS_mean}
                    onChange={e => handleInputChange('GCS_mean', e.target.value)}
                    className={styles.inputField}
                    placeholder="예: 13"
                    min="3"
                    max="15"
                  />
                </div>
              </div>
            </div>

            <div className={styles.inputSubSection}>
              <h5>🧪 검사결과 (선택사항)</h5>
              <p className={styles.optionalNote}>입력하지 않으면 정상값이 자동 적용됩니다.</p>
              <div className={styles.inputGrid}>
                <div className={styles.inputBox}>
                  <label>BUN(평균)</label>
                  <input
                    type="number"
                    value={additionalInputs.BUN_chart_mean}
                    onChange={e => handleInputChange('BUN_chart_mean', e.target.value)}
                    className={styles.inputField}
                    placeholder="예: 15"
                  />
                </div>
                <div className={styles.inputBox}>
                  <label>크레아티닌(평균)</label>
                  <input
                    type="number"
                    value={additionalInputs.Creatinine_chart_mean}
                    onChange={e => handleInputChange('Creatinine_chart_mean', e.target.value)}
                    className={styles.inputField}
                    placeholder="예: 1.0"
                    step="0.1"
                  />
                </div>
                <div className={styles.inputBox}>
                  <label>CRP(평균)</label>
                  <input
                    type="number"
                    value={additionalInputs.CRP_chart_mean}
                    onChange={e => handleInputChange('CRP_chart_mean', e.target.value)}
                    className={styles.inputField}
                    placeholder="예: 3.0"
                    step="0.1"
                  />
                </div>
                <div className={styles.inputBox}>
                  <label>CK(평균)</label>
                  <input
                    type="number"
                    value={additionalInputs.CK_lab_mean}
                    onChange={e => handleInputChange('CK_lab_mean', e.target.value)}
                    className={styles.inputField}
                    placeholder="예: 100"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.buttonWrapper}>
            <button onClick={handlePredict} disabled={loading} className={styles.predictButton}>
              {loading ? '🔄 사망률 예측 중...' : '💀 30일 사망률 예측 시작'}
            </button>
          </div>

          {error && <div className={styles.errorMsg}>❌ {error}</div>}

          {predictionResults && (
            <div className={styles.resultSection}>
              <h4>3️⃣ 사망률 예측 결과</h4>
              <p className={styles.analysisTime}>분석 시간: {new Date().toLocaleString()}</p>
              
              <div className={`${styles.mortalityResult} ${getRiskStyle(predictionResults.mortality_probability)}`}>
                <div className={styles.mortalityHeader}>
                  <h5>30일 사망률</h5>
                  <div className={styles.mortalityPercent}>
                    {(predictionResults.mortality_probability * 100).toFixed(1)}%
                  </div>
                </div>
                <div className={styles.riskLevel}>
                  위험도: {getRiskLevel(predictionResults.mortality_probability)}
                </div>
                <div className={styles.survivalRate}>
                  생존 확률: {((1 - predictionResults.mortality_probability) * 100).toFixed(1)}%
                </div>
                {predictionResults.model_confidence && (
                  <div className={styles.confidence}>
                    모델 신뢰도: {(predictionResults.model_confidence * 100).toFixed(1)}%
                  </div>
                )}
              </div>

              <div className={styles.clinicalBox}>
                <h5>📋 임상 권장사항</h5>
                <ul>
                  <li><strong>높은 위험도(≥50%):</strong> 집중치료 및 적극적 모니터링 필요</li>
                  <li><strong>중간 위험도(20-49%):</strong> 정기적 관찰 및 예방적 조치 고려</li>
                  <li><strong>낮은 위험도(&lt;20%):</strong> 표준 치료 프로토콜 적용</li>
                </ul>
                <p className={styles.disclaimer}>
                  ※ 본 예측 결과는 의료진의 임상 판단을 보조하는 도구이며, 최종 치료 결정은 종합적 평가에 따라 이루어져야 합니다.
                </p>
              </div>

              {/* 데이터 등록 섹션 추가 */}
              <div className={styles.submitSection} style={{ marginTop: '30px', textAlign: 'center' }}>
                <button
                  onClick={handleSubmitData}
                  disabled={!predictionResults || isSubmitting}
                  className={styles.submitButton}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: (!predictionResults || isSubmitting) ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: (!predictionResults || isSubmitting) ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  {isSubmitting ? '등록 중...' : '💾 30일 사망률 예측 데이터 등록'}
                </button>
                
                {submitError && (
                  <div style={{ color: 'red', marginTop: '10px', fontWeight: 'bold' }}>
                    ❌ 오류: {submitError}
                  </div>
                )}
                
                {submitSuccess && (
                  <div style={{ color: 'green', marginTop: '10px', fontWeight: 'bold' }}>
                    ✅ 데이터가 성공적으로 등록되었습니다!
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MortalityPredictionView;