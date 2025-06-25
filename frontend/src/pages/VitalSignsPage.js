
import React, { useState, useEffect, useCallback } from 'react';
// 올바른 함수 이름으로 임포트하도록 수정: fetchVitalsForPatient 대신 fetchVitalsHistory, recordVitalSign 대신 saveVitals
import { fetchVitalsHistory, saveVitals } from '../../services/djangoApiService';

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Chart.js 모듈 등록 (한번만 하면 됨)
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// 미리 정의된 활력 징후 항목과 단위 (백엔드의 Concept 이름과 일치하도록)
// 이 값들은 settings.py의 OPENMRS_VITAL_CONCEPTS 딕셔너리의 KEY와 일치해야 합니다.
const VITAL_SIGN_DEFINITIONS = {
    'TEMPERATURE': { name: '체온', unit: '°C' },
    'PULSE': { name: '맥박', unit: 'bpm' },
    'RESPIRATORY_RATE': { name: '호흡수', unit: '회/분' },
    'WEIGHT': { name: '체중', unit: 'kg' },
    'HEIGHT': { name: '키', unit: 'cm' },
    'BP_SYSTOLIC': { name: '수축기 혈압', unit: 'mmHg' },
    'BP_DIASTOLIC': { name: '이완기 혈압', unit: 'mmHg' },
    // 여기에 필요한 다른 활력 징후 항목을 추가하세요.
};
const VITAL_SIGN_KEYS = Object.keys(VITAL_SIGN_DEFINITIONS); // 드롭다운 생성을 위한 키 목록

const VitalSignsPage = ({ selectedPatient, onBackToPatientList }) => {
    const [vitalType, setVitalType] = useState(''); // 선택된 활력 징후 타입
    const [vitalValue, setVitalValue] = useState(''); // 측정 수치
    const [obsDatetime, setObsDatetime] = useState(''); // 측정 날짜/시간

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [patientVitals, setPatientVitals] = useState({}); // 환자 활력 징후 기록 (concept_name별 그룹)

    const patientUuid = selectedPatient?.uuid;

    // 컴포넌트 마운트 및 selectedPatient 변경 시 현재 날짜/시간으로 초기화
    useEffect(() => {
        const now = new Date();
        // ISO 8601 "YYYY-MM-DDTHH:MM" 형식으로 변환 (input type="datetime-local"에 맞춤)
        const formattedDateTime = now.toISOString().slice(0, 16); 
        setObsDatetime(formattedDateTime);

        if (patientUuid) { // selectedPatient.uuid 대신 patientUuid 사용
            loadVitalSigns(patientUuid); // 선택된 환자의 활력 징후 로드
        } else {
            setPatientVitals({}); // 환자 없으면 기록 초기화
        }
    }, [patientUuid]); // selectedPatient 대신 patientUuid를 의존성 배열에 추가

    // 환자의 활력 징후 기록을 Django 백엔드에서 불러오는 함수
    const loadVitalSigns = useCallback(async (currentPatientUuid) => { // useCallback 의존성 맞춤
        if (!currentPatientUuid) return;
        setLoading(true);
        setError(null);
        try {
            // fetchVitalsForPatient 대신 fetchVitalsHistory 사용
            const results = await fetchVitalsHistory(currentPatientUuid); // 함수 이름 변경
            // OpenMRS Obs API 응답에서 concept.display (개념 이름)으로 그룹화합니다.
            // 백엔드 VitalSignOutputSerializer가 concept_name 필드로 이 값을 반환합니다.
            const groupedResults = results.reduce((acc, current) => {
                // current.concept_name은 OpenMRS의 개념 이름 (예: "BODY TEMPERATURE")
                // 이것을 프론트엔드의 VITAL_SIGN_DEFINITIONS의 KEY (예: "TEMPERATURE")와 매칭하여 그룹핑
                const vitalKey = Object.keys(VITAL_SIGN_DEFINITIONS).find(key => 
                    VITAL_SIGN_DEFINITIONS[key].name.toUpperCase() === current.concept_name.toUpperCase() || key.toUpperCase() === current.concept_name.toUpperCase()
                ) || current.concept_name; // 매칭되는 키 없으면 원래 이름 사용

                if (!acc[vitalKey]) { 
                    acc[vitalKey] = [];
                }
                acc[vitalKey].push(current);
                return acc;
            }, {});
            setPatientVitals(groupedResults);
        } catch (err) {
            console.error("Error loading vital signs:", err);
            setError("활력 징후 로드 실패: " + (err.message || err.response?.data?.error || '알 수 없는 오류'));
        } finally {
            setLoading(false);
        }
    }, []); // useCallback의 의존성 배열은 비워둠 (컴포넌트 props/state를 사용하지 않음)

    // 활력 징후 입력 폼 제출 핸들러
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage('');
        setLoading(true);

        if (!patientUuid) { // selectedPatient.uuid 대신 patientUuid 사용
            setError("환자가 선택되지 않았습니다.");
            setLoading(false);
            return;
        }
        if (!vitalType || !vitalValue || !obsDatetime) {
            setError("활력 징후 종류, 수치, 날짜/시간은 필수 입력 항목입니다.");
            setLoading(false);
            return;
        }

        try {
            const newVitalSign = {
                patient_uuid: patientUuid, // 백엔드로 보낼 때 patient_uuid 사용
                concept_name: vitalType, // 백엔드로 VITAL_SIGN_DEFINITIONS의 KEY (예: "TEMPERATURE")를 보냅니다.
                value: parseFloat(vitalValue), 
                obs_datetime: obsDatetime, // "YYYY-MM-DDTHH:MM" 형식
            };
            // recordVitalSign 대신 saveVitals 사용, 인자도 하나로 통일
            await saveVitals(newVitalSign); // Django API 호출
            setSuccessMessage('활력 징후가 성공적으로 등록되었습니다.');
            
            // 폼 필드 초기화 및 현재 시간으로 재설정
            setVitalType('');
            setVitalValue('');
            setObsDatetime(new Date().toISOString().slice(0, 16)); 
            
            loadVitalSigns(patientUuid); // 등록 후 목록 새로고침
        } catch (err) {
            console.error("Error registering vital sign:", err);
            setError("활력 징후 등록 실패: " + (err.response?.data?.error || err.message || '알 수 없는 오류'));
        } finally {
            setLoading(false);
        }
    };

    // Chart.js 그래프 데이터를 생성하는 함수
    const generateChartData = (resultsForSingleVital) => {
        // obs_datetime을 기준으로 오름차순 정렬
        const sortedData = resultsForSingleVital.sort((a, b) => new Date(a.obs_datetime) - new Date(b.obs_datetime));
        
        // 차트 레이블 (날짜/시간)
        const labels = sortedData.map(res => new Date(res.obs_datetime).toLocaleString()); 
        const dataValues = sortedData.map(res => res.value);

        // 해당 활력 징후의 단위 및 사용자 친화적 이름 가져오기
        // resultsForSingleVital[0]?.concept_name은 백엔드에서 온 OpenMRS 개념 이름 (예: "BODY TEMPERATURE")
        // 이것을 VITAL_SIGN_DEFINITIONS의 KEY (예: "TEMPERATURE")와 매칭하여 사용
        const vitalKey = Object.keys(VITAL_SIGN_DEFINITIONS).find(key => 
            VITAL_SIGN_DEFINITIONS[key].name.toUpperCase() === resultsForSingleVital[0]?.concept_name.toUpperCase() || key.toUpperCase() === resultsForSingleVital[0]?.concept_name.toUpperCase()
        ) || resultsForSingleVital[0]?.concept_name; // 매칭되는 키 없으면 원래 이름 사용

        const displayUnit = VITAL_SIGN_DEFINITIONS[vitalKey]?.unit || '';
        const displayName = VITAL_SIGN_DEFINITIONS[vitalKey]?.name || vitalKey;

        return {
            labels: labels,
            datasets: [
                {
                    label: `${displayName} (${displayUnit})`,
                    data: dataValues,
                    borderColor: 'rgb(255, 99, 132)', // 활력 징후용 색상
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1, // 선의 장력 (부드러운 곡선)
                    fill: true, // 선 아래 영역 채우기
                },
            ],
        };
    };

    // Chart.js 그래프 옵션 설정
    const chartOptions = (vitalNameKey) => ({
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: {
                display: true,
                text: `${selectedPatient?.display || '선택된 환자'}의 ${VITAL_SIGN_DEFINITIONS[vitalNameKey]?.name || vitalNameKey} 추이`,
            },
        },
        scales: {
            x: { title: { display: true, text: '날짜' } },
            y: { title: { display: true, text: '수치' }, beginAtZero: false },
        },
    });

    // 환자가 선택되지 않았을 때 표시할 UI
    if (!selectedPatient) {
        return (
            <div style={{ padding: '20px' }}>
                <h3>활력 징후 관리</h3>
                <p>환자를 선택해야 활력 징후를 조회하고 입력할 수 있습니다.</p>
                <button onClick={onBackToPatientList} style={{marginTop: '20px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px'}}>
                    환자 목록으로 돌아가기
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>활력 징후 관리 - {selectedPatient.display}</h3>
            <p><strong>UUID:</strong> {selectedPatient.uuid}</p>

            <button onClick={onBackToPatientList} style={{ marginBottom: '20px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                환자 목록으로 돌아가기
            </button>

            {/* 활력 징후 입력 폼 */}
            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '30px', backgroundColor: 'white' }}>
                <h4>새 활력 징후 입력</h4>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div>
                        <label>활력 징후 종류:*</label>
                        <select 
                            value={vitalType} 
                            onChange={(e) => setVitalType(e.target.value)} 
                            required 
                            style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value="">-- 선택 --</option>
                            {VITAL_SIGN_KEYS.map(key => (
                                <option key={key} value={key}>{VITAL_SIGN_DEFINITIONS[key].name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>측정 수치:*</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            value={vitalValue} 
                            onChange={(e) => setVitalValue(e.target.value)} 
                            required 
                            placeholder={vitalType ? `단위: ${VITAL_SIGN_DEFINITIONS[vitalType]?.unit || ''}` : '수치 입력'}
                            style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} 
                        />
                    </div>
                    <div>
                        <label>측정 날짜/시간:*</label>
                        <input 
                            type="datetime-local" 
                            value={obsDatetime} 
                            onChange={(e) => setObsDatetime(e.target.value)} 
                            required 
                            style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} 
                        />
                    </div>
                    <button type="submit" disabled={loading} style={{ gridColumn: 'span 3', padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        {loading ? '등록 중...' : '활력 징후 등록'}
                    </button>
                </form>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                {successMessage && <p style={{ color: 'green', marginTop: '10px' }}>{successMessage}</p>}
            </div>

            {/* 활력 징후 추이 그래프 */}
            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: 'white' }}>
                <h4>활력 징후 추이 그래프</h4>
                {loading && <p>그래프 데이터 로딩 중...</p>}
                {error && !loading && <p style={{ color: 'red' }}>{error}</p>}
                {!loading && Object.keys(patientVitals).length === 0 && !error && (
                    <p>이 환자에 대한 활력 징후 기록이 없습니다. 위에 폼을 사용하여 첫 번째 기록을 입력하세요.</p>
                )}
                {!loading && Object.keys(patientVitals).length > 0 && (
                    <div>
                        {Object.keys(patientVitals).map(vitalNameKey => (
                            <div key={vitalNameKey} style={{ marginBottom: '20px' }}>
                                <Line data={generateChartData(patientVitals[vitalNameKey])} options={chartOptions(vitalNameKey)} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VitalSignsPage;