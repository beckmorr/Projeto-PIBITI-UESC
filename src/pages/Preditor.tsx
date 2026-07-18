import { useNavigate } from "react-router-dom";
import { ROUTES } from "../constants/navigation";
import logoMedidec from "../assets/medidec_logo.png";
import { useState } from "react";
import { MODELOS_CONFIG } from "../constants/modelsConfig";
import { validarIntegridadeDados } from "../utils/csvValidator";
import { buildApiUrl } from "../utils/api";
import Papa from "papaparse";
import { usePrediction } from "../contexts/PredictionContext";
import {
  montarDadosBaseDoModelo,
  normalizarDadosParaFormulario,
} from "../utils/modelData";

type SectionConfig = {
  title: string;
  description?: string;
  fieldIds: string[];
};

const SECOES_POR_MODELO: Record<string, SectionConfig[]> = {
  mortalidade: [
    {
      title: "Dados básicos",
      description: "Identificação e perfil clínico inicial.",
      fieldIds: ["subject_id", "gender", "age_group", "IMC_range"],
    },
    {
      title: "Nutrição e suporte",
      description: "Variáveis ligadas à evolução nutricional e tempo de UTI.",
      fieldIds: [
        "daysinICU",
        "firstnutrition",
        "avgdaily_KcalKg_firstICU7days",
        "avgdaily_KcalKg_firstNT7days",
        "avgdaily_KcalKg_ICUdays",
        "avgdaily_KcalKg_NTdays",
        "avgdaily_gKg_firstICU7days",
        "avgdaily_gKg_firstNT7days",
        "avgdaily_gKg_ICUdays",
        "avgdaily_gKg_NTdays",
      ],
    },
    {
      title: "Eventos e suporte ventilatório",
      description: "Ocorrências clínicas e intervenções durante a internação.",
      fieldIds: [
        "hightemperature_days",
        "constipation",
        "diarrhea",
        "MV_start",
        "MV_return",
        "MV_weaning",
        "hemodialysis",
        "MV_stay",
      ],
    },
    {
      title: "Marcadores metabólicos e laboratoriais",
      description: "Variáveis laboratoriais e séries de acompanhamento.",
      fieldIds: [
        "FB72H",
        "FB72hvariation",
        "FB72htrend",
        "FBtrend",
        "HGThyper_days",
        "HGThypo_days",
        "noraTo025days",
        "nora025to050days",
        "noraupto050days",
        "norafreedays",
        "vaso_days",
        "high_urea_days",
        "high_creatinine_days",
        "low_totallynpho_days",
        "low_hemoglobine_days",
        "high_bilirubins_days",
        "hypo_albumin_days",
        "high_triglycerides_days",
        "hyper_potassium_days",
        "hypo_potassium_days",
        "hyper_magnesium_days",
        "hypo_magnesium_days",
        "hyper_sodium_days",
        "hypo_sodium_days",
        "hypo_phosphor",
        "max_ast",
        "max_alt",
        "max_alkaline",
      ],
    },
  ],
  vm: [
    {
      title: "Dados básicos",
      description: "Identificação principal do paciente.",
      fieldIds: ["subject_id", "age"],
    },
    {
      title: "Ventilação e parâmetros respiratórios",
      description: "Variáveis usadas para estimar necessidade ventilatória.",
      fieldIds: [
        "pao2_fio2_ratio",
        "peep",
        "fio2",
        "tidal_volume",
        "respiratory_rate",
        "sedation_scale",
      ],
    },
    {
      title: "Achados clínicos complementares",
      description: "Informações adicionais do exame respiratório.",
      fieldIds: ["cuff_leak_test", "secretions_quantity"],
    },
  ],
};

export const Preditor = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const {
    setModeloId: setContextModeloId,
    setDadosPaciente: setContextDadosPaciente,
    setCsvPacientes: setContextCsvPacientes,
    setPacienteSelecionadoId: setContextPacienteSelecionadoId,
    setOriginalData,
    setCondutaData,
    limparDados,
  } = usePrediction();

  const modelos = [
    { id: "", nome: "Selecione um modelo..." },
    { id: "mortalidade", nome: "Mortalidade Hospitalar" },
    { id: "vm", nome: "Necessidade de Ventilação Mecânica" },
  ];

  const [selecionado, setSelecionado] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  
  // MODIFICAÇÃO: Inicia como true para a tela sempre aparecer inicialmente
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [todosPacientesCsv, setTodosPacientesCsv] = useState<any[]>([]);
  const [pacienteSelecionadoId, setPacienteSelecionadoId] = useState("");

  const selectedModel = MODELOS_CONFIG[selecionado];
  const diasAcompanhamento = selectedModel?.diasDeAcompanhamento ?? 1;

  const normalizarDadosDoSelecionado = (dados: any[]) => {
    if (!selecionado) return dados;
    return normalizarDadosParaFormulario(dados, selecionado);
  };

  const renderCampoDiario = (campo: { id: string; label: string; type: "number" | "select" }) => (
    <div key={campo.id} className="mx-auto w-full max-w-[360px] rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {campo.label}
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 justify-items-start">
        {Array.from({ length: diasAcompanhamento }, (_, index) => {
          const dia = index + 1;
          const fieldKey = `${campo.id}_dia_${dia}`;
          const valorAtual = formData[fieldKey] ?? "";

          return (
            <div key={fieldKey} className="space-y-1 w-full max-w-[105px]">
              <span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                Dia {dia}
              </span>

              {campo.type === "select" ? (
                <select
                  value={valorAtual}
                  onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                  className="w-full p-1.5 border border-slate-200 rounded-md text-[11px] focus:ring-2 focus:ring-green-500 outline-none bg-white"
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                </select>
              ) : (
                <input
                  type="number"
                  placeholder="0"
                  value={valorAtual}
                  onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                  className="w-full p-1.5 border border-slate-200 rounded-md text-[11px] focus:ring-2 focus:ring-green-500 outline-none bg-white"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !selecionado) return;

  const extensao = file.name.split('.').pop()?.toLowerCase();

  const processarResultados = (dados: any[]) => {
    if (dados.length === 0) return;

    const colunasDetectadas = Object.keys(dados[0]);
    const { valido, faltantes = [] } = validarIntegridadeDados(colunasDetectadas, selecionado);

    if (!valido) {
      alert(`Erro de Compatibilidade!\n\nCampos faltando: ${faltantes.join(", ")}`);
      setArquivo(null);
      setContextCsvPacientes([]);
      setContextPacienteSelecionadoId("");
      e.target.value = "";
    } else {
      const dadosParaFormulario = normalizarDadosDoSelecionado(dados);
      setTodosPacientesCsv(dadosParaFormulario);
      setContextCsvPacientes(
        dadosParaFormulario.map((paciente) =>
          selectedModel ? montarDadosBaseDoModelo(paciente, selectedModel) : paciente,
        ),
      );
      setArquivo(file);
      
      const primeiroPaciente = dadosParaFormulario[0];
      const primeiroId = primeiroPaciente["subject_id"] || "1";
      
      setPacienteSelecionadoId(String(primeiroId));
      setContextPacienteSelecionadoId(String(primeiroId));
      setFormData(primeiroPaciente);
      setIsPanelOpen(true);
    }
  };

  if (extensao === 'json') {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = event.target?.result as string;
        if (!jsonContent || jsonContent.trim().length === 0) {
          throw new Error("Arquivo JSON vazio");
        }
        
        const json = JSON.parse(jsonContent);
        
        if (json === null || json === undefined) {
          throw new Error("Arquivo JSON contém valor nulo");
        }
        
        let dadosFormatados = Array.isArray(json) ? json : [json];
        
        if (dadosFormatados.length === 0) {
          throw new Error("Arquivo JSON não contém dados");
        }
        
        // Normaliza formato aninhado para format plano (se aplicável)
        dadosFormatados = normalizarDadosDoSelecionado(dadosFormatados);
        
        processarResultados(dadosFormatados);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
        alert(`Erro ao ler o arquivo JSON!\n\nDetalhes: ${errorMessage}\n\nEnsure o arquivo está em formato válido (array de objetos ou um único objeto).`);
        setArquivo(null);
        setContextCsvPacientes([]);
        e.target.value = "";
      }
    };
    reader.onerror = () => {
      alert("Erro ao carregar o arquivo JSON. Certifique-se de que o arquivo é acessível.");
      e.target.value = "";
    };
    reader.readAsText(file);
  } else if (extensao === 'csv') {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        processarResultados(results.data);
      },
      error: (error: any) => {
        alert(`Erro ao ler o arquivo CSV: ${error.message}`);
        e.target.value = "";
      },
    });
  } else {
    alert("Formato de arquivo não suportado. Use .csv ou .json");
    e.target.value = "";
  }
};

  const handleTrocaPaciente = (id: string) => {
    setPacienteSelecionadoId(id);
    setContextPacienteSelecionadoId(id);
    const pacienteEncontrado = todosPacientesCsv.find((p) => p["subject_id"] === id);
    if (pacienteEncontrado) {
      setFormData(pacienteEncontrado);
    }
  };

  const handlePredict = async () => {
    if (!selecionado) return;
    setIsLoading(true);
    try {
      const dadosBase = selectedModel ? montarDadosBaseDoModelo(formData, selectedModel) : formData;
      const response = await fetch(buildApiUrl(`/predict/${selecionado}?tipo_analise=original`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dados: dadosBase,
          janela: selectedModel?.diasDeAcompanhamento ?? "default",
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erro na comunicação com o servidor");
      }
      const resultado = await response.json();

      setContextModeloId(selecionado);
      setContextDadosPaciente(dadosBase);
      setOriginalData({ ...resultado, modeloId: selecionado, dadosPaciente: dadosBase });
      setCondutaData({ ...resultado, modeloId: selecionado, dadosPaciente: dadosBase });
      navigate(ROUTES.visualizar);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro ao realizar predição: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }

  const isModeloSelected = selecionado !== "";
  const selectedMetadata = selectedModel?.metadados;
  const secoesFormulario = SECOES_POR_MODELO[selecionado] ?? [];
  const camposPorId = new Map(selectedModel?.campos.map((campo) => [campo.id, campo]));

  const selectedSummary = selectedMetadata?.descricaoBreve
    || "Selecione um modelo para visualizar uma breve explicacao e as metricas de desempenho.";

  const selectedPerformance = selectedMetadata?.metricas;

  return (
    <div className="flex flex-col items-center p-8 mt-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      <div className="grid gap-8 transition-all duration-500 w-full grid-cols-1 lg:grid-cols-[300px_1fr] items-start">
        
        {/* COLUNA ESQUERDA: CONTROLES PRINCIPAIS */}
        <div className="flex flex-col items-center bg-white white:bg-slate-900 p-8 rounded-3xl border border-slate-200 white:border-slate-800 shadow-sm h-fit">
          <img src={logoMedidec} alt="Logo" className="w-20 h-20 mb-4 object-contain drop-shadow-lg" />
          <h1 className="text-4xl mb-8 text-emerald-900 white:text-emerald-400 tracking-tight">
            <span className="font-bold">Medi</span><span className="font-light">Dec</span>
          </h1>

          <div className="w-full mb-6 text-left">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Selecione o modelo de predição
            </label>
            <select
              value={selecionado}
              onChange={(e) => {
                setSelecionado(e.target.value);
                setFormData({});
                setArquivo(null);
                setTodosPacientesCsv([]);
                setContextCsvPacientes([]);
                setContextPacienteSelecionadoId("");
                limparDados();
              }}
              className="w-full p-3 bg-white white:bg-slate-800 border border-slate-200 white:border-slate-700 rounded-xl shadow-sm text-slate-700 focus:ring-2 focus:ring-green-500 outline-none transition-all cursor-pointer"
            >
              {modelos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <button
              disabled={!isModeloSelected}
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className={`w-full p-3 rounded-xl font-medium transition-all ${
                isModeloSelected 
                  ? "bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-200" 
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isPanelOpen ? "Ocultar dados do paciente" : "Inserir dados manualmente"}
            </button>

            <div className="relative">
              <input type="file" accept=".csv,.json" onChange={handleFileChange} disabled={!isModeloSelected} className="hidden" id="file-upload" />
              <label
                htmlFor={isModeloSelected ? "file-upload" : ""}
                className={`flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                  isModeloSelected ? "bg-slate-50 border-slate-300 hover:border-blue-400 text-slate-600" : "bg-slate-50/50 border-slate-200 text-slate-300 cursor-not-allowed"
                }`}
              >
                {arquivo ? "Arquivo Carregado (Trocar)" : "Carregar arquivo"}
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white white:bg-slate-900 rounded-3xl border border-slate-200 white:border-slate-800 shadow-sm p-6 md:p-8 h-fit">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 white:text-white text-center mb-4">
            Breve explicação do modelo
          </h2>

          <p className="text-slate-600 white:text-slate-300 text-sm md:text-base mb-6 leading-relaxed">
            {selectedSummary}
          </p>

          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-slate-200 white:border-slate-700 bg-slate-50 white:bg-slate-800 p-3 flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Desempenho geral</p>
              <p className="text-lg md:text-xl font-bold text-emerald-700 white:text-emerald-400">
                {selectedPerformance?.desempenhoGeral || "-"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 white:border-slate-700 bg-slate-50 white:bg-slate-800 p-3 flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Precisão</p>
              <p className="text-lg md:text-xl font-bold text-emerald-700 white:text-emerald-400">
                {selectedPerformance?.precisao || "-"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 white:border-slate-700 bg-slate-50 white:bg-slate-800 p-3 flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">AUCR</p>
              <p className="text-lg md:text-xl font-bold text-emerald-700 white:text-emerald-400">
                {selectedPerformance?.aucr || "-"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 white:border-slate-700 bg-slate-50 white:bg-slate-800 p-3 flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">TFP</p>
              <p className="text-lg md:text-xl font-bold text-emerald-700 white:text-emerald-400">
                {selectedPerformance?.tfp || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTAINER DE DADOS DO PACIENTE (MOVIDO PARA BAIXO) */}
      {isPanelOpen && (
        <div className="mx-auto mt-6 w-full max-w-[1080px] bg-white white:bg-slate-900 rounded-3xl border border-slate-200 white:border-slate-800 shadow-2xl flex flex-col h-fit max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom duration-500">
          <div className="p-6 border-b border-slate-100 white:border-slate-800 flex justify-between items-center bg-slate-50 white:bg-slate-950">
            <div>
              <h2 className="text-xl font-bold text-slate-800 white:text-white">
                {arquivo ? "Dados Importados do CSV" : "Inserir Dados do Paciente"}
              </h2>
              <p className="text-sm text-green-600 font-medium">
                {MODELOS_CONFIG[selecionado]?.nome || "Selecione um modelo"}
              </p>
            </div>
            <button onClick={() => setIsPanelOpen(false)} className="text-slate-400 hover:text-red-500 text-3xl leading-none">&times;</button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50/30">
            {arquivo && todosPacientesCsv.length > 0 && (
              <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-4">
                <div className="flex-1 text-left">
                  <label className="block text-xs font-bold text-green-800 uppercase mb-1">Selecionar ID do Paciente</label>
                  <select
                    value={pacienteSelecionadoId}
                    onChange={(e) => handleTrocaPaciente(e.target.value)}
                    className="w-full p-2 bg-white border border-green-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400"
                  >
                    {todosPacientesCsv.map((p, idx) => (
                      <option key={idx} value={p["subject_id"] || idx}>Paciente ID: {p["subject_id"] || idx}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {secoesFormulario.map((secao) => (
                <section key={secao.title} className="mx-auto w-full max-w-[680px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 bg-slate-100 border-b border-slate-200">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">{secao.title}</h3>
                    {secao.description && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{secao.description}</p>
                    )}
                  </div>

                  <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-3 justify-items-center">
                    {secao.fieldIds.map((fieldId) => {
                      const campo = camposPorId.get(fieldId);

                      if (!campo) {
                        return null;
                      }

                      const commonInputClasses = "w-full max-w-[140px] p-1.5 border border-slate-200 rounded-md text-[11px] focus:ring-2 focus:ring-green-500 outline-none bg-white";

                      if (selectedModel?.id === "vm" && campo.categoria === "diario") {
                        return renderCampoDiario(campo);
                      }

                      const valorAtual = formData[campo.id] ?? "";

                      return (
                        <div key={campo.id} className="mx-auto w-full max-w-[360px] rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                            {campo.label}
                          </label>

                          {campo.type === "select" ? (
                            <select
                              value={valorAtual}
                              onChange={(e) => setFormData({ ...formData, [campo.id]: e.target.value })}
                              className={commonInputClasses}
                            >
                              <option value="0">0</option>
                              <option value="1">1</option>
                            </select>
                          ) : (
                            <input
                              type="number"
                              placeholder="0"
                              value={valorAtual}
                              onChange={(e) => setFormData({ ...formData, [campo.id]: e.target.value })}
                              className={commonInputClasses}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-white">
            <button
              onClick={handlePredict}
              disabled={isLoading || !isModeloSelected}
              className={`mx-auto flex w-full max-w-[320px] justify-center items-center gap-2 py-4 font-bold rounded-2xl shadow-lg transition-all ${
                isLoading ? "bg-slate-400 cursor-wait" : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {isLoading ? "Processando IA..." : "Iniciar Predição"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};