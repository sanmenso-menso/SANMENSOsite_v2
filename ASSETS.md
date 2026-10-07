# 公開資産の取り扱い

`public/audio`、`public/images`その他の制作物は、サイト表示のために公開されています。公開されていること自体は、転載・再配布・二次利用・機械学習用収集・商用利用の許諾を意味しません。節度を持って閲覧・利用してください。

## 追加前チェック

- 自作物、または公開・配布の許諾を確認できる素材だけを追加する
- クレジット、ライセンス、許諾記録が必要なら同じ変更で記録する
- EXIF位置情報、撮影者名、端末情報、ID3の個人情報、埋込みサムネイルを確認する
- 制作途中データ、未公開音源、連絡先、秘密情報を含めない
- Web用途に必要な品質・サイズへ変換し、原版を不用意に公開しない
- ファイル名を変更する場合は、ソース内の全参照と大文字小文字を確認する

第三者の権利表示が個別ファイルや関連文書にある場合は、その条件が優先されます。不明な資産は公開せず、権利者へ確認してください。

## ポートフォリオのサムネイル・ポスター

ユーザーが指定した自身の参加案件について、動画は公開サムネイル、イベントはポスターを掲載する依頼に基づき追加しています。表示は参加実績の紹介用であり、画像の再利用許諾や三面相による画像制作を意味しません。担当内容はスプシの「役職」に従います。

`public/images/portfolio/` の画像は最大1280pxのWebPへ変換し、EXIFなどの元画像メタデータを除去しています。公式画像の対応・取得URLは `portfolio-media.json` に記録しています。

| 保存画像                     | 出典・クレジット                                                                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `osaka-in-da-party-2.webp`   | [おお阪 IN DA PARTY!2 告知](https://x.com/Quartz_Tea/status/2093315174803673227)。フライヤーイラスト: 苦味 (@kuwei_23333)。三面相の参加: DJ。 |
| `sister-other-paranoia.webp` | [妹、他者、パラノイア 公式Steamページ](https://store.steampowered.com/app/4240150/?l=japanese) の日本語カプセル画像。                         |
| `kamikaze-empire.webp`       | [神風帝国 公式Steamページ](https://store.steampowered.com/app/3031720/?l=japanese) のカプセル画像。                                           |
| `youtube-_19lBxlk-bs.webp`   | [サブリメる](https://youtu.be/_19lBxlk-bs) の公開サムネイル。                                                                                 |
| `youtube-H2VHHma9Z9c.webp`   | [Dream Jail set](https://youtu.be/H2VHHma9Z9c) の公開サムネイル。                                                                             |
| `youtube-UCd6Sw4P8Xk.webp`   | [CDs YouTubeMusicWeekend 2026](https://youtu.be/UCd6Sw4P8Xk) の公開サムネイル。                                                               |
| `youtube-sDP95docQeA.webp`   | [音楽と夢想](https://youtu.be/sDP95docQeA) の公開サムネイル。                                                                                 |
| `youtube-ssPrdDRpBZw.webp`   | [電脳 / 32 Observers Chorus cover](https://youtu.be/ssPrdDRpBZw) の公開サムネイル。                                                           |

今後のYouTube補完画像は、ファイル名 `youtube-{動画ID}.webp` とJSONの作品URLで出典を追跡できます。取得先は `https://i.ytimg.com/vi/{動画ID}/maxresdefault.jpg`、未提供時は `hqdefault.jpg` です。

## SoundCloud作品の公開画像（2026-10-07）

以下の作品ページの公開画像を、SoundCloudの公式oEmbed応答で確認し、`public/images/portfolio/soundcloud-{slug}.webp` に保存しました。取得元のURLは `portfolio-media.json` に記録し、画像ホストは `i1.sndcdn.com` のみに限定しています。既存の画像サイズ・データ量制限とメタデータ除去を適用します。

- [PouNtan tan](https://soundcloud.com/sanmenso/pountan-tan)
- [EPA EPA Txapeka](https://soundcloud.com/sanmenso/epaepa)
- [It started to Rein](https://soundcloud.com/sanmenso/it-started-to-rein)
- [お花畑にいこう！](https://soundcloud.com/sanmenso/ir1bnh0hlkct)

2026-10-08、[Soul Soul Floats](https://soundcloud.com/sanmenso/soul-soul-floats) の作品ページで現在表示されている画像を確認し、`soundcloud-soul-soul-floats.webp` として追加しました。oEmbed応答では共通のplaceholderが返されたため、作品ページ上の公開画像を採用しています。取得元は `portfolio-media.json` に記録しています。

## ポートフォリオのグラフィック・数字（2026-10-03）

ユーザーが制作・提供した `ポートフォリオアセット２.svg` を、ポートフォリオのページ内の区切りと数字表示として使用します。4種類のグラフィックと0〜9の手描き数字です。原版のコピーは `src/assets/images_original/portfolio-assets.svg` に保管し、元ファイルは変更していません。

`public/images/portfolio-graphics/` に個別のSVGとして切り出しました。パスとグラデーションを維持し、描画範囲に合わせたviewBoxへ変更しています。外部参照やスクリプトは含みません。原版そのものは公開しません。

再書き出し: `node scripts/extract-portfolio-assets.js src/assets/images_original/portfolio-assets.svg`。作品紹介のための表示であり、公開によって素材の二次利用を許諾するものではありません。

## 「面」の背景（2026-10-04）

ユーザー制作の `面.svg` の線側（青）と面側（緑）を重ね、上下の曲線を合わせて3つ縦に連結しています。原版のコピーは `src/assets/images_original/portfolio-men.svg`、公開用の背景は `public/images/portfolio-graphics/men-background.svg` です。元ファイルのパスは `E:/gazou/Illustlater/面.svg` で、元ファイルは変更していません。

再生成: `node scripts/extract-portfolio-background.js src/assets/images_original/portfolio-men.svg combined`。末尾は `surface`（面のみ）・`line`（線のみ）にも切り替えられます。ベクターのパスと元の色を維持し、外部参照や不要な制作メタデータを公開SVGに含めません。

同じ範囲の面側 `men-surface.svg`・線側 `men-line.svg` も同時に生成し、3D背景では色を別々に指定するためのアルファマスクとして使います。SVGの描画位置を揃えたまま3段に分け、CSSでつなぎ目を折ります。元のSVGと保管コピーの色・パスは変更しません。

## Aboutのタイポグラフィ（2026-10-04）

ユーザー制作の `E:/gazou/Illustlater/about タイポ.svg` の画像・文章・タイポグラフィの特徴を使用します。原版は `src/assets/images_original/portfolio-about-typography.svg` に保管し、元ファイルは変更していません。原版の埋め込みPNGは `public/images/portfolio-graphics/about-portrait.webp` に768pxで書き出しています。ページ上の配置と本文は `src/components/PortfolioAboutTypography.jsx` と `src/pages/PortfolioPage.css` で調整し、画面幅に合わせた読みやすいサイズで表示します。

画像の再取り込み: `node scripts/extract-portfolio-about.js src/assets/images_original/portfolio-about-typography.svg`。外部画像・スクリプト・不要な制作メタデータは取り込みません。この処理はプロフィール画像と原版を保存し、調整済みのページの文章・配置は上書きしません。文章を変更する場合はコンポーネントを編集します。

文字は提供SVGの指定書体 `A P-OTF Futo Go B101 Pr6N` を優先し、見つからない端末では游ゴシック等へ代替します。フォントファイルは埋め込まず、Webフォントとしての配布は行っていません。書体の完全な再現には、アウトライン化した素材への差し替えが必要です。
