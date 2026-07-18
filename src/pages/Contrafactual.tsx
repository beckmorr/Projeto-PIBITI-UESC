import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { usePrediction } from "../contexts/PredictionContext";
import { MODELOS_CONFIG } from "../constants/modelsConfig";
import { buildApiUrl } from "../utils/api";
import { ROUTES } from "../constants/navigation";

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

export const Contrafactual = () => {
  const navigate = useNavigate();
  const {
    modeloId,
    dadosPaciente: contextDadosPaciente,
    csvPacientes,
    isModeloCarregado,
    setCondutaData,
  } = usePrediction();

  const [isLoadingContrafactual, setIsLoadingContrafactual] = useState(true);
  const [counterfactualData, setCounterfactualData] = useState<CounterfactualResponse | null>(null);
  const [editedCounterfactualValues, setEditedCounterfactualValues] = useState<Record<string, any>>({});

  // Executa o cálculo automaticamente ao montar a página
  useEffect(() => {
    if (isModeloCarregado && modeloId && csvPacientes && csvPacientes.length > 0) {
      const executarCalculoAutomatico = async () => {
        setIsLoadingContrafactual(true);
        try {
          const modelo = MODELOS_CONFIG[modeloId];
          const immutableColumns = modelo.campos
            .filter((campo) => campo.editavel === false)
            .map((campo) => campo.id);

          const response = await fetch(buildApiUrl(`/counterfactual/${modelo.id}`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rows: csvPacientes,
              selected_row: contextDadosPaciente,
              protected_columns: immutableColumns,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Nao foi possivel calcular o contrafactual.");
          }

          const result: CounterfactualResponse = await response.json();
          setCounterfactualData(result);
          setEditedCounterfactualValues(result.counterfactual ?? {});
        } catch (error) {
          console.error(error);
          const message = error instanceof Error ? error.message : "Erro desconhecido";
          alert(`Erro ao calcular contrafactual: ${message}`);
        } finally {
          setIsLoadingContrafactual(false);
        }
      };

      executarCalculoAutomatico();
    }
  }, [isModeloCarregado, modeloId, csvPacientes, contextDadosPaciente]);

  if (!isModeloCarregado || !modeloId) return <Navigate to="/preditor" replace />;

  const modelo = MODELOS_CONFIG[modeloId];
  if (!modelo) return <Navigate to="/preditor" replace />;

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "number" && Number.isFinite(value)) return value.toString();
    return String(value);
  };

  const comparisonRows = modelo.campos.map((campo) => {
    const originalValue = contextDadosPaciente?.[campo.id] ?? "-";
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

  const changedEditableRows = comparisonRows.filter((row) => row.editable && row.changed);

  const handleEditedValueChange = (fieldId: string, value: string) => {
    setEditedCounterfactualValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleNovaPredicao = async () => {
    if (!counterfactualData) return;

    const adjustedPatientData = {
      ...contextDadosPaciente,
      ...editedCounterfactualValues,
    };

    try {
      const response = await fetch(buildApiUrl(`/predict/${modelo.id}?tipo_analise=conduta`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dados: adjustedPatientData,
          janela: "contrafactual",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Nao foi possivel calcular a nova predicao.");
      }

      const result = await response.json();
      setCondutaData({
        ...result,
        modeloId: modelo.id,
        dadosPaciente: adjustedPatientData,
        tipo_analise: "conduta",
      });

      navigate(ROUTES.visualizar, { state: { focusAjustado: true } });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro ao gerar nova predição: ${message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 transition-colors duration-300">
      {/* Barra superior de navegação fixa */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Contrafactual</h2>
              <p className="text-xs text-slate-400">Compare o dado atual com a sugestao que tenta inverter o desfecho.</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleNovaPredicao}
                disabled={isLoadingContrafactual || !counterfactualData}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-70 transition-colors hover:bg-slate-800"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingContrafactual ? "animate-spin" : ""}`} />
                Nova predição
              </button>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Corpo principal da página */}
      <div className="container mx-auto px-6 py-6">
        {isLoadingContrafactual ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium text-slate-500">Buscando combinacoes contrafactuais do paciente...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Distancia total: {counterfactualData ? counterfactualData.distance.toFixed(4) : "-"}</span>
              <span>Predicao atual: {counterfactualData ? formatValue(counterfactualData.selected_prediction) : "-"}</span>
              <span>Predicao sugerida: {counterfactualData ? formatValue(counterfactualData.counterfactual_prediction) : "-"}</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">Mostrando apenas variaveis alteradas.</span>
            </div>

            <div className="p-6">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-[10px] tracking-wider w-56">Variavel</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-[10px] tracking-wider">Dado</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-[10px] tracking-wider">Sugerido</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-[10px] tracking-wider w-40">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {changedEditableRows.map((row) => {
                      const currentEditedValue = editedCounterfactualValues[row.id] ?? row.suggestedValue;
                      return (
                        <tr key={row.id} className="bg-emerald-50/30 hover:bg-emerald-50/50 transition-colors">
                          <td className="px-4 py-3 align-top">
                            <div className="font-semibold text-slate-800">{row.label}</div>
                            <div className="text-[11px] text-slate-400">{row.id}</div>
                          </td>
                          <td className="px-4 py-3 align-top text-slate-700">{formatValue(row.originalValue)}</td>
                          <td className="px-4 py-3 align-top font-semibold text-emerald-700">
                            <input
                              type="text"
                              value={formatValue(currentEditedValue)}
                              onChange={(event) => handleEditedValueChange(row.id, event.target.value)}
                              className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm text-slate-800 outline-none transition-colors focus:border-emerald-500 shadow-sm"
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              Sugestao para mudar
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {counterfactualData && changedEditableRows.length === 0 && (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  Nenhuma variavel editavel precisou ser alterada para inverter o desfecho deste caso.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contrafactual;