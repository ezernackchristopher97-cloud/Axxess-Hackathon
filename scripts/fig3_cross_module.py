"""
Figure 3: Cross-module comparison of topological features.
Panel A: H1 max persistence across all modules (bar chart)
Panel B: PCA variance explained comparison
Panel C: Hafting vs Gardner H1 comparison
Panel D: Entropy comparison (neural, spatial, temporal)

Author: Christopher Ezernack
"""

import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

PROJECT_DIR = os.path.join(os.path.dirname(__file__), "..")
FIG_DIR = os.path.join(PROJECT_DIR, "outputs", "figures")
MANIFOLD_DIR = os.path.join(PROJECT_DIR, "outputs", "gardner", "manifold")
os.makedirs(FIG_DIR, exist_ok=True)

# ----------------------------------------------------------------
# Collect persistence data across modules
# ----------------------------------------------------------------
modules = {
    'Rat R\nMod 1\n(166)': 'mod1',
    'Rat R\nMod 2\n(168)': 'mod2',
    'Rat R\nMod 3\n(149)': 'mod3',
    'Rat Q\nMod 1\n(97)': 'ratq_mod1',
    'Rat Q\nMod 2\n(66)': 'ratq_mod2',
}

h1_max_pca = []
h1_max_umap = []
h1_count_pca = []
pca_var_top3 = []
labels = list(modules.keys())

for label, mod_key in modules.items():
    # PCA persistence
    pca_file = os.path.join(MANIFOLD_DIR, f"persistence_summary_{mod_key}_pca.csv")
    pca_data = np.loadtxt(pca_file, delimiter=",", skiprows=1)
    h1_row = pca_data[pca_data[:, 0] == 1]
    if len(h1_row) > 0:
        h1_max_pca.append(h1_row[0, 2])
        h1_count_pca.append(int(h1_row[0, 1]))
    else:
        h1_max_pca.append(0)
        h1_count_pca.append(0)
    
    # UMAP persistence
    umap_file = os.path.join(MANIFOLD_DIR, f"persistence_summary_{mod_key}_umap.csv")
    umap_data = np.loadtxt(umap_file, delimiter=",", skiprows=1)
    h1_row_u = umap_data[umap_data[:, 0] == 1]
    if len(h1_row_u) > 0:
        h1_max_umap.append(h1_row_u[0, 2])
    else:
        h1_max_umap.append(0)
    
    # PCA variance
    var_file = os.path.join(MANIFOLD_DIR, f"pca_variance_{mod_key}.csv")
    var_data = np.loadtxt(var_file, delimiter=",", skiprows=1)
    pca_var_top3.append(np.sum(var_data[:3, 1]))

# Hafting data for comparison
hafting_pca_file = os.path.join(PROJECT_DIR, "outputs", "topology", "persistence_summary_pca.csv")
hafting_pca = np.loadtxt(hafting_pca_file, delimiter=",", skiprows=1)
hafting_h1 = hafting_pca[hafting_pca[:, 0] == 1]
hafting_h1_max = hafting_h1[0, 2] if len(hafting_h1) > 0 else 0

hafting_umap_file = os.path.join(PROJECT_DIR, "outputs", "topology", "persistence_summary_umap.csv")
hafting_umap = np.loadtxt(hafting_umap_file, delimiter=",", skiprows=1)
hafting_h1_u = hafting_umap[hafting_umap[:, 0] == 1]
hafting_h1_max_umap = hafting_h1_u[0, 2] if len(hafting_h1_u) > 0 else 0

# Entropy data
entropy_file = os.path.join(PROJECT_DIR, "outputs", "entropy", "entropy_metrics.csv")
entropy_data = np.loadtxt(entropy_file, delimiter=",", skiprows=1, dtype=str)

# ----------------------------------------------------------------
# Create figure
# ----------------------------------------------------------------
fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# Panel A: H1 max persistence comparison (PCA vs UMAP)
ax = axes[0, 0]
x = np.arange(len(labels))
width = 0.35
bars1 = ax.bar(x - width/2, h1_max_pca, width, label='PCA space', color='C0', alpha=0.8)
bars2 = ax.bar(x + width/2, h1_max_umap, width, label='UMAP space', color='C1', alpha=0.8)
ax.set_xticks(x)
ax.set_xticklabels(labels, fontsize=8)
ax.set_ylabel('Max H1 Persistence', fontsize=10)
ax.set_title('A. H1 Persistence Across Grid Cell Modules', fontsize=11, fontweight='bold')
ax.legend(fontsize=9)
ax.axhline(y=1.0, color='gray', linestyle='--', alpha=0.5, linewidth=0.8)
ax.text(len(labels)-0.5, 1.05, 'persistence = 1.0', fontsize=8, color='gray')

# Add value labels
for bar in bars1:
    h = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2., h + 0.03,
            f'{h:.2f}', ha='center', va='bottom', fontsize=7)
for bar in bars2:
    h = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2., h + 0.03,
            f'{h:.2f}', ha='center', va='bottom', fontsize=7)

# Panel B: PCA variance explained
ax = axes[0, 1]
colors_var = ['C0', 'C0', 'C0', 'C2', 'C2']
ax.bar(x, [v*100 for v in pca_var_top3], color=colors_var, alpha=0.8)
ax.set_xticks(x)
ax.set_xticklabels(labels, fontsize=8)
ax.set_ylabel('Cumulative Variance (top 3 PCs, %)', fontsize=10)
ax.set_title('B. PCA Variance Explained (Top 3 Components)', fontsize=11, fontweight='bold')
for i, v in enumerate(pca_var_top3):
    ax.text(i, v*100 + 0.2, f'{v*100:.1f}%', ha='center', fontsize=8)

# Panel C: Hafting vs Gardner H1 comparison
ax = axes[1, 0]
comparison_labels = ['Hafting (2005)\n13 neurons'] + [l for l in labels]
comparison_pca = [hafting_h1_max] + h1_max_pca
comparison_umap = [hafting_h1_max_umap] + h1_max_umap
x_c = np.arange(len(comparison_labels))
width_c = 0.35
bars_c1 = ax.bar(x_c - width_c/2, comparison_pca, width_c, label='PCA', color='C0', alpha=0.8)
bars_c2 = ax.bar(x_c + width_c/2, comparison_umap, width_c, label='UMAP', color='C1', alpha=0.8)
ax.set_xticks(x_c)
ax.set_xticklabels(comparison_labels, fontsize=7)
ax.set_ylabel('Max H1 Persistence', fontsize=10)
ax.set_title('C. Hafting vs Gardner: Topological Signal Strength', fontsize=11, fontweight='bold')
ax.legend(fontsize=9)

# Highlight the scale difference
ax.axvspan(-0.5, 0.5, alpha=0.1, color='red', label='_nolegend_')
ax.text(0, ax.get_ylim()[1]*0.9, 'tetrode\n(few neurons)', ha='center',
        fontsize=7, color='red', style='italic')
ax.text(3, ax.get_ylim()[1]*0.9, 'Neuropixels\n(100+ neurons)', ha='center',
        fontsize=7, color='blue', style='italic')

# Panel D: H1 feature count
ax = axes[1, 1]
ax.bar(x, h1_count_pca, color='C3', alpha=0.8)
ax.set_xticks(x)
ax.set_xticklabels(labels, fontsize=8)
ax.set_ylabel('Number of H1 Features (PCA)', fontsize=10)
ax.set_title('D. H1 Feature Count Per Module', fontsize=11, fontweight='bold')
for i, c in enumerate(h1_count_pca):
    ax.text(i, c + 5, str(c), ha='center', fontsize=8)

fig.suptitle('Figure 3: Cross-Module Topological Comparison',
             fontsize=14, fontweight='bold', y=1.01)

plt.tight_layout()
plt.savefig(os.path.join(FIG_DIR, "fig3_cross_module.png"), dpi=300,
            bbox_inches='tight', facecolor='white')
plt.savefig(os.path.join(FIG_DIR, "fig3_cross_module.pdf"),
            bbox_inches='tight', facecolor='white')
plt.close()

print("Figure 3 saved.")
print(f"H1 max persistence (PCA): {h1_max_pca}")
print(f"H1 max persistence (UMAP): {h1_max_umap}")
print(f"H1 feature counts (PCA): {h1_count_pca}")
print(f"PCA variance top-3: {[f'{v*100:.1f}%' for v in pca_var_top3]}")
print(f"Hafting H1 max (PCA): {hafting_h1_max:.4f}")
print(f"Hafting H1 max (UMAP): {hafting_h1_max_umap:.4f}")
