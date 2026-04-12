"""
Figure 4: Gut microbiome diversity and entropy analysis.
Uses American Gut Project data (3,107 stool samples).
Connects microbial diversity to the entropy framework in the paper.

Panel A: Shannon entropy distribution across samples
Panel B: Species richness vs Shannon entropy
Panel C: Entropy comparison: neural (Hafting) vs microbiome
Panel D: Conceptual bridge: entropy gradients across biological scales

Author: Christopher Ezernack
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy import stats

PROJECT_DIR = os.path.join(os.path.dirname(__file__), "..")
FIG_DIR = os.path.join(PROJECT_DIR, "outputs", "figures")
os.makedirs(FIG_DIR, exist_ok=True)

# ----------------------------------------------------------------
# Load microbiome data
# ----------------------------------------------------------------
micro_csv = os.path.join(PROJECT_DIR, "outputs", "microbiome", "microbiome_diversity.csv")
df = pd.read_csv(micro_csv)
print(f"Microbiome samples: {len(df)}")
print(f"Shannon entropy: mean={df['shannon_entropy'].mean():.3f}, "
      f"std={df['shannon_entropy'].std():.3f}")

# Load neural entropy data
entropy_csv = os.path.join(PROJECT_DIR, "outputs", "entropy", "entropy_metrics.csv")
entropy_data = pd.read_csv(entropy_csv)
print(f"\nNeural entropy metrics:")
print(entropy_data.to_string())

# ----------------------------------------------------------------
# Create figure
# ----------------------------------------------------------------
fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# Panel A: Shannon entropy distribution
ax = axes[0, 0]
ax.hist(df['shannon_entropy'], bins=50, color='C2', alpha=0.8, edgecolor='white',
        linewidth=0.5)
ax.axvline(df['shannon_entropy'].mean(), color='k', linestyle='--', linewidth=1.5,
           label=f'Mean = {df["shannon_entropy"].mean():.2f} bits')
ax.axvline(df['shannon_entropy'].median(), color='C3', linestyle=':', linewidth=1.5,
           label=f'Median = {df["shannon_entropy"].median():.2f} bits')
ax.set_xlabel('Shannon Entropy (bits)', fontsize=10)
ax.set_ylabel('Number of Samples', fontsize=10)
ax.set_title('A. Gut Microbiome Shannon Entropy Distribution\n'
             'American Gut Project (n=3,107 stool samples)', fontsize=10, fontweight='bold')
ax.legend(fontsize=9)

# Panel B: Richness vs Shannon
ax = axes[0, 1]
sc = ax.scatter(df['species_richness'], df['shannon_entropy'],
                c=df['total_reads'], cmap='viridis', s=3, alpha=0.3)
# Fit line
slope, intercept, r, p, se = stats.linregress(df['species_richness'],
                                                df['shannon_entropy'])
x_fit = np.linspace(df['species_richness'].min(), df['species_richness'].max(), 100)
ax.plot(x_fit, slope * x_fit + intercept, 'r-', linewidth=1.5,
        label=f'r = {r:.3f}, p < 0.001')
ax.set_xlabel('Species Richness (OTU count)', fontsize=10)
ax.set_ylabel('Shannon Entropy (bits)', fontsize=10)
ax.set_title('B. Richness vs. Entropy', fontsize=10, fontweight='bold')
ax.legend(fontsize=9)
cbar = fig.colorbar(sc, ax=ax, shrink=0.8)
cbar.set_label('Sequencing Depth', fontsize=8)

# Panel C: Multi-scale entropy comparison
ax = axes[1, 0]

# Neural entropy values from Hafting analysis
# Columns: neuron_id, spatial_entropy, temporal_entropy, mean_neural_entropy
mean_neural = entropy_data['mean_neural_entropy'].mean()
mean_spatial = entropy_data['spatial_entropy'].mean()
mean_temporal = entropy_data['temporal_entropy'].mean()

# Build comparison data
categories = ['Neural\n(spike trains)', 'Spatial\n(rate maps)', 'Temporal\n(firing patterns)',
              'Microbiome\n(gut diversity)']
values = [
    mean_neural,
    mean_spatial,
    mean_temporal,
    df['shannon_entropy'].mean(),
]

colors_c = ['C0', 'C1', 'C3', 'C2']
bars = ax.bar(categories, values, color=colors_c, alpha=0.8, edgecolor='white',
              linewidth=0.5)
ax.set_ylabel('Shannon Entropy (bits)', fontsize=10)
ax.set_title('C. Entropy Across Biological Scales', fontsize=10, fontweight='bold')

for bar, val in zip(bars, values):
    ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.15,
            f'{val:.2f}', ha='center', va='bottom', fontsize=9, fontweight='bold')

# Panel D: Conceptual entropy gradient diagram
ax = axes[1, 1]
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)

# Draw entropy gradient
scales = ['Molecular\nOscillations', 'Cellular\nFiring', 'Population\nManifold',
          'Gut\nMicrobiome', 'Organism\nBehavior']
x_pos = np.linspace(1, 9, 5)
y_entropy = [1.5, 0.26, 5.17, 5.17, 8.0]  # conceptual entropy values
y_scaled = [1 + 7 * (v - min(y_entropy)) / (max(y_entropy) - min(y_entropy)) for v in y_entropy]

# Background gradient
for i in range(len(x_pos) - 1):
    ax.fill_between([x_pos[i], x_pos[i+1]], 0, 10,
                    alpha=0.1, color=f'C{i}')

# Plot entropy curve
ax.plot(x_pos, y_scaled, 'ko-', linewidth=2, markersize=8, zorder=5)
for i, (xp, yp, label) in enumerate(zip(x_pos, y_scaled, scales)):
    ax.text(xp, yp + 0.6, label, ha='center', va='bottom', fontsize=8,
            fontweight='bold')

# Arrow showing entropy flow
ax.annotate('', xy=(9.5, 8.5), xytext=(0.5, 1.5),
            arrowprops=dict(arrowstyle='->', color='gray', lw=2,
                           connectionstyle='arc3,rad=0.2'))
ax.text(5, 0.5, 'Entropy gradient across biological scales',
        ha='center', fontsize=9, style='italic', color='gray')

ax.set_title('D. Multi-Scale Entropy Framework', fontsize=10, fontweight='bold')
ax.set_xticks([])
ax.set_yticks([])
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['bottom'].set_visible(False)
ax.spines['left'].set_visible(False)

fig.suptitle('Figure 4: Entropy Analysis Across Biological Scales',
             fontsize=13, fontweight='bold', y=1.01)

plt.tight_layout()
plt.savefig(os.path.join(FIG_DIR, "fig4_microbiome_entropy.png"), dpi=300,
            bbox_inches='tight', facecolor='white')
plt.savefig(os.path.join(FIG_DIR, "fig4_microbiome_entropy.pdf"),
            bbox_inches='tight', facecolor='white')
plt.close()

print("\nFigure 4 saved.")
print(f"Microbiome Shannon entropy: {df['shannon_entropy'].mean():.3f} +/- {df['shannon_entropy'].std():.3f}")
print(f"Richness-entropy correlation: r={r:.4f}, p={p:.2e}")
