# Portfolio production release

2026-10-05 / STRICT / branch: `codex/portfolio-release`

## 目的と境界

独立ポートフォリオ、Gmail宛の問い合わせ送信、従来の404演出を既存のCloudflare Pagesへ公開する。公開中の `main` (`d440d62`) を基点に、従来のCube、FLOW、射的、既存の作品データを維持する。元の `master` checkoutと制作素材を保存し、force pushはしない。鍵は本番のSecretだけに保存する。

## 完了した検証と修正

- 最新の公開branchへポートフォリオ差分を統合し、7ファイルの競合を双方の意図に合わせて解消。
- 画像最適化後のファイル名へ、公開JSONの34画像参照を修正。44 Works / 75 Activities。
- 404はpostbuildでコンパイル済みReact entryから生成し、HTTP 404と以前の演出を両立。404のnoindexと帰還後のindex/canonicalも確認。
- 依存監査: 初期17件から0件。互換patch更新に加え、脆弱なbuild依存を解消するTailwind 4/PostCSS、sharp更新を実施。旧palette/base挙動をcompat CSSで維持。
- formatter、lint、型、Vitest 20ファイル/140 tests、production buildがPASS。doctorのPython unit tests 12件PASS。
- WranglerでFunctionsのcompile、22 redirects / 7 headersのparseが成功。通常ページ200、未知path404、未設定APIの正しい準備中応答を確認。
- Chromeで元のCube、既存Works、ポートフォリオWorks/About/404を確認。画像の読み込み失敗なし。Aboutの5分野表示、閉じる操作、ポップへ戻す操作を確認。
- Resend Free、従量課金無効を管理画面で確認。認証済み `mail.sanmenso.com` 専用Sending access。Turnstile Managed / `sanmenso.com`。本番4設定を登録。秘密キーをGit・公開ファイル・ログに残さず、コピー時のクリップボードも消去。
- PR #6の初回GitHub CIは成功したが、Pages previewのnpm 10.9.2はlockfileのWASM optional依存欠落で失敗。本番は未変更。同じnpmによる再現後、空の検証ディレクトリでlockfileを修復し、既存package versionの変更なしを確認。npm 10.9.2/Linux x64のclean-install dry runと再度の140 tests/buildがPASS。
- Pages用 `.node-version` を既存の `mise.toml` と同じ24.11.1に固定し、CI・local・公開buildのruntimeを揃える。

## セキュリティ確認

- 入力は6項目のtype/必須/長さ/制御文字を検証。本文受信は宣言長によらず24KBで制限。
- 同一origin、JSON形式、honeypot、Turnstileのサーバー検証・hostname・actionを確認してから送信。
- 宛先はサーバー内でGmailに固定。本文はplain text、返信先のみ検証済み入力を使用。submission IDの冪等キーで重複送信を抑制。
- エラー時は入力保持、providerの秘密情報を返さず、受付失敗を成功扱いしない。未設定時はフォーム無効でメール/Discordを案内。
- 公開JSONは許可した公開列のみ。管理メモや非公開行を排除し、リンク・ローカル画像pathの検証を実施。
- CSP、frame制限、nosniff、Permissions-Policy、HSTSを維持。Turnstileの必要なhostだけ追加。静的ファイルには秘密キーを含めない。

## 本番公開と確認結果

- ユーザーの明示承認に基づきcommit/push。PR [#6](https://github.com/sanmenso-menso/SANMENSOsite_v2/pull/6)をmainへ統合。公開commit: `2fddba0268dc1b2843298fa9c31138f93a68ab30`。
- 修復後のGitHub CIとPages previewはいずれも成功。本番main CI [37228544268](https://github.com/sanmenso-menso/SANMENSOsite_v2/actions/runs/37228544268)とPages production deployment `c1e8e62c-6e76-4a77-980f-601c6875caa2`も成功。
- [本番ポートフォリオ](https://sanmenso.com/portfolio)とWorks/Contact、従来のトップ/WorksはHTTP 200。未知pathはHTTP 404、従来のアニメーションが描画され、noindex/canonicalなし。静的ページのCSPを確認。
- 本番 `/api/contact` は `available: true`。Managed Turnstileの確認後、実フォームから公開確認用のメールを1件送信。成功表示と入力クリアを確認。
- Resendで送信元、固定宛先、返信先、本文6項目とDeliveredを確認。ユーザーがGmailで「届いている」と確認したため、入力から受信まで検証完了。確認メールID: `01a10867-4702-763c-9b53-e27f57a9ab90`。秘密キーは記録しない。
- Resend/Turnstileは無料設定を維持し、従量課金を有効にしていない。

## 制約とロールバック

既知の依存監査0件は脆弱性が存在しない保証ではない。macOS実機とmobileの実機検証は今回実施していない。Chromeのviewport変更は実寸へ反映されず、390pxの実表示は未確認。追加のIP別rate limitは未設定で、Turnstile・入力制限・無料送信上限が現在の防御。無料枠を超えると送信不可となるのでメール/Discord導線を維持する。

公開前のPages deploymentは `a6c2319d-d307-42e7-9bf5-50046fa0b7c2`。異常時はPagesのrollbackでこのdeploymentへ戻す。Git履歴を巻き戻すforce pushは使用しない。元のcheckoutは未変更分を保持し、完成版はこのrelease checkoutにある。
