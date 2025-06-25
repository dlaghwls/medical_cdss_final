# extract_features.py
import pickle
import json
import sys
from pathlib import Path

def main(output_json_path: Path):
    # 1) pneumonia 전처리기 파일 경로 설정
    project_root = Path(__file__).resolve().parent
    pkl_file = project_root / 'backend' / 'ml_models' / 'saved_models' / 'pneumonia_preprocessors.pkl'

    # 2) 파일 존재 확인
    if not pkl_file.exists():
        print(f"ERROR: 전처리기 파일을 찾을 수 없습니다: {pkl_file}")
        sys.exit(1)

    # 3) pickle 로드
    with open(pkl_file, 'rb') as f:
        preprocessors = pickle.load(f)

    # 4) feature_columns 키 확인
    if 'feature_columns' not in preprocessors:
        print(f"ERROR: '{pkl_file.name}' 안에 'feature_columns' 키가 없습니다.")
        sys.exit(1)

    feature_cols = preprocessors['feature_columns']

    # 5) 출력 디렉터리 생성 및 JSON 저장
    output_json_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(feature_cols, f, ensure_ascii=False, indent=2)

    print(f"✅ {len(feature_cols)}개 컬럼을 '{output_json_path}'에 추출했습니다.")

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python extract_features.py <output_json_path>")
        print("예) python extract_features.py frontend/src/data/feature_columns.json")
        sys.exit(1)

    output_path = Path(sys.argv[1])
    main(output_path)
