// GeneResultDisplay.js
import React from 'react';
import styles from './style/GeneResult.module.css'; // CSS 모듈 임포트

const GeneResultDisplay = ({ result, selectedPatient }) => {
    if (!result) {
        return <p className={styles.noResultText}>분석 결과가 아직 없습니다.</p>;
    }

    // 예측 확률에 따른 시각적 피드백 로직 재설정
    // "높을수록 뇌졸중일 확률이 높은 것으로 부정적" 기준 적용
    const getResultStatus = (probability) => {
        if (probability >= 0.7) { // 70% 이상: 뇌졸중 확률 높음 (부정적)
            return { colorClass: styles.dangerColor, text: '뇌졸중 위험 높음', icon: '🚨' }; // 경고 아이콘
        } else if (probability <= 0.3) { // 30% 이하: 뇌졸중 확률 낮음 (긍정적)
            return { colorClass: styles.successColor, text: '뇌졸중 위험 낮음', icon: '👍' }; // 긍정 아이콘
        } else { // 30% 초과 70% 미만: 중간 (관찰 필요)
            return { colorClass: styles.warningColor, text: '관찰 필요', icon: '⚠️' }; // 주의 아이콘
        }
    };

    const status = getResultStatus(result.prediction_probability);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.mainTitle}>유전자 분석 최종 결과</h3>
                {selectedPatient && (
                    <span className={styles.patientInfo}>
                        대상 환자: <strong>{selectedPatient.display}</strong> ({selectedPatient.uuid.substring(0,8)}...)
                    </span>
                )}
            </div>

            <div className={styles.cardsGrid}>
                {/* 예측 확률 카드 */}
                <div className={`${styles.card} ${styles.probabilityCard}`} style={{ border: `2px solid var(--${status.colorClass.split('--')[1]})` }}>
                    <p className={styles.cardLabel}>예측 확률</p>
                    <h2 className={`${styles.probabilityValue} ${status.colorClass}`}>
                        {status.icon} {(result.prediction_probability * 100).toFixed(1)}%
                    </h2>
                    <p className={`${styles.probabilityStatus} ${status.colorClass}`}>
                        {status.text}
                    </p>
                    <div className={styles.progressBar}>
                        <div 
                            className={`${styles.progressBarFill} ${status.colorClass}`} 
                            style={{ width: `${(result.prediction_probability * 100).toFixed(1)}%` }}
                        ></div>
                    </div>
                </div>

                {/* 모델 정보 카드 */}
                <div className={`${styles.card} ${styles.infoCard}`}>
                    <p className={styles.cardLabel}>정보</p>
                    <p className={styles.infoItem}>
                        <strong>분석 대상:</strong> {selectedPatient ? selectedPatient.display : '환자 정보 없음'}
                    </p>
                    <p className={styles.infoItem}><strong>모델 이름:</strong> {result.model_name || 'N/A'}</p>
                    <p className={styles.infoItem}><strong>모델 버전:</strong> {result.model_version || 'N/A'}</p>
                </div>

                {/* 결과 메시지 카드 */}
                <div className={`${styles.card} ${styles.messageCard}`}>
                    <p className={styles.cardLabel}>종합 의견</p>
                    <p className={styles.messageText}>
                        {result.result_text || '제공된 추가 메시지가 없습니다.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GeneResultDisplay;