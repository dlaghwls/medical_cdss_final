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
            # 환자 기본 정보 추출
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
        """환자 정보 추출 및 정리 - 프론트엔드 데이터 구조에 맞게 수정"""
        
        # 프론트엔드에서 보내는 데이터 구조 확인
        print(f"[DEBUG] 받은 patient_data: {patient_data}")
        
        # stroke_info 객체에서 데이터 추출
        stroke_info = patient_data.get('stroke_info', {})
        
        # 실제 입력값 사용, 기본값은 최후의 수단으로만
        age = patient_data.get('age')
        if age is None:
            print("[WARNING] 나이 정보가 없습니다. 기본값 65 사용")
            age = 65
        
        gender = patient_data.get('gender')
        if gender is None:
            print("[WARNING] 성별 정보가 없습니다. 기본값 M 사용")
            gender = 'M'
        
        # stroke_info 객체에서 뇌졸중 정보 추출
        stroke_type = stroke_info.get('stroke_type')
        if stroke_type is None:
            print("[WARNING] 뇌졸중 유형 정보가 없습니다. 기본값 ischemic_reperfusion 사용")
            stroke_type = 'ischemic_reperfusion'
        
        nihss_score = stroke_info.get('nihss_score')
        if nihss_score is None:
            print("[WARNING] NIHSS 점수 정보가 없습니다. 기본값 8 사용")
            nihss_score = 8
        
        reperfusion_treatment = stroke_info.get('reperfusion_treatment', False)
        reperfusion_time = stroke_info.get('reperfusion_time')
        
        if not reperfusion_treatment:
            reperfusion_time = None
            print("[INFO] 재관류 치료를 받지 않음. reperfusion_time을 None으로 설정")
        elif reperfusion_time is None:
            print("[WARNING] 재관류 치료를 받았지만 시간 정보가 없습니다. 기본값 2.5 사용")
            reperfusion_time = 2.5
        
        hours_after_stroke = stroke_info.get('hours_after_stroke')
        if hours_after_stroke is None:
            print("[WARNING] 경과 시간 정보가 없습니다. 기본값 96 사용")
            hours_after_stroke = 96
        
        # stroke_date 처리
        stroke_date = stroke_info.get('stroke_date')
        if stroke_date:
            try:
                if isinstance(stroke_date, str):
                    stroke_date = datetime.strptime(stroke_date, '%Y-%m-%d').date()
                # stroke_date로부터 hours_after_stroke 재계산 (더 정확함)
                calculated_hours = (date.today() - stroke_date).days * 24
                if calculated_hours > 0:  # 유효한 계산값인 경우
                    hours_after_stroke = calculated_hours
                    print(f"[INFO] 뇌졸중 날짜로부터 경과시간 재계산: {hours_after_stroke}시간")
            except (ValueError, TypeError) as e:
                print(f"[ERROR] 뇌졸중 날짜 파싱 오류: {e}")
        
        # 추출된 정보 로깅
        extracted_info = {
            'age': int(age),
            'gender': str(gender),
            'stroke_type': str(stroke_type),
            'nihss_score': int(nihss_score),
            'reperfusion_treatment': bool(reperfusion_treatment),
            'reperfusion_time': float(reperfusion_time) if reperfusion_time is not None else None,
            'hours_after_stroke': float(hours_after_stroke)
        }
        
        print(f"[DEBUG] 추출된 환자 정보: {extracted_info}")
        
        return extracted_info
    
    def _generate_sod2_prediction(self, patient_info: Dict) -> Dict:
        """SOD2 시간별 예측 데이터 생성"""
        # 기본 시간별 SOD2 변화 패턴
        base_pattern = [
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
        
        # 개인별 조정 계수
        adjustment_factor = self._calculate_adjustment_factor(patient_info)
        current_hour = patient_info['hours_after_stroke']
        
        # 조정된 예측 데이터 생성
        adjusted_data = []
        current_level = None
        
        for point in base_pattern:
            adjusted_level = min(1.0, point['predicted'] * adjustment_factor)
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
            'current_level': current_level or 0.75
        }
    
    def _calculate_adjustment_factor(self, patient_info: Dict) -> float:
        """개인별 SOD2 조정 계수 계산"""
        age = patient_info['age']
        stroke_type = patient_info['stroke_type']
        nihss_score = patient_info['nihss_score']
        reperfusion_time = patient_info.get('reperfusion_time', 3.0)  # 기본값 3.0
        
        # reperfusion_time이 None인 경우 처리
        if reperfusion_time is None:
            reperfusion_time = 3.0  # 기본값 설정
        
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
        
        # 재관류 시간 계수 - reperfusion_treatment를 확인하여 적용
        reperfusion_factor = 1.0  # 기본값
        if patient_info.get('reperfusion_treatment', False):
            reperfusion_factor = 1.1 if reperfusion_time <= 3 else 1.05 if reperfusion_time <= 4.5 else 0.95
        
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
            'ischemic_reperfusion': {'start_time': 72, 'safe_sod2': 0.85},
            'ischemic_no_reperfusion': {'start_time': 96, 'safe_sod2': 0.85},
            'hemorrhagic': {'start_time': 120, 'safe_sod2': 0.8}
        }
        
        criteria = exercise_criteria.get(stroke_type, exercise_criteria['ischemic_reperfusion'])
        
        # 운동 시작 가능 여부
        time_ready = hours_after_stroke >= criteria['start_time']
        sod2_ready = sod2_level >= criteria['safe_sod2']
        can_start = time_ready and sod2_ready
        
        # 운동 강도 계산
        intensity = 0
        if can_start:
            intensity_range = 1 - criteria['safe_sod2']
            intensity = min(100, ((sod2_level - criteria['safe_sod2']) / intensity_range) * 100)
        
        return {
            'can_start': can_start,
            'intensity': round(intensity),
            'time_until_start': max(0, criteria['start_time'] - hours_after_stroke),
            'sod2_target': criteria['safe_sod2'],
            'recommended_activities': self._get_exercise_activities(intensity, can_start),
            'monitoring_schedule': '매일 SOD2 수준 확인' if can_start else '24시간 후 재평가',
            'safety_notes': self._get_exercise_safety_notes(stroke_type, can_start)
        }
    
    def _get_exercise_activities(self, intensity: int, can_start: bool) -> List[str]:
        """강도별 운동 활동 목록"""
        if not can_start:
            return ['안정 가료', '수동적 관절 운동', '호흡 운동']
        
        if intensity < 30:
            return ['침상 내 관절 운동', '호흡 운동', '가벼운 스트레칭']
        elif intensity < 60:
            return ['앉은 자세 운동', '가벼운 보행', '저강도 재활 운동']
        elif intensity < 80:
            return ['보행 훈련', '균형 운동', '중강도 재활 운동']
        else:
            return ['일반 보행', '계단 오르기', '일상생활 동작 훈련']
    
    def _get_exercise_safety_notes(self, stroke_type: str, can_start: bool) -> List[str]:
        """운동 안전 주의사항"""
        notes = []
        
        if not can_start:
            notes.append("현재 운동 제한 상태")
        
        if stroke_type == 'hemorrhagic':
            notes.extend([
                "출혈성 뇌졸중으로 인한 보수적 접근 필요",
                "혈압 모니터링 필수"
            ])
        
        notes.extend([
            "어지러움이나 두통 발생 시 즉시 중단",
            "점진적 강도 증가 원칙",
            "의료진 감독 하에 시행"
        ])
        
        return notes
    
    def _generate_clinical_recommendations(self, sod2_level: float, patient_info: Dict) -> List[str]:
        """임상 권장사항 생성"""
        recommendations = []
        
        if sod2_level < 0.7:
            recommendations.extend([
                "항산화제 치료 고려",
                "산화 스트레스 모니터링 강화",
                "운동 제한 및 안정 가료"
            ])
        elif sod2_level < 0.85:
            recommendations.extend([
                "점진적 활동 증가",
                "항산화 식품 섭취 권장",
                "정기적 SOD2 수준 확인"
            ])
        else:
            recommendations.extend([
                "단계적 재활 운동 시작 가능",
                "정상적인 일상 활동 복귀 준비",
                "예방적 항산화 관리"
            ])
        
        # 뇌졸중 유형별 추가 권장사항
        if patient_info['stroke_type'] == 'hemorrhagic':
            recommendations.append("출혈성 뇌졸중으로 인한 보수적 접근 필요")
        
        # NIHSS 점수별 추가 권장사항
        nihss = patient_info['nihss_score']
        if nihss > 15:
            recommendations.append("중증 뇌졸중으로 인한 집중 관리 필요")
        elif nihss < 5:
            recommendations.append("경증 뇌졸중으로 조기 재활 가능")
        
        return recommendations
    
    def _get_antioxidant_status(self, sod2_level: float) -> str:
        """항산화 상태 평가"""
        if sod2_level >= 0.95:
            return "우수"
        elif sod2_level >= 0.85:
            return "양호"
        elif sod2_level >= 0.7:
            return "보통"
        elif sod2_level >= 0.5:
            return "주의"
        else:
            return "위험"
    
    def _get_personalization_factors(self, patient_info: Dict) -> Dict:
        """개인화 계수들"""
        age = patient_info['age']
        stroke_type = patient_info['stroke_type']
        nihss_score = patient_info['nihss_score']
        reperfusion_time = patient_info.get('reperfusion_time', 3.0)
        
        return {
            'age_adjustment': 1.1 if age < 50 else 1.0 if age <= 70 else 0.9,
            'stroke_type_adjustment': 0.8 if stroke_type == 'hemorrhagic' else 1.0,
            'nihss_adjustment': 0.85 if nihss_score > 15 else 1.1 if nihss_score < 5 else 1.0,
            'reperfusion_timing_adjustment': 1.1 if reperfusion_time <= 3 else 0.95
        }

# 싱글톤 인스턴스
sod2_service = SOD2Service()