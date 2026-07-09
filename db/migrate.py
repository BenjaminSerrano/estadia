#!/usr/bin/env python3
"""
One-off migration: 7 hard-coded SQLite tables → 4-table generic schema.
Run from estadia-back/: python db/migrate.py
Produces db/data_v2.db alongside the original db/data.db (unchanged).
"""
import sqlite3
import os

BASE = os.path.dirname(__file__)
OLD_PATH = os.path.join(BASE, "data.db")
NEW_PATH = os.path.join(BASE, "data_v2.db")


def safe_float(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def safe_int(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def first(*values):
    """Return first non-None, non-empty value."""
    for v in values:
        if v is not None and v != "":
            return v
    return None


def run():
    if os.path.exists(NEW_PATH):
        os.remove(NEW_PATH)

    old = sqlite3.connect(OLD_PATH)
    old.row_factory = sqlite3.Row
    new = sqlite3.connect(NEW_PATH)

    new.executescript("""
    CREATE TABLE datasets (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        organism TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE conditions (
        id INTEGER PRIMARY KEY,
        dataset_id INTEGER NOT NULL REFERENCES datasets(id),
        label TEXT NOT NULL,
        is_baseline INTEGER DEFAULT 0
    );
    CREATE TABLE genes (
        id INTEGER PRIMARY KEY,
        dataset_id INTEGER NOT NULL REFERENCES datasets(id),
        locustag TEXT,
        KO_code TEXT,
        Protein_accession TEXT,
        Name TEXT,
        Accession TEXT,
        Begin INTEGER,
        End INTEGER,
        Protein_length INTEGER,
        Orientation TEXT,
        Pathway TEXT,
        Brite_specific_family_1 TEXT,
        Brite_specific_family_2 TEXT,
        Brite_specific_family_3 TEXT,
        Brite_protein_families_1 TEXT,
        Brite_protein_families_2 TEXT,
        Brite_protein_families_3 TEXT
    );
    CREATE UNIQUE INDEX genes_locustag ON genes(locustag, dataset_id);
    CREATE TABLE expression_results (
        id INTEGER PRIMARY KEY,
        gene_id INTEGER NOT NULL REFERENCES genes(id),
        condition_id INTEGER NOT NULL REFERENCES conditions(id),
        log2FoldChange REAL,
        pvalue REAL,
        padj REAL,
        UNIQUE(gene_id, condition_id)
    );
    """)

    # C. marina dataset
    new.execute("INSERT INTO datasets VALUES (1,'Cobetia marina thermal stress','Cobetia marina',datetime('now'))")
    CONDS = {"16": 1, "38": 2, "41": 3}
    for label, cid in CONDS.items():
        new.execute("INSERT INTO conditions VALUES (?,1,?,?)", (cid, label, 1 if label == "16" else 0))

    gene_ids: dict = {}  # locustag → id in new DB

    def upsert_gene(locustag, d):
        if locustag not in gene_ids:
            new.execute("""
                INSERT OR IGNORE INTO genes
                (dataset_id, locustag, KO_code, Protein_accession, Name, Accession,
                 Begin, End, Protein_length, Orientation, Pathway,
                 Brite_specific_family_1, Brite_specific_family_2, Brite_specific_family_3,
                 Brite_protein_families_1, Brite_protein_families_2, Brite_protein_families_3)
                VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                locustag,
                d.get("KO_code"), d.get("Protein_accession"), d.get("Name"),
                d.get("Accession"),
                safe_int(d.get("Begin")), safe_int(d.get("End")),
                safe_int(d.get("Protein_length")),
                d.get("Orientation"), d.get("Pathway"),
                d.get("Brite_specific_family_1"), d.get("Brite_specific_family_2"),
                d.get("Brite_specific_family_3"), d.get("Brite_protein_families_1"),
                d.get("Brite_protein_families_2"), d.get("Brite_protein_families_3"),
            ))
            gid = new.execute(
                "SELECT id FROM genes WHERE locustag=? AND dataset_id=1", (locustag,)
            ).fetchone()[0]
            gene_ids[locustag] = gid
        return gene_ids[locustag]

    def add_expr(gid, cid, lfc, pv, padj):
        new.execute(
            "INSERT OR IGNORE INTO expression_results (gene_id,condition_id,log2FoldChange,pvalue,padj) VALUES (?,?,?,?,?)",
            (gid, cid, safe_float(lfc), safe_float(pv), safe_float(padj)),
        )

    # ── Individual condition tables (16, 38, 41) ───────────────────────────────
    for temp in ["16", "38", "41"]:
        count = 0
        for row in old.execute(f'SELECT * FROM "{temp}"'):
            d = dict(row)
            lt = first(d.get("Locustag"), d.get("locustag"))
            if not lt:
                continue
            d["Begin"] = first(d.get("Begin"), d.get("BEGIN"))
            d["End"]   = first(d.get("End"),   d.get("END"))
            gid = upsert_gene(lt, d)
            add_expr(gid, CONDS[temp], d.get("log2FoldChange"), d.get("pvalue"), d.get("padj"))
            count += 1
        print(f"  table {temp}: {count} rows")

    # ponytail: Option A — individual tables only. Intersection tables are a
    # separate DESeq2 pairwise analysis (0 gene overlap with individual tables),
    # not the set-theoretic intersection of the circles. Venn regions are now
    # computed dynamically via SQL. Add pairwise tables when needed for M2+.

    new.commit()
    old.close()
    new.close()

    # Sanity check
    conn = sqlite3.connect(NEW_PATH)
    for tbl in ("datasets", "conditions", "genes", "expression_results"):
        n = conn.execute(f"SELECT COUNT(*) FROM {tbl}").fetchone()[0]
        print(f"  {tbl}: {n} rows")
    genes_n = conn.execute("SELECT COUNT(*) FROM genes").fetchone()[0]
    expr_n  = conn.execute("SELECT COUNT(*) FROM expression_results").fetchone()[0]
    assert genes_n > 0, "No genes migrated"
    assert expr_n  > 0, "No expression results migrated"
    # Every gene should appear in at least one condition
    orphans = conn.execute(
        "SELECT COUNT(*) FROM genes WHERE id NOT IN (SELECT DISTINCT gene_id FROM expression_results)"
    ).fetchone()[0]
    assert orphans == 0, f"{orphans} genes have no expression data"
    conn.close()
    print(f"\nMigration complete → {NEW_PATH}")


if __name__ == "__main__":
    run()
