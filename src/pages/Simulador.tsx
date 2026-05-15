import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Copy,
  Dices,
  Lock,
  PieChart,
  RefreshCw,
  Save,
  Users,
  X,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { usePrediction } from "../contexts/PredictionContext";
import { MODELOS_CONFIG } from "../constants/modelsConfig";
import { buildApiUrl } from "../utils/api";

type SimuladorMode = "original" | "conduta";

interface SimuladorProps {
  mode?: SimuladorMode;
}

interface CounterfactualDifference {
  feature: string;
  original: any;
  counterfactual: any;
  delta: number | null;
}

interface CounterfactualResponse {
  modelo: string;
  counterfactual_index: number | string;
  counterfactual: Record<string, any>;
  selected_prediction: number | string;
  counterfactual_prediction: number | string;
  distance: number;
  numeric_distance: number;
  categorical_distance: number;
  differences: CounterfactualDifference[];
  protected_columns: string[];
}

export const Simulador = ({ mode = "original" }: SimuladorProps) => {
  const navigate = useNavigate();
  const {
    modeloId,
    dadosPaciente: contextDadosPaciente,
    csvPacientes,
    setCondutaData: setContextCondutaData,
    isModeloCarregado,
  } = usePrediction();

  const [patientData, setPatientData] = useState<Record<string, any>>(
    contextDadosPaciente || {},
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [isContrafactualOpen, setIsContrafactualOpen] = useState(false);
  const [isOpeningContrafactual, setIsOpeningContrafactual] = useState(false);
  const [counterfactualData, setCounterfactualData] =
    useState<CounterfactualResponse | null>(null);
  const [activeChartModal, setActiveChartModal] = useState<"performance" | null>(null);

  useEffect(() => {
    if (contextDadosPaciente && Object.keys(contextDadosPaciente).length > 0) {
      setPatientData(contextDadosPaciente);
    }
  }, [contextDadosPaciente]);

  if (!isModeloCarregado || !modeloId) return <Navigate to="/preditor" replace />;

  const modelo = MODELOS_CONFIG[modeloId];
  if (!modelo) return <Navigate to="/preditor" replace />;

  const isConduta = mode === "conduta";
  const diasReais = modelo.diasDeAcompanhamento;
  const diasExtras = modelo.diasAdicionais;
  const totalDiasExibicao = isConduta ? diasReais + diasExtras : diasReais;
  const arrayDias = Array.from({ length: totalDiasExibicao }, (_, i) => i + 1);
  const camposUnicos = modelo.campos.filter((campo) => campo.categoria === "unico");
  const camposDiarios = modelo.campos.filter((campo) => campo.categoria === "diario");
  const immutableColumns = modelo.campos
    .filter((campo) => campo.editavel === false)
    .map((campo) => campo.id);

  const buildSimulationPayload = () => {
    const payload: Record<string, any> = { ...patientData };

    camposDiarios.forEach((campo) => {
      const valores: number[] = [];
      for (let dia = 1; dia <= totalDiasExibicao; dia += 1) {
        const chaveDia = `${campo.id}_dia_${dia}`;
        const valor = patientData[chaveDia];
        if (valor !== undefined && valor !== "" && !Number.isNaN(Number(valor))) {
          valores.push(Number(valor));
        }
      }
      if (valores.length > 0) {
        payload[campo.id] = valores.reduce((acc, value) => acc + value, 0) / valores.length;
      }
    });

    return payload;
  };

  const currentModelInput = buildSimulationPayload();

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "number" && Number.isFinite(value)) return value.toString();
    return String(value);
  };

  const handleSimulation = async () => {
    setIsSimulating(true);
    try {
      const response = await fetch(buildApiUrl(`/predict/${modelo.id}?tipo_analise=conduta`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSimulationPayload()),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erro na simulação");
      }

      const newData = await response.json();
      setContextCondutaData({
        ...newData,
        dadosPaciente: patientData,
        modeloId: modelo.id,
      });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro ao simular nova conduta: ${message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRepetirUltimoDia = () => {
    if (diasExtras === 0) return;

    const novosDados = { ...patientData };
    camposDiarios.forEach((campo) => {
      const ultimoDiaReal = `${campo.id}_dia_${diasReais}`;
      const valorUltimoDia = patientData[ultimoDiaReal];
      if (valorUltimoDia !== undefined && valorUltimoDia !== "") {
        for (let dia = diasReais + 1; dia <= diasReais + diasExtras; dia += 1) {
          novosDados[`${campo.id}_dia_${dia}`] = valorUltimoDia;
        }
      }
    });

    setPatientData(novosDados);
  };

  const handlePreencherMedia = () => {
    if (diasExtras === 0) return;

    const novosDados = { ...patientData };
    camposDiarios.forEach((campo) => {
      const valoresDiarios: number[] = [];
      for (let dia = 1; dia <= diasReais; dia += 1) {
        const chaveDia = `${campo.id}_dia_${dia}`;
        const valor = patientData[chaveDia];
        if (valor !== undefined && valor !== "" && !Number.isNaN(Number(valor))) {
          valoresDiarios.push(Number(valor));
        }
      }
      if (valoresDiarios.length > 0) {
        const media = valoresDiarios.reduce((acc, value) => acc + value, 0) / valoresDiarios.length;
        for (let dia = diasReais + 1; dia <= diasReais + diasExtras; dia += 1) {
          novosDados[`${campo.id}_dia_${dia}`] = media;
        }
      }
    });

    setPatientData(novosDados);
  };

  const handleOpenContrafactual = async () => {
    setIsOpeningContrafactual(true);
    try {
      if (!csvPacientes || csvPacientes.length === 0) {
        throw new Error("Nenhum dataset carregado para buscar contrafactuais.");
      }

      const response = await fetch(buildApiUrl(`/counterfactual/${modelo.id}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: csvPacientes,
          selected_row: currentModelInput,
          protected_columns: immutableColumns,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Nao foi possivel calcular o contrafactual.");
      }

      const result: CounterfactualResponse = await response.json();
      setCounterfactualData(result);
      setIsContrafactualOpen(true);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro ao calcular contrafactual: ${message}`);
    } finally {
      setIsOpeningContrafactual(false);
    }
  };

  const comparisonRows = modelo.campos.map((campo) => {
    const originalValue = currentModelInput[campo.id] ?? patientData[campo.id] ?? "-";
    const suggestedFromModel = counterfactualData?.counterfactual?.[campo.id];
    const editable = campo.editavel !== false;
    const suggestedValue = editable ? (suggestedFromModel ?? originalValue) : originalValue;
    const changed = editable && formatValue(originalValue) !== formatValue(suggestedValue);

    return {
      ...campo,
      originalValue,
      suggestedValue,
      editable,
      changed,
    };
  });

  const activeImages: Array<{ title: string; src: string; desc: string }> =
    activeChartModal === "performance" ? modelo.graficos?.performance || [] : [];

  return (
    <div className="min-h-screen bg-slate-50 white:bg-slate-950 pb-12 transition-colors duration-300">
      <div className="bg-white white:bg-slate-900 border-b border-slate-200 white:border-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="py-4 px-2 text-sm font-bold uppercase tracking-wider border-b-2 border-emerald-600 text-emerald-700 white:text-emerald-400 flex items-center gap-2">
              Simulador
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
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white white:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 white:border-slate-800 p-4 md:p-6 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 white:text-white">Dados do Paciente</h3>
                <p className="text-xs md:text-sm text-slate-400">
                  {isConduta ? "Edite os valores para simular." : "Visualização dos dados originais."}
                </p>
              </div>

              {isConduta && (
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <button
                    onClick={handleRepetirUltimoDia}
                    className="flex-1 md:flex-none justify-center flex items-center gap-1 px-3 py-2 bg-slate-100 white:bg-slate-800 text-slate-600 white:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 white:hover:bg-slate-700 transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Repetir
                  </button>
                  <button
                    onClick={handlePreencherMedia}
                    className="flex-1 md:flex-none justify-center flex items-center gap-1 px-3 py-2 bg-slate-100 white:bg-slate-800 text-slate-600 white:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 white:hover:bg-slate-700 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Média
                  </button>
                  <button className="flex-1 md:flex-none justify-center flex items-center gap-1 px-3 py-2 bg-slate-100 white:bg-slate-800 text-slate-600 white:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 white:hover:bg-slate-700 transition-colors">
                    <Users className="w-3 h-3" /> Similares
                  </button>
                  <button className="flex-1 md:flex-none justify-center flex items-center gap-1 px-3 py-2 bg-slate-100 white:bg-slate-800 text-slate-600 white:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 white:hover:bg-slate-700 transition-colors">
                    <Dices className="w-3 h-3" /> DICE
                  </button>
                  <button
                    onClick={handleOpenContrafactual}
                    disabled={isOpeningContrafactual}
                    className="flex-1 md:flex-none justify-center flex items-center gap-1 px-3 py-2 bg-amber-100 white:bg-amber-900/30 text-amber-700 white:text-amber-300 rounded-lg text-xs font-bold hover:bg-amber-200 white:hover:bg-amber-900/50 transition-colors disabled:opacity-70"
                  >
                    {isOpeningContrafactual ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Lock className="w-3 h-3" />
                    )}
                    {isOpeningContrafactual ? "Abrindo..." : "Contrafactual"}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-auto pr-0 md:pr-2 min-h-0 border-b border-slate-50 white:border-slate-800 custom-scrollbar relative">
              {camposUnicos.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-6 border-b border-slate-100 white:border-slate-800 pb-6">
                  {camposUnicos.map((campo) => (
                    <div key={campo.id} className="bg-slate-50 white:bg-slate-800 p-2 md:p-3 rounded-lg">
                      <label className="block text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mb-1 truncate">
                        {campo.label}
                      </label>
                      <input
                        type="text"
                        disabled={!isConduta || campo.editavel === false}
                        placeholder="-"
                        value={patientData[campo.id] || ""}
                        onChange={(e) =>
                          setPatientData({
                            ...patientData,
                            [campo.id]: e.target.value,
                          })
                        }
                        className="w-full bg-transparent font-bold text-sm md:text-base text-slate-500 white:text-slate-200 outline-none border-b border-transparent"
                      />
                    </div>
                  ))}
                </div>
              )}

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
                        <tr key={campo.id} className="group hover:bg-slate-50/50 white:hover:bg-slate-800/50">
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
                                  type="text"
                                  disabled={!isConduta || !isExtra}
                                  value={patientData[diaId] || ""}
                                  onChange={(e) =>
                                    setPatientData({
                                      ...patientData,
                                      [diaId]: e.target.value,
                                    })
                                  }
                                  className={`w-full text-center p-1.5 md:p-2 rounded-lg text-xs md:text-sm transition-all outline-none ${isConduta && isExtra ? "bg-white white:bg-slate-800 border border-blue-200 white:border-blue-800 focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 white:text-white" : "bg-transparent text-slate-500 white:text-slate-400"}`}
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

            <div className="mt-4 pt-4 border-t border-slate-100 white:border-slate-800 flex flex-col md:flex-row justify-end gap-3 shrink-0">
              {isConduta ? (
                <>
                  <button className="w-full md:w-auto flex justify-center items-center gap-2 px-4 md:px-6 py-3 bg-white white:bg-slate-800 border border-slate-200 white:border-slate-700 text-slate-600 white:text-slate-300 font-bold rounded-xl hover:bg-slate-50 white:hover:bg-slate-700 transition-all text-sm">
                    <Save className="w-4 h-4" /> Salvar
                  </button>
                  <button
                    onClick={handleSimulation}
                    disabled={isSimulating}
                    className="w-full md:w-auto flex justify-center items-center gap-2 px-4 md:px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 white:shadow-none transition-all text-sm disabled:opacity-70"
                  >
                    {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {isSimulating ? "Simulando..." : "Submeter à predição"}
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs md:text-sm bg-slate-50 p-2 rounded-lg w-full md:w-auto">
                  <AlertCircle className="w-4 h-4" />
                  <span>Para testar, acesse a aba Simulador.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {activeChartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white white:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 white:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 white:border-slate-800 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800 white:text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-500" />
                  Gráficos de Performance
                </h3>
                <p className="text-sm text-slate-400">
                  Modelo: <span className="font-semibold text-slate-600">{modelo.nome}</span>
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
                    <div key={idx} className="bg-white white:bg-slate-900 p-4 rounded-xl border border-slate-200 white:border-slate-800 shadow-sm">
                      <h4 className="font-bold text-slate-700 white:text-slate-200 mb-1">{img.title}</h4>
                      <p className="text-xs text-slate-400 mb-3">{img.desc}</p>
                      <div className="rounded-lg overflow-hidden border border-slate-100 white:border-slate-800 bg-white flex justify-center">
                        <img src={img.src} alt={img.title} className="max-w-full h-auto object-contain" />
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

      {isContrafactualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white white:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col border border-slate-200 white:border-slate-800">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 white:border-slate-800 shrink-0 gap-4 flex-wrap">
              <div>
                <h3 className="text-lg font-bold text-slate-800 white:text-white">Contrafactual local</h3>
                <p className="text-xs text-slate-400">Compare o paciente atual com a sugestao que tenta inverter o desfecho.</p>
              </div>
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <button
                  onClick={handleOpenContrafactual}
                  disabled={isOpeningContrafactual}
                  className="px-3 py-2 rounded-lg bg-slate-900 white:bg-slate-700 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-70"
                >
                  <RefreshCw className={`w-4 h-4 ${isOpeningContrafactual ? "animate-spin" : ""}`} />
                  {isOpeningContrafactual ? "Calculando..." : "Recalcular"}
                </button>
                <button
                  onClick={() => setIsContrafactualOpen(false)}
                  className="p-2 bg-slate-100 white:bg-slate-800 rounded-full hover:bg-slate-200 white:hover:bg-slate-700 transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5 text-slate-500 white:text-slate-400" />
                </button>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-slate-200 white:border-slate-800 bg-slate-50 white:bg-slate-950/40 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 white:text-slate-300">Distancia total: {counterfactualData ? counterfactualData.distance.toFixed(4) : "-"}</span>
              <span>Predicao atual: {counterfactualData ? formatValue(counterfactualData.selected_prediction) : "-"}</span>
              <span>Predicao sugerida: {counterfactualData ? formatValue(counterfactualData.counterfactual_prediction) : "-"}</span>
              <span className="inline-flex items-center gap-1 text-amber-700 white:text-amber-300"><Lock className="w-3.5 h-3.5" /> Campos bloqueados permanecem fixos.</span>
            </div>

            <div className="flex-1 overflow-hidden bg-white white:bg-slate-950 rounded-b-2xl">
              <div className="h-full overflow-auto p-4 md:p-6 custom-scrollbar">
                <div className="overflow-hidden rounded-2xl border border-slate-200 white:border-slate-800 bg-white white:bg-slate-900">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50 white:bg-slate-950">
                      <tr className="border-b border-slate-200 white:border-slate-800">
                        <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-[10px] tracking-wider w-56">Variável</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-[10px] tracking-wider">Paciente</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-[10px] tracking-wider">Sugerido</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-[10px] tracking-wider w-40">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 white:divide-slate-800">
                      {comparisonRows.map((row) => {
                        const statusLabel = row.editable ? (row.changed ? "Sugestão para mudar" : "Sem alteração") : "Bloqueado";
                        return (
                          <tr key={row.id} className={`${row.changed ? "bg-emerald-50/50 white:bg-emerald-950/20" : ""} ${!row.editable ? "bg-slate-50 white:bg-slate-950/40" : ""}`}>
                            <td className="px-4 py-3 align-top">
                              <div className="font-semibold text-slate-800 white:text-slate-100">{row.label}</div>
                              <div className="text-[11px] text-slate-400">{row.id}</div>
                            </td>
                            <td className="px-4 py-3 align-top text-slate-700 white:text-slate-200">{formatValue(row.originalValue)}</td>
                            <td className={`px-4 py-3 align-top font-semibold ${row.changed ? "text-emerald-700 white:text-emerald-300" : "text-slate-500 white:text-slate-300"}`}>
                              {formatValue(row.suggestedValue)}
                            </td>
                            <td className="px-4 py-3 align-top">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${row.editable ? (row.changed ? "bg-emerald-100 text-emerald-800 white:bg-emerald-900/30 white:text-emerald-200" : "bg-slate-100 text-slate-600 white:bg-slate-800 white:text-slate-300") : "bg-amber-100 text-amber-800 white:bg-amber-900/30 white:text-amber-200"}`}>
                                {statusLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {!counterfactualData && (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 white:border-slate-700 p-4 text-sm text-slate-500">
                    Nenhum contrafactual calculado ainda. Clique em Contrafactual para gerar a sugestão.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Simulador;
