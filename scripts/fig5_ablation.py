"""
Figure 5: Ablation studies.
Panel A: Effect of neuron count on H1 persistence (Gardner data)
Panel B: Real vs shuffled spike data topology
Panel C: Effect of bin size on manifold structure

Author: Christopher Ezernack
"""

import os
import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from ripser import ripser
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

PROJECT_DIR = os.path.join(os.path.dirname(__file__), "..")
FIG_DIR = os.path.join(PROJECT_DIR, "outputs", "figures")
DATA_DIR = os.path.join(PROJECT_DIR, "data", "gardner2022", "Toroidal_topology_grid_cell_data")
os.makedirs(FIG_DIR, exist_ok=True)

# ----------------------------------------------------------------
# Load Gardner Module 1 data for ablation
# ----------------------------------------------------------------
print("Loading Gardner data for ablation studies...")
data = np.load(os.path.join(DATA_DIR, "rat_r_day1_grid_modules_1_2_3.npz"), allow_pickle=True)
spk_dict = data['spikes_mod1'].item()
t = data['t']
x = data['x']
y = data['y']

t_start, t_end = 7457, 16045
neuron_ids = sorted(spk_dict.keys())
n_total = len(neuron_ids)
print(f"Module 1: {n_total} neurons")

def build_activity(spk_dict, neuron_subset, t_start, t_end, bin_size=0.025):
    time_bins = np.arange(t_start, t_end, bin_size)
    n_bins = len(time_bins) - 1
    activity = np.zeros((n_bins, len(neuron_subset)), dtype=np.float32)
    for j, nid in enumerate(neuron_subset):
        spk = spk_dict[nid]
        spk = spk[(spk >= t_start) & (spk < t_end)]
        counts, _ = np.histogram(spk, bins=time_bins)
        activity[:, j] = counts / bin_size
    return activity, time_bins[:-1]

def compute_h1_persistence(activity, max_pts=500, seed=42):
    scaler = StandardScaler()
    scaled = scaler.fit_transform(activity)
    n_comp = min(6, activity.shape[1], activity.shape[0])
    pca = PCA(n_components=n_comp)
    pca_emb = pca.fit_transform(scaled)
    pca_3d = pca_emb[:, :min(3, pca_emb.shape[1])]
    
    rng = np.random.RandomState(seed)
    n = pca_3d.shape[0]
    if n > max_pts:
        idx = rng.choice(n, max_pts, replace=False)
        sub = pca_3d[idx]
    else:
        sub = pca_3d
    
    result = ripser(sub, maxdim=1)
    h1 = result['dgms'][1]
    h1_finite = h1[np.isfinite(h1[:, 1])]
    if len(h1_finite) == 0:
        return 0.0, 0, pca.explained_variance_ratio_
    pers = h1_finite[:, 1] - h1_finite[:, 0]
    return float(np.max(pers)), len(h1_finite), pca.explained_variance_ratio_

# ----------------------------------------------------------------
# Ablation A: Neuron count
# ----------------------------------------------------------------
print("\nAblation A: Neuron count sweep...")
neuron_counts = [10, 20, 40, 60, 80, 100, 120, 140, 166]
h1_by_count = []
h1_n_by_count = []
var_by_count = []

rng = np.random.RandomState(42)
for nc in neuron_counts:
    if nc >= n_total:
        subset = neuron_ids
    else:
        subset = list(rng.choice(neuron_ids, nc, replace=False))
    
    act, _ = build_activity(spk_dict, subset, t_start, t_end)
    h1_max, h1_n, var_ratio = compute_h1_persistence(act)
    h1_by_count.append(h1_max)
    h1_n_by_count.append(h1_n)
    var_by_count.append(np.sum(var_ratio[:3]))
    print(f"  n={nc}: H1 max={h1_max:.3f}, H1 count={h1_n}, var3={np.sum(var_ratio[:3]):.4f}")

# ----------------------------------------------------------------
# Ablation B: Real vs shuffled
# ----------------------------------------------------------------
print("\nAblation B: Real vs shuffled spikes...")
act_real, _ = build_activity(spk_dict, neuron_ids, t_start, t_end)
h1_real, h1_n_real, var_real = compute_h1_persistence(act_real)

# Shuffle: circularly shift each neuron's spike train independently
n_shuffles = 5
h1_shuffled = []
for s in range(n_shuffles):
    act_shuf = act_real.copy()
    for j in range(act_shuf.shape[1]):
        shift = rng.randint(0, act_shuf.shape[0])
        act_shuf[:, j] = np.roll(act_shuf[:, j], shift)
    h1_s, _, _ = compute_h1_persistence(act_shuf, seed=42+s)
    h1_shuffled.append(h1_s)
    print(f"  Shuffle {s+1}: H1 max={h1_s:.3f}")

# ----------------------------------------------------------------
# Ablation C: Bin size effect
# ----------------------------------------------------------------
print("\nAblation C: Bin size sweep...")
bin_sizes = [0.01, 0.025, 0.05, 0.1, 0.2, 0.5]
h1_by_bin = []
for bs in bin_sizes:
    act_b, _ = build_activity(spk_dict, neuron_ids, t_start, t_end, bin_size=bs)
    h1_b, _, _ = compute_h1_persistence(act_b)
    h1_by_bin.append(h1_b)
    print(f"  bin={bs}s: H1 max={h1_b:.3f}")

# ----------------------------------------------------------------
# Create figure
# ----------------------------------------------------------------
fig, axes = plt.subplots(1, 3, figsize=(16, 5))

# Panel A: Neuron count
ax = axes[0]
ax.plot(neuron_counts, h1_by_count, 'o-', color='C0', linewidth=2, markersize=6)
ax.set_xlabel('Number of Neurons', fontsize=10)
ax.set_ylabel('Max H1 Persistence', fontsize=10)
ax.set_title('A. Effect of Population Size on\nTopological Signal', fontsize=11, fontweight='bold')
ax.axhline(y=1.0, color='gray', linestyle='--', alpha=0.5)
ax.text(neuron_counts[-1], 1.03, 'persistence = 1.0', fontsize=8, color='gray', ha='right')

# Secondary y-axis for variance
ax2 = ax.twinx()
ax2.plot(neuron_counts, [v*100 for v in var_by_count], 's--', color='C1',
         linewidth=1.5, markersize=5, alpha=0.7)
ax2.set_ylabel('PCA Variance (top 3, %)', fontsize=9, color='C1')
ax2.tick_params(axis='y', labelcolor='C1')

# Panel B: Real vs shuffled
ax = axes[1]
bar_labels = ['Real Data'] + [f'Shuffle {i+1}' for i in range(n_shuffles)]
bar_values = [h1_real] + h1_shuffled
colors_b = ['C0'] + ['C3'] * n_shuffles
bars = ax.bar(bar_labels, bar_values, color=colors_b, alpha=0.8, edgecolor='white')
ax.set_ylabel('Max H1 Persistence', fontsize=10)
ax.set_title('B. Real vs. Shuffled Spike Data\n(166 neurons)', fontsize=11, fontweight='bold')
ax.tick_params(axis='x', rotation=30)
for bar, val in zip(bars, bar_values):
    ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.02,
            f'{val:.3f}', ha='center', va='bottom', fontsize=8)

# Panel C: Bin size
ax = axes[2]
ax.semilogx(bin_sizes, h1_by_bin, 'D-', color='C2', linewidth=2, markersize=6)
ax.set_xlabel('Bin Size (seconds)', fontsize=10)
ax.set_ylabel('Max H1 Persistence', fontsize=10)
ax.set_title('C. Effect of Temporal Resolution\non Topology', fontsize=11, fontweight='bold')
ax.set_xticks(bin_sizes)
ax.set_xticklabels([f'{b}s' for b in bin_sizes], fontsize=8)

fig.suptitle('Figure 5: Ablation Studies (Gardner Module 1, Rat R Day 1)',
             fontsize=13, fontweight='bold', y=1.02)

plt.tight_layout()
plt.savefig(os.path.join(FIG_DIR, "fig5_ablation.png"), dpi=300,
            bbox_inches='tight', facecolor='white')
plt.savefig(os.path.join(FIG_DIR, "fig5_ablation.pdf"),
            bbox_inches='tight', facecolor='white')
plt.close()

print("\nFigure 5 saved.")
print(f"Neuron count sweep: {list(zip(neuron_counts, h1_by_count))}")
print(f"Real H1: {h1_real:.4f}, Shuffled mean: {np.mean(h1_shuffled):.4f}")
print(f"Bin size sweep: {list(zip(bin_sizes, h1_by_bin))}")
