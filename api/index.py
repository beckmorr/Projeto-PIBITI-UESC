import base64
import io
import os

import xgboost as xgb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

try:
    import shap
except ImportError:
    shap = None

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
except ImportError:
    matplotlib = None
    plt = None

app = FastAPI()

origins_env = os.getenv("CORS_ORIGINS", "")
origins = [o.strip() for o in origins_env.split(",") if o.strip()]

allow_all_origins = "*" in origins
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all_origins else (origins or default_origins),
    allow_origin_regex=None if allow_all_origins else r"^https?://([a-z0-9-]+\.)*vercel\.app$|^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=False if allow_all_origins else True,
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

COLUNAS_VM = [
    'age', 'pao2_fio2_ratio', 'peep', 'fio2', 'tidal_volume',
    'respiratory_rate', 'sedation_scale', 'cuff_leak_test', 'secretions_quantity'
]

modelos = {}
explainers = {}


def carregar_modelo(nome_arquivo):
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


print("-" * 50)
print("INICIALIZANDO API MEDIDEC")
modelos["mortalidade"] = carregar_modelo("mortalidade")
modelos["vm"] = carregar_modelo("ventilacao_mecanica")

for nome, modelo in modelos.items():
    if modelo and shap is not None:
        try:
            explainers[nome] = shap.TreeExplainer(modelo)
            print(f"Explainer SHAP iniciado para: {nome}")
        except Exception as e:
            print(f"Erro ao iniciar Explainer para {nome}: {e}")
    elif modelo:
        print(f"SHAP desabilitado para: {nome} (dependencia ausente)")

print("-" * 50)


def plot_to_base64(plt_obj):
    buf = io.BytesIO()
    try:
        plt_obj.savefig(buf, format="png", bbox_inches='tight', dpi=150)
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode("utf-8")
        return f"data:image/png;base64,{img_str}"
    except Exception as e:
        print(f"Erro ao converter plot: {e}")
        return ""
    finally:
        plt_obj.close()


def gerar_analise_shap(modelo_id, dados_entrada, feature_names):
    if shap is None or plt is None:
        return None

    if modelo_id not in explainers:
        return None

    explainer = explainers[modelo_id]
    shap_values_obj = explainer(dados_entrada)

    values = shap_values_obj.values[0]
    data = shap_values_obj.data[0]

    impactos = []
    for nome, valor_shap, valor_real in zip(feature_names, values, data):
        impactos.append({
            "variavel": nome,
            "contrib": float(valor_shap),
            "valor_original": float(valor_real),
            "magnitude": abs(valor_shap)
        })

    top_5 = sorted(impactos, key=lambda x: x["magnitude"], reverse=True)[:5]

    top_5_final = []
    for item in top_5:
        top_5_final.append({
            "variavel": item["variavel"],
            "contrib": round(item["contrib"], 3),
            "valor_real": item["valor_original"]
        })

    plt.figure()
    shap.plots.waterfall(shap_values_obj[0], show=False, max_display=12)
    waterfall_b64 = plot_to_base64(plt)

    plt.figure()
    shap.plots.decision(
        base_value=shap_values_obj.base_values[0],
        shap_values=shap_values_obj.values[0],
        feature_names=feature_names,
        show=False,
        link='logit'
    )
    decision_plot_b64 = plot_to_base64(plt)

    return {
        "top_features": top_5_final,
        "plot_waterfall": waterfall_b64,
        "plot_bar": decision_plot_b64
    }


def _to_float(value):
    if value is None or value == "":
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


@app.post("/predict/{modelo_id}")
@app.post("/api/predict/{modelo_id}")
def predict(modelo_id: str, dados: dict):
    if modelo_id not in modelos or modelos[modelo_id] is None:
        raise HTTPException(status_code=404, detail=f"Modelo '{modelo_id}' nao disponivel.")

    try:
        colunas_base = COLUNAS_MORTALIDADE if modelo_id == "mortalidade" else COLUNAS_VM
        valores_ordenados = [_to_float(dados.get(coluna)) for coluna in colunas_base]
        matriz_entrada = [valores_ordenados]

        dmatrix = xgb.DMatrix(matriz_entrada, feature_names=colunas_base)
        booster = modelos[modelo_id]

        prob_evento = float(booster.predict(dmatrix, validate_features=False)[0])
        prob_alta = 1.0 - prob_evento

        shap_data = gerar_analise_shap(modelo_id, matriz_entrada, colunas_base)

        return {
            "modelo": modelo_id,
            "probabilidade": prob_evento,
            "probabilidade_obito": prob_evento,
            "probabilidade_alta": prob_alta,
            "percentual_obito": round(prob_evento * 100, 1),
            "percentual_alta": round(prob_alta * 100, 1),
            "shap_analysis": shap_data
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Erro na predicao: {e}")
        raise HTTPException(status_code=500, detail=str(e))
