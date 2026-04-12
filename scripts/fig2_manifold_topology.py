"""
Figure 2: Population manifold and persistent homology.
Panel A: PCA embedding (3D) for Gardner Module 1 (166 neurons)
Panel B: UMAP embedding (3D) for Gardner Module 1
Panel C: Persistence diagram (PCA)
Panel D: H1 barcode showing loop features

Author: Christopher Ezernack
"""

import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

PROJECT_DIR = os.path.join(os.path.dirname(__file__), "..")
FIG_DIR = os.path.join(PROJECT_DIR, "outputs", "figures")
MANIFOLD_DIR = os.path.join(PROJECT_DIR, "outputs", "gardner", "manifold")
os.makedirs(FIG_DIR, exist_ok=True)

# ----------------------------------------------------------------
# Load data
# ----------------------------------------------------------------
pca_emb = np.load(os.path.join(MANIFOLD_DIR, "pca_embedding_mod1.npy"))
umap_emb = np.load(os.path.join(MANIFOLD_DIR, "umap_embedding_mod1.npy"))

# Load persistence diagrams
h0_pca = np.loadtxt(os.path.join(MANIFOLD_DIR, "diagram_H0_mod1_pca.csv"),
                     delimiter=",", skiprows=1)
h1_pca = np.loadtxt(os.path.join(MANIFOLD_DIR, "diagram_H1_mod1_pca.csv"),
                     delimiter=",", skiprows=1)

# Also load variance explained
var_data = np.loadtxt(os.path.join(MANIFOLD_DIR, "pca_variance_mod1.csv"),
                       delimiter=",", skiprows=1)
var_ratio = var_data[:, 1]

print(f"PCA embedding: {pca_emb.shape}")
print(f"UMAP embedding: {umap_emb.shape}")
print(f"H0 features: {len(h0_pca)}, H1 features: {len(h1_pca)}")
print(f"PCA variance (top 6): {var_ratio}")

# ----------------------------------------------------------------
# Create figure
# ----------------------------------------------------------------
fig = plt.figure(figsize=(16, 12))

# Panel A: PCA 3D
ax1 = fig.add_subplot(2, 2, 1, projection='3d')
step = max(1, len(pca_emb) // 5000)
pts = pca_emb[::step, :3]
colors = np.arange(len(pts))
sc = ax1.scatter(pts[:, 0], pts[:, 1], pts[:, 2],
                 c=colors, cmap='viridis', s=0.5, alpha=0.4)
ax1.set_xlabel(f'PC1 ({var_ratio[0]*100:.1f}%)', fontsize=9)
ax1.set_ylabel(f'PC2 ({var_ratio[1]*100:.1f}%)', fontsize=9)
ax1.set_zlabel(f'PC3 ({var_ratio[2]*100:.1f}%)', fontsize=9)
ax1.set_title('A. PCA Embedding (166 neurons)', fontsize=11, fontweight='bold')
ax1.view_init(elev=25, azim=45)

# Panel B: UMAP 3D
ax2 = fig.add_subplot(2, 2, 2, projection='3d')
colors_u = np.arange(len(umap_emb))
sc2 = ax2.scatter(umap_emb[:, 0], umap_emb[:, 1], umap_emb[:, 2],
                  c=colors_u, cmap='viridis', s=0.5, alpha=0.4)
ax2.set_xlabel('UMAP1', fontsize=9)
ax2.set_ylabel('UMAP2', fontsize=9)
ax2.set_zlabel('UMAP3', fontsize=9)
ax2.set_title('B. UMAP Embedding (166 neurons)', fontsize=11, fontweight='bold')
ax2.view_init(elev=25, azim=45)

# Panel C: Persistence diagram
ax3 = fig.add_subplot(2, 2, 3)

# H0
h0_finite = h0_pca[np.isfinite(h0_pca[:, 1])]
ax3.scatter(h0_finite[:, 0], h0_finite[:, 1], c='C0', s=8, alpha=0.5,
            label=f'H0 ({len(h0_finite)} features)')

# H1
h1_finite = h1_pca[np.isfinite(h1_pca[:, 1])]
ax3.scatter(h1_finite[:, 0], h1_finite[:, 1], c='C1', s=12, alpha=0.7,
            label=f'H1 ({len(h1_finite)} features)')

# Diagonal
max_val = max(h0_finite[:, 1].max(), h1_finite[:, 1].max()) if len(h1_finite) > 0 else h0_finite[:, 1].max()
ax3.plot([0, max_val], [0, max_val], 'k--', alpha=0.3, linewidth=0.8)

ax3.set_xlabel('Birth', fontsize=10)
ax3.set_ylabel('Death', fontsize=10)
ax3.set_title('C. Persistence Diagram (PCA, Module 1)', fontsize=11, fontweight='bold')
ax3.legend(fontsize=9, loc='lower right')

# Panel D: H1 barcode
ax4 = fig.add_subplot(2, 2, 4)
h1_pers = h1_finite[:, 1] - h1_finite[:, 0]
sorted_idx = np.argsort(h1_pers)[::-1]
n_show = min(30, len(sorted_idx))

for i, idx in enumerate(sorted_idx[:n_show]):
    birth = h1_finite[idx, 0]
    death = h1_finite[idx, 1]
    pers = death - birth
    color = 'C3' if pers > 0.5 else 'C1'
    ax4.barh(i, pers, left=birth, height=0.8, color=color, alpha=0.8)

ax4.set_xlabel('Filtration value', fontsize=10)
ax4.set_ylabel('Feature index (sorted by persistence)', fontsize=9)
ax4.set_title('D. H1 Barcode (top 30 features)', fontsize=11, fontweight='bold')
ax4.invert_yaxis()

# Annotate the most persistent H1 feature
max_pers = h1_pers.max()
ax4.text(0.95, 0.05, f'Max H1 persistence: {max_pers:.3f}',
         transform=ax4.transAxes, fontsize=9, ha='right', va='bottom',
         bbox=dict(boxstyle='round,pad=0.3', facecolor='lightyellow', alpha=0.8))

fig.suptitle('Figure 2: Population Manifold and Topological Analysis\n'
             'Gardner et al. (2022), Rat R Day 1, Module 1 (166 grid cells)',
             fontsize=13, fontweight='bold', y=1.01)

plt.tight_layout()
plt.savefig(os.path.join(FIG_DIR, "fig2_manifold_topology.png"), dpi=300,
            bbox_inches='tight', facecolor='white')
plt.savefig(os.path.join(FIG_DIR, "fig2_manifold_topology.pdf"),
            bbox_inches='tight', facecolor='white')
plt.close()

print("Figure 2 saved.")
print(f"H1 max persistence (PCA): {max_pers:.4f}")
print(f"H1 features with persistence > 0.5: {np.sum(h1_pers > 0.5)}")
print(f"H1 features with persistence > 0.8: {np.sum(h1_pers > 0.8)}")
