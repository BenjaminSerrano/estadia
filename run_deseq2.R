#!/usr/bin/env Rscript
# Corre un contraste DESeq2 entre dos condiciones y emite el resultado como
# JSON a stdout. Invocado por app/routes.py::run_analysis vía subprocess.
#
# Uso: Rscript run_deseq2.R counts.csv metadata.csv baseline target
#
#   counts.csv:   filas = genes (1ra col = locustag), columnas = muestras, counts crudos enteros.
#   metadata.csv: filas = muestras (1ra col = sample id), columna 'condition'.

suppressMessages({
  library(DESeq2)
  library(jsonlite)
})

args <- commandArgs(trailingOnly = TRUE)
if (length(args) != 4) {
  stop("usage: run_deseq2.R counts.csv metadata.csv baseline target")
}
counts_path <- args[1]
metadata_path <- args[2]
baseline <- args[3]
target <- args[4]

counts <- read.csv(counts_path, row.names = 1, check.names = FALSE)
metadata <- read.csv(metadata_path, row.names = 1, check.names = FALSE)

# metadata debe tener las mismas muestras que las columnas de counts, en el mismo orden.
metadata <- metadata[colnames(counts), , drop = FALSE]
metadata$condition <- relevel(factor(metadata$condition), ref = baseline)

dds <- DESeqDataSetFromMatrix(countData = counts, colData = metadata, design = ~condition)
dds <- DESeq(dds)
res <- results(dds, contrast = c("condition", target, baseline))

out <- data.frame(
  locustag = rownames(res),
  log2FoldChange = res$log2FoldChange,
  pvalue = res$pvalue,
  padj = res$padj
)

cat(toJSON(out, na = "null", digits = NA))
