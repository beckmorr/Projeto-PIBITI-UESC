import { MODELOS_CONFIG } from '../constants/modelsConfig';

/**
 * Valida se um arquivo JSON possui a estrutura e campos esperados
 * @param jsonContent Conteúdo do arquivo JSON como string
 * @param modeloId ID do modelo para validação
 * @returns Resultado da validação com mensagens de erro se houver
 */
export const validarJsonPacientes = (jsonContent: string, modeloId: string) => {
  try {
    const json = JSON.parse(jsonContent);
    
    if (json === null || json === undefined) {
      return { valido: false, erro: "Arquivo JSON vazio ou nulo" };
    }
    
    const dados = Array.isArray(json) ? json : [json];
    
    if (dados.length === 0) {
      return { valido: false, erro: "Arquivo JSON não contém dados" };
    }
    
    // Verifica se todos os objetos são válidos
    if (!dados.every(item => typeof item === 'object' && item !== null)) {
      return { valido: false, erro: "Arquivo JSON contém itens inválidos" };
    }
    
    return { valido: true, dados };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
    return { valido: false, erro: `JSON inválido: ${errorMessage}` };
  }
};

export const validarIntegridadeDados = (colunasDetectadas: string[], modeloId: string) => {
  const modelo = MODELOS_CONFIG[modeloId];
  if (!modelo) return { valido: false, mensagem: "Modelo não encontrado." };

  const faltantes: string[] = [];

  modelo.campos.forEach(campo => {
    if (campo.categoria === 'unico') {
      if (!colunasDetectadas.includes(campo.id)) {
        faltantes.push(campo.id);
      }
    } else if (campo.categoria === 'diario') {
      const temColunaBase = colunasDetectadas.includes(campo.id);
      
      const colunasExpandidasEsperadas = Array.from(
        { length: modelo.diasDeAcompanhamento }, 
        (_, i) => `${campo.id}_dia_${i + 1}`
      );
      
      const temTodasExpandidas = colunasExpandidasEsperadas.every(c => 
        colunasDetectadas.includes(c)
      );

      if (!temColunaBase && !temTodasExpandidas) {
        faltantes.push(`${campo.id} (ou versões _dia_X)`);
      }
    }
  });

  return {
    valido: faltantes.length === 0,
    faltantes
  };
};