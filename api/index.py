import base64
import io
import os

import pandas as pd
import xgboost as xgb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from counterfactual import CounterfactualFinder

# SHAP e Matplotlib são opcionais para que a API continue funcionando com fallback.
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

# Instância principal da API FastAPI.
app = FastAPI()

# Origem das requisições pode vir do ambiente, mas o código também define padrões conhecidos.
origins_env = os.getenv("CORS_ORIGINS", "")
origins = [o.strip() for o in origins_env.split(",") if o.strip()]

allow_all_origins = "*" in origins
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ordem exata das variáveis esperadas pelo modelo de mortalidade.
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

# Ordem exata das variáveis esperadas pelo modelo de ventilação mecânica.
COLUNAS_VM = [
    'age', 'pao2_fio2_ratio', 'peep', 'fio2', 'tidal_volume',
    'respiratory_rate', 'sedation_scale', 'cuff_leak_test', 'secretions_quantity'
]

# Os modelos carregados e seus explicadores ficam registrados em memória.
modelos = {}
explainers = {}


def carregar_modelo(nome_arquivo):
    # Cada modelo é carregado de um arquivo UBJ dentro de api/models.
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


    # Inicialização do backend: carrega os modelos e tenta preparar SHAP.
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
    # Converte figuras do Matplotlib para string base64 embutida no JSON.
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


def _escape_xml(text):
    # Evita problemas de texto inválido ao montar SVG manualmente.
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def _impacts_to_svg(impactos, title):
    # Fallback visual quando SHAP não está disponível.
    width = 1000
    row_h = 28
    header_h = 70
    footer_h = 30
    n = max(1, min(10, len(impactos)))
    height = header_h + (n * row_h) + footer_h

    max_abs = max(abs(item["contrib"]) for item in impactos[:n]) if impactos[:n] else 1.0
    max_abs = max(max_abs, 1e-6)
    center_x = 520
    scale = 360 / max_abs

    rows = []
    for i, item in enumerate(impactos[:n]):
        y = header_h + i * row_h
        contrib = float(item["contrib"])
        bar_len = int(abs(contrib) * scale)
        if contrib >= 0:
            x = center_x
            color = "#059669"
        else:
            x = center_x - bar_len
            color = "#dc2626"

        label = _escape_xml(item["variavel"])
        value_text = f"{contrib:+.3f}"

        rows.append(
            f'<text x="18" y="{y + 18}" font-size="12" fill="#334155">{label}</text>'
        )
        rows.append(
            f'<rect x="{x}" y="{y + 7}" width="{bar_len}" height="12" fill="{color}" rx="2" />'
        )
        rows.append(
            f'<text x="890" y="{y + 18}" font-size="12" fill="#0f172a" text-anchor="end">{value_text}</text>'
        )

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="18" y="30" font-size="16" font-weight="700" fill="#0f172a">{_escape_xml(title)}</text>
  <text x="18" y="50" font-size="12" fill="#64748b">Contribuicoes estimadas por feature (fallback sem SHAP)</text>
  <line x1="{center_x}" y1="{header_h - 6}" x2="{center_x}" y2="{height - 10}" stroke="#cbd5e1" stroke-width="1" />
  {''.join(rows)}
</svg>'''

    encoded = base64.b64encode(svg.encode("utf-8")).decode("utf-8")
    return f"data:image/svg+xml;base64,{encoded}"


def gerar_analise_contribuicoes_xgb(modelo_id, dados_entrada, feature_names):
    # Usa contribuições nativas do XGBoost quando SHAP não puder ser usado.
    booster = modelos.get(modelo_id)
    if booster is None:
        return None

    dmatrix = xgb.DMatrix(dados_entrada, feature_names=feature_names)
    contribs = booster.predict(dmatrix, pred_contribs=True, validate_features=False)[0]

    if hasattr(dados_entrada, "iloc"):
        valores_reais = [float(v) for v in dados_entrada.iloc[0].tolist()]
    else:
        valores_reais = dados_entrada[0] if dados_entrada else [0.0] * len(feature_names)
    feature_contribs = contribs[:-1]

    impactos = []
    for idx, nome in enumerate(feature_names):
        valor = float(feature_contribs[idx])
        impactos.append({
            "variavel": nome,
            "contrib": valor,
            "valor_original": float(valores_reais[idx]) if idx < len(valores_reais) else 0.0,
            "magnitude": abs(valor),
        })

    top_5 = sorted(impactos, key=lambda x: x["magnitude"], reverse=True)[:5]
    top_10 = sorted(impactos, key=lambda x: x["magnitude"], reverse=True)[:10]

    top_5_final = []
    for item in top_5:
        top_5_final.append({
            "variavel": item["variavel"],
            "contrib": round(item["contrib"], 3),
            "valor_real": item["valor_original"],
        })

    return {
        "top_features": top_5_final,
        "plot_waterfall": _impacts_to_svg(top_10, "Waterfall (aproximado)") if top_10 else "",
        "plot_bar": _impacts_to_svg(top_10, "Decision/Bar (aproximado)") if top_10 else "",
    }


def gerar_analise_shap(modelo_id, dados_entrada, feature_names):
    # Tenta usar SHAP; se falhar, cai para o fallback nativo do XGBoost.
    if shap is None or plt is None or modelo_id not in explainers:
        return gerar_analise_contribuicoes_xgb(modelo_id, dados_entrada, feature_names)

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
    # Converte qualquer valor recebido no payload para float de forma tolerante.
    if value is None or value == "":
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _coerce_feature_frame(rows: list[dict], feature_columns: list[str]) -> pd.DataFrame:
    # Transforma a lista de linhas recebida no payload em um DataFrame numérico validado.
    frame = pd.DataFrame(rows)
    missing = [col for col in feature_columns if col not in frame.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Campos ausentes no payload: {', '.join(missing)}",
        )
    numeric_frame = frame.loc[:, feature_columns].copy()
    for column in feature_columns:
        numeric_frame[column] = numeric_frame[column].apply(_to_float)
    return numeric_frame


@app.post("/counterfactual/{modelo_id}")
@app.post("/api/counterfactual/{modelo_id}")
def counterfactual(modelo_id: str, payload: dict):
    # O endpoint recebe a base de candidatos (rows) e o paciente selecionado.
    if modelo_id not in modelos or modelos[modelo_id] is None:
        raise HTTPException(status_code=404, detail=f"Modelo '{modelo_id}' nao disponivel.")

    # O payload precisa trazer a base de comparação e o registro selecionado.
    rows = payload.get("rows", [])
    selected_row = payload.get("selected_row", {})
    protected_columns = payload.get("protected_columns", [])

    if not isinstance(rows, list) or len(rows) == 0:
        raise HTTPException(status_code=400, detail="Payload deve conter 'rows' com ao menos um registro.")
    if not isinstance(selected_row, dict) or len(selected_row) == 0:
        raise HTTPException(status_code=400, detail="Payload deve conter 'selected_row' com os dados do paciente selecionado.")

    # Escolhe as colunas corretas conforme o modelo requisitado.
    colunas_base = COLUNAS_MORTALIDADE if modelo_id == "mortalidade" else COLUNAS_VM
    valid_rows = [row for row in rows if isinstance(row, dict)]
    if len(valid_rows) == 0:
        raise HTTPException(status_code=400, detail="Nenhuma linha valida encontrada em 'rows'.")

    # rows vira train_df: a base de candidatos usada no cálculo contrafactual.
    train_df = _coerce_feature_frame(valid_rows, colunas_base)
    selected_frame = _coerce_feature_frame([selected_row], colunas_base)

    # Remove das colunas protegidas qualquer item que não faça parte do modelo.
    protected_columns = [
        column for column in protected_columns if column in colunas_base
    ]

    # Instancia o buscador com o modelo carregado e a base recebida no payload.
    finder = CounterfactualFinder(
        model=modelos[modelo_id],
        train_df=train_df,
        feature_columns=colunas_base,
        protected_columns=protected_columns,
    )

    try:
        # Calcula o contrafactual mais próximo dentro da base enviada.
        result = finder.find_nearest_counterfactual(
            selected_point=selected_frame.iloc[0],
            dataset_df=train_df,
        )
        return {
            "modelo": modelo_id,
            "protected_columns": protected_columns,
            **result,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular contrafactual: {exc}")


@app.post("/predict/{modelo_id}")
@app.post("/api/predict/{modelo_id}")
def predict(modelo_id: str, payload: dict):
    # Endpoint de predição simples: recebe dados clínicos e devolve probabilidade + explicação.
    if modelo_id not in modelos or modelos[modelo_id] is None:
        raise HTTPException(status_code=404, detail=f"Modelo '{modelo_id}' nao disponivel.")

    try:
        # dados contém as variáveis do paciente; janela só contextualiza a resposta.
        dados_clinicos = payload.get("dados", {})
        janela = payload.get("janela", "default")
        
        # Define a ordem esperada das features para o modelo escolhido.
        colunas_base = COLUNAS_MORTALIDADE if modelo_id == "mortalidade" else COLUNAS_VM

        # Reorganiza e converte os dados para a ordem correta das colunas.
        valores_ordenados = [_to_float(dados_clinicos.get(coluna)) for coluna in colunas_base]
        
        # Monta uma linha única para inferência e para a análise explicativa.
        matriz_entrada = [valores_ordenados]
        entrada_df = pd.DataFrame(matriz_entrada, columns=colunas_base)

        # Cria o DMatrix para chamar o modelo XGBoost nativo.
        dmatrix = xgb.DMatrix(matriz_entrada, feature_names=colunas_base)
        booster = modelos[modelo_id]

        # prob_evento é a probabilidade principal devolvida pelo modelo.
        prob_evento = float(booster.predict(dmatrix, validate_features=False)[0])
        prob_alta = 1.0 - prob_evento

        # Gera SHAP ou fallback XGBoost para explicar a predição.
        shap_data = gerar_analise_shap(modelo_id, entrada_df, colunas_base)

        return {
            "modelo": modelo_id,
            "janela": janela,
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
        raise HTTPException(status_code=500, detail=str(e))