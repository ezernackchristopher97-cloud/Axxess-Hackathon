"""
Preprocessing module for Hafting et al. (2005) grid cell data.
Loads MAT files, extracts position and spike timestamps,
flattens arrays, removes NaNs, and aligns spikes to position.

Author: Christopher Ezernack
"""

import os
import numpy as np
import scipy.io as sio


def load_mat_file(filepath):
    """Load a single MAT file and return the raw dictionary."""
    return sio.loadmat(filepath)


def extract_position(mat_data):
    """
    Extract position timestamps, x, and y from a MAT file dictionary.
    Flattens arrays and removes NaN entries.
    Returns (timestamps, x, y) as 1D arrays with NaNs removed.
    """
    ts = mat_data["pos_timeStamps"].flatten()
    x = mat_data["pos_x"].flatten()
    y = mat_data["pos_y"].flatten()

    valid = ~(np.isnan(ts) | np.isnan(x) | np.isnan(y))
    return ts[valid], x[valid], y[valid]


def extract_spike_times(mat_data):
    """
    Extract spike timestamps for all neurons in a MAT file.
    Identifies neuron keys by looking for timestamp-like fields
    that are not position data.
    Returns a dict: {neuron_id: 1D array of spike times (NaN-free)}.
    """
    neurons = {}
    pos_keys = {"pos_timeStamps", "pos_x", "pos_y"}

    for key in mat_data:
        if key.startswith("__") or key in pos_keys:
            continue
        val = mat_data[key]
        if isinstance(val, np.ndarray) and val.dtype in [np.float64, np.float32]:
            spikes = val.flatten()
            spikes = spikes[~np.isnan(spikes)]
            neuron_id = key.replace("_timeStamps", "")
            neurons[neuron_id] = spikes

    return neurons


def align_spikes_to_position(pos_ts, spike_times):
    """
    For each spike, find the nearest position timestamp index.
    Returns an array of position indices corresponding to each spike.
    Only includes spikes that fall within the position recording window.
    """
    mask = (spike_times >= pos_ts[0]) & (spike_times <= pos_ts[-1])
    valid_spikes = spike_times[mask]
    indices = np.searchsorted(pos_ts, valid_spikes, side="left")
    indices = np.clip(indices, 0, len(pos_ts) - 1)
    return valid_spikes, indices


def load_all_data(data_dir):
    """
    Load all MAT files from data_dir.
    Returns a list of session dicts, each containing:
        - filename: source file name
        - pos_ts, pos_x, pos_y: cleaned position arrays
        - neurons: dict of {neuron_id: {spike_times, pos_indices}}
    """
    sessions = []

    for fname in sorted(os.listdir(data_dir)):
        if not fname.endswith(".mat"):
            continue

        filepath = os.path.join(data_dir, fname)
        mat_data = load_mat_file(filepath)

        pos_ts, pos_x, pos_y = extract_position(mat_data)
        raw_neurons = extract_spike_times(mat_data)

        neurons = {}
        for nid, spk in raw_neurons.items():
            valid_spikes, pos_idx = align_spikes_to_position(pos_ts, spk)
            neurons[nid] = {
                "spike_times": valid_spikes,
                "pos_indices": pos_idx,
                "spike_x": pos_x[pos_idx],
                "spike_y": pos_y[pos_idx],
            }

        session = {
            "filename": fname,
            "pos_ts": pos_ts,
            "pos_x": pos_x,
            "pos_y": pos_y,
            "neurons": neurons,
        }
        sessions.append(session)
        print(f"Loaded {fname}: {len(pos_ts)} position samples, "
              f"{len(neurons)} neurons")

    return sessions


def build_activity_matrix(sessions, bin_size=0.02):
    """
    Build a population activity matrix shaped (timepoints, neurons).
    Uses the first session with the most neurons as the primary session.
    Bins spike counts into time bins of bin_size seconds.
    Returns (activity_matrix, neuron_ids, time_bins).
    """
    all_neurons = {}
    best_session = None
    best_pos_ts = None

    for sess in sessions:
        if best_session is None or len(sess["neurons"]) > len(best_session["neurons"]):
            best_session = sess
            best_pos_ts = sess["pos_ts"]

    pos_ts = best_pos_ts
    t_start = pos_ts[0]
    t_end = pos_ts[-1]
    time_bins = np.arange(t_start, t_end, bin_size)
    n_bins = len(time_bins) - 1

    for sess in sessions:
        for nid, ndata in sess["neurons"].items():
            if nid not in all_neurons:
                all_neurons[nid] = ndata["spike_times"]
            else:
                all_neurons[nid] = np.concatenate(
                    [all_neurons[nid], ndata["spike_times"]]
                )

    neuron_ids = sorted(all_neurons.keys())
    n_neurons = len(neuron_ids)

    activity = np.zeros((n_bins, n_neurons), dtype=np.float32)
    for j, nid in enumerate(neuron_ids):
        spk = all_neurons[nid]
        spk = spk[(spk >= t_start) & (spk < t_end)]
        counts, _ = np.histogram(spk, bins=time_bins)
        activity[:, j] = counts / bin_size

    return activity, neuron_ids, time_bins[:-1]


if __name__ == "__main__":
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    sessions = load_all_data(data_dir)
    print(f"\nTotal sessions loaded: {len(sessions)}")
    total_neurons = sum(len(s["neurons"]) for s in sessions)
    print(f"Total neuron recordings: {total_neurons}")

    activity, neuron_ids, time_bins = build_activity_matrix(sessions)
    print(f"\nActivity matrix shape: {activity.shape}")
    print(f"  (timepoints={activity.shape[0]}, neurons={activity.shape[1]})")
    print(f"Neuron IDs: {neuron_ids}")

    out_dir = os.path.join(os.path.dirname(__file__), "..", "outputs")
    np.save(os.path.join(out_dir, "activity_matrix.npy"), activity)
    np.savetxt(os.path.join(out_dir, "activity_matrix.csv"), activity,
               delimiter=",", header=",".join(neuron_ids), comments="")
    print(f"Saved activity_matrix.npy and activity_matrix.csv")
