import mortConfusion from "../assets/desempenho_modelos/mortalidade/perf_confusion.png";
import mortFeature from "../assets/desempenho_modelos/mortalidade/perf_feature_importance.png";
import mortLearning from "../assets/desempenho_modelos/mortalidade/perf_learning.png";
import mortPR from "../assets/desempenho_modelos/mortalidade/perf_pr.png";
import mortROC from "../assets/desempenho_modelos/mortalidade/perf_roc.png";
import mortTrainingBalance from "../assets/desempenho_modelos/treinamento/mortalidade/balance_desfecho.png";
import mortTrainingDays from "../assets/desempenho_modelos/treinamento/mortalidade/dias_internacao_por_desfecho.png";
import mortTrainingDeathsBySex from "../assets/desempenho_modelos/treinamento/mortalidade/obito_por_sexo.png";
import mortTrainingKcal from "../assets/desempenho_modelos/treinamento/mortalidade/media_calorias_por_desfecho.png";
import vmTrainingPao2 from "../assets/desempenho_modelos/treinamento/vm/pao2_fio2_por_dia.png";
import vmTrainingPeep from "../assets/desempenho_modelos/treinamento/vm/peep_respiratory_rate.png";
import vmTrainingCuffLeak from "../assets/desempenho_modelos/treinamento/vm/cuff_leak_por_secrecao.png";
import vmConfusion from "../assets/desempenho_modelos/vm/perf_confusion.png";
import vmROC from "../assets/desempenho_modelos/vm/perf_roc.png";
import vmPR from "../assets/desempenho_modelos/vm/perf_pr.png";
import vmLearning from "../assets/desempenho_modelos/vm/perf_learning.png";
import vmFeature from "../assets/desempenho_modelos/vm/perf_feature_importance.png";

export interface GraficoConfig {
  title: string;
  src: string;
  desc: string;
}

export interface Campo {
  id: string;
  label: string;
  type: "number" | "select";
  categoria: "unico" | "diario";
  editavel?: boolean;
}

export interface ModeloConfig {
  id: string;
  nome: string;
  diasDeAcompanhamento: number;
  diasAdicionais: number;
  metadados?: {
    descricaoBreve: string;
    metricas: {
      desempenhoGeral: string;
      precisao: string;
      aucr: string;
      tfp: string;
    };
  };
  campos: Campo[];
  graficos?: {
    performance: GraficoConfig[];
    shap: GraficoConfig[];
    training?: GraficoConfig[];
  };
}

export const MODELOS_CONFIG: Record<string, ModeloConfig> = {
  mortalidade: {
    id: "mortalidade",
    nome: "Mortalidade Hospitalar",
    diasDeAcompanhamento: 1,
    diasAdicionais: 1,
    metadados: {
      descricaoBreve:
        "Modelo para estimar o risco de mortalidade hospitalar com base em variaveis clinicas e evolucao diaria do paciente.",
      metricas: {
        desempenhoGeral: "86.7%",
        precisao: "90.0%",
        aucr: "0.907",
        tfp: "13.3%",
      },
    },
    graficos: {
      performance: [
        {
          title: "Matriz de Confusão",
          src: mortConfusion,
          desc: "Comparação entre acertos e erros do modelo.",
        },
        {
          title: "Curva ROC",
          src: mortROC,
          desc: "Relação entre Sensibilidade e Especificidade.",
        },
        {
          title: "Precision-Recall",
          src: mortPR,
          desc: "Equilíbrio entre precisão e recuperação dos casos.",
        },
        {
          title: "Curva de Aprendizado",
          src: mortLearning,
          desc: "Evolução do aprendizado com o aumento de dados.",
        },
        {
          title: "Importância das Variáveis",
          src: mortFeature,
          desc: "Fatores que mais impactaram a decisão.",
        },
      ],
      shap: [],
      training: [
        {
          title: "Base de treinamento - Desfecho",
          src: mortTrainingBalance,
          desc: "Distribuição dos pacientes entre alta e óbito na base usada para treinar o modelo.",
        },
        {
          title: "Dias de internamento por desfecho",
          src: mortTrainingDays,
          desc: "Comparação da permanência na UTI entre alta e óbito.",
        },
        {
          title: "Óbitos por sexo",
          src: mortTrainingDeathsBySex,
          desc: "Quantidade de óbitos estratificada por sexo na base de treinamento.",
        },
        {
          title: "Média de Calorias (Kcal/Kg/dia) por desfecho",
          src: mortTrainingKcal,
          desc: "Média de consumo de calorias por desfecho na base de treinamento.",
        },
      ],
    },
    campos: [
      {
        id: "subject_id",
        label: "ID do Paciente",
        type: "number",
        categoria: "unico",
        editavel: false,
      },
      {
        id: "gender",
        label: "Gênero",
        type: "number",
        categoria: "unico",
        editavel: false,
      },
      {
        id: "age_group",
        label: "Faixa Etária",
        type: "number",
        categoria: "unico",
        editavel: false,
      },
      {
        id: "IMC_range",
        label: "Faixa de IMC",
        type: "number",
        categoria: "unico",
        editavel: false,
      },
      {
        id: "daysinICU",
        label: "Dias na UTI",
        type: "number",
        categoria: "diario",
      },
      {
        id: "firstnutrition",
        label: "Primeira Nutrição",
        type: "number",
        categoria: "diario",
      },
      {
        id: "avgdaily_KcalKg_firstICU7days",
        label: "Média Kcal/Kg (UTI 7d)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "avgdaily_KcalKg_firstNT7days",
        label: "Média Kcal/Kg (NT 7d)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "avgdaily_KcalKg_ICUdays",
        label: "Média Kcal/Kg (Total UTI)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "avgdaily_KcalKg_NTdays",
        label: "Média Kcal/Kg (Total NT)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "avgdaily_gKg_firstICU7days",
        label: "Média g/Kg (UTI 7d)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "avgdaily_gKg_firstNT7days",
        label: "Média g/Kg (NT 7d)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "avgdaily_gKg_ICUdays",
        label: "Média g/Kg (Total UTI)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "avgdaily_gKg_NTdays",
        label: "Média g/Kg (Total NT)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "hightemperature_days",
        label: "Dias c/ Febre Alta",
        type: "number",
        categoria: "diario",
      },
      {
        id: "constipation",
        label: "Constipação",
        type: "number",
        categoria: "diario",
      },
      { id: "diarrhea", label: "Diarreia", type: "number", categoria: "diario", editavel: false,},
      {
        id: "MV_start",
        label: "Início VM",
        type: "number",
        categoria: "diario",
      },
      {
        id: "MV_return",
        label: "Retorno VM",
        type: "number",
        categoria: "diario",
      },
      {
        id: "MV_weaning",
        label: "Desmame VM",
        type: "number",
        categoria: "diario",
      },
      {
        id: "hemodialysis",
        label: "Hemodiálise",
        type: "number",
        categoria: "diario",
      },
      {
        id: "MV_stay",
        label: "Tempo em VM",
        type: "number",
        categoria: "diario",
      },
      { id: "FB72H", label: "Balanço 72h", type: "number", categoria: "diario" },
      {
        id: "FB72hvariation",
        label: "Variação Balanço 72h",
        type: "number",
        categoria: "diario",
      },
      {
        id: "FB72htrend",
        label: "Tendência 72h",
        type: "number",
        categoria: "diario",
      },
      {
        id: "FBtrend",
        label: "Tendência Geral",
        type: "number",
        categoria: "diario",
      },
      {
        id: "HGThyper_days",
        label: "Dias Hiperglicemia",
        type: "number",
        categoria: "diario",
      },
      {
        id: "HGThypo_days",
        label: "Dias Hipoglicemia",
        type: "number",
        categoria: "diario",
      },
      {
        id: "noraTo025days",
        label: "Dias Nora < 0.25",
        type: "number",
        categoria: "diario",
      },
      {
        id: "nora025to050days",
        label: "Dias Nora 0.25-0.50",
        type: "number",
        categoria: "diario",
      },
      {
        id: "noraupto050days",
        label: "Dias Nora Até 0.50",
        type: "number",
        categoria: "diario",
      },
      {
        id: "norafreedays",
        label: "Dias Sem Nora",
        type: "number",
        categoria: "diario",
      },
      {
        id: "vaso_days",
        label: "Dias Vasopressor",
        type: "number",
        categoria: "diario",
      },
      {
        id: "high_urea_days",
        label: "Dias Ureia Alta",
        type: "number",
        categoria: "diario",
      },
      {
        id: "high_creatinine_days",
        label: "Dias Creatinina Alta",
        type: "number",
        categoria: "diario",
      },
      {
        id: "low_totallynpho_days",
        label: "Dias Linfócitos Baixos",
        type: "number",
        categoria: "diario",
      },
      {
        id: "low_hemoglobine_days",
        label: "Dias Hgb Baixa",
        type: "number",
        categoria: "diario",
      },
      {
        id: "high_bilirubins_days",
        label: "Dias Bilirrubina Alta",
        type: "number",
        categoria: "diario",
      },
      {
        id: "hypo_albumin_days",
        label: "Dias Albumina Baixa",
        type: "number",
        categoria: "diario",
      },
      {
        id: "high_triglycerides_days",
        label: "Dias Triglicerídeos Altos",
        type: "number",
        categoria: "diario",
      },
      {
        id: "hyper_potassium_days",
        label: "Dias K+ Alto",
        type: "number",
        categoria: "diario",
      },
      {
        id: "hypo_potassium_days",
        label: "Dias K+ Baixo",
        type: "number",
        categoria: "diario",
      },
      {
        id: "hyper_magnesium_days",
        label: "Dias Mg+ Alto",
        type: "number",
        categoria: "diario",
      },
      {
        id: "hypo_magnesium_days",
        label: "Dias Mg+ Baixo",
        type: "number",
        categoria: "diario",
      },
      {
        id: "hyper_sodium_days",
        label: "Dias Na+ Alto",
        type: "number",
        categoria: "diario",
      },
      {
        id: "hypo_sodium_days",
        label: "Dias Na+ Baixo",
        type: "number",
        categoria: "diario",
      },
      {
        id: "hypo_phosphor",
        label: "Hipofosfatemia",
        type: "number",
        categoria: "diario",
      },
      { id: "max_ast", label: "Máx AST", type: "number", categoria: "diario" },
      { id: "max_alt", label: "Máx ALT", type: "number", categoria: "diario" },
      {
        id: "max_alkaline",
        label: "Máx Fosf. Alcalina",
        type: "number",
        categoria: "diario",
      },
    ],
  },

  vm: {
    id: "vm",
    nome: "Ventilação Mecânica",
    diasDeAcompanhamento: 3,
    diasAdicionais: 3,
    metadados: {
      descricaoBreve:
        "Modelo para estimar a necessidade de ventilacao mecanica a partir de indicadores respiratorios e evolucao clinica.",
      metricas: {
        desempenhoGeral: "89.7%",
        precisao: "98.0%",
        aucr: "0.708",
        tfp: "16.3%",
      },
    },
    graficos: {
      performance: [
        {
          title: "Matriz de Confusão",
          src: vmConfusion,
          desc: "Comparação entre acertos e erros do modelo de ventilação.",
        },
        {
          title: "Curva ROC",
          src: vmROC,
          desc: "Relação entre Sensibilidade e Especificidade da árvore.",
        },
        {
          title: "Precision-Recall",
          src: vmPR,
          desc: "Equilíbrio entre precisão e recuperação respiratória.",
        },
        {
          title: "Curva de Aprendizado",
          src: vmLearning,
          desc: "Evolução do aprendizado em ventilação com o aumento de dados.",
        },
        {
          title: "Importância das Variáveis",
          src: vmFeature,
          desc: "Fatores respiratórios e clínicos que mais impactaram a decisão.",
        },
      ],
      shap: [],
      training: [
        {
          title: "Base de treinamento - Proporção de Desfechos",
          src: vmTrainingPao2,
          desc: "Proporção estatística entre pacientes com sucesso no desmame e pacientes com falha ou permanência na ventilação mecânica.",
        },
        {
          title: "Níveis de PEEP por Desfecho",
          src: vmTrainingPeep,
          desc: "Distribuição dos níveis de pressão positiva (PEEP) mensurados no primeiro dia, comparando os grupos de desfecho.",
        },
        {
          title: "Relação PaO2/FiO2 por Desfecho",
          src: vmTrainingCuffLeak,
          desc: "Distribuição do índice de oxigenação pulmonar no primeiro dia entre os pacientes que progrediram para sucesso ou falha.",
        },
      ],
    },
    campos: [
      {
        id: "subject_id",
        label: "ID do Paciente",
        type: "number",
        categoria: "unico",
        editavel: false,
      },
      {
        id: "age",
        label: "Idade",
        type: "number",
        categoria: "unico",
        editavel: false,
      },
      {
        id: "pao2_fio2_ratio",
        label: "Relação PaO2/FiO2",
        type: "number",
        categoria: "diario",
      },
      {
        id: "peep",
        label: "PEEP",
        type: "number",
        categoria: "diario",
      },
      {
        id: "fio2",
        label: "FiO2 (%)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "tidal_volume",
        label: "Volume Corrente",
        type: "number",
        categoria: "diario",
      },
      {
        id: "respiratory_rate",
        label: "Freq. Respiratória",
        type: "number",
        categoria: "diario",
      },
      {
        id: "sedation_scale",
        label: "Escala de Sedação (RASS)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "cuff_leak_test",
        label: "Teste de Vazamento de Cuff",
        type: "number",
        categoria: "diario",
      },
      {
        id: "secretions_quantity",
        label: "Quantidade de Secreção",
        type: "number",
        categoria: "diario",
      },
    ],
  },
};
