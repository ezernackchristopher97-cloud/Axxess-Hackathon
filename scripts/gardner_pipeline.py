"""
Gardner et al. (2022) grid cell pipeline.
Processes Neuropixels recordings from the Figshare dataset.
Builds population activity matrices, computes rate maps,
manifold embeddings, and persistent homology per module.

Author: Christopher Ezernack
"""

import os
import sys
import json
import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from ripser import ripser
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

PROJECT_DIR = os.path.join(os.path.dirname(__file__), "..")
DATA_DIR = os.path.join(PROJECT_DIR, "data", "gardner2022", "Toroidal_topology_grid_cell_data")
OUT_DIR = os.path.join(PROJECT_DIR, "outputs", "gardner")

# ----------------------------------------------------------------
# Data loading
# ----------------------------------------------------------------

def load_gardner_data(rat_label, npz_file, sessions_file):
    """Load a single rat's data from the Gardner dataset."""
    data = np.load(os.path.join(DATA_DIR, npz_file), allow_pickle=True)
    
    # Parse sessions
    sessions = []
    with open(os.path.join(DATA_DIR, sessions_file), 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') is False:
                # Parse session info
                pass
            sessions.append(line)
    
    # Get module keys
    mod_keys = sorted([k for k in data.keys() if k.startswith('spikes_mod')])
    
    # Position data
    x = data['x']
    y = data['y']
    t = data['t']
    
    modules = {}
    for mk in mod_keys:
        spk_dict = data[mk].item()
        modules[mk] = spk_dict
    
    return {
        'rat': rat_label,
        'x': x, 'y': y, 't': t,
        'modules': modules,
        'mod_keys': mod_keys,
    }


def get_open_field_session(rat_label, t):
    """Return (start, end) times for the open field session."""
    # From the sessions files:
    session_info = {
        'rat_q': (27826, 31223),        # open_field_1
        'rat_r_day1': (7457, 16045),     # open_field_1
        'rat_r_day2': (7457, 16045),     # approximate; use full range
        'rat_s': (9939, 12363),          # open_field_1
    }
    if rat_label in session_info:
        return session_info[rat_label]
    return (float(t.min()), float(t.max()))


# ----------------------------------------------------------------
# Activity matrix
# ----------------------------------------------------------------

def build_module_activity(spk_dict, t, t_start, t_end, bin_size=0.025):
    """
    Build activity matrix for one module.
    spk_dict: {neuron_id: spike_times_array}
    Returns (activity, time_bins, neuron_ids)
    """
    time_bins = np.arange(t_start, t_end, bin_size)
    n_bins = len(time_bins) - 1
    neuron_ids = sorted(spk_dict.keys())
    n_neurons = len(neuron_ids)
    
    activity = np.zeros((n_bins, n_neurons), dtype=np.float32)
    for j, nid in enumerate(neuron_ids):
        spk = spk_dict[nid]
        spk = spk[(spk >= t_start) & (spk < t_end)]
        counts, _ = np.histogram(spk, bins=time_bins)
        activity[:, j] = counts / bin_size  # firing rate in Hz
    
    return activity, time_bins[:-1], neuron_ids


# ----------------------------------------------------------------
# Rate maps
# ----------------------------------------------------------------

def compute_rate_map(spike_x, spike_y, pos_x, pos_y, n_bins=50, sigma=2.0):
    """Compute a 2D firing rate map with Gaussian smoothing."""
    from scipy.ndimage import gaussian_filter
    
    x_range = (pos_x.min(), pos_x.max())
    y_range = (pos_y.min(), pos_y.max())
    
    occ, xedges, yedges = np.histogram2d(pos_x, pos_y, bins=n_bins,
                                          range=[x_range, y_range])
    spk, _, _ = np.histogram2d(spike_x, spike_y, bins=n_bins,
                                range=[x_range, y_range])
    
    # Smooth
    occ_smooth = gaussian_filter(occ, sigma=sigma)
    spk_smooth = gaussian_filter(spk, sigma=sigma)
    
    # Rate map
    rate_map = np.zeros_like(occ_smooth)
    valid = occ_smooth > 0.01
    rate_map[valid] = spk_smooth[valid] / occ_smooth[valid]
    
    return rate_map, xedges, yedges


def compute_module_rate_maps(spk_dict, x, y, t, t_start, t_end,
                              n_bins=50, sigma=2.0, dt=0.01):
    """Compute rate maps for all neurons in a module during open field."""
    # Get position during session
    mask = (t >= t_start) & (t <= t_end)
    pos_x = x[mask]
    pos_y = y[mask]
    pos_t = t[mask]
    
    rate_maps = {}
    for nid in sorted(spk_dict.keys()):
        spk = spk_dict[nid]
        spk = spk[(spk >= t_start) & (spk <= t_end)]
        
        # Map spikes to positions
        if len(spk) == 0:
            continue
        spike_idx = np.searchsorted(pos_t, spk, side='left')
        spike_idx = np.clip(spike_idx, 0, len(pos_x) - 1)
        spike_x = pos_x[spike_idx]
        spike_y = pos_y[spike_idx]
        
        rm, xe, ye = compute_rate_map(spike_x, spike_y, pos_x, pos_y,
                                       n_bins=n_bins, sigma=sigma)
        rate_maps[nid] = {
            'rate_map': rm,
            'peak_rate': float(rm.max()),
            'n_spikes': len(spk),
        }
    
    return rate_maps


# ----------------------------------------------------------------
# Manifold and topology
# ----------------------------------------------------------------

def compute_manifold_and_topology(activity, mod_label, out_dir, max_pca=6):
    """PCA + persistent homology on activity matrix."""
    os.makedirs(out_dir, exist_ok=True)
    
    # Standardize
    scaler = StandardScaler()
    scaled = scaler.fit_transform(activity)
    
    # PCA
    n_comp = min(max_pca, activity.shape[1], activity.shape[0])
    pca = PCA(n_components=n_comp)
    pca_emb = pca.fit_transform(scaled)
    var_ratio = pca.explained_variance_ratio_
    
    np.save(os.path.join(out_dir, f"pca_embedding_{mod_label}.npy"), pca_emb)
    
    # Save variance explained
    var_df = np.column_stack([
        np.arange(1, len(var_ratio) + 1),
        var_ratio,
        np.cumsum(var_ratio)
    ])
    np.savetxt(os.path.join(out_dir, f"pca_variance_{mod_label}.csv"),
               var_df, delimiter=",",
               header="PC,variance_ratio,cumulative_variance",
               comments="", fmt=["%.0f", "%.6f", "%.6f"])
    
    print(f"  PCA: top 3 variance = {var_ratio[:3]}, cumulative = {np.sum(var_ratio[:3]):.4f}")
    
    # UMAP
    try:
        import umap
        n_samples = scaled.shape[0]
        step = max(1, n_samples // 8000)
        scaled_sub = scaled[::step]
        
        reducer = umap.UMAP(n_components=3, n_neighbors=30, min_dist=0.1, random_state=42)
        umap_emb = reducer.fit_transform(scaled_sub)
        np.save(os.path.join(out_dir, f"umap_embedding_{mod_label}.npy"), umap_emb)
        print(f"  UMAP: {umap_emb.shape[0]} points embedded")
    except ImportError:
        umap_emb = None
        print("  UMAP not available")
    
    # Persistent homology on PCA (first 3 components)
    pca_3d = pca_emb[:, :min(3, pca_emb.shape[1])]
    n_pts = pca_3d.shape[0]
    max_pts = min(1000, n_pts)
    rng = np.random.RandomState(42)
    if n_pts > max_pts:
        idx = rng.choice(n_pts, max_pts, replace=False)
        sub = pca_3d[idx]
    else:
        sub = pca_3d
    
    print(f"  Running ripser on {sub.shape[0]} PCA points...")
    result_pca = ripser(sub, maxdim=1)
    
    # Save persistence summaries
    summaries = []
    for dim, dgm in enumerate(result_pca['dgms']):
        finite = dgm[np.isfinite(dgm[:, 1])]
        if len(finite) == 0:
            summaries.append({'dim': dim, 'n': 0, 'max_pers': 0, 'mean_pers': 0})
            continue
        pers = finite[:, 1] - finite[:, 0]
        summaries.append({
            'dim': dim,
            'n': len(finite),
            'max_pers': float(np.max(pers)),
            'mean_pers': float(np.mean(pers)),
        })
        np.savetxt(os.path.join(out_dir, f"diagram_H{dim}_{mod_label}_pca.csv"),
                   finite, delimiter=",", header="birth,death", comments="")
    
    with open(os.path.join(out_dir, f"persistence_summary_{mod_label}_pca.csv"), 'w') as f:
        f.write("dimension,n_features,max_persistence,mean_persistence\n")
        for s in summaries:
            f.write(f"{s['dim']},{s['n']},{s['max_pers']:.6f},{s['mean_pers']:.6f}\n")
    
    for s in summaries:
        print(f"    H{s['dim']}: {s['n']} features, max_pers={s['max_pers']:.4f}")
    
    # Persistent homology on UMAP
    if umap_emb is not None:
        n_pts_u = umap_emb.shape[0]
        max_pts_u = min(1000, n_pts_u)
        if n_pts_u > max_pts_u:
            idx_u = rng.choice(n_pts_u, max_pts_u, replace=False)
            sub_u = umap_emb[idx_u]
        else:
            sub_u = umap_emb
        
        print(f"  Running ripser on {sub_u.shape[0]} UMAP points...")
        result_umap = ripser(sub_u, maxdim=1)
        
        summaries_u = []
        for dim, dgm in enumerate(result_umap['dgms']):
            finite = dgm[np.isfinite(dgm[:, 1])]
            if len(finite) == 0:
                summaries_u.append({'dim': dim, 'n': 0, 'max_pers': 0, 'mean_pers': 0})
                continue
            pers = finite[:, 1] - finite[:, 0]
            summaries_u.append({
                'dim': dim,
                'n': len(finite),
                'max_pers': float(np.max(pers)),
                'mean_pers': float(np.mean(pers)),
            })
            np.savetxt(os.path.join(out_dir, f"diagram_H{dim}_{mod_label}_umap.csv"),
                       finite, delimiter=",", header="birth,death", comments="")
        
        with open(os.path.join(out_dir, f"persistence_summary_{mod_label}_umap.csv"), 'w') as f:
            f.write("dimension,n_features,max_persistence,mean_persistence\n")
            for s in summaries_u:
                f.write(f"{s['dim']},{s['n']},{s['max_pers']:.6f},{s['mean_pers']:.6f}\n")
        
        for s in summaries_u:
            print(f"    UMAP H{s['dim']}: {s['n']} features, max_pers={s['max_pers']:.4f}")
    
    return {
        'pca_embedding': pca_emb,
        'umap_embedding': umap_emb,
        'var_ratio': var_ratio,
        'pca_result': result_pca,
        'umap_result': result_umap if umap_emb is not None else None,
    }


# ----------------------------------------------------------------
# Main
# ----------------------------------------------------------------

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    
    # Process rat R day1 (largest dataset: 3 modules, 166+168+149 neurons)
    print("Loading Rat R Day 1 data...")
    rat_data = load_gardner_data(
        'rat_r_day1',
        'rat_r_day1_grid_modules_1_2_3.npz',
        'rat_r_day1_sessions.txt'
    )
    
    t_start, t_end = get_open_field_session('rat_r_day1', rat_data['t'])
    print(f"Open field session: {t_start:.0f} to {t_end:.0f} seconds")
    print(f"Duration: {(t_end - t_start)/60:.1f} minutes")
    
    all_results = {}
    
    for mk in rat_data['mod_keys']:
        mod_num = mk.replace('spikes_', '')
        spk_dict = rat_data['modules'][mk]
        n_neurons = len(spk_dict)
        print(f"\n{'='*60}")
        print(f"Processing {mk} ({n_neurons} neurons)")
        print(f"{'='*60}")
        
        # Rate maps
        print("Computing rate maps...")
        rate_maps = compute_module_rate_maps(
            spk_dict, rat_data['x'], rat_data['y'], rat_data['t'],
            t_start, t_end, n_bins=50, sigma=2.0
        )
        
        # Save rate maps
        rm_dir = os.path.join(OUT_DIR, "rate_maps", mod_num)
        os.makedirs(rm_dir, exist_ok=True)
        for nid, rm_data in rate_maps.items():
            np.save(os.path.join(rm_dir, f"rate_map_{nid}.npy"), rm_data['rate_map'])
        
        n_active = len(rate_maps)
        peak_rates = [rm_data['peak_rate'] for rm_data in rate_maps.values()]
        print(f"  {n_active} neurons with spikes, "
              f"peak rates: mean={np.mean(peak_rates):.1f}, "
              f"max={np.max(peak_rates):.1f} Hz")
        
        # Activity matrix
        print("Building activity matrix...")
        activity, time_bins, neuron_ids = build_module_activity(
            spk_dict, rat_data['t'], t_start, t_end, bin_size=0.025
        )
        print(f"  Activity matrix: {activity.shape}")
        
        # Save activity matrix
        act_dir = os.path.join(OUT_DIR, "activity")
        os.makedirs(act_dir, exist_ok=True)
        np.save(os.path.join(act_dir, f"activity_{mod_num}.npy"), activity)
        
        # Manifold + topology
        print("Computing manifold and topology...")
        manifold_dir = os.path.join(OUT_DIR, "manifold")
        results = compute_manifold_and_topology(activity, mod_num, manifold_dir)
        
        all_results[mk] = {
            'n_neurons': n_neurons,
            'n_active': n_active,
            'rate_maps': rate_maps,
            'manifold': results,
        }
    
    # Also process rat Q (2 modules)
    print(f"\n{'='*60}")
    print("Loading Rat Q data...")
    print(f"{'='*60}")
    rat_q = load_gardner_data('rat_q', 'rat_q_grid_modules_1_2.npz', 'rat_q_sessions.txt')
    t_start_q, t_end_q = get_open_field_session('rat_q', rat_q['t'])
    
    for mk in rat_q['mod_keys']:
        mod_label = f"ratq_{mk.replace('spikes_', '')}"
        spk_dict = rat_q['modules'][mk]
        n_neurons = len(spk_dict)
        print(f"\nProcessing {mod_label} ({n_neurons} neurons)")
        
        activity, time_bins, neuron_ids = build_module_activity(
            spk_dict, rat_q['t'], t_start_q, t_end_q, bin_size=0.025
        )
        print(f"  Activity matrix: {activity.shape}")
        
        manifold_dir = os.path.join(OUT_DIR, "manifold")
        results = compute_manifold_and_topology(activity, mod_label, manifold_dir)
    
    # Summary
    print(f"\n{'='*60}")
    print("GARDNER PIPELINE SUMMARY")
    print(f"{'='*60}")
    
    summary = {}
    for mk, res in all_results.items():
        mod_num = mk.replace('spikes_', '')
        vr = res['manifold']['var_ratio']
        summary[mod_num] = {
            'n_neurons': res['n_neurons'],
            'n_active': res['n_active'],
            'pca_var_top3': float(np.sum(vr[:3])),
            'pca_var_top6': float(np.sum(vr[:min(6, len(vr))])),
        }
        print(f"  {mod_num}: {res['n_neurons']} neurons, "
              f"PCA top-3 var = {np.sum(vr[:3]):.4f}")
    
    with open(os.path.join(OUT_DIR, "summary.json"), 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("\nAll Gardner pipeline outputs saved.")


if __name__ == "__main__":
    main()
