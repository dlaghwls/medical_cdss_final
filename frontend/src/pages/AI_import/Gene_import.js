// /home/shared/medical_cdss/frontend/src/pages/AI_import/Gene_import.js
import React, { useState } from 'react';
import aiService from '../../services/aiService'; // aiService 임포트
import GeneResultDisplay from '../../components/AI_result/Gene_result'; // 분리된 결과 컴포넌트 임포트

const GeneImport = ({ selectedPatient, onPredictionComplete }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    // 파일 선택 핸들러
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === "text/csv") {
            setSelectedFile(file);
            setError(null);
        } else {
            setSelectedFile(null);
            setError("CSV 파일만 업로드할 수 있습니다.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        if (!selectedPatient || !selectedPatient.uuid) {
            setError("유전자 분석을 위해 환자를 선택해주세요.");
            setLoading(false);
            return;
        }

        if (!selectedFile) {
            setError("업로드할 CSV 파일을 선택해주세요.");
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            // ⭐⭐⭐ 변경: patient_uuid를 FormData에 추가 ⭐⭐⭐
            formData.append('patient_uuid', selectedPatient.uuid); 

            const response = await aiService.uploadGeneCSV(formData); // FormData 객체 전달
            setResult(response); 
            // onPredictionComplete(response); // 필요하다면 예측 완료 후 상위 컴포넌트로 결과 전달
        } catch (err) {
            console.error('Failed to upload/analyze gene data:', err);
            // 백엔드에서 전달되는 detail 메시지를 사용자에게 보여줍니다.
            const errorMessage = err.response?.data?.detail || err.message || '알 수 없는 오류';
            setError(`유전자 데이터 처리 실패: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '20px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.2em' }}>새 유전자 분석 데이터 입력</h3>
            {selectedPatient && <p style={{ marginBottom: '20px' }}><strong>선택된 환자:</strong> {selectedPatient.display} ({selectedPatient.uuid.substring(0,8)}...)</p>}
            
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <label style={{ marginRight: '10px', fontWeight: 'bold' }}>유전자 CSV 파일:</label>
                    <input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleFileChange} 
                        style={{ flexGrow: 1 }}
                    />
                </div>
                
                <div style={{ textAlign: 'right' }}>
                    <button 
                        type="submit" 
                        disabled={loading || !selectedFile || !selectedPatient} 
                        style={{ 
                            padding: '10px 20px', 
                            backgroundColor: '#007bff', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '5px', 
                            cursor: 'pointer',
                            fontSize: '1em'
                        }}
                    >
                        {loading ? '분석 중...' : '유전자 데이터 분석 및 기록'}
                    </button>
                </div>
            </form>

            {error && <p style={{ color: 'red', marginTop: '20px', textAlign: 'center' }}>오류: {error}</p>}
            
            {result && (
                <div style={{ 
                    marginTop: '30px', 
                    borderTop: '1px solid #eee', 
                    paddingTop: '20px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h4 style={{ marginBottom: '15px', fontSize: '1.1em' }}>분석 결과:</h4>
                    <GeneResultDisplay result={result} selectedPatient={selectedPatient} />
                </div>
            )}
        </div>
    );
};

export default GeneImport;