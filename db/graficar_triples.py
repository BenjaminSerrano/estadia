import pandas as pd
import matplotlib.pyplot as plt

def generar_graficos_por_pathway(filepath):
    # Cargar archivo
    df = pd.read_excel(filepath)

    # Procesar columna Pathways
    df_expanded = df.dropna(subset=['Pathways']).copy()
    df_expanded['Pathways'] = df_expanded['Pathways'].str.split(',')
    df_expanded = df_expanded.explode('Pathways').reset_index(drop=True)
    df_expanded['Pathways'] = df_expanded['Pathways'].astype(str).str.strip()

    # Listar pathways únicos
    unique_pathways = df_expanded['Pathways'].unique().tolist()

    for pathway in unique_pathways:
        df_pathway = df_expanded[df_expanded['Pathways'] == pathway]
        
        # Calcular conteos de positivos y negativos por cada log2FoldChange
        positive_main = (df_pathway['log2FoldChange'] >= 0).sum()
        negative_main = (df_pathway['log2FoldChange'] < 0).sum()
        positive_x = (df_pathway['log2FoldChange.x'] >= 0).sum()
        negative_x = (df_pathway['log2FoldChange.x'] < 0).sum()
        positive_y = (df_pathway['log2FoldChange.y'] >= 0).sum()
        negative_y = (df_pathway['log2FoldChange.y'] < 0).sum()

        # Preparar los datos
        labels = ['Condition 41°', 'Condition 16°', 'Condition 38°']
        positives = [positive_main, positive_x, positive_y]
        negatives = [negative_main, negative_x, negative_y]

        # Crear gráfico
        plt.figure(figsize=(8, 6))
        bars_positive = plt.bar(labels, positives, color='green', label='log2FoldChange Possitive')
        bars_negative = plt.bar(labels, negatives, bottom=positives, color='red', label='log2FoldChange Negative')

        # Añadir etiquetas
        for bar in bars_positive:
            yval = bar.get_height()
            if yval > 0:
                plt.text(bar.get_x() + bar.get_width()/2, yval/2, int(yval), ha='center', va='center', color='white', fontweight='bold')

        for bar, bottom in zip(bars_negative, positives):
            yval = bar.get_height()
            if yval > 0:
                plt.text(bar.get_x() + bar.get_width()/2, bottom + yval/2, int(yval), ha='center', va='center', color='white', fontweight='bold')

        plt.title(f'Counting positives and negatives for {pathway}')
        plt.ylabel('Quantity')
        plt.ylim(0, (max([p+n for p, n in zip(positives, negatives)]) + 5) * 1.2)
        plt.legend()
        plt.tight_layout()
        plt.show()

# Ejemplo de uso
archivo = 'tabla_common_16_38_41.xlsx'
generar_graficos_por_pathway(archivo)
