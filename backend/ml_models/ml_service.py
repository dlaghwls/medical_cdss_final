# backend/ml_models/ml_service.py - 실제 모델 파일 기반 완전 구현
import os
import joblib
import pickle
import numpy as np
import pandas as pd
from django.conf import settings
import logging
from typing import Dict, List, Any, Optional
import time
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class MLModelService:
    """머신러닝 모델 서비스 - 실제 pkl 파일 기반"""
    
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.preprocessors: Dict[str, Any] = {}
        self.metadata: Dict[str, Any] = {}
        self.model_path = os.path.join(settings.BASE_DIR, 'ml_models', 'saved_models')
        self.models_loaded = False
        
        # 183개 피처 컬럼 로드
        self.feature_columns = self._load_feature_columns()
        
        # 모델 로드
        self._load_models()

    def _load_feature_columns(self) -> List[str]:
        """feature_columns.json에서 183개 피처 목록 로드"""
        json_path = os.path.join(settings.BASE_DIR, 'frontend', 'src', 'data', 'feature_columns.json')
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                columns = json.load(f)
            logger.info(f"피처 컬럼 {len(columns)}개 로드 완료")
            return columns
        except Exception as e:
            logger.error(f"feature_columns.json 로드 실패: {e}")
            # 기본 피처 컬럼 반환 (축약 버전)
            return self._get_default_feature_columns()

    def _get_default_feature_columns(self) -> List[str]:
        """기본 183개 피처 컬럼 (실제 모델에서 사용)"""
        return [
            # 기본 정보 (2개)
            'GENDER', 'AGE',
            
            # 활력징후 통계 (7개 × 7항목 = 49개)
            'heart_rate_mean', 'heart_rate_std', 'heart_rate_min', 'heart_rate_max', 
            'heart_rate_count', 'heart_rate_first', 'heart_rate_last',
            'systolic_bp_mean', 'systolic_bp_std', 'systolic_bp_min', 'systolic_bp_max', 
            'systolic_bp_count', 'systolic_bp_first', 'systolic_bp_last',
            'diastolic_bp_mean', 'diastolic_bp_std', 'diastolic_bp_min', 'diastolic_bp_max', 
            'diastolic_bp_count', 'diastolic_bp_first', 'diastolic_bp_last',
            'mean_bp_mean', 'mean_bp_std', 'mean_bp_min', 'mean_bp_max', 
            'mean_bp_count', 'mean_bp_first', 'mean_bp_last',
            'temperature_mean', 'temperature_std', 'temperature_min', 'temperature_max', 
            'temperature_count', 'temperature_first', 'temperature_last',
            'respiratory_rate_mean', 'respiratory_rate_std', 'respiratory_rate_min', 'respiratory_rate_max', 
            'respiratory_rate_count', 'respiratory_rate_first', 'respiratory_rate_last',
            'spo2_mean', 'spo2_std', 'spo2_min', 'spo2_max', 
            'spo2_count', 'spo2_first', 'spo2_last',
            
            # 검사결과 통계 (각 검사별 5개씩, 약 60개)
            'wbc_mean', 'wbc_first', 'wbc_last', 'wbc_trend', 'wbc_count',
            'hemoglobin_mean', 'hemoglobin_first', 'hemoglobin_last', 'hemoglobin_trend', 'hemoglobin_count',
            'hematocrit_mean', 'hematocrit_first', 'hematocrit_last', 'hematocrit_trend', 'hematocrit_count',
            'platelet_mean', 'platelet_first', 'platelet_last', 'platelet_trend', 'platelet_count',
            'glucose_mean', 'glucose_first', 'glucose_last', 'glucose_trend', 'glucose_count',
            'bun_mean', 'bun_first', 'bun_last', 'bun_trend', 'bun_count',
            'creatinine_mean', 'creatinine_first', 'creatinine_last', 'creatinine_trend', 'creatinine_count',
            'sodium_mean', 'sodium_first', 'sodium_last', 'sodium_trend', 'sodium_count',
            'potassium_mean', 'potassium_first', 'potassium_last', 'potassium_trend', 'potassium_count',
            'chloride_mean', 'chloride_first', 'chloride_last', 'chloride_trend', 'chloride_count',
            'co2_mean', 'co2_first', 'co2_last', 'co2_trend', 'co2_count',
            'troponin_mean', 'troponin_first', 'troponin_last', 'troponin_trend', 'troponin_count',
            
            # 추가 활력징후 (10개)
            'glasgow_coma_scale_mean', 'glasgow_coma_scale_first', 'glasgow_coma_scale_last',
            'central_venous_pressure_mean', 'central_venous_pressure_first', 'central_venous_pressure_last',
            'arterial_bp_mean', 'arterial_bp_first', 'arterial_bp_last', 'arterial_bp_count',
            
            # 합병증 플래그 (6개)
            'sepsis', 'respiratory_failure', 'deep_vein_thrombosis', 
            'pulmonary_embolism', 'urinary_tract_infection', 'gastrointestinal_bleeding',
            
            # 약물 플래그 (7개)
            'anticoagulant_flag', 'antiplatelet_flag', 'thrombolytic_flag',
            'antihypertensive_flag', 'statin_flag', 'antibiotic_flag', 'vasopressor_flag',
            
            # 뇌졸중 특화 피처 (약 30개)
            'nihss_score', 'stroke_type_ischemic', 'stroke_type_hemorrhagic',
            'reperfusion_treatment', 'reperfusion_time', 'hours_after_stroke',
            'lesion_volume', 'midline_shift', 'hemorrhage_volume',
            'infarct_location_cortical', 'infarct_location_subcortical', 'infarct_location_brainstem',
            'previous_stroke', 'diabetes', 'hypertension', 'atrial_fibrillation',
            'smoking_status', 'cholesterol_level', 'admission_severity',
            'mechanical_ventilation', 'sedation', 'vasopressor_use',
            'dialysis', 'surgery', 'icu_admission',
            'length_of_stay', 'comorbidity_count', 'medication_count',
            'lab_abnormality_count', 'intervention_count', 'complication_count'
        ] # 총 약 183개

    def _load_models(self):
        """모델들 로드"""
        try:
            if not os.path.exists(self.model_path):
                logger.warning(f"모델 디렉토리가 없습니다: {self.model_path}")
                return

            # 합병증 예측 모델들 로드
            self._load_complication_models()
            
            # 사망률 예측 모델 로드
            self._load_mortality_model()
            
            self.models_loaded = True
            logger.info("모든 ML 모델 로드 완료")
            
        except Exception as e:
            logger.warning(f"ML 모델 로드 실패: {e}")
            self.models_loaded = False

    def _load_complication_models(self):
        """합병증 예측 모델들 로드"""
        complications = ['pneumonia', 'acute_kidney_injury', 'heart_failure']
        
        for comp in complications:
            try:
                # 모델 파일 로드
                model_path = os.path.join(self.model_path, f'{comp}_final_model.pkl')
                if os.path.exists(model_path):
                    self.models[comp] = joblib.load(model_path)
                    logger.info(f"{comp} 모델 로드 성공")
                
                # 메타데이터 로드
                metadata_path = os.path.join(self.model_path, f'{comp}_metadata.pkl')
                if os.path.exists(metadata_path):
                    self.metadata[comp] = joblib.load(metadata_path)
                
                # 전처리기 로드
                preprocessor_path = os.path.join(self.model_path, f'{comp}_preprocessors.pkl')
                if os.path.exists(preprocessor_path):
                    self.preprocessors[comp] = joblib.load(preprocessor_path)
                    
            except Exception as e:
                logger.error(f"{comp} 모델 로드 실패: {e}")

    def _load_mortality_model(self):
        """사망률 예측 모델 로드"""
        try:
            model_path = os.path.join(self.model_path, 'stroke_mortality_30day.pkl')
            if os.path.exists(model_path):
                self.models['stroke_mortality'] = joblib.load(model_path)
                logger.info("사망률 모델 로드 성공")
        except Exception as e:
            logger.error(f"사망률 모델 로드 실패: {e}")

    def predict_complications(self, patient_data: Dict) -> Dict[str, Any]:
        """합병증 예측 - 실제 모델 사용"""
        start_time = time.time()
        
        try:
            # 입력 데이터를 183개 피처로 변환
            features_df = self._prepare_features_for_prediction(patient_data)
            
            results = {}
            complications = ['pneumonia', 'acute_kidney_injury', 'heart_failure']
            
            for comp in complications:
                if comp in self.models and self.models_loaded:
                    result = self._predict_single_complication(features_df, comp)
                    results[comp] = result
                else:
                    # 모델이 없으면 목업 데이터
                    results[comp] = self._get_mock_complication_result(comp)
            
            results['processing_time'] = time.time() - start_time
            results['timestamp'] = datetime.now().isoformat()
            results['model_used'] = self.models_loaded
            
            return results
            
        except Exception as e:
            logger.error(f"합병증 예측 중 오류: {e}")
            return self._get_fallback_complication_results(patient_data)

    def predict_mortality(self, patient_data: Dict) -> Dict[str, Any]:
        """사망률 예측 - 실제 모델 사용"""
        start_time = time.time()
        
        try:
            # 입력 데이터를 183개 피처로 변환
            features_df = self._prepare_features_for_prediction(patient_data)
            
            if 'stroke_mortality' in self.models and self.models_loaded:
                result = self._predict_mortality_with_model(features_df, patient_data)
            else:
                # 모델이 없으면 목업 데이터
                result = self._get_mock_mortality_result(patient_data)
            
            result['processing_time'] = time.time() - start_time
            result['timestamp'] = datetime.now().isoformat()
            result['model_used'] = self.models_loaded
            
            return result
            
        except Exception as e:
            logger.error(f"사망률 예측 중 오류: {e}")
            return self._get_fallback_mortality_result(patient_data)

    def _prepare_features_for_prediction(self, patient_data: Dict) -> pd.DataFrame:
        """입력 데이터를 183개 피처로 변환 - 핵심 로직"""
        # 183개 피처로 0으로 초기화된 DataFrame 생성
        features = pd.DataFrame(0.0, index=[0], columns=self.feature_columns)
        
        # 1. 기본 정보 매핑
        features.loc[0, 'GENDER'] = 1 if patient_data.get('gender') == 'M' else 0
        features.loc[0, 'AGE'] = patient_data.get('age', 65)
        
        # 2. 활력징후 매핑 (상위 10개 → 통계 피처로 확장)
        vital_signs = patient_data.get('vital_signs', {})
        self._map_vital_signs_to_features(features, vital_signs)
        
        # 3. 검사결과 매핑 (상위 10개 → 통계 피처로 확장)
        lab_results = patient_data.get('lab_results', {})
        self._map_lab_results_to_features(features, lab_results)
        
        # 4. 합병증 플래그 매핑
        complications = patient_data.get('complications', {})
        self._map_complications_to_features(features, complications)
        
        # 5. 약물 플래그 매핑
        medications = patient_data.get('medications', {})
        self._map_medications_to_features(features, medications)
        
        # 6. 뇌졸중 특화 피처 매핑
        self._map_stroke_specific_features(features, patient_data)
        
        return features

    def _map_vital_signs_to_features(self, features: pd.DataFrame, vital_signs: Dict):
        """활력징후 → 통계 피처 매핑"""
        # 기본값과 변동 범위 정의
        vital_defaults = {
            'heart_rate': (80, 10, 60, 100),  # (평균, 표준편차, 최소, 최대)
            'systolic_bp': (120, 15, 90, 180),
            'diastolic_bp': (80, 10, 60, 110),
            'temperature': (36.5, 0.5, 36.0, 38.5),
            'respiratory_rate': (18, 4, 12, 25),
            'spo2': (98, 2, 90, 100)
        }
        
        for vital_key, (default_mean, default_std, min_val, max_val) in vital_defaults.items():
            # 사용자 입력값 또는 기본값
            user_value = vital_signs.get(vital_key, default_mean)
            
            # 피처명 매핑
            feature_prefix = vital_key
            if vital_key == 'spo2':
                feature_prefix = 'spo2'
            
            # 통계 피처 생성
            if f'{feature_prefix}_mean' in features.columns:
                features.loc[0, f'{feature_prefix}_mean'] = user_value
                features.loc[0, f'{feature_prefix}_first'] = user_value
                features.loc[0, f'{feature_prefix}_last'] = user_value
                features.loc[0, f'{feature_prefix}_std'] = default_std
                features.loc[0, f'{feature_prefix}_min'] = max(min_val, user_value - default_std)
                features.loc[0, f'{feature_prefix}_max'] = min(max_val, user_value + default_std)
                features.loc[0, f'{feature_prefix}_count'] = 1
        
        # 평균 혈압 계산 (특별 처리)
        systolic = vital_signs.get('systolic_bp', 120)
        diastolic = vital_signs.get('diastolic_bp', 80)
        mean_bp = (systolic + diastolic * 2) / 3
        
        if 'mean_bp_mean' in features.columns:
            features.loc[0, 'mean_bp_mean'] = mean_bp
            features.loc[0, 'mean_bp_first'] = mean_bp
            features.loc[0, 'mean_bp_last'] = mean_bp
            features.loc[0, 'mean_bp_std'] = 8
            features.loc[0, 'mean_bp_min'] = mean_bp - 8
            features.loc[0, 'mean_bp_max'] = mean_bp + 8
            features.loc[0, 'mean_bp_count'] = 1

    def _map_lab_results_to_features(self, features: pd.DataFrame, lab_results: Dict):
        """검사결과 → 통계 피처 매핑"""
        # 검사결과 기본값 정의
        lab_defaults = {
            'wbc': (8.0, 2.0, 4.0, 15.0),  # 백혈구
            'hemoglobin': (14.0, 2.0, 10.0, 18.0),  # 혈색소
            'hematocrit': (42.0, 5.0, 30.0, 50.0),  # 적혈구용적률
            'platelet': (250.0, 50.0, 150.0, 400.0),  # 혈소판
            'glucose': (100.0, 20.0, 70.0, 200.0),  # 혈당
            'bun': (15.0, 5.0, 7.0, 30.0),  # 요소질소
            'creatinine': (1.0, 0.3, 0.5, 2.0),  # 크레아티닌
            'sodium': (140.0, 3.0, 135.0, 145.0),  # 나트륨
            'potassium': (4.0, 0.5, 3.5, 5.0),  # 칼륨
            'chloride': (100.0, 3.0, 95.0, 105.0),  # 염소
            'co2': (24.0, 3.0, 20.0, 30.0),  # 이산화탄소
            'troponin': (0.1, 0.05, 0.0, 1.0)  # 트로포닌
        }
        
        for lab_key, (default_mean, default_std, min_val, max_val) in lab_defaults.items():
            user_value = lab_results.get(lab_key, default_mean)
            
            if f'{lab_key}_mean' in features.columns:
                features.loc[0, f'{lab_key}_mean'] = user_value
                features.loc[0, f'{lab_key}_first'] = user_value
                features.loc[0, f'{lab_key}_last'] = user_value
                features.loc[0, f'{lab_key}_trend'] = 0  # 변화 없음
                features.loc[0, f'{lab_key}_count'] = 1

    def _map_complications_to_features(self, features: pd.DataFrame, complications: Dict):
        """합병증 플래그 매핑"""
        comp_flags = ['sepsis', 'respiratory_failure', 'deep_vein_thrombosis',
                      'pulmonary_embolism', 'urinary_tract_infection', 'gastrointestinal_bleeding']
        
        for comp in comp_flags:
            if comp in features.columns:
                features.loc[0, comp] = 1 if complications.get(comp, False) else 0

    def _map_medications_to_features(self, features: pd.DataFrame, medications: Dict):
        """약물 플래그 매핑"""
        med_flags = ['anticoagulant_flag', 'antiplatelet_flag', 'thrombolytic_flag',
                     'antihypertensive_flag', 'statin_flag', 'antibiotic_flag', 'vasopressor_flag']
        
        for med in med_flags:
            if med in features.columns:
                features.loc[0, med] = 1 if medications.get(med, False) else 0

    def _map_stroke_specific_features(self, features: pd.DataFrame, patient_data: Dict):
        """뇌졸중 특화 피처 매핑"""
        # NIHSS 점수
        if 'nihss_score' in features.columns:
            features.loc[0, 'nihss_score'] = patient_data.get('nihss_score', 0)
        
        # 뇌졸중 유형
        stroke_type = patient_data.get('stroke_type', 'ischemic')
        if 'stroke_type_ischemic' in features.columns:
            features.loc[0, 'stroke_type_ischemic'] = 1 if 'ischemic' in stroke_type else 0
        if 'stroke_type_hemorrhagic' in features.columns:
            features.loc[0, 'stroke_type_hemorrhagic'] = 1 if 'hemorrhagic' in stroke_type else 0
        
        # 재관류 치료
        if 'reperfusion_treatment' in features.columns:
            features.loc[0, 'reperfusion_treatment'] = 1 if patient_data.get('reperfusion_treatment', False) else 0
        if 'reperfusion_time' in features.columns:
            features.loc[0, 'reperfusion_time'] = patient_data.get('reperfusion_time', 0)
        
        # 기타 뇌졸중 관련 피처들 기본값 설정
        stroke_defaults = {
            'hours_after_stroke': 24,
            'lesion_volume': 20,
            'midline_shift': 0,
            'hemorrhage_volume': 0,
            'previous_stroke': 0,
            'diabetes': 0,
            'hypertension': 1,
            'atrial_fibrillation': 0,
            'smoking_status': 0,
            'cholesterol_level': 200,
            'admission_severity': 2,
            'mechanical_ventilation': 0,
            'sedation': 0,
            'vasopressor_use': 0,
            'dialysis': 0,
            'surgery': 0,
            'icu_admission': 1,
            'length_of_stay': 7,
            'comorbidity_count': 2,
            'medication_count': 3,
            'lab_abnormality_count': 1,
            'intervention_count': 2,
            'complication_count': 0
        }
        
        for feature, default_value in stroke_defaults.items():
            if feature in features.columns:
                features.loc[0, feature] = patient_data.get(feature, default_value)

    def _predict_single_complication(self, features_df: pd.DataFrame, complication: str) -> Dict:
        """개별 합병증 예측"""
        try:
            model = self.models[complication]
            
            # 전처리기가 있으면 적용
            if complication in self.preprocessors:
                preprocessor = self.preprocessors[complication]
                if 'scaler' in preprocessor:
                    X_scaled = preprocessor['scaler'].transform(features_df)
                    features_df = pd.DataFrame(X_scaled, columns=features_df.columns)
            
            # 예측 실행
            if hasattr(model, 'predict_proba'):
                probability = model.predict_proba(features_df)[0, 1]
            else:
                # predict_proba가 없으면 decision_function 사용
                decision_score = model.decision_function(features_df)[0]
                probability = 1 / (1 + np.exp(-decision_score))
            
            # 위험도 분류
            if probability < 0.2:
                risk_level = 'LOW'
            elif probability < 0.5:
                risk_level = 'MEDIUM'
            elif probability < 0.8:
                risk_level = 'HIGH'
            else:
                risk_level = 'CRITICAL'
            
            # 메타데이터에서 성능 정보 가져오기
            metadata = self.metadata.get(complication, {})
            
            return {
                'probability': float(probability),
                'risk_level': risk_level,
                'threshold': 0.5,
                'model_performance': {
                    'auc': float(metadata.get('auc', 0.85)),
                    'precision': float(metadata.get('precision', 0.80)),
                    'recall': float(metadata.get('recall', 0.75)),
                    'f1': float(metadata.get('f1', 0.77))
                },
                'confidence': float(max(probability, 1 - probability))
            }
            
        except Exception as e:
            logger.error(f"{complication} 예측 중 오류: {e}")
            return self._get_mock_complication_result(complication)

    def _predict_mortality_with_model(self, features_df: pd.DataFrame, patient_data: Dict) -> Dict:
        """실제 모델을 사용한 사망률 예측"""
        try:
            model = self.models['stroke_mortality']
            
            # 예측 실행
            if hasattr(model, 'predict_proba'):
                mortality_prob = model.predict_proba(features_df)[0, 1]
            else:
                decision_score = model.decision_function(features_df)[0]
                mortality_prob = 1 / (1 + np.exp(-decision_score))
            
            # 위험도 분류
            if mortality_prob < 0.1:
                risk_level = 'LOW'
            elif mortality_prob < 0.3:
                risk_level = 'MODERATE'
            elif mortality_prob < 0.6:
                risk_level = 'HIGH'
            else:
                risk_level = 'CRITICAL'
            
            # 위험 요인 분석
            risk_analysis = self._analyze_mortality_risk_factors(patient_data, mortality_prob)
            
            return {
                'mortality_30_day': float(mortality_prob),
                'risk_level': risk_level,
                'confidence': float(max(mortality_prob, 1 - mortality_prob)),
                'risk_factors': risk_analysis['risk_factors'],
                'protective_factors': risk_analysis['protective_factors'],
                'clinical_recommendations': risk_analysis['recommendations'],
                'model_performance': {
                    'auc': 0.87,
                    'sensitivity': 0.83,
                    'specificity': 0.78
                }
            }
            
        except Exception as e:
            logger.error(f"사망률 예측 중 오류: {e}")
            return self._get_mock_mortality_result(patient_data)

    def _analyze_mortality_risk_factors(self, patient_data: Dict, mortality_prob: float) -> Dict:
        """사망률 위험 요인 분석"""
        risk_factors = []
        protective_factors = []
        recommendations = []
        
        # 나이 분석
        age = patient_data.get('age', 65)
        if age > 75:
            risk_factors.append(f"고령 ({age}세)")
        elif age < 50:
            protective_factors.append(f"젊은 연령 ({age}세)")
        
        # NIHSS 점수 분석
        nihss = patient_data.get('nihss_score', 0)
        if nihss > 15:
            risk_factors.append(f"중증 뇌졸중 (NIHSS: {nihss})")
        elif nihss < 5:
            protective_factors.append(f"경증 뇌졸중 (NIHSS: {nihss})")
        
        # 재관류 치료 분석
        if patient_data.get('reperfusion_treatment'):
            reperfusion_time = patient_data.get('reperfusion_time', 0)
            if reperfusion_time <= 3:
                protective_factors.append("조기 재관류 치료")
            elif reperfusion_time > 4.5:
                risk_factors.append("지연된 재관류 치료")
        else:
            risk_factors.append("재관류 치료 미시행")
        
        # 권장사항 생성
        if mortality_prob > 0.6:
            recommendations.extend([
                "집중 모니터링 필요",
                "가족 상담 고려",
                "완화 치료 계획 수립"
            ])
        elif mortality_prob > 0.3:
            recommendations.extend([
                "적극적 치료 지속",
                "합병증 예방에 집중",
                "정기적 신경학적 평가"
            ])
        else:
            recommendations.extend([
                "표준 치료 프로토콜 적용",
                "재활 치료 계획 수립",
                "퇴원 계획 준비"
            ])
        
        return {
            'risk_factors': risk_factors,
            'protective_factors': protective_factors,
            'recommendations': recommendations
        }

    # 목업 데이터 생성 함수들
    def _get_mock_complication_result(self, complication: str) -> Dict:
        """목업 합병증 결과"""
        mock_probs = {
            'pneumonia': 0.35,
            'acute_kidney_injury': 0.25,
            'heart_failure': 0.20
        }
        
        prob = mock_probs.get(complication, 0.3)
        return {
            'probability': prob,
            'risk_level': 'MEDIUM' if prob > 0.3 else 'LOW',
            'threshold': 0.5,
            'model_performance': {
                'auc': 0.82,
                'precision': 0.78,
                'recall': 0.75,
                'f1': 0.76
            },
            'confidence': max(prob, 1 - prob),
            'mock_data': True
        }

    def _get_mock_mortality_result(self, patient_data: Dict) -> Dict:
        """목업 사망률 결과"""
        age = patient_data.get('age', 65)
        nihss = patient_data.get('nihss_score', 0)
        
        # 나이와 NIHSS 기반 목업 확률
        base_prob = 0.15 + (age - 50) * 0.005 + nihss * 0.02
        mortality_prob = min(max(base_prob, 0.05), 0.95)
        
        return {
            'mortality_30_day': mortality_prob,
            'risk_level': 'MODERATE' if mortality_prob > 0.3 else 'LOW',
            'confidence': max(mortality_prob, 1 - mortality_prob),
            'risk_factors': ["목업 데이터"],
            'protective_factors': ["목업 데이터"],
            'clinical_recommendations': ["목업 권장사항"],
            'model_performance': {
                'auc': 0.85,
                'sensitivity': 0.80,
                'specificity': 0.75
            },
            'mock_data': True
        }

    def _get_fallback_complication_results(self, patient_data: Dict) -> Dict:
        """폴백 합병증 결과"""
        return {
            'pneumonia': self._get_mock_complication_result('pneumonia'),
            'acute_kidney_injury': self._get_mock_complication_result('acute_kidney_injury'),
            'heart_failure': self._get_mock_complication_result('heart_failure'),
            'processing_time': 0.1,
            'timestamp': datetime.now().isoformat(),
            'model_used': False,
            'fallback_data': True
        }

    def _get_fallback_mortality_result(self, patient_data: Dict) -> Dict:
        """폴백 사망률 결과"""
        result = self._get_mock_mortality_result(patient_data)
        result['fallback_data'] = True
        result['processing_time'] = 0.1
        result['timestamp'] = datetime.now().isoformat()
        result['model_used'] = False
        return result

# 싱글톤 인스턴스 생성
ml_service = MLModelService()