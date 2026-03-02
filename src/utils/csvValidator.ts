import { MODELOS_CONFIG } from '../constants/modelsConfig';

export const validarIntegridadeCSV = (colunasDoArquivo: string[], modeloId: string) => {
  const modelo = MODELOS_CONFIG[modeloId];
  
  if (!modelo) {
    return { valido: false, mensagem: "Modelo não encontrado." };
  }

  // Extraímos todos os IDs definidos no array 'campos'
  const idsEsperados = modelo.campos.map(campo => campo.id);
  
  // Verificamos quais IDs do código NÃO estão no cabeçalho do CSV
  const faltantes = idsEsperados.filter(id => !colunasDoArquivo.includes(id));

  return {
    valido: faltantes.length === 0,
    faltantes
  };
};