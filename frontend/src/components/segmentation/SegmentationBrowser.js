// /home/shared/medical_cdss/frontend/src/components/segmentation/SegmentationBrowser.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

import DicomViewer from './DicomViewer';
import GridDicomViewer from './GridDicomViewer';

const api = axios.create({
    baseURL: 'http://34.64.188.9:8000/api/pacs',
    headers: { 'Content-Type': 'application/json' },
});

const segmentationApi = axios.create({
    baseURL: 'http://34.64.188.9/api/segment',
    headers: { 'Content-Type': 'application/json' },
});

const TrashIcon = ({ style, onClick, onMouseEnter, onMouseLeave }) => (
    <svg onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const ProgressBar = ({ progress }) => {
    const containerStyle = { width: '100%', backgroundColor: '#475569', borderRadius: '0.25rem', overflow: 'hidden', height: '12px' };
    const fillerStyle = { width: `${progress}%`, backgroundColor: '#e2e8f0', height: '100%', textAlign: 'right', transition: 'width 0.3s ease-in-out' };
    return <div style={containerStyle}><div style={fillerStyle}></div></div>;
};

const styles = {
    fontSans: { fontFamily: 'sans-serif' },
    h2: { fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' },
    mainContainer: { backgroundColor: '#fff', padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
    h3: { fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' },
    twoColumnGrid: { display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem' },
    scrollContainer: { maxHeight: '65vh', overflowY: 'auto', backgroundColor: '#e5e7eb', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' },
    sessionCard: { display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', marginBottom: '1rem', cursor: 'pointer', transition: 'all 0.2s ease-in-out', overflow: 'hidden' },
    selectedCard: { border: '2px solid #0284c7', transform: 'scale(1.02)', boxShadow: '0 4px 12px 0 rgb(0 0 0 / 0.15)' },
    cardBody: { padding: '1rem', flexGrow: 1 },
    cardTitleContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontWeight: 'bold', color: '#0c4a6e', fontSize: '1rem' },
    separator: { borderTop: '1px solid #bae6fd', marginTop: '0.75rem', marginBottom: '0.75rem' },
    fileListContainer: { flexGrow: 1 },
    fileRow: { display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' },
    fileInfo: { display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: '1rem' },
    modalityLabel: { fontWeight: '600', color: '#0369a1', fontSize: '0.875rem', whiteSpace: 'nowrap' },
    fileButtonContainer: { display: 'flex', alignItems: 'center' },
    fileIcon: { marginRight: '0.5rem', color: '#38bdf8' },
    fileButton: { color: '#0284c7', textDecoration: 'underline', textAlign: 'left', fontSize: '0.875rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer' },
    segFileButton: { color: '#075985', textDecoration: 'underline', textAlign: 'left', fontSize: '0.875rem', fontWeight: 'bold', background: 'none', border: 'none', padding: 0, cursor: 'pointer' },
    emptyStateBox: { backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem', padding: '2rem', textAlign: 'center', marginTop: '0.5rem' },
    emptyStateText1: { color: '#0c4a6e', fontWeight: '600' },
    emptyStateText2: { color: '#0369a1', marginTop: '0.5rem', fontSize: '0.875rem' },
    detailPanel: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem', height: '65vh' },
    detailPlaceholderText: { color: '#6b7280', textAlign: 'center', paddingTop: '4rem' },
    cardFooter: { backgroundColor: '#334155', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' },
    segmentationButton: { backgroundColor: '#cbd5e1', color: '#334155', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', fontWeight: 'bold', fontSize: '0.875rem', cursor: 'pointer', transition: 'background-color 0.2s', },
    deleteButton: { background: 'none', border: 'none', padding: '0.25rem', cursor: 'pointer', color: '#9ca3af', transition: 'color 0.2s' },
    deleteButtonHover: { color: '#ef4444' },
};


const CustomModal = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;
    const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, };
    const modalContentStyle = { position: 'relative', width: '85vw', height: '90vh', backgroundColor: '#2d3748', color: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)', display: 'flex', flexDirection: 'column', };
    const closeButtonStyle = { position: 'absolute', top: '10px', right: '15px', background: 'transparent', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: '#A0AEC0', };
    const titleStyle = { paddingBottom: '1rem', borderBottom: '1px solid #4A5568', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold', };
    return ( <div style={modalOverlayStyle} onClick={onClose}> <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}> <button style={closeButtonStyle} onClick={onClose}>&times;</button> <h2 style={titleStyle}>{title}</h2> <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#1a202c' }}> {children} </div> </div> </div> );
};

const SegmentationBrowser = ({ selectedPatient }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSingleViewerOpen, setIsSingleViewerOpen] = useState(false);
    const [singleViewerData, setSingleViewerData] = useState(null);
    const [isGridOpen, setIsGridOpen] = useState(false);
    const [gridData, setGridData] = useState(null);
    const [isViewerLoading, setIsViewerLoading] = useState(false);
    const [viewerError, setViewerError] = useState('');
    const patientId = selectedPatient?.uuid;
    const [selectedSession, setSelectedSession] = useState(null);
    const [hoveredDelete, setHoveredDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [processingInfo, setProcessingInfo] = useState({});

    useEffect(() => {
        if (patientId) {
            setLoading(true);
            setError(null);
            setSelectedSession(null);
            api.get(`/patient-sessions/${patientId}/`).then(response => { setSessions(response.data.sessions || []); }).catch(err => { setError("파일 목록을 불러오는 중 오류가 발생했습니다."); }).finally(() => setLoading(false));
        } else {
            setSessions([]);
        }
    }, [patientId]);
    
    useEffect(() => {
        // progress가 81 이상 99 미만일 때만 애니메이션을 실행합니다.
        if (processingInfo.progress >= 81 && processingInfo.progress < 99) {
            // 0.8초마다 progress를 0.5씩 부드럽게 증가시킵니다.
            const timer = setTimeout(() => {
                setProcessingInfo(prev => ({
                    ...prev,
                    progress: Math.min(prev.progress + 0.5, 99) 
                }));
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [processingInfo.progress]);
    
    const handleSegmentationClick = async (session) => {
        if (Object.keys(processingInfo).length > 0) {
            alert("현재 다른 세션을 분석 중입니다.");
            return;
        }
        if (!session || !session.modalities) {
            alert("오류: 세션 데이터가 올바르지 않습니다.");
            return;
        }
    
        try {
            const findFile = (targetModality) => {
                const key = Object.keys(session.modalities).find(k => k.toLowerCase() === targetModality.toLowerCase());
                return key ? session.modalities[key]?.[0] : null;
            };
            const dwiFile = findFile('dwi');
            const flairFile = findFile('flair');
            const adcFile = findFile('adc');

            if (!dwiFile || !flairFile || !adcFile) {
                alert("오류: 병변 분할에 필요한 DWI, FLAIR, ADC 파일 중 하나 이상이 존재하지 않습니다.");
                return;
            }

            const payload = {
                patient_id: patientId,
                study_id: `study-dwi-flair-adc-${session.sessionId}`,
                dwi_nifti_path_gcs: dwiFile.gcs_path,
                optional_nifti_paths_gcs: { flair: flairFile.gcs_path, adc: adcFile.gcs_path }
            };
        
            const response = await segmentationApi.post('/segment/', payload);
            const { task_id } = response.data;

            if (!task_id) { throw new Error("서버에서 task_id를 받지 못했습니다."); }

            setProcessingInfo({ id: session.sessionId, progress: 0 });

            const intervalId = setInterval(async () => {
                try {
                    const statusResponse = await segmentationApi.get(`/task_status/${task_id}`);
                    console.log("서버가 보낸 실제 응답:", statusResponse.data); 
                    // 1. 서버 응답의 최상위 레벨에서 status, result, error를 먼저 추출합니다.
                    const { status, result, error } = statusResponse.data;

                    if (status === 'SUCCESS') {
                        clearInterval(intervalId);
                        setProcessingInfo({ id: session.sessionId, progress: 100 });
                        setTimeout(() => {
                            setProcessingInfo({});
                            alert(`[${session.sessionId}] 세션 분석 완료!`);
                            api.get(`/patient-sessions/${patientId}/`).then(res => setSessions(res.data.sessions || []));
                        }, 1000);
                        return;
                    }

                    if (status === 'FAILURE') {
                        clearInterval(intervalId);
                        setProcessingInfo({});
                        // 'error'는 최상위 레벨에 있으므로 바로 사용합니다.
                        const errorMessage = error || "세션 분석 중 오류가 발생했습니다.";
                        alert(`[${session.sessionId}] ${errorMessage}`);
                        return;
                    }

                    // 2. status가 'PROGRESS'이고, 세부 정보가 담긴 result 객체가 존재할 때만 내부를 확인합니다.
                    if (status === 'PROGRESS' && result) {
                        // 3. result 객체 안에서 progress와 stage를 추출합니다.
                        const { progress, stage } = result;

                        // 'predicting' 단계에서는 애니메이션을 시작합니다.
                       if (stage !== 'predicting') {
                             // 서버 progress 값(0~80)까지만 프론트에 반영
                            setProcessingInfo({ id: session.sessionId, progress: Math.min(progress, 80) });
                        } else if (processingInfo.progress < 81) {
                            // predicting 단계 진입 시점: 81%로 변경 (애니메이션 구간 진입)
                            setProcessingInfo({ id: session.sessionId, progress: 81 });
                        }
                    }
                } catch (pollErr) {
                    console.error("상태 확인 실패:", pollErr);
                    clearInterval(intervalId);
                    setProcessingInfo({});
                    alert("진행 상황을 확인하는 데 실패했습니다.");
                }
            }, 3000);

        } catch (err) {
            console.error("Segmentation failed:", err);
            const errorMsg = err.response?.data?.detail || err.message;
            alert(`오류가 발생하여 분할 작업을 시작하지 못했습니다.\n${errorMsg}`);
        }
    };

    const handleDeleteFile = async (fileToDelete) => {
        if (isDeleting) return;
        if (!window.confirm(`[${fileToDelete.name}] 파일을 정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) { return; }
        setIsDeleting(true);
        try {
            await api.delete('/file', { data: { gcs_path: fileToDelete.gcs_path } });
            const newSessions = sessions.map(session => {
                const newModalities = { ...session.modalities };
                for (const modality in newModalities) {
                    newModalities[modality] = newModalities[modality].filter(file => file.gcs_path !== fileToDelete.gcs_path);
                }
                return { ...session, modalities: newModalities };
            });
            setSessions(newSessions);
            alert("파일이 성공적으로 삭제되었습니다.");
        } catch (err) {
            console.error("파일 삭제 실패:", err);
            alert("파일 삭제 중 오류가 발생했습니다.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteSession = async (sessionToDelete) => {
        if (isDeleting) return;
        if (!window.confirm(`[${sessionToDelete.sessionId}] 세션 전체를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) { return; }
        setIsDeleting(true);
        try {
            await api.delete(`/session`, { data: { patient_id: patientId, session_id: sessionToDelete.sessionId } });
            const newSessions = sessions.filter(session => session.sessionId !== sessionToDelete.sessionId);
            setSessions(newSessions);
            if (selectedSession && selectedSession.sessionId === sessionToDelete.sessionId) {
                setSelectedSession(null);
            }
            alert("세션이 성공적으로 삭제되었습니다.");
        } catch (err) {
            console.error("세션 삭제 실패:", err);
            alert("세션 삭제 중 오류가 발생했습니다.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFileClick = async (file, modality) => {
        setSingleViewerData(null);
        setViewerError('');
        setIsViewerLoading(true);
        setIsSingleViewerOpen(true);
        try {
            const response = await api.post('/view-nifti-as-dicom/', { gcs_path: file.gcs_path, patient_uuid: patientId, image_type: modality });
            if (!response.data.imageIds || response.data.imageIds.length === 0) {
                throw new Error('서버에서 DICOM imageIds를 받지 못했습니다.');
            }
            setSingleViewerData({ ...response.data, imageType: modality });
        } catch (err) {
            setViewerError("DICOM 변환에 실패했습니다.");
            setIsSingleViewerOpen(false);
        } finally {
            setIsViewerLoading(false);
        }
    };

    const handleGridViewClick = async (modalities) => {
        setGridData(null);
        setViewerError('');
        setIsViewerLoading(true); // 로딩 시작
        setIsGridOpen(true);

        try {
            const requiredTypes = ['flair', 'adc', 'dwi', 'seg'];
            // ... (payloadImages 생성 로직은 동일)
            const payloadImages = requiredTypes.map(type => {
                const modalityKey = Object.keys(modalities).find(m => m.toLowerCase() === type);
                if (!modalityKey || !modalities[modalityKey] || modalities[modalityKey].length === 0) throw new Error(`필수 이미지 타입(${type.toUpperCase()})을 찾을 수 없습니다.`);
                return { type: type.toUpperCase(), gcs_path: modalities[modalityKey][0].gcs_path };
            });

            const response = await api.post('/nifti-to-dicom-bundle/', { patient_uuid: patientId, images: payloadImages });
            // ← 여기에 디버그 로그 추가
            console.log('🛠 변환 응답 (response.data):', response.data);

            setGridData(response.data);
            // ← 그리고 state 설정 직후에도 찍어보세요
            console.log('🛠 gridData 상태:', response.data);
            
            setIsViewerLoading(false); // ★★★ API 응답 성공 후 바로 로딩 상태 해제

        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message || "4종 이미지 변환에 실패했습니다.";
            setViewerError(errorMsg);
            setIsGridOpen(false); // 에러 시 모달 닫기
            setIsViewerLoading(false); // ★★★ 에러 발생 시에도 로딩 상태 해제
        } 
    };
    
    if (loading) return <p>목록 로딩 중...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div style={styles.fontSans}>
            <h2 style={styles.h2}>영상 분할 및 분석</h2>
            <div style={styles.mainContainer}>
                <div style={styles.twoColumnGrid}>
                    <div>
                        <h3 style={styles.h3}>환자 MRI 이미지 목록</h3>
                        {sessions.length > 0 ? (
                            <div style={styles.scrollContainer}>
                                {sessions.map((session, index) => {
                                    const isSelected = selectedSession && selectedSession.sessionId === session.sessionId;
                                    const cardStyle = { ...styles.sessionCard, ...(isSelected && styles.selectedCard), ...(index === sessions.length - 1 && { marginBottom: 0 }), };
                                    return (
                                        <div key={session.sessionId} style={cardStyle} onClick={() => setSelectedSession(session)}>
                                            <div style={styles.cardBody}>
                                                <div style={styles.cardTitleContainer}>
                                                    <h4 style={styles.cardTitle}>{session.sessionId}</h4>
                                                    <TrashIcon 
                                                        style={hoveredDelete === session.sessionId ? {...styles.deleteButton, ...styles.deleteButtonHover} : styles.deleteButton}
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteSession(session); }}
                                                        onMouseEnter={() => setHoveredDelete(session.sessionId)}
                                                        onMouseLeave={() => setHoveredDelete(null)}
                                                    />
                                                </div>
                                                <div style={styles.separator}></div>
                                                {Object.entries(session.modalities).map(([modality, files]) => (
                                                    files.map(file => (
                                                        <div key={file.gcs_path} style={styles.fileRow}>
                                                            <div style={styles.fileInfo}>
                                                                <span style={styles.modalityLabel}>{modality.toUpperCase()}</span>
                                                                <div style={styles.fileButtonContainer} onClick={(e) => e.stopPropagation()}>
                                                                    <span style={styles.fileIcon}>📄</span>
                                                                    {modality.toLowerCase() === 'seg' ? ( <button onClick={() => handleGridViewClick(session.modalities)} style={styles.segFileButton}> {file.name} (4종 동시 보기) </button> ) : ( <button onClick={() => handleFileClick(file, modality)} style={styles.fileButton}> {file.name} </button> )}
                                                                </div>
                                                            </div>
                                                            <div onClick={(e) => e.stopPropagation()}>
                                                                <TrashIcon 
                                                                    style={hoveredDelete === file.gcs_path ? {...styles.deleteButton, ...styles.deleteButtonHover} : styles.deleteButton}
                                                                    onClick={() => handleDeleteFile(file)}
                                                                    onMouseEnter={() => setHoveredDelete(file.gcs_path)}
                                                                    onMouseLeave={() => setHoveredDelete(null)}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))
                                                ))}
                                            </div>
                                            <div style={styles.cardFooter} onClick={(e) => e.stopPropagation()}>
                                                {processingInfo.id === session.sessionId ? (
                                                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <ProgressBar progress={processingInfo.progress} />
                                                        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>{processingInfo.progress}%</span>
                                                    </div>
                                                ) : (
                                                    <button style={styles.segmentationButton} onClick={() => handleSegmentationClick(session)}>
                                                        병변 분할
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={styles.emptyStateBox}>
                                <p style={styles.emptyStateText1}>선택된 환자의 MRI 분석 기록이 없습니다.</p>
                                <p style={styles.emptyStateText2}>새로운 분석 기록을 생성해주세요.</p>
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 style={styles.h3}>상세 정보</h3>
                        <div style={styles.detailPanel}>
                            {selectedSession ? (
                                // 선택된 세션이 있을 경우, 상세 정보를 렌더링합니다.
                                <div>
                                    <h4 style={{...styles.cardTitle, fontSize: '1.1rem', marginBottom: '1rem'}}>
                                        세션: {selectedSession.sessionId}
                                    </h4>

                                    {/* 각 시리즈의 메타데이터를 표시 */}
                                    {Object.entries(selectedSession.modalities).map(([modality, files]) => {
                                        // 해당 시리즈의 첫 번째 파일 메타데이터를 사용 (대부분 동일하므로)
                                        const metadata = files[0]?.metadata;
                                        if (!metadata) return null; // 메타데이터가 없으면 표시 안 함

                                        return (
                                            <div key={modality} style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
                                                <p style={{ fontWeight: 'bold', color: '#0c4a6e' }}>{modality.toUpperCase()}</p>
                                                <ul style={{ listStyle: 'none', paddingLeft: '1rem', fontSize: '0.875rem', color: '#4b5567' }}>
                                                    <li><strong>해상도:</strong> {metadata.resolution || 'N/A'}</li>
                                                    <li><strong>슬라이스 두께:</strong> {metadata.sliceThickness ? `${metadata.sliceThickness} mm` : 'N/A'}</li>
                                                </ul>
                                            </div>
                                        );
                                    })}

                                </div>
                            ) : (
                                // 선택된 세션이 없을 경우, 안내 메시지를 표시합니다.
                                <p style={styles.detailPlaceholderText}>왼쪽 목록에서 분석할 세션을 선택하세요.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <CustomModal isOpen={isSingleViewerOpen} onClose={() => setIsSingleViewerOpen(false)} title="개별 이미지 뷰어">
                {isViewerLoading && <p><span>⏳</span> DICOM 변환 및 로딩 중...</p>}
                {viewerError && <p className="text-red-500">{viewerError}</p>}
                {singleViewerData && !isViewerLoading && <DicomViewer {...singleViewerData} />}
            </CustomModal>
            <CustomModal isOpen={isGridOpen} onClose={() => setIsGridOpen(false)} title="종합 이미지 뷰어">
                {isViewerLoading && <p><span>⏳</span> 전체 이미지 변환 및 렌더링 중...</p>}
                {viewerError && <p className="text-red-500">{viewerError}</p>}
                {/* onLoaded, onError props 제거 */}
                {gridData && <GridDicomViewer seriesData={gridData} />} 
            </CustomModal>
        </div>
    );
};

export default SegmentationBrowser;