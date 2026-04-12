"""
Manifold embedding for grid cell population activity.
Builds population activity matrix, computes PCA and UMAP embeddings,
saves results as npy, csv, and figures.

Author: Christopher Ezernack
"""

import os
import sys
import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

sys.path.insert(0, os.path.dirname(__file__))
from preprocessing import load_all_data, build_activity_matrix


def compute_pca(activity, n_components=3):
    """
    Standardize and compute PCA on the activity matrix.
    activity: (timepoints, neurons)
    Returns (pca_embedding, explained_variance_ratio, pca_object).
    """
    scaler = StandardScaler()
    scaled = scaler.fit_transform(activity)
    pca = PCA(n_components=n_components)
    embedding = pca.fit_transform(scaled)
    return embedding, pca.explained_variance_ratio_, pca


def compute_umap(activity, n_components=3, n_neighbors=30, min_dist=0.1):
    """
    Compute UMAP embedding on the activity matrix.
    Returns umap_embedding.
    """
    try:
        import umap
    except ImportError:
        print("UMAP not available. Skipping UMAP embedding.")
        return None

    scaler = StandardScaler()
    scaled = scaler.fit_transform(activity)

    n_samples = scaled.shape[0]
    if n_samples > 10000:
        step = n_samples // 10000
        scaled_sub = scaled[::step]
    else:
        scaled_sub = scaled
        step = 1

    reducer = umap.UMAP(n_components=n_components,
                        n_neighbors=n_neighbors,
                        min_dist=min_dist,
                        random_state=42)
    embedding = reducer.fit_transform(scaled_sub)
    return embedding, step


def save_pca_results(embedding, var_ratio, neuron_ids, out_dir):
    """Save PCA embedding and variance explained."""
    os.makedirs(out_dir, exist_ok=True)

    np.save(os.path.join(out_dir, "pca_embedding.npy"), embedding)

    header = ",".join([f"PC{i+1}" for i in range(embedding.shape[1])])
    np.savetxt(os.path.join(out_dir, "pca_embedding.csv"),
               embedding, delimiter=",", header=header, comments="")

    var_df = np.column_stack([
        np.arange(1, len(var_ratio) + 1),
        var_ratio,
        np.cumsum(var_ratio)
    ])
    np.savetxt(os.path.join(out_dir, "pca_variance_explained.csv"),
               var_df, delimiter=",",
               header="PC,variance_ratio,cumulative_variance",
               comments="", fmt=["%.0f", "%.6f", "%.6f"])

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    ax = axes[0]
    ax.scatter(embedding[::10, 0], embedding[::10, 1],
               c=np.arange(0, len(embedding), 10), cmap="viridis",
               s=1, alpha=0.5)
    ax.set_xlabel("PC1")
    ax.set_ylabel("PC2")
    ax.set_title("PCA Embedding (PC1 vs PC2)")

    ax = axes[1]
    if embedding.shape[1] >= 3:
        ax = fig.add_subplot(122, projection="3d")
        sc = ax.scatter(embedding[::10, 0], embedding[::10, 1],
                        embedding[::10, 2],
                        c=np.arange(0, len(embedding), 10),
                        cmap="viridis", s=1, alpha=0.3)
        ax.set_xlabel("PC1")
        ax.set_ylabel("PC2")
        ax.set_zlabel("PC3")
        ax.set_title("PCA Embedding (3D)")

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "pca_embedding.png"),
                dpi=150, bbox_inches="tight")
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(6, 4))
    ax.bar(range(1, len(var_ratio) + 1), var_ratio, color="steelblue")
    ax.set_xlabel("Principal Component")
    ax.set_ylabel("Variance Explained")
    ax.set_title("PCA Scree Plot")
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "pca_scree.png"),
                dpi=150, bbox_inches="tight")
    plt.close(fig)


def save_umap_results(embedding, step, out_dir):
    """Save UMAP embedding."""
    os.makedirs(out_dir, exist_ok=True)

    np.save(os.path.join(out_dir, "umap_embedding.npy"), embedding)

    header = ",".join([f"UMAP{i+1}" for i in range(embedding.shape[1])])
    np.savetxt(os.path.join(out_dir, "umap_embedding.csv"),
               embedding, delimiter=",", header=header, comments="")

    fig = plt.figure(figsize=(12, 5))

    ax1 = fig.add_subplot(121)
    ax1.scatter(embedding[:, 0], embedding[:, 1],
                c=np.arange(len(embedding)), cmap="viridis",
                s=1, alpha=0.5)
    ax1.set_xlabel("UMAP1")
    ax1.set_ylabel("UMAP2")
    ax1.set_title("UMAP Embedding (2D)")

    if embedding.shape[1] >= 3:
        ax2 = fig.add_subplot(122, projection="3d")
        ax2.scatter(embedding[:, 0], embedding[:, 1], embedding[:, 2],
                    c=np.arange(len(embedding)), cmap="viridis",
                    s=1, alpha=0.3)
        ax2.set_xlabel("UMAP1")
        ax2.set_ylabel("UMAP2")
        ax2.set_zlabel("UMAP3")
        ax2.set_title("UMAP Embedding (3D)")

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "umap_embedding.png"),
                dpi=150, bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    out_dir = os.path.join(os.path.dirname(__file__), "..", "outputs", "manifold")

    sessions = load_all_data(data_dir)
    activity, neuron_ids, time_bins = build_activity_matrix(sessions)
    print(f"Activity matrix: {activity.shape}")

    print("\nComputing PCA...")
    pca_emb, var_ratio, pca_obj = compute_pca(activity, n_components=min(10, len(neuron_ids)))
    save_pca_results(pca_emb, var_ratio, neuron_ids, out_dir)
    print(f"PCA done. Top 3 variance: {var_ratio[:3]}")
    print(f"Cumulative variance (3 PCs): {np.sum(var_ratio[:3]):.4f}")

    print("\nComputing UMAP...")
    result = compute_umap(activity, n_components=3)
    if result is not None:
        umap_emb, step = result
        save_umap_results(umap_emb, step, out_dir)
        print(f"UMAP done. Embedding shape: {umap_emb.shape}")

    print("\nAll manifold outputs saved.")
