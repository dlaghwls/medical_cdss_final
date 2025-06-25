// /src/components/Common/ChatModal.js (이 파일을 새로 생성해주세요)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
// API 호출 함수들을 실제 경로에서 import 해야 합니다.
import { fetchMedicalStaff, fetchChatMessages, sendMessage } from '../../services/djangoApiService';

const ChatModal = ({ onClose }) => {
    const { user } = useAuth(); // 현재 로그인한 사용자 정보
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 의료진 목록 불러오기
    useEffect(() => {
        const loadStaff = async () => {
            try {
                const data = await fetchMedicalStaff();
                setStaffList(data);
            } catch (error) {
                console.error("의료진 목록 로드 실패:", error);
                setError('의료진 목록을 불러오는데 실패했습니다.');
            }
        };
        loadStaff();
    }, []);

    // 특정 의료진과의 메시지 불러오기 (3초마다 폴링)
    useEffect(() => {
        if (!selectedStaff) return;

        setLoading(true);
        const loadMessages = async () => {
            try {
                // 'fetchChatMessages'가 맞는지 확인합니다.
                const data = await fetchChatMessages(selectedStaff.employee_id);
                setMessages(data);
            } catch (error) {
                console.error("메시지 로드 실패:", error);
                setError('메시지를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        loadMessages(); // 즉시 한 번 호출
        const intervalId = setInterval(loadMessages, 3000); // 3초마다 반복

        return () => clearInterval(intervalId); // 컴포넌트 언마운트 시 인터벌 정리
    }, [selectedStaff]);
    
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedStaff) return;

        try {
            await sendMessage(selectedStaff.employee_id, newMessage);
            setNewMessage('');
            // 메시지 전송 후 즉시 목록 새로고침
            const data = await fetchChatMessages(selectedStaff.employee_id);
            setMessages(data);
        } catch (error) {
            console.error("메시지 전송 실패:", error);
            setError('메시지 전송에 실패했습니다.');
        }
    };
    
    // 스타일 정의
    const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
    const modalContentStyle = { backgroundColor: '#fff', color: '#333', padding: '20px', borderRadius: '10px', width: '800px', height: '600px', display: 'flex', flexDirection: 'column', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' };
    const chatLayoutStyle = { display: 'flex', flexGrow: 1, gap: '20px', overflow: 'hidden' };
    const staffListStyle = { width: '30%', borderRight: '1px solid #eee', overflowY: 'auto', paddingRight: '10px' };
    const chatWindowStyle = { width: '70%', display: 'flex', flexDirection: 'column' };
    const messagesContainerStyle = { flexGrow: 1, overflowY: 'auto', border: '1px solid #ddd', padding: '10px', marginBottom: '10px', borderRadius: '5px' };

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                    <h2>메시지</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                </div>

                <div style={chatLayoutStyle}>
                    <div style={staffListStyle}>
                        <h4>대화 상대</h4>
                        {staffList.map(staff => (
                            <div key={staff.employee_id} onClick={() => setSelectedStaff(staff)} style={{ padding: '10px', cursor: 'pointer', backgroundColor: selectedStaff?.employee_id === staff.employee_id ? '#e0f7fa' : 'transparent', borderRadius: '5px' }}>
                                {staff.name} ({staff.role})
                            </div>
                        ))}
                    </div>
                    <div style={chatWindowStyle}>
                        {selectedStaff ? (
                            <>
                                <h4>{selectedStaff.name}님과의 대화</h4>
                                <div style={messagesContainerStyle}>
                                    {loading ? <p>메시지를 불러오는 중...</p> : (messages && messages.length > 0 ? messages.map(msg => (
                                        <div key={msg.uuid} style={{ textAlign: msg.sender.employee_id === user.employee_id ? 'right' : 'left', marginBottom: '10px' }}>
                                            <div style={{ display: 'inline-block', padding: '8px 12px', borderRadius: '15px', backgroundColor: msg.sender.employee_id === user.employee_id ? '#007bff' : '#f1f1f1', color: msg.sender.employee_id === user.employee_id ? 'white' : 'black' }}>
                                                {msg.content}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '3px' }}>
                                                {new Date(msg.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    )) : <p>메시지 기록이 없습니다.</p>)}
                                </div>
                                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} style={{ flexGrow: 1, padding: '10px' }} placeholder="메시지를 입력하세요..." />
                                    <button type="submit">전송</button>
                                </form>
                            </>
                        ) : (
                            <p>대화 상대를 선택해주세요.</p>
                        )}
                        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatModal;
