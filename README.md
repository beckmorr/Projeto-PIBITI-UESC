# Sistema de Suporte à Decisão Médica

![Project Status](https://img.shields.io/badge/status-em_desenvolvimento-orange?style=for-the-badge)

Tecnologias utilizadas:

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![XGBoost](https://img.shields.io/badge/XGBoost-FL-red?style=for-the-badge)

> **Sistema de Apoio à Decisão Clínica (CDSS) com Inteligência Artificial Explicável (XAI) para Unidades de Terapia Intensiva.**

A interface proposta nesse repositório é uma aplicação web completa que utiliza modelos de Machine Learning (XGBoost) para auxiliar profissionais de saúde na predição de desfechos clínicos. O sistema vai além da predição, oferecendo Explicabilidade em Tempo Real (SHAP Values) e simulação de cenários terapêuticos ("What-if analysis").

---

## Funcionalidades Principais

### 1. Predição de Risco com IA Avançada
Utiliza dois modelos XGBoost otimizados (formato .ubj) para calcular a probabilidade de:
- Mortalidade Hospitalar
- Necessidade de Ventilação Mecânica

### 2. Explicabilidade (XAI) em Tempo Real
O sistema oferece transparência nas decisões do modelo. Para cada predição, são gerados:
- **Gráficos SHAP (Waterfall & Bar Plot):** Gerados dinamicamente no backend, mostrando exatamente quais variáveis contribuíram para aumentar ou diminuir o risco daquele paciente específico.
- **Top 5 Fatores de Impacto:** Lista textual das variáveis mais influentes no desfecho.

### 3. Análise Contrafactual (Modo Interativo)
Uma aba exclusiva de **"Análise Contrafactual"** onde o médico pode:
- Alterar variáveis clínicas dinâmicas (ex: dias de nutrição, balanço hídrico, uso de drogas vasoativas).
- Compreender o cenário contrafactual (*"What-if analysis"*), observando como pequenas mudanças nas condições ou condutas do paciente alterariam a predição de risco final.
- Receber uma nova predição e novos gráficos explicativos instantaneamente.
- Comparar o cenário **Original** vs. **Conduta** para apoiar a tomada de decisão clínica fundamentada.

### 4. Visualização de Performance
Acesso rápido às métricas de validação dos modelos:
- Curvas ROC e Precision-Recall.
- Matrizes de Confusão.
- Curvas de Aprendizado.

### 5. Arquitetura Robusta
- **Frontend:** React + Vite + TailwindCSS (Responsivo e Mobile-First).
- **Backend:** FastAPI (Python) servindo modelos XGBoost e gerando gráficos com Matplotlib/SHAP.

---

## Tecnologias Utilizadas

### Frontend
- **React (Vite):** Performance e componentização.
- **TypeScript:** Segurança de tipagem e escalabilidade.
- **Tailwind CSS:** Estilização rápida e responsiva.
- **Lucide React:** Ícones modernos e leves.

### Backend & Data Science
- **Python:** Linguagem base.
- **FastAPI:** API REST de alta performance.
- **XGBoost:** Algoritmo de Gradient Boosting para predições tabulares.
- **SHAP (SHapley Additive exPlanations):** Biblioteca para interpretabilidade do modelo.
- **Matplotlib:** Geração de gráficos estáticos no servidor.

---

## Como Rodar o Projeto

### Pré-requisitos
- Node.js instalado.
- Python 3.8+ instalado.

### 1. Configurando o Backend (API)

```bash
# Entre na pasta da API
cd api

# Crie um ambiente virtual (Opcional, mas recomendado)
python -m venv venv

# Ative o venv:
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Instale as dependências
pip install -r .\requirements.txt

# Inicie o servidor
uvicorn index:app --reload
```
### 2. Rodando o Front End

```bash
# Em outro terminal volte à pasta raiz 
cd ..

# Utilize o comando abaixo para instalar o npm
npm install

# Use o comando para gerar o link de visualização da ferramenta em seu navegador
npm run dev
