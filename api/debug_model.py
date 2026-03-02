import joblib
import os
import pandas as pd
import numpy as np
import sys

CAMINHO_ARQUIVO = "api/models/___.pkl"

def raio_x_modelo():
    print("="*50)
    print(f"INICIANDO DEBUG DO MODELO: {CAMINHO_ARQUIVO}")
    print("="*50)

    if not os.path.exists(CAMINHO_ARQUIVO):
        print(f"ERRO CRÍTICO: Arquivo não encontrado em: {os.path.abspath(CAMINHO_ARQUIVO)}")
        print("Dica: Verifique se você está rodando o script da raiz do projeto.")
        return

    try:
        objeto = joblib.load(CAMINHO_ARQUIVO)
        print(f"Arquivo carregado com sucesso!")
        print(f"Tipo do objeto principal: {type(objeto).__name__}")
    except Exception as e:
        print(f"ERRO AO CARREGAR .PKL: {e}")
        return

    modelo_final = objeto
    features_esperadas = None

    if hasattr(objeto, "steps"):
        print("\nESTRUTURA DO PIPELINE DETECTADA:")
        for nome, step in objeto.steps:
            print(f"Passo '{nome}': {type(step).__name__}")
        
        modelo_final = objeto.steps[-1][1]
        print(f"\nModelo Final identificado: {type(modelo_final).__name__}")
    else:
        print("\nO objeto não é um Pipeline, é um modelo direto.")

    print("\nTENTANDO EXTRAIR NOMES DAS COLUNAS...")
    
    if hasattr(modelo_final, "feature_names_in_"):
        features_esperadas = modelo_final.feature_names_in_
        print("Encontrado via 'feature_names_in_'")
    
    elif hasattr(modelo_final, "get_booster"):
        try:
            features_esperadas = modelo_final.get_booster().feature_names
            print("Encontrado via 'get_booster().feature_names'")
        except:
            pass

    if features_esperadas is not None:
        lista_cols = list(features_esperadas)
        print(f"\nO MODELO EXIGE EXATAMENTE {len(lista_cols)} COLUNAS:")
        print(lista_cols)
        
        print("\nTESTE DE PREDIÇÃO SIMULADA (Dummy Data)...")
        try:
            df_teste = pd.DataFrame([np.zeros(len(lista_cols))], columns=lista_cols)
            
            print("   1. DataFrame Dummy criado com sucesso.")
            
            print("   2. Tentando rodar 'predict_proba'...")
            
            resultado = objeto.predict_proba(df_teste)
            
            print(f"SUCESSO TOTAL! O modelo rodou e retornou: {resultado}")
            
        except Exception as e:
            print(f"\nFALHA NA SIMULAÇÃO: {e}")

    else:
        print("\nALERTA: Não foi possível extrair os nomes das colunas automaticamente.")

if __name__ == "__main__":
    raio_x_modelo()