import React, { useState, useEffect } from 'react';
import { fetchVitalsHistory, saveVitals } from '../../services/vitalApiService';

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Chart.js 모듈 등록
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// UI 표시를 위한 활력 징후 정의
const VITAL_DEFINITIONS = {
    temp: { name: '체온', unit: '°C' },
    hr: { name: '심박수', unit: 'bpm' },
    rr: { name: '호흡수', unit: '회/분' },
    bp: { name: '혈압', unit: 'mmHg' },
    spo2: { name: '산소포화도', unit: '%' },
};

// 차트 생성을 위한 키 목록
const CHARTABLE_VITALS = ['temp', 'hr', 'rr', 'spo2'];

// 초기 폼 상태
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
            const sortedSessions = sessions.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
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

    const generateChartData = (vitalKey) => {
        const labels = vitalSessions.map(session => new Date(session.recorded_at).toLocaleString()).reverse();
        const dataValues = vitalSessions.map(session => session.measurements ? session.measurements[vitalKey] : null).filter(v => v != null).reverse();

        return {
            labels,
            datasets: [
                {
                    label: `${VITAL_DEFINITIONS[vitalKey].name} (${VITAL_DEFINITIONS[vitalKey].unit})`,
                    data: dataValues,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                },
            ],
        };
    };

    const generateBloodPressureChartData = () => {
        const labels = vitalSessions.map(session => new Date(session.recorded_at).toLocaleString()).reverse();
        const sbpData = vitalSessions.map(session => {
            const bp = session.measurements?.bp;
            if (bp && bp.includes('/')) return parseInt(bp.split('/')[0]);
            return null;
        }).filter(v => v != null).reverse();

        const dbpData = vitalSessions.map(session => {
            const bp = session.measurements?.bp;
            if (bp && bp.includes('/')) return parseInt(bp.split('/')[1]);
            return null;
        }).filter(v => v != null).reverse();

        return {
            labels,
            datasets: [
                {
                    label: '수축기 혈압 (SBP)',
                    data: sbpData,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1,
                },
                {
                    label: '이완기 혈압 (DBP)',
                    data: dbpData,
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    tension: 0.1,
                },
            ],
        };
    };

    if (!selectedPatient) {
        return <div style={{ padding: '20px' }}><h3>환자를 선택해주세요.</h3></div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h3>활력 징후 관리 - {selectedPatient.display}</h3>

            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '30px', backgroundColor: 'white' }}>
                <h4>새 활력 징후 세션 입력</h4>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div>
                            <label>측정 시간:*</label>
                            <input type="datetime-local" value={recordedAt} onChange={e => setRecordedAt(e.target.value)} required style={{width: '95%', padding: '8px'}} />
                        </div>
                        <div>
                            <label>혈압 (Systolic/Diastolic):</label>
                            <div style={{display: 'flex', alignItems: 'center'}}>
                                <input type="number" name="bp_systolic" placeholder="SBP" value={formData.bp_systolic} onChange={handleFormChange} style={{width: '45%', padding: '8px'}} />
                                <span style={{margin: '0 5px'}}>/</span>
                                <input type="number" name="bp_diastolic" placeholder="DBP" value={formData.bp_diastolic} onChange={handleFormChange} style={{width: '45%', padding: '8px'}} />
                            </div>
                        </div>
                        {CHARTABLE_VITALS.map(key => (
                             <div key={key}>
                                <label>{VITAL_DEFINITIONS[key].name}:</label>
                                <input type="number" step="0.1" name={key} placeholder={`단위: ${VITAL_DEFINITIONS[key].unit}`} value={formData[key]} onChange={handleFormChange} style={{width: '95%', padding: '8px'}} />
                            </div>
                        ))}
                         <div>
                            <label>비고 (Notes):</label>
                            <textarea name="notes" value={formData.notes} onChange={handleFormChange} style={{width: '95%', padding: '8px', height: '40px'}} />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
                        {loading ? '저장 중...' : '세션 저장'}
                    </button>
                </form>
                {error && <p style={{ color: 'red', marginTop: '10px', whiteSpace: 'pre-wrap', border: '1px solid red', padding: '8px' }}>{error}</p>}
                {successMessage && <p style={{ color: 'green', marginTop: '10px' }}>{successMessage}</p>}
            </div>

            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: 'white' }}>
                <h4>활력 징후 추이</h4>
                {loading && <p>기록 로딩 중...</p>}
                {vitalSessions.length > 0 ? (
                    <>
                        <div style={{ marginBottom: '20px' }}>
                            <h5>혈압 추이 (SBP/DBP)</h5>
                            <Line data={generateBloodPressureChartData()} />
                        </div>
                        {CHARTABLE_VITALS.map(key => (
                            <div key={key} style={{ marginBottom: '20px' }}>
                                <h5>{VITAL_DEFINITIONS[key].name} 추이</h5>
                                <Line data={generateChartData(key)} />
                            </div>
                        ))}
                    </>
                ) : (
                    !loading && <p>표시할 활력 징후 기록이 없습니다.</p>
                )}
            </div>
        </div>
    );
};

export default VitalSignsPage;