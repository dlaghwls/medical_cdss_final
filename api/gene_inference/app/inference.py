import torch
import torch.nn as nn
from pydantic import BaseModel
from typing import List
import pandas as pd

# 1. AETransformerLite 모델 정의
class AETransformerLite(nn.Module):
    def __init__(self, input_dim, latent_dim=8, tf_embed_dim=8, dropout=0.2):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Linear(64, latent_dim)
        )
        self.embedding = nn.Linear(1, tf_embed_dim)
        self.self_attn = nn.MultiheadAttention(embed_dim=tf_embed_dim, num_heads=1, dropout=dropout, batch_first=True)
        self.ffn = nn.Sequential(
            nn.LayerNorm(tf_embed_dim),
            nn.Linear(tf_embed_dim, 1),
            nn.Sigmoid()
        )
        self.attn_weights = None

    def forward(self, x):
        latent = self.encoder(x)              # (B, L)
        x = latent.unsqueeze(2)               # (B, L, 1)
        x = self.embedding(x)                 # (B, L, D)
        attn_out, attn_weights = self.self_attn(x, x, x, need_weights=True)
        self.attn_weights = attn_weights.detach().cpu()
        x = attn_out.mean(dim=1)              # (B, D)
        out = self.ffn(x)                     # (B, 1)
        return out

# 2. Pydantic 모델 → API 입력 JSON 구조
class GeneVector(BaseModel):
    gene_vector: List[float]

# 3. 모델 로딩 함수
def load_model(weights_path: str, input_dim: int):
    model = AETransformerLite(input_dim=input_dim)
    model.load_state_dict(torch.load(weights_path, map_location=torch.device('cpu')))
    model.eval()
    return model

# 4. 단일 샘플 추론 함수
def predict(model: AETransformerLite, gene_vector: List[float]) -> float:
    x = torch.tensor(gene_vector, dtype=torch.float32).unsqueeze(0)  # shape: (1, input_dim)
    with torch.no_grad():
        prob = model(x).item()
    return round(prob, 4)

# 5. 다중 샘플(batch) 추론 함수
def predict_batch(model: AETransformerLite, gene_vectors: List[List[float]]) -> List[float]:
    x = torch.tensor(gene_vectors, dtype=torch.float32)
    with torch.no_grad():
        probs = model(x).squeeze(-1).cpu().numpy()  # shape: (batch,)
    return [round(float(prob), 4) for prob in probs]

# 6. csv 전처리 함수 (ID/Label 분리, 결측치 0처리)
def preprocess_csv(file) -> list[list[float]]:
    df = pd.read_csv(file)
    # patient_id, Label 컬럼 있으면 제거 (없어도 무시)
    cols_to_drop = []
    if 'patient_id' in df.columns:
        cols_to_drop.append('patient_id')
    if 'Label' in df.columns:
        cols_to_drop.append('Label')
    X = df.drop(columns=cols_to_drop)
    X = X.fillna(0)
    return X.values.tolist()


