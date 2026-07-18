export interface CampoModelo {
  id: string;
  categoria: "unico" | "diario";
}

export interface ModeloComCampos {
  id: string;
  campos: CampoModelo[];
  diasDeAcompanhamento: number;
}

const temValor = (valor: any) => valor !== undefined && valor !== null && valor !== "";

export const extrairValorUnico = (valor: any) => {
  if (typeof valor === "object" && valor !== null && !Array.isArray(valor)) {
    const chavesNumericas = Object.keys(valor).filter((chave) => /^\d+$/.test(chave));
    if (chavesNumericas.length > 0) {
      const primeiraChave = chavesNumericas.sort((a, b) => Number(a) - Number(b))[0];
      return (valor as Record<string, any>)[primeiraChave];
    }
  }

  return valor;
};

export const normalizarChaveFormulario = (chave: string, modeloId: string) => {
  if (modeloId === "vm") {
    return chave;
  }

  return chave.replace(/_dia_\d+$/, "");
};

export const normalizarDadosParaFormulario = (dados: any[], modeloId: string): any[] => {
  return dados.map((paciente) => {
    const normalizado: Record<string, any> = {};

    Object.entries(paciente).forEach(([chave, valor]) => {
      normalizado[normalizarChaveFormulario(chave, modeloId)] = extrairValorUnico(valor);
    });

    return normalizado;
  });
};

export const montarDadosBaseDoModelo = (
  dados: Record<string, any>,
  modelo: ModeloComCampos,
) => {
  const base: Record<string, any> = {};

  modelo.campos.forEach((campo) => {
    if (campo.categoria === "unico") {
      base[campo.id] = temValor(dados[campo.id]) ? dados[campo.id] : "";
      return;
    }

    if (temValor(dados[campo.id])) {
      base[campo.id] = dados[campo.id];
      return;
    }

    let valorEscolhido = "";
    for (let dia = modelo.diasDeAcompanhamento; dia >= 1; dia -= 1) {
      const valorDia = dados[`${campo.id}_dia_${dia}`];
      if (temValor(valorDia)) {
        valorEscolhido = valorDia;
        break;
      }
    }

    base[campo.id] = valorEscolhido;
  });

  return base;
};