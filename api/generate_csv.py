import pandas as pd
import numpy as np

def gerar_dados_diarios_brutos(n_pacientes=3000):
    rows = []
    for i in range(n_pacientes):
        subject_id = 5000 + i
        age = np.random.randint(18, 90)
        
        # Tendência de saúde do paciente para os 3 dias
        saude_estavel = np.random.normal(0, 1)
        
        for dia in range(1, 4):
            rows.append({
                "subject_id": subject_id,
                "age": age,
                "dia": dia,
                "pao2_fio2_ratio": round(max(50, 210 + (saude_estavel * 40) + np.random.normal(0, 15)), 1),
                "peep": round(max(5, 12 - dia + np.random.normal(0, 2)), 1),
                "fio2": round(min(100, max(21, 60 - (dia * 5) + np.random.normal(0, 8))), 1),
                "tidal_volume": round(410 + np.random.normal(0, 40), 1),
                "respiratory_rate": int(max(12, 22 + np.random.normal(0, 4))),
                "sedation_scale": int(np.clip(-5 + dia, -5, 0)),
                "cuff_leak_test": np.random.choice([0, 1], p=[0.2, 0.8]),
                "secretions_quantity": np.random.randint(1, 5)
            })
            
    df = pd.DataFrame(rows)
    df.to_csv("dados_diarios_hospital.csv", index=False)
    print("CSV com dados diários gerado: dados_diarios_hospital.csv")

gerar_dados_diarios_brutos(3000)