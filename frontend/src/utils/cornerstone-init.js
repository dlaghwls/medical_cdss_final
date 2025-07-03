// import * as cornerstoneCore from '@cornerstonejs/core';
// import * as dicomImageLoader from '@cornerstonejs/dicom-image-loader';
// import dicomParser from 'dicom-parser';

// import { 
//   init as csToolsInit, 
//   addTool,
//   PanTool, 
//   ZoomTool, 
//   WindowLevelTool, 
//   BrushTool, 
//   StackScrollMouseWheelTool, 
//   SegmentationDisplayTool,
//   RectangleROITool,
//   LengthTool,
// } from '@cornerstonejs/tools';

// // 🔥 반드시 wadouri 네임스페이스에서 loadImage 사용
// const { registerImageLoader } = cornerstoneCore.imageLoader || cornerstoneCore;

// let isInitialized = false;
// let initializingPromise = null;

// const initCornerstone = async () => {
//   if (isInitialized) return;
//   if (initializingPromise) {
//     await initializingPromise;
//     return;
//   }
//   initializingPromise = (async () => {
//     try {
//       await cornerstoneCore.init();
//       csToolsInit();

//       // 외부 패키지 연결
//       dicomImageLoader.external.cornerstone = cornerstoneCore;
//       dicomImageLoader.external.dicomParser = dicomParser;

//       // wadouri image loader 등록
//       if (registerImageLoader && dicomImageLoader.wadouri && dicomImageLoader.wadouri.loadImage) {
//         registerImageLoader('wadouri', dicomImageLoader.wadouri.loadImage);
//       } else {
//         console.error('[cornerstone-init] wadouri.loadImage를 찾을 수 없습니다. 패키지 버전 확인 필요!');
//       }

//       // dicom-image-loader 설정
//       dicomImageLoader.configure({
//         webWorkerPath: '/cornerstone-dicom-image-loader-web-worker.js',
//         taskConfiguration: {
//           decodeTask: {
//             initializeCodecsOnStartup: false,
//             usePDFJS: false,
//             strict: false,
//           },
//         },
//         maxWebWorkers: navigator.hardwareConcurrency || 1,
//         startWebWorkersOnDemand: true,
//       });

//       // 주요 도구 등록
//       addTool(PanTool, { name: 'Pan' });
//       addTool(ZoomTool, { name: 'Zoom' });
//       addTool(WindowLevelTool, { name: 'WindowLevel' });
//       addTool(BrushTool, { name: 'Brush' });
//       addTool(StackScrollMouseWheelTool, { name: 'StackScrollMouseWheel' }); 
//       addTool(SegmentationDisplayTool, { name: 'SegmentationDisplay' });
//       addTool(RectangleROITool, { name: 'RectangleROI' });
//       addTool(LengthTool, { name: 'Length' });

//       isInitialized = true;
//     } catch (e) {
//       console.error('[initCornerstone] 초기화 중 심각한 오류 발생', e);
//       isInitialized = false;
//     } finally {
//       initializingPromise = null;
//     }
//   })();
//   await initializingPromise;
// };
// export default initCornerstone;

// /home/shared/medical_cdss/frontend/src/utils/cornerstone-init.js
import { init as cornerstoneCoreInit, imageLoader, metaData } from '@cornerstonejs/core';
import { init as dicomLoaderInit, wadouri } from '@cornerstonejs/dicom-image-loader';
import {
  init as csToolsInit,
  addTool,
  PanTool, ZoomTool, WindowLevelTool,
  BrushTool, StackScrollTool, RectangleROITool, LengthTool,
} from '@cornerstonejs/tools';

const initCornerstone = async () => {
  // 1) Core 초기화
  await cornerstoneCoreInit();

  // 2) Tools 초기화
  csToolsInit();

  // 3) DICOM Loader 초기화 (워커 풀 설정)
  await dicomLoaderInit({
    maxWebWorkers: navigator.hardwareConcurrency || 1
  });
  console.log('[cornerstone-init] dicom-image-loader 초기화 OK');

  // 4) wadouri 이미지 로더·메타데이터 등록
  imageLoader.registerImageLoader('wadouri', wadouri.loadImage);
  console.log('[cornerstone-init] wadouri.loadImage 등록 OK');

  // ★ 중요: 최신 API는 metaDataProvider가 최상위 export입니다
  metaData.addProvider(wadouri.metaData.metaDataProvider);
  console.log('[cornerstone-init] wadouri.metaDataProvider 등록 OK');

  // 5) 툴 등록
  addTool(PanTool);
  addTool(ZoomTool);
  addTool(WindowLevelTool);
  addTool(BrushTool);
  addTool(StackScrollTool);
  addTool(RectangleROITool);
  addTool(LengthTool);
};

export default initCornerstone;
