export const THEME = {
    bgBase: '#f2f5f3',
    brandGreen: '#2E8B57',
    accentGold: '#FFD700',
    text: '#1a1a1a',
    black: '#121212',
    white: '#ffffff',
};

export const FONTS = {
    sans: '"Zen Kaku Gothic New", sans-serif',
    serif: '"Shippori Mincho", serif',
    mono: '"Courier New", Courier, monospace',
};

export const WORKS_DATA = [
    { 
        id: 1, 
        title: "ButterflyEffectCity/可不", 
        type: "music", 
        year: "2022", 
        role: "Composition", 
        desc: "活動者としての一歩目となる楽曲", 
        detailText: "ボカロPとしての一作目となる楽曲です。バタフライエフェクトというワードから連想し、一曲を仕上げました。",
        credits: ["Composition:三面相", "illustration:らふぁえるsk"],
        color: "#FFD700" ,
        url: "https://youtu.be/TYKBm1GsSmA",
        image: "/images/butteerflyeffectCity.jpg",
    },
    { 
        id: 2, 
        title: "ナイト・アモーレ/星界", 
        type: "music", 
        year: "2022", 
        role: "Composition", 
        desc: "失恋した男に惚れている女性をテーマにした楽曲。", 
        detailText: "星界楽曲コンテストへの参加曲として制作しました。昭和歌謡の雰囲気をゴリゴリに醸し出すという方向性で制作を進めました。",
        credits: ["Composition:三面相", "illustration:櫛米"],
        color: "#FF6B6B" ,
        url: "https://youtu.be/yupa62YiQFg",
        image: "/images/nightamore.jpg",
    },
    { 
        id: 3, 
        title: "産声/可不・星界", 
        type: "music", 
        year: "2022", 
        role: "Composition", 
        desc: "民族的な要素を意識したデュエット曲", 
        detailText: "星界楽曲コンテストへの参加曲として制作しました。デュエットソングに挑戦してみようと思い、今までよりアコースティックな仕上がりを意識しました。",
        credits: ["Composition:三面相"],
        color: "#4ECDC4" ,
        url: "https://youtu.be/UOYN5jK454U",
        image: "/images/ubugoe.jpg",
    },
    { 
        id: 4, 
        title: "Noise_Garden", 
        type: "music", 
        year: "2023", 
        role: "Sound Design", 
        desc: "植物の生体電位をMIDIに変換して生成されたアンビエント。", 
        detailText: "植物の葉に取り付けた電極から微弱な生体電位を取得し、それをMIDI信号に変換してシンセサイザーを鳴らすインスタレーション作品です。植物の種類や周囲の環境（光、湿度、人の接近）によって音色が変化します。\n\nこの作品は「自然との対話」をデジタル技術を通じて再構築する試みであり、展示会場では来場者が植物に触れることで音が激変する様子を楽しめました。",
        credits: ["Sound: Sanmenso", "Tech Support: Lab X"],
        color: "#FFD700",
        image: "/images/noise_garden.jpg",
    },
    { 
        id: 5, 
        title: "Brutalist_Corp", 
        type: "entame", 
        year: "2023", 
        role: "Web Design", 
        desc: "架空の企業のコーポレートサイト。極太の境界線と原色を使用。", 
        detailText: "実在しない架空の企業「Brutalist Corp」のためのコーポレートサイトデザイン。近年のWebデザインのトレンドである「クリーンでミニマル」な方向性へのアンチテーゼとして、原色、極太の境界線、システムフォントを多用したブルータリズムスタイルを採用しました。\n\nユーザビリティをギリギリまで削ぎ落としつつ、それでもサイトとして機能する境界線を探る実験的なプロジェクトです。",
        credits: ["Design: Sanmenso"],
        color: "#FF6B6B",
        image: "/images/brutalist_corp.jpg",
    },
    { 
        id: 6, 
        title: "Glitch_Text", 
        type: "fun", 
        year: "2022", 
        role: "Art Direction", 
        desc: "文字化けを美学として捉え直すタイポグラフィ実験。", 
        detailText: "本来はエラーである「文字化け」を、意図的なグラフィック要素として扱うタイポグラフィの実験シリーズ。UTF-8とShift_JISの変換ミスによって生じる独特の記号の羅列をパターン化し、ポスターやTシャツのデザインに展開しました。",
        credits: ["AD: Sanmenso", "Photo: Studio Y"],
        color: "#4ECDC4",
        image: "/images/glitch_text.jpg",
    },
];

export const EXCAVATION_LINKS = [
    { 
        type: 'banner',
        url: "https://hozumi.site/",
        image: "https://hozumi.site/cdn/shop/t/6/assets/S__74637854.jpg?v=97761660025223919291763945063",
        alt: "あなたは青い部屋が好きですか？",
    },
    { 
        type: 'banner',
        url: "https://ideoaves.github.io",
        image:"https://ideoaves.github.io/banner.png",
        alt: "ideoavesのホームページ",
    },
        { 
        type: 'banner',
        url: "https://www.namigroove.com",
        image:"https://www.namigroove.com/wp-content/uploads/2023/12/namigroove_banner01.png",
        alt: "なみぐるオフィシャルWEB バナー",
    },
  { 
        type: 'banner',
        url: "http://tmpra.jp",
        image:"http://tmpra.jp/Banner.png",
        alt: "TMPらのホームページ",
    },
    
];

export const SONGS = [
  {
    id: 1,
    title: "EPA EPA Txapeka",
    genre: "未来的Conplextro",
    duration: 180, 
    color: "#00FFDD", 
    bgAccent: "bg-[#00FFDD]",
    flavor: "NEON GLITCH POP",
    bpm: 128,
    src: "/audio/EPA EPA Txapeka.wav" 
  },
  {
    id: 2,
    title: "Early Afternoon",
    genre: "冷凍Click House",
    duration: 210, 
    color: "#D8E2E5", 
    bgAccent: "bg-[#D8E2E5]",
    flavor: "CRYSTAL CUBE SODA",
    bpm: 110,
    src: "/audio/Early afternoon.mp3"
  },
   {
    id: 3,
    title: "Cut,solid,solar panel",
    genre: "CSS Core",
    duration: 195, 
    color: "#FF4500", 
    bgAccent: "bg-[#FF4500]",
    flavor: "CHAOS TROPICAL",
    bpm: 140,
    src: "/audio/Cut-solid-solar panel.wav" 
  },
  {
    id: 4,
    title: "Im busy But Lonely",
    genre: "淡いelectro pop",
    duration: 195, 
    color: "#F48FB1", 
    bgAccent: "bg-[#F48FB1]",
    flavor: "LONELY PEACH PULP",
    bpm: 140,
    src: "/audio/Im busy But Lonely.wav" 
  },
  {
    id: 5,
    title: "It started to Rein",
    genre: "不思議なアンビエントBGM",
    duration: 195, 
    color: "#076D6D", 
    bgAccent: "bg-[#076D6D]",
    flavor: "MYSTIC FOREST SAP",
    bpm: 140,
    src: "/audio/It started to Rein.mp3" 
  },
  {
    id: 6,
    title: "PouNtan tan",
    genre: "ハイテンションTech Core",
    duration: 195, 
    color: "#F3BB7A", 
    bgAccent: "bg-[#F3BB7A]",
    flavor: "HEAVY BLACK COLE",
    bpm: 140,
    src: "/audio/PouNtan tan.mp3" 
  },
  {
    id: 7,
    title: "splash rush",
    genre: "カットアップモリモリPop",
    duration: 195, 
    color: "#A4D65E", 
    bgAccent: "bg-[#A4D65E]",
    flavor: "FRESH SPLASH APPLE",
    bpm: 140,
    src: "/audio/splash rush.wav" 
  }
]

export const SOCIAL_LINKS = [
    { name: 'X (Twitter)', url: 'https://x.com/SANMENSOUdrop' },
    { name: 'YouTube', url: 'https://www.youtube.com/@SANMENSOUdrop' },
    { name: 'niconico', url: 'https://www.nicovideo.jp/user/124526551' },
    { name: 'note', url: 'https://note.com/sanmen' },
    { name: 'booth', url: 'https://sanmen.booth.pm/' },
];