// // src/index.js
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// // import './index.css'; // 전역 스타일 또는 CSS Reset
// import App from './App';
// import reportWebVitals from './reportWebVitals';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

// // If you want to start measuring performance in your app, pass a function
// // to log results (for example: reportWebVitals(console.log))
// // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();


// /src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import initCornerstone from './utils/cornerstone-init'; // 경로 확인

// 앱을 렌더링하기 전에 Cornerstone 초기화를 실행하고 기다립니다.
initCornerstone()
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
