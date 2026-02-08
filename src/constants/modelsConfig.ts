export interface Campo {
  id: string;
  label: string;
  type: "number" | "select";
  categoria: "unico" | "diario";
}

export interface ModeloConfig {
  id: string;
  nome: string;
  diasDeAcompanhamento: number;
  diasAdicionais: number;
  campos: Campo[];
}

export const MODELOS_CONFIG: Record<string, ModeloConfig> = {
  mortalidade: {
    id: "mortalidade",
    nome: "Mortalidade Hospitalar",
    diasDeAcompanhamento: 5,
    diasAdicionais: 2,
    campos: [
      //Campos únicos
      {
        id: "subject_id",
        label: "ID do Paciente",
        type: "number",
        categoria: "unico",
      },
      { id: "gender", label: "Gênero", type: "number", categoria: "unico" },
      {
        id: "age_group",
        label: "Faixa Etária",
        type: "number",
        categoria: "unico",
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
      //Campos diários
      {
        id: "avgdaily_KcalKg_firstICU7days",
        label: "Média Kcal/Kg (UTI 5d)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "avgdaily_KcalKg_firstNT7days",
        label: "Média Kcal/Kg (NT 5d)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "avgdaily_KcalKg_ICUdays",
        label: "Média Kcal/Kg (Dias UTI)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "avgdaily_KcalKg_NTdays",
        label: "Média Kcal/Kg (Dias NT)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "avgdaily_gKg_firstICU7days",
        label: "Média g/Kg (UTI 5d)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "avgdaily_gKg_firstNT7days",
        label: "Média g/Kg (NT 5d)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "avgdaily_gKg_ICUdays",
        label: "Média g/Kg (Dias UTI)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "avgdaily_gKg_NTdays",
        label: "Média g/Kg (Dias NT)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "hightemperature_days",
        label: "Dias com Febre Alta",
        type: "number",
        categoria: "diario",
      },
      {
        id: "constipation",
        label: "Constipação",
        type: "number",
        categoria: "diario",
      },
      {
        id: "diarrhea",
        label: "Diarreia",
        type: "number",
        categoria: "diario",
      },
      {
        id: "MV_start",
        label: "Início Ventilação Mecânica",
        type: "number",
        categoria: "diario",
      },
      {
        id: "MV_return",
        label: "Retorno Ventilação Mecânica",
        type: "number",
        categoria: "diario",
      },
      {
        id: "MV_weaning",
        label: "Desmame Ventilação Mecânica",
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
        id: "FB72H",
        label: "Balanço Fluido 72h",
        type: "number",
        categoria: "diario",
      },
      {
        id: "FB72hvariation",
        label: "Variação Balanço 72h",
        type: "number",
        categoria: "diario",
      },
      {
        id: "FB72htrend",
        label: "Tendência Balanço 72h",
        type: "number",
        categoria: "diario",
      },
      {
        id: "FBtrend",
        label: "Tendência Geral Balanço",
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
        label: "Dias Nora (0 a 0.25)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "nora025to050days",
        label: "Dias Nora (0.25 a 0.50)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "noraupto050days",
        label: "Dias Nora (Até 0.50)",
        type: "number",
        categoria: "diario",
      },
      {
        id: "norafreedays",
        label: "Dias Sem Noradrenalina",
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
        label: "Dias Hemoglobina Baixa",
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
        label: "Dias Potássio Alto",
        type: "number",
        categoria: "diario",
      },
      {
        id: "hypo_potassium_days",
        label: "Dias Potássio Baixo",
        type: "number",
        categoria: "diario",
      },
      {
        id: "hyper_magnesium_days",
        label: "Dias Magnésio Alto",
        type: "number",
        categoria: "diario",
      },
      {
        id: "hypo_magnesium_days",
        label: "Dias Magnésio Baixo",
        type: "number",
        categoria: "diario",
      },
      {
        id: "hyper_sodium_days",
        label: "Dias Sódio Alto",
        type: "number",
        categoria: "diario",
      },
      {
        id: "hypo_sodium_days",
        label: "Dias Sódio Baixo",
        type: "number",
        categoria: "diario",
      },
      {
        id: "hypo_phosphor",
        label: "Hipofosfatemia",
        type: "number",
        categoria: "diario",
      },
      {
        id: "max_ast",
        label: "Valor Máximo AST",
        type: "number",
        categoria: "diario",
      },
      {
        id: "max_alt",
        label: "Valor Máximo ALT",
        type: "number",
        categoria: "diario",
      },
      {
        id: "max_alkaline",
        label: "Valor Máximo Fosf. Alcalina",
        type: "number",
        categoria: "diario",
      },
      {
        id: "MV_stay",
        label: "Permanência Vent. Mecânica",
        type: "number",
        categoria: "diario",
      },
    ],
  },
  vm: {
    id: "vm",
    nome: "Ventilação Mecânica",
    diasDeAcompanhamento: 3,
    diasAdicionais: 2,
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
