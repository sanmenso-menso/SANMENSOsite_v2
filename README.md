# 三面相ウェブサイト

三面相の活動、作品、リンク、インタラクティブコンテンツを公開する静的SPAです。React、Vite、Tailwind CSSを使用します。

## 必要な環境

- Node.js `^20.19.0` または `>=22.12.0`（推奨: Node.js 24 LTS）
- npm 10以上

```powershell
npm ci
npm run dev
```

開発サーバーは安全のため `127.0.0.1` のみにbindします。LAN公開が必要な場合は、信頼できるネットワークであることを確認したうえで一時的にViteのhost設定を変更してください。

## コマンド

- `npm run dev`: 開発サーバー
- `npm run build`: 既存の`dist/`を安全に清掃してproduction buildを生成
- `npm run preview`: production buildのローカル確認
- `npm run lint`: JavaScript/JSXの静的検査
- `npm run typecheck`: `@ts-check`を付けた運用コードをTypeScriptで検査（画面コードは段階導入）
- `npm test`: 純粋関数の単体テスト
- `npm run format:check`: 設定・運用ファイルのformat確認
- `npm run check`: format、lint、型、テスト、buildを一括実行
- `npm run optimize`: `src/assets/images_original`の画像からresponsive画像を生成

既存の画面ソースは大規模な整形差分を避けるため、現時点ではPrettierの対象外です。変更した画面ファイルは段階的に整形対象へ移してください。

## 画像最適化

権利とメタデータを確認した原画像だけを `src/assets/images_original` に置いてください。標準では800px/1280pxのWebPと元形式を `public/images` に生成します。サブディレクトリは維持されるため、同名ファイル同士は上書きされません。

```powershell
npm run optimize
node scripts/optimize-images.js --source path/to/input --output path/to/output --sizes 640,1280 --dry-run
```

入力が必須の自動処理では `--require-input` を指定してください。変換失敗時は終了コード1になります。生成後は実際に参照する`src`/`srcset`を確認し、不要な派生ファイルを公開しないでください。

## 配布

`public/_headers` と `public/_redirects` はNetlify/Cloudflare Pages互換の設定です。別のホストでは、同等の設定をホスト側で行ってください。

- `/works`、`/links`、`/contact`、`/secret`、`/contents` と既知のコンテンツIDは `index.html` へrewriteする
- 未知の `/contents/*` を含む未定義URLは `404.html` をHTTP 404で返す
- それ以外は `404.html` をHTTP 404で返す
- `_headers`のCSP、HSTS、frame制限、MIME sniffing防止をレスポンスに適用する
- fingerprint付き `/assets/*` はimmutable cache、名前固定の画像・音声は短いcacheにする

### リリース手順

1. `npm ci`
2. `npm run check`
3. `npm audit --audit-level=high`
4. `dist/`を一意なcommit SHAと紐づけて保管・デプロイ
5. `/`、全主要直リンク、未知URLの404、音声再生、レスポンスヘッダーを確認

source mapは標準では生成しません。障害調査用の非公開buildに限り、PowerShellでは次のように生成できます。`.map`を公開サーバーへ配置せず、調査先へ安全に保管した後で削除してください。

```powershell
$env:GENERATE_SOURCEMAP = 'true'
npm run build
```

### ロールバック

破壊的なGit操作ではなく、直前に検証済みのcommit SHAから作成・保管したimmutable artifactを再デプロイします。DBやserver migrationはないため、静的artifactの切替だけで戻せます。ホスト固有のデプロイID、実行者、時刻、smoke test結果をrelease記録へ残してください。

## 障害調査

production buildでは`VITE_APP_RELEASE`にcommit SHAを設定してください。同一originに受信APIを用意した場合だけ、`VITE_ERROR_REPORTING_ENDPOINT`へ`/api/client-errors`のようなパスを設定します。未設定時は外部送信せず、CustomEventとconsoleへの記録だけを行います。

例外レポートへURL、入力内容、メールアドレスなどの個人情報を追加しないでください。クライアントconsoleだけを恒久的な監視手段にせず、Error Boundaryの発火数、音声読込失敗、主要画面の到達性を集計してください。

## 公開資産と利用条件

音源・画像の追加規則は [ASSETS.md](ASSETS.md)、リポジトリ全体の利用条件は [LICENSE.md](LICENSE.md) を確認してください。
