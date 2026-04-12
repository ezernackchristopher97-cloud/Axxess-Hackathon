"""
Figure 1: Grid cell firing rate maps.
Panel A: Hafting et al. (2005) rate maps (13 neurons, tetrode recordings)
Panel B: Gardner et al. (2022) rate maps (selected neurons, Neuropixels)
Each panel has its own colorbar scaled to its data range.

Author: Christopher Ezernack
"""

import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.gridspec import GridSpec
from mpl_toolkits.axes_grid1 import make_axes_locatable

PROJECT_DIR = os.path.join(os.path.dirname(__file__), "..")
FIG_DIR = os.path.join(PROJECT_DIR, "outputs", "figures")
os.makedirs(FIG_DIR, exist_ok=True)

# ----------------------------------------------------------------
# Load Hafting rate maps
# ----------------------------------------------------------------
hafting_dir = os.path.join(PROJECT_DIR, "outputs", "rate_maps")
hafting_maps = []
hafting_labels = []
for fname in sorted(os.listdir(hafting_dir)):
    if fname.endswith('.npy'):
        rm = np.load(os.path.join(hafting_dir, fname))
        hafting_maps.append(rm)
        label = fname.replace('rate_map_', '').replace('.npy', '')
        hafting_labels.append(label)

peak_rates = [np.nanmax(rm) for rm in hafting_maps]
top_idx = np.argsort(peak_rates)[::-1][:6]
hafting_sel = [hafting_maps[i] for i in top_idx]
hafting_sel_labels = [hafting_labels[i] for i in top_idx]

# ----------------------------------------------------------------
# Load Gardner rate maps
# ----------------------------------------------------------------
gardner_rm_dir = os.path.join(PROJECT_DIR, "outputs", "gardner", "rate_maps")
gardner_maps = []
gardner_labels = []

for mod in ['mod1', 'mod2', 'mod3']:
    mod_dir = os.path.join(gardner_rm_dir, mod)
    if not os.path.exists(mod_dir):
        continue
    for fname in sorted(os.listdir(mod_dir)):
        if fname.endswith('.npy'):
            rm = np.load(os.path.join(mod_dir, fname))
            gardner_maps.append(rm)
            nid = fname.replace('rate_map_', '').replace('.npy', '')
            gardner_labels.append(f"{mod}_n{nid}")

peak_rates_g = [np.nanmax(rm) for rm in gardner_maps]
top_idx_g = np.argsort(peak_rates_g)[::-1][:6]
gardner_sel = [gardner_maps[i] for i in top_idx_g]
gardner_sel_labels = [gardner_labels[i] for i in top_idx_g]

# ----------------------------------------------------------------
# Create figure with separate normalization per row
# ----------------------------------------------------------------
fig, axes = plt.subplots(2, 7, figsize=(14, 6),
                          gridspec_kw={'width_ratios': [1,1,1,1,1,1,0.08],
                                       'hspace': 0.4, 'wspace': 0.12})

# Panel A: Hafting
hafting_vmax = max(np.nanmax(rm) for rm in hafting_sel)
for i in range(6):
    ax = axes[0, i]
    rm = hafting_sel[i]
    rm_clean = np.nan_to_num(rm, nan=0.0)
    im_h = ax.imshow(rm_clean.T, origin='lower', cmap='hot',
                     interpolation='bilinear', aspect='equal',
                     vmin=0, vmax=hafting_vmax)
    ax.set_xticks([])
    ax.set_yticks([])
    peak = np.nanmax(rm)
    ax.set_title(f'{peak:.1f} Hz', fontsize=8, pad=3)

axes[0, 0].set_ylabel('Hafting (2005)\n13 neurons', fontsize=9, fontweight='bold')

# Colorbar for Hafting
cbar_h = fig.colorbar(im_h, cax=axes[0, 6])
cbar_h.set_label('Hz', fontsize=8)

# Panel B: Gardner
gardner_vmax = max(np.nanmax(rm) for rm in gardner_sel)
for i in range(6):
    ax = axes[1, i]
    rm = gardner_sel[i]
    im_g = ax.imshow(rm.T, origin='lower', cmap='hot',
                     interpolation='bilinear', aspect='equal',
                     vmin=0, vmax=gardner_vmax)
    ax.set_xticks([])
    ax.set_yticks([])
    peak = np.nanmax(rm)
    ax.set_title(f'{peak:.2f} Hz', fontsize=8, pad=3)

axes[1, 0].set_ylabel('Gardner (2022)\nNeuropixels', fontsize=9, fontweight='bold')

# Colorbar for Gardner
cbar_g = fig.colorbar(im_g, cax=axes[1, 6])
cbar_g.set_label('Hz', fontsize=8)

fig.suptitle('Figure 1: Grid Cell Firing Rate Maps', fontsize=13,
             fontweight='bold', y=0.98)

plt.savefig(os.path.join(FIG_DIR, "fig1_rate_maps.png"), dpi=300,
            bbox_inches='tight', facecolor='white')
plt.savefig(os.path.join(FIG_DIR, "fig1_rate_maps.pdf"),
            bbox_inches='tight', facecolor='white')
plt.close()

print("Figure 1 saved.")
print(f"Hafting peak rates: {[f'{np.nanmax(rm):.1f}' for rm in hafting_sel]} Hz")
print(f"Gardner peak rates: {[f'{np.nanmax(rm):.3f}' for rm in gardner_sel]} Hz")
