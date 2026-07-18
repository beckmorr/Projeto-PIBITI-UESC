from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional, Sequence

import numpy as np
import pandas as pd

# O xgboost é opcional para que o arquivo continue importável mesmo sem a dependência.
try:
    import xgboost as xgb
except ImportError:
    xgb = None


def _is_missing(value: Any) -> bool:
    """Verifica se um valor é nulo/faltante (NaN, None)."""
    return pd.isna(value)


def _to_python(value: Any) -> Any:
    """Converte tipos do NumPy/Pandas para tipos nativos do Python.

    Isso evita problemas na serialização JSON da resposta da API.
    """
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, dict):
        return {key: _to_python(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_to_python(item) for item in value]
    if isinstance(value, tuple):
        return [_to_python(item) for item in value]
    return value


@dataclass(frozen=True)
class CounterfactualResult:
    """Estrutura de dados imutável para armazenar o resultado da busca contrafactual."""
    counterfactual_index: Any          # Índice original da linha encontrada no DataFrame
    counterfactual: Dict[str, Any]      # O ponto contrafactual em formato de dicionário
    selected_prediction: Any           # Predição original do ponto analisado
    counterfactual_prediction: Any     # Nova predição obtida pelo contrafactual
    distance: float                    # Distância total calculada
    numeric_distance: float            # Parcela da distância vinda dos atributos numéricos
    categorical_distance: float        # Parcela da distância vinda dos atributos categóricos
    differences: List[Dict[str, Any]]  # Relatório detalhado das mudanças necessárias


class CounterfactualFinder:
    """Encontra o contrafactual mais próximo utilizando distância L1 normalizada e penalidade categórica."""

    def __init__(
        self,
        model: Any,
        train_df: pd.DataFrame,
        feature_columns: Optional[Sequence[str]] = None,
        categorical_penalty: float = 1.0,
        prediction_label_fn: Optional[Callable[[np.ndarray], np.ndarray]] = None,
        prediction_mode: str = "auto",
        prediction_threshold: float = 0.5,
        protected_columns: Optional[Sequence[str]] = None,
    ) -> None:
        # O train_df é a base de candidatos usada para comparar o paciente selecionado com os demais casos.
        if train_df is None or train_df.empty:
            raise ValueError("train_df must be a non-empty pandas DataFrame.")

        self.model = model
        self.train_df = train_df.copy()
        # As features são mantidas na ordem esperada pelo modelo.
        self.feature_columns = list(feature_columns or train_df.columns)
        self.categorical_penalty = float(categorical_penalty)
        self.prediction_label_fn = prediction_label_fn
        self.prediction_mode = prediction_mode
        self.prediction_threshold = float(prediction_threshold)
        
        # Campos protegidos não podem mudar na busca contrafactual.
        self.protected_columns = [
            column for column in (protected_columns or []) if column in self.feature_columns
        ]

        # Garante que a base tenha todas as colunas esperadas pelo modelo.
        missing = [col for col in self.feature_columns if col not in self.train_df.columns]
        if missing:
            raise KeyError(f"Columns missing from train_df: {missing}")

        # Só as colunas não protegidas entram no cálculo de distância.
        distance_columns = [
            col for col in self.feature_columns if col not in self.protected_columns
        ]
        # Divide as colunas de distância em numéricas e categóricas.
        self.numeric_columns = [
            col for col in distance_columns if pd.api.types.is_numeric_dtype(self.train_df[col])
        ]
        self.categorical_columns = [
            col for col in distance_columns if col not in self.numeric_columns
        ]

        # Calcula o desvio padrão das colunas numéricas para normalizar a distância L1.
        numeric_frame = (
            self.train_df[self.numeric_columns]
            if self.numeric_columns
            else pd.DataFrame(index=self.train_df.index)
        )
        # Desvio padrão zero viraria divisão por zero; por isso é trocado por NaN.
        self.numeric_std = (
            numeric_frame.std(ddof=0).replace(0, np.nan)
            if not numeric_frame.empty
            else pd.Series(dtype=float)
        )

    def find_nearest_counterfactual(
        self,
        selected_point: Any,
        dataset_df: pd.DataFrame,
        selected_index: Any = None,
    ) -> Dict[str, Any]:
        """Busca o exemplo mais próximo no dataset que resulte em uma classe predita diferente."""
        # Normaliza o dataset de candidatos e o ponto selecionado para um formato comparável.
        candidate_df = self._prepare_frame(dataset_df)
        selected_df = self._prepare_selected(selected_point)

        # Se houver campos protegidos, mantém apenas candidatos com o mesmo valor nessas colunas.
        if self.protected_columns:
            protected_mask = np.ones(len(candidate_df), dtype=bool)
            for column in self.protected_columns:
                protected_mask &= candidate_df[column].to_numpy() == selected_df.iloc[0][column]
            candidate_df = candidate_df.loc[protected_mask].copy()

        # Calcula a classe do paciente selecionado e a classe de cada candidato.
        selected_prediction = self._predict_labels(selected_df)[0]
        candidate_predictions = self._predict_labels(candidate_df)

        # Só continuam os candidatos cuja classe é diferente da classe original.
        opposite_mask = candidate_predictions != selected_prediction
        # Evita escolher o próprio paciente como seu contrafactual, se ele estiver na base.
        if selected_index is not None and candidate_df.index.isin([selected_index]).any():
            opposite_mask = opposite_mask & (candidate_df.index.to_numpy() != selected_index)

        opposite_df = candidate_df.loc[opposite_mask].copy()
        opposite_predictions = candidate_predictions[opposite_mask]

        if opposite_df.empty:
            raise ValueError(
                "No counterfactual candidate was found with a different predicted class."
            )

        # Calcula a distância entre o ponto original e todos os candidatos de classe oposta.
        distances, numeric_distances, categorical_distances = self._compute_distances(
            selected_df.iloc[0], opposite_df
        )
        
        # O menor valor de distância define o contrafactual mais próximo.
        best_pos = int(np.argmin(distances))
        best_index = opposite_df.index[best_pos]
        counterfactual_row = opposite_df.iloc[best_pos]

        # Organiza a resposta final com as distâncias e as mudanças entre os dois casos.
        result = CounterfactualResult(
            counterfactual_index=best_index,
            counterfactual=counterfactual_row.to_dict(),
            selected_prediction=self._to_python_scalar(selected_prediction),
            counterfactual_prediction=self._to_python_scalar(opposite_predictions[best_pos]),
            distance=float(distances[best_pos]),
            numeric_distance=float(numeric_distances[best_pos]),
            categorical_distance=float(categorical_distances[best_pos]),
            differences=self._summarize_differences(selected_df.iloc[0], counterfactual_row),
        )
        return _to_python(result.__dict__)

    def _prepare_frame(self, frame: pd.DataFrame) -> pd.DataFrame:
        """Garante o formato correto e a presença das colunas necessárias no DataFrame de busca."""
        if frame is None or frame.empty:
            raise ValueError("dataset_df must be a non-empty pandas DataFrame.")
        # A base de candidatos precisa ter todas as colunas usadas no modelo.
        missing = [col for col in self.feature_columns if col not in frame.columns]
        if missing:
            raise KeyError(f"Columns missing from dataset_df: {missing}")
        # Mantém apenas as features esperadas e preserva a ordem delas.
        return frame.loc[:, self.feature_columns].copy()

    def _prepare_selected(self, selected_point: Any) -> pd.DataFrame:
        """Converte diferentes formatos de entrada (Dict, Series, DF) do ponto de interesse em um DataFrame unificado."""
        if isinstance(selected_point, pd.DataFrame):
            if len(selected_point) != 1:
                raise ValueError("selected_point DataFrame must contain exactly one row.")
            frame = selected_point.copy()
        elif isinstance(selected_point, pd.Series):
            frame = selected_point.to_frame().T
        elif isinstance(selected_point, dict):
            frame = pd.DataFrame([selected_point])
        else:
            frame = pd.DataFrame([selected_point], columns=self.feature_columns)

        # O ponto selecionado também precisa conter todas as colunas do modelo.
        missing = [col for col in self.feature_columns if col not in frame.columns]
        if missing:
            raise KeyError(f"Columns missing from selected_point: {missing}")
        # Retorna o ponto no mesmo layout usado para a base de comparação.
        return frame.loc[:, self.feature_columns].copy()

    def _predict_raw(self, frame: pd.DataFrame) -> np.ndarray:
        """Executa a inferência bruta lidando com modelos padrão (scikit-learn) ou nativos do XGBoost."""
        # Se o modelo for um Booster do XGBoost, usa DMatrix para previsões nativas.
        if xgb is not None and isinstance(self.model, xgb.Booster):
            dmatrix = xgb.DMatrix(frame, feature_names=self.feature_columns)
            return np.asarray(self.model.predict(dmatrix, validate_features=False))

        try:
            # Caso contrário, tenta a interface padrão .predict().
            return np.asarray(self.model.predict(frame))
        except Exception:
            # Fallback para modelos que só aceitam arrays NumPy puros.
            return np.asarray(self.model.predict(frame.to_numpy()))

    def _predict_labels(self, frame: pd.DataFrame) -> np.ndarray:
        """Pós-processa os outputs brutos do modelo para transformá-los em classes discretas (rótulos)."""
        raw = np.asarray(self._predict_raw(frame))

        # Se o usuário passar uma função de mapeamento, ela tem prioridade.
        if self.prediction_label_fn is not None:
            labels = np.asarray(self.prediction_label_fn(raw))
            return labels.reshape(-1)

        # Saídas 2D costumam representar probabilidades por classe.
        if raw.ndim == 2:
            if raw.shape[1] == 1:
                raw = raw[:, 0]
            else:
                # Para multiclasse, usa a classe com maior probabilidade.
                return np.argmax(raw, axis=1)

        if raw.ndim != 1:
            raise ValueError(f"Unsupported prediction output shape: {raw.shape}")

        # Saídas numéricas podem ser probabilidade binária ou valor contínuo.
        if np.issubdtype(raw.dtype, np.number):
            if self.prediction_mode == "probability" or (
                self.prediction_mode == "auto"
                and np.nanmin(raw) >= 0.0
                and np.nanmax(raw) <= 1.0
            ):
                # Se for probabilidade, converte para classe 0/1 usando o threshold.
                return (raw >= self.prediction_threshold).astype(int)
            return np.round(raw.astype(float), 12)

        # Se a saída não for numérica, devolve como string.
        return raw.astype(str)

    def _compute_distances(
        self,
        selected_row: pd.Series,
        candidates: pd.DataFrame,
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Aplica os cálculos vetoriais de distância para o bloco numérico e categórico."""
        n_rows = len(candidates)

        numeric_distances = np.zeros(n_rows, dtype=float)
        categorical_distances = np.zeros(n_rows, dtype=float)

        # Distância numérica: soma de |x1 - x2| normalizada pelo desvio padrão.
        if self.numeric_columns:
            selected_numeric = selected_row[self.numeric_columns].to_numpy(dtype=float, copy=False)
            candidate_numeric = candidates[self.numeric_columns].to_numpy(dtype=float, copy=False)
            stds = self.numeric_std.reindex(self.numeric_columns).to_numpy(dtype=float)
            # Evita divisões inválidas quando o desvio padrão é zero, NaN ou infinito.
            stds = np.where(np.isfinite(stds) & (stds > 0), stds, np.inf)

            # Valores ausentes recebem penalidade fixa para não quebrar a comparação.
            numeric_missing = np.isnan(candidate_numeric) | np.isnan(selected_numeric)
            numeric_delta = np.abs(candidate_numeric - selected_numeric) / stds
            numeric_delta = np.where(numeric_missing, 1.0, numeric_delta)
            numeric_distances = numeric_delta.sum(axis=1)

        # Distância categórica: soma penalidades quando o valor muda.
        if self.categorical_columns:
            selected_categorical = selected_row[self.categorical_columns].astype(object).to_numpy(copy=False)
            candidate_categorical = candidates[self.categorical_columns].astype(object).to_numpy(copy=False)
            categorical_missing = pd.isna(candidate_categorical) | pd.isna(selected_categorical)
            
            # Igualdade categórica zera a distância; diferença usa a penalidade definida.
            categorical_delta = np.where(
                categorical_missing,
                1.0,
                np.where(candidate_categorical == selected_categorical, 0.0, self.categorical_penalty),
            )
            categorical_distances = categorical_delta.sum(axis=1)

        # A distância final é a soma da parte numérica com a categórica.
        total_distance = numeric_distances + categorical_distances
        return total_distance, numeric_distances, categorical_distances

    def _summarize_differences(
        self,
        selected_row: pd.Series,
        counterfactual_row: pd.Series,
    ) -> List[Dict[str, Any]]:
        """Compara o ponto original com o contrafactual escolhido para extrair o delta exato de alterações."""
        differences: List[Dict[str, Any]] = []

        # Percorre todas as features e ignora as colunas protegidas.
        for column in self.feature_columns:
            if column in self.protected_columns:
                continue

            original_value = selected_row[column]
            counterfactual_value = counterfactual_row[column]

            # Para colunas numéricas, registra o valor original, o novo valor e o delta.
            if pd.api.types.is_numeric_dtype(self.train_df[column]):
                if _is_missing(original_value) and _is_missing(counterfactual_value):
                    continue
                if _is_missing(original_value) or _is_missing(counterfactual_value):
                    changed = True
                    delta = None
                else:
                    # Usa comparação aproximada para evitar ruído de ponto flutuante.
                    changed = not np.isclose(
                        float(original_value), float(counterfactual_value), equal_nan=True
                    )
                    delta = float(counterfactual_value) - float(original_value)
                if changed:
                    differences.append(
                        {
                            "feature": column,
                            "original": self._to_python_scalar(original_value),
                            "counterfactual": self._to_python_scalar(counterfactual_value),
                            "delta": delta,
                        }
                    )
            # Para colunas categóricas, só registra a mudança, sem delta numérico.
            else:
                if pd.isna(original_value) and pd.isna(counterfactual_value):
                    continue
                if original_value != counterfactual_value:
                    differences.append(
                        {
                            "feature": column,
                            "original": self._to_python_scalar(original_value),
                            "counterfactual": self._to_python_scalar(counterfactual_value),
                            "delta": None,
                        }
                    )

        return differences

    @staticmethod
    def _to_python_scalar(value: Any) -> Any:
        """Converte tipos escalares NumPy individuais para escalares Python equivalentes."""
        if isinstance(value, np.generic):
            return value.item()
        return value