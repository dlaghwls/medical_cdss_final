// VitalSignsPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { fetchVitalsHistory, saveVitals } from '../../services/vitalApiService';

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation'; // annotation 플러그인은 혹시 모를 미래 확장성을 위해 남겨둡니다.

import styles from './Vital.module.css'; // CSS 모듈 import

// Chart.js 모듈 및 플러그인 등록
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, annotationPlugin);

// UI 표시를 위한 활력 징후 정의 및 정상/경고/위험 범위
// BP는 SBP와 DBP로 나누어 정의합니다.
const VITAL_DEFINITIONS = {
    temp: { name: '체온', unit: '°C', color: '#f4a261', normalRange: [36.1, 37.2], warningRange: [[35.0, 36.0], [37.3, 38.0]], dangerRange: [[0, 34.9], [38.1, 42]] },
    hr: { name: '심박수', unit: 'bpm', color: '#fcbf49', normalRange: [60, 100], warningRange: [[40, 59], [101, 120]], dangerRange: [[0, 39], [121, 200]] },
    rr: { name: '호흡수', unit: '회/분', color: '#1CCAD8', normalRange: [12, 20], warningRange: [[8, 11], [21, 24]], dangerRange: [[0, 7], [25, 60]] },
    bp_systolic: { name: '수축기 혈압', unit: 'mmHg', color: '#6c757d', normalRange: [90, 120], warningRange: [[80, 89], [121, 140]], dangerRange: [[0, 79], [141, 200]] },
    bp_diastolic: { name: '이완기 혈압', unit: 'mmHg', color: '#adb5bd', normalRange: [60, 80], warningRange: [[50, 59], [81, 90]], dangerRange: [[0, 49], [91, 120]] },
    spo2: { name: '산소포화도', unit: '%', color: '#2a9d8f', normalRange: [95, 100], warningRange: [[90, 94]], dangerRange: [[0, 89]] },
};

// 차트 생성을 위한 키 목록
const CHARTABLE_VITALS = ['bp_systolic', 'bp_diastolic', 'hr', 'rr', 'temp', 'spo2'];

// 초기 폼 상태 (동일)
const initialFormData = {
    bp_systolic: '',
    bp_diastolic: '',
    hr: '',
    rr: '',
    temp: '',
    spo2: '',
    notes: ''
};

const VitalSignsPage = ({ selectedPatient, onBackToPatientList }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [recordedAt, setRecordedAt] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const [vitalSessions, setVitalSessions] = useState([]);

    // 범례 호버 상태를 관리하는 state
    const [hoveredDatasetIndex, setHoveredDatasetIndex] = useState(null);

    useEffect(() => {
        const now = new Date();
        const formattedDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setRecordedAt(formattedDateTime);

        if (selectedPatient && selectedPatient.uuid) {
            loadVitalSessions(selectedPatient.uuid);
        } else {
            setVitalSessions([]);
        }
    }, [selectedPatient]);

    const loadVitalSessions = async (patientUuid) => {
        setLoading(true);
        setError(null);
        try {
            const sessions = await fetchVitalsHistory(patientUuid);
            // 최신 데이터가 차트의 오른쪽에 오도록 정렬
            const sortedSessions = sessions.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
            setVitalSessions(sortedSessions);
        } catch (err) {
            console.error("Error loading vital sessions:", err);
            setError("활력 징후 기록 로드 실패: " + (err.message || '알 수 없는 오류'));
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage('');

        if (!selectedPatient || !selectedPatient.uuid) {
            setError("환자가 선택되지 않았습니다.");
            return;
        }

        const hasMeasurement = Object.values(formData).some(val => val !== '');
        if (!hasMeasurement || !recordedAt) {
            setError("측정 시간과 하나 이상의 측정값은 필수입니다.");
            return;
        }

        setLoading(true);

        try {
            const sessionData = {
                patient: selectedPatient.uuid,
                recorded_at: new Date(recordedAt).toISOString(),
                notes: formData.notes,
                measurements: {
                    bp: `${formData.bp_systolic || ''}/${formData.bp_diastolic || ''}`,
                    hr: formData.hr ? parseInt(formData.hr) : null,
                    rr: formData.rr ? parseInt(formData.rr) : null,
                    temp: formData.temp ? parseFloat(formData.temp) : null,
                    spo2: formData.spo2 ? parseInt(formData.spo2) : null,
                }
            };

            console.log("서버로 전송할 데이터 (sessionData):", JSON.stringify(sessionData, null, 2));

            await saveVitals(sessionData);

            setSuccessMessage('활력 징후 세션이 성공적으로 등록되었습니다.');
            setFormData(initialFormData);
            loadVitalSessions(selectedPatient.uuid);

        } catch (err) {
            console.error("Error registering vital session:", err);
            let errorMessage = "활력 징후 등록 실패: ";
            if (err.response && err.response.data) {
                errorMessage += JSON.stringify(err.response.data);
            } else {
                errorMessage += err.message || '알 수 없는 오류';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // 통합 차트 데이터 및 옵션 생성 (범례 호버 및 배경색 제거 적용)
    const generateCombinedChartConfig = useMemo(() => {
        if (vitalSessions.length === 0) return { data: { labels: [], datasets: [] }, options: {} };

        const labels = vitalSessions.map(session => {
            const date = new Date(session.recorded_at);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        });

        const datasets = [];

        CHARTABLE_VITALS.forEach((key, index) => {
            const def = VITAL_DEFINITIONS[key];
            if (!def) return;

            let dataValues;
            if (key === 'bp_systolic') {
                dataValues = vitalSessions.map(session => session.measurements?.bp ? parseInt(session.measurements.bp.split('/')[0]) : null);
            } else if (key === 'bp_diastolic') {
                dataValues = vitalSessions.map(session => session.measurements?.bp ? parseInt(session.measurements.bp.split('/')[1]) : null);
            } else {
                dataValues = vitalSessions.map(session => session.measurements?.[key]);
            }

            // 호버 상태에 따라 투명도 조절
            const alpha = (hoveredDatasetIndex === null || hoveredDatasetIndex === index) ? 1 : 0.2;
            const lineColor = def.color;
            // 배경색은 정의된 색상에 0.2 투명도 적용
            const fillColor = def.color + '33'; // 16진수 투명도 33은 약 20%를 의미합니다.

            datasets.push({
                label: def.name,
                data: dataValues,
                borderColor: `rgba(${parseInt(lineColor.slice(1,3), 16)}, ${parseInt(lineColor.slice(3,5), 16)}, ${parseInt(lineColor.slice(5,7), 16)}, ${alpha})`,
                backgroundColor: fillColor, // 배경색은 호버와 관계없이 고정된 투명도로 설정
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: dataValues.map(val => {
                    if (val === null) return `rgba(128, 128, 128, ${alpha})`; // 데이터 없을 경우 회색
                    const checkRange = (ranges, color) => {
                        if (ranges) {
                            for (const range of ranges) {
                                if (val >= range[0] && val <= range[1]) {
                                    return color;
                                }
                            }
                        }
                        return null;
                    };
                    // 비정상 값은 빨간색으로 강조, 호버 시에도 빨간색 유지
                    return checkRange(def.dangerRange, 'red') || checkRange(def.warningRange, 'red') || `rgba(${parseInt(lineColor.slice(1,3), 16)}, ${parseInt(lineColor.slice(3,5), 16)}, ${parseInt(lineColor.slice(5,7), 16)}, ${alpha})`;
                }),
                pointBorderColor: dataValues.map(val => {
                     if (val === null) return `rgba(128, 128, 128, ${alpha})`;
                     const checkRange = (ranges, color) => {
                         if (ranges) {
                             for (const range of ranges) {
                                 if (val >= range[0] && val <= range[1]) {
                                     return color;
                                 }
                             }
                         }
                         return null;
                     };
                     return checkRange(def.dangerRange, 'red') || checkRange(def.warningRange, 'red') || `rgba(${parseInt(lineColor.slice(1,3), 16)}, ${parseInt(lineColor.slice(3,5), 16)}, ${parseInt(lineColor.slice(5,7), 16)}, ${alpha})`;
                 }),
                pointBorderWidth: 2,
                pointHoverRadius: 6,
                yAxisID: 'y',
            });
        });

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { size: 14, weight: 'bold' },
                        usePointStyle: true,
                        // ✨ legend.labels.generateLabels 커스터마이징 ✨
                        generateLabels: function(chart) {
                            const data = chart.data;
                            return data.datasets.map(function(dataset, i) {
                                // VITAL_DEFINITIONS에서 정의된 고정 색상을 사용
                                const vitalKey = CHARTABLE_VITALS[i];
                                const def = VITAL_DEFINITIONS[vitalKey];
                                const legendColor = def ? def.color : dataset.borderColor; // 정의된 색상이 없으면 데이터셋의 borderColor 사용

                                return {
                                    text: dataset.label,
                                    fillStyle: legendColor, // 범례 아이콘 색상
                                    strokeStyle: legendColor, // 범례 아이콘 테두리 색상 (선이므로 보통 fillStyle과 동일)
                                    lineWidth: 1, // 범례 아이콘 테두리 두께
                                    pointStyle: 'circle', // 범례 아이콘 스타일
                                    hidden: !chart.isDatasetVisible(i), // 데이터셋이 숨겨져 있으면 범례도 숨김
                                    lineCap: dataset.borderCapStyle,
                                    lineDash: dataset.borderDash,
                                    lineDashOffset: dataset.borderDashOffset,
                                    lineJoin: dataset.borderJoinStyle,
                                    datasetIndex: i
                                };
                            });
                        }
                    },
                    // 범례 호버 이벤트 핸들러
                    onHover: function(event, legendItem, legend) {
                        setHoveredDatasetIndex(legendItem.datasetIndex);
                    },
                    onLeave: function(event, legendItem, legend) {
                        setHoveredDatasetIndex(null);
                    }
                },
                title: {
                    display: true,
                    text: '활력 징후 추이',
                    font: { size: 20, weight: 'bold' },
                    color: '#333'
                },
                tooltip: { mode: 'index', intersect: false },
                // annotation: { annotations: annotations }, // ⭐️ Annotation 제거
            },
            scales: {
                x: {
                    title: { display: true, text: '측정 시간', font: { size: 14, weight: 'bold' } },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: { autoSkip: true, maxTicksLimit: 10 }
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    title: { display: false }, // 사진처럼 Y축 제목은 제외
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    // 모든 데이터셋의 최소/최대값을 고려하여 Y축 범위 자동 조절
                    min: Math.min(0, ...datasets.flatMap(dataset => dataset.data.filter(v => v !== null))),
                    max: Math.max(110, ...datasets.flatMap(dataset => dataset.data.filter(v => v !== null))),
                },
            },
            animation: {
                duration: 0 // 애니메이션 비활성화 (부드러운 호버 전환 위해)
            }
        };

        return {
            data: { labels, datasets },
            options,
        };
    }, [vitalSessions, hoveredDatasetIndex]); // hoveredDatasetIndex가 변경될 때마다 차트 재계산

    if (!selectedPatient) {
        return <div className={styles.container}><h3>환자를 선택해주세요.</h3></div>;
    }

    return (
        <div className={styles.container}>
            <h3>활력 징후 관리 - {selectedPatient.display}</h3>

            <div className={styles.formSection}>
                <h4>새 활력 징후 세션 입력</h4>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGrid}>
                        <div>
                            <label>측정 시간:*</label>
                            <input type="datetime-local" value={recordedAt} onChange={e => setRecordedAt(e.target.value)} required className={styles.formInput} />
                        </div>
                        <div>
                            <label>혈압 (Systolic/Diastolic):</label>
                            <div className={styles.bpInputs}>
                                <input type="number" name="bp_systolic" placeholder="SBP" value={formData.bp_systolic} onChange={handleFormChange} className={styles.bpInput} />
                                <span className={styles.bpSeparator}>/</span>
                                <input type="number" name="bp_diastolic" placeholder="DBP" value={formData.bp_diastolic} onChange={handleFormChange} className={styles.bpInput} />
                            </div>
                        </div>
                        {Object.keys(VITAL_DEFINITIONS).filter(key => key !== 'bp_systolic' && key !== 'bp_diastolic').map(key => (
                             <div key={key}>
                                <label>{VITAL_DEFINITIONS?.[key]?.name}:</label>
                                <input type="number" step="0.1" name={key} placeholder={`단위: ${VITAL_DEFINITIONS?.[key]?.unit}`} value={formData?.[key]} onChange={handleFormChange} className={styles.formInput} />
                            </div>
                        ))}
                         <div>
                            <label>비고 (Notes):</label>
                            <textarea name="notes" value={formData.notes} onChange={handleFormChange} className={`${styles.formInput} ${styles.notesInput}`} />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className={styles.submitButton}>
                        {loading ? '저장 중...' : '세션 저장'}
                    </button>
                </form>
                {error && <p className={styles.errorMessage}>{error}</p>}
                {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
            </div>

            <div className={styles.chartSection}>
                <h4>활력 징후 추이</h4>
                {loading && <p>기록 로딩 중...</p>}
                {vitalSessions.length > 0 ? (
                    <div className={styles.chartContainer}>
                        <Line {...generateCombinedChartConfig} />
                    </div>
                ) : (
                    !loading && <p>표시할 활력 징후 기록이 없습니다.</p>
                )}
            </div>
        </div>
    );
};

export default VitalSignsPage;