# Contactの送信設定

フォームと送信処理は実装済みです。受取先は `sanmensoworks@gmail.com`、返信先は入力されたメールアドレスです。必要な設定がない環境では、送信を準備中と表示してメール・Discordを案内します。

2026-10-05に、本番プロジェクト `sanmensosite-v2` へ以下の4設定を登録しました。送信元は `portfolio@mail.sanmenso.com`、Resendの送信ドメインは認証済みです。送信キーはそのドメインのSending accessに限定し、TurnstileはManagedモード・`sanmenso.com` に限定しています。Previewには本番キーを登録していません。本番反映後の実メール受信確認は、公開記録で別途確認してください。

ResendはFreeプランで、追加の従量課金は無効です。月3,000通・1日100通の上限に達した場合は送信できなくなります。上限時もフォームの失敗表示と連絡先案内を維持します。TurnstileもFreeプランです。料金や枠は各サービスの現行設定で確認してください。

## 1. 送信サービスを設定する

[Resend](https://resend.com/docs/dashboard/domains/introduction)で送信用ドメインを登録し、案内されるDNSレコードを設定して検証します。送信元は検証済みドメインのアドレスを使います。例えば `mail.sanmenso.com` を送信用に登録し、`portfolio@mail.sanmenso.com` を送信元にできます。受取先Gmailの設定は変更不要です。既存の受信用DNSを変更する必要があるかは、Resendが提示する送信用レコードと照合してください。

メール送信権限のAPIキーを作成します。キーはチャットへ貼らず、次の環境変数へ直接登録してください。

## 2. Turnstileを設定する

CloudflareのTurnstileでManagedウィジェットを作り、実際のホスト名 `sanmenso.com` を登録します。`www.sanmenso.com` も利用する場合は追加します。Preview環境で検証する場合は、使うPreviewホスト名も登録します。サイトキーとシークレットキーを控えます。

コードはブラウザでの確認に加え、サーバーでトークン・ホスト名・actionを検証します。[公式のサーバー側検証](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)に準拠しています。

## 3. Pagesに環境変数を登録する

Cloudflare Pagesの対象プロジェクトで、Production環境に次を設定します。Previewで使う場合はPreview環境にも設定してください。

| 名前                   | 設定内容                         | 扱い           |
| ---------------------- | -------------------------------- | -------------- |
| `RESEND_API_KEY`       | Resendのメール送信APIキー        | Secret         |
| `CONTACT_FROM`         | 検証済みドメインの送信元アドレス | 通常の環境変数 |
| `TURNSTILE_SITE_KEY`   | ウィジェットのサイトキー         | 通常の環境変数 |
| `TURNSTILE_SECRET_KEY` | ウィジェットのシークレットキー   | Secret         |

`VITE_` の接頭辞は付けません。秘密のキーを `public/`、JSON、Gitへ入れないでください。登録後に再デプロイします。[Pagesの環境変数・バインディング](https://developers.cloudflare.com/pages/functions/bindings/)を参照してください。

## 4. Functionsを含めて配布する

ビルドコマンドは `npm run build`、出力先は `dist`、プロジェクトルートはこの `SANMENSOsite_v2` です。Git連携のPagesデプロイでは、ルートの `functions/api/contact.js` とそこから読み込む `server/contact.js` を含めて配布します。

Direct Uploadの場合は、プロジェクトルートからWranglerでデプロイします。既存Pagesプロジェクトの名前と配布先ブランチを確認して指定してください。

```powershell
npm run check
npx wrangler pages deploy dist --project-name YOUR_EXISTING_PROJECT --branch YOUR_TARGET_BRANCH
```

このコマンドは公開操作です。新しいPagesプロジェクトを作る必要はありません。Git連携の場合、本番ブランチは `main` です。

Cloudflareダッシュボードのドラッグ＆ドロップは、この `functions/` フォルダーをコンパイルしません。今回の構成にはGit連携かWranglerが必要です。[Direct UploadのFunctions対応](https://developers.cloudflare.com/pages/get-started/direct-upload/#functions)を参照してください。

`public/_routes.json` はビルド時に `dist/_routes.json` へコピーされ、Functionsの対象を `/api/contact` に限定します。他のページは静的配信です。

## 5. 動作を確認する

1. `/api/contact` を開き、`available: true` とサイトキーが返ることを確認。シークレットは応答に含めません。
2. `/portfolio/contact` に6項目とTurnstileが表示され、確認完了後に送信ボタンが有効になることを確認。
3. 自分の連絡先で確認メールを1件送り、Gmailで本文6項目と返信先を確認。APIでの受付成功と実際の受信は別なので、両方確認します。
4. 失敗時は入力内容が保持され、成功時のみクリアされることを確認。

ローカルでは `.env.example` を参考に、Git管理対象外の `.env.local` に設定し、`npm run dev` を再起動します。Turnstileのローカル用キー・ホスト名も合わせて設定してください。開発サーバーは本番と同じ送信処理を使うため、実キーを設定して送信すると実メールが送られます。

`npm run preview` は静的ビルドの確認用で、送信処理は動かしません。本番Functionsの接続確認にはPagesのPreviewデプロイを使ってください。

入力内容やAPIキーをconsoleへ記録する処理はありません。送信失敗時の詳細は閲覧者へ公開せず、メール・Discordの連絡先を案内します。
