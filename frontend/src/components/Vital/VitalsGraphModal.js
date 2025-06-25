// 6월 24일 작업 전 내용
// import React, { useState, useEffect } from 'react';
// import { fetchVitalsHistory } from '../../services/djangoApiService'; // 위에서 만든 함수 import
// import { Line } from 'react-chartjs-2'; // Chart.js 라이브러리 사용
// import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// // Chart.js에 필요한 요소들을 등록
// ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// const VitalsGraphModal = ({ patientId, isOpen, onClose }) => {
//     const [records, setRecords] = useState([]);
//     const [timeRange, setTimeRange] = useState('1d'); // '1d', '1w', '1m', '1y'
//     const [loading, setLoading] = useState(true);

//     // timeRange가 바뀔 때마다 API를 다시 호출해서 데이터를 가져옴
//     useEffect(() => {
//         if (isOpen) {
//             setLoading(true);
//             fetchVitalsHistory(patientId, timeRange)
//                 .then(data => {
//                     setRecords(data);
//                     setLoading(false);
//                 })
//                 .catch(err => {
//                     console.error(err);
//                     setLoading(false);
//                 });
//         }
//     }, [isOpen, patientId, timeRange]);

//     if (!isOpen) return null;

//     // 차트 데이터 가공
//     const chartData = {
//     // X축 레이블: 각 기록의 측정 시간을 표시
//     labels: records.map(rec => new Date(rec.recorded_at).toLocaleString()),
    
//     // Y축 데이터: 각 Vital 수치를 별도의 라인으로 표시
//     datasets: [
//         {
//             label: '수축기 혈압 (SBP)',
//             // '120/80' 같은 문자열에서 앞부분('120')만 추출하여 숫자로 변환
//             data: records.map(rec => {
//                 const bp = rec.measurements.bp;
//                 // bp 데이터가 있고, '/'를 포함하는지 확인하여 오류 방지
//                 return bp && bp.includes('/') ? parseInt(bp.split('/')[0], 10) : null;
//             }),
//             borderColor: 'rgb(255, 99, 132)',
//             backgroundColor: 'rgba(255, 99, 132, 0.5)',
//             yAxisID: 'y_bp', // 혈압 전용 Y축 사용 (선택 사항)
//         },
//         {
//             label: '이완기 혈압 (DBP)',
//             // '120/80' 같은 문자열에서 뒷부분('80')만 추출하여 숫자로 변환
//             data: records.map(rec => {
//                 const bp = rec.measurements.bp;
//                 return bp && bp.includes('/') ? parseInt(bp.split('/')[1], 10) : null;
//             }),
//             borderColor: 'rgb(255, 159, 64)',
//             backgroundColor: 'rgba(255, 159, 64, 0.5)',
//             yAxisID: 'y_bp', // 혈압 전용 Y축 사용 (선택 사항)
//         },
//         {
//             label: '심박수 (HR)',
//             data: records.map(rec => rec.measurements.hr),
//             borderColor: 'rgb(75, 192, 192)',
//             backgroundColor: 'rgba(75, 192, 192, 0.5)',
//             yAxisID: 'y_hr_rr', // 심박수/호흡수 Y축
//         },
//         {
//             label: '호흡수 (RR)',
//             data: records.map(rec => rec.measurements.rr),
//             borderColor: 'rgb(54, 162, 235)',
//             backgroundColor: 'rgba(54, 162, 235, 0.5)',
//             yAxisID: 'y_hr_rr', // 심박수/호흡수 Y축
//         },
//         {
//             label: '산소포화도 (SpO2)',
//             data: records.map(rec => rec.measurements.spo2),
//             borderColor: 'rgb(153, 102, 255)',
//             backgroundColor: 'rgba(153, 102, 255, 0.5)',
//             yAxisID: 'y_spo2', // 산소포화도 전용 Y축
//         },
//         {
//             label: '체온 (Temp)',
//             data: records.map(rec => rec.measurements.temp),
//             borderColor: 'rgb(255, 205, 86)',
//             backgroundColor: 'rgba(255, 205, 86, 0.5)',
//             yAxisID: 'y_temp', // 체온 전용 Y축
//         }
//     ]
// };

// // (선택 사항) 만약 각 수치별로 Y축 단위를 다르게 하고 싶다면,
// // 아래와 같이 chart의 options을 수정할 수 있습니다.
// const chartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     interaction: {
//         mode: 'index',
//         intersect: false,
//     },
//     plugins: {
//         tooltip: {
//             mode: 'index',
//             intersect: false,
//         },
//         title: {
//             display: true,
//             text: 'Vital Signs Trend'
//         }
//     },
//     scales: {
//         y_bp: {
//             type: 'linear',
//             display: true,
//             position: 'left',
//             title: {
//                 display: true,
//                 text: '혈압 (mmHg)'
//             }
//         },
//         y_hr_rr: {
//             type: 'linear',
//             display: true,
//             position: 'right',
//             title: {
//                 display: true,
//                 text: '심박수/호흡수 (/min)'
//             },
//             grid: {
//                 drawOnChartArea: false, // 다른 Y축과 겹치지 않게 그리드 제거
//             },
//         },
//         y_spo2: { display: false }, // 다른 축들과 스케일이 너무 다르면 숨김 처리 가능
//         y_temp: { display: false }, // 또는 별도 축으로 구성 가능
//     }
// };

//     return (
//         // 모달 배경
//         <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
//             {/* 모달 창 (더 크게) */}
//             <div style={{ background: 'white', width: '80%', height: '80%', padding: '20px', borderRadius: '8px', display: 'flex', gap: '20px' }}>

//                 {/* 좌측 패널: 기록 목록 */}
//                 <div style={{ width: '40%', borderRight: '1px solid #ccc', overflowY: 'auto', paddingRight: '10px' }}>
//                     <h3>Vital 기록</h3>
//                     {loading ? <p>로딩 중...</p> : records.map(rec => (
//                         <div key={rec.session_id} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
//                             <strong>{new Date(rec.recorded_at).toLocaleString()}</strong>
//                             <p>혈압: {rec.measurements.bp}, 심박수: {rec.measurements.hr}, 호흡수: {rec.measurements.rr}, 체온: {rec.measurements.temp}, 산소포화도: {rec.measurements.spo2}</p>
//                             {rec.notes && <p>비고: {rec.notes}</p>}
//                         </div>
//                     ))}
//                 </div>

//                 {/* 우측 패널: 그래프 */}
//                 <div style={{ width: '60%', display: 'flex', flexDirection: 'column' }}>
//                     <h3>그래프</h3>
//                     <div>
//                         {['1d', '1w', '1m', '1y'].map(range => (
//                             <button key={range} onClick={() => setTimeRange(range)} disabled={timeRange === range}>
//                                 {range === '1d' ? '1일' : range === '1w' ? '일주일' : range === '1m' ? '한달' : '1년'}
//                             </button>
//                         ))}
//                     </div>
//                     <div style={{ flex: 1, position: 'relative' }}>
//                         {loading ? <p>그래프 로딩 중...</p> : <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { tooltip: { mode: 'index', intersect: false } } }} />}
//                     </div>
//                 </div>
//             </div>
//             <button onClick={onClose} style={{ position: 'absolute', top: '10px', right: '10px' }}>닫기</button>
//         </div>
//     );
// };

// export default VitalsGraphModal;