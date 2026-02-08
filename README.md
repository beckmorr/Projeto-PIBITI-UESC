# MediDec - Clinical Decision Support System

![Project Status](https://img.shields.io/badge/status-em_desenvolvimento-orange?style=for-the-badge)

Tecnologias utilizadas:

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)

> **Sistema de Apoio à Decisão Clínica (CDSS) para Unidades de Terapia Intensiva.**

O **MediDec** é uma aplicação web que utiliza Inteligência Artificial para auxiliar profissionais de saúde na predição de desfechos clínicos. O sistema oferece estimativas de risco baseadas em dados reais e permite a simulação de cenários terapêuticos ("What-if analysis").

---

## 📸 Visualização

![Dashboard Preview](https://via.placeholder.com/800x400.png?text=Coloque+um+Print+do+Seu+Dashboard+Aqui)
*(Substitua este link por uma imagem real do seu projeto)*

---

## 🚀 Funcionalidades Principais

### 🧠 1. Predição de Risco com IA
Utiliza modelos de Machine Learning (XGBoost/Random Forest) para calcular a probabilidade de:
- **Mortalidade Hospitalar**
- **Necessidade de Ventilação Mecânica**

### 🎮 2. Simulação de Conduta (Modo Interativo)
Uma aba exclusiva de **"Simular Conduta"** onde o médico pode:
- Alterar variáveis clínicas (ex: dias de nutrição, uso de drogas vasoativas).
- Visualizar instantaneamente como a mudança na conduta impacta o risco do paciente.
- Comparar o cenário **Original** vs. **Simulado**.

### 🔍 3. Explicabilidade (XAI)
Não basta dizer o risco, o sistema explica o **porquê**.
- Integração com **SHAP Values** para mostrar quais variáveis (ex: Idade, Lactato) mais contribuíram para a decisão do modelo.

### 📱 4. Design Responsivo
Interface moderna construída com **Tailwind CSS**, totalmente adaptada para uso em computadores, tablets e smartphones (Mobile-First).

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React (Vite):** Performance e componentização.
- **TypeScript:** Segurança de tipagem e escalabilidade.
- **Tailwind CSS:** Estilização rápida e responsiva.
- **Lucide React:** Ícones modernos e leves.

### Backend & Data Science (Em integração)
- **Python:** Linguagem base para os modelos.
- **Scikit-Learn / Joblib:** Treinamento e persistência dos modelos (`.pkl`).
- **FastAPI:** API para comunicação entre o Front e o Modelo.

---

## 📦 Como Rodar o Projeto

### Pré-requisitos
- Node.js instalado.
- Python instalado (para o backend).

### 1. Clonar o repositório
```bash
git clone [https://github.com/SEU_USUARIO/medidec-app.git](https://github.com/SEU_USUARIO/medidec-app.git)
cd medidec-app
