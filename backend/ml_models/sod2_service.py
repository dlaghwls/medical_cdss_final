# backend/ml_models/sod2_service.py - SOD2 항산화 평가 전용 서비스
import logging
from typing import Dict, List, Any
from datetime import datetime, date, timedelta

logger = logging.getLogger(__name__)

class SOD2Service:
    """SOD2 항산화 평가 서비스"""
    
    def __init__(self):
        self.service_name = "SOD2 항산화 평가"
    
    def assess_sod2_status(self, patient_data: Dict) -> Dict[str, Any]:
        """SOD2 항산화 상태 평가"""
        try:
            # 환자 기본 정보 추출 (안전한 기본값 설정)
            patient_info = self._extract_patient_info(patient_data)
            
            # SOD2 예측 데이터 생성
            sod2_prediction = self._generate_sod2_prediction(patient_info)
            
            # 현재 SOD2 수준
            current_sod2 = sod2_prediction.get('current_level', 0.75)
            
            # 위험도 평가
            risk_level = self._assess_oxidative_risk(current_sod2)
            
            # 운동 권장사항 계산
            exercise_rec = self._calculate_exercise_recommendation(current_sod2, patient_info)
            
            # 임상 권장사항
            clinical_rec = self._generate_clinical_recommendations(current_sod2, patient_info)
            
            return {
                'patient_info': patient_info,
                'sod2_status': {
                    'current_level': current_sod2,
                    'oxidative_stress_risk': risk_level,
                    'prediction_confidence': 0.95,
                    'overall_status': self._get_antioxidant_status(current_sod2)
                },
                'sod2_prediction_data': sod2_prediction['time_series'],
                'exercise_recommendations': exercise_rec,
                'clinical_recommendations': clinical_rec,
                'personalization_factors': self._get_personalization_factors(patient_info)
            }
            
        except Exception as e:
            logger.error(f"SOD2 평가 중 오류: {e}")
            return {'error': str(e)}
    
    def _extract_patient_info(self, patient_data: Dict) -> Dict:
        """환자 정보 추출 및 정리 - 안전한 기본값 처리"""
        # stroke_info에서 우선 추출, 없으면 최상위에서 추출
        stroke_info = patient_data.get('stroke_info', {})
        
        # 기본값 설정 (안전한 기본값들)
        age = patient_data.get('age', 65)
        gender = patient_data.get('gender', 'M')
        stroke_type = stroke_info.get('stroke_type') or patient_data.get('stroke_type', 'ischemic_reperfusion')
        stroke_date = stroke_info.get('stroke_date') or patient_data.get('stroke_date')
        nihss_score = stroke_info.get('nihss_score') or patient_data.get('nihss_score', 8)
        
        # 재관류 치료 정보 - 안전한 처리
        reperfusion_treatment = stroke_info.get('reperfusion_treatment', False)
        if isinstance(reperfusion_treatment, str):
            reperfusion_treatment = reperfusion_treatment.lower() in ['true', '1', 'yes']
        
        # reperfusion_time 처리 - 재관류 치료를 받지 않으면 None
        reperfusion_time = None
        if reperfusion_treatment:
            time_value = stroke_info.get('reperfusion_time') or patient_data.get('reperfusion_time')
            if time_value is not None:
                try:
                    reperfusion_time = float(time_value)
                except (ValueError, TypeError):
                    reperfusion_time = 3.0  # 기본값
            else:
                reperfusion_time = 3.0  # 재관류 치료를 받았지만 시간이 없으면 기본값
        
        # 뇌졸중 후 경과 시간 계산
        hours_after_stroke = stroke_info.get('hours_after_stroke') or patient_data.get('hours_after_stroke')
        
        if hours_after_stroke is None and stroke_date:
            try:
                if isinstance(stroke_date, str):
                    stroke_date_obj = datetime.strptime(stroke_date, '%Y-%m-%d').date()
                else:
                    stroke_date_obj = stroke_date
                hours_after_stroke = (date.today() - stroke_date_obj).days * 24
            except (ValueError, TypeError):
                hours_after_stroke = 96  # 기본값 4일
        
        if hours_after_stroke is None:
            hours_after_stroke = 96  # 기본값 4일
        
        # 안전한 타입 변환
        try:
            nihss_score = int(nihss_score) if nihss_score is not None else 8
        except (ValueError, TypeError):
            nihss_score = 8
            
        try:
            hours_after_stroke = float(hours_after_stroke) if hours_after_stroke is not None else 96.0
        except (ValueError, TypeError):
            hours_after_stroke = 96.0
        
        return {
            'age': age,
            'gender': gender,
            'stroke_type': stroke_type,
            'stroke_date': stroke_date,
            'nihss_score': nihss_score,
            'reperfusion_treatment': reperfusion_treatment,
            'reperfusion_time': reperfusion_time,  # 재관류 치료 안 받으면 None
            'hours_after_stroke': hours_after_stroke
        }
    
    def _generate_sod2_prediction(self, patient_info: Dict) -> Dict:
        """SOD2 예측 데이터 생성"""
        base_data = [
            {'time': 0, 'predicted': 1.0, 'confidence': 0.95},
            {'time': 3, 'predicted': 0.75, 'confidence': 0.90},
            {'time': 6, 'predicted': 0.6, 'confidence': 0.85},
            {'time': 12, 'predicted': 0.7, 'confidence': 0.88},
            {'time': 24, 'predicted': 0.8, 'confidence': 0.90},
            {'time': 48, 'predicted': 0.9, 'confidence': 0.92},
            {'time': 72, 'predicted': 0.95, 'confidence': 0.94},
            {'time': 96, 'predicted': 0.98, 'confidence': 0.95},
            {'time': 120, 'predicted': 1.0, 'confidence': 0.96},
            {'time': 144, 'predicted': 1.0, 'confidence': 0.97},
            {'time': 168, 'predicted': 1.0, 'confidence': 0.98}
        ]
        
        # 조정 계수 계산
        adjustment_factor = self._calculate_adjustment_factor(patient_info)
        current_hour = patient_info['hours_after_stroke']
        
        adjusted_data = []
        current_level = 0.75
        
        for point in base_data:
            adjusted_level = point['predicted'] * adjustment_factor
            adjusted_level = max(0.1, min(1.0, adjusted_level))  # 0.1~1.0 범위로 제한
            
            risk_level = self._assess_oxidative_risk(adjusted_level)
            
            adjusted_point = {
                'time': point['time'],
                'predicted': round(adjusted_level, 3),
                'confidence': point['confidence'],
                'risk_level': risk_level
            }
            
            # 현재 시점의 수준 기록
            if point['time'] <= current_hour:
                current_level = adjusted_level
                adjusted_point['is_current'] = True
            
            adjusted_data.append(adjusted_point)
        
        return {
            'time_series': adjusted_data,
            'current_level': current_level
        }
    
    def _calculate_adjustment_factor(self, patient_info: Dict) -> float:
        """개인별 SOD2 조정 계수 계산"""
        age = patient_info['age']
        stroke_type = patient_info['stroke_type']
        nihss_score = patient_info['nihss_score']
        reperfusion_time = patient_info.get('reperfusion_time')  # None일 수 있음
        
        # 나이 계수 (젊을수록 회복 빠름)
        age_factor = 1.1 if age < 50 else 1.0 if age <= 70 else 0.9
        
        # 뇌졸중 유형 계수
        if stroke_type == 'hemorrhagic':
            stroke_factor = 0.8  # 출혈성은 회복 더딤
        elif 'no_reperfusion' in stroke_type:
            stroke_factor = 0.9  # 재관류 안하면 약간 더딤
        else:
            stroke_factor = 1.0  # 재관류한 허혈성
        
        # NIHSS 점수 계수 (중증도)
        nihss_factor = 0.85 if nihss_score > 15 else 1.1 if nihss_score < 5 else 1.0
        
        # 재관류 시간 계수 - None일 경우 처리
        reperfusion_factor = 1.0
        if reperfusion_time is not None:
            reperfusion_factor = 1.1 if reperfusion_time <= 3 else 1.05 if reperfusion_time <= 4.5 else 0.95
        elif not patient_info['reperfusion_treatment']:
            reperfusion_factor = 0.95  # 재관류 치료 안 받으면 약간 불리
        
        return age_factor * stroke_factor * nihss_factor * reperfusion_factor
    
    def _assess_oxidative_risk(self, sod2_level: float) -> str:
        """산화 스트레스 위험도 평가"""
        if sod2_level < 0.7:
            return 'high'
        elif sod2_level < 0.85:
            return 'medium'
        else:
            return 'low'
    
    def _calculate_exercise_recommendation(self, sod2_level: float, patient_info: Dict) -> Dict:
        """운동 권장사항 계산"""
        stroke_type = patient_info['stroke_type']
        hours_after_stroke = patient_info['hours_after_stroke']
        
        # 뇌졸중 유형별 기준
        exercise_criteria = {
            'ischemic_reperfusion': {'start_time': 72, 'safe_sod2': 0.75},
            'ischemic_no_reperfusion': {'start_time': 96, 'safe_sod2': 0.80},
            'hemorrhagic': {'start_time': 120, 'safe_sod2': 0.85}
        }
        
        criteria = exercise_criteria.get(stroke_type, exercise_criteria['ischemic_reperfusion'])
        
        can_start = (hours_after_stroke >= criteria['start_time'] and 
                    sod2_level >= criteria['safe_sod2'])
        
        # 운동 강도 계산
        if can_start:
            intensity = min(80, max(20, int(sod2_level * 100 - 10)))
        else:
            intensity = 0
        
        return {
            'can_start': can_start,
            'intensity': intensity,
            'start_time': criteria['start_time'],
            'current_hours': hours_after_stroke,
            'recommended_sod2_level': criteria['safe_sod2']
        }
    
    def _generate_clinical_recommendations(self, sod2_level: float, patient_info: Dict) -> List[str]:
        """임상 권장사항 생성"""
        recommendations = []
        
        if sod2_level < 0.7:
            recommendations.extend([
                "항산화제 투여를 고려하세요",
                "산화 스트레스 모니터링이 필요합니다",
                "운동은 SOD2 수준이 개선될 때까지 제한하세요"
            ])
        elif sod2_level < 0.85:
            recommendations.extend([
                "점진적인 활동 증가를 고려하세요",
                "정기적인 SOD2 수준 모니터링을 권장합니다"
            ])
        else:
            recommendations.extend([
                "정상적인 재활 운동을 시작할 수 있습니다",
                "정기적인 경과 관찰을 유지하세요"
            ])
        
        # 뇌졸중 유형별 추가 권장사항
        if patient_info['stroke_type'] == 'hemorrhagic':
            recommendations.append("출혈성 뇌졸중으로 인해 더 신중한 관찰이 필요합니다")
        
        if patient_info['nihss_score'] > 15:
            recommendations.append("중증 뇌졸중으로 인해 집중적인 모니터링이 필요합니다")
        
        return recommendations
    
    def _get_antioxidant_status(self, sod2_level: float) -> str:
        """전체 항산화 상태"""
        if sod2_level >= 0.85:
            return "양호"
        elif sod2_level >= 0.7:
            return "보통"
        else:
            return "불량"
    
    def _get_personalization_factors(self, patient_info: Dict) -> Dict:
        """개인화 요인들"""
        age = patient_info['age']
        nihss_score = patient_info['nihss_score']
        reperfusion_time = patient_info.get('reperfusion_time')
        
        return {
            'age_adjustment': 1.0 if 50 <= age <= 70 else 0.9 if age > 70 else 1.1,
            'stroke_type_adjustment': 0.8 if patient_info['stroke_type'] == 'hemorrhagic' else 1.0,
            'nihss_adjustment': 0.85 if nihss_score > 15 else 1.1 if nihss_score < 5 else 1.0,
            'reperfusion_timing_adjustment': (1.1 if reperfusion_time and reperfusion_time <= 3 else 0.95) if reperfusion_time is not None else 1.0
        }
        
        
sod2_service = SOD2Service()
