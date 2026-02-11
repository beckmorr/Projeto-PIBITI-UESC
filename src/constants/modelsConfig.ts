import mortConfusion from "../assets/desempenho_modelos/mortalidade/perf_confusion.png";
import mortFeature from "../assets/desempenho_modelos/mortalidade/perf_feature_importance.png";
import mortLearning from "../assets/desempenho_modelos/mortalidade/perf_learning.png";
import mortPR from "../assets/desempenho_modelos/mortalidade/perf_pr.png";
import mortROC from "../assets/desempenho_modelos/mortalidade/perf_roc.png";

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
  campos: Campo[];
  graficos?: {
    performance: GraficoConfig[];
    shap: GraficoConfig[];
  };
}

export const MODELOS_CONFIG: Record<string, ModeloConfig> = {
  mortalidade: {
    id: "mortalidade",
    nome: "Mortalidade Hospitalar",
    diasDeAcompanhamento: 0,
    diasAdicionais: 0,
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
      },
      {
        id: "daysinICU",
        label: "Dias na UTI",
        type: "number",
        categoria: "unico",
      },
      {
        id: "firstnutrition",
        label: "Primeira Nutrição",
        type: "number",
        categoria: "unico",
      },
      {
        id: "avgdaily_KcalKg_firstICU7days",
        label: "Média Kcal/Kg (UTI 7d)",
        type: "number",
        categoria: "unico",
      },
      {
        id: "avgdaily_KcalKg_firstNT7days",
        label: "Média Kcal/Kg (NT 7d)",
        type: "number",
        categoria: "unico",
      },
      {
        id: "avgdaily_KcalKg_ICUdays",
        label: "Média Kcal/Kg (Total UTI)",
        type: "number",
        categoria: "unico",
      },
      {
        id: "avgdaily_KcalKg_NTdays",
        label: "Média Kcal/Kg (Total NT)",
        type: "number",
        categoria: "unico",
      },
      {
        id: "avgdaily_gKg_firstICU7days",
        label: "Média g/Kg (UTI 7d)",
        type: "number",
        categoria: "unico",
      },
      {
        id: "avgdaily_gKg_firstNT7days",
        label: "Média g/Kg (NT 7d)",
        type: "number",
        categoria: "unico",
      },
      {
        id: "avgdaily_gKg_ICUdays",
        label: "Média g/Kg (Total UTI)",
        type: "number",
        categoria: "unico",
      },
      {
        id: "avgdaily_gKg_NTdays",
        label: "Média g/Kg (Total NT)",
        type: "number",
        categoria: "unico",
      },
      {
        id: "hightemperature_days",
        label: "Dias c/ Febre Alta",
        type: "number",
        categoria: "unico",
      },
      {
        id: "constipation",
        label: "Constipação",
        type: "number",
        categoria: "unico",
      },
      { id: "diarrhea", label: "Diarreia", type: "number", categoria: "unico" },
      {
        id: "MV_start",
        label: "Início VM",
        type: "number",
        categoria: "unico",
      },
      {
        id: "MV_return",
        label: "Retorno VM",
        type: "number",
        categoria: "unico",
      },
      {
        id: "MV_weaning",
        label: "Desmame VM",
        type: "number",
        categoria: "unico",
      },
      {
        id: "hemodialysis",
        label: "Hemodiálise",
        type: "number",
        categoria: "unico",
      },
      {
        id: "MV_stay",
        label: "Tempo em VM",
        type: "number",
        categoria: "unico",
      },
      { id: "FB72H", label: "Balanço 72h", type: "number", categoria: "unico" },
      {
        id: "FB72hvariation",
        label: "Variação Balanço 72h",
        type: "number",
        categoria: "unico",
      },
      {
        id: "FB72htrend",
        label: "Tendência 72h",
        type: "number",
        categoria: "unico",
      },
      {
        id: "FBtrend",
        label: "Tendência Geral",
        type: "number",
        categoria: "unico",
      },
      {
        id: "HGThyper_days",
        label: "Dias Hiperglicemia",
        type: "number",
        categoria: "unico",
      },
      {
        id: "HGThypo_days",
        label: "Dias Hipoglicemia",
        type: "number",
        categoria: "unico",
      },
      {
        id: "noraTo025days",
        label: "Dias Nora < 0.25",
        type: "number",
        categoria: "unico",
      },
      {
        id: "nora025to050days",
        label: "Dias Nora 0.25-0.50",
        type: "number",
        categoria: "unico",
      },
      {
        id: "noraupto050days",
        label: "Dias Nora Até 0.50",
        type: "number",
        categoria: "unico",
      },
      {
        id: "norafreedays",
        label: "Dias Sem Nora",
        type: "number",
        categoria: "unico",
      },
      {
        id: "vaso_days",
        label: "Dias Vasopressor",
        type: "number",
        categoria: "unico",
      },
      {
        id: "high_urea_days",
        label: "Dias Ureia Alta",
        type: "number",
        categoria: "unico",
      },
      {
        id: "high_creatinine_days",
        label: "Dias Creatinina Alta",
        type: "number",
        categoria: "unico",
      },
      {
        id: "low_totallynpho_days",
        label: "Dias Linfócitos Baixos",
        type: "number",
        categoria: "unico",
      },
      {
        id: "low_hemoglobine_days",
        label: "Dias Hgb Baixa",
        type: "number",
        categoria: "unico",
      },
      {
        id: "high_bilirubins_days",
        label: "Dias Bilirrubina Alta",
        type: "number",
        categoria: "unico",
      },
      {
        id: "hypo_albumin_days",
        label: "Dias Albumina Baixa",
        type: "number",
        categoria: "unico",
      },
      {
        id: "high_triglycerides_days",
        label: "Dias Triglicerídeos Altos",
        type: "number",
        categoria: "unico",
      },
      {
        id: "hyper_potassium_days",
        label: "Dias K+ Alto",
        type: "number",
        categoria: "unico",
      },
      {
        id: "hypo_potassium_days",
        label: "Dias K+ Baixo",
        type: "number",
        categoria: "unico",
      },
      {
        id: "hyper_magnesium_days",
        label: "Dias Mg+ Alto",
        type: "number",
        categoria: "unico",
      },
      {
        id: "hypo_magnesium_days",
        label: "Dias Mg+ Baixo",
        type: "number",
        categoria: "unico",
      },
      {
        id: "hyper_sodium_days",
        label: "Dias Na+ Alto",
        type: "number",
        categoria: "unico",
      },
      {
        id: "hypo_sodium_days",
        label: "Dias Na+ Baixo",
        type: "number",
        categoria: "unico",
      },
      {
        id: "hypo_phosphor",
        label: "Hipofosfatemia",
        type: "number",
        categoria: "unico",
      },
      { id: "max_ast", label: "Máx AST", type: "number", categoria: "unico" },
      { id: "max_alt", label: "Máx ALT", type: "number", categoria: "unico" },
      {
        id: "max_alkaline",
        label: "Máx Fosf. Alcalina",
        type: "number",
        categoria: "unico",
      },
    ],
  },

  vm: {
    id: "vm",
    nome: "Ventilação Mecânica",
    diasDeAcompanhamento: 3,
    diasAdicionais: 2,
    graficos: {
      performance: [],
      shap: [],
    },
    campos: [
      {
        id: "subject_id",
        label: "ID do Paciente",
        type: "number",
        categoria: "unico",
      },
      {
        id: "MV_start",
        label: "Início da Ventilação",
        type: "number",
        categoria: "unico",
      },
      // ...
    ],
  },
};
