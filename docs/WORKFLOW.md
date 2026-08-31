# Development Workflow

## 基本原則

- GitHub repositoryをOS間同期と共有履歴のSource of Truthとする。
- default branchは `main` とし、常に安全にclone・build・deployできる状態を保つ。
- 作業前にbranch、HEAD、upstream、working treeを確認する。
- taskに必要な最小差分を選び、unrelated changesを触らない。
- Agent実行では `mise exec -- <command>` を優先する。
- destructive Git操作とforce pushを避ける。
- commitとpushは明示的な依頼がある場合だけ行う。

## LIGHT

対象はtypo、局所的な文書修正、明白で低riskな設定修正など。

標準フロー：

`context確認 → 変更 → 関連validation → diff review → 完了報告`

- 通常はactive planや独立reviewを必須としない。
- 影響範囲に応じて作業branchを使用する。

## STANDARD

対象は通常の機能開発、非自明なbug修正、複数fileの変更、tooling追加など。

標準フロー：

`context確認 → 必要な調査 → active plan → feature branch → 実装 → validation → self-review → review指摘の再判定 → integration → smoke test → 完了報告`

- `main` からfeature branchを作成する。
- validationは可能な限りmise runtime上で実行する。

## STRICT

対象はsecurity、破壊的操作、migration、重要なarchitecture、認証、data integrity、cross-platform挙動など。

標準フロー：

`context確認 → 根拠調査 → active plan → feature branch → 実装 → lint/typecheck/test/build/audit → runtime smoke → self-review → 必要な独立review → review指摘の再判定 → platform validation → 安全なintegration → integration後smoke test → 完了報告`

- 不明点が結果を大きく変える場合は実装前に確認する。
- 影響するplatformでの検証が不足する場合は、その制約とriskを報告する。

## Branch naming

作業branchでは、目的に応じて次のprefixを推奨する。

- `feat/*`
- `fix/*`
- `chore/*`
- `docs/*`
- `refactor/*`
- `test/*`

merge方式は作業のrisk、履歴、repository運用に応じてintegration時に判断する。

## Validation

変更内容に応じて次を選択する。

- environment diagnosis: `mise exec -- python scripts/doctor.py`
- formatter: `mise exec -- npm run format:check`
- lint: `mise exec -- npm run lint`
- typecheck: `mise exec -- npm run typecheck`
- tests: `mise exec -- npm test`
- build: `mise exec -- npm run build`
- dependency audit: `mise exec -- npm audit --audit-level=high`
- runtimeまたはUI smoke test
- `git diff --check`
- `git status`

doctorはruntime environmentの診断に限定し、project validationは `npm run check` と個別commandで行う。

## Review

review指摘は自動的に採用せず、次の観点で再判定する。

- 再現できる問題か
- repositoryの要件に該当するか
- intentional behaviorではないか
- 修正がtask scopeとriskに見合うか

判定は `confirmed`、`valid but optional`、`intentional behavior`、`not applicable / false positive` などとして整理する。

## Integrationと完了

- integration前にworking treeと対象commitを確認する。
- integration後はdefault branch上で関連validationとsmoke testを再実行する。
- branch削除、remote変更、force pushなどは明示的な合意なしに行わない。
- 完了報告には変更、validation、review、Git状態、未解決riskを含める。
