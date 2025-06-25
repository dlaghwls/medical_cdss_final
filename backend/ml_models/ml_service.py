# backend/ml_models/ml_service.py - 실제 모델 피처에 맞춤
import os
import joblib
import pickle
import numpy as np
import pandas as pd
from django.conf import settings
import logging
from typing import Dict, List, Any
import time
from datetime import datetime

logger = logging.getLogger(__name__)

class MLModelService:
    """머신러닝 모델 서비스 - 실제 183개 피처 대응"""
    
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.preprocessors: Dict[str, Any] = {}
        self.metadata: Dict[str, Any] = {}
        self.model_path = os.path.join(settings.BASE_DIR, 'ml_models', 'saved_models')
        self.models_loaded = False
        
        # 실제 모델 피처 컬럼 (183개)
        self.model_features = self._get_model_feature_columns()
        
        # 모델 로드 시도
        self._load_models()

    def _get_model_feature_columns(self) -> List[str]:
        """실제 모델에서 사용하는 183개 피처 컬럼"""
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
            
            # 추가 활력징후 (14개)
            'glasgow_coma_scale_mean', 'glasgow_coma_scale_std', 'glasgow_coma_scale_min', 'glasgow_coma_scale_max', 
            'glasgow_coma_scale_count', 'glasgow_coma_scale_first', 'glasgow_coma_scale_last',
            'weight_mean', 'weight_std', 'weight_min', 'weight_max', 
            'weight_count', 'weight_first', 'weight_last',
            
            # 검사결과 통계 (5개 × 19항목 = 95개)
            'wbc_mean', 'wbc_first', 'wbc_last', 'wbc_trend', 'wbc_count',
            'hemoglobin_mean', 'hemoglobin_first', 'hemoglobin_last', 'hemoglobin_trend', 'hemoglobin_count',
            'hematocrit_mean', 'hematocrit_first', 'hematocrit_last', 'hematocrit_trend', 'hematocrit_count',
            'platelet_mean', 'platelet_first', 'platelet_last', 'platelet_trend', 'platelet_count',
            'creatinine_mean', 'creatinine_first', 'creatinine_last', 'creatinine_trend', 'creatinine_count',
            'bun_mean', 'bun_first', 'bun_last', 'bun_trend', 'bun_count',
            'glucose_mean', 'glucose_first', 'glucose_last', 'glucose_trend', 'glucose_count',
            'sodium_mean', 'sodium_first', 'sodium_last', 'sodium_trend', 'sodium_count',
            'potassium_mean', 'potassium_first', 'potassium_last', 'potassium_trend', 'potassium_count',
            'chloride_mean', 'chloride_first', 'chloride_last', 'chloride_trend', 'chloride_count',
            'lactate_mean', 'lactate_first', 'lactate_last', 'lactate_trend', 'lactate_count',
            'ph_mean', 'ph_first', 'ph_last', 'ph_trend', 'ph_count',
            'pco2_mean', 'pco2_first', 'pco2_last', 'pco2_trend', 'pco2_count',
            'po2_mean', 'po2_first', 'po2_last', 'po2_trend', 'po2_count',
            'bicarbonate_mean', 'bicarbonate_first', 'bicarbonate_last', 'bicarbonate_trend', 'bicarbonate_count',
            'anion_gap_mean', 'anion_gap_first', 'anion_gap_last', 'anion_gap_trend', 'anion_gap_count',
            'albumin_mean', 'albumin_first', 'albumin_last', 'albumin_trend', 'albumin_count',
            'bilirubin_total_mean', 'bilirubin_total_first', 'bilirubin_total_last', 'bilirubin_total_trend', 'bilirubin_total_count',
            'alt_mean', 'alt_first', 'alt_last', 'alt_trend', 'alt_count',
            'ast_mean', 'ast_first', 'ast_last', 'ast_trend', 'ast_count',
            'troponin_mean', 'troponin_first', 'troponin_last', 'troponin_trend', 'troponin_count',
            
            # 합병증 플래그 (6개)
            'sepsis', 'respiratory_failure', 'deep_vein_thrombosis', 
            'pulmonary_embolism', 'urinary_tract_infection', 'gastrointestinal_bleeding',
            
            # 약물 플래그 (7개)
            'anticoagulant_flag', 'antiplatelet_flag', 'thrombolytic_flag',
            'antihypertensive_flag', 'statin_flag', 'antibiotic_flag', 'vasopressor_flag'
        ]
    
    def _load_models(self):
        """모델 로드 - 실패해도 Django 시작 차단하지 않음"""
        try:
            logger.info("ML 모델 로드를 시도합니다...")
            
            if not os.path.exists(self.model_path):
                logger.warning(f"모델 디렉토리가 없습니다: {self.model_path}")
                return
            
            # 합병증 예측 모델들
            self._load_complication_models()
            
            # 사망률 예측 모델
            self._load_mortality_model()
            
            self.models_loaded = True
            logger.info("ML 모델 로드 완료")
            
        except Exception as e:
            logger.warning(f"ML 모델 로드 실패 (무시됨): {e}")
            self.models_loaded = False
    
    def _load_complication_models(self):
        """합병증 예측 모델들 로드"""
        complications = ['pneumonia', 'acute_kidney_injury', 'heart_failure']
        
        for comp in complications:
            try:
                model_path = os.path.join(self.model_path, f'{comp}_final_model.pkl')
                if os.path.exists(model_path):
                    with open(model_path, 'rb') as f:
                        self.models[comp] = joblib.load(model_path)
                    logger.info(f"{comp} 모델 로드 성공")
                    
                # 메타데이터 로드
                metadata_path = os.path.join(self.model_path, f'{comp}_metadata.pkl')
                if os.path.exists(metadata_path):
                    with open(metadata_path, 'rb') as f:
                        self.metadata[comp] = joblib.load(metadata_path)
                        
                # 전처리기 로드
                preprocessor_path = os.path.join(self.model_path, f'{comp}_preprocessors.pkl')
                if os.path.exists(preprocessor_path):
                    with open(preprocessor_path, 'rb') as f:
                        self.preprocessors[comp] = joblib.load(preprocessor_path)
                        
            except Exception as e:
                logger.error(f"{comp} 모델 로드 실패: {e}")
    
    def _load_mortality_model(self):
        """사망률 예측 모델 로드"""
        try:
            model_path = os.path.join(self.model_path, 'stroke_mortality_30day.pkl')
            if os.path.exists(model_path):
                with open(model_path, 'rb') as f:
                    self.models['stroke_mortality'] = pickle.load(f)
                logger.info("사망률 모델 로드 성공")
                
        except Exception as e:
            logger.error(f"사망률 모델 로드 실패: {e}")
    
    def predict_complications(self, patient_data: Dict) -> Dict[str, Any]:
        """합병증 예측 - 183개 피처 사용"""
        start_time = time.time()
        
        if not self.models_loaded:
            return self._get_mock_complications_result(patient_data)
        
        try:
            # 183개 피처로 변환
            features_df = self._prepare_full_features(patient_data)
            
            results = {}
            
            # 각 합병증별 예측
            for complication in ['pneumonia', 'acute_kidney_injury', 'heart_failure']:
                if complication in self.models:
                    result = self._predict_single_complication(features_df, complication)
                    results[complication] = result
                else:
                    # 모델이 없으면 목업 데이터 반환
                    results[complication] = self._get_mock_prediction(complication)
            
            results['processing_time'] = time.time() - start_time
            results['timestamp'] = datetime.now().isoformat()
            
            return results
            
        except Exception as e:
            logger.error(f"합병증 예측 중 오류: {e}")
            return self._get_mock_complications_result(patient_data)
    
    def _prepare_full_features(self, patient_data: Dict) -> pd.DataFrame:
        """입력 데이터를 183개 피처로 변환"""
        # 183개 피처로 빈 DataFrame 생성
        features = pd.DataFrame(0.0, index=[0], columns=self.model_features)
        
        # 1. 기본 정보
        features.loc[0, 'GENDER'] = 1 if patient_data.get('gender') == 'M' else 0
        features.loc[0, 'AGE'] = patient_data.get('age', 65)
        
        # 2. 활력징후 매핑 (간단한 값 → 통계 피처들)
        self._map_vital_signs_to_stats(features, patient_data.get('vital_signs', {}))
        
        # 3. 검사결과 매핑 (간단한 값 → 통계 피처들)
        self._map_lab_results_to_stats(features, patient_data.get('lab_results', {}))
        
        # 4. 합병증 플래그
        complications = patient_data.get('complications', {})
        for comp in ['sepsis', 'respiratory_failure', 'deep_vein_thrombosis',
                     'pulmonary_embolism', 'urinary_tract_infection', 'gastrointestinal_bleeding']:
            if comp in features.columns:
                features.loc[0, comp] = 1 if complications.get(comp, False) else 0
        
        # 5. 약물 플래그
        medications = patient_data.get('medications', {})
        for med in ['anticoagulant_flag', 'antiplatelet_flag', 'thrombolytic_flag',
                    'antihypertensive_flag', 'statin_flag', 'antibiotic_flag', 'vasopressor_flag']:
            if med in features.columns:
                features.loc[0, med] = 1 if medications.get(med, False) else 0
        
        return features
    
    def _map_vital_signs_to_stats(self, features: pd.DataFrame, vital_signs: Dict):
        """활력징후 → 통계 피처 매핑"""
        # 사용자가 입력한 단일 값을 mean, first, last로 사용하고 나머지는 기본값
        vital_mappings = [
            ('heart_rate', 'heart_rate', 80, 10, 60, 100),  # (입력키, 피처베이스, 기본값, std, min, max)
            ('systolic_bp', 'systolic_bp', 120, 15, 90, 160),
            ('diastolic_bp', 'diastolic_bp', 80, 10, 60, 100),
            ('temperature', 'temperature', 36.5, 0.5, 36, 38),
            ('respiratory_rate', 'respiratory_rate', 16, 3, 12, 24),
            ('oxygen_saturation', 'spo2', 98, 2, 90, 100)
        ]
        
        for input_key, feature_base, default_val, default_std, default_min, default_max in vital_mappings:
            value = vital_signs.get(input_key, default_val)
            
            # 통계 피처들 설정
            features.loc[0, f'{feature_base}_mean'] = value
            features.loc[0, f'{feature_base}_first'] = value
            features.loc[0, f'{feature_base}_last'] = value
            features.loc[0, f'{feature_base}_std'] = default_std
            features.loc[0, f'{feature_base}_min'] = max(default_min, value - default_std)
            features.loc[0, f'{feature_base}_max'] = min(default_max, value + default_std)
            features.loc[0, f'{feature_base}_count'] = 1
        
        # mean_bp 계산 (수축기+이완기*2)/3
        systolic = vital_signs.get('systolic_bp', 120)
        diastolic = vital_signs.get('diastolic_bp', 80)
        mean_bp = (systolic + diastolic * 2) / 3
        
        features.loc[0, 'mean_bp_mean'] = mean_bp
        features.loc[0, 'mean_bp_first'] = mean_bp
        features.loc[0, 'mean_bp_last'] = mean_bp
        features.loc[0, 'mean_bp_std'] = 8
        features.loc[0, 'mean_bp_min'] = mean_bp - 8
        features.loc[0, 'mean_bp_max'] = mean_bp + 8
        features.loc[0, 'mean_bp_count'] = 1
        
        # 기본값들 (사용자 입력 없는 항목들)
        default_vitals = [
            ('glasgow_coma_scale', 15, 0, 3, 15),  # (베이스, 기본값, std, min, max)
            ('weight', 70, 10, 40, 120)
        ]
        
        for feature_base, default_val, default_std, default_min, default_max in default_vitals:
            features.loc[0, f'{feature_base}_mean'] = default_val
            features.loc[0, f'{feature_base}_first'] = default_val
            features.loc[0, f'{feature_base}_last'] = default_val
            features.loc[0, f'{feature_base}_std'] = default_std
            features.loc[0, f'{feature_base}_min'] = default_min
            features.loc[0, f'{feature_base}_max'] = default_max
            features.loc[0, f'{feature_base}_count'] = 1
    
    def _map_lab_results_to_stats(self, features: pd.DataFrame, lab_results: Dict):
        """검사결과 → 통계 피처 매핑"""
        # 사용자 입력 가능한 검사들
        user_labs = [
            ('wbc', 'wbc', 8.0, 1.0),  # (입력키, 피처베이스, 기본값, std)
            ('hemoglobin', 'hemoglobin', 14.0, 1.5),
            ('creatinine', 'creatinine', 1.0, 0.2),
            ('bun', 'bun', 15.0, 3.0),
            ('glucose', 'glucose', 100.0, 20.0),
            ('sodium', 'sodium', 140.0, 3.0),
            ('potassium', 'potassium', 4.0, 0.3)
        ]
        
        for input_key, feature_base, default_val, default_std in user_labs:
            value = lab_results.get(input_key, default_val)
            
            features.loc[0, f'{feature_base}_mean'] = value
            features.loc[0, f'{feature_base}_first'] = value
            features.loc[0, f'{feature_base}_last'] = value
            features.loc[0, f'{feature_base}_trend'] = 0  # 변화 없음
            features.loc[0, f'{feature_base}_count'] = 1
        
        # 기본값들 (사용자 입력 없는 검사들)
        default_labs = [
            ('hematocrit', 42.0, 3.0),  # (베이스, 기본값, std)
            ('platelet', 300.0, 50.0),
            ('chloride', 102.0, 3.0),
            ('lactate', 1.5, 0.5),
            ('ph', 7.4, 0.05),
            ('pco2', 40.0, 5.0),
            ('po2', 90.0, 10.0),
            ('bicarbonate', 24.0, 2.0),
            ('anion_gap', 10.0, 2.0),
            ('albumin', 4.0, 0.5),
            ('bilirubin_total', 1.0, 0.3),
            ('alt', 30.0, 10.0),
            ('ast', 25.0, 8.0),
            ('troponin', 0.01, 0.005)
        ]
        
        for feature_base, default_val, default_std in default_labs:
            features.loc[0, f'{feature_base}_mean'] = default_val
            features.loc[0, f'{feature_base}_first'] = default_val
            features.loc[0, f'{feature_base}_last'] = default_val
            features.loc[0, f'{feature_base}_trend'] = 0
            features.loc[0, f'{feature_base}_count'] = 1
    
    def _predict_single_complication(self, features_df: pd.DataFrame, complication: str) -> Dict:
        """단일 합병증 예측"""
        try:
            model = self.models[complication]
            
            # 전처리 (있는 경우)
            X = features_df.copy()
            if complication in self.preprocessors:
                preprocessors = self.preprocessors[complication]
                if 'imputer' in preprocessors:
                    X_imputed = preprocessors['imputer'].transform(X)
                    X = pd.DataFrame(X_imputed, columns=X.columns)
                if 'scaler' in preprocessors:
                    X_scaled = preprocessors['scaler'].transform(X)
                    X = pd.DataFrame(X_scaled, columns=X.columns)
            
            # 예측
            if hasattr(model, 'predict_proba'):
                probability = model.predict_proba(X)[0, 1]
            else:
                probability = model.predict(X)[0]
            
            # 메타데이터에서 임계값 가져오기
            metadata = self.metadata.get(complication, {})
            threshold = metadata.get('performance', {}).get('threshold', 0.5)
            
            # 위험도 분류
            if probability < 0.3:
                risk_level = 'LOW'
            elif probability < 0.7:
                risk_level = 'MEDIUM'
            else:
                risk_level = 'HIGH'
            
            return {
                'probability': float(probability),
                'prediction': bool(probability > threshold),
                'risk_level': risk_level,
                'threshold': float(threshold),
                'model_confidence': metadata.get('performance', {}).get('auc', 0.85)
            }
            
        except Exception as e:
            logger.error(f"{complication} 예측 실패: {e}")
            return self._get_mock_prediction(complication)
    
    def _get_mock_prediction(self, complication: str) -> Dict:
        """목업 예측 결과"""
        base_probabilities = {
            'pneumonia': 0.15,
            'acute_kidney_injury': 0.12,
            'heart_failure': 0.08
        }
        
        probability = base_probabilities.get(complication, 0.1)
        
        return {
            'probability': probability,
            'prediction': probability > 0.5,
            'risk_level': 'LOW' if probability < 0.3 else 'MEDIUM',
            'model_confidence': 0.75,
            'note': '목업 데이터 (모델 미로드)'
        }
    
    def _get_mock_complications_result(self, patient_data: Dict) -> Dict:
        """전체 합병증 목업 결과"""
        results = {}
        for comp in ['pneumonia', 'acute_kidney_injury', 'heart_failure']:
            results[comp] = self._get_mock_prediction(comp)
        
        results['processing_time'] = 0.1
        results['timestamp'] = datetime.now().isoformat()
        results['note'] = '목업 데이터 - 모델 미로드'
        
        return results
    
    def predict_stroke_mortality(self, patient_data: Dict) -> Dict[str, Any]:
        """뇌졸중 사망률 예측"""
        start_time = time.time()
        
        if not self.models_loaded:
            return self._get_mock_mortality_prediction(patient_data)
        
        try:
            if 'stroke_mortality' not in self.models:
                return self._get_mock_mortality_prediction(patient_data)
            
            # 183개 피처 준비
            features_df = self._prepare_full_features(patient_data)
            
            # 뇌졸중 특화 피처 추가 (있는 경우만)
            self._add_stroke_features(features_df, patient_data)
            
            # 전처리 (사망률 모델용)
            model = self.models['stroke_mortality']
            if 'stroke_mortality' in self.preprocessors:
                preprocessors = self.preprocessors['stroke_mortality']
                if 'imputer' in preprocessors:
                    X_imputed = preprocessors['imputer'].transform(features_df)
                    features_df = pd.DataFrame(X_imputed, columns=features_df.columns)
                if 'scaler' in preprocessors:
                    X_scaled = preprocessors['scaler'].transform(features_df)
                    features_df = pd.DataFrame(X_scaled, columns=features_df.columns)
            
            # 예측 실행
            if hasattr(model, 'predict_proba'):
                mortality_30_day = model.predict_proba(features_df)[0, 1]
            else:
                mortality_30_day = float(model.predict(features_df)[0])
            
            # 위험도 분류
            risk_level = self._classify_mortality_risk(mortality_30_day)
            
            # 분석 결과
            analysis = self._analyze_stroke_factors(patient_data, mortality_30_day)
            
            result = {
                'mortality_30_day': float(mortality_30_day),
                'risk_level': risk_level,
                'stroke_type': patient_data.get('stroke_type', 'ischemic'),
                'nihss_score': patient_data.get('nihss_score'),
                'reperfusion_treatment': patient_data.get('reperfusion_treatment', False),
                'reperfusion_time': patient_data.get('reperfusion_time'),
                'risk_factors': analysis['risk_factors'],
                'protective_factors': analysis['protective_factors'],
                'clinical_recommendations': analysis['recommendations'],
                'model_confidence': 0.85,
                'processing_time': time.time() - start_time
            }
            
            return result
            
        except Exception as e:
            logger.error(f"사망률 예측 중 오류: {e}")
            return self._get_mock_mortality_prediction(patient_data)
    
    def _add_stroke_features(self, features_df: pd.DataFrame, patient_data: Dict):
        """뇌졸중 특화 피처 추가 (만약 모델에 있다면)"""
        # 이 피처들이 실제 모델에 있는지 확인 필요
        stroke_features = ['nihss_score', 'stroke_type_ischemic', 'stroke_type_hemorrhagic', 
                          'reperfusion_treatment', 'reperfusion_time']
        
        for feature in stroke_features:
            if feature in features_df.columns:
                if feature == 'nihss_score':
                    features_df[feature] = patient_data.get('nihss_score', 8)
                elif feature == 'stroke_type_ischemic':
                    features_df[feature] = 1 if 'ischemic' in patient_data.get('stroke_type', '') else 0
                elif feature == 'stroke_type_hemorrhagic':
                    features_df[feature] = 1 if 'hemorrhagic' in patient_data.get('stroke_type', '') else 0
                elif feature == 'reperfusion_treatment':
                    features_df[feature] = 1 if patient_data.get('reperfusion_treatment', False) else 0
                elif feature == 'reperfusion_time':
                    features_df[feature] = patient_data.get('reperfusion_time', 3.0)
    
    def _classify_mortality_risk(self, mortality_probability: float) -> str:
        """사망률 위험도 분류"""
        if mortality_probability < 0.1:
            return 'LOW'
        elif mortality_probability < 0.3:
            return 'MODERATE'
        elif mortality_probability < 0.5:
            return 'HIGH'
        else:
            return 'CRITICAL'
    
    def _get_mortality_recommendations(self, mortality_probability: float) -> List[str]:
        """사망률에 따른 임상 권장사항"""
        if mortality_probability > 0.5:
            return [
                "집중 모니터링 필요",
                "가족 상담 고려",
                "완화 치료 계획 수립"
            ]
        elif mortality_probability > 0.3:
            return [
                "적극적 치료 지속",
                "합병증 예방에 집중",
                "정기적 신경학적 평가"
            ]
        else:
            return [
                "표준 치료 프로토콜 적용",
                "재활 치료 계획 수립",
                "퇴원 계획 준비"
            ]
    
    def _analyze_stroke_factors(self, patient_data: Dict, mortality_probability: float) -> Dict:
        """뇌졸중 위험 요인 분석"""
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
        nihss = patient_data.get('nihss_score')
        if nihss:
            if nihss > 15:
                risk_factors.append(f"중증 뇌졸중 (NIHSS: {nihss})")
            elif nihss < 5:
                protective_factors.append(f"경증 뇌졸중 (NIHSS: {nihss})")
        
        # 재관류 치료 분석
        if patient_data.get('reperfusion_treatment'):
            reperfusion_time = patient_data.get('reperfusion_time', 0)
            if reperfusion_time <= 3:
                protective_factors.append("조기 재관류 치료 (≤3시간)")
            elif reperfusion_time <= 4.5:
                protective_factors.append("적절한 재관류 치료 (≤4.5시간)")
            else:
                risk_factors.append(f"지연된 재관류 치료 ({reperfusion_time}시간)")
        else:
            risk_factors.append("재관류 치료 미시행")
        
        # 뇌졸중 유형 분석
        stroke_type = patient_data.get('stroke_type', 'ischemic')
        if 'hemorrhagic' in stroke_type:
            risk_factors.append("출혈성 뇌졸중")
        
        # 기존 합병증 확인
        complications = patient_data.get('complications', {})
        if complications.get('sepsis'):
            risk_factors.append("패혈증 동반")
        if complications.get('respiratory_failure'):
            risk_factors.append("호흡부전 동반")
        
        # 사망률에 따른 권장사항
        if mortality_probability > 0.5:
            recommendations.extend([
                "집중 모니터링 필요",
                "가족 상담 및 예후 설명",
                "완화 치료 계획 수립 고려",
                "다학제 팀 접근 필요"
            ])
        elif mortality_probability > 0.3:
            recommendations.extend([
                "적극적 치료 지속",
                "합병증 예방에 집중",
                "정기적 신경학적 평가",
                "재활 치료 조기 시작 고려"
            ])
        elif mortality_probability > 0.1:
            recommendations.extend([
                "표준 치료 프로토콜 적용",
                "재활 치료 계획 수립",
                "퇴원 계획 준비",
                "외래 추적 관찰 계획"
            ])
        else:
            recommendations.extend([
                "조기 재활 치료 시작",
                "퇴원 계획 적극 추진",
                "외래 추적 관찰",
                "2차 예방 치료 최적화"
            ])
        
        return {
            'risk_factors': risk_factors,
            'protective_factors': protective_factors,
            'recommendations': recommendations
        }
        """목업 사망률 예측"""
        age = patient_data.get('age', 65)
        nihss = patient_data.get('nihss_score', 8)
        
        # 간단한 규칙 기반 추정
        mortality_30_day = min(0.8, (age - 50) * 0.01 + nihss * 0.02)
        mortality_30_day = max(0.05, mortality_30_day)
        
        risk_level = self._classify_mortality_risk(mortality_30_day)
        
        return {
            'mortality_30_day': mortality_30_day,
            'risk_level': risk_level,
            'stroke_type': patient_data.get('stroke_type', 'ischemic'),
            'nihss_score': nihss,
            'model_confidence': 0.70,
            'processing_time': 0.1,
            'clinical_recommendations': self._get_mortality_recommendations(mortality_30_day),
            'note': '목업 데이터 (모델 미로드)'
        }

# 싱글톤 인스턴스
ml_service = MLModelService()
