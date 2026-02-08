import xgboost as xgb
import pandas as pd
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

COLUNAS_MORTALIDADE = [
    'gender', 'age_group', 'IMC_range', 'daysinICU', 'firstnutrition',
    'avgdaily_KcalKg_firstICU7days', 'avgdaily_KcalKg_firstNT7days',
    'avgdaily_KcalKg_ICUdays', 'avgdaily_KcalKg_NTdays',
    'avgdaily_gKg_firstICU7days', 'avgdaily_gKg_firstNT7days',
    'avgdaily_gKg_ICUdays', 'avgdaily_gKg_NTdays', 'hightemperature_days',
    'constipation', 'diarrhea', 'MV_start', 'MV_return', 'MV_weaning',
    'hemodialysis', 'FB72H', 'FB72hvariation', 'FB72htrend', 'FBtrend',
    'HGThyper_days', 'HGThypo_days', 'noraTo025days', 'nora025to050days',
    'noraupto050days', 'norafreedays', 'vaso_days', 'high_urea_days',
    'high_creatinine_days', 'low_totallynpho_days', 'low_hemoglobine_days',
    'high_bilirubins_days', 'hypo_albumin_days', 'high_triglycerides_days',
    'hyper_potassium_days', 'hypo_potassium_days', 'hyper_magnesium_days',
    'hypo_magnesium_days', 'hyper_sodium_days', 'hypo_sodium_days',
    'hypo_phosphor', 'max_ast', 'max_alt', 'max_alkaline', 'MV_stay'
]

modelos = {}

def carregar_ubj(nome_arquivo):
    path = os.path.join(os.path.dirname(__file__), "models", nome_arquivo + ".ubj")
    
    if not os.path.exists(path):
        print(f"AVISO: Modelo nao encontrado em {path}")
        return None
    
    try:
        booster = xgb.Booster()
        booster.load_model(path)
        print(f"Modelo carregado: {nome_arquivo}.ubj")
        return booster
    except Exception as e:
        print(f"ERRO ao ler UBJ {nome_arquivo}: {e}")
        return None

print("-" * 30)
print("INICIALIZANDO API MEDIDEC...")
modelos["mortalidade"] = carregar_ubj("mortalidade")
modelos["vm"] = carregar_ubj("ventilacao_mecanica")
print("-" * 30)

@app.post("/predict/{modelo_id}")
def predict(modelo_id: str, dados: dict):
    if modelo_id not in modelos or modelos[modelo_id] is None:
        raise HTTPException(status_code=404, detail=f"Modelo '{modelo_id}' nao disponivel.")

    try:
        df_input = pd.DataFrame([dados])
        
        df_ordenado = df_input.reindex(columns=COLUNAS_MORTALIDADE, fill_value=0)
        
        df_ordenado = df_ordenado.apply(pd.to_numeric, errors='coerce').fillna(0)

        dmatrix = xgb.DMatrix(df_ordenado.values)

        booster = modelos[modelo_id]
        
        prob_evento = float(booster.predict(dmatrix, validate_features=False)[0])
        
        prob_alta = 1.0 - prob_evento

        return {
            "modelo": modelo_id,
            
            "probabilidade": prob_evento, 
            
            "probabilidade_obito": prob_evento,
            "probabilidade_alta": prob_alta,
            
            "percentual_obito": round(prob_evento * 100, 1),
            "percentual_alta": round(prob_alta * 100, 1)
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Erro na predicao: {e}")
        raise HTTPException(status_code=500, detail=str(e))