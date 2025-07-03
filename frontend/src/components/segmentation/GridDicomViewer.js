// // SEG 가짜 버전 
// import React from 'react';
// import DicomViewer from './DicomViewer';

// export default function GridDicomViewer({ seriesData }) {
//   const layout = [
//     { key: 'FLAIR', label: 'FLAIR' },
//     { key: 'ADC',   label: 'ADC' },
//     { key: 'DWI',   label: 'DWI' },
//     { key: 'SEG',   label: 'Segmentation' },
//   ];

//   const gridStyle = {
//     width: '100%',
//     height: '100%',
//     display: 'grid',
//     gridTemplateColumns: '1fr 1fr',
//     gridTemplateRows: '1fr 1fr',
//     gap: '5px',
//     backgroundColor: 'black',
//   };
//   const viewportStyle = {
//     width: '100%',
//     height: '100%',
//     position: 'relative',
//   };
//   const labelStyle = {
//     color: 'white',
//     position: 'absolute',
//     top: 5,
//     left: 5,
//     fontSize: '14px',
//     textShadow: '1px 1px 2px black',
//     zIndex: 10,
//   };

//   return (
//     <div style={gridStyle}>
//       {layout.map(({ key, label }) => {
//         const data = seriesData[key.toUpperCase()];
//         return (
//           <div key={key} style={viewportStyle}>
//             <div style={labelStyle}>{label}</div>
//             {data ? (
//               <DicomViewer
//                 imageIds={data.imageIds}
//                 seriesInstanceUID={data.seriesInstanceUID}
//                 imageType={key.toUpperCase()}
//               />
//             ) : (
//               <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
//                 <p style={{ color: 'grey' }}>{label} 데이터 로딩 중...</p>
//               </div>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// }


// // dicom SEG 오버레이 실패 버전 
// // /frontend/src/components/segmentation/GridDicomViewer.js
// import React from 'react';
// import DicomViewer from './DicomViewer';
// import OverlayDicomViewer from './OverlayDicomViewer';

// export default function GridDicomViewer({ seriesData }) {
//   const layout = [
//     { key: 'FLAIR', label: 'FLAIR' },
//     { key: 'ADC',   label: 'ADC' },
//     { key: 'DWI',   label: 'DWI' },
//     { key: 'SEG',   label: 'Segmentation' },
//   ];

//   return (
//     <div style={{
//       display: 'grid',
//       gridTemplateColumns: '1fr 1fr',
//       gridTemplateRows:    '1fr 1fr',
//       gap: '5px',
//       width: '100%', height: '100%',
//       backgroundColor: 'black',
//     }}>
//       {layout.map(({ key, label }) => {
//         const data = seriesData[key];
//         console.log(key, '→', data ? (key==='SEG'?'Overlay':'Viewer') : 'Loading');
//         console.log('seriesData keys:', Object.keys(seriesData));
//         return (
//           <div key={key} style={{ position:'relative', width:'100%', height:'100%' }}>
//             <div style={{
//               position:'absolute', top:5, left:5,
//               color:'white', textShadow:'1px 1px 2px black', zIndex:10
//             }}>{label}</div>

//             {data ? (
//               key === 'SEG'
//                 ? <OverlayDicomViewer
//                     baseIds={seriesData.FLAIR.imageIds}
//                     maskIds={data.imageIds}
//                     seriesId={data.seriesInstanceUID}
//                   />
//                 : <DicomViewer
//                     imageIds={data.imageIds}
//                     seriesInstanceUID={data.seriesInstanceUID}
//                     imageType={key}
//                   />
//             ) : (
//               <div style={{
//                 display:'flex', alignItems:'center', justifyContent:'center',
//                 width:'100%', height:'100%'
//               }}>
//                 <p style={{ color:'grey' }}>{label} 로딩 중…</p>
//               </div>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// }




// // /home/shared/medical_cdss/frontend/src/components/segmentation/GridDicomViewer.js
// import React from 'react';
// import DicomViewer from './DicomViewer';

// export default function GridDicomViewer({ seriesData }) {
//   const layout = [
//     { key: 'FLAIR', label: 'FLAIR' },
//     { key: 'ADC',   label: 'ADC' },
//     { key: 'DWI',   label: 'DWI' },
//     { key: 'SEG',   label: 'Segmentation' },
//   ];

//   return (
//     <div style={{
//       display: 'grid',
//       gridTemplateColumns: '1fr 1fr',
//       gridTemplateRows:    '1fr 1fr',
//       gap: '5px',
//       width: '100%', height: '100%',
//       backgroundColor: 'black',
//     }}>
//       {layout.map(({ key, label }) => {
//         const data = seriesData[key];
//         return (
//           <div key={key} style={{ position:'relative', width:'100%', height:'100%' }}>
//             <div style={{
//               position:'absolute', top:5, left:5,
//               color:'white', textShadow:'1px 1px 2px black', zIndex:10
//             }}>{label}</div>

//             {data ? (
//               <DicomViewer
//                 imageIds={data.imageIds}
//                 seriesInstanceUID={data.seriesInstanceUID}
//                 imageType={key}
//               />
//             ) : (
//               <div style={{
//                 display:'flex', alignItems:'center', justifyContent:'center',
//                 width:'100%', height:'100%'
//               }}>
//                 <p style={{ color:'grey' }}>{label} 로딩 중…</p>
//               </div>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// }


// /home/shared/medical_cdss/frontend/src/components/segmentation/GridDicomViewer.js

import React, { useState } from 'react'; // useState를 import 합니다.
import DicomViewer from './DicomViewer';

export default function GridDicomViewer({ seriesData }) {
  const layout = [
    { key: 'FLAIR', label: 'FLAIR' },
    { key: 'ADC',   label: 'ADC' },
    { key: 'DWI',   label: 'DWI' },
    { key: 'SEG',   label: 'Segmentation' },
  ];

  // ✨ 1. 모든 뷰어가 공유할 상태를 여기서 만듭니다.
  const [sharedSlice, setSharedSlice] = useState(1);
  const [totalSlices, setTotalSlices] = useState(1);

  // ✨ 2. 자식(DicomViewer)이 호출할 슬라이스 변경 함수입니다.
  const handleSliceChange = (newSlice) => {
    // newSlice 값이 범위 내에 있는지 확인하는 로직을 추가할 수 있습니다.
    if (newSlice >= 1 && newSlice <= totalSlices) {
      setSharedSlice(newSlice);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows:   '1fr 1fr',
      gap: '5px',
      width: '100%', height: '100%',
      backgroundColor: 'black',
    }}>
      {layout.map(({ key, label }) => {
        const data = seriesData[key];
        return (
          <div key={key} style={{ position:'relative', width:'100%', height:'100%' }}>
            <div style={{
              position:'absolute', top:5, left:5,
              color:'white', textShadow:'1px 1px 2px black', zIndex:10
            }}>{label}</div>

            {data ? (
              <DicomViewer
                imageIds={data.imageIds}
                seriesInstanceUID={data.seriesInstanceUID}
                imageType={key}
                
                // ✨ 3. 공유 상태와 함수를 props로 전달합니다.
                currentSlice={sharedSlice}
                totalSlices={totalSlices}
                onSliceChange={handleSliceChange}
                setTotalSlices={setTotalSlices} 
              />
            ) : (
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'center',
                width:'100%', height:'100%'
              }}>
                <p style={{ color:'grey' }}>{label} 로딩 중…</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}