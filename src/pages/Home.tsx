import {
  FileSearch,
  Shield,
  Zap,
  Database,
  Brain,
  Stethoscope,
} from "lucide-react";

const features = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "IA Avançada",
    desc: "Algoritmos treinados com milhares de casos clínicos.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Segurança Total",
    desc: "Dados processados com criptografia de ponta.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Tempo Real",
    desc: "Resultados gerados em milissegundos.",
  },
  {
    icon: <Database className="w-6 h-6" />,
    title: "Suporte a CSV",
    desc: "Importação em lote para grandes volumes de dados.",
  },
  {
    icon: <FileSearch className="w-6 h-6" />,
    title: "Explicabilidade",
    desc: "Entenda o 'porquê' de cada decisão, veja quais variáveis mais impactaram o resultado.",
  },
  {
    icon: <Stethoscope className="w-6 h-6" />,
    title: "Apoio Clínico",
    desc: "Ferramenta auxiliar para decisão médica.",
  },
];

export const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="container mx-auto px-6 py-12 text-center">
        <h1 className="text-4xl md:text-5xl mb-6 text-emerald-900 tracking-tight">
          <span className="font-light">Sobre o </span>
          <span className="font-extrabold">Medi</span>
          <span className="font-medium">Dec</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          O MediDec é uma solução de inteligência artificial desenvolvida para
          auxiliar equipes médicas na tomada de decisão crítica, transformando
          dados brutos em prognósticos precisos.
        </p>
      </div>

      <div className="relative w-full overflow-hidden bg-transparent py-12 border-y border-slate-200 [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
        <div className="flex w-max animate-scroll">
          {[...features, ...features].map((item, index) => (
            <div
              key={index}
              className="mx-4 flex w-72 flex-col gap-3 rounded-2xl border border-slate-50 bg-slate-25 p-2 shadow-sm transition-transform hover:scale-105 hover:shadow-md hover:bg-emerald-50/30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl text-emerald-700">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">
              Nossos Modelos Preditivos
            </h2>
            <p className="text-slate-600">
              Utilizamos arquiteturas de Machine Learning treinadas em vastos
              datasets hospitalares para identificar padrões sutis que podem
              passar despercebidos.
            </p>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <div>
                  <strong className="block text-slate-900">
                    Mortalidade Hospitalar
                  </strong>
                  <span className="text-sm text-slate-500">
                    Avalia o risco de óbito com base em sinais vitais, exames
                    laboratoriais e evolução diária (7 dias).
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                <div>
                  <strong className="block text-slate-900">
                    Ventilação Mecânica
                  </strong>
                  <span className="text-sm text-slate-500">
                    Prediz a necessidade futura de intubação ou o sucesso do
                    desmame ventilatório.
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl bg-slate-800 p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-green-300/10 blur-2xl" />
            <div className="absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-green-400/10 blur-2xl" />

            <h3 className="text-2xl font-bold mb-4 z-10 relative">
              Por que confiar no MediDec?
            </h3>
            <p className="text-slate-300 mb-6 z-10 relative">
              Diferente de sistemas de "caixa preta", focamos na
              interpretabilidade dos dados. Cada variável importada do seu CSV é
              validada e pesada para gerar um score de confiança.
            </p>
            <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold transition-colors z-10 relative">
              Ler Documentação Técnica
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
