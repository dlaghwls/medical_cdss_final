import joblib
import pickle
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def load_ml_model(model_name):
    """
    ML 모델을 안전하게 로드하는 함수
    joblib 우선, 실패시 pickle 백업
    """
    model_path = Path(__file__).parent / 'saved_models' / f'{model_name}.pkl'
    
    if not model_path.exists():
        raise FileNotFoundError(f"모델 파일을 찾을 수 없습니다: {model_path}")
    
    try:
        # 1차 시도: joblib (sklearn 모델에 최적화)
        model = joblib.load(model_path)
        logger.info(f"Joblib으로 모델 로드 성공: {model_name} ({type(model).__name__})")
        return model
        
    except Exception as joblib_error:
        logger.warning(f"Joblib 로드 실패: {str(joblib_error)}, pickle 시도...")
        
        try:
            # 2차 시도: pickle (백업)
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
            logger.info(f"Pickle로 모델 로드 성공: {model_name} ({type(model).__name__})")
            return model
            
        except Exception as pickle_error:
            logger.error(f"모든 로드 방법 실패 - Joblib: {joblib_error}, Pickle: {pickle_error}")
            raise Exception(f"모델 로드 실패: {model_name}. Joblib 오류: {joblib_error}, Pickle 오류: {pickle_error}")

def validate_model_features(model, expected_features):
    """
    모델의 피처가 예상과 일치하는지 검증
    """
    try:
        if hasattr(model, 'feature_names_in_'):
            model_features = model.feature_names_in_
            if len(model_features) != len(expected_features):
                logger.warning(f"피처 개수 불일치: 모델={len(model_features)}, 예상={len(expected_features)}")
            
            missing_features = set(expected_features) - set(model_features)
            if missing_features:
                logger.warning(f"누락된 피처: {missing_features}")
                
            return True
        else:
            logger.info("모델에 feature_names_in_ 속성이 없어 피처 검증 생략")
            return True
            
    except Exception as e:
        logger.error(f"피처 검증 중 오류: {str(e)}")
        return False