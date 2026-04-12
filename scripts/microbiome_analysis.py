"""
Microbiome diversity analysis using American Gut Project data.
Computes Shannon entropy and species richness for gut (stool) samples
to support the evolutionary pressure argument in the paper.
"""
import numpy as np
import pandas as pd
import os
import json

output_dir = "/home/ubuntu/ENTPTCCONPAPER26/outputs/microbiome"
os.makedirs(output_dir, exist_ok=True)

# Try to load the BIOM file
biom_path = "/home/ubuntu/ENTPTCCONPAPER26/data/microbiome/ag_otu_table.biom"

try:
    # Try biom-format library
    import biom
    table = biom.load_table(biom_path)
    print(f"BIOM table loaded: {table.shape[0]} OTUs x {table.shape[1]} samples")
    
    # Convert to dense array
    otu_data = table.to_dataframe(dense=True)
    print(f"OTU table shape: {otu_data.shape}")
    
    # Compute Shannon entropy for each sample
    def shannon_entropy(counts):
        counts = counts[counts > 0]
        total = counts.sum()
        if total == 0:
            return 0.0
        p = counts / total
        return -np.sum(p * np.log2(p))
    
    # Compute diversity metrics per sample
    results = []
    for col in otu_data.columns:
        sample_counts = otu_data[col].values
        h = shannon_entropy(sample_counts)
        richness = np.sum(sample_counts > 0)
        total_reads = sample_counts.sum()
        results.append({
            'sample_id': col,
            'shannon_entropy': h,
            'species_richness': richness,
            'total_reads': total_reads
        })
    
    df = pd.DataFrame(results)
    df.to_csv(os.path.join(output_dir, "microbiome_diversity.csv"), index=False)
    
    print(f"\nDiversity metrics computed for {len(df)} samples")
    print(f"Shannon entropy: mean={df['shannon_entropy'].mean():.3f}, "
          f"std={df['shannon_entropy'].std():.3f}, "
          f"range=[{df['shannon_entropy'].min():.3f}, {df['shannon_entropy'].max():.3f}]")
    print(f"Species richness: mean={df['species_richness'].mean():.1f}, "
          f"std={df['species_richness'].std():.1f}, "
          f"range=[{df['species_richness'].min():.0f}, {df['species_richness'].max():.0f}]")
    
    # Summary stats
    summary = {
        'n_samples': len(df),
        'n_otus': otu_data.shape[0],
        'shannon_mean': float(df['shannon_entropy'].mean()),
        'shannon_std': float(df['shannon_entropy'].std()),
        'shannon_min': float(df['shannon_entropy'].min()),
        'shannon_max': float(df['shannon_entropy'].max()),
        'richness_mean': float(df['species_richness'].mean()),
        'richness_std': float(df['species_richness'].std()),
        'richness_min': float(df['species_richness'].min()),
        'richness_max': float(df['species_richness'].max()),
    }
    
    with open(os.path.join(output_dir, "microbiome_summary.json"), 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("\nSummary saved to microbiome_summary.json")
    
except ImportError:
    print("biom-format not installed, installing...")
    import subprocess
    subprocess.run(["sudo", "pip3", "install", "biom-format"], check=True)
    print("Installed biom-format. Re-run this script.")
    
except Exception as e:
    print(f"Error with BIOM: {e}")
    print("Falling back to metadata analysis...")
    
    # Use the metadata file to extract what we can
    meta_path = "/home/ubuntu/ENTPTCCONPAPER26/data/microbiome/hmp_stool_diversity.csv"
    df_meta = pd.read_csv(meta_path, sep='\t', low_memory=False)
    print(f"Metadata loaded: {df_meta.shape}")
    print(f"Columns: {list(df_meta.columns[:20])}")
