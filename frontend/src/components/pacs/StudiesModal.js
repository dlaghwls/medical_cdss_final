// 6월 24일 작업 전 코드 내용
// frontend/src/components/pacs/StudiesModal.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import axios from 'axios'; // <-- axios 직접 임포트 제거
import { apiClient } from '../../services/djangoApiService'; // ★★★ djangoApiService의 apiClient 임포트 활성화 ★★★

// API 인스턴스 생성 (이 부분은 제거합니다. 대신 apiClient를 사용)
// const api = axios.create({
//     baseURL: 'http://34.46.244.222:8000', // <-- 이 부분이 문제였습니다.
//     headers: {
//         'Content-Type': 'application/json',
//     },
// });

const StudiesModal = ({ studies, onClose, patient, mode }) => {
    const navigate = useNavigate();
    const [loadingSeriesImages, setLoadingSeriesImages] = useState(false);
    const [seriesImageError, setSeriesImageError] = useState(null);
    const [viewerError, setViewerError] = useState(false); 

    const modalStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    };

    const modalContentStyle = {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '90vw',
        height: '90%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    };

    const buttonStyle = {
        padding: '10px 20px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    };

    const infoBoxStyle = {
        marginBottom: '10px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        border: '1px solid #e9ecef'
    };

    const errorBoxStyle = {
        marginTop: '15px',
        padding: '20px',
        backgroundColor: '#f8d7da',
        borderRadius: '6px',
        border: '1px solid #f5c6cb',
        color: '#721c24'
    };

    const handleIframeError = () => {
        setViewerError(true);
    };

    const handleSeriesSelect = async (studyId, seriesId) => {
        setSeriesImageError(null);
        
        if (mode === 'viewer') {
            const public_orthanc_url = 'http://34.64.188.9:8042'; // ★★★ GCP Orthanc Public URL ★★★ 
            const viewerUrl = `${public_orthanc_url}/app/explorer.html#study?uuid=${studyId}`;
            window.open(viewerUrl, '_blank');
            onClose(); 
            return; 
        }

        if (mode === 'annotation') {
            setLoadingSeriesImages(true);
            try {
                // ★★★ apiClient 사용 (api 대신) ★★★
                console.log(`[StudiesModal] Requesting image IDs from ${apiClient.defaults.baseURL}pacs/viewer-images/${studyId}/${seriesId}/`);
                const response = await apiClient.get(`pacs/viewer-images/${studyId}/${seriesId}/`); // ★★★ apiClient 사용 ★★★
                const imageIds = response.data; 

                if (imageIds && imageIds.length > 0) {
                    console.log("[StudiesModal] Fetched imageIds for annotation:", imageIds);
                    
                    navigate(`/dashboard/annotation/${patient.uuid}/${studyId}/${seriesId}`, {
                        state: {
                            imageIds: imageIds, 
                            patientName: patient?.display_name,
                            studyDescription: studies.find(s => s.ID === studyId)?.MainDicomTags?.StudyDescription || studyId,
                            studyId: studyId,
                            seriesId: seriesId
                        }
                    });
                    onClose(); 
                } else {
                    setSeriesImageError('선택한 시리즈에 이미지 데이터가 없습니다.');
                }
            } catch (error) {
                console.error("[StudiesModal] Error fetching imageIds for annotation:", error);
                const errorMessage = error.response?.data?.error || error.message || '알 수 없는 오류';
                setSeriesImageError(`이미지 목록 로딩 실패: ${errorMessage}`);
            } finally {
                setLoadingSeriesImages(false);
            }
        }
    };


    if (!studies || studies.length === 0) {
        return (
            <div style={modalStyle}>
                <div style={modalContentStyle}>
                    <h3>영상 검사 목록</h3>
                    <p>조회된 영상 검사 정보가 없습니다.</p>
                    <button onClick={onClose} style={{ ...buttonStyle, marginTop: '20px', alignSelf: 'flex-end' }}>닫기</button>
                </div>
            </div>
        );
    }

    return (
        <div style={modalStyle}>
            <div style={modalContentStyle}>
                <h3 style={{
                    margin: 0,
                    paddingBottom: '10px',
                    borderBottom: '1px solid #eee',
                    color: '#333'
                }}>
                    {patient?.display || '환자'}의 영상 검사 목록
                </h3>

                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', marginTop: '15px', overflowY: 'auto' }}>
                    {(mode === 'viewer' && studies[0]?.viewer_url) ? ( 
                        <>
                            <div style={infoBoxStyle}>
                                <div style={{ marginBottom: '8px' }}>
                                    <strong>현재 뷰어 (첫 번째 검사):</strong> {studies[0].MainDicomTags?.StudyDescription || '설명 없음'}
                                </div>
                                <div>
                                    <strong>환자 ID:</strong> {studies[0].MainDicomTags?.PatientID || 'N/A'} |
                                    <strong> 검사 날짜:</strong> {studies[0].MainDicomTags?.StudyDate || 'N/A'} |
                                    <strong> Modality:</strong> {studies[0].MainDicomTags?.Modality || 'N/A'}
                                </div>
                            </div>
                            {!viewerError ? ( 
                                <iframe
                                    src={studies[0].viewer_url}
                                    title={`DICOM Viewer for ${studies[0].ID}`}
                                    width="100%"
                                    style={{ border: '1px solid #ccc', flexGrow: 1, minHeight: '300px', borderRadius: '4px' }}
                                    allowFullScreen
                                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                                    onError={handleIframeError}
                                >
                                    <p>브라우저가 iframe을 지원하지 않습니다.</p>
                                </iframe>
                            ) : (
                                <div style={errorBoxStyle}><h4>뷰어 로딩 실패</h4><p>Orthanc 기본 뷰어를 로드하는 중 오류가 발생했습니다. 이 문제는 일반적으로 로컬 환경 설정, CORS 정책, 또는 Orthanc 서버의 문제로 인해 발생합니다. 자세한 내용은 개발자 콘솔을 확인하십시오.</p></div>
                            )}
                        </>
                    ) : ( 
                        <>
                            {loadingSeriesImages && <p>이미지 데이터 로딩 중...</p>}
                            {seriesImageError && <p style={{ color: 'red' }}>{seriesImageError}</p>}
                        </>
                    )}

                    <div style={{ marginTop: '20px' }}>
                        <h4 style={{ borderTop: (mode === 'viewer' && studies[0]?.viewer_url) ? '1px solid #eee' : 'none', paddingTop: (mode === 'viewer' && studies[0]?.viewer_url) ? '15px' : '0' }}>
                            {mode === 'annotation' ? '어노테이션할 시리즈 선택' : '다른 스터디/시리즈 보기'}
                        </h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {studies.map(study => (
                                <li key={study.ID} style={{ border: '1px solid #ddd', padding: '15px', margin: '10px 0', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                                    <strong>Study: {study.MainDicomTags?.StudyDescription || '설명 없음'}</strong>
                                    <div style={{ fontSize: '0.9rem', color: '#555' }}><small>검사 날짜: {study.MainDicomTags?.StudyDate}</small></div>

                                    <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '10px' }}>
                                        {(study.Series && study.Series.length > 0) ? (
                                            // series.ID를 직접 onClick 핸들러에 전달합니다.
                                            study.Series.map(series => (
                                                <li key={series.ID} style={{ padding: '5px', cursor: 'pointer', color: '#007bff' }}
                                                    onClick={() => handleSeriesSelect(study.ID, series.ID)}>
                                                    모달리티: {series.MainDicomTags?.Modality || 'N/A'},
                                                    설명: {series.MainDicomTags?.SeriesDescription || '없음'}
                                                    ({series.Instances.length || 0} 이미지)
                                                </li>
                                            ))
                                        ) : (
                                            <li>이 스터디에 시리즈가 없습니다.</li>
                                        )}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    style={{ ...buttonStyle, marginTop: '20px', alignSelf: 'flex-end' }}
                >
                    닫기
                </button>
            </div>
        </div>
    );
};

export default StudiesModal;
