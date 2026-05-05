import { useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { usePrediction } from "../contexts/PredictionContext"; // Importação necessária
import { buildApiUrl } from "../utils/api"; // Importação necessária

const DEFAULT_WIT_URL = "http://localhost:6006/#whatif";

export default function WitOficial() {
  const { modeloId, pacienteSelecionadoId } = usePrediction();
  const [witUrl, setWitUrl] = useState(DEFAULT_WIT_URL);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      if (!modeloId) return;
      
      setIsLoadingConfig(true);
      try {
        // Agora passamos o subject_id para a API buscar o índice
        const url = buildApiUrl(`/wit/config/${modeloId}?subject_id=${pacienteSelecionadoId}`);
        const response = await fetch(url);
        const config = await response.json();
        
        if (config.tensorboard_url) {
          setWitUrl(config.tensorboard_url);
          // Forçamos o recarregamento do iframe para aplicar a nova URL
          setIframeKey(prev => prev + 1); 
        }
      } catch (err) {
        console.error("Erro ao carregar WIT:", err);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadConfig();
  }, [modeloId, pacienteSelecionadoId]); // Reage à mudança de paciente ou modelo

  const normalizedUrl = useMemo(() => {
    const trimmed = witUrl.trim();
    if (!trimmed) return DEFAULT_WIT_URL;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
      return trimmed;
    }
    return `http://${trimmed}`;
  }, [witUrl]);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="container mx-auto px-6 py-8 space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-800">WIT Oficial (TensorBoard Plugin)</h1>
          <p className="text-sm text-slate-500 mt-2">
            Integração com o widget oficial do What-If Tool.
          </p>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-2">
            <input
              value={witUrl}
              onChange={(e) => setWitUrl(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder="http://localhost:6006/#whatif"
            />
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingConfig ? 'animate-spin' : ''}`} /> 
              {isLoadingConfig ? "Carregando..." : "Recarregar"}
            </button>
            <a
              href={normalizedUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 inline-flex items-center gap-2 justify-center"
            >
              <ExternalLink className="w-4 h-4" /> Abrir em nova guia
            </a>
          </div>

          {!pacienteSelecionadoId && (
            <div className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Aviso: Selecione um paciente no Preditor para carregar os dados automaticamente.
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <iframe
            key={iframeKey}
            src={normalizedUrl}
            title="What-If Tool Oficial"
            className="w-full h-[75vh]"
            allow="clipboard-read; clipboard-write" // Ajuda em algumas versões do TB
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  );
}