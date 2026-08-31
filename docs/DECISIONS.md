# Decisions

## 2026-08-31 — GitHub and main as Source of Truth

### Decision

GitHub repositoryを共有履歴のSource of Truthとし、default branchを `main` とする。

### Why

OS間の作業をGit履歴で同期し、変更、review、rollbackの追跡可能性を保つため。

---

## 2026-08-31 — mise for runtime management

### Decision

Node 24.11.1とPython 3.12.10を `mise.toml` / `mise.lock` で固定し、Windows x64とmacOS arm64のmetadataを保持する。

### Why

両platformでproject単位の再現可能なruntimeを使用するため。

### Consequences

Agent、IDE、automation、非対話shellでは `mise exec -- <command>` を優先する。npmはNode同梱版を使用し、独立した厳密version固定は行わない。

---

## 2026-08-31 — Environment doctor remains diagnostic

### Decision

doctorはGit work tree、Git branch状態、mise、Node、npm、Python、対応OS / architecture、runtime versionの診断に限定する。

### Why

environment failureとapplication validation failureを分離し、原因を判別しやすくするため。

### Consequences

formatter、lint、typecheck、test、build、auditは既存のnpm scriptsとCIで別に実行する。GitHub Actionsのdetached HEADは正常なGit状態として扱う。

---

## 2026-08-31 — Tiered Agent workflow

### Decision

変更のscopeとriskに応じて `LIGHT` / `STANDARD` / `STRICT` を選ぶ。

### Why

小さな変更への過剰なprocessを避けながら、高risk変更に必要な調査、review、validationを確保するため。
