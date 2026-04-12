"""
Persistent homology analysis of grid cell manifold embeddings.
Uses ripser to compute persistence diagrams and barcodes.
Outputs numeric summaries, barcode plots, and persistence diagrams.

Author: Christopher Ezernack
"""

import os
import numpy as np
from ripser import ripser
from persim import plot_diagrams
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


def subsample_embedding(embedding, max_points=2000, seed=42):
    """Subsample the embedding for computational tractability."""
    rng = np.random.RandomState(seed)
    n = embedding.shape[0]
    if n > max_points:
        idx = rng.choice(n, max_points, replace=False)
        return embedding[idx]
    return embedding


def run_persistent_homology(embedding, max_dim=1, max_points=500):
    """
    Run persistent homology on the embedding using ripser.
    Returns the ripser result dictionary.
    """
    sub = subsample_embedding(embedding, max_points=max_points)
    print(f"  Running ripser on {sub.shape[0]} points, max_dim={max_dim}...")
    result = ripser(sub, maxdim=max_dim)
    return result


def compute_persistence_summary(result):
    """
    Compute numeric summaries of the persistence diagrams.
    Returns a list of dicts with dimension, birth, death, persistence.
    """
    summaries = []
    for dim, dgm in enumerate(result["dgms"]):
        finite = dgm[np.isfinite(dgm[:, 1])]
        if len(finite) == 0:
            summaries.append({
                "dimension": dim,
                "n_features": 0,
                "max_persistence": 0.0,
                "mean_persistence": 0.0,
                "total_persistence": 0.0,
            })
            continue

        pers = finite[:, 1] - finite[:, 0]
        summaries.append({
            "dimension": dim,
            "n_features": len(finite),
            "max_persistence": float(np.max(pers)),
            "mean_persistence": float(np.mean(pers)),
            "total_persistence": float(np.sum(pers)),
        })
    return summaries


def save_persistence_results(result, summaries, out_dir, prefix="pca"):
    """Save persistence diagrams, barcodes, and numeric summaries."""
    os.makedirs(out_dir, exist_ok=True)

    fig, ax = plt.subplots(figsize=(6, 6))
    plot_diagrams(result["dgms"], ax=ax, show=False)
    ax.set_title(f"Persistence Diagram ({prefix.upper()} embedding)")
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, f"persistence_diagram_{prefix}.png"),
                dpi=150, bbox_inches="tight")
    plt.close(fig)

    fig, axes = plt.subplots(len(result["dgms"]), 1,
                             figsize=(8, 3 * len(result["dgms"])))
    if len(result["dgms"]) == 1:
        axes = [axes]
    for dim, (dgm, ax) in enumerate(zip(result["dgms"], axes)):
        finite = dgm[np.isfinite(dgm[:, 1])]
        if len(finite) == 0:
            ax.set_title(f"H{dim}: no features")
            continue
        pers = finite[:, 1] - finite[:, 0]
        sorted_idx = np.argsort(pers)[::-1]
        n_show = min(50, len(sorted_idx))
        for i, idx in enumerate(sorted_idx[:n_show]):
            ax.barh(i, pers[idx], left=finite[idx, 0],
                    height=0.8, color=f"C{dim}")
        ax.set_xlabel("Filtration value")
        ax.set_ylabel("Feature index")
        ax.set_title(f"H{dim} Barcode ({len(finite)} features, "
                     f"top {n_show} shown)")
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, f"barcode_{prefix}.png"),
                dpi=150, bbox_inches="tight")
    plt.close(fig)

    with open(os.path.join(out_dir, f"persistence_summary_{prefix}.csv"), "w") as f:
        f.write("dimension,n_features,max_persistence,mean_persistence,"
                "total_persistence\n")
        for s in summaries:
            f.write(f"{s['dimension']},{s['n_features']},"
                    f"{s['max_persistence']:.6f},"
                    f"{s['mean_persistence']:.6f},"
                    f"{s['total_persistence']:.6f}\n")

    for dim, dgm in enumerate(result["dgms"]):
        np.savetxt(os.path.join(out_dir, f"diagram_H{dim}_{prefix}.csv"),
                   dgm, delimiter=",", header="birth,death", comments="")


if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "..", "outputs", "topology")
    manifold_dir = os.path.join(os.path.dirname(__file__), "..", "outputs", "manifold")

    pca_path = os.path.join(manifold_dir, "pca_embedding.npy")
    if os.path.exists(pca_path):
        print("Loading PCA embedding...")
        pca_emb = np.load(pca_path)
        pca_3d = pca_emb[:, :3]
        print(f"  PCA shape: {pca_3d.shape}")

        result_pca = run_persistent_homology(pca_3d, max_dim=1, max_points=500)
        summaries_pca = compute_persistence_summary(result_pca)
        save_persistence_results(result_pca, summaries_pca, out_dir, prefix="pca")

        print("\nPCA Persistence Summary:")
        for s in summaries_pca:
            print(f"  H{s['dimension']}: {s['n_features']} features, "
                  f"max_pers={s['max_persistence']:.4f}, "
                  f"mean_pers={s['mean_persistence']:.4f}")

    umap_path = os.path.join(manifold_dir, "umap_embedding.npy")
    if os.path.exists(umap_path):
        print("\nLoading UMAP embedding...")
        umap_emb = np.load(umap_path)
        print(f"  UMAP shape: {umap_emb.shape}")

        result_umap = run_persistent_homology(umap_emb, max_dim=1, max_points=500)
        summaries_umap = compute_persistence_summary(result_umap)
        save_persistence_results(result_umap, summaries_umap, out_dir, prefix="umap")

        print("\nUMAP Persistence Summary:")
        for s in summaries_umap:
            print(f"  H{s['dimension']}: {s['n_features']} features, "
                  f"max_pers={s['max_persistence']:.4f}, "
                  f"mean_pers={s['mean_persistence']:.4f}")

    print("\nAll topology outputs saved.")
