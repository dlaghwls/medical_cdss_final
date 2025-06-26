import React, { useEffect, useRef, useState } from 'react';
import {
  init as cornerstoneCoreInit,
  RenderingEngine,
  Enums as csCoreEnums,
  getRenderingEngine,
} from '@cornerstonejs/core';
import {
  init as cornerstoneToolsInit,
  addTool,
  ToolGroupManager,
  StackScrollTool,
  PanTool,
  ZoomTool,
  Enums as csToolsEnums,
} from '@cornerstonejs/tools';
// DICOM Image Loader는 init이 아니라 configure + webWorkerManager.initialize 로 사용
import WADOImageLoader from '@cornerstonejs/dicom-image-loader';

let isCornerstoneInitialized = false;

async function initCornerstone() {
  if (isCornerstoneInitialized) return;

  // 1) Core init
  await cornerstoneCoreInit();

  // 2) Tools init
  cornerstoneToolsInit();

  // 3) DICOM Image Loader 초기화 (v3 Migration: init() 하나로 끝)
  await WADOImageLoader.init({
    maxWebWorkers: navigator.hardwareConcurrency || 1,
  });

  // 4) 전역 툴 한 번만 등록
  addTool(StackScrollTool);
  addTool(PanTool);
  addTool(ZoomTool);

  isCornerstoneInitialized = true;
}

export default function DicomViewer({ imageIds, seriesInstanceUID }) {
  const elementRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const renderingEngineId = `engine-${seriesInstanceUID}`;
  const viewportId = `viewport-${seriesInstanceUID}`;
  const toolGroupId = `toolgroup-${seriesInstanceUID}`;

  useEffect(() => {
    async function setupViewer() {
      if (!elementRef.current || !imageIds?.length) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);

        // 1) Cornerstone + Tools + Loader 초기화
        await initCornerstone();

        // 2) 이전 엔진 cleanup
        const prev = getRenderingEngine(renderingEngineId);
        if (prev) prev.destroy();

        // 3) 새 엔진 생성 & element 활성화
        const renderingEngine = new RenderingEngine(renderingEngineId);
        renderingEngine.enableElement({
          viewportId,
          element: elementRef.current,
          type: csCoreEnums.ViewportType.STACK,
        });

        // 4) ToolGroup 세팅
        ToolGroupManager.destroyToolGroup(toolGroupId);
        const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
        toolGroup.addTool(StackScrollTool.toolName);
        toolGroup.addTool(PanTool.toolName);
        toolGroup.addTool(ZoomTool.toolName);
        toolGroup.addViewport(viewportId, renderingEngineId);
        toolGroup.setToolActive(StackScrollTool.toolName, {
          bindings: [{ mouseButton: csToolsEnums.MouseBindings.Wheel }],
        });
        toolGroup.setToolActive(PanTool.toolName, {
          bindings: [{ mouseButton: csToolsEnums.MouseBindings.Auxiliary }],
        });
        toolGroup.setToolActive(ZoomTool.toolName, {
          bindings: [{ mouseButton: csToolsEnums.MouseBindings.Secondary }],
        });

        // 5) Stack 설정 후 렌더링
        const viewport = renderingEngine.getViewport(viewportId);
        await viewport.setStack(imageIds);
        viewport.render();
      } catch (e) {
        console.error('Viewer setup error:', e);
        setError('Error loading viewer');
      } finally {
        setIsLoading(false);
      }
    }

    setupViewer();
    return () => {
      const re = getRenderingEngine(renderingEngineId);
      if (re) re.destroy();
      ToolGroupManager.destroyToolGroup(toolGroupId);
    };
  }, [imageIds, seriesInstanceUID]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: 'black' }}>
      <div ref={elementRef} style={{ width: '100%', height: '100%' }} />
      {isLoading && (
        <div style={loadingStyle}>이미지 로딩 중...</div>
      )}
      {error && (
        <div style={loadingStyle}>{error}</div>
      )}
    </div>
  );
}

const loadingStyle = {
  position: 'absolute',
  top: 0, left: 0,
  width: '100%', height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: 'white',
};