import pandas as pd
import matplotlib.pyplot as plt

def plot_pathway_counts(filepath):
    # Cargar archivo Excel
    df = pd.read_excel(filepath)

    # Procesar columna Pathway
    df_expanded = df.dropna(subset=['Pathway']).copy()
    df_expanded['Pathway'] = df_expanded['Pathway'].str.split(',')
    df_expanded = df_expanded.explode('Pathway').reset_index(drop=True)

    # Limpiar espacios
    df_expanded['Pathway'] = df_expanded['Pathway'].str.strip()

    # Crear una columna para identificar valores positivos y negativos
    df_expanded['log2FoldChange_sign'] = df_expanded['log2FoldChange'].apply(lambda x: 'Positivos' if x >= 0 else 'Negativos')

    # Agrupar y contar
    counts_corrected = df_expanded.groupby(['Pathway', 'log2FoldChange_sign']).size().unstack(fill_value=0)

    # Ordenar por la suma total para mejor visualización
    counts_corrected = counts_corrected.loc[counts_corrected.sum(axis=1).sort_values(ascending=False).index]

    # Gráfico
    plt.figure(figsize=(16, 10))

    bars_positive = plt.bar(counts_corrected.index, counts_corrected['Positivos'], color='green', label='log2FoldChange Possitive')
    bars_negative = plt.bar(counts_corrected.index, counts_corrected['Negativos'], bottom=counts_corrected['Positivos'], color='red', label='log2FoldChange Negative')

    # Etiquetas
    for bar in bars_positive:
        yval = bar.get_height()
        if yval > 0:
            plt.text(bar.get_x() + bar.get_width()/2, yval/2, int(yval), ha='center', va='center', color='white', fontsize=12, fontweight='bold')

    for bar, bottom in zip(bars_negative, counts_corrected['Positivos']):
        yval = bar.get_height()
        if yval > 0:
            plt.text(bar.get_x() + bar.get_width()/2, bottom + yval/2, int(yval), ha='center', va='center', color='white', fontsize=12, fontweight='bold')

    plt.xlabel('Pathways')
    plt.ylabel('Quantity')
    plt.title('Differential Expression for 41°C uniques')
    plt.xticks(rotation=90)
    plt.legend()
    plt.tight_layout()

    plt.show()

# Ejemplo de uso
archivo = 'tabla_unique_41.xlsx'
plot_pathway_counts(archivo)