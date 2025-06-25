import React, { useState } from 'react';
import aiService from '../../services/aiService'; // aiService 임포트
import GeneResultDisplay from '../../components/AI_result/Gene_result'; // 분리된 결과 컴포넌트 임포트

const GeneImport = ({ selectedPatient, onPredictionComplete }) => {
    const [selectedFile, setSelectedFile] = useState(null); // 사용자가 선택한 파일
    const [geneDataInput, setGeneDataInput] = useState(''); // 사용자가 직접 붙여넣을 CSV 텍스트
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    // 파일 선택 핸들러
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === "text/csv") {
            setSelectedFile(file);
            setGeneDataInput(''); // 파일 선택 시 텍스트 입력 초기화
            setError(null);
        } else {
            setSelectedFile(null);
            setError("CSV 파일만 업로드할 수 있습니다.");
        }
    };

    // CSV 텍스트 입력 핸들러
    const handleGeneDataInputChange = (event) => {
        setGeneDataInput(event.target.value);
        setSelectedFile(null); // 텍스트 입력 시 파일 선택 초기화
        setError(null);
    };

    // CSV 데이터를 포함한 Blob (File) 객체를 생성하는 헬퍼 함수
    const createCsvFileBlob = (data, fileName = 'gene_data.csv') => {
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
        // File 객체를 생성하여 실제 파일처럼 다룰 수 있게 함
        return new File([blob], fileName, { type: 'text/csv' });
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

        let fileToUpload = selectedFile;

        // 만약 파일이 선택되지 않고 텍스트 입력이 있다면, 텍스트로 CSV 파일을 생성
        if (!fileToUpload && geneDataInput.trim()) {
            // FastAPI가 요구하는 'patient_id' 컬럼을 CSV 데이터에 추가
            // (이전 입력 필드에서 받은 geneDataInput은 'identifier' 컬럼을 기대했었음)
            // 이제 patient_id 컬럼을 기준으로 CSV를 재구성해야 합니다.
            
            // 예시: 기존 CSV가 헤더만 있는 경우를 대비하여 헤더가 없으면 추가
            let csvContent = geneDataInput.trim();
            if (!csvContent.includes('patient_id')) { // patient_id 헤더가 없다면 추가
                // 간단한 예시: 기존 데이터가 콤마로 구분된 값들만 있다고 가정하고
                // patient_id를 첫 컬럼으로 추가
                const lines = csvContent.split('\n');
                if (lines.length > 0) {
                    csvContent = `patient_id,${lines[0]}\n` + `${selectedPatient.uuid},${lines.slice(1).join('\n')}`;
                } else {
                    csvContent = `patient_id\n${selectedPatient.uuid}`;
                }
            } else {
                // patient_id 컬럼이 이미 있다면, 기존 값 대신 selectedPatient.uuid로 대체
                // 이 부분은 실제 CSV 데이터 형식에 따라 더 복잡한 파싱 로직이 필요할 수 있습니다.
                // 여기서는 매우 단순하게 첫 번째 데이터 행에 patient_id를 삽입한다고 가정합니다.
                const lines = csvContent.split('\n');
                if (lines.length > 1) { // 헤더와 데이터가 모두 있는 경우
                    const header = lines[0];
                    const dataLine = lines[1];
                    const patientIdIndex = header.split(',').indexOf('patient_id');

                    if (patientIdIndex !== -1) {
                        const dataParts = dataLine.split(',');
                        dataParts[patientIdIndex] = selectedPatient.uuid; // 기존 patient_id를 대체
                        lines[1] = dataParts.join(',');
                        csvContent = lines.join('\n');
                    } else {
                        // patient_id 컬럼은 있지만 값이 없는 경우 (복잡한 케이스)
                        // 이 경우 사용자에게 특정 형식의 CSV를 요구하거나, 더 정교한 파싱 로직이 필요합니다.
                        setError("CSV에 'patient_id' 컬럼이 있지만, 데이터 삽입 로직이 복잡합니다. 유효한 CSV 파일을 직접 업로드해주세요.");
                        setLoading(false);
                        return;
                    }
                } else { // 헤더만 있거나 비어있는 경우
                     csvContent = `patient_id\n${selectedPatient.uuid}`;
                }
            }
            
            console.log("Generated CSV content for upload:\n", csvContent);
            fileToUpload = createCsvFileBlob(csvContent, `gene_data_${selectedPatient.uuid}.csv`);
        }

        if (!fileToUpload) {
            setError("업로드할 파일 또는 CSV 텍스트를 입력해주세요.");
            setLoading(false);
            return;
        }

        try {
            // aiService의 uploadGeneCSV 함수 호출 (file 객체만 전달)
            const response = await aiService.uploadGeneCSV(fileToUpload);
            setResult(response); // FastAPI에서 반환하는 추론 결과 저장

        } catch (err) {
            console.error('Failed to upload/analyze gene data:', err);
            setError(`유전자 데이터 처리 실패: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '20px' }}>
            <h3>유전자 분석 데이터 업로드</h3>
            {selectedPatient && <p><strong>선택된 환자:</strong> {selectedPatient.display} ({selectedPatient.uuid.substring(0,8)}...)</p>}
            
            <form onSubmit={handleSubmit}>
                <div>
                    <label>유전자 CSV 파일 업로드:</label>
                    <input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleFileChange} 
                        style={{ marginLeft: '10px' }}
                    />
                </div>
                <p style={{ margin: '15px 0 10px', textAlign: 'center' }}>- 또는 -</p>
                <div>
                    <label>CSV 텍스트 직접 입력:</label>
                    <textarea 
                        value={geneDataInput} 
                        onChange={handleGeneDataInputChange} 
                        rows="10" 
                        cols="50" 
                        placeholder="여기에 유전자 CSV 데이터를 붙여넣으세요. 'patient_id' 컬럼이 반드시 포함되어야 합니다."
                        style={{ width: '95%', padding: '5px', marginTop: '5px' }}
                    />
                </div>
                
                <button type="submit" disabled={loading} style={{ marginTop: '15px', padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                    {loading ? '분석 중...' : '유전자 데이터 분석'}
                </button>
            </form>

            {error && <p style={{ color: 'red', marginTop: '10px' }}>오류: {error}</p>}
            
            {result && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                    <h4>분석 결과:</h4>
                    {/* 분리된 결과 컴포넌트를 사용 */}
                    <GeneResultDisplay result={result} selectedPatient={selectedPatient} />
                </div>
            )}
        </div>
    );
};

export default GeneImport;