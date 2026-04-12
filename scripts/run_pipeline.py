"""
Master pipeline script for grid cell analysis.
Executes all steps end to end with no manual intervention.

Author: Christopher Ezernack
"""

import os
import sys
import subprocess
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)


def run_step(name, script):
    """Run a pipeline step and report timing."""
    print(f"\n{'='*60}")
    print(f"STEP: {name}")
    print(f"{'='*60}")
    t0 = time.time()
    result = subprocess.run(
        [sys.executable, os.path.join(SCRIPT_DIR, script)],
        cwd=PROJECT_DIR,
        capture_output=False
    )
    elapsed = time.time() - t0
    if result.returncode != 0:
        print(f"  FAILED (exit code {result.returncode})")
        return False
    print(f"  Completed in {elapsed:.1f}s")
    return True


def main():
    print("Grid Cell Analysis Pipeline")
    print(f"Project directory: {PROJECT_DIR}")
    print(f"Start time: {time.strftime('%Y-%m-%d %H:%M:%S')}")

    os.makedirs(os.path.join(PROJECT_DIR, "outputs", "rate_maps"), exist_ok=True)
    os.makedirs(os.path.join(PROJECT_DIR, "outputs", "manifold"), exist_ok=True)
    os.makedirs(os.path.join(PROJECT_DIR, "outputs", "topology"), exist_ok=True)
    os.makedirs(os.path.join(PROJECT_DIR, "outputs", "entropy"), exist_ok=True)
    os.makedirs(os.path.join(PROJECT_DIR, "outputs", "figures"), exist_ok=True)
    os.makedirs(os.path.join(PROJECT_DIR, "outputs", "ablation"), exist_ok=True)

    steps = [
        ("1. Preprocessing and activity matrix", "preprocessing.py"),
        ("2. Firing rate maps", "rate_maps.py"),
        ("3. Manifold embedding (PCA + UMAP)", "manifold.py"),
        ("4. Persistent homology", "topology.py"),
        ("5. Entropy metrics", "entropy.py"),
        ("6. Ablation studies", "ablation.py"),
    ]

    results = {}
    for name, script in steps:
        success = run_step(name, script)
        results[name] = success
        if not success:
            print(f"\nWARNING: Step '{name}' failed. Continuing with remaining steps.")

    print(f"\n{'='*60}")
    print("PIPELINE SUMMARY")
    print(f"{'='*60}")
    for name, success in results.items():
        status = "OK" if success else "FAILED"
        print(f"  {name}: {status}")
    print(f"\nEnd time: {time.strftime('%Y-%m-%d %H:%M:%S')}")

    all_ok = all(results.values())
    if all_ok:
        print("\nAll steps completed successfully.")
    else:
        print("\nSome steps failed. Check output above for details.")
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
