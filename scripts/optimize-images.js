const sharp = require('sharp');
const glob = require('glob');
const fs = require('fs');
const path = require('path');

// --- 設定 ---
// 元画像が保存されているディレクトリ
const SOURCE_DIR = 'src/assets/images_original';
// 最適化後の画像を出力するディレクトリ
const OUTPUT_DIR = 'public/images';
// 生成する画像の幅のリスト（ピクセル単位）
const SIZES = [800, 1280];
// 生成する画像の品質設定
const WEBP_QUALITY = 80;
const JPEG_QUALITY = 80;
// ---

async function optimizeImages() {
    console.log('🖼️  Starting image optimization...');

    // 出力ディレクトリが存在しない場合は作成
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`✅ Created output directory: ${OUTPUT_DIR}`);
    }

    // SOURCE_DIRから画像ファイル（jpg, jpeg, png）を検索
    const files = glob.sync(`${SOURCE_DIR}/**/*.{jpg,jpeg,png}`);

    if (files.length === 0) {
        console.log('⚠️ No images found to optimize.');
        return;
    }

    console.log(`Found ${files.length} images to process.`);

    // 各ファイルに対して最適化処理を実行
    for (const file of files) {
        const basename = path.basename(file, path.extname(file));
        const extension = path.extname(file).toLowerCase();
        console.log(`\nProcessing: ${path.basename(file)}`);

        const image = sharp(file);

        for (const size of SIZES) {
            const resizedImage = image.resize({ width: size });

            // WebP版を保存
            const webpPath = path.join(OUTPUT_DIR, `${basename}-${size}w.webp`);
            await resizedImage.webp({ quality: WEBP_QUALITY }).toFile(webpPath);
            console.log(`  -> Created ${path.basename(webpPath)}`);

            // 元のフォーマット（JPEG/PNG）のリサイズ版を保存
            if (extension === '.png') {
                const pngPath = path.join(OUTPUT_DIR, `${basename}-${size}w.png`);
                await resizedImage.png().toFile(pngPath);
                console.log(`  -> Created ${path.basename(pngPath)}`);
            } else {
                const jpegPath = path.join(OUTPUT_DIR, `${basename}-${size}w.jpg`);
                await resizedImage.jpeg({ quality: JPEG_QUALITY }).toFile(jpegPath);
                console.log(`  -> Created ${path.basename(jpegPath)}`);
            }
        }
    }
    console.log('\n✨ Image optimization complete! ✨');
}

optimizeImages().catch(console.error);