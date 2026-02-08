import logoMedidec from "../assets/medidec_logo.png";
import React, { useState, useMemo } from "react";
import { MODELOS_CONFIG } from "../constants/modelsConfig";
import { validarIntegridadeCSV } from "../utils/csvValidator";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";

export const Home = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const modelos = [
    { id: "", nome: "Selecione um modelo..." },
    { id: "mortalidade", nome: "Mortalidade Hospitalar" },
    { id: "vm", nome: "Necessidade de Ventilação Mecânica" },
  ];

  const [selecionado, setSelecionado] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        const { valido, faltantes = [] } = validarIntegridadeCSV(
          colunasNoCSV,
          selecionado,
        );

        if (!valido) {
          alert(
            `Erro de Compatibilidade!\n\n` +
              `O CSV não possui as colunas necessárias para o modelo "${MODELOS_CONFIG[selecionado].nome}".\n` +
              `Colunas faltando: ${faltantes.join(", ")}`,
          );
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
            const dadosExpandidos = expandirDadosParaDias(
              primeiroPaciente,
              selecionado,
            );
            setFormData(dadosExpandidos);

            setIsModalOpen(true);
          }
        }
      },
      error: (error: Papa.ParseError) => {
        console.error("Erro ao ler o arquivo:", error);
        alert("Erro ao processar o arquivo CSV.");
      },
    });
  };

  const handleTrocaPaciente = (id: string) => {
    setPacienteSelecionadoId(id);
    const pacienteEncontrado = todosPacientesCsv.find(
      (p) => p["subject_id"] === id,
    );

    if (pacienteEncontrado) {
      const dadosExpandidos = expandirDadosParaDias(
        pacienteEncontrado,
        selecionado,
      );
      setFormData(dadosExpandidos);
    }
  };

  const handlePredict = async () => {
    if (!selecionado) return;
    setIsLoading(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/predict/${selecionado}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      if (!response.ok) {
        throw new Error("Erro na comunicação com o servidor");
      }

      const resultado = await response.json();

      navigate("/predicao", {
        state: {
          probabilidade: resultado.probabilidade,
          modeloId: selecionado,
          dadosPaciente: formData,
        },
      });
    } catch (error) {
      console.error(error);
      alert(
        "Erro ao realizar predição. Verifique se o backend Python está rodando.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const listaIdsPacientes = useMemo(() => {
    return todosPacientesCsv
      .map((p) => p["subject_id"])
      .filter((id) => id !== undefined && id !== "");
  }, [todosPacientesCsv]);

  const isModeloSelected = selecionado !== "";

  return (
    <div className="flex flex-col items-center p-8 mt-10 animate-in fade-in duration-500">
      <img
        src={logoMedidec}
        alt="Logo MediDec"
        className="w-24 h-24 mb-4 object-contain drop-shadow-lg"
      />
      <h1 className="text-4xl mb-8 text-emerald-900 white:text-emerald-400 tracking-tight transition-colors">
        <span className="font-bold">Medi</span>
        <span className="font-light">Dec</span>
      </h1>

      <div className="w-full max-w-xs mb-6">
        <label className="block text-xs font-semibold text-slate-500 white:text-slate-400 uppercase tracking-wider mb-2 ml-1">
          Selecione o modelo de predição
        </label>
        <select
          value={selecionado}
          onChange={(e) => {
            setSelecionado(e.target.value);
            setFormData({});
            setArquivo(null);
            setTodosPacientesCsv([]);
          }}
          className="w-full p-3 bg-white white:bg-slate-800 border border-slate-200 white:border-slate-700 rounded-xl shadow-sm text-slate-700 white:text-slate-200 focus:ring-2 focus:ring-green-500 outline-none cursor-pointer appearance-none transition-colors"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='C19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 1rem center",
            backgroundSize: "1.5em",
          }}
        >
          {modelos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          disabled={!isModeloSelected}
          onClick={() => {
            setArquivo(null);
            setTodosPacientesCsv([]);
            setIsModalOpen(true);
          }}
          className={`w-full p-3 rounded-xl font-medium transition-all ${
            isModeloSelected
              ? "bg-green-600 text-white hover:bg-green-800 shadow-md shadow-green-200 white:shadow-none"
              : "bg-slate-100 white:bg-slate-800 text-slate-400 white:text-slate-600 cursor-not-allowed"
          }`}
        >
          Inserir dados manualmente
        </button>

        <div className="relative">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={!isModeloSelected}
            className="hidden"
            id="file-upload"
            onClick={(e) => (e.currentTarget.value = "")}
          />
          <label
            htmlFor={isModeloSelected ? "file-upload" : ""}
            className={`flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed rounded-xl transition-all ${
              isModeloSelected
                ? "bg-slate-50 white:bg-slate-900 border-slate-300 white:border-slate-700 cursor-pointer hover:bg-slate-100 white:hover:bg-slate-800 hover:border-blue-400 text-slate-600 white:text-slate-300"
                : "bg-slate-50 white:bg-slate-900/50 border-slate-200 white:border-slate-800 text-slate-300 white:text-slate-600 cursor-not-allowed"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            {arquivo ? "Arquivo Carregado (Trocar)" : "Carregar arquivo CSV"}
          </label>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white white:bg-slate-900 w-fit max-w-[95vw] min-w-[600px] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200 white:border-slate-800">
            <div className="p-6 border-b border-slate-100 white:border-slate-800 flex justify-between items-center bg-slate-50 white:bg-slate-950 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-slate-800 white:text-white">
                  {arquivo
                    ? "Dados Importados do CSV"
                    : "Inserir Dados do Paciente"}
                </h2>
                <p className="text-sm text-green-600 white:text-green-400 font-medium">
                  {MODELOS_CONFIG[selecionado]?.nome}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 white:hover:text-slate-200 text-3xl leading-none transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50/30 white:bg-slate-900/50 max-h-[60vh] relative custom-scrollbar">
              {arquivo && todosPacientesCsv.length > 0 && (
                <div className="mb-6 p-4 bg-green-50 white:bg-green-900/20 border border-green-100 white:border-green-800 rounded-xl flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-green-800 white:text-green-300 uppercase mb-1">
                      Selecionar ID do Paciente
                    </label>
                    <select
                      value={pacienteSelecionadoId}
                      onChange={(e) => handleTrocaPaciente(e.target.value)}
                      className="w-full p-2 bg-white white:bg-slate-800 border border-green-200 white:border-green-800 rounded-lg text-sm text-slate-700 white:text-slate-200 focus:ring-2 focus:ring-green-400 outline-none"
                    >
                      {listaIdsPacientes.map((id) => (
                        <option key={id} value={id}>
                          Paciente ID: {id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-xs text-green-600 white:text-green-400 font-medium px-2">
                    {todosPacientesCsv.length} pacientes encontrados
                  </div>
                </div>
              )}

              <table className="w-full text-left border-collapse bg-white white:bg-slate-900 border border-slate-200 white:border-slate-800 shadow-sm rounded-lg overflow-hidden">
                <tbody className="divide-y divide-slate-100 white:divide-slate-800">
                  <tr className="bg-slate-100 white:bg-slate-800">
                    <td
                      colSpan={2}
                      className="p-2 text-[10px] font-bold uppercase text-slate-500 white:text-slate-400 pl-4"
                    >
                      Campos Únicos
                    </td>
                  </tr>
                  {MODELOS_CONFIG[selecionado]?.campos
                    .filter((c) => c.categoria === "unico")
                    .map((campo) => (
                      <tr
                        key={campo.id}
                        className="hover:bg-slate-50 white:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="p-3 text-sm text-slate-700 white:text-slate-300 font-medium pl-4">
                          {campo.label}
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            placeholder="0"
                            value={formData[campo.id] || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [campo.id]: e.target.value,
                              })
                            }
                            className="w-32 p-2 text-center border border-slate-200 white:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all shadow-sm bg-white white:bg-slate-800 white:text-white"
                          />
                        </td>
                      </tr>
                    ))}

                  <tr className="bg-slate-100 white:bg-slate-800">
                    <td
                      colSpan={2}
                      className="p-2 text-[10px] font-bold uppercase text-slate-500 white:text-slate-400 pl-4"
                    >
                      Acompanhamento Diário (
                      {MODELOS_CONFIG[selecionado]?.diasDeAcompanhamento} dias)
                    </td>
                  </tr>

                  {MODELOS_CONFIG[selecionado]?.campos
                    .filter((c) => c.categoria === "diario")
                    .map((campo) => (
                      <tr
                        key={campo.id}
                        className="hover:bg-slate-50 white:hover:bg-slate-800/50 transition-colors border-b border-slate-100 white:border-slate-800"
                      >
                        <td className="p-3 text-sm text-slate-700 white:text-slate-300 font-medium align-middle min-w-[180px] pl-4">
                          {campo.label}
                        </td>

                        <td className="p-3">
                          <div className="overflow-x-auto pb-2 custom-scrollbar">
                            <div
                              className="grid gap-2"
                              style={{
                                gridTemplateColumns: `repeat(${MODELOS_CONFIG[selecionado].diasDeAcompanhamento}, minmax(70px, 1fr))`,
                              }}
                            >
                              {Array.from({
                                length:
                                  MODELOS_CONFIG[selecionado]
                                    ?.diasDeAcompanhamento || 0,
                              }).map((_, index) => {
                                const diaId = `${campo.id}_dia_${index + 1}`;
                                return (
                                  <div
                                    key={index}
                                    className="flex flex-col gap-1"
                                  >
                                    <span className="text-[9px] text-slate-400 white:text-slate-500 font-bold text-center uppercase">
                                      Dia {index + 1}
                                    </span>
                                    <input
                                      type="number"
                                      placeholder="-"
                                      value={formData[diaId] || ""}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          [diaId]: e.target.value,
                                        })
                                      }
                                      className="w-full p-2 text-center border border-slate-200 white:border-slate-700 rounded-md text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all bg-white white:bg-slate-800 white:text-white"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-slate-100 white:border-slate-800 bg-white white:bg-slate-900 rounded-b-2xl">
              <button
                onClick={handlePredict}
                disabled={isLoading}
                className={`w-full py-4 font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] flex justify-center items-center gap-2
                  ${
                    isLoading
                      ? "bg-slate-400 white:bg-slate-700 cursor-wait text-slate-200"
                      : "bg-green-600 hover:bg-green-700 text-white shadow-green-200 white:shadow-none"
                  }`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processando IA...
                  </>
                ) : (
                  "Iniciar Predição"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
