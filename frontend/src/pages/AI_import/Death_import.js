// frontend/src/pages/AI_import/Death_import.js
import React, { useState } from 'react';
import aiService from '../../services/aiService'; // aiService import

const Death_import = ({ selectedPatient, onDataRegistered }) => {
    // LabResultsView에서 사망률 예측 관련 상태들을 모두 가져옵니다.
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
    const [notes, setNotes] = useState('');
    const [recordedAt, setRecordedAt] = useState(new Date().toISOString().slice(0, 16));

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage('');
        setLoading(true);

        const submissionData = {
            patient_uuid: selectedPatient.uuid,
            age: parseInt(age) || 0,
            gender: gender,
            heart_rate: parseFloat(heartRate) || 0,
            systolic_bp: parseFloat(systolicBp) || 0,
            diastolic_bp: parseFloat(diastolicBp) || 0,
            temperature: parseFloat(temperature) || 0,
            respiratory_rate: parseFloat(respiratoryRate) || 0,
            oxygen_saturation: parseFloat(oxygenSaturation) || 0,
            wbc: parseFloat(wbc) || 0,
            hemoglobin: parseFloat(hemoglobin) || 0,
            creatinine: parseFloat(creatinine) || 0,
            bun: parseFloat(bun) || 0,
            glucose: parseFloat(glucose) || 0,
            sodium: parseFloat(sodium) || 0,
            potassium: parseFloat(potassium) || 0,
            notes: notes,
            recorded_at: recordedAt
        };

        try {
            // aiService의 새 함수를 호출합니다.
            await aiService.registerMortalityData(submissionData);
            setSuccessMessage('데이터가 성공적으로 등록되었습니다.');

            if (onDataRegistered) {
            onDataRegistered(submissionData, responseData);
            }

            // 폼 초기화
            setGender(''); setAge(''); setHeartRate(''); setSystolicBp('');
            setDiastolicBp(''); setTemperature(''); setRespiratoryRate('');
            setOxygenSaturation(''); setWbc(''); setHemoglobin('');
            setCreatinine(''); setBun(''); setGlucose(''); setSodium('');
            setPotassium(''); setNotes('');
            setRecordedAt(new Date().toISOString().slice(0, 16));
            
            // 부모 컴포넌트에 데이터가 등록되었음을 알립니다.
            if (onDataRegistered) {
                onDataRegistered();
            }

        } catch (err) {
            const errorMsg = err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message || '알 수 없는 오류';
            setError("데이터 등록 실패: " + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: 'white' }}>
            <h4>새 사망률 예측 데이터 입력</h4>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                {/* LabResultsView에서 복사한 폼 JSX */}
                <div>
                    <label>성별:</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                        <option value="">선택</option>
                        <option value="M">남성</option>
                        <option value="F">여성</option>
                    </select>
                </div>
                <div>
                    <label>나이:</label>
                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>

                <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #ccc', paddingTop: '15px' }}>
                    <h4>활력 징후</h4>
                </div>
                <div>
                    <label>심박수 (60-100):</label>
                    <input type="number" step="0.1" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
                <div>
                    <label>수축기 혈압 (90-140):</label>
                    <input type="number" step="0.1" value={systolicBp} onChange={(e) => setSystolicBp(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
                <div>
                    <label>이완기 혈압 (60-90):</label>
                    <input type="number" step="0.1" value={diastolicBp} onChange={(e) => setDiastolicBp(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
                <div>
                    <label>체온 (36-37.5°C):</label>
                    <input type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
                <div>
                    <label>호흡수 (12-20):</label>
                    <input type="number" step="0.1" value={respiratoryRate} onChange={(e) => setRespiratoryRate(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
                <div>
                    <label>산소포화도 (95-100%):</label>
                    <input type="number" step="0.1" value={oxygenSaturation} onChange={(e) => setOxygenSaturation(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>

                <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #ccc', paddingTop: '15px' }}>
                    <h4>주요 혈액 검사</h4>
                </div>
                <div>
                    <label>백혈구 (4-11 × 10³/μL):</label>
                    <input type="number" step="0.1" value={wbc} onChange={(e) => setWbc(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
                <div>
                    <label>헤모글로빈 (12-16 g/dL):</label>
                    <input type="number" step="0.1" value={hemoglobin} onChange={(e) => setHemoglobin(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
                <div>
                    <label>크레아티닌 (0.7-1.3 mg/dL):</label>
                    <input type="number" step="0.01" value={creatinine} onChange={(e) => setCreatinine(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
                <div>
                    <label>혈중요소질소 (7-20 mg/dL):</label>
                    <input type="number" step="0.1" value={bun} onChange={(e) => setBun(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
                <div>
                    <label>혈당 (70-100 mg/dL):</label>
                    <input type="number" step="0.1" value={glucose} onChange={(e) => setGlucose(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
                <div>
                    <label>나트륨 (136-145 mEq/L):</label>
                    <input type="number" step="0.1" value={sodium} onChange={(e) => setSodium(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
                <div>
                    <label>칼륨 (3.5-5.0 mEq/L):</label>
                    <input type="number" step="0.1" value={potassium} onChange={(e) => setPotassium(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
                 <div>
                    <label>기록 날짜/시간:*</label>
                    <input
                        type="datetime-local"
                        value={recordedAt}
                        onChange={(e) => setRecordedAt(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <label>비고:</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}></textarea>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <button type="submit" disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
                        {loading ? '등록 중...' : '데이터 등록'}
                    </button>
                    {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                    {successMessage && <p style={{ color: 'green', marginTop: '10px' }}>{successMessage}</p>}
                </div>
            </form>
        </div>
    );
};

export default Death_import;