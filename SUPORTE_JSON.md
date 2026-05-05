# Suporte a Arquivos JSON - MediDec

O projeto MediDec agora aceita arquivos **JSON** além de CSV para importar dados de pacientes.

## ✅ Formatos Aceitos

### 1. Formato Plano (tradicional)
```json
{
  "subject_id": "12345",
  "idade": 65,
  "genero": "M",
  "observacoes_dia_1": 10,
  "observacoes_dia_2": 12
}
```

### 2. Formato Organizado (aninhado) - ⭐ RECOMENDADO
```json
{
  "subject_id": "12345",
  "idade": 65,
  "genero": "M",
  "observacoes": {
    "1": 10,
    "2": 12,
    "3": 15
  }
}
```

### 3. JSON com múltiplos pacientes (formato plano)
```json
[
  {
    "subject_id": "12345",
    "idade": 65,
    "genero": "M",
    "observacoes_dia_1": 10,
    "observacoes_dia_2": 12
  },
  {
    "subject_id": "12346",
    "idade": 58,
    "genero": "F",
    "observacoes_dia_1": 8,
    "observacoes_dia_2": 11
  }
]
```

### 4. JSON com múltiplos pacientes (formato organizado) - ⭐ RECOMENDADO
```json
[
  {
    "subject_id": "12345",
    "idade": 65,
    "genero": "M",
    "observacoes": {
      "1": 10,
      "2": 12,
      "3": 15
    }
  },
  {
    "subject_id": "12346",
    "idade": 58,
    "genero": "F",
    "observacoes": {
      "1": 8,
      "2": 11,
      "3": 14
    }
  }
]
```

## 📋 Regras Importantes

1. **Campo obrigatório**: `subject_id` (ID único do paciente)
2. **Campos do modelo**: Deve conter TODOS os campos exigidos pelo modelo selecionado
3. **Campos diários**: 
   - **Formato plano**: Use o sufixo `_dia_1`, `_dia_2`, etc. (ex: `temperatura_dia_1`)
   - **Formato organizado**: Agrupe dentro de um objeto com dias como chaves numéricas (ex: `{ "temperatura": { "1": valor1, "2": valor2 } }`)
4. **Tipos de dados**: Use números para campos numéricos e strings para texto
5. **Formato válido**: JSON bem-formado (podem usar um JSON validator online)

## 🔄 Como Usar

1. Clique em "Selecionar arquivo" na interface
2. Escolha um arquivo com extensão `.json`
3. O sistema automaticamente validará os campos e normalizará o formato
4. Se houver erro, você receberá uma mensagem explicando o problema

## ⚠️ Mensagens de Erro Comuns

| Erro | Solução |
|------|---------|
| "JSON inválido" | Verifique a sintaxe do JSON em um validador online |
| "Arquivo JSON vazio" | O arquivo não contém dados |
| "Campos faltando: [lista]" | Adicione os campos obrigatórios listados |
| "Formato de arquivo não suportado" | Use extensão `.json` ou `.csv` |

## 📁 Arquivos Exemplo

Veja na raiz do projeto:
- **`EXEMPLO_PACIENTES_MORTALIDADE.json`** - Formato plano (compatível)
- **`EXEMPLO_PACIENTES_MORTALIDADE_ANINHADO.json`** - Formato organizado (melhor legibilidade) ⭐

## ✨ Benefícios do Formato Organizado

- ✅ Mais fácil de ler e manter
- ✅ Melhor organização visual
- ✅ Evita repetição do nome do campo
- ✅ Mais limpo e profissional
- ✅ Compatível com geradores de dados programáticos
