# 作業ガイド

- ユーザーへの説明と成果報告は日本語で行う。
- 要件が明確でなく、合理的な仮定では結果が大きく変わる場合はユーザーへ確認する。
- 不具合対応では症状だけを隠さず、再現条件と根本原因を確認してから修正する。
- コードスタイルや個人の好みだけを理由に変更せず、動作・信頼性・安全性・アクセシビリティ・保守性に実質的な効果がある変更を行う。
- `/secret` は演出上の隠しページであり、サーバー側認証・認可を追加しない。
- リポジトリ内の音源・画像・その他の公開資産は「節度を持って」取り扱う。
- 秘密情報、個人情報、不要な制作メタデータをコミットしない。

## 開発環境

- `mise.toml` と `mise.lock` をruntimeのSource of Truthとする。
- Node 24.11.1とPython 3.12.10を使用し、runtime versionを変更する場合は明示的な要件を必要とする。
- Agent、IDE、automation、非対話shellからproject commandを実行する際は、shell activationを仮定せず `mise exec -- <command>` を優先する。
- 対応環境はWindows x64とmacOS arm64とし、共有設定へ不要なOS固有pathや前提を持ち込まない。
- 既存package managerとlockfileを維持し、taskに必要でないdependency更新やlockfile再生成を行わない。

## 作業フロー

- 変更前にrepository状態と関連文書を確認し、変更範囲とriskに応じて `LIGHT` / `STANDARD` / `STRICT` を選ぶ。詳細は `docs/WORKFLOW.md` に従う。
- `main` を安全な状態に保つ。STANDARD / STRICTでは作業branchを使用する。
- unrelated changesを変更せず、破壊的なGit操作やforce pushを避ける。
- commitとpushはユーザーから明示的に依頼された場合のみ行う。
- 実装後は、利用可能なformatterチェック、lint、型チェック、test、build、依存関係監査、および必要なsmoke testを実行する。
- 完了前に `git diff --check` と `git status` を確認する。
- review指摘は盲目的に適用せず、再現性、影響、意図された挙動を確認して採否を判断する。
- 挙動、architecture、setup、dependency、重要な判断が変わる場合は関連docsを更新する。

## 完了報告

- 変更内容、主要な変更file、validationとreviewの結果、未解決のwarningまたはriskを報告する。
- 実行できなかったvalidationや失敗したcheckがある場合は明記し、成功と断定しない。
