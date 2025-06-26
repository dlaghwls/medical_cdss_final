// frontend/src/utils/aiResultFormatters.js

/**
 * 합병증 및 투약 정보를 요약 텍스트 배열로 변환하는 함수
 * Complication_history_view.js에서 가져옴
 */
export const formatComplicationsRecord = (record) => {
    const complicationLabels = { 
        sepsis: '패혈증', 
        respiratory_failure: '호흡부전', 
        deep_vein_thrombosis: '심부정맥혈전증', 
        pulmonary_embolism: '폐색전증', 
        urinary_tract_infection: '요로감염', 
        gastrointestinal_bleeding: '위장관 출혈' 
    };
    const medicationLabels = { 
        anticoagulant_flag: '항응고제', 
        antiplatelet_flag: '항혈소판제', 
        thrombolytic_flag: '혈전용해제', 
        antihypertensive_flag: '항고혈압제', 
        statin_flag: '스타틴', 
        antibiotic_flag: '항생제', 
        vasopressor_flag: '승압제' 
    };
    const complicationEntries = Object.entries(record.complications || {}).filter(([, value]) => value).map(([key]) => complicationLabels[key]);
    const medicationEntries = Object.entries(record.medications || {}).filter(([, value]) => value).map(([key]) => medicationLabels[key]);
    
    return [
        { label: '조회된 합병증', value: complicationEntries.length > 0 ? complicationEntries.join(', ') : '해당 없음' },
        { label: '처방된 약물', value: medicationEntries.length > 0 ? medicationEntries.join(', ') : '해당 없음' },
        { label: '기록 시각', value: new Date(record.recorded_at).toLocaleString() },
        { label: '비고', value: record.notes || '없음' }
    ];
};

/**
 * SOD2 평가 결과 데이터 구조를 정규화하는 함수
 * SOD2HistoryView.js에서 가져옴
 */
export const normalizeAssessmentData = (assessment) => {
    if (!assessment) return null;
    if (assessment.current_sod2_level !== undefined) {
        return {
            assessment_id: assessment.id,
            recorded_at: assessment.recorded_at,
            result: {
                sod2_status: { current_level: assessment.current_sod2_level, oxidative_stress_risk: assessment.oxidative_stress_risk, overall_status: assessment.overall_status || '평가됨', prediction_confidence: assessment.prediction_confidence || 0.8 },
                patient_info: { age: assessment.age || 'N/A', gender: assessment.gender === 'M' ? '남성' : assessment.gender === 'F' ? '여성' : 'N/A', stroke_type: assessment.stroke_type, nihss_score: assessment.nihss_score, hours_after_stroke: assessment.hours_after_stroke },
                exercise_recommendations: { can_start: assessment.exercise_can_start, intensity: assessment.exercise_intensity, monitoring_schedule: assessment.exercise_recommendations || '정기적 재평가 필요' },
                clinical_recommendations: assessment.clinical_recommendations ? (Array.isArray(assessment.clinical_recommendations) ? assessment.clinical_recommendations : assessment.clinical_recommendations.split('\n')) : [],
                sod2_prediction_data: assessment.sod2_prediction_data || []
            }
        };
    }
    return assessment;
};