import React from 'react';

const GeneModelExplanation = () => {
    // 아이콘 대체 함수 (유니코드 이모지 또는 간단한 텍스트 아이콘)
    const getIcon = (iconName) => {
        switch (iconName) {
            case 'dna': return '🧬';   // DNA
            case 'chartLine': return '📈'; // 그래프 (상승)
            case 'microscope': return '🔬'; // 현미경
            default: return '💡'; // 기본 아이콘
        }
    };

    // 아이콘을 위한 스타일 (FontAwesome 대신)
    const iconStyle = {
        marginRight: '8px',
        fontSize: '1.2em', // 이모지 크기 조절
        verticalAlign: 'middle' // 텍스트와 정렬
    };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' }}>
            <h4 style={{ color: '#0056b3', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                <span style={iconStyle}>{getIcon('microscope')}</span>
                뇌졸중 유전자 분석 모델 안내
            </h4>

            <p style={{ marginBottom: '20px' }}>
                저희 시스템은 환자의 혈액 유전자 발현 데이터를 분석하여 뇌졸중 발생 위험을 예측하고, 
                환자별 맞춤형 정보를 제공하기 위해 개발되었습니다. 
                이 모델은 최신 딥러닝 기술과 방대한 유전체 연구 데이터를 기반으로 합니다.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div style={{ backgroundColor: '#e9f5ff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <h5 style={{ color: '#007bff', marginBottom: '10px' }}>
                        <span style={{...iconStyle, color: '#007bff'}}>{getIcon('dna')}</span>
                        어떤 데이터를 사용하나요?
                    </h5>
                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: '8px' }}>
                            <span style={{...iconStyle, color: '#007bff'}}></span>
                            환자의 말초 혈액에서 추출된 유전자 발현량 정보 (전사체 데이터)를 사용합니다. 
                        </li>
                        <li style={{ marginBottom: '8px' }}>
                            <span style={{...iconStyle, color: '#007bff'}}></span>
                            GSE16561 등 뇌졸중 관련 공개 유전체 데이터셋을 활용하여 모델을 학습시켰습니다. 
                        </li>
                    </ul>
                </div>

                <div style={{ backgroundColor: '#e6ffe6', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <h5 style={{ color: '#28a745', marginBottom: '10px' }}>
                        <span style={{...iconStyle, color: '#28a745'}}>{getIcon('chartLine')}</span>
                        무엇을 예측하나요?
                    </h5>
                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: '8px' }}>
                            <span style={{...iconStyle, color: '#28a745'}}></span>
                            주로 뇌졸중 환자군과 건강 대조군을 분류하는 데 사용됩니다. 
                        </li>
                        <li style={{ marginBottom: '8px' }}>
                            <span style={{...iconStyle, color: '#28a745'}}></span>
                            모델은 특정 유전자들의 발현 패턴을 분석하여 뇌졸중일 확률을 도출합니다.
                        </li>
                    </ul>
                </div>
            </div>

            <h5 style={{ color: '#0056b3', marginBottom: '15px', borderBottom: '1px dashed #eee', paddingBottom: '5px' }}>
                모델은 어떻게 작동하나요?
            </h5>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{ flexShrink: 0, marginRight: '15px', fontSize: '24px', color: '#6c757d' }}>
                    1.
                </div>
                <div>
                    <strong>핵심 유전자 선정:</strong> 수만 개의 유전자 중에서 뇌졸중과 통계적으로 유의미한 
                    발현 변화를 보이는 핵심 유전자들 (DEG: 차등 발현 유전자)을 선별합니다. 
                    특히 염증 반응, 혈관 반응, 면역 활성, 산화 스트레스, 응고 관련 유전자들이 중요하게 다뤄집니다. 
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{ flexShrink: 0, marginRight: '15px', fontSize: '24px', color: '#6c757d' }}>
                    2.
                </div>
                <div>
                    <strong>인공지능 학습:</strong> 선정된 유전자들의 발현 패턴을 딥러닝 모델 (Autoencoder와 Transformer 기반 경량 모델)에 
                    학습시킵니다.  이 모델은 복잡한 유전자 상호작용을 파악하고, 데이터의 핵심 특징을 압축하여 
                    뇌졸중과 관련된 미묘한 패턴을 찾아냅니다. 
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{ flexShrink: 0, marginRight: '15px', fontSize: '24px', color: '#6c757d' }}>
                    3.
                </div>
                <div>
                    <strong>결과 예측 및 해석:</strong> 학습된 모델은 새로운 환자의 유전자 데이터를 받아 뇌졸중 발생 확률을 예측합니다. 
                    특히, 저희 모델은 어떤 유전자들이 예측에 중요하게 기여했는지 (유전자 중요도)를 분석하여 
                    결과의 해석 가능성을 높였습니다.  이를 통해 단순히 예측값을 제공하는 것을 넘어, 환자 개인에게 
                    왜 그러한 예측 결과가 나왔는지에 대한 생물학적 이해를 돕습니다. 
                </div>
            </div>

            <h5 style={{ color: '#0056b3', marginTop: '30px', marginBottom: '15px', borderBottom: '1px dashed #eee', paddingBottom: '5px' }}>
                이 분석이 왜 중요한가요?
            </h5>
            <p style={{ marginBottom: '20px' }}>
                뇌졸중은 조기 진단과 예후 예측이 매우 중요합니다.  이 유전자 분석 모델은 
                기존 임상 검사와 더불어 보조적인 진단 및 예후 예측 정보를 제공함으로써, 
                의료진의 더 나은 의사결정을 돕고 환자 맞춤형 치료 전략 수립에 기여할 수 있습니다. 
            </p>
            <p style={{ fontStyle: 'italic', color: '#555' }}>
                * 본 모델은 연구 단계에 있으며, 임상적 진단을 대체할 수 없습니다. 
                  모든 의학적 결정은 반드시 전문 의료진과 상담 후 이루어져야 합니다.
            </p>
        </div>
    );
};

export default GeneModelExplanation;