import joblib
import xgboost as xgb
import os

arquivos = ["mortalidade", "ventilacao_mecanica"]

print("="*50)
print("INICIANDO CONVERSÃO PARA UBJ (BINÁRIO UNIVERSAL)")
print("="*50)

for nome in arquivos:
    caminho_pkl = f"api/models/{nome}.pkl"
    caminho_ubj = f"api/models/{nome}.ubj"
    
    if os.path.exists(caminho_pkl):
        try:
            print(f"\nProcessando: {nome}...")
            
            modelo_antigo = joblib.load(caminho_pkl)
            
            if hasattr(modelo_antigo, "steps"):
                booster = modelo_antigo.steps[-1][1].get_booster()
            else:
                booster = modelo_antigo.get_booster()
            
            booster.save_model(caminho_ubj)
            print(f"SUCESSO! Salvo em: {caminho_ubj}")
            
        except Exception as e:
            print(f"Erro ao converter {nome}: {e}")
    else:
        print(f"Arquivo não encontrado: {caminho_pkl}")

print("\n🏁 Conversão concluída!")