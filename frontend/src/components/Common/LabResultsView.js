// frontend/src/components/Common/LabResultsView.js
// 이 놈이 만악의 근원입니다. 오체분시해서 없애는 것이 제 목표입니다.
// 이주 된 것: 대부분의 기능 ....  ... 머리가 이제 안돌아감
import React, { useState, useEffect } from 'react';
import {
    registerLabResult,
    fetchLabResultsForPatient,
    registerStrokeInfo,                  // ★ 추가
    registerComplicationsAndMedications,   // ★ 추가
    fetchStrokeInfoHistory,              // ★ 추가
    fetchComplicationsHistory,
    assessSOD2Status,  // <--- ★★★ 여기에 이미 있었습니다!
    fetchSOD2Assessments,
    fetchLatestSOD2Assessment,
    fetchPatientDetails,                 // ★ 추가
    saveVitals, // 유정우가 추가함 
    fetchVitalsHistory, // 유정우가 추가 
    submitMortalityPredictionData,
} from '../../services/djangoApiService';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import StudiesModal from '../pacs/StudiesModal';
import axios from 'axios';
import NiftiUploadManager from '../pacs/NiftiUploadManager';


// Chart.js 모듈 등록
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// API 인스턴스 생성 (PACS API 서비스 대체)
const api = axios.create({
    // ★★★ GCP용 API BASE URL로 변경해야 합니다. ★★★
    // 로컬 환경의 'http://localhost:8000/api' 대신,
    // GCP Django 백엔드의 실제 외부 IP 또는 도메인으로 변경하세요.
    baseURL: 'http://34.64.188.9:8000/api', // 예시: 실제 GCP Django 백엔드 URL
    headers: {
        'Content-Type': 'application/json',
    },
});

// PACS API 함수들 직접 구현 (변경 없음)
const fetchPatientStudies = async (patientPacsId) => {
    try {
        const response = await api.get(`/pacs/patients/${patientPacsId}/studies/`);
        return { data: response.data };
    } catch (error) {
        console.error('Failed to fetch patient studies:', error);
        throw error;
    }
};

const uploadDicomFile = async (formData) => {
    try {
        const response = await api.post('/pacs/upload/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Failed to upload DICOM file:', error);
        throw error;
    }
};

// 미리 정의된 검사 항목과 단위 (변경 없음)
const LAB_TEST_DEFINITIONS = {
    'BUN_chart_mean': { name: 'BUN (혈중요소질소)', unit: 'mg/dL' },
    'CK_lab_mean': { name: 'CK (크레아틴키나제)', unit: 'U/L' },
    'CRP_chart_mean': { name: 'CRP (C-반응성 단백질 (차트))', unit: 'mg/L' },
    'CRP_lab_mean': { name: 'CRP (C-반응성 단백질 (랩))', unit: 'mg/L' },
    'Creatinine_chart_mean': { name: 'Creatinine (크레아티닌 (차트))', unit: 'mg/dL' },
    'Creatinine_lab_mean': { name: 'Creatinine (크레아티닌 (랩))', unit: 'mg/dL' },
    'DBP_art_mean': { name: 'DBP (동맥 이완기 혈압)', unit: 'mmHg' },
    'GCS_mean': { name: 'GCS (의식 수준 평균 점수)', unit: '점' },
    'NIBP_dias_mean': { name: 'NIBP (비침습적 이완기 혈압)', unit: 'mmHg' },
};
const LAB_TEST_KEYS = Object.keys(LAB_TEST_DEFINITIONS);

// InfoModal 컴포넌트 (변경 없음)
const InfoModal = ({ title, records, recordType, onClose, formatRecord }) => {
    const [sortOrder, setSortOrder] = useState('newest');
    const [sortedRecords, setSortedRecords] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        let tempRecords = [...records];
        switch (sortOrder) {
            case 'oldest':
                tempRecords.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
                break;
            case 'nihss_high':
                if (recordType === 'sod2') {
                    tempRecords.sort((a, b) => (b.stroke_info?.nihss_score || 0) - (a.stroke_info?.nihss_score || 0));
                }
                break;
            case 'newest':
            default:
                tempRecords.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
                break;
        }
        setSortedRecords(tempRecords);
        setCurrentPage(0);
    }, [records, sortOrder, recordType]);

    const currentRecord = sortedRecords.length > 0 ? sortedRecords[currentPage] : null;
    const formattedData = currentRecord ? formatRecord(currentRecord) : [];

    const renderModalContent = (content) => (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                {content}
            </div>
        </div>
    );

    if (records.length === 0) {
        return renderModalContent(
            <>
                <h3 style={{ marginTop: 0 }}>{title}</h3>
                <p>등록된 정보가 없습니다.</p>
                <button onClick={onClose} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>닫기</button>
            </>
        );
    }

    return renderModalContent(
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{title}</h3>
                <div>
                    <label htmlFor="sort-order" style={{ marginRight: '10px', fontSize: '14px' }}>정렬:</label>
                    <select id="sort-order" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ padding: '5px', borderRadius: '4px' }}>
                        <option value="newest">최신순</option>
                        <option value="oldest">오래된 순</option>
                        {recordType === 'sod2' && <option value="nihss_high">NIHSS 점수 높은 순</option>}
                    </select>
                </div>
            </div>

            <div style={{ overflowY: 'auto', flexGrow: 1, padding: '15px 0' }}>
                {currentRecord ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {formattedData.map((item, index) => (
                            <li key={index} style={{ borderBottom: '1px solid #f0f0f0', padding: '10px 5px', display: 'flex' }}>
                                <strong style={{ minWidth: '150px', flexShrink: 0 }}>{item.label}:</strong>
                                <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{item.value}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>표시할 데이터가 없습니다.</p>
                )}
            </div>

            <div style={{ paddingTop: '15px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={onClose} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    닫기
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                        이전
                    </button>
                    <span>페이지 {currentPage + 1} / {sortedRecords.length}</span>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= sortedRecords.length - 1} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                        다음
                    </button>
                </div>
            </div>
        </>
    );
};

// Vital 그래프 모달 컴포넌트 추가
const VitalsGraphModal = ({ patientId, isOpen, onClose }) => {
    const [records, setRecords] = useState([]);
    const [timeRange, setTimeRange] = useState('1d'); // '1d', '1w', '1m', '1y'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetchVitalsHistory(patientId, timeRange)
                .then(data => {
                    setRecords(data || []); // 데이터가 null일 경우 빈 배열로 처리
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setRecords([]); // 에러 발생 시 빈 배열로 초기화
                    setLoading(false);
                });
        }
    }, [isOpen, patientId, timeRange]);

    if (!isOpen) return null;

    // 차트 데이터 가공
    const chartData = {
        labels: records.map(rec => new Date(rec.recorded_at).toLocaleString()),
        datasets: [
            {
                label: '수축기 혈압 (SBP)',
                data: records.map(rec => {
                    const bp = rec.measurements?.bp;
                    return bp && bp.includes('/') ? parseInt(bp.split('/')[0], 10) : null;
                }),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
                label: '이완기 혈압 (DBP)',
                data: records.map(rec => {
                    const bp = rec.measurements?.bp;
                    return bp && bp.includes('/') ? parseInt(bp.split('/')[1], 10) : null;
                }),
                borderColor: 'rgb(255, 159, 64)',
                backgroundColor: 'rgba(255, 159, 64, 0.5)',
            },
            {
                label: '심박수 (HR)',
                data: records.map(rec => rec.measurements?.hr),
                borderColor: 'rgb(75, 192, 192)',
            },
            {
                label: '호흡수 (RR)',
                data: records.map(rec => rec.measurements?.rr),
                borderColor: 'rgb(54, 162, 235)',
            },
            {
                label: '산소포화도 (SpO2)',
                data: records.map(rec => rec.measurements?.spo2),
                borderColor: 'rgb(153, 102, 255)',
            },
            {
                label: '체온 (Temp)',
                data: records.map(rec => rec.measurements?.temp),
                borderColor: 'rgb(255, 205, 86)',
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { tooltip: { mode: 'index', intersect: false } },
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ display: 'flex', flexDirection: 'column', background: 'white', width: '90%', height: '90%', maxWidth: '1400px', padding: '20px', borderRadius: '8px', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h2 style={{ margin: 0 }}>{patientId} 환자 Vital 그래프</h2>
                    <button onClick={onClose} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
                </div>
                <div style={{ display: 'flex', flex: 1, gap: '20px', overflow: 'hidden' }}>
                    {/* 좌측 패널: 기록 목록 */}
                    <div style={{ width: '40%', borderRight: '1px solid #ccc', overflowY: 'auto', paddingRight: '10px' }}>
                        <h3>Vital 기록</h3>
                        {loading ? <p>로딩 중...</p> : records.length > 0 ? records.map(rec => (
                            <div key={rec.session_id} style={{ borderBottom: '1px solid #eee', padding: '10px 0', marginBottom: '10px' }}>
                                <strong style={{ display: 'block', marginBottom: '5px' }}>{new Date(rec.recorded_at).toLocaleString()}</strong>
                                <p style={{ margin: 0 }}>
                                    {`BP: ${rec.measurements?.bp || 'N/A'}, HR: ${rec.measurements?.hr || 'N/A'}, RR: ${rec.measurements?.rr || 'N/A'}, Temp: ${rec.measurements?.temp || 'N/A'}, SpO2: ${rec.measurements?.spo2 || 'N/A'}`}
                                </p>
                                {rec.notes && <p style={{ marginTop: '5px', color: '#555' }}>비고: {rec.notes}</p>}
                            </div>
                        )) : <p>표시할 데이터가 없습니다.</p>}
                    </div>
                    {/* 우측 패널: 그래프 */}
                    <div style={{ width: '60%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: '10px' }}>
                            {['1d', '1w', '1m', '1y'].map(range => (
                                <button key={range} onClick={() => setTimeRange(range)} style={{ background: timeRange === range ? '#007bff' : '#f0f0f0', color: timeRange === range ? 'white' : 'black', border: '1px solid #ccc', padding: '5px 10px', cursor: 'pointer', marginRight: '5px' }}>
                                    {range === '1d' ? '1일' : range === '1w' ? '일주일' : range === '1m' ? '한달' : '1년'}
                                </button>
                            ))}
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            {loading ? <p>그래프 로딩 중...</p> : <Line data={chartData} options={chartOptions} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const LabResultsView = ({ selectedPatient, onBackToPatientList, onSelectedPatientUpdated, initialActiveForm }) => {
    const [testName, setTestName] = useState('');
    const [testValue, setTestValue] = useState('');
    const [unit, setUnit] = useState('');
    const [notes, setNotes] = useState('');
    const [recordedAt, setRecordedAt] = useState('');

    const [isTestNameDirectInput, setIsTestNameDirectInput] = useState(false);
    const [isUnitDirectInput, setIsUnitDirectInput] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [patientLabResults, setPatientLabResults] = useState({});

    // const [activeForm, setActiveForm] = useState('mortality'); // 'mortality', 'sod2', 'complications', 'lis'
    const [activeForm, setActiveForm] = useState(initialActiveForm || 'mortality');
    ////////////////// 2025/06/18- 13:42 유정우가 추가 -> 바이탈 입력 폼을 위한 상태
    const [vitalInputs, setVitalInputs] = useState({
        bp: '', // 혈압 (예: '120/80')
        hr: '', // 심박수
        rr: '', // 호흡수
        temp: '', // 체온
        spo2: '', // 산소포화도
        etc: '', // 비고
        measured_at: new Date().toISOString().slice(0, 16), // 측정시간
    });

    // Vital 그래프 모달(팝업)의 상태
    const [isVitalGraphModalOpen, setVitalGraphModalOpen] = useState(false);

    // Vital 입력 폼의 값이 변경될 때 호출될 함수
    const handleVitalInputChange = (e) => {
        const { name, value } = e.target;
        setVitalInputs(prev => ({ ...prev, [name]: value }));
    };
    ///////////////////////////////////////////////////////////

    // 사망률 예측 관련 상태
    const [gender, setGender] = useState('');
    const [age, setAge] = useState('');
    const [heartRate, setHeartRate] = useState('');
    const [systolicBp, setSystolicBp] = useState('');
    const [diastolicBp, setDiastolicBp] = useState('');
    const [temperature, setTemperature] = useState('');
    const [respiratoryRate, setRespiratoryRate] = useState('');
    const [oxygenSaturation, setOxygenSaturation] = useState('');
    const [wbc, setWbc] = useState('');
    const [hemoglobin, setHemoglobin] = useState('');
    const [creatinine, setCreatinine] = useState('');
    const [bun, setBun] = useState('');
    const [glucose, setGlucose] = useState('');
    const [sodium, setSodium] = useState('');
    const [potassium, setPotassium] = useState('');

    // 합병증 관련 상태 (체크박스)
    const [complications, setComplications] = useState({
        sepsis: false,
        respiratory_failure: false,
        deep_vein_thrombosis: false,
        pulmonary_embolism: false,
        urinary_tract_infection: false,
        gastrointestinal_bleeding: false,
    });

    // 투약 정보 관련 상태 (체크박스)
    const [medications, setMedications] = useState({
        anticoagulant_flag: false,
        antiplatelet_flag: false,
        thrombolytic_flag: false,
        antihypertensive_flag: false,
        statin_flag: false,
        antibiotic_flag: false,
        vasopressor_flag: false,
    });

    // SOD2 (뇌졸중 특화 정보) 관련 상태
    const [strokeType, setStrokeType] = useState('');
    const [nihssScore, setNihssScore] = useState('');
    const [reperfusionTreatment, setReperfusionTreatment] = useState(false);
    const [reperfusionTime, setReperfusionTime] = useState('');
    const [strokeDate, setStrokeDate] = useState('');
    const [hoursAfterStroke, setHoursAfterStroke] = useState('');

    // --- [추가] 모달 및 데이터 조회를 위한 상태 ---
    const [modalInfo, setModalInfo] = useState({
        isOpen: false,
        title: '',
        records: [],
        recordType: '',
        formatRecord: () => []
    });
    const [viewLoading, setViewLoading] = useState(false);


    useEffect(() => {
        if (selectedPatient && selectedPatient.uuid) {
            loadLabResults(selectedPatient.uuid);
        } else {
            setPatientLabResults({});
        }
        const now = new Date();
        const formattedDateTime = now.toISOString().slice(0, 16);
        setRecordedAt(formattedDateTime);
    }, [selectedPatient]);

    useEffect(() => {
        if (!isTestNameDirectInput && LAB_TEST_DEFINITIONS[testName]) {
            setUnit(LAB_TEST_DEFINITIONS[testName].unit);
            setIsUnitDirectInput(false);
        } else if (!isTestNameDirectInput && testName === '') {
            setUnit('');
            setIsUnitDirectInput(false);
        } else if (isTestNameDirectInput) {
            setIsUnitDirectInput(true);
        }
    }, [testName, isTestNameDirectInput]);

    const loadLabResults = async (patientUuid) => {
        setLoading(true);
        setError(null);
        try {
            const results = await fetchLabResultsForPatient(patientUuid);
            const groupedResults = results.reduce((acc, current) => {
                if (!acc[current.test_name]) {
                    acc[current.test_name] = [];
                }
                acc[current.test_name].push(current);
                return acc;
            }, {});
            setPatientLabResults(groupedResults);
        } catch (err) {
            console.error("Error loading lab results:", err);
            setError("검사 결과 로드 실패: " + (err.message || err.response?.data?.error || '알 수 없는 오류'));
        } finally {
            setLoading(false);
        }
    };
    // --- [추가] SOD2 정보 포맷팅 함수 ---
    const formatSod2Record = (record) => [
        { label: '뇌졸중 유형', value: record.stroke_info?.stroke_type === 'ischemic_reperfusion' ? '허혈성 재관류' : (record.stroke_info?.stroke_type || 'N/A') },
        { label: 'NIHSS 점수', value: `${record.stroke_info?.nihss_score ?? 'N/A'} 점` },
        { label: '재관류 치료 여부', value: record.stroke_info?.reperfusion_treatment ? '예' : '아니오' },
        { label: '재관류 시간', value: record.stroke_info?.reperfusion_time ? `${record.stroke_info.reperfusion_time} 시간` : 'N/A' },
        { label: '뇌졸중 발생일', value: record.stroke_info?.stroke_date || 'N/A' },
        { label: '뇌졸중 후 경과 시간', value: `${record.stroke_info?.hours_after_stroke ?? 'N/A'} 시간` },
        { label: '기록 시각', value: new Date(record.recorded_at).toLocaleString() },
        { label: '비고', value: record.notes || '없음' }
    ];

    // --- [추가] 합병증/투약 정보 포맷팅 함수 ---
    const formatComplicationsRecord = (record) => {
        const complicationLabels = { sepsis: '패혈증', respiratory_failure: '호흡부전', deep_vein_thrombosis: '심부정맥혈전증', pulmonary_embolism: '폐색전증', urinary_tract_infection: '요로감염', gastrointestinal_bleeding: '위장관 출혈' };
        const medicationLabels = { anticoagulant_flag: '항응고제', antiplatelet_flag: '항혈소판제', thrombolytic_flag: '혈전용해제', antihypertensive_flag: '항고혈압제', statin_flag: '스타틴', antibiotic_flag: '항생제', vasopressor_flag: '승압제' };

        const complicationEntries = Object.entries(record.complications || {}).filter(([, value]) => value).map(([key]) => complicationLabels[key]);
        const medicationEntries = Object.entries(record.medications || {}).filter(([, value]) => value).map(([key]) => medicationLabels[key]);

        return [
            { label: '조회된 합병증', value: complicationEntries.length > 0 ? complicationEntries.join(', ') : '해당 없음' },
            { label: '처방된 약물', value: medicationEntries.length > 0 ? medicationEntries.join(', ') : '해당 없음' },
            { label: '기록 시각', value: new Date(record.recorded_at).toLocaleString() },
            { label: '비고', value: record.notes || '없음' }
        ];
    };
    // --- [추가] SOD2 자동 비고 생성 함수 ---
    const generateSod2Note = (newRecord, existingRecords) => {
        if (existingRecords.length === 0) {
            return `첫 SOD2 기록입니다. NIHSS 점수 ${newRecord.stroke_info.nihss_score}점으로 등록되었습니다.`;
        }
        const lastRecord = existingRecords[existingRecords.length - 1];
        const lastScore = lastRecord.stroke_info.nihss_score;
        const newScore = newRecord.stroke_info.nihss_score;

        let note = `이전 기록 대비 NIHSS 점수가 ${lastScore}점에서 ${newScore}점으로 변경되었습니다.`;

        if (newScore > lastScore) {
            note += " (점수 상승)";
        } else if (newScore < lastScore) {
            note += " (점수 감소/호전)";
        } else {
            note += " (변동 없음)";
        }
        return note;
    };

    // --- [추가] 합병증/투약 자동 비고 생성 함수 ---
    const generateComplicationsNote = (newRecord, existingRecords) => {
        const complicationLabels = { sepsis: '패혈증', respiratory_failure: '호흡부전', deep_vein_thrombosis: '심부정맥혈전증', pulmonary_embolism: '폐색전증', urinary_tract_infection: '요로감염', gastrointestinal_bleeding: '위장관 출혈' };
        const medicationLabels = { anticoagulant_flag: '항응고제', antiplatelet_flag: '항혈소판제', thrombolytic_flag: '혈전용해제', antihypertensive_flag: '항고혈압제', statin_flag: '스타틴', antibiotic_flag: '항생제', vasopressor_flag: '승압제' };

        if (existingRecords.length === 0) {
            const initialComplications = Object.entries(newRecord.complications).filter(([, v]) => v).map(([k]) => complicationLabels[k]).join(', ');
            const initialMedications = Object.entries(newRecord.medications).filter(([, v]) => v).map(([k]) => medicationLabels[k]).join(', ');
            let note = "첫 기록입니다.";
            if (initialComplications) note += `\n- 진단: ${initialComplications}`;
            if (initialMedications) note += `\n- 투약: ${initialMedications}`;
            return note;
        }

        const lastRecord = existingRecords[existingRecords.length - 1];
        const changes = [];

        // 합병증 변화 감지
        for (const key in complicationLabels) {
            if (newRecord.complications[key] && !lastRecord.complications[key]) {
                changes.push(`${complicationLabels[key]} 새로 진단됨.`);
            } else if (!newRecord.complications[key] && lastRecord.complications[key]) {
                changes.push(`${complicationLabels[key]} 호전/해결됨.`);
            }
        }

        // 투약 정보 변화 감지
        for (const key in medicationLabels) {
            if (newRecord.medications[key] && !lastRecord.medications[key]) {
                changes.push(`${medicationLabels[key]} 투약 시작.`);
            } else if (!newRecord.medications[key] && lastRecord.medications[key]) {
                changes.push(`${medicationLabels[key]} 투약 중단.`);
            }
        }

        if (changes.length === 0) {
            return "이전 기록과 비교하여 변동 사항 없음.";
        }

        return "이전 기록 대비 변경사항:\n- " + changes.join('\n- ');
    };

    /////////////////// 2025/06/18 - 13:46 유정우가 추가 vital ////////////////
    const VitalsGraphModal = ({ patientId, isOpen, onClose }) => {
        const [records, setRecords] = useState([]);
        const [timeRange, setTimeRange] = useState('1d'); // '1d', '1w', '1m', '1y'
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            if (isOpen) {
                setLoading(true);
                fetchVitalsHistory(patientId, timeRange)
                    .then(data => {
                        setRecords(data || []); // 데이터가 null일 경우 빈 배열로 처리
                        setLoading(false);
                    })
                    .catch(err => {
                        console.error(err);
                        setRecords([]); // 에러 발생 시 빈 배열로 초기화
                        setLoading(false);
                    });
            }
        }, [isOpen, patientId, timeRange]);

        if (!isOpen) return null;

        // 차트 데이터 가공
        const chartData = {
            labels: records.map(rec => new Date(rec.recorded_at).toLocaleString()),
            datasets: [
                {
                    label: '수축기 혈압 (SBP)',
                    data: records.map(rec => {
                        const bp = rec.measurements?.bp;
                        return bp && bp.includes('/') ? parseInt(bp.split('/')[0], 10) : null;
                    }),
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                },
                {
                    label: '이완기 혈압 (DBP)',
                    data: records.map(rec => {
                        const bp = rec.measurements?.bp;
                        return bp && bp.includes('/') ? parseInt(bp.split('/')[1], 10) : null;
                    }),
                    borderColor: 'rgb(255, 159, 64)',
                    backgroundColor: 'rgba(255, 159, 64, 0.5)',
                },
                {
                    label: '심박수 (HR)',
                    data: records.map(rec => rec.measurements?.hr),
                    borderColor: 'rgb(75, 192, 192)',
                },
                {
                    label: '호흡수 (RR)',
                    data: records.map(rec => rec.measurements?.rr),
                    borderColor: 'rgb(54, 162, 235)',
                },
                {
                    label: '산소포화도 (SpO2)',
                    data: records.map(rec => rec.measurements?.spo2),
                    borderColor: 'rgb(153, 102, 255)',
                },
                {
                    label: '체온 (Temp)',
                    data: records.map(rec => rec.measurements?.temp),
                    borderColor: 'rgb(255, 205, 86)',
                }
            ]
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { tooltip: { mode: 'index', intersect: false } },
        };

        return (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                <div style={{ display: 'flex', flexDirection: 'column', background: 'white', width: '90%', height: '90%', maxWidth: '1400px', padding: '20px', borderRadius: '8px', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                        <h2 style={{ margin: 0 }}>{patientId} 환자 Vital 그래프</h2>
                        <button onClick={onClose} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <div style={{ display: 'flex', flex: 1, gap: '20px', overflow: 'hidden' }}>
                        {/* 좌측 패널: 기록 목록 */}
                        <div style={{ width: '40%', borderRight: '1px solid #ccc', overflowY: 'auto', paddingRight: '10px' }}>
                            <h3>Vital 기록</h3>
                            {loading ? <p>로딩 중...</p> : records.length > 0 ? records.map(rec => (
                                <div key={rec.session_id} style={{ borderBottom: '1px solid #eee', padding: '10px 0', marginBottom: '10px' }}>
                                    <strong style={{ display: 'block', marginBottom: '5px' }}>{new Date(rec.recorded_at).toLocaleString()}</strong>
                                    <p style={{ margin: 0 }}>
                                        {`BP: ${rec.measurements?.bp || 'N/A'}, HR: ${rec.measurements?.hr || 'N/A'}, RR: ${rec.measurements?.rr || 'N/A'}, Temp: ${rec.measurements?.temp || 'N/A'}, SpO2: ${rec.measurements?.spo2 || 'N/A'}`}
                                    </p>
                                    {rec.notes && <p style={{ marginTop: '5px', color: '#555' }}>비고: {rec.notes}</p>}
                                </div>
                            )) : <p>표시할 데이터가 없습니다.</p>}
                        </div>
                        {/* 우측 패널: 그래프 */}
                        <div style={{ width: '60%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ marginBottom: '10px' }}>
                                {['1d', '1w', '1m', '1y'].map(range => (
                                    <button key={range} onClick={() => setTimeRange(range)} style={{ background: timeRange === range ? '#007bff' : '#f0f0f0', color: timeRange === range ? 'white' : 'black', border: '1px solid #ccc', padding: '5px 10px', cursor: 'pointer', marginRight: '5px' }}>
                                        {range === '1d' ? '1일' : range === '1w' ? '일주일' : range === '1m' ? '한달' : '1년'}
                                    </button>
                                ))}
                            </div>
                            <div style={{ flex: 1, position: 'relative' }}>
                                {loading ? <p>그래프 로딩 중...</p> : <Line data={chartData} options={chartOptions} />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    //////////////////////// 여기까지 //////////////////////////

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage('');
        setLoading(true);

        if (!selectedPatient || !selectedPatient.uuid) {
            setError("환자가 선택되지 않았습니다.");
            setLoading(false);
            return;
        }
        if (!recordedAt) {
            setError("기록 날짜와 시간을 입력해주세요.");
            setLoading(false);
            return;
        }

        try {
            let submissionData = {};
            let apiCallFunction;

            ////////////////////// 여기도 유정우가 추가 ////////////////////////////
            // if-else if 구조로 각 폼이 한번만 처리되도록 수정
            if (activeForm === 'vital') {
                if (!vitalInputs.bp || !vitalInputs.hr || !vitalInputs.rr || !vitalInputs.temp || !vitalInputs.spo2) {
                    throw new Error("모든 필수 바이탈 수치를 입력해주세요.");
                }
                const submissionData = {
                    patient: selectedPatient.uuid,
                    measurements: {
                        bp: vitalInputs.bp, // 혈압은 '120/80' 형태의 문자열이므로 그대로 둡니다.
                        hr: parseInt(vitalInputs.hr, 10), // 문자열을 10진수 정수로 변환
                        rr: parseInt(vitalInputs.rr, 10), // 문자열을 10진수 정수로 변환
                        temp: parseFloat(vitalInputs.temp), // 문자열을 소수점이 있는 숫자로 변환
                        spo2: parseInt(vitalInputs.spo2, 10)  // 문자열을 10진수 정수로 변환
                    },
                    notes: vitalInputs.etc,
                    recorded_at: vitalInputs.measured_at
                };
                apiCallFunction = () => saveVitals(submissionData);
                //////////////////////// 여기까지 유정우 //////////////////////

            } else if (activeForm === 'sod2') {
                let finalNotes = notes;
                // 비고가 비어있을 때만 자동 생성 로직 실행
                if (!notes) {
                    try {
                        const existingRecords = await fetchStrokeInfoHistory(selectedPatient.uuid);
                        const newRecordForNote = { stroke_info: { nihss_score: parseInt(nihssScore) || 0 } };
                        finalNotes = generateSod2Note(newRecordForNote, existingRecords);
                    } catch (err) {
                        console.error("비고 생성을 위한 데이터 조회 실패:", err);
                        finalNotes = "첫 기록이거나 이전 기록 조회에 실패했습니다.";
                    }
                }

                submissionData = {
                    patient: selectedPatient.uuid,
                    stroke_info: {
                        stroke_type: strokeType,
                        nihss_score: parseInt(nihssScore) || 0,
                        reperfusion_treatment: reperfusionTreatment,
                        reperfusion_time: parseFloat(reperfusionTime) || null,
                        stroke_date: strokeDate,
                        hours_after_stroke: parseFloat(hoursAfterStroke) || null
                    },
                    notes: finalNotes,
                    recorded_at: recordedAt
                };

                // 기존 뇌졸중 정보 저장 + SOD2 자동 평가
                apiCallFunction = async () => {
                    // 1. 뇌졸중 정보 저장
                    const strokeResponse = await registerStrokeInfo(submissionData);

                    // 2. SOD2 평가 수행
                    try {
                        // 환자 상세 정보 가져오기
                        let patientAge = 65;
                        let patientGender = 'M';

                        try {
                            const patientDetails = await fetchPatientDetails(selectedPatient.uuid);
                            if (patientDetails?.person?.birthdate) {
                                patientAge = new Date().getFullYear() - new Date(patientDetails.person.birthdate).getFullYear();
                            }
                            if (patientDetails?.person?.gender) {
                                patientGender = patientDetails.person.gender;
                            }
                        } catch (patientError) {
                            console.warn('환자 상세 정보 조회 실패, 기본값 사용:', patientError);
                        }

                        const sod2AssessmentData = {
                            patient: selectedPatient.uuid,
                            age: patientAge,
                            gender: patientGender,
                            stroke_info: submissionData.stroke_info
                        };

                        const sod2Response = await assessSOD2Status(sod2AssessmentData);
                        console.log('SOD2 자동 평가 완료:', sod2Response);

                        return {
                            stroke: strokeResponse,
                            sod2: sod2Response
                        };
                    } catch (sod2Error) {
                        console.warn('SOD2 평가 실패, 뇌졸중 정보는 저장됨:', sod2Error);
                        return { stroke: strokeResponse, sod2_error: sod2Error.message };
                    }
                };

            } else if (activeForm === 'complications') {
                let finalNotes = notes;
                // 비고가 비어있을 때만 자동 생성 로직 실행
                if (!notes) {
                    try {
                        const existingRecords = await fetchComplicationsHistory(selectedPatient.uuid);
                        const newRecordForNote = { complications, medications };
                        finalNotes = generateComplicationsNote(newRecordForNote, existingRecords);
                    } catch (err) {
                        console.error("비고 생성을 위한 데이터 조회 실패:", err);
                        finalNotes = "첫 기록이거나 이전 기록 조회에 실패했습니다.";
                    }
                }
                submissionData = {
                    patient: selectedPatient.uuid,
                    complications: complications,
                    medications: medications,
                    notes: finalNotes,
                    recorded_at: recordedAt
                };
                apiCallFunction = () => registerComplicationsAndMedications(submissionData);

            } else if (activeForm === 'mortality') {
                submissionData = {
                    patient_uuid: selectedPatient.uuid,
                    age: parseInt(age) || 0,
                    gender: gender,
                    admission_type: 'EMERGENCY', // 기본값
                    systolic_bp: parseFloat(systolicBp) || 0,
                    diastolic_bp: parseFloat(diastolicBp) || 0,
                    glucose: parseFloat(glucose) || 0,
                    bun: parseFloat(bun) || 0,
                    creatinine: parseFloat(creatinine) || 0,
                    ck_mb: 0, // 기본값
                    prediction_result: null // 예측 결과는 나중에 채워짐
                };
                apiCallFunction = () => submitMortalityPredictionData(submissionData);
            }

            const result = await apiCallFunction();

            // SOD2 평가 결과가 포함된 경우 추가 메시지 표시
            if (activeForm === 'sod2' && result.sod2) {
                setSuccessMessage(`뇌졸중 정보가 저장되고 SOD2 평가가 완료되었습니다. 
현재 SOD2 수준: ${(result.sod2.result.sod2_status.current_level * 100).toFixed(1)}%
산화 스트레스 위험도: ${result.sod2.result.sod2_status.oxidative_stress_risk === 'high' ? '높음' :
                        result.sod2.result.sod2_status.oxidative_stress_risk === 'medium' ? '보통' : '낮음'}`);
            } else if (activeForm === 'sod2' && result.sod2_error) {
                setSuccessMessage(`뇌졸중 정보는 저장되었으나 SOD2 평가 중 오류가 발생했습니다: ${result.sod2_error}`);
            } else {
                setSuccessMessage('데이터가 성공적으로 등록되었습니다.');
            }

            // 폼 필드 초기화
            if (activeForm === 'mortality') {
                setGender(''); setAge(''); setHeartRate(''); setSystolicBp(''); setDiastolicBp('');
                setTemperature(''); setRespiratoryRate(''); setOxygenSaturation(''); setWbc('');
                setHemoglobin(''); setCreatinine(''); setBun(''); setGlucose(''); setSodium(''); setPotassium('');
            } else if (activeForm === 'sod2') {
                setStrokeType(''); setNihssScore(''); setReperfusionTreatment(false);
                setReperfusionTime(''); setStrokeDate(''); setHoursAfterStroke('');
            } else if (activeForm === 'complications') {
                setComplications({
                    sepsis: false, respiratory_failure: false, deep_vein_thrombosis: false,
                    pulmonary_embolism: false, urinary_tract_infection: false, gastrointestinal_bleeding: false
                });
                setMedications({
                    anticoagulant_flag: false, antiplatelet_flag: false, thrombolytic_flag: false,
                    antihypertensive_flag: false, statin_flag: false, antibiotic_flag: false, vasopressor_flag: false
                });
            } else if (activeForm === 'lis') {
                setTestName(''); setTestValue('');
                loadLabResults(selectedPatient.uuid);
            } else if (activeForm === 'vital') { // 유정우가 추가 vital 입력 폼 초기화 로직
                setVitalInputs({
                    bp: '', hr: '', rr: '', temp: '', spo2: '', etc: '',
                    measured_at: new Date().toISOString().slice(0, 16)
                });
            }

            setNotes('');
            setUnit('');
            const now = new Date();
            const formattedDateTime = now.toISOString().slice(0, 16);
            setRecordedAt(formattedDateTime);

        } catch (err) {
            console.error("Error registering data:", err);
            let errorMsg = '알 수 없는 오류';

            if (err.response?.data) {
                errorMsg = err.response.data.detail || JSON.stringify(err.response.data) || err.message;
            } else {
                errorMsg = err.message;
            }

            setError("데이터 등록 실패: " + errorMsg);
        } finally {
            setLoading(false);
        }
    };
    // --- [추가] SOD2 정보 조회 처리 함수 ---
    const handleViewSod2 = async () => {
        setViewLoading(true);
        setError(null);
        try {
            // ★★★ 핵심 변경: 로컬 상태 대신 실제 API 호출
            const results = await fetchStrokeInfoHistory(selectedPatient.uuid);
            console.log(`Fetched ${results.length} SOD2 records from API.`);

            setModalInfo({ isOpen: true, title: `${selectedPatient.display}님의 SOD2 정보`, records: results, recordType: 'sod2', formatRecord: formatSod2Record });
        } catch (err) {
            console.error("Error fetching SOD2 data:", err);
            setError("SOD2 정보 조회 실패: " + (err.message || '알 수 없는 오류'));
        } finally {
            setViewLoading(false);
        }
    };

    const handleViewComplications = async () => {
        setViewLoading(true);
        setError(null);
        try {
            // ★★★ 핵심 변경: 로컬 상태 대신 실제 API 호출
            const results = await fetchComplicationsHistory(selectedPatient.uuid);
            console.log(`Fetched ${results.length} Complication records from API.`);

            setModalInfo({ isOpen: true, title: `${selectedPatient.display}님의 합병증 및 투약 정보`, records: results, recordType: 'complications', formatRecord: formatComplicationsRecord });
        } catch (err) {
            console.error("Error fetching complication data:", err);
            setError("합병증/투약 정보 조회 실패: " + (err.message || '알 수 없는 오류'));
        } finally {
            setViewLoading(false);
        }
    };

    const generateChartData = (resultsForSingleTest) => {
        const sortedData = resultsForSingleTest.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

        const labels = sortedData.map(res => new Date(res.recorded_at).toLocaleString());
        const dataValues = sortedData.map(res => res.test_value);

        const displayUnit = sortedData.length > 0 ? sortedData[0].unit || '' : '';

        return {
            labels: labels,
            datasets: [
                {
                    label: `${sortedData.length > 0 ? LAB_TEST_DEFINITIONS[sortedData[0].test_name]?.name || sortedData[0].test_name : ''} (${displayUnit})`,
                    data: dataValues,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    fill: true,
                    pointCustomData: sortedData.map(res => res.notes),
                },
            ],
        };
    };

    const chartOptions = (testNameForTitle) => ({
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `${selectedPatient?.display || '선택된 환자'}의 ${LAB_TEST_DEFINITIONS[testNameForTitle]?.name || testNameForTitle} 검사 결과 추이`,
            },
            tooltip: {
                callbacks: {
                    title: function (context) {
                        return `날짜: ${context[0].label}`;
                    },
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y;
                        }
                        return label;
                    },
                    afterBody: function (context) {
                        if (context[0].dataset.pointCustomData && context[0].dataIndex !== undefined) {
                            const notes = context[0].dataset.pointCustomData[context[0].dataIndex];
                            return notes ? `비고: ${notes}` : '';
                        }
                        return '';
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: '날짜',
                },
            },
            y: {
                title: {
                    display: true,
                    text: '수치',
                },
                beginAtZero: false,
            },
        },
    });

    const handleComplicationChange = (e) => {
        setComplications({
            ...complications,
            [e.target.name]: e.target.checked,
        });
    };

    const handleMedicationChange = (e) => {
        setMedications({
            ...medications,
            [e.target.name]: e.target.checked,
        });
    };

    if (!selectedPatient) {
        return (
            <div className="lab-results-container" style={{ padding: '20px' }}>
                <h3>LIS 검사 결과</h3>
                <p>환자를 선택해야 검사 결과를 조회하고 입력할 수 있습니다.</p>
                <button onClick={onBackToPatientList} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                    환자 목록으로 돌아가기
                </button>
            </div>
        );
    }

    return (
        <div className="lab-results-container" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {/* 모달 렌더링 */}
            {modalInfo.isOpen && (
                <InfoModal
                    title={modalInfo.title}
                    records={modalInfo.records}
                    recordType={modalInfo.recordType}
                    onClose={() => setModalInfo({ isOpen: false, title: '', records: [], recordType: '', formatRecord: () => [] })}
                    formatRecord={modalInfo.formatRecord}
                />
            )}
            {console.log('VitalsGraphModal에 전달되는 환자 정보:', selectedPatient)}
            {/* ===== 바이탈 ===== */}
            {/* VitalsGraphModal을 렌더링하려면 이 컴포넌트가 임포트되어야 합니다. */}
            {/* 현재 파일 상단에 import { VitalsGraphModal } from './VitalsGraphModal'; 이런 식으로 임포트되어야 합니다. */}
            {isVitalGraphModalOpen && (
                <VitalsGraphModal
                    patientId={selectedPatient.uuid}
                    patientName={selectedPatient.display}
                    isOpen={isVitalGraphModalOpen}
                    onClose={() => setVitalGraphModalOpen(false)}
                />
            )}

            <h3>LIS 검사 결과 - {selectedPatient.display}</h3>
            <p><strong>UUID:</strong> {selectedPatient.uuid}</p>

            <button onClick={onBackToPatientList} style={{ marginBottom: '20px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                환자 목록으로 돌아가기
            </button>

            {/* 정보 조회 버튼 그룹 */}
            <div style={{ marginBottom: '20px', borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '15px 0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                    onClick={handleViewSod2}
                    disabled={viewLoading}
                    style={{ padding: '10px 15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {viewLoading ? '조회 중...' : 'SOD2 정보 열람'}
                </button>
                <button
                    onClick={handleViewComplications}
                    disabled={viewLoading}
                    style={{ padding: '10px 15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {viewLoading ? '조회 중...' : '합병증/투약 정보 열람'}
                </button>
                <button onClick={() => setVitalGraphModalOpen(true)}>Vital 그래프 보기</button>
            </div>


            {/* 새로운 폼 선택 버튼들 */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button
                    onClick={() => setActiveForm('mortality')}
                    style={{ padding: '10px 15px', backgroundColor: activeForm === 'mortality' ? '#0056b3' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    사망률 예측 입력
                </button>
                <button
                    onClick={() => setActiveForm('sod2')}
                    style={{ padding: '10px 15px', backgroundColor: activeForm === 'sod2' ? '#0056b3' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    SOD2 (뇌졸중) 정보 입력
                </button>
                <button
                    onClick={() => setActiveForm('complications')}
                    style={{ padding: '10px 15px', backgroundColor: activeForm === 'complications' ? '#0056b3' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    합병증 및 투약 정보 입력
                </button>
                <button
                    onClick={() => setActiveForm('lis')}
                    style={{ padding: '10px 15px', backgroundColor: activeForm === 'lis' ? '#0056b3' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    LIS 검사 결과 입력
                </button>
                <button onClick={() => setActiveForm('vital')} style={{ padding: '10px 15px', backgroundColor: activeForm === 'vital' ? '#0056b3' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Vital 정보 입력</button>
            </div>

            {/* 동적으로 렌더링되는 입력 폼 */}
            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '30px', backgroundColor: 'white' }}>
                <h4>
                    {activeForm === 'mortality' && '새 사망률 예측 데이터 입력'}
                    {activeForm === 'sod2' && '새 SOD2 (뇌졸중 특화) 정보 입력'}
                    {activeForm === 'complications' && '새 합병증 및 투약 정보 입력'}
                    {activeForm === 'lis' && '새 LIS 검사 결과 입력'}
                    {activeForm === 'vital' && '새 Vital 정보 입력'}
                </h4>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    {/* 2025/06/18 - 14:00 유정우가 추가 -> 바이탈 입력 폼 */}
                    {activeForm === 'vital' && (
                        <div style={{ gridColumn: '1 / -1' }}> {/* 이 div가 부모 form의 grid 규칙을 깨고 새로운 독립적인 공간을 만듭니다. */}
                            {/* 이 안에서만 적용되는 새로운 2열 grid 레이아웃을 정의합니다. */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px 20px', borderTop: '1px dashed #ccc', paddingTop: '15px' }}>

                                {/* --- 1번째 줄 --- */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>혈압 (BP, mmHg):</label>
                                    <input name="bp" value={vitalInputs.bp} onChange={handleVitalInputChange} placeholder="예: 120/80" required style={{ width: '90%', padding: '8px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>심박수 (HR, /min):</label>
                                    <input name="hr" type="number" value={vitalInputs.hr} onChange={handleVitalInputChange} required style={{ width: '90%', padding: '8px' }} />
                                </div>

                                {/* --- 2번째 줄 --- */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>호흡수 (RR, /min):</label>
                                    <input name="rr" type="number" value={vitalInputs.rr} onChange={handleVitalInputChange} required style={{ width: '90%', padding: '8px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>체온 (Temp, °C):</label>
                                    <input name="temp" type="number" step="0.1" value={vitalInputs.temp} onChange={handleVitalInputChange} required style={{ width: '90%', padding: '8px' }} />
                                </div>

                                {/* --- 3번째 줄 --- */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>산소포화도 (SpO2, %):</label>
                                    <input name="spo2" type="number" value={vitalInputs.spo2} onChange={handleVitalInputChange} required style={{ width: '90%', padding: '8px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>측정 시간:</label>
                                    <input name="measured_at" type="datetime-local" value={vitalInputs.measured_at} onChange={handleVitalInputChange} required style={{ width: '90%', padding: '8px' }} />
                                </div>

                            </div>
                        </div>
                    )}
                    {/*여기까지 유정우*/}

                    {activeForm === 'mortality' && (
                        <>
                            {/* 기본 정보 */}
                            <div>
                                <label>성별:</label>
                                <select value={gender} onChange={(e) => setGender(e.target.value)} required style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                                    <option value="">선택</option>
                                    <option value="M">남성</option>
                                    <option value="F">여성</option>
                                </select>
                            </div>
                            <div>
                                <label>나이:</label>
                                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} required style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>

                            {/* 활력 징후 */}
                            <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #ccc', paddingTop: '15px' }}>
                                <h4>활력 징후</h4>
                            </div>
                            <div>
                                <label>심박수 (60-100):</label>
                                <input type="number" step="0.1" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} required style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>
                            <div>
                                <label>수축기 혈압 (90-140):</label>
                                <input type="number" step="0.1" value={systolicBp} onChange={(e) => setSystolicBp(e.target.value)} required style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>
                            <div>
                                <label>이완기 혈압 (60-90):</label>
                                <input type="number" step="0.1" value={diastolicBp} onChange={(e) => setDiastolicBp(e.target.value)} required style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>
                            <div>
                                <label>체온 (36-37.5°C):</label>
                                <input type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} required style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>
                            <div>
                                <label>호흡수 (12-20):</label>
                                <input type="number" step="0.1" value={respiratoryRate} onChange={(e) => setRespiratoryRate(e.target.value)} required style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>
                            <div>
                                <label>산소포화도 (95-100%):</label>
                                <input type="number" step="0.1" value={oxygenSaturation} onChange={(e) => setOxygenSaturation(e.target.value)} required style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>

                            {/* 주요 혈액 검사 */}
                            <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #ccc', paddingTop: '15px' }}>
                                <h4>주요 혈액 검사</h4>
                            </div>
                            <div>
                                <label>백혈구 (4-11 × 10³/μL):</label>
                                <input type="number" step="0.1" value={wbc} onChange={(e) => setWbc(e.target.value)} required style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>
                            <div>
                                <label>헤모글로빈 (12-16 g/dL):</label>
                                <input type="number" step="0.1" value={hemoglobin} onChange={(e) => setHemoglobin(e.target.value)} required style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>
                            <div>
                                <label>크레아티닌 (0.7-1.3 mg/dL):</label>
                                <input type="number" step="0.01" value={creatinine} onChange={(e) => setCreatinine(e.target.value)} required style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>
                            <div>
                                <label>혈중요소질소 (7-20 mg/dL):</label>
                                <input type="number" step="0.1" value={bun} onChange={(e) => setBun(e.target.value)} required style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>
                            <div>
                                <label>혈당 (70-100 mg/dL):</label>
                                <input type="number" step="0.1" value={glucose} onChange={(e) => setGlucose(e.target.value)} required style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>
                            <div>
                                <label>나트륨 (136-145 mEq/L):</label>
                                <input type="number" step="0.1" value={sodium} onChange={(e) => setSodium(e.target.value)} required style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>
                            <div>
                                <label>칼륨 (3.5-5.0 mEq/L):</label>
                                <input type="number" step="0.1" value={potassium} onChange={(e) => setPotassium(e.target.value)} required style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>
                        </>
                    )}

                    {activeForm === 'sod2' && (
                        <>
                            <div>
                                <label>뇌졸중 유형:</label>
                                <select value={strokeType} onChange={(e) => setStrokeType(e.target.value)} required style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                                    <option value="">선택</option>
                                    <option value="ischemic_reperfusion">허혈성 재관류</option>
                                    <option value="ischemic_no_reperfusion">허혈성 비재관류</option>
                                    <option value="hemorrhagic">출혈성</option>
                                </select>
                            </div>
                            <div>
                                <label>NIHSS 점수 (0-42):</label>
                                <input type="number" value={nihssScore} onChange={(e) => setNihssScore(e.target.value)} required min="0" max="42" style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <label>재관류 치료 여부:</label>
                                <input type="checkbox" checked={reperfusionTreatment} onChange={(e) => setReperfusionTreatment(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                            </div>
                            <div>
                                <label>재관류 시간 (시간):</label>
                                <input type="number" step="0.1" value={reperfusionTime} onChange={(e) => setReperfusionTime(e.target.value)} style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>
                            <div>
                                <label>뇌졸중 발생일 (YYYY-MM-DD):</label>
                                <input type="date" value={strokeDate} onChange={(e) => setStrokeDate(e.target.value)} required style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>
                            <div>
                                <label>뇌졸중 후 경과 시간 (시간):</label>
                                <input type="number" step="0.1" value={hoursAfterStroke} onChange={(e) => setHoursAfterStroke(e.target.value)} style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>
                        </>
                    )}

                    {activeForm === 'complications' && (
                        <>
                            <div style={{ gridColumn: 'span 2' }}>
                                <h4>기존 합병증 (해당하는 항목을 체크하세요)</h4>
                                {Object.keys(complications).map(key => (
                                    <div key={key} style={{ marginBottom: '5px' }}>
                                        <input
                                            type="checkbox"
                                            id={key}
                                            name={key}
                                            checked={complications[key]}
                                            onChange={handleComplicationChange}
                                            style={{ marginRight: '5px', transform: 'scale(1.1)' }}
                                        />
                                        <label htmlFor={key}>{
                                            key === 'sepsis' ? '패혈증' :
                                                key === 'respiratory_failure' ? '호흡부전' :
                                                    key === 'deep_vein_thrombosis' ? '심부정맥혈전증' :
                                                        key === 'pulmonary_embolism' ? '폐색전증' :
                                                            key === 'urinary_tract_infection' ? '요로감염' :
                                                                key === 'gastrointestinal_bleeding' ? '위장관 출혈' : key
                                        }</label>
                                    </div>
                                ))}
                            </div>

                            <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #ccc', paddingTop: '15px' }}>
                                <h4>현재 투약 정보 (해당하는 항목을 체크하세요)</h4>
                                {Object.keys(medications).map(key => (
                                    <div key={key} style={{ marginBottom: '5px' }}>
                                        <input
                                            type="checkbox"
                                            id={key}
                                            name={key}
                                            checked={medications[key]}
                                            onChange={handleMedicationChange}
                                            style={{ marginRight: '5px', transform: 'scale(1.1)' }}
                                        />
                                        <label htmlFor={key}>{
                                            key === 'anticoagulant_flag' ? '항응고제' :
                                                key === 'antiplatelet_flag' ? '항혈소판제' :
                                                    key === 'thrombolytic_flag' ? '혈전용해제' :
                                                        key === 'antihypertensive_flag' ? '항고혈압제' :
                                                            key === 'statin_flag' ? '스타틴' :
                                                                key === 'antibiotic_flag' ? '항생제' :
                                                                    key === 'vasopressor_flag' ? '승압제' : key
                                        }</label>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {activeForm === 'lis' && (
                        <>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label>검사 항목명:*</label>
                                {!isTestNameDirectInput ? (
                                    <select
                                        value={testName}
                                        onChange={(e) => setTestName(e.target.value)}
                                        required
                                        style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    >
                                        <option value="">-- 검사 항목 선택 --</option>
                                        {LAB_TEST_KEYS.map(key => (
                                            <option key={key} value={key}>{LAB_TEST_DEFINITIONS[key].name}</option>
                                        ))}
                                        <option value="DIRECT_INPUT">직접 입력...</option>
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={testName}
                                        onChange={(e) => setTestName(e.target.value)}
                                        required
                                        placeholder="검사 항목명 직접 입력"
                                        style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsTestNameDirectInput(!isTestNameDirectInput);
                                        setTestName('');
                                        setUnit('');
                                    }}
                                    style={{ marginLeft: '10px', padding: '8px 12px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.85rem' }}
                                >
                                    {isTestNameDirectInput ? '목록 선택' : '직접 입력'}
                                </button>
                            </div>

                            <div>
                                <label>검사 수치:*</label>
                                <input type="number" step="0.01" value={testValue} onChange={(e) => setTestValue(e.target.value)} required style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>

                            <div>
                                <label>단위:</label>
                                {isUnitDirectInput ? (
                                    <input
                                        type="text"
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value)}
                                        style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                        placeholder="단위 직접 입력"
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={unit}
                                        readOnly
                                        style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: '#e9ecef' }}
                                    />
                                )}
                                {isTestNameDirectInput && (
                                    <button
                                        type="button"
                                        onClick={() => setIsUnitDirectInput(!isUnitDirectInput)}
                                        style={{ marginLeft: '10px', padding: '8px 12px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.85rem' }}
                                    >
                                        {isUnitDirectInput ? '자동 설정' : '직접 입력'}
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {/* 유정우가 추가 */}
                    {/* 공통 날짜/시간 필드 (vital 폼이 아닐 때만 표시) */}
                    {activeForm !== 'vital' && (
                        <div>
                            <label>기록 날짜/시간:*</label>
                            <input
                                type="datetime-local"
                                value={recordedAt}
                                onChange={(e) => setRecordedAt(e.target.value)}
                                required
                            // 이 필드에 스타일이 필요하다면 여기에 추가해주세요.
                            // 예시: style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                        </div>
                    )}

                    {/* 비고 필드 (모든 폼에서 사용되므로 조건부 없이 항상 표시) */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <label>비고:</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows="3"
                            style={{ width: '95%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                        ></textarea>
                    </div>

                    {/* 제출 버튼 */}
                    <button type="submit" disabled={loading} style={{ gridColumn: 'span 2', padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        {loading ? '등록 중...' : '데이터 등록'}
                    </button>
                    {/* 여기까지 유정우 */}
                </form>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                {successMessage && <p style={{ color: 'green', marginTop: '10px' }}>{successMessage}</p>}
            </div>

            {/* LIS 수치 그래프 (기존과 동일하게 유지) */}
            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: 'white' }}>
                <h4>검사 결과 추이 그래프</h4>
                {loading && <p>그래프 데이터 로딩 중...</p>}
                {error && !loading && <p style={{ color: 'red' }}>{error}</p>}
                {!loading && Object.keys(patientLabResults).length === 0 && !error && (
                    <p>이 환자에 대한 LIS 검사 결과가 없습니다. 위에 폼을 사용하여 첫 번째 결과를 입력하세요.</p>
                )}
                {!loading && Object.keys(patientLabResults).length > 0 && (
                    <div>
                        {Object.keys(patientLabResults).map(testNameKey => (
                            <div key={testNameKey} style={{ marginBottom: '20px' }}>
                                <Line data={generateChartData(patientLabResults[testNameKey])} options={chartOptions(testNameKey)} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* NiftiUploadManager 추가 */}
            <NiftiUploadManager patient={selectedPatient} />

            <PatientDicomManager
                patient={selectedPatient}
                onPatientDetailsUpdated={onSelectedPatientUpdated} // ◀◀◀ 이 한 줄을 꼭 추가해주세요!
            />
        </div>
    );
};

export const PatientDicomManager = ({ patient, onPatientDetailsUpdated }) => {

    const [selectedFile, setSelectedFile] = useState(null);

    const [studies, setStudies] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [uploadLoading, setUploadLoading] = useState(false);

    const [uploadError, setUploadError] = useState(null);

    const [uploadSuccess, setUploadSuccess] = useState(false);

    // ★★★ 어떤 모달을 열지 결정하는 상태 추가 ('viewer' 또는 'annotation') ★★★
    const [modalMode, setModalMode] = useState('viewer');

    const patientIdentifierToUse = patient?.identifier;

    const patientDisplayName = patient?.display_name || '선택된 환자';

    useEffect(() => {

        if (uploadSuccess && patient?.uuid) {

            console.log("[PatientDicomManager] Upload success detected, refreshing patient data");

            if (onPatientDetailsUpdated) {

                onPatientDetailsUpdated(patient.uuid)

                    .then(updatedData => {

                        console.log("[PatientDicomManager] Patient data refreshed successfully:", updatedData);

                    })

                    .catch(error => {

                        console.error("[PatientDicomManager] Error refreshing patient data:", error);

                    });

            }

            setUploadSuccess(false);

        }

    }, [uploadSuccess, patient?.uuid, onPatientDetailsUpdated]); // onPatientDetailsUpdated 의존성 추가



    const handleFileChange = (event) => {

        setSelectedFile(event.target.files[0]);

    };



    const handleUpload = async () => {

        if (!selectedFile) {

            setUploadError('파일을 선택해주세요.');

            return;

        }

        if (!patient?.uuid) {

            setUploadError('환자가 선택되지 않았습니다.');

            return;

        }



        setUploadLoading(true);

        setUploadError(null);



        try {

            const formData = new FormData();

            formData.append('dicom_file', selectedFile);

            formData.append('patient_identifier', patient.identifier);



            await uploadDicomFile(formData);

            setUploadSuccess(true);



            alert('DICOM 업로드 및 동기화 성공!');

            setSelectedFile(null);



        } catch (error) {

            console.error('DICOM 업로드 실패:', error);

            const errorMessage = error.response?.data?.error || error.message || '알 수 없는 오류';

            setUploadError(`업로드 실패: ${errorMessage}`);

        } finally {

            setUploadLoading(false);

        }

    };



    // ★★★ 영상 조회 로직을 하나로 합치고, mode를 인자로 받도록 수정 ★★★

    const handleViewImages = async (mode) => {

        if (!patientIdentifierToUse) {

            setUploadError('환자 식별자(Identifier)가 없습니다. 먼저 DICOM 파일을 업로드하세요.');

            return;

        }



        setUploadError(null);

        console.log(`[PatientDicomManager] 영상 검색 시도 (모드: ${mode}): Patient Identifier =`, patientIdentifierToUse);



        try {

            const response = await api.get(`/pacs/patients/${encodeURIComponent(patientIdentifierToUse)}/studies/`);



            // ✅ 응답 데이터 구조 검증 강화

            if (response.data && response.data.studies) {

                const studiesData = response.data.studies;

                const status = response.data.status;



                console.log("[PatientDicomManager] API 응답:", {

                    studiesCount: studiesData.length,

                    status: status,

                    totalStudies: response.data.total_studies

                });



                if (studiesData.length === 0) {

                    const errorMsg = response.data.message || '조회된 영상이 없습니다.';

                    setUploadError(errorMsg);

                } else {

                    // ✅ viewer_url 확인

                    const studiesWithViewer = studiesData.filter(study => study.viewer_url);



                    if (studiesWithViewer.length > 0) {

                        setStudies(studiesData);

                        setModalMode(mode); // 전달받은 모드로 상태 설정

                        setIsModalOpen(true);

                    } else {

                        setUploadError('영상 데이터가 있지만 뷰어 URL을 생성할 수 없습니다.');

                    }

                }

            } else {

                setUploadError('서버에서 유효한 응답을 받지 못했습니다.');

            }

        } catch (error) {

            console.error('Failed to fetch patient studies:', error);



            let errorMessage = '알 수 없는 오류가 발생했습니다.';



            if (error.response) {

                const status = error.response.status;

                if (status === 404) {

                    errorMessage = '환자 정보를 찾을 수 없습니다.';

                } else if (status === 503) {

                    errorMessage = 'PACS 서버에 연결할 수 없습니다.';

                } else {

                    errorMessage = error.response.data?.detail || `서버 오류 (${status})`;

                }

            } else if (error.request) {

                errorMessage = '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';

            }



            setUploadError(`영상 조회 실패: ${errorMessage}`);

        }

    };



    return (

        <div style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px', backgroundColor: 'white' }}>

            <h4>PACS 이미지 관리</h4>



            <div>

                <p><strong>환자 식별 정보:</strong></p>

                <ul>

                    <li>환자명: {patient?.display_name || 'N/A'}</li>

                    <li>Identifier: {patient?.identifier || 'N/A'}</li>

                    <li>UUID: {patient?.uuid || 'N/A'}</li>

                    <li>PACS ID: {patient?.pacs_id || 'N/A'}</li>

                </ul>

            </div>



            <div>

                <input

                    type="file"

                    onChange={handleFileChange}

                    accept=".dcm,.dicom"

                    disabled={uploadLoading}

                />

                <button

                    onClick={handleUpload}

                    disabled={!selectedFile || uploadLoading}

                    style={{

                        marginLeft: '10px',

                        padding: '8px 16px',

                        backgroundColor: uploadLoading ? '#6c757d' : '#28a745',

                        color: 'white',

                        border: 'none',

                        borderRadius: '4px',

                        cursor: uploadLoading ? 'not-allowed' : 'pointer'

                    }}

                >

                    {uploadLoading ? '업로드 중...' : '업로드'}

                </button>

                {uploadError && <p style={{ color: 'red', marginTop: '10px' }}>{uploadError}</p>}

            </div>



            <hr style={{ margin: '20px 0' }} />



            <div>

                <button

                    onClick={() => handleViewImages('viewer')}

                    disabled={!patientIdentifierToUse}

                    style={{

                        padding: '10px 16px',

                        backgroundColor: patientIdentifierToUse ? '#007bff' : '#6c757d',

                        color: 'white',

                        border: 'none',

                        borderRadius: '4px',

                        cursor: patientIdentifierToUse ? 'pointer' : 'not-allowed'

                    }}

                >

                    영상의학 이미지 보기 (기본 뷰어)

                </button>

                {/* ★★★ 어노테이션 버튼 추가 ★★★ */}

                <button

                    onClick={() => handleViewImages('annotation')}

                    disabled={!patientIdentifierToUse}

                    style={{

                        padding: '10px 16px',

                        backgroundColor: patientIdentifierToUse ? '#17a2b8' : '#6c757d',

                        color: 'white',

                        border: 'none',

                        borderRadius: '4px',

                        cursor: patientIdentifierToUse ? 'pointer' : 'not-allowed',

                        marginLeft: '10px' // 버튼 간격 추가

                    }}

                >

                    병변 부위 찾기 (어노테이션)

                </button>

            </div>



            {isModalOpen && (

                <StudiesModal

                    studies={studies}

                    onClose={() => setIsModalOpen(false)}

                    patient={patient}

                    mode={modalMode} // 설정된 모드를 모달에 전달

                />

            )}

        </div>

    );

};



export default LabResultsView;

