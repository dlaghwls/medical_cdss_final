const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 1. Django 백엔드 API 프록시 설정
  // '/api'로 시작하는 모든 요청을 'django-backend' 서비스의 8000번 포트로 전달
  app.use(
    '/api',
    createProxyMiddleware({
      // target은 Docker Compose 또는 쿠버네티스에 정의된 서비스 이름입니다.
      target: 'http://django-backend:8000',
      changeOrigin: true,
    })
  );

  // 2. OpenMRS 백엔드 API 프록시 설정
  // '/ws/rest/v1'으로 시작하는 모든 요청을 'openmrs-backend' 서비스의 8080 포트로 전달
  app.use(
    '/ws/rest/v1',
    createProxyMiddleware({
      target: 'http://openmrs-backend:8080/openmrs',
      changeOrigin: true,
    })
  );
};