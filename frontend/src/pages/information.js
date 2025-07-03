import React from 'react';
import { Link } from 'react-router-dom';
import styles from './styles/information.module.css';

import arc from './styles/medical_web_system_architecture.png';

import memberTaebin from './styles/team/TB.jpg';
import memberJeongwoo from './styles/team/JW.jpg';
import memberChanyoung from './styles/team/CY.jpg';
import memberHojin from './styles/team/HJ.jpg';
import memberGyosang from './styles/team/KS.jpg';

const InformationPage = () => {
  // 스크롤 함수 (NavLink 대신 수동 스크롤을 위해)
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      // block: 'center'를 사용하여 섹션이 뷰포트 중앙에 오도록 조정
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className={styles['info-informationPageContainer']}>
      {/* 섹션 1: 프로젝트 개요 (Hero Section) */}
      <section className={`${styles['info-section']} ${styles['info-heroSection']}`}>
        <div className={styles['info-heroBackground']}></div>
        <div className={styles['info-sectionContentWrapper']}>
          <h1 className={styles['info-projectTitle']}>StrokeCare+</h1>
          <p className={styles['info-tagline']}>뇌졸중 환자의 진단 및 간호 의사결정을 지원하는 임상 의사결정 지원 시스템 (CDSS)</p>
          <p className={styles['info-introText']}>
            의료진의 효율적인 업무 환경을 제공하고, AI 기반 분석을 통해 환자 개개인에 최적화된 치료 계획 수립을 지원하여 궁극적으로 환자 예후 개선에 기여합니다.
          </p>
          <Link to="/login" className={styles['info-backToLoginLink']}>
            로그인 페이지로 돌아가기
          </Link>

          {/* 섹션 탐색 네비게이션 */}
          <div className={styles['info-sectionNavigation']}>
            <button onClick={() => scrollToSection('features')} className={styles['info-navLinkButton']}>
              주요 기능 및 강점
            </button>
            <button onClick={() => scrollToSection('architecture')} className={styles['info-navLinkButton']}>
              시스템 아키텍처
            </button>
            <button onClick={() => scrollToSection('team')} className={styles['info-navLinkButton']}>
              팀원 소개
            </button>
          </div>
        </div>
      </section>

      {/* 섹션 2: 주요 기능 및 기술적 강점 */}
      <section id="features" className={`${styles['info-section']} ${styles['info-featuresSection']}`}>
        <div className={styles['info-sectionContentWrapper']}>
          <h2 className={styles['info-sectionHeader']}>주요 기능 및 기술적 강점</h2>
          <div className={styles['info-featureGrid']}>
            <div className={styles['info-featureItem']}>
              <h3>견고한 인증</h3>
              <p>JWT 기반 사용자 인증</p>
              <p>로그인된 의료진 간 WebSocket을 활용한 실시간 메시징 기능 구현</p>
            </div>
            <div className={styles['info-featureItem']}>
              <h3>비동기 처리 & 연동</h3>
              <p>Celery + Redis 기반 AI 추론 요청/응답 비동기 처리</p>
              <p>Django와 FastAPI 모델 서버 간 효율적인 데이터 전송 및 결과 수신</p>
            </div>
            <div className={styles['info-featureItem']}>
              <h3>의료 영상 & 어노테이션</h3>
              <p>Orthanc 연동을 통한 DICOM 영상 저장, 관리 및 웹뷰어 제공</p>
              <p>웹 뷰어 내 Bounding Box 어노테이션 기능 구현 및 메타데이터 DB 저장</p>
            </div>
            <div className={styles['info-featureItem']}>
              <h3>AI 기반 예측 모델</h3>
              <p>30일 사망률 예측 (XGBoost, LightGBm 앙상블)</p>
              <p>폐렴, 급성신장손상, 심부전 등 주요 합병증 예측</p>
              <p>허혈성 병변 이미지 Segmentation</p>
              <p>유전자 데이터로 뇌졸중 확률 예측 (AE + Transformer)</p>
            </div>
            <div className={styles['info-featureItem']}>
              <h3>데이터 통합 & 보안</h3>
              <p>OpenMRS 환자 DB와 내부 PostgreSQL DB 간 동기화 파이프라인 구축</p>
              <p>프로젝트 환경 변수 통합 관리 (.env)</p>
            </div>
            <div className={styles['info-featureItem']}>
              <h3>배포 및 운영</h3>
              <p>모든 서비스를 Docker 컨테이너화 및 docker-compose 오케스트레이션</p>
              <p>GCP 기반 신규 서버 환경 재구축 및 배포 파이프라인</p>
            </div>
          </div>
        </div>
      </section>

      {/* 섹션 3: 시스템 아키텍처 */}
      <section id="architecture" className={`${styles['info-section']} ${styles['info-architectureSection']}`}>
        <div className={styles['info-sectionContentWrapper']}>
          <h2 className={styles['info-sectionHeader']}>시스템 아키텍처</h2>
          <p className={styles['info-architectureDescription']}>
            StrokeCare+는 모듈화된 마이크로서비스 아키텍처를 기반으로 구축되어 유연성과 확장성을 제공합니다.<br />
            프론트엔드와 백엔드는 RESTful API로 통신하며, AI 모델은 별도의 고성능 FastAPI 서버에서 추론됩니다.<br />
            데이터는 PostgreSQL을 중심으로 관리되며, 외부 의료 시스템(OpenMRS, Orthanc)과도 유기적으로 연동됩니다.<br />
            전체 시스템은 Docker를 통해 컨테이너화되어 GCP에 효율적으로 배포됩니다.
          </p>
          <div className={styles['info-architecturePlaceholder']}>
            {<img src={arc} alt="시스템 아키텍처 흐름도" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />}
          </div>
        </div>
      </section>

      {/* 섹션 4: 팀원 소개 섹션 */}
      <section id="team" className={`${styles['info-section']} ${styles['info-teamMembersSection']}`}>
        <div className={styles['info-sectionContentWrapper']}>
          <h2 className={styles['info-sectionHeader']}>팀원 소개</h2>
          <div className={styles['info-teamGrid']}>
            <div className={styles['info-teamMemberCard']}>
              <div className={styles['info-memberPhotoPlaceholder']}>
                {<img src={memberTaebin} alt="김태빈" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />}
              </div>
              <h3 className={styles['info-memberName']}>김태빈 </h3>
              <p className={styles['info-memberRole']}>UI/UX & 시스템 아키텍트</p>
              <p className={styles['info-memberDescription']}>
                FastAPI 기반 백엔드 시스템 설계 및 구현.<br />
                React 기반 웹 사용자 인터페이스(UI) 컴포넌트 설계 및 개발.<br />
                유전자 기반 뇌졸중 예측 모델 (AE + Transformer) 개발 및 연동.
              </p>
            </div>
            <div className={styles['info-teamMemberCard']}>
              <div className={styles['info-memberPhotoPlaceholder']}>

                {<img src={memberJeongwoo} alt="유정우" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />}
              </div>
              <h3 className={styles['info-memberName']}>유정우</h3>
              <p className={styles['info-memberRole']}>의료 영상 & 데이터 파이프라인</p>
              <p className={styles['info-memberDescription']}>
                허혈 segmentation (nnU-Net) 모델 개발 및 연동.<br />
                의료 영상 DICOM (Orthanc) 서버 연동.<br />
                의료 이미지 데이터 처리 파이프라인 개발.
              </p>
            </div>
            <div className={styles['info-teamMemberCard']}>
              <div className={styles['info-memberPhotoPlaceholder']}>
                {<img src={memberChanyoung} alt="이찬영" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />}
              </div>
              <h3 className={styles['info-memberName']}>이찬영</h3>
              <p className={styles['info-memberRole']}>DevOps & 비동기 시스템</p>
              <p className={styles['info-memberDescription']}>
                Redis+Celery+Flower 도입 및 비동기 작업 처리 및 성능 최적화.<br />
                Prometheus, Grafana 도입 및 연동.<br />
                PostgreSQL DB 연동. GCP 서버 구축 및 원격 개발 환경 설정.
              </p>
            </div>
            <div className={styles['info-teamMemberCard']}>
              <div className={styles['info-memberPhotoPlaceholder']}>
                {<img src={memberHojin} alt="임호진" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />}
              </div>
              <h3 className={styles['info-memberName']}>임호진</h3>
              <p className={styles['info-memberRole']}>백엔드 & Docker</p>
              <p className={styles['info-memberDescription']}>
                전체 마이크로서비스 Docker 컨테이너화 및 docker-compose.yml 오케스트레이션.<br />
                OpenMRS 환자 DB 동기화 파이프라인 구축.<br />
                SOD2 시계열 데이터 생성 및 전처리 및 산화스트레스 위험도 평가 알고리즘 적용.
              </p>
            </div>
            <div className={styles['info-teamMemberCard']}>
              <div className={styles['info-memberPhotoPlaceholder']}>
                {<img src={memberGyosang} alt="추교상" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />}
              </div>
              <h3 className={styles['info-memberName']}>추교상</h3>
              <p className={styles['info-memberRole']}>의료 시스템 연동 & 시스템 통합</p>
              <p className={styles['info-memberDescription']}>
                30일 사망률 예측 (시계열 앙상블 모델) 개발.<br />
                웹 뷰어 어노테이션 기능 구현.<br />
                JWT 인증 시스템 구현 및 WebSocket 활용한 메세지 기능 구현.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default InformationPage;