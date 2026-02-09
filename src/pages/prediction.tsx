import { useState } from "react";
import {
  Activity,
  BarChart2,
  Save,
  Users,
  Dices,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  ThumbsUp,
  AlertOctagon,
  PieChart,
  X,
} from "lucide-react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { MODELOS_CONFIG } from "../constants/modelsConfig";

interface ShapData {
  top_features: Array<{
    variavel: string;
    contrib: number;
    valor_real: number;
  }>;
  plot_waterfall: string;
  plot_bar: string;
}

interface PredictionState {
  probabilidade?: number;
  percentual_obito?: number;
  percentual_alta?: number;
  modeloId: string;
  dadosPaciente: any;
  shap_analysis?: ShapData;
  tipo_analise?: "original" | "conduta";
}

// MOCKS ESTÁTICOS
const MOCK_METRICS = {
  acuraciaTreino: "90.0%",
  acuraciaTeste: "86.7%",
  aucTreino: "0.952",
  aucTeste: "0.907",
};

export const Prediction = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialState = location.state as PredictionState | null;

  const [originalData] = useState<PredictionState | null>(initialState);
  const [condutaData, setCondutaData] = useState<PredictionState | null>(
    initialState,
  );

  const [patientData, setPatientData] = useState<Record<string, any>>(
    initialState?.dadosPaciente || {},
  );

  const [activeTab, setActiveTab] = useState<"original" | "conduta">(
    "original",
  );
  const [activeChartModal, setActiveChartModal] = useState<
    "performance" | "shap" | null
  >(null);
  const [isSimulating, setIsSimulating] = useState(false);

  if (!initialState) return <Navigate to="/" replace />;
  const modelo = MODELOS_CONFIG[initialState.modeloId];
  if (!modelo) return <Navigate to="/" replace />;

  // --- LÓGICA DE EXIBIÇÃO ---
  const currentData = activeTab === "original" ? originalData : condutaData;
  const isConduta = activeTab === "conduta";

  const probRaw = currentData?.percentual_obito
    ? currentData.percentual_obito / 100
    : (currentData?.probabilidade ?? 0);

  const percObito = currentData?.percentual_obito ?? probRaw * 100;
  const percAlta = currentData?.percentual_alta ?? 100 - percObito;

  const displayObito = Number(percObito).toFixed(1);
  const displayAlta = Number(percAlta).toFixed(1);
  const isAltaMaior = Number(percAlta) >= Number(percObito);

  // --- FUNÇÃO DE SIMULAÇÃO ---
  const handleSimulation = async () => {
    setIsSimulating(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/predict/${modelo.id}?tipo_analise=conduta`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patientData),
        },
      );

      if (!response.ok) throw new Error("Erro na simulação");

      const newData = await response.json();

      setCondutaData({
        ...newData,
        dadosPaciente: patientData,
        modeloId: modelo.id,
      });
    } catch (error) {
      console.error(error);
      alert("Erro ao simular nova conduta.");
    } finally {
      setIsSimulating(false);
    }
  };

  const diasReais = modelo.diasDeAcompanhamento;
  const diasExtras = modelo.diasAdicionais;
  const totalDiasExibicao = isConduta ? diasReais + diasExtras : diasReais;
  const arrayDias = Array.from({ length: totalDiasExibicao }, (_, i) => i + 1);

  const camposUnicos = modelo.campos.filter((c) => c.categoria === "unico");
  const camposDiarios = modelo.campos.filter((c) => c.categoria === "diario");

  // --- IMAGENS DO MODAL ---
  let activeImages: Array<{ title: string; src: string; desc: string }> = [];

  if (activeChartModal === "performance") {
    activeImages = modelo.graficos?.performance || [];
  } else if (activeChartModal === "shap") {
    const shapAnalysis = currentData?.shap_analysis;

    if (shapAnalysis) {
      activeImages = [
        {
          title: "Contribuição Individual (Waterfall)",
          src: shapAnalysis.plot_waterfall,
          desc: "Explica como cada variável somou ou subtraiu para chegar no resultado final deste paciente.",
        },
        {
          title: "Trajetória da Decisão (Decision Plot)",
          src: shapAnalysis.plot_bar,
          desc: "Visualiza o caminho cumulativo das variáveis, mostrando como cada fator desviou o risco da média até a predição final.",
        },
      ];
    } else {
      activeImages = modelo.graficos?.shap || [];
    }
  }

  // --- RENDERIZADORES DE CARDS ---
  const renderCardAlta = (isMain: boolean) => (
    <div
      className={`relative overflow-hidden transition-all duration-500 ease-in-out rounded-xl border-l-4 shadow-sm ${isMain ? "bg-emerald-50 white:bg-emerald-900/20 border-emerald-500 p-6 scale-100 opacity-100 z-10" : "bg-emerald-50/50 white:bg-emerald-900/10 border-emerald-300/50 p-4 scale-[0.98] opacity-60 hover:opacity-80 grayscale-[0.3]"}`}
    >
      <div className="flex justify-between items-start relative z-10">
        <div>
          <span
            className={`block font-bold uppercase tracking-wider mb-1 transition-all ${isMain ? "text-emerald-800 white:text-emerald-300 text-xs" : "text-emerald-700/70 white:text-emerald-400/70 text-[10px]"}`}
          >
            Probabilidade de Alta
          </span>
          <span
            className={`block font-black text-emerald-600 white:text-emerald-400 leading-none transition-all ${isMain ? "text-5xl mt-2" : "text-2xl mt-1"}`}
          >
            {displayAlta}%
          </span>
          {isMain && (
            <p className="text-xs text-emerald-700 white:text-emerald-500 mt-3 font-medium flex items-center gap-1 animate-fade-in">
              <ThumbsUp className="w-3 h-3" /> Cenário Favorável
            </p>
          )}
        </div>
        <div
          className={`rounded-full flex items-center justify-center transition-all ${isMain ? "p-3 bg-emerald-100 white:bg-emerald-800/30" : "p-1.5 bg-emerald-100/50"}`}
        >
          <CheckCircle
            className={`text-emerald-600 white:text-emerald-400 ${isMain ? "w-8 h-8" : "w-5 h-5"}`}
          />
        </div>
      </div>
    </div>
  );

  const renderCardObito = (isMain: boolean) => (
    <div
      className={`relative overflow-hidden transition-all duration-500 ease-in-out rounded-xl border-l-4 shadow-sm ${isMain ? "bg-red-50 white:bg-red-900/20 border-red-500 p-6 scale-100 opacity-100 z-10" : "bg-red-50/50 white:bg-red-900/10 border-red-300/50 p-4 scale-[0.98] opacity-60 hover:opacity-80 grayscale-[0.3]"}`}
    >
      <div className="flex justify-between items-start relative z-10">
        <div>
          <span
            className={`block font-bold uppercase tracking-wider mb-1 transition-all ${isMain ? "text-red-800 white:text-red-300 text-xs" : "text-red-700/70 white:text-red-400/70 text-[10px]"}`}
          >
            Risco de Óbito
          </span>
          <span
            className={`block font-black text-red-600 white:text-red-400 leading-none transition-all ${isMain ? "text-5xl mt-2" : "text-2xl mt-1"}`}
          >
            {displayObito}%
          </span>
          {isMain && (
            <p className="text-xs text-red-700 white:text-red-500 mt-3 font-medium flex items-center gap-1 animate-fade-in">
              <AlertOctagon className="w-3 h-3" /> Requer Atenção
            </p>
          )}
        </div>
        <div
          className={`rounded-full flex items-center justify-center transition-all ${isMain ? "p-3 bg-red-100 white:bg-red-800/30" : "p-1.5 bg-red-100/50"}`}
        >
          <AlertTriangle
            className={`text-red-600 white:text-red-400 ${isMain ? "w-8 h-8" : "w-5 h-5"}`}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 white:bg-slate-950 pb-12 transition-colors duration-300">
      {/* HEADER */}
      <div className="bg-white white:bg-slate-900 border-b border-slate-200 white:border-slate-800 sticky top-0 z-30 shadow-sm transition-colors">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab("original")}
                className={`py-4 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === "original" ? "border-emerald-600 text-emerald-700 white:text-emerald-400" : "border-transparent text-slate-500 white:text-slate-400 hover:text-slate-700 white:hover:text-slate-200"}`}
              >
                Original
              </button>
              <button
                onClick={() => setActiveTab("conduta")}
                className={`py-4 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === "conduta" ? "border-blue-600 text-blue-700 white:text-blue-400" : "border-transparent text-slate-500 white:text-slate-400 hover:text-slate-700 white:hover:text-slate-200"}`}
              >
                Simular Conduta{" "}
                <span className="text-[10px] bg-blue-100 white:bg-blue-900 text-blue-700 white:text-blue-200 px-1.5 py-0.5 rounded-full">
                  Editável
                </span>
              </button>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 white:text-slate-400 hover:text-emerald-600 white:hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Nova Análise
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ESQUERDA: RESULTADOS */}
          <div className="lg:col-span-4 space-y-6">
            {/* CARD 1: PREDIÇÃO */}
            <div className="bg-white white:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 white:border-slate-800 p-6 transition-colors">
              <h3 className="text-slate-500 white:text-slate-400 text-xs font-bold uppercase tracking-widest mb-6 text-center">
                {activeTab === "original"
                  ? "Predição Original"
                  : "Simulação de Conduta"}
              </h3>
              <div className="flex flex-col gap-3">
                {isAltaMaior ? (
                  <>
                    {renderCardAlta(true)}
                    {renderCardObito(false)}
                  </>
                ) : (
                  <>
                    {renderCardObito(true)}
                    {renderCardAlta(false)}
                  </>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-6 text-center">
                Modelo:{" "}
                <span className="font-semibold text-slate-600">
                  {modelo.nome}
                </span>
              </p>
            </div>

            {/* CARD 2: PERFORMANCE (Sempre estático) */}
            <div className="bg-white white:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 white:border-slate-800 p-6 transition-colors">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-slate-800 white:text-white font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" /> Performance
                </h3>
                <button
                  onClick={() => setActiveChartModal("performance")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 white:bg-slate-800 text-slate-600 white:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-100 white:hover:bg-slate-700 transition-colors"
                >
                  <PieChart className="w-3 h-3" /> Gráficos
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-50 white:border-slate-800">
                  <span className="text-slate-500 white:text-slate-400">
                    Acurácia (Teste)
                  </span>
                  <span className="font-mono font-bold text-slate-700 white:text-slate-200">
                    {MOCK_METRICS.acuraciaTeste}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 white:text-slate-400">
                    AUC (Teste)
                  </span>
                  <span className="font-mono font-bold text-slate-700 white:text-slate-200">
                    {MOCK_METRICS.aucTeste}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: SHAP (Fatores de Impacto) */}
            <div className="bg-white white:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 white:border-slate-800 p-6 transition-colors">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-slate-800 white:text-white font-bold flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-slate-400" /> Fatores de
                  Impacto
                </h3>
                <button
                  onClick={() => setActiveChartModal("shap")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 white:bg-slate-800 text-slate-600 white:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-100 white:hover:bg-slate-700 transition-colors"
                >
                  <PieChart className="w-3 h-3" /> Gráficos
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-100 white:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 white:bg-slate-800 text-xs uppercase text-slate-500 white:text-slate-400">
                    <tr>
                      <th className="px-3 py-2 text-left">Variável</th>
                      <th className="px-3 py-2 text-right">Contribuição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 white:divide-slate-800">
                    {currentData?.shap_analysis ? (
                      currentData.shap_analysis.top_features.map(
                        (item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50 white:hover:bg-slate-800/50"
                          >
                            <td
                              className="px-3 py-2 text-slate-700 white:text-slate-300 font-medium truncate max-w-[150px]"
                              title={item.variavel}
                            >
                              {item.variavel}
                            </td>
                            <td
                              className={`px-3 py-2 text-right flex items-center justify-end gap-1 font-bold ${item.contrib > 0 ? "text-emerald-600" : "text-red-500"}`}
                            >
                              {item.contrib > 0 ? "+" : ""}
                              {item.contrib}
                              {item.contrib > 0 ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3" />
                              )}
                            </td>
                          </tr>
                        ),
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-3 py-4 text-center text-slate-400 text-xs"
                        >
                          Sem dados SHAP disponíveis.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* DIREITA: INPUTS RESPONSIVOS */}
          <div className="lg:col-span-8 h-auto lg:h-[calc(100vh-10rem)] min-h-[500px]">
            <div
              className={`bg-white white:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 white:border-slate-800 p-4 md:p-6 h-full flex flex-col transition-all ${isConduta ? "ring-2 ring-blue-100 white:ring-blue-900/30" : ""}`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 white:text-white">
                    Dados do Paciente
                  </h3>
                  <p className="text-xs md:text-sm text-slate-400">
                    {isConduta
                      ? "Edite os valores para simular."
                      : "Visualização dos dados originais."}
                  </p>
                </div>
                {isConduta && (
                  <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none justify-center flex items-center gap-1 px-3 py-2 bg-slate-100 white:bg-slate-800 text-slate-600 white:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 white:hover:bg-slate-700 transition-colors">
                      <Copy className="w-3 h-3" /> Repetir
                    </button>
                    <button className="flex-1 md:flex-none justify-center flex items-center gap-1 px-3 py-2 bg-slate-100 white:bg-slate-800 text-slate-600 white:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 white:hover:bg-slate-700 transition-colors">
                      <RefreshCw className="w-3 h-3" /> Média
                    </button>
                    {/* BOTÕES NOVOS COM ÍCONES SEMÂNTICOS */}
                    <button className="flex-1 md:flex-none justify-center flex items-center gap-1 px-3 py-2 bg-slate-100 white:bg-slate-800 text-slate-600 white:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 white:hover:bg-slate-700 transition-colors">
                      <Users className="w-3 h-3" /> Similares
                    </button>
                    <button className="flex-1 md:flex-none justify-center flex items-center gap-1 px-3 py-2 bg-slate-100 white:bg-slate-800 text-slate-600 white:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 white:hover:bg-slate-700 transition-colors">
                      <Dices className="w-3 h-3" /> DICE
                    </button>
                  </div>
                )}
              </div>

              {/* Tabela com Scroll */}
              <div className="flex-1 overflow-y-auto overflow-x-auto pr-0 md:pr-2 min-h-0 border-b border-slate-50 white:border-slate-800 custom-scrollbar relative">
                {/* Campos Únicos */}
                {camposUnicos.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-6 border-b border-slate-100 white:border-slate-800 pb-6">
                    {camposUnicos.map((campo) => (
                      <div
                        key={campo.id}
                        className="bg-slate-50 white:bg-slate-800 p-2 md:p-3 rounded-lg"
                      >
                        <label className="block text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mb-1 truncate">
                          {campo.label}
                        </label>
                        <input
                          type="number"
                          disabled={true}
                          placeholder="-"
                          value={patientData[campo.id] || ""}
                          onChange={(e) =>
                            setPatientData({
                              ...patientData,
                              [campo.id]: e.target.value,
                            })
                          }
                          className="w-full bg-transparent font-bold text-sm md:text-base text-slate-700 white:text-slate-200 outline-none border-b border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {/* Tabela Diária */}
                {camposDiarios.length > 0 && (
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-100 white:border-slate-800">
                          <th className="py-2 md:py-3 text-left text-[10px] md:text-xs font-bold text-slate-400 uppercase w-32 md:w-48 sticky left-0 top-0 bg-white white:bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-30 pl-2">
                            Variável
                          </th>
                          {arrayDias.map((dia) => {
                            const isExtra = dia > diasReais;
                            return (
                              <th
                                key={dia}
                                className={`py-2 md:py-3 text-center text-[10px] md:text-xs font-bold uppercase w-16 md:w-20 sticky top-0 bg-white white:bg-slate-900 z-20 ${isExtra ? "text-blue-500" : "text-slate-400"}`}
                              >
                                {isExtra ? `+D${dia - diasReais}` : `D${dia}`}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 white:divide-slate-800">
                        {camposDiarios.map((campo) => (
                          <tr
                            key={campo.id}
                            className="group hover:bg-slate-50/50 white:hover:bg-slate-800/50"
                          >
                            <td
                              className="py-3 md:py-4 text-xs md:text-sm font-bold text-slate-700 white:text-slate-300 sticky left-0 bg-white white:bg-slate-900 group-hover:bg-slate-50 white:group-hover:bg-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10 w-32 md:w-48 pl-2 truncate"
                              title={campo.label}
                            >
                              {campo.label}
                            </td>
                            {arrayDias.map((dia) => {
                              const diaId = `${campo.id}_dia_${dia}`;
                              const isExtra = dia > diasReais;
                              return (
                                <td
                                  key={dia}
                                  className={`p-1 md:p-2 text-center w-16 md:w-20 ${isExtra ? "bg-blue-50/10 white:bg-blue-900/10" : ""}`}
                                >
                                  <input
                                    type="number"
                                    disabled={!isConduta || !isExtra}
                                    value={patientData[diaId] || ""}
                                    onChange={(e) =>
                                      setPatientData({
                                        ...patientData,
                                        [diaId]: e.target.value,
                                      })
                                    }
                                    className={`w-full text-center p-1.5 md:p-2 rounded-lg text-xs md:text-sm transition-all outline-none ${isConduta && isExtra ? "bg-white white:bg-slate-800 border border-blue-200 white:border-blue-800 focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 white:text-white" : "bg-transparent text-slate-500 white:text-slate-400"} ${isExtra && !isConduta ? "text-blue-300 white:text-blue-500/50" : ""}`}
                                    placeholder={isExtra ? "?" : "-"}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-slate-100 white:border-slate-800 flex flex-col md:flex-row justify-end gap-3 shrink-0">
                {isConduta ? (
                  <>
                    <button className="w-full md:w-auto flex justify-center items-center gap-2 px-4 md:px-6 py-3 bg-white white:bg-slate-800 border border-slate-200 white:border-slate-700 text-slate-600 white:text-slate-300 font-bold rounded-xl hover:bg-slate-50 white:hover:bg-slate-700 transition-all text-sm">
                      <Save className="w-4 h-4" /> Salvar
                    </button>
                    <button
                      onClick={handleSimulation}
                      disabled={isSimulating}
                      className="w-full md:w-auto flex justify-center items-center gap-2 px-4 md:px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 white:shadow-none transition-all text-sm"
                    >
                      {isSimulating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      {isSimulating ? "Simulando..." : "Simular"}
                    </button>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-slate-400 text-xs md:text-sm bg-slate-50 p-2 rounded-lg w-full md:w-auto">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      Para testar, mude para{" "}
                      <strong className="text-slate-600 white:text-slate-300">
                        Conduta
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {activeChartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white white:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 white:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 white:border-slate-800 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800 white:text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-500" />
                  {activeChartModal === "performance"
                    ? "Gráficos de Performance"
                    : "Análise de Fatores (SHAP)"}
                </h3>
                <p className="text-sm text-slate-400">
                  Modelo:{" "}
                  <span className="font-semibold text-slate-600">
                    {modelo.nome}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setActiveChartModal(null)}
                className="p-2 bg-slate-100 white:bg-slate-800 rounded-full hover:bg-slate-200 white:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 white:text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 white:bg-slate-950/50 custom-scrollbar">
              {activeImages.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {activeImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="bg-white white:bg-slate-900 p-4 rounded-xl border border-slate-200 white:border-slate-800 shadow-sm"
                    >
                      <h4 className="font-bold text-slate-700 white:text-slate-200 mb-1">
                        {img.title}
                      </h4>
                      <p className="text-xs text-slate-400 mb-3">{img.desc}</p>
                      <div className="rounded-lg overflow-hidden border border-slate-100 white:border-slate-800 bg-white flex justify-center">
                        <img
                          src={img.src}
                          alt={img.title}
                          className="max-w-full h-auto object-contain"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                  <AlertCircle className="w-12 h-12 mb-2" />
                  <p>Gerando gráficos...</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 white:border-slate-800 flex justify-end shrink-0 bg-white white:bg-slate-900 rounded-b-2xl">
              <button
                onClick={() => setActiveChartModal(null)}
                className="px-6 py-2 bg-slate-100 white:bg-slate-800 text-slate-700 white:text-slate-300 text-sm font-bold rounded-lg hover:bg-slate-200 white:hover:bg-slate-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
