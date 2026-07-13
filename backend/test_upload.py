"""
Self-check for Milestone 2 (POST /datasets upload + DESeq2 background pipeline).

Rscript isn't installed locally, so this stubs it with a fixed fake result —
it exercises the Python wiring (validation, dataset/condition/gene inserts,
BackgroundTasks, status polling, persisted expression_results), not DESeq2
itself. Fase B/C of the M2 verification plan run the real thing inside the
Bioconductor container / on Railway.

Run: python3 test_upload.py   (from estadia-back/backend/)

ponytail: plain assert-based script, no pytest — one file, no fixtures needed.
"""
import csv
import io
import json
import os
import random
import sys
import tempfile

TMP = tempfile.mkdtemp(prefix="dpdds_test_")
os.environ["DATA_DIR"] = os.path.join(TMP, "data")

N_GENES = 20
GENE_IDS = [f"g{i}" for i in range(N_GENES)]

# Fake Rscript: ignores its args, always reports the same result for every
# gene, so tests assert on wiring rather than DESeq2 statistics.
bin_dir = os.path.join(TMP, "bin")
os.makedirs(bin_dir, exist_ok=True)
stub_path = os.path.join(bin_dir, "Rscript")
payload = json.dumps([
    {"locustag": g, "log2FoldChange": 1.5, "pvalue": 0.01, "padj": 0.04}
    for g in GENE_IDS
])
with open(stub_path, "w") as f:
    f.write("#!/usr/bin/env python3\n")
    f.write(f"print({payload!r})\n")
os.chmod(stub_path, 0o755)
os.environ["PATH"] = bin_dir + os.pathsep + os.environ["PATH"]

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # so `import app.*` resolves
from fastapi.testclient import TestClient  # noqa: E402
import main as main_module  # noqa: E402  (import after env vars are set, on purpose)

client = TestClient(main_module.app)


def make_synthetic():
    random.seed(42)
    samples, sample_condition = [], {}
    for cond in ("A", "B"):
        for i in range(3):
            s = f"{cond}_{i}"
            samples.append(s)
            sample_condition[s] = cond

    counts = io.StringIO()
    w = csv.writer(counts)
    w.writerow(["gene"] + samples)
    for g in GENE_IDS:
        w.writerow([g] + [random.randint(5, 500) for _ in samples])

    metadata = io.StringIO()
    mw = csv.writer(metadata)
    mw.writerow(["sample", "condition"])
    for s in samples:
        mw.writerow([s, sample_condition[s]])

    return counts.getvalue(), metadata.getvalue()


def upload(counts_csv, metadata_csv, baseline="A", name="synthetic"):
    return client.post(
        "/datasets",
        data={"name": name, "organism": "test", "baseline": baseline},
        files={
            "counts": ("counts.csv", counts_csv, "text/csv"),
            "metadata": ("metadata.csv", metadata_csv, "text/csv"),
        },
    )


def test_happy_path():
    counts_csv, metadata_csv = make_synthetic()
    resp = upload(counts_csv, metadata_csv)
    assert resp.status_code == 200, resp.text
    dataset_id = resp.json()["dataset_id"]

    # TestClient drives the ASGI call to completion, and Starlette runs
    # BackgroundTasks as part of that same call before returning control here
    # — so run_analysis has already finished by the time POST returns.
    status = client.get(f"/datasets/{dataset_id}/status").json()
    assert status["status"] == "done", status

    conditions = client.get(f"/datasets/{dataset_id}/conditions").json()
    assert len(conditions) == 2
    target_cond = next(c for c in conditions if not c["is_baseline"])

    genes = client.get(
        f"/datasets/{dataset_id}/genes",
        params={"include_conditions": str(target_cond["id"])},
    ).json()
    assert genes["total"] == N_GENES, genes
    expr = genes["genes"][0]["expression"][target_cond["label"]]
    assert expr["log2FoldChange"] == 1.5, expr


def test_rejects_mismatched_samples():
    counts_csv, metadata_csv = make_synthetic()
    rows = list(csv.reader(io.StringIO(metadata_csv)))
    del rows[-1]  # drop last sample row -> counts has a column metadata doesn't
    buf = io.StringIO()
    csv.writer(buf).writerows(rows)
    resp = upload(counts_csv, buf.getvalue())
    assert resp.status_code == 400, resp.text


def test_rejects_non_integer_counts():
    counts_csv, metadata_csv = make_synthetic()
    rows = list(csv.reader(io.StringIO(counts_csv)))
    rows[1][1] = "five"  # first gene, first sample: not an integer
    buf = io.StringIO()
    csv.writer(buf).writerows(rows)
    resp = upload(buf.getvalue(), metadata_csv)
    assert resp.status_code == 400, resp.text


def test_rejects_unknown_baseline():
    counts_csv, metadata_csv = make_synthetic()
    resp = upload(counts_csv, metadata_csv, baseline="Z")
    assert resp.status_code == 400, resp.text


def test_rejects_insufficient_replicates():
    samples = ["A_0", "A_1", "A_2", "B_0"]  # condition B has only 1 sample
    sample_condition = {"A_0": "A", "A_1": "A", "A_2": "A", "B_0": "B"}
    counts = io.StringIO()
    w = csv.writer(counts)
    w.writerow(["gene"] + samples)
    for g in GENE_IDS[:5]:
        w.writerow([g] + [random.randint(5, 500) for _ in samples])
    metadata = io.StringIO()
    mw = csv.writer(metadata)
    mw.writerow(["sample", "condition"])
    for s in samples:
        mw.writerow([s, sample_condition[s]])
    resp = upload(counts.getvalue(), metadata.getvalue())
    assert resp.status_code == 400, resp.text


if __name__ == "__main__":
    test_happy_path()
    test_rejects_mismatched_samples()
    test_rejects_non_integer_counts()
    test_rejects_unknown_baseline()
    test_rejects_insufficient_replicates()
    print("OK — all M2 upload self-checks passed")
