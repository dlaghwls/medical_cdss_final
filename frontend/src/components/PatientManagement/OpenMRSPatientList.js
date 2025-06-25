import React, { useState, useEffect } from 'react';
import { fetchLocalPatients, fetchAndSyncPatients, fetchPatientDetails } from '../../services/djangoApiService';

const OpenMRSPatientList = ({ refreshTrigger, onPatientSelect }) => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [totalPatients, setTotalPatients] = useState(0);

    const loadLocalPatientList = async (currentSearchTerm = '') => {
        setError(null); setLoading(true);
        console.log(`[OpenMRSPatientList] loadLocalPatientList called with searchTerm: "${currentSearchTerm}"`);
        try {
            const responseData = await fetchLocalPatients(currentSearchTerm);
            console.log("[OpenMRSPatientList] Data from Django (fetchLocalPatients):", responseData);
            if (responseData && Array.isArray(responseData.results)) {
                setPatients(responseData.results);
                setTotalPatients(responseData.totalCount || responseData.results.length);
            } else {
                console.warn("[OpenMRSPatientList] fetchLocalPatients returned unexpected data or no results:", responseData);
                setPatients([]); setTotalPatients(0);
            }
        } catch (err) {
            console.error("[OpenMRSPatientList] Error caught in loadLocalPatientList (via Django):", err);
            let detailedErrorMessage = `환자 목록 로드 실패: ${err.message || '알 수 없는 오류'}`;
            if (err.response) {
                detailedErrorMessage = `환자 목록 로드 실패 (Django 응답): ${err.response.status} - ${err.response.statusText}.`;
                if (err.response.data && err.response.data.error) {
                    detailedErrorMessage += ` 상세: ${err.response.data.detail || err.response.data.error}`;
                } else if (typeof err.response.data === 'string' && err.response.data.toLowerCase().includes('<html')) {
                    detailedErrorMessage += " (Django 서버에서 HTML 오류 페이지를 반환했습니다. Django 로그를 확인하세요.)";
                } else if (err.response.data) {
                    detailedErrorMessage += ` 서버 응답: ${JSON.stringify(err.response.data)}`;
                }
            } else if (err.request) { detailedErrorMessage = '환자 목록 로드 실패: Django 서버에서 응답이 없습니다.';}
            setError(detailedErrorMessage); setPatients([]); setTotalPatients(0);
        } finally { setLoading(false); }
    };

    const handleSyncAndRefreshList = async () => {
        setError(null); setLoading(true);
        console.log("[OpenMRSPatientList] handleSyncAndRefreshList called. SearchTerm for Django DB filter:", searchTerm);
        try {
            const responseData = await fetchAndSyncPatients(searchTerm);
            console.log("[OpenMRSPatientList] Data from Django (fetchAndSyncPatients):", responseData);
            if (responseData && Array.isArray(responseData.results)) {
                setPatients(responseData.results);
                setTotalPatients(responseData.totalCount || responseData.results.length);
            } else {
                console.warn("[OpenMRSPatientList] fetchAndSyncPatients returned unexpected data or no results:", responseData);
                setPatients([]); setTotalPatients(0);
            }
        } catch (err) {
            console.error("[OpenMRSPatientList] Error caught in handleSyncAndRefreshList (via Django):", err);
            let detailedErrorMessage = `환자 목록 로드/동기화 실패: ${err.message || '알 수 없는 오류'}`;
            if (err.response) {
                detailedErrorMessage = `환자 목록 로드/동기화 실패 (Django 응답): ${err.response.status} - ${err.response.statusText}.`;
                if (err.response.data && err.response.data.error) {
                    detailedErrorMessage += ` 상세: ${err.response.data.detail || err.response.data.error}`;
                } else if (typeof err.response.data === 'string' && err.response.data.toLowerCase().includes('<html')) {
                    detailedErrorMessage += " (Django 서버에서 HTML 오류 페이지를 반환했습니다. Django 로그를 확인하세요.)";
                } else if (err.response.data) {
                    detailedErrorMessage += ` 서버 응답: ${JSON.stringify(err.response.data)}`;
                }
            } else if (err.request) { detailedErrorMessage = '환자 목록 로드/동기화 실패: Django 서버에서 응답이 없습니다.';}
            setError(detailedErrorMessage); setPatients([]); setTotalPatients(0);
        } finally { setLoading(false); }
    };

    useEffect(() => {
        console.log("[OpenMRSPatientList] Component did mount or refreshTrigger changed. Calling loadLocalPatientList(). Trigger value:", refreshTrigger);
        loadLocalPatientList();
    }, [refreshTrigger]);

    const handleSearch = (e) => { if (e) e.preventDefault(); console.log("[OpenMRSPatientList] handleSearch called with searchTerm:", searchTerm); loadLocalPatientList(searchTerm); };
    console.log("[OpenMRSPatientList] Rendering component. Patients state:", patients);

    return (
        <div>
            <h4>환자 목록 (Django DB 조회)</h4>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center' }}>
                    <input type="text" placeholder="환자 이름, ID, UUID 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px', width: '300px', border: '1px solid #ccc', borderRadius: '4px', marginRight: '10px', fontSize: '1rem' }}/>
                    <button type="submit" disabled={loading} style={{ padding: '10px 20px', cursor: loading ? 'not-allowed' : 'pointer', backgroundColor: loading ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem' }}>
                        {loading && searchTerm ? '검색 중...' : '검색 (로컬 DB)'}
                    </button>
                </form>
                <button onClick={handleSyncAndRefreshList} disabled={loading} style={{ padding: '10px 20px', cursor: loading ? 'not-allowed' : 'pointer', backgroundColor: loading ? '#ccc' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', marginLeft: '10px'}}>
                    {loading ? '동기화 중...' : 'OpenMRS와 동기화 후 새로고침'}
                </button>
            </div>
            {loading && <p style={{fontStyle: 'italic'}}>환자 목록을 불러오는 중...</p>}
            {error && <p style={{ color: 'red', fontWeight: 'bold', marginTop: '15px', whiteSpace: 'pre-wrap', border: '1px solid red', padding: '10px', borderRadius: '4px', backgroundColor: '#ffebee' }}>{error}</p>}
            {!loading && patients.length === 0 && !error && (
                <p style={{marginTop: '15px'}}>표시할 환자가 없거나, 검색 결과가 없습니다. (먼저 "OpenMRS와 동기화 후 새로고침"을 시도하거나 환자를 등록해보세요)</p>
            )}
            {!loading && !error && patients.length > 0 && (
                <>
                    <p style={{marginTop: '10px', fontSize: '0.9em', color: '#555'}}>총 {totalPatients}명의 환자 중 {patients.length}명 표시 (Django DB 기준)</p>
                    <ul style={{ listStyleType: 'none', padding: 0, marginTop: '5px' }}>
                        {patients.map(patient => (
                            <li
                                key={patient.uuid}
                                // ★★★ onPatientSelect prop이 있을 경우에만 호출하도록 추가 ★★★
                                onClick={() => onPatientSelect && onPatientSelect(patient)} // <--- 이 부분 추가
                                style={{
                                    borderBottom: '1px solid #eee', padding: '12px 5px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    transition: 'background-color 0.2s ease-in-out',
                                    cursor: 'pointer' // 클릭 가능함을 시각적으로 보여주기 위해
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div>
                                    <strong style={{fontSize: '1.1rem'}}>{patient.display || (patient.person && patient.person.display) || `환자 (UUID: ${patient.uuid ? patient.uuid.substring(0,8) : 'N/A'})`}</strong>
                                    <span style={{fontSize: '0.85em', color: '#666', marginLeft: '15px'}}>(UUID: {patient.uuid || 'N/A'})</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
};

export default OpenMRSPatientList;