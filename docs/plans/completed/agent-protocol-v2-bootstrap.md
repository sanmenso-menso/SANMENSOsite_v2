# Agent Protocol v2 bootstrap

## Scope

SANMENSOsite_v2へAgent Protocol v2の基礎を導入する。

## Completed work

- Node 24.11.1 / Python 3.12.10のmise設定とcross-platform lockを追加
- environment diagnosis専用doctorとunit testsを追加
- LIGHT / STANDARD / STRICT workflowをproject向けに文書化
- 既存のSANMENSO固有規則を維持して `AGENTS.md` を統合
- architecture、product boundary、重要判断を文書化
- CIのNode versionをruntime設定へ揃え、doctor unit testsを追加

## Deferred work

次の項目は独立した工程として扱う。

- `.vs` の整理
- `.gitignore` と `.gitattributes` の変更
- CRLF正規化
- dependency更新
- formatter、lint、typecheckの対象または強度変更
- Windows / macOS CI matrix
- 旧branchの削除
