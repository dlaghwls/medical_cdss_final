# debug_model_loading.py - 모델 로드 디버깅
import os
import sys
import joblib
import pickle
from pathlib import Path

def debug_model_loading():
    """모델 로딩 상태 확인"""
    
    # 1. 경로 확인
    project_root = Path(__file__).resolve().parent
    saved_models_path = project_root / 'backend' / 'ml_models' / 'saved_models'
    
    print(f"프로젝트 루트: {project_root}")
    print(f"모델 경로: {saved_models_path}")
    print(f"모델 경로 존재 여부: {saved_models_path.exists()}")
    
    if not saved_models_path.exists():
        print("❌ saved_models 디렉토리가 없습니다!")
        return
    
    # 2. 파일 목록 확인
    print("\n📁 saved_models 폴더 내용:")
    for file in saved_models_path.iterdir():
        print(f"  - {file.name}")
    
    # 3. 각 모델 파일 로드 테스트
    complications = ['pneumonia', 'acute_kidney_injury', 'heart_failure']
    
    for comp in complications:
        print(f"\n🔍 {comp} 모델 테스트:")
        
        # 모델 파일
        model_file = saved_models_path / f'{comp}_final_model.pkl'
        print(f"  모델 파일: {model_file.exists()} - {model_file}")
        
        if model_file.exists():
            try:
                # joblib 시도
                model = joblib.load(model_file)
                print(f"  ✅ joblib 로드 성공: {type(model).__name__}")
            except Exception as e:
                print(f"  ❌ joblib 로드 실패: {e}")
                try:
                    # pickle 시도
                    with open(model_file, 'rb') as f:
                        model = pickle.load(f)
                    print(f"  ✅ pickle 로드 성공: {type(model).__name__}")
                except Exception as e2:
                    print(f"  ❌ pickle 로드도 실패: {e2}")
        
        # 전처리기 파일
        preprocessor_file = saved_models_path / f'{comp}_preprocessors.pkl'
        print(f"  전처리기: {preprocessor_file.exists()} - {preprocessor_file}")
        
        # 메타데이터 파일
        metadata_file = saved_models_path / f'{comp}_metadata.pkl'
        print(f"  메타데이터: {metadata_file.exists()} - {metadata_file}")
    
    # 4. feature_columns.json 확인
    json_path = project_root / 'frontend' / 'src' / 'data' / 'feature_columns.json'
    print(f"\n📋 feature_columns.json: {json_path.exists()} - {json_path}")
    
    if not json_path.exists():
        print("❌ feature_columns.json 파일이 없습니다!")
        print("💡 extract_features.py를 실행해서 생성해야 합니다:")
        print(f"   python extract_features.py {json_path}")
    
    # 5. 사망률 모델 확인
    mortality_file = saved_models_path / 'stroke_mortality_30day.pkl'
    print(f"\n💀 사망률 모델: {mortality_file.exists()} - {mortality_file}")

if __name__ == '__main__':
    debug_model_loading()