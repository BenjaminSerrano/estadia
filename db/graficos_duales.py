import pandas as pd
import matplotlib.pyplot as plt

def plot_pathway_counts_split_by_origin(filepath):
    # Cargar archivo Excel
    df = pd.read_excel(filepath)

    # Procesar columna Pathway
    df_expanded = df.dropna(subset=['Pathway']).copy()
    df_expanded['Pathway'] = df_expanded['Pathway'].str.split(',')
    df_expanded = df_expanded.explode('Pathway').reset_index(drop=True)
    df_expanded['Pathway'] = df_expanded['Pathway'].astype(str).str.strip()

    # Duplicar datos por origen x e y
    df_x = df_expanded[['Pathway', 'log2FoldChange.x']].copy()
    df_x['sign'] = df_x['log2FoldChange.x'].apply(lambda x: 'Positivos' if x >= 0 else 'Negativos')
    df_x['origen'] = '38°'

    df_y = df_expanded[['Pathway', 'log2FoldChange.y']].copy()
    df_y['sign'] = df_y['log2FoldChange.y'].apply(lambda x: 'Positivos' if x >= 0 else 'Negativos')
    df_y['origen'] = '41°'

    df_x.columns = ['Pathway', 'log2FoldChange', 'sign', 'origen']
    df_y.columns = ['Pathway', 'log2FoldChange', 'sign', 'origen']

    df_combined = pd.concat([df_x, df_y], ignore_index=True)

    # Agrupar por Pathway, origen y signo
    counts_split = df_combined.groupby(['Pathway', 'origen', 'sign']).size().unstack(fill_value=0)
    counts_split = counts_split.reset_index()
    counts_split['Pathway'] = counts_split['Pathway'].astype(str)
    counts_split['Pathway_origen'] = counts_split['Pathway'].astype(str) + ' (' + counts_split['origen'] + ')'
    counts_split = counts_split.set_index('Pathway_origen')

    # Asegurarse de que solo se sumen columnas numéricas
    numeric_cols = counts_split.select_dtypes(include='number').columns
    counts_split = counts_split.loc[counts_split[numeric_cols].sum(axis=1).sort_values(ascending=False).index]

    # Crear gráfico
    plt.figure(figsize=(18, 10))

    bars_positive = plt.bar(counts_split.index, counts_split['Positivos'], color='green', label='log2FoldChange Possitive')
    bars_negative = plt.bar(counts_split.index, counts_split['Negativos'], bottom=counts_split['Positivos'], color='red', label='log2FoldChange Negative')

    for bar in bars_positive:
        yval = bar.get_height()
        if yval > 0:
            plt.text(bar.get_x() + bar.get_width()/2, yval/2, int(yval), ha='center', va='center', color='white', fontsize=12, fontweight='bold')

    for bar, bottom in zip(bars_negative, counts_split['Positivos']):
        yval = bar.get_height()
        if yval > 0:
            plt.text(bar.get_x() + bar.get_width()/2, bottom + yval/2, int(yval), ha='center', va='center', color='white', fontsize=12, fontweight='bold')

    plt.xlabel('Pathways')
    plt.ylabel('Quantity')
    plt.title('Differential Expression for 16° and 38° by systems')
    plt.xticks(rotation=90)
    plt.legend()
    plt.tight_layout()
    plt.show()

# Ejemplo de uso
archivo = 'tabla_common_16_38.xlsx'
plot_pathway_counts_split_by_origin(archivo)