import logoMedidec from "../assets/medidec_logo.png";
import React, { useState } from "react";
import { MODELOS_CONFIG } from "../constants/modelsConfig";
import { validarIntegridadeCSV } from "../utils/csvValidator";
import { buildApiUrl } from "../utils/api";
import Papa from "papaparse";
import { usePrediction } from "../contexts/PredictionContext";

export const Home = () => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    setModeloId: setContextModeloId,
    setDadosPaciente: setContextDadosPaciente,
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

  const expandirDadosParaDias = (dadosPaciente: any, modeloId: string) => {
    const config = MODELOS_CONFIG[modeloId];
    if (!config || !dadosPaciente) return {};
    const dadosFormatados: Record<string, any> = { ...dadosPaciente };
    config.campos.forEach((campo) => {
      if (campo.categoria === "diario") {
        const valorBase = dadosPaciente[campo.id];
        if (valorBase !== undefined && valorBase !== "") {
          for (let i = 1; i <= config.diasDeAcompanhamento; i++) {
            const chaveDia = `${campo.id}_dia_${i}`;
            if (!dadosFormatados[chaveDia]) {
              dadosFormatados[chaveDia] = valorBase;
            }
          }
        }
      }
    });
    return dadosFormatados;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selecionado) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        const colunasNoCSV = results.meta.fields || [];
        const { valido, faltantes = [] } = validarIntegridadeCSV(colunasNoCSV, selecionado);

        if (!valido) {
          alert(`Erro de Compatibilidade!\n\nColunas faltando: ${faltantes.join(", ")}`);
          setArquivo(null);
          e.target.value = "";
        } else {
          const dados = results.data;
          if (dados.length > 0) {
            setTodosPacientesCsv(dados);
            setArquivo(file);
            const primeiroPaciente = dados[0];
            const primeiroId = primeiroPaciente["subject_id"] || "1";
            setPacienteSelecionadoId(primeiroId);
            setFormData(expandirDadosParaDias(primeiroPaciente, selecionado));
            setIsPanelOpen(true); 
          }
        }
      },
    });
  };

  const handleTrocaPaciente = (id: string) => {
    setPacienteSelecionadoId(id);
    const pacienteEncontrado = todosPacientesCsv.find((p) => p["subject_id"] === id);
    if (pacienteEncontrado) {
      setFormData(expandirDadosParaDias(pacienteEncontrado, selecionado));
    }
  };

  const handlePredict = async () => {
    if (!selecionado) return;
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl(`/predict/${selecionado}?tipo_analise=original`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Erro na comunicação com o servidor");
      const resultado = await response.json();

      setContextModeloId(selecionado);
      setContextDadosPaciente(formData);
      setOriginalData({ ...resultado, modeloId: selecionado, dadosPaciente: formData });
      setCondutaData({ ...resultado, modeloId: selecionado, dadosPaciente: formData });
    } catch (error) {
      console.error(error);
      alert("Erro ao realizar predição.");
    } finally {
      setIsLoading(false);
    }
  }

  const isModeloSelected = selecionado !== "";
  const selectedModel = MODELOS_CONFIG[selecionado];
  const selectedMetadata = selectedModel?.metadados;

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
              <input type="file" accept=".csv" onChange={handleFileChange} disabled={!isModeloSelected} className="hidden" id="file-upload" />
              <label
                htmlFor={isModeloSelected ? "file-upload" : ""}
                className={`flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                  isModeloSelected ? "bg-slate-50 border-slate-300 hover:border-blue-400 text-slate-600" : "bg-slate-50/50 border-slate-200 text-slate-300 cursor-not-allowed"
                }`}
              >
                {arquivo ? "Arquivo Carregado (Trocar)" : "Carregar arquivo CSV"}
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
        <div className="w-full mt-6 bg-white white:bg-slate-900 rounded-3xl border border-slate-200 white:border-slate-800 shadow-2xl flex flex-col h-fit max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom duration-500">
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

            <table className="w-full text-left border-collapse bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-slate-100">
                  <td colSpan={2} className="p-2 text-[10px] font-bold uppercase text-slate-500 pl-4">Campos Únicos</td>
                </tr>
                {MODELOS_CONFIG[selecionado]?.campos
                  .filter((c) => c.categoria === "unico")
                  .map((campo) => (
                    <tr key={campo.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-sm text-slate-700 font-medium pl-4">{campo.label}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          placeholder="0"
                          value={formData[campo.id] || ""}
                          onChange={(e) => setFormData({ ...formData, [campo.id]: e.target.value })}
                          className="w-32 p-2 text-center border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                        />
                      </td>
                    </tr>
                  ))}

                <tr className="bg-slate-100">
                  <td colSpan={2} className="p-2 text-[10px] font-bold uppercase text-slate-500 pl-4">
                    Acompanhamento Diário ({MODELOS_CONFIG[selecionado]?.diasDeAcompanhamento || 0} dias)
                  </td>
                </tr>
                {MODELOS_CONFIG[selecionado]?.campos
                  .filter((c) => c.categoria === "diario")
                  .map((campo) => (
                    <tr key={campo.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-sm text-slate-700 font-medium pl-4">{campo.label}</td>
                      <td className="p-3">
                        <div className="flex gap-2 overflow-x-auto pb-2 max-w-[400px] custom-scrollbar">
                          {Array.from({ length: MODELOS_CONFIG[selecionado].diasDeAcompanhamento }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-1 min-w-[70px]">
                              <span className="text-[9px] text-slate-400 font-bold text-center">DIA {i + 1}</span>
                              <input
                                type="number"
                                value={formData[`${campo.id}_dia_${i + 1}`] || ""}
                                onChange={(e) => setFormData({ ...formData, [`${campo.id}_dia_${i + 1}`]: e.target.value })}
                                className="w-full p-2 text-center border border-slate-200 rounded-md text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-slate-100 bg-white">
            <button
              onClick={handlePredict}
              disabled={isLoading || !isModeloSelected}
              className={`w-full py-4 font-bold rounded-2xl shadow-lg flex justify-center items-center gap-2 transition-all ${
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