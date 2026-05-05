import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface ShapData {
  top_features: Array<{
    variavel: string;
    contrib: number;
    valor_real: number;
  }>;
  plot_waterfall: string;
  plot_bar: string;
}

export interface PredictionData {
  probabilidade?: number;
  percentual_obito?: number;
  percentual_alta?: number;
  modeloId: string;
  dadosPaciente: Record<string, any>;
  shap_analysis?: ShapData;
  tipo_analise?: "original" | "conduta";
}

interface PredictionContextType {
  modeloId: string | null;
  setModeloId: (id: string | null) => void;
  dadosPaciente: Record<string, any>;
  setDadosPaciente: (dados: Record<string, any>) => void;
  csvPacientes: Record<string, any>[];
  setCsvPacientes: (dados: Record<string, any>[]) => void;
  pacienteSelecionadoId: string;
  setPacienteSelecionadoId: (id: string) => void;
  originalData: PredictionData | null;
  setOriginalData: (data: PredictionData | null) => void;
  condutaData: PredictionData | null;
  setCondutaData: (data: PredictionData | null) => void;
  isModeloCarregado: boolean;
  limparDados: () => void;
}

const PredictionContext = createContext<PredictionContextType | undefined>(
  undefined,
);

export const PredictionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [modeloId, setModeloId] = useState<string | null>(null);
  const [dadosPaciente, setDadosPaciente] = useState<Record<string, any>>({});
  const [csvPacientes, setCsvPacientes] = useState<Record<string, any>[]>([]);
  const [pacienteSelecionadoId, setPacienteSelecionadoId] = useState<string>("");
  const [originalData, setOriginalData] = useState<PredictionData | null>(null);
  const [condutaData, setCondutaData] = useState<PredictionData | null>(null);

  const isModeloCarregado =
    modeloId !== null && Object.keys(dadosPaciente).length > 0;

  const limparDados = () => {
    setModeloId(null);
    setDadosPaciente({});
    setCsvPacientes([]);
    setPacienteSelecionadoId("");
    setOriginalData(null);
    setCondutaData(null);
  };

  return (
    <PredictionContext.Provider
      value={{
        modeloId,
        setModeloId,
        dadosPaciente,
        setDadosPaciente,
        csvPacientes,
        setCsvPacientes,
        pacienteSelecionadoId,
        setPacienteSelecionadoId,
        originalData,
        setOriginalData,
        condutaData,
        setCondutaData,
        isModeloCarregado,
        limparDados,
      }}
    >
      {children}
    </PredictionContext.Provider>
  );
};

export const usePrediction = () => {
  const context = useContext(PredictionContext);
  if (context === undefined) {
    throw new Error("usePrediction must be used within a PredictionProvider");
  }
  return context;
};
