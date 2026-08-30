# Implement MERLIN on the existing GitHub project

## Safest route: preserve V25, replace `main`

Do not destroy the only copy of old MERLIN.

### A. Preserve the old repository

On GitHub:

1. Open the existing MERLIN repository.
2. Create a branch named:

```text
legacy-v25
```

from the current V25 `main`.
3. Confirm the branch exists before replacing `main`.

This keeps the complete old code/history available.

### B. Replace active `main` with the CNC MERLIN rebuild

The cleanest method is Git on Windows.

1. Install Git for Windows if needed.
2. Download/extract `MERLIN_CNC_V1.zip`.
3. Open PowerShell.
4. Clone your existing MERLIN repository:

```powershell
git clone https://github.com/YOUR-USERNAME/YOUR-MERLIN-REPO.git MERLIN
cd MERLIN
```

5. Preserve an additional local tag/branch if desired:

```powershell
git branch legacy-v25-local
```

6. Remove the working-tree files from `main` while preserving `.git`:

```powershell
git rm -r .
```

If hidden files remain, remove them manually except `.git`.

7. Copy the **contents** of the extracted new MERLIN folder into this cloned repository. Do not copy the outer folder itself.

8. Commit:

```powershell
git add .
git commit -m "Repurpose MERLIN as CNC business operating system"
git push origin main
```

The prior Git history still exists and the `legacy-v25` branch remains available.

## Alternative: new clean MERLIN repository

If browser-only GitHub management is easier, rename the old repository `MERLIN-LEGACY`, create a fresh `MERLIN`, and upload this build. That is operationally simpler but does not preserve the old history in the same repository.

## GitHub Pages

After the new `main` is live:

1. Settings → Pages.
2. Build and deployment → Source → **GitHub Actions**.
3. Settings → Secrets and variables → Actions → Variables.
4. Create:

```text
MERLIN_API_BASE_URL
```

with the deployed Node backend URL.
5. Run **Deploy MERLIN Pages**.

## Backend secrets

Do not put these in Pages variables or JavaScript:

```text
OPENAI_API_KEY
MERLIN_AUTOMATION_TOKEN
```

They belong on the backend host.
