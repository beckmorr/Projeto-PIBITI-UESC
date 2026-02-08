import { useState } from "react";
import {
  Activity,
  BarChart2,
  Save,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  Copy,
} from "lucide-react";

import { MODELOS_CONFIG } from "../constants/modelsConfig";

const MOCK_METRICS = {
  acuraciaTreino: "90.0%",
  acuraciaTeste: "86.7%",
  aucTreino: "0.952",
  aucTeste: "0.907",
};

const MOCK_SHAP = [
  {
    variavel: "Nutrição Precoce",
    score: 0.198,
    contrib: 0.145,
    direction: "up",
  },
  {
    variavel: "Kcal/Kg (Primeiros 7 dias)",
    score: 0.167,
    contrib: 0.123,
    direction: "up",
  },
  {
    variavel: "g/Kg (Primeiros 7 dias)",
    score: 0.134,
    contrib: 0.098,
    direction: "up",
  },
  {
    variavel: "Dias Livres de Nora",
    score: 0.112,
    contrib: 0.076,
    direction: "up",
  },
];

export const Prediction = () => {
  const [activeTab, setActiveTab] = useState<"original" | "conduta">(
    "original",
  );

  const isConduta = activeTab === "conduta";

  const modeloId = "mortalidade";
  const modelo = MODELOS_CONFIG[modeloId];

  const diasReais = modelo?.diasDeAcompanhamento || 7;
  const diasExtras = modelo?.diasAdicionais || 0;

  const totalDiasExibicao = isConduta ? diasReais + diasExtras : diasReais;

  const arrayDias = Array.from({ length: totalDiasExibicao }, (_, i) => i + 1);

  const camposUnicos =
    modelo?.campos.filter((c) => c.categoria === "unico") || [];
  const camposDiarios =
    modelo?.campos.filter((c) => c.categoria === "diario") || [];

  const [patientData, setPatientData] = useState<Record<string, any>>({});

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* 1. HEADER DAS ABAS (Mantido igual) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("original")}
              className={`py-4 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === "original"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setActiveTab("conduta")}
              className={`py-4 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "conduta"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Simular Conduta{" "}
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                Editável
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* === COLUNA DA ESQUERDA: DESEMPENHO E SHAP (Mantida 100% igual) === */}
          <div className="lg:col-span-4 space-y-6">
            {/* CARD 1: Resultado */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden relative">
              <div
                className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 ${
                  isConduta ? "bg-blue-500" : "bg-emerald-500"
                }`}
              />
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">
                Predição do Modelo
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-4xl font-black text-slate-800">Alta</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                Baseado no modelo de {modelo?.nome}
              </p>
            </div>

            {/* CARD 2: Métricas */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-slate-800 font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  Desempenho do Modelo
                </h3>
                <button className="text-xs text-emerald-600 font-bold hover:underline">
                  Ver Gráficos
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">Acurácia (Treino)</span>
                  <span className="font-mono font-bold text-slate-700">
                    {MOCK_METRICS.acuraciaTreino}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">Acurácia (Teste)</span>
                  <span className="font-mono font-bold text-slate-700">
                    {MOCK_METRICS.acuraciaTeste}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">AUC (Treino)</span>
                  <span className="font-mono font-bold text-slate-700">
                    {MOCK_METRICS.aucTreino}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">AUC (Teste)</span>
                  <span className="font-mono font-bold text-slate-700">
                    {MOCK_METRICS.aucTeste}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: SHAP */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-slate-400" />
                Fatores de Impacto (SHAP)
              </h3>
              <div className="overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Variável</th>
                      <th className="px-3 py-2 text-right">Contribuição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {MOCK_SHAP.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-700 font-medium">
                          {item.variavel}
                        </td>
                        <td className="px-3 py-2 text-right flex items-center justify-end gap-1 text-emerald-600 font-bold">
                          +{item.contrib}
                          <ArrowUpRight className="w-3 h-3" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* === COLUNA DA DIREITA: DADOS DO PACIENTE === */}
          <div className="lg:col-span-8 h-[calc(100vh-10rem)] min-h-[600px]">
            <div
              className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full flex flex-col ${
                isConduta ? "ring-2 ring-blue-100" : ""
              }`}
            >
              {/* Header da Tabela */}
              <div className="flex flex-wrap justify-between items-center mb-6 gap-4 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Dados do Paciente
                  </h3>
                  <p className="text-sm text-slate-400">
                    {isConduta
                      ? "Edite os valores abaixo para simular um novo cenário."
                      : "Visualização dos dados originais importados."}
                  </p>
                </div>

                {isConduta && (
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">
                      <Copy className="w-3 h-3" /> Preencher com valor do dia
                      anterior
                    </button>
                    <button className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">
                      <RefreshCw className="w-3 h-3" /> Preencher com média dos
                      dias
                    </button>
                    <button className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">
                      <RefreshCw className="w-3 h-3" /> Similares
                    </button>
                    <button className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">
                      <RefreshCw className="w-3 h-3" /> DICE
                    </button>
                  </div>
                )}
              </div>

              {/* WRAPPER COM SCROLL VERTICAL */}
              <div className="flex-1 overflow-y-auto pr-2 min-h-0 border-b border-slate-50">
                {/* --- CAMPOS ÚNICOS --- */}
                {camposUnicos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 border-b border-slate-100 pb-6">
                    {camposUnicos.map((campo) => (
                      <div
                        key={campo.id}
                        className="bg-slate-50 p-3 rounded-lg"
                      >
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          {campo.label}
                        </label>
                        <input
                          type="number"
                          disabled={true} // Unique fields are never editable
                          placeholder="-"
                          value={patientData[campo.id] || ""}
                          onChange={(e) =>
                            setPatientData({
                              ...patientData,
                              [campo.id]: e.target.value,
                            })
                          }
                          className={`w-full bg-transparent font-bold text-slate-700 outline-none border-b border-transparent transition-colors`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Tabela de Dados (Matriz Dinâmica) */}
                <div className="overflow-x-auto pb-4">
                  <table className="w-full border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b-2 border-slate-100">
                        <th className="py-3 text-left text-xs font-bold text-slate-400 uppercase w-48 sticky left-0 top-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-30">
                          Variável
                        </th>
                        {arrayDias.map((dia) => {
                          const isExtra = dia > diasReais;
                          return (
                            <th
                              key={dia}
                              className={`py-3 text-center text-xs font-bold uppercase w-20 sticky top-0 bg-white z-20 ${
                                isExtra ? "text-blue-500" : "text-slate-400"
                              }`}
                            >
                              {isExtra ? `+D${dia - diasReais}` : `D${dia}`}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-50">
                      {camposDiarios.map((campo) => (
                        <tr
                          key={campo.id}
                          className="group hover:bg-slate-50/50"
                        >
                          <td className="py-4 text-sm font-bold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10 w-48">
                            {campo.label}
                          </td>

                          {arrayDias.map((dia) => {
                            const diaId = `${campo.id}_dia_${dia}`;
                            const isExtra = dia > diasReais;

                            return (
                              <td
                                key={dia}
                                className={`p-2 text-center w-20 ${
                                  isExtra ? "bg-blue-50/10" : ""
                                }`}
                              >
                                <input
                                  type="number"
                                  disabled={!isConduta || !isExtra} // Only allow editing if conduta mode AND is extra day
                                  value={patientData[diaId] || ""}
                                  onChange={(e) =>
                                    setPatientData({
                                      ...patientData,
                                      [diaId]: e.target.value,
                                    })
                                  }
                                  className={`w-full text-center p-2 rounded-lg text-sm transition-all outline-none ${
                                    isConduta && isExtra
                                      ? "bg-white border border-blue-200 focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                                      : "bg-transparent text-slate-500"
                                  } ${
                                    isExtra && !isConduta
                                      ? "text-blue-300 placeholder-blue-200"
                                      : ""
                                  }`}
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
              </div>

              {/* Footer de Ação */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                {isConduta ? (
                  <>
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-all">
                      <Save className="w-4 h-4" /> Salvar Conduta (.csv)
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
                      <RefreshCw className="w-4 h-4" /> Simular Nova Predição
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      Para testar novos cenários, mude para a aba{" "}
                      <strong>Conduta</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
