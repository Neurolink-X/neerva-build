# Public repository conversion — owner release checklist

Public standard GitHub-hosted runners can avoid private compute quota restrictions; account/org restrictions can still prevent runner allocation. Do not expose proprietary code solely to save compute without considering irreversible copies.

1. On an authorized full Git mirror with all remote branches and tags, run the heuristic scanner `python3 scripts/release/pre-public-audit.py`. Review every flagged historical blob; findings may include placeholders or disposable local fixtures. Rotate real secrets, remove historical copies via approved procedure, and independently audit LFS, GitHub Actions historical logs/artifacts, PRs/issues, personal payment data, third-party assets and licensing. Do not publish reports containing sensitive values.
2. Keep production secrets in platform secret stores. Review Vercel Git integration and Supabase authorization. Confirm no service credentials or real customer records are embedded in public source or historical logs. Review unlicensed staged photo/brand candidates; moving a file out of public/ does not make it private on GitHub.
3. Review all branches, not just this PR. The recovery workflow must be private-only; standard CI uses read-only token, standard Linux, and isolated fixtures. Require approval for external contributors and protect main.
4. Repository owner: Settings > General > Danger Zone > Change repository visibility > Make public, then acknowledge GitHub warnings. Confirm the exact repo is Neurolink-X/neerva-build, not AuroTap or another project.
5. Verify actual visibility, rerun latest CI, confirm a runner was allocated, and fix real test failures. Keep release and migration gates enabled. Returning to private cannot retract existing copies or public forks.
6. Do not consider this checklist or scanner a clearance: historical logs and asset rights require separate operator review.

Official references: https://docs.github.com/en/actions/concepts/billing-and-usage and https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility
