# Product

## Purpose

SANMENSOsite_v2は、SANMENSOの作品、活動、関連content、連絡先を視覚的な演出とともに公開するportfolio siteである。

## Primary experiences

- HOMEでartist identity、背景演出、更新案内を伝える。
- WORKSで作品を一覧し、categoryでfilterできる。
- HOMEとWORKSの往復を連続したvisual transitionとして提供する。
- CONTENTS、LINKS、CONTACTから追加情報と外部導線を提供する。
- reduced motionを含む利用環境へ配慮する。

## Product boundaries

- 公開siteであり、秘密情報や個人情報を配布しない。
- `/secret` は入力演出で到達できる隠しpageだが、security上の秘密領域ではない。
- repository内の音源、画像、その他の公開資産は製品表現に必要な範囲で節度を持って扱う。
- 不要な制作metadataを公開物やGit履歴へ追加しない。

## Success criteria

- HOME、更新案内、WORKS、作品filter、主要navigationが意図どおり動作する。
- production buildが成功し、static hostingでdirect routeを処理できる。
- console errorや明らかなlayout崩れがない。
- Windows x64とmacOS arm64で同じproject runtimeを再現できる。
