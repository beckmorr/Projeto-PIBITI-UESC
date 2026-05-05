import { useState } from "react";
import { Navigate } from "react-router-dom";
import {
  AlertCircle,
  Info,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  ThumbsUp,
  Activity,
  Sparkles,
} from "lucide-react";
import { MODELOS_CONFIG } from "../constants/modelsConfig";
import { usePrediction } from "../contexts/PredictionContext";

const MOCK_METRICS = {
  acuraciaTreino: "90.0%",
  acuraciaTeste: "86.7%",
  aucTreino: "0.952",
  aucTeste: "0.907",
};

export default function Visualizar() {
  const { modeloId, originalData, condutaData, isModeloCarregado } =
    usePrediction();

  const [expandedSections, setExpandedSections] = useState({
    predicao: true,
    metricas: false,
    dashboard: false,
    explicacoes: false,
  });

  if (!isModeloCarregado || !modeloId) {
    return <Navigate to="/preditor" replace />;
  }

  const modelo = MODELOS_CONFIG[modeloId];
  if (!modelo) {
    return <Navigate to="/preditor" replace />;
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Prioriza a simulacao de conduta quando disponivel.
  const activePrediction = condutaData ?? originalData;

  // Calculate percentages
  const probRaw = activePrediction?.percentual_obito
    ? activePrediction.percentual_obito / 100
    : (activePrediction?.probabilidade ?? 0);

  const percObito = activePrediction?.percentual_obito ?? probRaw * 100;
  const percAlta = activePrediction?.percentual_alta ?? 100 - percObito;

  const displayObito = Number(percObito).toFixed(1);
  const displayAlta = Number(percAlta).toFixed(1);
  const isAltaMaior = Number(percAlta) >= Number(percObito);

  const renderCardAlta = () => (
    <div className="relative overflow-hidden rounded-xl border-l-4 border-emerald-500 bg-emerald-50 p-6 shadow-sm">
      <div className="flex justify-between items-start relative z-10">
        <div>
          <span className="block font-bold uppercase tracking-wider mb-1 text-emerald-800 text-xs">
            Probabilidade de Alta
          </span>
          <span className="block font-black text-emerald-600 leading-none text-5xl mt-2">
            {displayAlta}%
          </span>
          <p className="text-xs text-emerald-700 mt-3 font-medium flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" /> Cenário Favorável
          </p>
        </div>
        <div className="rounded-full flex items-center justify-center p-3 bg-emerald-100">
          <CheckCircle className="text-emerald-600 w-8 h-8" />
        </div>
      </div>
    </div>
  );

  const renderCardObito = () => (
    <div className="relative overflow-hidden rounded-xl border-l-4 border-red-500 bg-red-50 p-6 shadow-sm">
      <div className="flex justify-between items-start relative z-10">
        <div>
          <span className="block font-bold uppercase tracking-wider mb-1 text-red-800 text-xs">
            Risco de Óbito
          </span>
          <span className="block font-black text-red-600 leading-none text-5xl mt-2">
            {displayObito}%
          </span>
          <p className="text-xs text-red-700 mt-3 font-medium flex items-center gap-1">
            <AlertOctagon className="w-3 h-3" /> Requer Atenção
          </p>
        </div>
        <div className="rounded-full flex items-center justify-center p-3 bg-red-100">
          <AlertTriangle className="text-red-600 w-8 h-8" />
        </div>
      </div>
    </div>
  );

  const CollapsibleSection = ({
    title,
    sectionKey,
    children,
  }: {
    title: string;
    sectionKey: keyof typeof expandedSections;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections[sectionKey];

    return (
      <div className="mb-4 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between px-6 py-4 bg-slate-200 hover:bg-slate-300 transition-colors"
        >
          <h2 className="text-slate-500 font-bold text-lg">{title}</h2>
          <ChevronDown
            className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Content */}
        {isExpanded && <div className="p-6 bg-white">{children}</div>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Conteúdo Principal */}
      <div className="container mx-auto px-6 py-8">
        {/* SEÇÃO 1: PREDIÇÃO */}
        <CollapsibleSection
          title="Predição"
          sectionKey="predicao"
        >
          <div className="space-y-6">
            {/* Resultados */}
            <div className="space-y-3">
              {isAltaMaior ? (
                <>
                  {renderCardAlta()}
                  {renderCardObito()}
                </>
              ) : (
                <>
                  {renderCardObito()}
                  {renderCardAlta()}
                </>
              )}
            </div>

            {/* Info do modelo */}
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                <span className="font-semibold">Modelo:</span> {modelo.nome}
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* SEÇÃO 2: MÉTRICAS DE DESEMPENHO */}
        <CollapsibleSection
          title="Métricas de desempenho do modelo preditivo"
          sectionKey="metricas"
        >
          <div className="space-y-6">
            {/* Cards de métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">
                  Acurácia
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Treino:</span>
                    <span className="font-bold text-slate-800">
                      {MOCK_METRICS.acuraciaTreino}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Teste:</span>
                    <span className="font-bold text-slate-800">
                      {MOCK_METRICS.acuraciaTeste}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">
                  AUC-ROC
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Treino:</span>
                    <span className="font-bold text-slate-800">
                      {MOCK_METRICS.aucTreino}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Teste:</span>
                    <span className="font-bold text-slate-800">
                      {MOCK_METRICS.aucTeste}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos de performance */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700">Gráficos</h4>
              {modelo.graficos?.performance && modelo.graficos.performance.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {modelo.graficos.performance.map((grafico, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 p-3 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-bold text-slate-700 text-sm">
                          {grafico.title}
                        </h5>
                        <div className="relative group">
                          <button className="p-1 rounded-full hover:bg-slate-200 transition-colors">
                            <Info className="w-4 h-4 text-slate-400" />
                          </button>
                          <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            <p>{grafico.desc}</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg overflow-hidden border border-slate-200 bg-white flex justify-center">
                        <img
                          src={grafico.src}
                          alt={grafico.title}
                          className="max-w-full h-auto object-contain max-h-150"
                        />
                      </div>
                      <button className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-600 text-xs font-medium rounded-lg transition-colors">
                        <Sparkles className="w-3.5 h-3.5" />
                        Explicar gráfico utilizando LLM
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm">Sem gráficos disponíveis</span>
                </div>
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* SEÇÃO 3: DASHBOARD BASE DE TREINAMENTO */}
        <CollapsibleSection
          title="Dashboard base de treinamento"
          sectionKey="dashboard"
        >
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 text-center">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                Dashboard do treinamento será exibido aqui
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* SEÇÃO 4: DASHBOARD EXPLICAÇÕES (SHAP) */}
        <CollapsibleSection
          title="Dashboard explicações"
          sectionKey="explicacoes"
        >
          <div className="space-y-6">
            {originalData?.shap_analysis || condutaData?.shap_analysis ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* COLUNA ESQUERDA: SHAP ORIGINAL */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-600 border-b-2 border-slate-200 pb-3">
                    Originais
                  </h3>

                  {originalData?.shap_analysis ? (
                    <>
                      {/* Tabela de Features Original */}
                      <div className="bg-slate-100 rounded-lg p-4 border border-slate-200">
                        <h4 className="text-sm font-bold text-slate-700 mb-3">
                          Top Fatores de Impacto
                        </h4>
                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                              <tr>
                                <th className="px-3 py-2 text-left">
                                  Variável
                                </th>
                                <th className="px-3 py-2 text-right">
                                  Contribuição
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {originalData.shap_analysis.top_features.map(
                                (item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td
                                      className="px-3 py-2 text-slate-700 font-medium truncate max-w-[150px]"
                                      title={item.variavel}
                                    >
                                      {item.variavel}
                                    </td>
                                    <td
                                      className={`px-3 py-2 text-right font-bold ${
                                        item.contrib > 0
                                          ? "text-emerald-600"
                                          : "text-red-500"
                                      }`}
                                    >
                                      {item.contrib > 0 ? "+" : ""}
                                      {item.contrib.toFixed(3)}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Gráficos SHAP Original */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-700">
                          Gráficos SHAP
                        </h4>
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-bold text-slate-700 text-sm">
                                Contribuição Individual (Waterfall)
                              </h5>
                              <div className="relative group">
                                <button className="p-1 rounded-full hover:bg-slate-200 transition-colors">
                                  <Info className="w-4 h-4 text-slate-400" />
                                </button>
                                <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                  <p>
                                    Explica como cada variável somou ou subtraiu
                                    para chegar no resultado final deste
                                    paciente.
                                  </p>
                                  <div className="mt-2 pt-2 border-t border-slate-600 space-y-1">
                                    <p className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                      <span>
                                        <strong>Positivo:</strong> aumenta
                                        chance de alta
                                      </span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                      <span>
                                        <strong>Negativo:</strong> aumenta risco
                                        de óbito
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="rounded-lg overflow-hidden border border-slate-200 bg-white flex justify-center">
                              <img
                                src={
                                  originalData.shap_analysis.plot_waterfall
                                }
                                alt="Waterfall Plot"
                                className="max-w-full h-auto object-contain"
                              />
                            </div>
                            <button className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-600 text-xs font-medium rounded-lg transition-colors">
                              <Sparkles className="w-3.5 h-3.5" />
                              Explicar gráfico utilizando LLM
                            </button>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-bold text-slate-700 text-sm">
                                Trajetória da Decisão (Decision Plot)
                              </h5>
                              <div className="relative group">
                                <button className="p-1 rounded-full hover:bg-slate-200 transition-colors">
                                  <Info className="w-4 h-4 text-slate-400" />
                                </button>
                                <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                  <p>
                                    Visualiza o caminho cumulativo das
                                    variáveis, mostrando como cada fator desviou
                                    o risco da média até a predição final.
                                  </p>
                                  <div className="mt-2 pt-2 border-t border-slate-600 space-y-1">
                                    <p className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                      <span>
                                        <strong>Positivo:</strong> aumenta
                                        chance de alta
                                      </span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                      <span>
                                        <strong>Negativo:</strong> aumenta risco
                                        de óbito
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="rounded-lg overflow-hidden border border-slate-200 bg-white flex justify-center">
                              <img
                                src={originalData.shap_analysis.plot_bar}
                                alt="Decision Plot"
                                className="max-w-full h-auto object-contain"
                              />
                            </div>
                            <button className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-600 text-xs font-medium rounded-lg transition-colors">
                              <Sparkles className="w-3.5 h-3.5" />
                              Explicar gráfico utilizando LLM
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <AlertCircle className="w-12 h-12 mb-3" />
                      <p className="text-sm">Dados SHAP não disponíveis</p>
                      <p className="text-xs mt-1">
                        Execute uma predição para gerar a análise.
                      </p>
                    </div>
                  )}
                </div>

                {/* COLUNA DIREITA: SHAP CONDUTA */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-600 border-b-2 border-slate-200 pb-3">
                    Conduta
                  </h3>

                  {condutaData?.shap_analysis ? (
                    <>
                      {/* Tabela de Features Conduta */}
                      <div className="bg-slate-100 rounded-lg p-4 border border-slate-200">
                        <h4 className="text-sm font-bold text-slate-700 mb-3">
                          Top Fatores de Impacto
                        </h4>
                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                              <tr>
                                <th className="px-3 py-2 text-left">
                                  Variável
                                </th>
                                <th className="px-3 py-2 text-right">
                                  Contribuição
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {condutaData.shap_analysis.top_features.map(
                                (item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td
                                      className="px-3 py-2 text-slate-700 font-medium truncate max-w-[150px]"
                                      title={item.variavel}
                                    >
                                      {item.variavel}
                                    </td>
                                    <td
                                      className={`px-3 py-2 text-right font-bold ${
                                        item.contrib > 0
                                          ? "text-emerald-600"
                                          : "text-red-500"
                                      }`}
                                    >
                                      {item.contrib > 0 ? "+" : ""}
                                      {item.contrib.toFixed(3)}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Gráficos SHAP Conduta */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-700">
                          Gráficos SHAP
                        </h4>
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-bold text-slate-700 text-sm">
                                Contribuição Individual (Waterfall)
                              </h5>
                              <div className="relative group">
                                <button className="p-1 rounded-full hover:bg-slate-200 transition-colors">
                                  <Info className="w-4 h-4 text-slate-400" />
                                </button>
                                <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                  <p>
                                    Explica como cada variável somou ou subtraiu
                                    para chegar no resultado final deste
                                    paciente.
                                  </p>
                                  <div className="mt-2 pt-2 border-t border-slate-600 space-y-1">
                                    <p className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                      <span>
                                        <strong>Positivo:</strong> aumenta
                                        chance de alta
                                      </span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                      <span>
                                        <strong>Negativo:</strong> aumenta risco
                                        de óbito
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="rounded-lg overflow-hidden border border-slate-200 bg-white flex justify-center">
                              <img
                                src={
                                  condutaData.shap_analysis.plot_waterfall
                                }
                                alt="Waterfall Plot"
                                className="max-w-full h-auto object-contain"
                              />
                            </div>
                            <button className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-600 text-xs font-medium rounded-lg transition-colors">
                              <Sparkles className="w-3.5 h-3.5" />
                              Explicar gráfico utilizando LLM
                            </button>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-bold text-slate-700 text-sm">
                                Trajetória da Decisão (Decision Plot)
                              </h5>
                              <div className="relative group">
                                <button className="p-1 rounded-full hover:bg-slate-200 transition-colors">
                                  <Info className="w-4 h-4 text-slate-400" />
                                </button>
                                <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                  <p>
                                    Visualiza o caminho cumulativo das
                                    variáveis, mostrando como cada fator desviou
                                    o risco da média até a predição final.
                                  </p>
                                  <div className="mt-2 pt-2 border-t border-slate-600 space-y-1">
                                    <p className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                      <span>
                                        <strong>Positivo:</strong> aumenta
                                        chance de alta
                                      </span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                      <span>
                                        <strong>Negativo:</strong> aumenta risco
                                        de óbito
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="rounded-lg overflow-hidden border border-slate-200 bg-white flex justify-center">
                              <img
                                src={condutaData.shap_analysis.plot_bar}
                                alt="Decision Plot"
                                className="max-w-full h-auto object-contain"
                              />
                            </div>
                            <button className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-600 text-xs font-medium rounded-lg transition-colors">
                              <Sparkles className="w-3.5 h-3.5" />
                              Explicar gráfico utilizando LLM
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <AlertCircle className="w-12 h-12 mb-3" />
                      <p className="text-sm">Dados SHAP não disponíveis</p>
                      <p className="text-xs mt-1">
                        Execute uma simulação de conduta para gerar a análise.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <AlertCircle className="w-12 h-12 mb-3" />
                <p className="text-sm">Dados SHAP não disponíveis</p>
                <p className="text-xs mt-1">
                  Execute uma predição para gerar a análise.
                </p>
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
