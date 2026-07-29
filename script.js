function normalizeBackgroundQuest(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    progress: Math.max(0, Math.min(49, Number(source.progress || 0))),
    unlockedStage: Math.max(1, Math.min(90, Number(source.unlockedStage || 1))),
    selected: Math.max(1, Math.min(30, Number(source.selected || 1))),
  };
}

const state = {
  mode: "auto",
  level: 1,
  course: "autoAdventure",
  problem: null,
  steps: [],
  stepIndex: 0,
  customProblem: null,
  reviewMode: false,
  hintLevel: 0,
  problemMistakes: 0,
  answerShown: false,
  streak: Number(localStorage.getItem("hp_streak") || 0),
  stars: Number(localStorage.getItem("hp_stars") || 0),
  coins: Number(localStorage.getItem("hp_coins") || 0),
  solvedToday: Number(localStorage.getItem(todayKey()) || 0),
  settings: loadJson("hp_settings", { dailyGoal: 3, focus: "all", sound: false }),
  history: loadJson("hp_history", []),
  weak: loadJson("hp_weak", {}),
  rewards: loadJson("hp_rewards", []),
  stickers: loadJson("hp_stickers", {}),
  gachaCollection: loadJson("hp_gacha_collection", {}),
  gachaFragments: Number(localStorage.getItem("hp_gacha_fragments") || 0),
  selectedCompanion: localStorage.getItem("hp_selected_companion") || "main",
  rewardFilter: localStorage.getItem("hp_reward_filter") || "all",
  rewardTab: localStorage.getItem("hp_reward_tab") || "characters",
  treasureProgress: Number(localStorage.getItem("hp_treasure_progress") || 0),
  autoProgress: loadJson("hp_auto_progress", { stage: 0, clears: 0, noMiss: 0, misses: 0 }),
  backgroundQuest: normalizeBackgroundQuest(loadJson("hp_background_quest", null)),
  lastGachaPrize: null,
  gachaRolling: false,
  lastPraise: "",
};

const viewHistory = [];

function setText(selector, text) {
  const element = document.querySelector(selector);
  if (element) element.textContent = text;
}

function setAllText(selector, text) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = text;
  });
}

function applyJapaneseLabels() {
  document.title = "ひっさんパズル | 小学生向けの掛け算・割り算の筆算練習アプリ";
  document.querySelector('meta[name="description"]')?.setAttribute(
    "content",
    "小学生が掛け算と割り算の筆算を1マスずつ穴埋めで練習できる無料の学習ゲーム。九九穴埋め、繰り上がり、割り算の手順も楽しく学べます。",
  );

  setText(".app-home .hero-copy .eyebrow", "ひっさんパズル");
  const homeTitle = document.querySelector(".app-home h1");
  if (homeTitle) homeTitle.innerHTML = "問題をといて、<span>コインをためよう</span>";
  setText(".app-home .hero-copy > p:not(.eyebrow)", "3問で宝箱、100コインでガチャ。解くたびにごほうびへ近づくよ。");
  setText(".app-home [data-nav='gacha']", "ガチャをまわす");
  setText(".app-home [data-tutorial-open]", "あそび方");
  setText(".daily-card.soft .eyebrow", "いまのコイン");
  setText(".daily-card.reward-preview .eyebrow", "コレクション");
  setText(".daily-card.reward-preview h2", "キャラを集めよう");
  setText(".daily-card.reward-preview p:not(.eyebrow)", "ガチャで新しい仲間に出会えます。");
  setText(".daily-card.reward-preview button", "ごほうびを見る");
  setText(".journey-card .eyebrow", "背景チャレンジ");
  setText(".journey-card button", "九九あなうめへ");
  setText(".home-secondary-actions [data-nav='review']", "ふくしゅう");
  setText(".home-secondary-actions [data-nav='parent']", "親モード");

  setAllText("[data-nav='home']", "ホームにもどる");
  setAllText("[data-nav='challenge']", "問題を解く");
  setAllText("[data-nav='rewards']", "コレクションを見る");
  setText(".app-home [data-nav='challenge']", "まずはここから");
  setText(".gacha-copy .eyebrow", "コインガチャ");
  setText(".gacha-copy h2", "コインをためて、キャラと出会おう");
  setText(".gacha-copy .large-copy", "100コインで1回まわせます。レアな仲間が出たら、今日は大当たり。");
  setText("#gachaButton", "ガチャをまわす");

  setText(".course-select-hero .eyebrow", "コース選択");
  setText(".course-select-hero h1", "今日はどこから進む？");
  setText(".course-select-hero p:not(.eyebrow)", "迷ったら、いちばん上のおすすめ。苦手がある時だけ、かけ算・わり算・九九あなうめを選びます。");
  const courseHeads = document.querySelectorAll(".course-category-head");
  const courseHeadLabels = [
    ["おすすめ", "レベルアップチャレンジ", "できる問題から始めて、少しずつレベルアップします。"],
    ["かけ算", "かけ算マスター", "筆算の順番、くり上がり、大きいかけ算を練習します。"],
    ["わり算", "わり算マスター", "たてる・かける・ひく・おろすを順番に練習します。"],
    ["九九", "九九あなうめ", "短い問題で、かくれた数をテンポよく見つけます。"],
  ];
  courseHeadLabels.forEach(([eyebrow, title, text], index) => {
    const head = courseHeads[index];
    if (!head) return;
    const eyebrowEl = head.querySelector(".eyebrow");
    const titleEl = head.querySelector("h2");
    const textEl = head.querySelector("p:last-child:not(.eyebrow)");
    if (eyebrowEl) eyebrowEl.textContent = eyebrow;
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
  });
  setText("#autoCourseNote strong", "迷ったらここ");
  setText("#autoCourseNote span", "クリアするほど、かけ算・わり算が少しずつむずかしくなります。");
  const routeBadges = document.querySelectorAll(".course-route-badges span");
  ["おすすめで進む", "苦手だけ練習", "九九でテンポよく"].forEach((text, index) => {
    if (routeBadges[index]) routeBadges[index].textContent = text;
  });
  const courseLabels = {
    autoAdventure: ["レベルアップチャレンジ", "おすすめ。できる問題から少しずつ難しくなる"],
    starter: ["かけ算ならし", "Lv.1  1けた×1けたで筆算の順番に慣れる"],
    multiplyFill: ["九九あなうめ", "テンポ練習。かくれた数を見つける"],
    multiplyForest: ["かけ算マスター 1", "Lv.2  2けた×1けた、くり上がり"],
    multiplyMountain: ["かけ算マスター 2", "Lv.3  2けた×2けたに挑戦"],
    multiplyCastle: ["かけ算マスター 3", "Lv.4  3けた×3けたに挑戦"],
    divideRiver: ["わり算マスター 1", "Lv.1  あまりなしの基本"],
    divideCave: ["わり算マスター 2", "Lv.2  あまりまで考える"],
    divideSky: ["わり算マスター 3", "Lv.3  大きい数のわり算に挑戦"],
    mixAdventure: ["ミックス練習", "仕上げ。かけ算とわり算がいろいろ出る"],
  };
  Object.entries(courseLabels).forEach(([key, [title, text]]) => {
    setText(`.course-card[data-course="${key}"] strong`, title);
    setText(`.course-card[data-course="${key}"] span`, text);
  });

  setText(".challenge-view .page-nav [data-nav='home']", "ホームにもどる");
  setText(".challenge-view .top-bar .eyebrow", "計算チャレンジ");
  setText(".challenge-view .top-bar h1", "オレンジのマスだけ、順番にうめよう");
  setText(".score-board div:nth-child(1) .score-label", "ノーミス");
  setText(".score-board div:nth-child(2) .score-label", "コイン");
  setText(".score-board div:nth-child(3) .score-label", "ランク");
  setText("#rankTitle", "見習い");
  setText(".course-head .eyebrow", "いまのコース");
  setText("#activeCourseTitle", "レベルアップチャレンジ");
  setText("#toggleCourses", "コース変更");
  setText(".mission-panel h2", "コイン");
  setText(".combo-panel .eyebrow", "ノーミスボーナス");
  setText("#coachMessage", "オレンジのマスだけ見れば大丈夫。ゆっくり進もう。");
  setText("#problemType", "かけ算");
  setText("#problemTitle", "問題を作っています");
  setText("#hintButton", "ヒント");
  setText(".stage-status-main span", "いま");
  setText(".stage-status-item:nth-child(2) span", "宝箱まで");
  setText(".stage-status-item:nth-child(3) span", "ガチャまで");
  setText(".play-reward-panel .eyebrow", "つぎのごほうび");
  setText("#checkButton", "このマスを確認");
  setText("#showAnswerButton", "答えを見る");
  setText("[data-action='back']", "消す");
  setText("[data-action='hint']", "ヒント");

  setText(".rewards-view .section-head .eyebrow", "コレクション");
  setText(".rewards-view .section-head h2", "キャラコレクションと練習シール");
  setText("#nextRewardText", "問題を解くほど、キャラ・背景・シールが少しずつ増えていきます。");
  setText(".review-view .section-head .eyebrow", "ふくしゅう部屋");
  setText(".review-view .section-head h2", "苦手ステージに挑戦");
  setText("#weakPointText", "まだ苦手記録はありません。");
  setText("#reviewButton", "復習をはじめる");
  setText(".parent-view .section-head .eyebrow", "親モード");
  setText(".parent-view .section-head h2", "今日の学習レポート");
  setText("#parentReviewButton", "復習へ");
  setText(".parent-guide-panel .eyebrow", "保護者の方へ");

  setText("#stageUpOverlay .eyebrow", "ステージアップ");
  setText("#stageUpTitle", "新しいステージへ！");
  setText("#stageUpText", "ここから少しだけレベルアップします。");
  setText("#stageUpBonus", "+50コイン");
  setText("#rewardToast .eyebrow", "コインをゲット");
  setText("#rewardToastTitle", "コインをもらえたよ");
  setText("#rewardToastText", "ガチャまで近づきました。");
  setText("#tutorialOverlay .eyebrow", "はじめての人へ");
  setText("#tutorialTitle", "オレンジのマスだけ入れよう");
  setText("#tutorialStartButton", "はじめる");
  setText("#tutorialSkipButton", "あとで見る");
  setText("#showTutorialButton", "はじめの案内をもう一度見る");
}

const CHARACTER_IMAGES = {
  main: "assets/characters/character-main.png",
  happy: "assets/characters/character-happy.png",
  thinking: "assets/characters/character-thinking.png",
  cheer: "assets/characters/character-cheer.png",
};

const GACHA_COST = 100;
const RARITY_ORDER = ["N", "R", "SR", "UR"];
const RARITY_CONFIG = {
  N: { label: "ノーマル", rate: 55, duplicateFragments: 1, exchangeCost: 3 },
  R: { label: "レア", rate: 30, duplicateFragments: 2, exchangeCost: 8 },
  SR: { label: "スーパーレア", rate: 12, duplicateFragments: 5, exchangeCost: 18 },
  UR: { label: "ウルトラレア", rate: 3, duplicateFragments: 10, exchangeCost: 40 },
};
const TREASURE_INTERVAL = 3;
const BACKGROUND_QUEST_STEP = 50;
const STAGE_UP_BONUS = 50;
const NEXT_PROBLEM_DELAY = 900;
const REWARD_PROBLEM_DELAY = 2400;
const BACKGROUND_REWARD_DELAY = 3600;
const STAGE_UP_PROBLEM_DELAY = 2700;

const BACKGROUND_NAMES = [
  "ひみつの森",
  "すうじの川",
  "くり上がり山",
  "クリスタルどうくつ",
  "ほしぞらキャンプ",
  "おかしの町",
  "まほう図書館",
  "うみべの学校",
  "にじの空島",
  "スターライトロード",
  "にじの花畑",
  "こおりのお城",
  "ふんすい広場",
  "時計塔の町",
  "気球の丘",
  "宝さがしビーチ",
  "花火の夜空",
  "ゆめの駅",
  "ほたるの湖",
  "のうじょうの道",
  "月夜の庭園",
  "夕やけオアシス",
  "宝石の橋",
  "さくら並木",
  "ひまわり畑",
  "オーロラ雪原",
  "まほうの研究室",
  "銀河の花道",
  "にじのゲート",
  "お祝いキャッスル",
];

const BACKGROUND_FRAMES = [
  { level: 1, name: "ノーマル", className: "frame-normal" },
  { level: 2, name: "キラキラ", className: "frame-sparkle" },
  { level: 3, name: "ゴールド", className: "frame-gold" },
];

const BACKGROUND_REWARDS = BACKGROUND_NAMES.map((name, index) => ({
  id: index + 1,
  name,
  image: `assets/backgrounds/quest-v1-16x9/background${String(index + 1).padStart(3, "0")}.png`,
}));

const els = {
  heroPanel: document.querySelector(".hero-panel"),
  modeButtons: document.querySelectorAll(".mode-button"),
  courseButtons: document.querySelectorAll(".course-card"),
  courseControls: document.querySelector(".course-controls"),
  toggleCourses: document.querySelector("#toggleCourses"),
  level: document.querySelector("#level"),
  hintButton: document.querySelector("#hintButton"),
  checkButton: document.querySelector("#checkButton"),
  showAnswerButton: document.querySelector("#showAnswerButton"),
  problemArea: document.querySelector("#problemArea"),
  problemType: document.querySelector("#problemType"),
  problemTitle: document.querySelector("#problemTitle"),
  feedback: document.querySelector("#feedback"),
  mapView: document.querySelector(".map-view"),
  streak: document.querySelector("#streak"),
  stars: document.querySelector("#stars"),
  rankTitle: document.querySelector("#rankTitle"),
  missionProgress: document.querySelector("#missionProgress"),
  badgeList: document.querySelector("#badgeList"),
  comboText: document.querySelector("#comboText"),
  comboProgress: document.querySelector("#comboProgress"),
  comboPanel: document.querySelector(".combo-panel"),
  homeCoinText: document.querySelector("#homeCoinText"),
  homeGachaText: document.querySelector("#homeGachaText"),
  homeStageName: document.querySelector("#homeStageName"),
  homeStageText: document.querySelector("#homeStageText"),
  homeNextReward: document.querySelector("#homeNextReward"),
  homeRewardText: document.querySelector("#homeRewardText"),
  homeJourneyTitle: document.querySelector("#homeJourneyTitle"),
  homeJourneyText: document.querySelector("#homeJourneyText"),
  homeJourneyProgress: document.querySelector("#homeJourneyProgress"),
  celebration: document.querySelector("#celebration"),
  stageUpOverlay: document.querySelector("#stageUpOverlay"),
  stageUpTitle: document.querySelector("#stageUpTitle"),
  stageUpText: document.querySelector("#stageUpText"),
  stageUpBonus: document.querySelector("#stageUpBonus"),
  rewardToast: document.querySelector("#rewardToast"),
  rewardToastTitle: document.querySelector("#rewardToastTitle"),
  rewardToastText: document.querySelector("#rewardToastText"),
  rewardToastPrize: document.querySelector("#rewardToastPrize"),
  rewardToastRoad: document.querySelector("#rewardToastRoad"),
  rewardSpotlight: document.querySelector("#rewardSpotlight"),
  rewardSpotlightVisual: document.querySelector("#rewardSpotlightVisual"),
  rewardSpotlightLabel: document.querySelector("#rewardSpotlightLabel"),
  rewardSpotlightTitle: document.querySelector("#rewardSpotlightTitle"),
  rewardSpotlightText: document.querySelector("#rewardSpotlightText"),
  playRewardTitle: document.querySelector("#playRewardTitle"),
  playRewardText: document.querySelector("#playRewardText"),
  playRewardProgress: document.querySelector("#playRewardProgress"),
  activeCourseTitle: document.querySelector("#activeCourseTitle"),
  currentStageName: document.querySelector("#currentStageName"),
  treasureGoalText: document.querySelector("#treasureGoalText"),
  stageCoinGoalText: document.querySelector("#stageCoinGoalText"),
  gachaCoinText: document.querySelector("#gachaCoinText"),
  gachaTicketText: document.querySelector("#gachaTicketText"),
  gachaNeedText: document.querySelector("#gachaNeedText"),
  gachaProgressText: document.querySelector("#gachaProgressText"),
  gachaProgress: document.querySelector("#gachaProgress"),
  gachaButton: document.querySelector("#gachaButton"),
  gachaResultIcon: document.querySelector("#gachaResultIcon"),
  gachaResultRarity: document.querySelector("#gachaResultRarity"),
  gachaResultTitle: document.querySelector("#gachaResultTitle"),
  gachaResultText: document.querySelector("#gachaResultText"),
  gachaParty: document.querySelector("#gachaParty"),
  gachaPrizePreview: document.querySelector("#gachaPrizePreview"),
  mapTitle: document.querySelector("#mapTitle"),
  mapStageNote: document.querySelector("#mapStageNote"),
  mapCurrentPlace: document.querySelector("#mapCurrentPlace"),
  mapCurrentText: document.querySelector("#mapCurrentText"),
  mapNextPlace: document.querySelector("#mapNextPlace"),
  mapNextText: document.querySelector("#mapNextText"),
  mapRewardName: document.querySelector("#mapRewardName"),
  mapRewardText: document.querySelector("#mapRewardText"),
  mapJourneyText: document.querySelector("#mapJourneyText"),
  mapJourneyProgress: document.querySelector("#mapJourneyProgress"),
  mapStages: document.querySelector("#mapStages"),
  mapTrail: document.querySelector("#mapTrail"),
  nextRewardText: document.querySelector("#nextRewardText"),
  rewardShelf: document.querySelector("#rewardShelf"),
  coachMessage: document.querySelector("#coachMessage"),
  customForm: document.querySelector("#customForm"),
  customExpression: document.querySelector("#customExpression"),
  reviewButton: document.querySelector("#reviewButton"),
  weakPointText: document.querySelector("#weakPointText"),
  parentWeakPointText: document.querySelector("#parentWeakPointText"),
  parentSolvedToday: document.querySelector("#parentSolvedToday"),
  parentGoalText: document.querySelector("#parentGoalText"),
  parentTotalSolved: document.querySelector("#parentTotalSolved"),
  parentStreak: document.querySelector("#parentStreak"),
  parentFocusText: document.querySelector("#parentFocusText"),
  parentWeakList: document.querySelector("#parentWeakList"),
  parentReviewButton: document.querySelector("#parentReviewButton"),
  dailyGoal: document.querySelector("#dailyGoal"),
  practiceFocus: document.querySelector("#practiceFocus"),
  soundToggle: document.querySelector("#soundToggle"),
  resetCoinsButton: document.querySelector("#resetCoinsButton"),
  resetGachaButton: document.querySelector("#resetGachaButton"),
  resetRewardButton: document.querySelector("#resetRewardButton"),
  resetAllButton: document.querySelector("#resetAllButton"),
  parentResetMessage: document.querySelector("#parentResetMessage"),
  tutorialOverlay: document.querySelector("#tutorialOverlay"),
  tutorialStartButton: document.querySelector("#tutorialStartButton"),
  tutorialSkipButton: document.querySelector("#tutorialSkipButton"),
  tutorialCloseButton: document.querySelector("#tutorialCloseButton"),
  showTutorialButton: document.querySelector("#showTutorialButton"),
  historyList: document.querySelector("#historyList"),
  numpad: document.querySelector(".numpad"),
};

function setCharacterMood(mood = "main", duration = 0) {
  const selectedPrize = GACHA_PRIZES.find((prize) => prize.key === state.selectedCompanion);
  const baseSrc = selectedPrize?.image || CHARACTER_IMAGES.main;
  const src = mood === "main" ? baseSrc : CHARACTER_IMAGES[mood] || baseSrc;
  document.querySelectorAll(".character-avatar").forEach((image) => {
    if (image.classList.contains("stage-up-character")) return;
    image.src = src;
    image.dataset.mood = mood;
  });
  window.clearTimeout(setCharacterMood.timer);
  if (duration > 0 && mood !== "main") {
    setCharacterMood.timer = window.setTimeout(() => setCharacterMood("main"), duration);
  }
}

window.setCharacterMood = setCharacterMood;

const WORLDS = [
  { name: "ひみつの森", text: "まずは筆算の順番に慣れよう。", target: 0, icon: "森", image: "assets/stages/stage-forest.png" },
  { name: "すうじの川", text: "くり上がりの小さい数を見ながら進もう。", target: 5, icon: "川", image: "assets/stages/stage-river.png" },
  { name: "くり上がり山", text: "少し長い計算も、1マスずつなら大丈夫。", target: 10, icon: "山", image: "assets/stages/stage-mountain.png" },
  { name: "わり算どうくつ", text: "商、かける、ひく、おろすを順番に進めよう。", target: 15, icon: "洞", image: "assets/stages/stage-cave.png" },
  { name: "100の位キャッスル", text: "3けたのかけ算に挑戦しよう。", target: 25, icon: "城", image: "assets/stages/stage-castle.png" },
  { name: "わり算マスター城", text: "大きな数のわり算に挑戦しよう。", target: 40, icon: "星", image: "assets/stages/stage-starland.png" },
];
const REWARDS = [
  { at: 3, name: "森のバッジ", note: "3問クリア", icon: "森" },
  { at: 6, name: "星のシール", note: "6問クリア", icon: "星" },
  { at: 10, name: "宝石ペン", note: "10問クリア", icon: "宝" },
  { at: 15, name: "月のメダル", note: "15問クリア", icon: "月" },
  { at: 25, name: "筆算王冠", note: "25問クリア", icon: "冠" },
];
const STICKERS = [
  ["clear", "まるシール", "1問クリア", "○"],
  ["multiply", "かけ算シール", "かけ算クリア", "×"],
  ["divide", "わり算シール", "わり算クリア", "÷"],
  ["noHint", "ノーヒントシール", "ノーヒント", "光"],
  ["combo", "3れんぞくシール", "3れんぞく", "3"],
  ["challenge", "チャレンジシール", "大きい数", "!"],
  ["streak5", "5れんぞくシール", "5れんぞく", "5"],
  ["streak10", "10れんぞくシール", "10れんぞく", "10"],
  ["carry", "くり上がりシール", "くり上がり", "↑"],
  ["borrow", "くり下がりシール", "くり下がり", "↓"],
  ["spark", "ひらめきシール", "ひらめき", "灯"],
  ["focus", "しゅうちゅうシール", "集中", "筆"],
  ["effort", "がんばりシール", "がんばり", "旗"],
  ["treasure", "たからばこシール", "宝箱", "宝"],
  ["coin", "コインシール", "コイン", "コ"],
  ["gacha", "ガチャシール", "ガチャ", "玉"],
  ["morning", "あさべんシール", "朝の練習", "朝"],
  ["night", "よるべんシール", "夜の練習", "夜"],
  ["review", "ふくしゅうシール", "復習", "復"],
  ["master", "マスターシール", "マスター", "冠"],
  ["forest", "もりシール", "森ステージ", "森"],
  ["river", "かわシール", "川ステージ", "川"],
  ["cave", "どうくつシール", "どうくつ", "晶"],
  ["starland", "スターランドシール", "スターランド", "星"],
].map(([key, name, note, icon], index) => ({
  key,
  name,
  note,
  icon,
  image: `assets/rewards/stickers/sticker${String(index + 1).padStart(3, "0")}.png`,
}));
const TITLE_BADGES = [
  ["firstStep", "はじめの一歩", "1問クリア", "足", ({ solvedTotal }) => solvedTotal >= 1],
  ["rookie", "筆算見習い", "3問クリア", "筆", ({ solvedTotal }) => solvedTotal >= 3],
  ["multiply", "かけ算チャレンジャー", "かけ算を5問クリア", "×", () => solvedKindCount("multiply") >= 5],
  ["divide", "わり算チャレンジャー", "わり算を5問クリア", "÷", () => solvedKindCount("divide") >= 5],
  ["carry", "くり上がり名人", "10問クリア", "↑", ({ solvedTotal }) => solvedTotal >= 10],
  ["cave", "わり算どうくつ探検家", "わり算を10問クリア", "洞", () => solvedKindCount("divide") >= 10],
  ["noMiss", "ノーミススター", "5れんぞく", "星", () => state.streak >= 5],
  ["combo", "連続チャレンジャー", "10れんぞく", "連", () => state.streak >= 10],
  ["coin", "コインコレクター", "500コイン集める", "コ", () => state.coins >= 500],
  ["gacha", "ガチャマスター", "キャラを10体集める", "玉", () => ownedPrizeCount() >= 10],
  ["summer", "夏休みの達人", "30問クリア", "夏", ({ solvedTotal }) => solvedTotal >= 30],
  ["master", "筆算マスター", "50問クリア", "冠", ({ solvedTotal }) => solvedTotal >= 50],
].map(([key, name, note, icon, unlocked], index) => ({
  key,
  name,
  note,
  icon,
  unlocked,
  image: `assets/rewards/titles/title${String(index + 1).padStart(3, "0")}.png`,
}));
const GACHA_PRIZES = [
  ["main", "おすましニャン", "N", "顔"],
  ["cheer", "おうえんニャン", "N", "応"],
  ["thinking", "ひらめきニャン", "N", "考"],
  ["happy", "ばんざいニャン", "N", "喜"],
  ["char005", "もりのニャン", "N", "森"],
  ["char006", "みずたまニャン", "N", "水"],
  ["char007", "そよかぜニャン", "N", "風"],
  ["char008", "はっぱニャン", "N", "葉"],
  ["char009", "えんぴつニャン", "N", "筆"],
  ["char010", "ほんよみニャン", "N", "本"],
  ["char011", "まるつけニャン", "N", "丸"],
  ["char012", "すうじニャン", "N", "算"],
  ["char013", "ほしぞらニャン", "N", "星"],
  ["char014", "おつきみニャン", "N", "月"],
  ["char015", "しずくニャン", "N", "滴"],
  ["char016", "しましまニャン", "N", "縞"],
  ["char017", "ふうせんニャン", "N", "空"],
  ["char018", "キャンディニャン", "N", "飴"],
  ["char019", "おはなニャン", "N", "花"],
  ["char020", "ひまわりニャン", "N", "向"],
  ["char021", "たんけんニャン", "R", "探"],
  ["char022", "まほうニャン", "R", "魔"],
  ["char023", "はかせニャン", "R", "博"],
  ["char024", "パズルニャン", "R", "P"],
  ["char025", "うちゅうニャン", "R", "宙"],
  ["char026", "うみべニャン", "R", "海"],
  ["char027", "こおりニャン", "R", "氷"],
  ["char028", "クローバーニャン", "R", "緑"],
  ["char029", "さくらニャン", "R", "桜"],
  ["char030", "ひかりニャン", "R", "光"],
  ["char031", "おんぷニャン", "R", "音"],
  ["char032", "はやぶさニャン", "R", "速"],
  ["char033", "ダンスニャン", "R", "踊"],
  ["char034", "おしのびニャン", "R", "忍"],
  ["char035", "ラッキーニャン", "R", "幸"],
  ["char036", "スターライトニャン", "SR", "星"],
  ["char037", "クラウンニャン", "SR", "冠"],
  ["char038", "にじいろニャン", "SR", "虹"],
  ["char039", "ゴールドニャン", "SR", "金"],
  ["char040", "クリスタルニャン", "SR", "晶"],
  ["char041", "ほのおニャン", "SR", "炎"],
  ["char042", "シルバーニャン", "SR", "銀"],
  ["char043", "ドラゴンニャン", "SR", "竜"],
  ["char044", "オーロラニャン", "SR", "光"],
  ["char045", "キングニャン", "SR", "王"],
  ["char046", "レジェンドニャン", "UR", "伝"],
  ["char047", "ミラクルニャン", "UR", "奇"],
  ["char048", "きらめきニャン", "UR", "輝"],
  ["char049", "ゆめみるニャン", "UR", "夢"],
  ["char050", "ロイヤルニャン", "UR", "冠"],
].map(([key, name, rarity, icon], index) => ({
  key,
  name,
  kind: "キャラ",
  rarity,
  icon,
  image: `assets/rewards/characters/char${String(index + 1).padStart(3, "0")}.png`,
  note: `${name}が仲間になりました。`,
}));
state.gachaCollection.main = Math.max(1, Number(state.gachaCollection.main || 0));
if (!ownedPrize(GACHA_PRIZES.find((prize) => prize.key === state.selectedCompanion))) {
  state.selectedCompanion = "main";
}

const RANKS = [
  { at: 0, name: "見習い" },
  { at: 3, name: "森の探検家" },
  { at: 6, name: "計算ナイト" },
  { at: 10, name: "筆算レンジャー" },
  { at: 15, name: "わり算ガイド" },
  { at: 25, name: "筆算スター" },
];

function rankFor(count) {
  return RANKS.reduce((current, rank) => (count >= rank.at ? rank : current), RANKS[0]);
}

const COURSES = {
  autoAdventure: { mode: "auto", level: 1 },
  starter: { mode: "multiply", level: 1 },
  multiplyFill: { mode: "multiplyFill", level: 1 },
  multiplyForest: { mode: "multiply", level: 1 },
  multiplyMountain: { mode: "multiply", level: 2 },
  multiplyCastle: { mode: "multiply", level: 4 },
  divideRiver: { mode: "divide", level: 1 },
  divideCave: { mode: "divide", level: 3 },
  divideSky: { mode: "divide", level: 4 },
  mixAdventure: { mode: "mix", level: 3 },
};

function backgroundStageInfo(stageNumber) {
  const stage = Math.max(1, Math.min(90, Number(stageNumber || 1)));
  const zero = stage - 1;
  const frameLevel = Math.floor(zero / BACKGROUND_REWARDS.length) + 1;
  const background = BACKGROUND_REWARDS[zero % BACKGROUND_REWARDS.length];
  const frame = BACKGROUND_FRAMES.find((item) => item.level === frameLevel) || BACKGROUND_FRAMES[0];
  return { stage, background, frame };
}

function unlockedFrameLevelForBackground(backgroundId) {
  let level = 0;
  for (let stage = 1; stage <= state.backgroundQuest.unlockedStage; stage += 1) {
    const info = backgroundStageInfo(stage);
    if (info.background.id === backgroundId) level = Math.max(level, info.frame.level);
  }
  return level;
}

function selectedBackgroundInfo() {
  const selected = BACKGROUND_REWARDS.find((item) => item.id === state.backgroundQuest.selected) || BACKGROUND_REWARDS[0];
  const frameLevel = Math.max(1, unlockedFrameLevelForBackground(selected.id));
  const frame = BACKGROUND_FRAMES.find((item) => item.level === frameLevel) || BACKGROUND_FRAMES[0];
  return { background: selected, frame };
}

function nextBackgroundQuestInfo() {
  if (state.backgroundQuest.unlockedStage >= BACKGROUND_REWARDS.length * BACKGROUND_FRAMES.length) {
    return { complete: true, left: 0, progress: 100, next: backgroundStageInfo(state.backgroundQuest.unlockedStage) };
  }
  const left = BACKGROUND_QUEST_STEP - state.backgroundQuest.progress;
  return {
    complete: false,
    left,
    progress: (state.backgroundQuest.progress / BACKGROUND_QUEST_STEP) * 100,
    next: backgroundStageInfo(state.backgroundQuest.unlockedStage + 1),
  };
}

function advanceBackgroundQuest() {
  if (state.problem?.kind !== "multiplyFill" || state.answerShown) return null;
  if (state.backgroundQuest.unlockedStage >= BACKGROUND_REWARDS.length * BACKGROUND_FRAMES.length) return null;
  state.backgroundQuest.progress += 1;
  if (state.backgroundQuest.progress < BACKGROUND_QUEST_STEP) return null;
  state.backgroundQuest.progress = 0;
  state.backgroundQuest.unlockedStage = Math.min(
    BACKGROUND_REWARDS.length * BACKGROUND_FRAMES.length,
    state.backgroundQuest.unlockedStage + 1,
  );
  const unlocked = backgroundStageInfo(state.backgroundQuest.unlockedStage);
  state.backgroundQuest.selected = unlocked.background.id;
  return unlocked;
}

function selectHomeBackground(backgroundId) {
  const id = Number(backgroundId);
  if (!BACKGROUND_REWARDS.some((item) => item.id === id)) return;
  if (unlockedFrameLevelForBackground(id) <= 0) return;
  state.backgroundQuest.selected = id;
  saveProgress();
  updateProgress();
}

const AUTO_STAGES = [
  { name: "ひとけたスタート", target: 5, noMissTarget: 3, difficulty: "easy" },
  { name: "くり上がりの森", target: 5, noMissTarget: 3, difficulty: "easy" },
  { name: "百の位タワー", target: 6, noMissTarget: 4, difficulty: "normal" },
  { name: "二けた橋", target: 6, noMissTarget: 4, difficulty: "normal" },
  { name: "わり算スター", target: 6, noMissTarget: 4, difficulty: "normal" },
  { name: "あまりの池", target: 8, noMissTarget: 5, difficulty: "hard" },
  { name: "大きな筆算城", target: 8, noMissTarget: 5, difficulty: "hard" },
  { name: "二けたボス", target: 8, noMissTarget: 5, difficulty: "hard" },
  { name: "マスターチャレンジ", target: 10, noMissTarget: 6, difficulty: "master" },
];

function showView(name, options = {}) {
  const currentView = document.querySelector(".view.active")?.dataset.view || "home";
  if (name === currentView) return;
  if (options.push !== false && currentView) {
    viewHistory.push(currentView);
  }
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.dataset.view === name);
  });
  if (name === "challenge") {
    focusActiveInput(state.steps[state.stepIndex]);
  }
  if (options.scroll !== false) {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }
}

window.showView = showView;

function goBackView() {
  const previousView = viewHistory.pop() || "home";
  showView(previousView, { push: false });
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function todayKey() {
  return `hp_solved_${new Date().toISOString().slice(0, 10)}`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sample(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function coinProgress() {
  const ready = Math.floor(state.coins / GACHA_COST);
  const rest = state.coins % GACHA_COST;
  return {
    ready,
    rest,
    need: rest === 0 && ready > 0 ? 0 : GACHA_COST - rest,
    percent: Math.min(100, (rest / GACHA_COST) * 100),
  };
}

function treasureProgressInfo() {
  const progress = Math.max(0, Math.min(TREASURE_INTERVAL - 1, Number(state.treasureProgress || 0)));
  const left = TREASURE_INTERVAL - progress;
  return {
    progress,
    left,
    percent: Math.max(8, (progress / TREASURE_INTERVAL) * 100),
  };
}

function updateTreasureProgress() {
  const progress = Number(state.treasureProgress || 0) + 1;
  if (progress < TREASURE_INTERVAL) {
    state.treasureProgress = progress;
    return { opened: false, bonus: 0 };
  }

  const bonusPool = [10, 15, 20, 30];
  const bonus = sample(bonusPool);
  state.treasureProgress = 0;
  return { opened: true, bonus };
}

function isChallengeProblem(problem = state.problem) {
  if (!problem) return false;
  if (problem.kind === "multiplyFill") return false;
  if (problem.kind === "divide") return problem.dividend >= 1000 || problem.divisor >= 10;
  return problem.top >= 100 || problem.bottom >= 10;
}

function coinsForCompletedProblem(comboHit = false) {
  let coins = 20;
  if (state.hintLevel === 0) coins += 5;
  if (state.problemMistakes === 0 && !state.answerShown) coins += 5;
  if (comboHit && state.problemMistakes === 0 && !state.answerShown) coins += 15;
  if (isChallengeProblem()) coins += 10;
  if (state.answerShown) coins = Math.max(8, Math.floor(coins / 2));
  return coins;
}

function rarityLabel(rarity) {
  return RARITY_CONFIG[rarity]?.label || rarity;
}

function duplicateFragmentsFor(prize) {
  return RARITY_CONFIG[prize?.rarity]?.duplicateFragments || 1;
}

function exchangeCostFor(prize) {
  return RARITY_CONFIG[prize?.rarity]?.exchangeCost || 3;
}

function ownedPrize(prize) {
  return Boolean(prize && state.gachaCollection[prize.key] > 0);
}

function solvedKindCount(kind) {
  const stickerCount = kind === "multiply" ? state.stickers.multiply || 0 : kind === "divide" ? state.stickers.divide || 0 : 0;
  return Math.max(stickerCount, state.history.filter((entry) => entry.kind === kind).length);
}

function pickGachaRarity() {
  const total = Object.values(RARITY_CONFIG).reduce((sum, item) => sum + item.rate, 0);
  let roll = randomInt(1, total);
  for (const [rarity, config] of Object.entries(RARITY_CONFIG)) {
    roll -= config.rate;
    if (roll <= 0) return rarity;
  }
  return "N";
}

function pickGachaPrize() {
  const rarity = pickGachaRarity();
  const pool = GACHA_PRIZES.filter((prize) => prize.rarity === rarity);
  return sample(pool.length ? pool : GACHA_PRIZES);
}

function prizeVisualHtml(prize, locked = false) {
  if (locked || !prize) return '<span class="prize-mark">?</span>';
  if (prize.image) {
    return `<img src="${escapeHtml(prize.image)}" alt="" /><span class="prize-mark">${escapeHtml(prize.icon)}</span>`;
  }
  return `<span class="prize-mark">${escapeHtml(prize.icon)}</span>`;
}

function stickerVisualHtml(sticker, locked = false) {
  if (locked || !sticker?.image) return escapeHtml(sticker?.icon || "?");
  return `<img src="${escapeHtml(sticker.image)}" alt="" />`;
}

function titleBadgeStatus() {
  const solvedTotal = Math.floor(state.stars / 3);
  return TITLE_BADGES.map((badge) => ({
    ...badge,
    isUnlocked: Boolean(badge.unlocked({ solvedTotal })),
  }));
}

function titleBadgeCount() {
  return titleBadgeStatus().filter((badge) => badge.isUnlocked).length;
}

function titleBadgeVisualHtml(badge) {
  if (!badge?.isUnlocked) return escapeHtml(badge?.icon || "?");
  return `<img src="${escapeHtml(badge.image)}" alt="" />`;
}

function ownedPrizeCount() {
  return GACHA_PRIZES.filter((prize) => state.gachaCollection[prize.key] > 0).length;
}

function gachaProblemEstimate(coin = coinProgress()) {
  if (coin.ready > 0) return "いまガチャチャンス";
  return `あと約${Math.max(1, Math.ceil(coin.need / 25))}問`;
}

function raritySummaryHtml() {
  return RARITY_ORDER.map((rarity) => {
    const total = GACHA_PRIZES.filter((prize) => prize.rarity === rarity).length;
    const owned = GACHA_PRIZES.filter((prize) => prize.rarity === rarity && ownedPrize(prize)).length;
    return `
      <span class="rarity-chip rarity-${rarity}">
        <b>${rarity}</b>${owned}/${total}
      </span>
    `;
  }).join("");
}

function exchangeTargets() {
  return GACHA_PRIZES
    .filter((prize) => !ownedPrize(prize))
    .map((prize) => ({ ...prize, cost: exchangeCostFor(prize), canExchange: state.gachaFragments >= exchangeCostFor(prize) }))
    .sort((a, b) => {
      if (a.canExchange !== b.canExchange) return a.canExchange ? -1 : 1;
      if (a.cost !== b.cost) return a.cost - b.cost;
      return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
    });
}

function nextCharacterGoal() {
  const targets = exchangeTargets();
  return targets.find((prize) => prize.canExchange) || targets.find((prize) => prize.rarity === "UR") || targets.find((prize) => prize.rarity === "SR") || targets[0] || null;
}

function nextRewardGoalInfo() {
  const coin = coinProgress();
  const treasure = treasureProgressInfo();
  const background = nextBackgroundQuestInfo();
  const character = nextCharacterGoal();
  if (coin.ready > 0) {
    return {
      label: "ガチャチャンス",
      title: `いま${coin.ready}回まわせます`,
      text: character ? `次は「${character.name}」みたいな仲間に会えるかも。` : "コレクションを見に行こう。",
      progress: 100,
      className: "is-gacha-ready",
    };
  }
  if (state.problem?.kind === "multiplyFill" || state.mode === "multiplyFill") {
    const leftText = background.left === 1 ? "あと1問で新しい背景！" : `背景まであと${background.left}問`;
    return {
      label: "背景チャレンジ",
      title: background.complete ? "背景コンプリート" : leftText,
      text: background.complete
        ? "すべての景色を集めました。好きな背景を選べます。"
        : `次は「${background.next.background.name}」。クリアするとホームが変わります。`,
      progress: background.complete ? 100 : Math.max(6, background.progress),
      className: "is-background",
    };
  }
  return {
    label: "つぎのごほうび",
    title: treasure.left === 1 ? "次の1問で宝箱" : `宝箱まであと${treasure.left}問`,
    text: `ガチャは${gachaProblemEstimate(coin)}。宝箱とコインをためよう。`,
    progress: treasure.percent,
    className: "is-treasure",
  };
}

function selectCompanion(key) {
  const prize = GACHA_PRIZES.find((item) => item.key === key);
  if (!prize || !ownedPrize(prize)) return;
  state.selectedCompanion = key;
  saveProgress();
  setCharacterMood("main");
  updateCompanion();
}

function exchangePrize(key) {
  const prize = GACHA_PRIZES.find((item) => item.key === key);
  if (!prize || ownedPrize(prize)) return;
  const cost = exchangeCostFor(prize);
  if (state.gachaFragments < cost) return;
  state.gachaFragments -= cost;
  state.gachaCollection[prize.key] = 1;
  state.lastGachaPrize = { ...prize, exchanged: true };
  saveProgress();
  setCharacterMood("happy", 1600);
  celebrate();
  updateProgress();
}

function courseDisplayName() {
  if (state.problem?.autoName) return state.problem.autoName;
  const activeCourse = document.querySelector(".course-card.active strong")?.textContent?.trim();
  if (activeCourse) return activeCourse;
  if (state.problem?.kind === "divide") return "わり算チャレンジ";
  return "かけ算チャレンジ";
}

function selectedCourseName() {
  return document.querySelector(`.course-card[data-course="${state.course}"] strong`)?.textContent?.trim() || courseDisplayName();
}

function currentAutoStageInfo() {
  const stageIndex = Math.max(0, Math.min(Number(state.autoProgress?.stage || 0), AUTO_STAGES.length - 1));
  return { index: stageIndex, ...AUTO_STAGES[stageIndex] };
}

function autoStageProgressText() {
  const stage = currentAutoStageInfo();
  const clears = Number(state.autoProgress?.clears || 0);
  const noMiss = Number(state.autoProgress?.noMiss || 0);
  const clearLeft = Math.max(stage.target - clears, 0);
  const noMissLeft = Math.max(stage.noMissTarget - noMiss, 0);
  if (stage.index >= AUTO_STAGES.length - 1 && clearLeft === 0 && noMissLeft === 0) return "マスター練習中";
  if (clearLeft === 0 && noMissLeft > 0) return `ノーミスあと${noMissLeft}回`;
  return `次まであと${clearLeft}問`;
}

function updateAutoStageProgress(cleanClear) {
  if (state.course !== "autoAdventure" && state.mode !== "auto") return null;
  const progress = state.autoProgress || { stage: 0, clears: 0, noMiss: 0, misses: 0 };
  const stage = currentAutoStageInfo();
  progress.clears = Number(progress.clears || 0) + 1;
  if (cleanClear) {
    progress.noMiss = Number(progress.noMiss || 0) + 1;
  } else {
    progress.misses = Number(progress.misses || 0) + 1;
  }

  const canAdvance = progress.clears >= stage.target && progress.noMiss >= stage.noMissTarget;
  if (canAdvance && progress.stage < AUTO_STAGES.length - 1) {
    progress.stage += 1;
    progress.clears = 0;
    progress.noMiss = 0;
    progress.misses = 0;
    state.autoProgress = progress;
    return AUTO_STAGES[progress.stage];
  }

  state.autoProgress = progress;
  return null;
}

function buildMultiplyProblem(top, bottom) {
  const bottomDigits = String(bottom).split("").reverse().map(Number);
  const partials = bottomDigits.map((digit, index) => top * digit * 10 ** index);
  const rawPartials = bottomDigits.map((digit) => top * digit);
  const answer = top * bottom;
  const width = Math.max(String(answer).length, String(top).length, String(bottom).length + 1);
  return { kind: "multiply", top, bottom, partials, rawPartials, answer, width };
}

function buildMultiplyFillProblem(left, right, missingSide = sample(["left", "right"])) {
  const product = left * right;
  const missing = missingSide === "left" ? left : right;
  const shown = missingSide === "left" ? right : left;
  return { kind: "multiplyFill", left, right, shown, missing, missingSide, product };
}

function buildDivideProblem(divisor, quotient, remainder = 0) {
  const dividend = divisor * quotient + remainder;
  const product = divisor * quotient;
  return { kind: "divide", divisor, dividend, quotient, product, remainder };
}

function makeByRange(topRange, bottomRange) {
  return {
    top: randomInt(topRange[0], topRange[1]),
    bottom: randomInt(bottomRange[0], bottomRange[1]),
  };
}

function makeDivisionByRange(divisorRange, quotientRange, remainderMode = "none", minDividend = 0) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const divisor = randomInt(divisorRange[0], divisorRange[1]);
    const quotient = randomInt(quotientRange[0], quotientRange[1]);
    const remainder =
      remainderMode === "some" ? randomInt(1, divisor - 1) : remainderMode === "mixed" ? randomInt(0, divisor - 1) : 0;
    const dividend = divisor * quotient + remainder;
    if (dividend >= minDividend) return { divisor, quotient, remainder };
  }

  const divisor = divisorRange[1];
  const quotient = Math.max(quotientRange[0], Math.ceil(minDividend / divisor));
  const remainder = remainderMode === "some" ? 1 : 0;
  return { divisor, quotient, remainder };
}

function autoStage() {
  const savedStage = Number(state.autoProgress?.stage || 0);
  const focus = state.settings.focus;
  const weak = topWeakness();
  if (focus === "multiply") return Math.min(savedStage, 6);
  if (focus === "divide") return Math.max(4, Math.min(savedStage, 8));
  if (weak && ["商", "かける", "ひく", "おろす", "わり算"].some((label) => weak[0].includes(label))) {
    return Math.max(4, Math.min(savedStage, 7));
  }
  return Math.max(0, Math.min(savedStage, AUTO_STAGES.length - 1));
}

function makeAutoProblem() {
  const stage = autoStage();
  let problem;
  let autoName;
  if (stage === 0) {
    const base = makeByRange([2, 9], [2, 9]);
    problem = buildMultiplyProblem(base.top, base.bottom);
    autoName = "ひとけたスタート";
  } else if (stage === 1) {
    const base = makeByRange([12, 49], [2, 9]);
    problem = buildMultiplyProblem(base.top, base.bottom);
    autoName = "くり上がりの森";
  } else if (stage === 2) {
    const base = makeByRange([120, 499], [2, 9]);
    problem = buildMultiplyProblem(base.top, base.bottom);
    autoName = "百の位タワー";
  } else if (stage === 3) {
    const base = makeByRange([12, 89], [12, 49]);
    problem = buildMultiplyProblem(base.top, base.bottom);
    autoName = "二けた橋";
  } else if (stage === 4) {
    const base = makeDivisionByRange([2, 9], [4, 24], "none");
    problem = buildDivideProblem(base.divisor, base.quotient, base.remainder);
    autoName = "わり算スタート";
  } else if (stage === 5) {
    const base = makeDivisionByRange([3, 9], [14, 92], "some");
    problem = buildDivideProblem(base.divisor, base.quotient, base.remainder);
    autoName = "あまりの池";
  } else if (stage === 6) {
    const base = makeByRange([120, 999], [12, 89]);
    problem = buildMultiplyProblem(base.top, base.bottom);
    autoName = "大きな筆算城";
  } else if (stage === 7) {
    const base = makeDivisionByRange([12, 49], [12, 98], "mixed");
    problem = buildDivideProblem(base.divisor, base.quotient, base.remainder);
    autoName = "二けたボス";
  } else {
    const base = sample([
      () => makeByRange([120, 999], [120, 999]),
      () => makeDivisionByRange([12, 89], [120, 999], "mixed"),
    ])();
    problem = base.top ? buildMultiplyProblem(base.top, base.bottom) : buildDivideProblem(base.divisor, base.quotient, base.remainder);
    autoName = "マスターチャレンジ";
  }
  problem.autoName = autoName;
  problem.autoStage = stage;
  return problem;
}
function padLeft(value, length) {
  return String(value).padStart(length, " ");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function placeNameFromRight(index) {
  return ["一の位", "十の位", "百の位", "千の位"][index] || `${index + 1}けた目`;
}

function digitCells(value, width) {
  return padLeft(value, width)
    .split("")
    .map((digit) => `<span class="digit-cell">${digit === " " ? "" : digit}</span>`)
    .join("");
}

function makeInputCell(name, digit, position, meta = {}, extraClass = "") {
  if (digit === " ") return '<span class="digit-cell"></span>';

  const attrs = [
    `class="digit-input ${extraClass}"`,
    `inputmode="numeric"`,
    `aria-label="${escapeHtml(`${name} ${position + 1}けた目`)}"`,
    `data-answer="${digit}"`,
    `data-step="${escapeHtml(meta.step || "")}"`,
    `data-carry="${escapeHtml(meta.carry || "")}"`,
    `data-multiply-memo="${escapeHtml(meta.multiplyMemo || "")}"`,
    `data-seq="${meta.seq ?? ""}"`,
  ];

  return `<span class="digit-cell">
    <input ${attrs.join(" ")} disabled />
  </span>`;
}

function digitInputCells(name, answer, width, metas = {}, extraClass = "") {
  return padLeft(answer, width)
    .split("")
    .map((digit, index) => makeInputCell(name, digit, index, metas[index], extraClass))
    .join("");
}

function shiftedDigitInputCells(name, answer, width, shift, metas = {}) {
  const digits = padLeft(answer, width - shift).split("");
  const cells = digits.map((digit, index) =>
    makeInputCell(name, digit, index, metas[index], ""),
  );
  for (let index = 0; index < shift; index += 1) {
    cells.push('<span class="digit-cell"></span>');
  }
  return cells.join("");
}

function carryInputCells(name, width, metas = {}) {
  return Array.from({ length: width }, (_, index) => {
    const meta = metas[index];
    if (!meta) return '<span class="digit-cell"></span>';
    return makeInputCell(name, String(meta.answer), index, meta, "carry-input");
  }).join("");
}

function digitLine(value, width, className = "") {
  return `<div class="calc-row digit-line ${className}" style="--cols: ${width}">${digitCells(value, width)}</div>`;
}

function inputDigitLine(name, answer, width, metas = {}, className = "") {
  return `<div class="calc-row digit-line ${className}" style="--cols: ${width}">${digitInputCells(
    name,
    answer,
    width,
    metas,
  )}</div>`;
}

function shiftedInputDigitLine(name, answer, width, shift, metas = {}, className = "") {
  return `<div class="calc-row digit-line ${className}" style="--cols: ${width}">${shiftedDigitInputCells(
    name,
    answer,
    width,
    shift,
    metas,
  )}</div>`;
}

function carryLine(name, width, metas = {}) {
  return `<div class="calc-row digit-line carry-line" style="--cols: ${width}">${carryInputCells(
    name,
    width,
    metas,
  )}</div>`;
}

function guideForInput(input) {
  const step = input.dataset.step || "";
  const carry = input.dataset.carry || "";
  if (step || carry) {
    return {
      text: step || "オレンジのマスに数字を1つ入れましょう。",
      carry: carry || "次のマスへ進みます。",
    };
  }

  if (input.classList.contains("carry-input")) {
    return {
      text: "くり上がりを小さいマスに入れよう。",
      carry: "次の計算で、上に書いた数も足します。",
    };
  }
  if (input.closest(".quotient-row")) {
    return {
      text: "何回入るかな。上のマスに入れよう。",
      carry: "次は、かけ算でたしかめます。",
    };
  }
  if (input.closest(".division-product-row")) {
    return {
      text: "かけ算の答えを下に入れよう。",
      carry: "右から順番に進めます。",
    };
  }
  if (input.closest(".division-remainder-row")) {
    return {
      text: "ひいた答えを入れよう。",
      carry: "できたら、次の数字をおろします。",
    };
  }
  if (input.closest(".division-final-row")) {
    return {
      text: "最後のあまりを入れよう。",
      carry: "割る数より小さいかな。",
    };
  }
  if (input.closest(".fill-equation")) {
    const product = input.dataset.product;
    const shown = input.dataset.shown;
    const side = input.dataset.side === "left" ? "左" : "右";
    return {
      text: `${side}のかくれた数をさがそう。`,
      carry: `${shown}の段で、${product}になるところを見つけよう。`,
    };
  }
  if (input.closest(".guided-row")) {
    return {
      text: "右から順番に入れよう。",
      carry: "上の数字を見て考えよう。",
    };
  }
  return {
    text: "オレンジのマスに数字を1つ入れましょう。",
    carry: "右の位から順番に進めます。",
  };
}
function inputGroup(name, answer, metas = {}) {
  const text = String(answer);
  return `<span class="input-group" data-group="${escapeHtml(name)}" aria-label="${escapeHtml(name)}" style="--cols: ${text.length}">
    ${text
      .split("")
      .map((digit, index) => makeInputCell(name, digit, index, metas[index]))
      .join("")}
  </span>`;
}

function alignedText(value, width, endIndex) {
  const cells = Array.from({ length: width }, () => " ");
  String(value)
    .split("")
    .reverse()
    .forEach((digit, offset) => {
      const index = endIndex - offset;
      if (index >= 0 && index < width) cells[index] = digit;
    });
  return cells.join("");
}

function divisionMultiplyMemoHtml(divisor, quotientDigit) {
  const multiplier = Number(quotientDigit);
  const digits = String(divisor).split("").map(Number);
  if (!Number.isFinite(multiplier) || multiplier < 0) return "";
  if (multiplier === 0) {
    return `
      <div class="division-multiply-memo">
        <span>かけ算の途中</span>
        <strong>${divisor} × 0</strong>
        <p>右から順番に入れよう。</p>
      </div>
    `;
  }
  let carry = 0;
  const steps = [];
  [...digits].reverse().forEach((digit, reverseIndex) => {
    const total = digit * multiplier + carry;
    const writeDigit = total % 10;
    const nextCarry = Math.floor(total / 10);
    const place = placeNameFromRight(reverseIndex);
    const carryText = carry ? "上に書いた数も足そう" : "計算しよう";
    const nextText = nextCarry ? "上に小さく書く数があるよ。" : "そのまま次へ。";
    steps.push(`${place}: ${multiplier} × ${digit}。${carryText}。${nextText}`);
    carry = nextCarry;
  });
  if (carry > 0) steps.push("最後の上に書いた数も忘れずに。");
  return `
    <div class="division-multiply-memo">
      <span>かけ算の途中</span>
      <strong>${divisor} × ${multiplier}</strong>
      ${steps.map((step) => `<p>${step}</p>`).join("")}
    </div>
  `;
}

function divisionProductWork(divisor, quotientDigit, width, endIndex, startSeq, memoHtml) {
  const product = divisor * quotientDigit;
  const productText = alignedText(product, width, endIndex);
  const productMetas = {};
  const carryMetas = {};
  const divisorDigits = String(divisor).split("").reverse().map(Number);
  let carry = 0;
  let seq = startSeq;

  divisorDigits.forEach((divisorDigit, digitIndex) => {
    const total = divisorDigit * quotientDigit + carry;
    const resultDigit = total % 10;
    const nextCarry = Math.floor(total / 10);
    const pos = endIndex - digitIndex;
    const hasNextDivisorDigit = digitIndex < divisorDigits.length - 1;
    const place = placeNameFromRight(digitIndex);
    const formula = carry
      ? `${quotientDigit} × ${divisorDigit} に、上に書いた数も足そう。`
      : `${quotientDigit} × ${divisorDigit} を考えよう。`;

    if (nextCarry > 0 && hasNextDivisorDigit) {
      carryMetas[pos - 1] = {
        answer: nextCarry,
        step: `${formula}くり上がりを小さいマスに入れよう。`,
        carry: "次で、上に書いた数も足します。",
        multiplyMemo: memoHtml,
        seq,
      };
      seq += 1;
    }

    if (nextCarry > 0 && !hasNextDivisorDigit) {
      productMetas[pos - 1] = {
        step: `${formula}くり上がりの数を入れよう。`,
        carry: "次のマスで、この行が完成します。",
        multiplyMemo: memoHtml,
        seq,
      };
      seq += 1;
    }

    productMetas[pos] = {
      step: `${formula}答えを入れよう。`,
      carry: nextCarry ? "上に書いた数も忘れずに。" : "そのまま次へ進みます。",
      multiplyMemo: memoHtml,
      seq,
    };
    seq += 1;
    carry = nextCarry;
  });

  return { productText, productMetas, carryMetas, seq };
}
function makeMultiplyProblem() {
  const level = state.level;
  let problemBase;

  if (state.course === "starter") {
    problemBase = makeByRange([2, 9], [2, 9]);
  } else if (state.course === "multiplyForest") {
    problemBase = makeByRange([23, 89], [2, 9]);
  } else if (state.course === "multiplyMountain") {
    problemBase = makeByRange([12, 89], [12, 49]);
  } else if (state.course === "multiplyCastle") {
    problemBase = makeByRange([120, 999], [120, 999]);
  } else if (state.course === "mixAdventure") {
    problemBase = sample([
      () => makeByRange([24, 99], [3, 9]),
      () => makeByRange([12, 89], [12, 49]),
      () => makeByRange([120, 499], [12, 89]),
    ])();
  } else if (level === 1) {
    problemBase = makeByRange([12, 49], [2, 9]);
  } else if (level === 2) {
    problemBase = makeByRange([21, 98], [12, 39]);
  } else if (level === 3) {
    problemBase = makeByRange([42, 987], [12, 89]);
  } else {
    problemBase = makeByRange([120, 999], [120, 999]);
  }

  const { top, bottom } = problemBase;
  return buildMultiplyProblem(top, bottom);
}

function makeMultiplyFillProblem() {
  const left = randomInt(2, 9);
  const right = randomInt(2, 9);
  return buildMultiplyFillProblem(left, right);
}

function makeDivideProblem() {
  const level = state.level;
  let problemBase;

  if (state.course === "divideRiver") {
    problemBase = makeDivisionByRange([2, 9], [4, 24], "none");
  } else if (state.course === "divideCave") {
    problemBase = makeDivisionByRange([3, 9], [14, 92], "some");
  } else if (state.course === "divideSky") {
    problemBase = makeDivisionByRange([12, 49], [2100, 9800], "mixed", 100000);
  } else if (state.course === "mixAdventure") {
    problemBase = sample([
      () => makeDivisionByRange([2, 9], [8, 36], "none"),
      () => makeDivisionByRange([3, 9], [14, 92], "some"),
      () => makeDivisionByRange([2, 9], [120, 999], "mixed"),
    ])();
  } else if (level === 1) {
    problemBase = makeDivisionByRange([2, 9], [3, 12], "none");
  } else if (level === 2) {
    problemBase = makeDivisionByRange([2, 9], [12, 48], "none");
  } else if (level === 3) {
    problemBase = makeDivisionByRange([3, 9], [14, 92], "some");
  } else {
    problemBase = makeDivisionByRange([2, 9], [12000, 99999], "mixed", 100000);
  }

  const { divisor, quotient, remainder } = problemBase;
  return buildDivideProblem(divisor, quotient, remainder);
}

function renderProblem() {
  window.clearTimeout(scheduleNextProblem.timer);
  const mode = state.mode === "mix" ? sample(["multiply", "divide"]) : state.mode;
  state.problem =
    state.customProblem ||
    (mode === "auto"
      ? makeAutoProblem()
      : mode === "multiply"
        ? makeMultiplyProblem()
        : mode === "multiplyFill"
          ? makeMultiplyFillProblem()
          : makeDivideProblem());
  state.customProblem = null;
  state.steps = [];
  state.stepIndex = 0;
  state.hintLevel = 0;
  state.problemMistakes = 0;
  state.answerShown = false;
  state.completed = false;
  els.feedback.textContent = "";
  els.feedback.className = "feedback";
  els.checkButton.textContent = "このマスを確認";
  els.problemArea.closest(".problem-card")?.classList.toggle("fill-problem-card", state.problem.kind === "multiplyFill");
  document.querySelector(".challenge-view")?.classList.toggle("fill-challenge", state.problem.kind === "multiplyFill");

  if (state.problem.kind === "multiply") {
    renderMultiply(state.problem);
  } else if (state.problem.kind === "multiplyFill") {
    renderMultiplyFill(state.problem);
  } else {
    renderDivide(state.problem);
  }

  collectSteps();
  activateCurrentStep();
  updateCompanion();
  updateStageStatusPanel();
  if (els.coachMessage && state.history.length === 0 && localStorage.getItem("hp_tutorial_seen") !== "1") {
    els.coachMessage.textContent = "はじめはオレンジのマスだけ見よう。数字を入れたら自動で次へ進みます。";
  }
  if (state.problem.kind === "multiplyFill") {
    window.setTimeout(() => {
      els.problemArea?.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    }, 120);
  }
}

function multiplyMetas(problem) {
  const metas = {
    partials: problem.partials.map(() => ({})),
    carries: problem.partials.map(() => ({})),
    answer: {},
  };
  const topDigits = String(problem.top).split("").reverse().map(Number);
  const bottomDigits = String(problem.bottom).split("").reverse().map(Number);
  let seq = 0;

  bottomDigits.forEach((bottomDigit, rowIndex) => {
    const rowMetas = metas.partials[rowIndex];
    const carryMetas = metas.carries[rowIndex];
    let carry = 0;

    topDigits.forEach((topDigit, topIndex) => {
      const total = topDigit * bottomDigit + carry;
      const resultDigit = total % 10;
      const nextCarry = Math.floor(total / 10);
      const pos = problem.width - 1 - rowIndex - topIndex;
      const hasNextTopDigit = topIndex < topDigits.length - 1;
      const place = placeNameFromRight(topIndex);
      const formula = carry
        ? `${bottomDigit} × ${topDigit} に、上に書いた数も足そう。`
        : `${bottomDigit} × ${topDigit} を考えよう。`;

      if (nextCarry > 0 && hasNextTopDigit) {
        carryMetas[pos - 1] = {
          answer: nextCarry,
          step: `${formula}くり上がりを小さいマスに入れよう。`,
          carry: "次で、上に書いた数も足します。",
          seq,
        };
        seq += 1;
      }

      if (nextCarry > 0 && !hasNextTopDigit) {
        rowMetas[pos - 1] = {
          step: `${formula}くり上がりの数を入れよう。`,
          carry: "次のマスで、この段が完成します。",
          seq,
        };
        seq += 1;
      }

      rowMetas[pos] = {
        step: `${formula}答えを入れよう。`,
        carry: nextCarry ? "上に書いた数も忘れずに。" : "そのまま次へ進みます。",
        seq,
      };
      seq += 1;
      carry = nextCarry;
    });
  });

  let carry = 0;
  for (let pos = problem.width - 1; pos >= 0; pos -= 1) {
    const columnDigits = problem.partials
      .map((partial) => padLeft(partial, problem.width)[pos])
      .filter((digit) => digit && digit !== " ")
      .map(Number);
    if (columnDigits.length === 0 && carry === 0) continue;
    const sum = columnDigits.reduce((total, digit) => total + digit, carry);
    const resultDigit = sum % 10;
    const nextCarry = Math.floor(sum / 10);
    metas.answer[pos] = {
      step: `${columnDigits.join(" + ")}${carry ? " と上に書いた数" : ""}をたそう。`,
      carry: nextCarry ? "くり上がりを左の小さいマスに書きます。" : "次へ進もう。",
      seq,
    };
    seq += 1;
    carry = nextCarry;
  }

  return metas;
}
function renderMultiply(problem) {
  els.problemType.textContent = problem.autoName ? `おまかせ: ${problem.autoName}` : "かけ算";
  els.problemTitle.textContent = `${problem.top} × ${problem.bottom} の筆算`;
  const metas = multiplyMetas(problem);
  const hasFinalAnswerRow = String(problem.bottom).length > 1;

  const partialRows = problem.partials
    .map((partial, index) => {
      const name = index === 0 ? "1段目の答え" : `${index + 1}段目の答え`;
      const visiblePartial = problem.rawPartials[index] ?? partial / 10 ** index;
      return `
        ${carryLine(`${name}の繰り上がり`, problem.width, metas.carries[index])}
        ${shiftedInputDigitLine(name, visiblePartial, problem.width, index, metas.partials[index], "guided-row")}
      `;
    })
    .join("");

  els.problemArea.innerHTML = `
    <div class="guided-layout">
      <div class="paper-board" data-kind="multiply">
        ${digitLine(problem.top, problem.width)}
        <div class="operator-row">
          <span class="operator">×</span>
          ${digitLine(problem.bottom, problem.width)}
        </div>
        <div class="calc-line"></div>
        ${partialRows}
        ${
          hasFinalAnswerRow
            ? `<div class="calc-line"></div>${inputDigitLine("最後の答え", problem.answer, problem.width, metas.answer, "guided-row")}`
            : ""
        }
      </div>
      ${guidePanelHtml()}
    </div>
  `;
  wireInputFlow();
}

function renderMultiplyFill(problem) {
  els.problemType.textContent = "九九あなうめ";
  els.problemTitle.textContent = "かくれた数を見つけよう";
  const meta = {
    0: {
      seq: 0,
      step:
        problem.missingSide === "left"
          ? `${problem.product} ÷ ${problem.right} を考えます。${problem.right}の段で${problem.product}になる数を探そう。`
          : `${problem.product} ÷ ${problem.left} を考えます。${problem.left}の段で${problem.product}になる数を探そう。`,
      carry:
        problem.missingSide === "left"
          ? `${problem.right} × 何 = ${problem.product} かな。`
          : `${problem.left} × 何 = ${problem.product} かな。`,
    },
  };
  const inputHtml = inputGroup("かくれた数", problem.missing, meta).replace(
    "<input ",
    `<input data-product="${problem.product}" data-shown="${problem.shown}" data-side="${problem.missingSide}" `,
  );
  const leftHtml =
    problem.missingSide === "left" ? inputHtml : `<span class="fill-number">${problem.left}</span>`;
  const rightHtml =
    problem.missingSide === "right" ? inputHtml : `<span class="fill-number">${problem.right}</span>`;

  els.problemArea.innerHTML = `
    <div class="guided-layout fill-layout">
      <div class="paper-board fill-board" data-kind="multiplyFill">
        <div class="fill-badge">九九さがし</div>
        <div class="fill-equation" aria-label="九九あなうめ問題">
          ${leftHtml}
          <span class="fill-operator">×</span>
          ${rightHtml}
          <span class="fill-operator">=</span>
          <span class="fill-product">${problem.product}</span>
        </div>
        <div class="fill-reward-hint">
          <span>1問クリアでコイン</span>
          <strong>3れんぞくでボーナス</strong>
        </div>
      </div>
      ${guidePanelHtml()}
    </div>
  `;
  wireInputFlow();
}

function renderDivide(problem) {
  els.problemType.textContent = problem.autoName ? `おまかせ: ${problem.autoName}` : "わり算";
  els.problemTitle.textContent = `${problem.dividend} ÷ ${problem.divisor} の筆算`;
  const width = String(problem.dividend).length;
  const work = divideWork(problem, width);

  els.problemArea.innerHTML = `
    <div class="guided-layout division-layout ${width >= 6 ? "wide-division-layout" : ""}">
      <div class="paper-board division-board ${width >= 6 ? "wide-division" : ""}" data-kind="divide">
        <div class="division-top">
          <span>${problem.divisor}</span>
          <div class="division-work" style="--cols: ${width}">
            ${inputDigitLine("商", work.quotientText, width, work.quotientMetas, "guided-row quotient-row")}
            <div class="division-symbol">${digitLine(problem.dividend, width)}</div>
          </div>
        </div>
        <div class="division-steps" style="--cols: ${width}">
          ${work.rows
            .map((row) => {
              if (row.line) return '<div class="division-subtract-line"></div>';
              if (row.carryLine) {
                return `<div class="division-work-row division-carry-work-row" data-label="${row.label}">${carryLine(
                  row.name,
                  width,
                  row.metas,
                )}</div>`;
              }
              return `<div class="division-work-row" data-label="${row.label}">${inputDigitLine(
                row.name,
                row.text,
                width,
                row.metas,
                `guided-row ${row.className}`,
              )}</div>`;
            })
            .join("")}
        </div>
      </div>
      ${guidePanelHtml()}
    </div>
  `;
  wireInputFlow();
}
function divideWork(problem, width) {
  const digits = String(problem.dividend).split("").map(Number);
  const quotientCells = Array.from({ length: width }, () => " ");
  const quotientMetas = {};
  const rows = [];
  let current = 0;
  let seq = 0;
  let started = false;

  digits.forEach((digit, index) => {
    current = current * 10 + digit;

    if (!started && current < problem.divisor && index < digits.length - 1) {
      return;
    }

    started = true;
    const quotientDigit = Math.floor(current / problem.divisor);
    const product = quotientDigit * problem.divisor;
    const remainder = current - product;
    quotientCells[index] = String(quotientDigit);
    quotientMetas[index] = {
      step: `${current}に${problem.divisor}は何回入るかな。`,
      carry: "上に入れたら、次はかけ算です。",
      seq,
    };
    seq += 1;

    const productMultiplyMemo = divisionMultiplyMemoHtml(problem.divisor, quotientDigit);
    const productWork = divisionProductWork(problem.divisor, quotientDigit, width, index, seq, productMultiplyMemo);
    seq = productWork.seq;
    if (Object.keys(productWork.carryMetas).length > 0) {
      rows.push({
        label: "上に書く数",
        name: "かけ算の繰り上がり",
        text: "",
        metas: productWork.carryMetas,
        className: "division-product-carry-row",
        carryLine: true,
      });
    }
    rows.push({
      label: "かける",
      name: "かけ戻した数",
      text: productWork.productText,
      metas: productWork.productMetas,
      className: "division-product-row",
    });
    rows.push({ line: true });

    const hasNextDigit = index < digits.length - 1;
    const nextCurrent = hasNextDigit ? remainder * 10 + digits[index + 1] : remainder;
    const remainderText = alignedText(remainder, width, index);
    const combinedRemainderText = hasNextDigit ? alignedText(nextCurrent, width, index + 1) : remainderText;
    const remainderMetas = {};
    remainderText
      .split("")
      .map((char, cellIndex) => ({ char, cellIndex }))
      .filter((cell) => cell.char !== " ")
      .reverse()
      .forEach(({ cellIndex }) => {
        remainderMetas[cellIndex] = {
          step: `${current}から下の数をひこう。`,
          carry: hasNextDigit
            ? "できたら、次の数字をおろします。"
            : remainder < problem.divisor
              ? "あまりは小さいかな。"
              : "あまりが大きすぎないかな。",
          seq,
        };
        seq += 1;
      });
    if (hasNextDigit) {
      combinedRemainderText.split("").forEach((char, cellIndex) => {
        if (char !== " " && !remainderMetas[cellIndex]) {
          remainderMetas[cellIndex] = {
            step: "次の数字をおろそう。",
            carry: `次も、${problem.divisor}が何回入るか考えます。`,
            seq,
          };
          seq += 1;
        }
      });
    }
    rows.push({
      label: "ひく",
      name: hasNextDigit ? "引いておろした数" : "あまり",
      text: combinedRemainderText,
      metas: remainderMetas,
      className: hasNextDigit ? "division-remainder-row" : "division-final-row",
    });

    current = remainder;
  });

  return {
    quotientText: quotientCells.join(""),
    quotientMetas,
    rows,
  };
}

function guidePanelHtml() {
  return `
    <aside class="step-guide" aria-live="polite">
      <p class="eyebrow">いま考えるところ</p>
      <h3 id="stepTitle">オレンジのマスだけ入れよう</h3>
      <p id="stepText"></p>
      <div id="multiplyAssistMemo" class="division-multiply-assist" hidden></div>
      <div class="step-meter"><span id="stepMeter"></span></div>
    </aside>
  `;
}

function collectSteps() {
  state.steps = [...els.problemArea.querySelectorAll(".digit-input")].sort(
    (a, b) => Number(a.dataset.seq) - Number(b.dataset.seq),
  );
}

function useCoarsePointer() {
  return window.matchMedia?.("(pointer: coarse)")?.matches;
}

function useTouchKeypadOnly() {
  return useCoarsePointer() || window.innerWidth <= 699;
}

function focusActiveInput(input) {
  if (!input) return;
  if (useTouchKeypadOnly()) {
    input.blur();
    return;
  }
  input.focus();
}

function activateCurrentStep() {
  const inputs = state.steps;
  const keypadOnly = useTouchKeypadOnly();
  clearAssistHighlights();
  inputs.forEach((input, index) => {
    const isDone = index < state.stepIndex;
    const isCurrent = index === state.stepIndex;
    input.disabled = keypadOnly ? true : !isCurrent && !isDone;
    input.readOnly = keypadOnly;
    input.inputMode = keypadOnly ? "none" : "numeric";
    input.setAttribute("inputmode", keypadOnly ? "none" : "numeric");
    if (keypadOnly) {
      input.setAttribute("readonly", "readonly");
    } else {
      input.removeAttribute("readonly");
    }
    input.tabIndex = keypadOnly || isDone ? -1 : 0;
    input.setAttribute("aria-disabled", keypadOnly ? "true" : String(!isCurrent && !isDone));
    input.classList.toggle("active", isCurrent);
    input.classList.toggle("locked", !isCurrent && !isDone);
    input.classList.toggle("keypad-only", keypadOnly);
  });

  const current = inputs[state.stepIndex];
  const title = document.querySelector("#stepTitle");
  const text = document.querySelector("#stepText");
  const carry = document.querySelector("#carryText");
  const multiplyMemo = document.querySelector("#multiplyAssistMemo");
  const meter = document.querySelector("#stepMeter");

  if (!current) {
    if (title) title.textContent = "完成です";
    if (text) text.textContent = "最後まで順番にできました。";
    if (carry) carry.textContent = "よく見直してから次の問題へ進みます。";
    if (multiplyMemo) {
      multiplyMemo.hidden = true;
      multiplyMemo.innerHTML = "";
    }
    if (meter) meter.style.width = "100%";
    completeProblem();
    return;
  }

  focusActiveInput(current);
  const guide = guideForInput(current);
  if (title) title.textContent = `ステップ ${state.stepIndex + 1} / ${inputs.length}`;
  if (text) text.textContent = guide.text;
  if (carry) carry.textContent = guide.carry;
  if (multiplyMemo) {
    const memo = current.dataset.multiplyMemo || "";
    multiplyMemo.hidden = !memo;
    multiplyMemo.innerHTML = memo;
  }
  if (meter) meter.style.width = `${(state.stepIndex / inputs.length) * 100}%`;
}

function enterDigit(digit) {
  const current = state.steps[state.stepIndex];
  if (!current) return;
  current.value = String(digit).replace(/\D/g, "").slice(0, 1);
  current.classList.remove("correct", "wrong");
  if (current.value) checkCurrentStep();
}

function enterDigits(rawDigits) {
  const digits = String(rawDigits).replace(/\D/g, "");
  for (const digit of digits) {
    const beforeStep = state.stepIndex;
    enterDigit(digit);
    if (state.stepIndex === beforeStep) break;
  }
}

function clearAssistHighlights() {
  els.problemArea?.querySelectorAll(".assist-focus, .assist-source, .mistake-shake").forEach((element) => {
    element.classList.remove("assist-focus", "assist-source", "mistake-shake");
  });
  els.hintButton?.classList.remove("hint-pulse");
}

function highlightRelatedNumbers(input) {
  const board = input.closest(".paper-board");
  const currentRow = input.closest(".calc-row, .division-work-row");
  const currentCell = input.closest(".digit-cell");

  currentRow?.classList.add("assist-focus");
  currentCell?.classList.add("assist-focus");

  if (!board) return;
  if (board.dataset.kind === "multiplyFill") {
    board.querySelector(".fill-equation")?.classList.add("assist-source");
    return;
  }
  if (board.dataset.kind === "multiply") {
    board.querySelector(".calc-row")?.classList.add("assist-source");
    board.querySelector(".operator-row")?.classList.add("assist-source");
    return;
  }

  board.querySelector(".division-top")?.classList.add("assist-source");
  if (input.closest(".division-product-row")) {
    board.querySelector(".quotient-row")?.classList.add("assist-source");
  }
  if (input.closest(".division-remainder-row, .division-final-row")) {
    input.closest(".division-work-row")?.previousElementSibling?.classList.add("assist-source");
  }
}

function mistakeFeedbackFor(input, stepMistakes) {
  const guide = guideForInput(input);
  if (stepMistakes === 1) {
    return "ここだけもう一度。クリアは続けられます。同じマスでもう一回考えよう。";
  }
  if (stepMistakes === 2) {
    return `${guide.text} 光っている行の数字を見て、同じ位を指で追ってみよう。`;
  }
  return "ヒントを見ても大丈夫。答えは出さずに、考える場所だけ確認しよう。";
}
function applyMistakeAssist(input) {
  const stepMistakes = Number(input.dataset.mistakes || 0) + 1;
  input.dataset.mistakes = String(stepMistakes);
  state.problemMistakes += 1;
  input.classList.add("wrong", "mistake-shake");
  window.setTimeout(() => input.classList.remove("mistake-shake"), 360);
  setCharacterMood(stepMistakes >= 3 ? "thinking" : "cheer", 2400);
  recordWeakness(input);
  clearAssistHighlights();

  if (stepMistakes >= 2) {
    highlightRelatedNumbers(input);
  }
  if (stepMistakes >= 3) {
    els.hintButton?.classList.add("hint-pulse");
  }

  const title = document.querySelector("#stepTitle");
  const carry = document.querySelector("#carryText");
  if (title && stepMistakes >= 2) title.textContent = "見るところをしぼろう";
  if (carry && stepMistakes >= 3) carry.textContent = guideForInput(input).carry;

  els.feedback.textContent = mistakeFeedbackFor(input, stepMistakes);
  els.feedback.className = "feedback try";
  updateCompanion("mistake");
  if (useTouchKeypadOnly()) {
    input.blur();
  } else if (useCoarsePointer()) {
    try {
      input.setSelectionRange(input.value.length, input.value.length);
    } catch (error) {
      input.blur();
    }
  } else {
    input.select();
  }
}

function recordWeakness(input) {
  const label =
    input?.dataset?.label ||
    input?.closest?.(".division-work-row")?.dataset?.label ||
    (state.problem?.kind === "divide" ? "わり算" : state.problem?.kind === "multiplyFill" ? "九九あなうめ" : "かけ算");
  state.weak[label] = Number(state.weak[label] || 0) + 1;
}

function wireInputFlow() {
  state.steps = [...els.problemArea.querySelectorAll(".digit-input")];
  state.steps.forEach((input) => {
    input.addEventListener("focus", () => {
      if (useTouchKeypadOnly()) {
        input.blur();
        return;
      }
      if (!input.classList.contains("active")) {
        focusActiveInput(state.steps[state.stepIndex]);
      }
    });
    input.addEventListener("beforeinput", (event) => {
      if (event.inputType === "insertText" && /^\d$/.test(event.data || "")) {
        event.preventDefault();
        enterDigit(event.data);
      }
    });
    input.addEventListener("input", () => {
      if (!input.classList.contains("active")) {
        const digits = input.value.replace(/\D/g, "");
        const extraDigits = input.classList.contains("correct") && digits.startsWith(input.dataset.answer)
          ? digits.slice(String(input.dataset.answer).length)
          : digits;
        input.value = input.classList.contains("correct") ? input.dataset.answer : "";
        if (extraDigits) {
          enterDigits(extraDigits);
        } else {
          focusActiveInput(state.steps[state.stepIndex]);
        }
        return;
      }
      enterDigits(input.value);
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") checkCurrentStep();
    });
    const keepNativeKeyboardClosed = (event) => {
      if (!useTouchKeypadOnly()) return;
      event.preventDefault();
      input.blur();
    };
    input.addEventListener("pointerdown", keepNativeKeyboardClosed);
    input.addEventListener("touchstart", keepNativeKeyboardClosed, { passive: false });
  });
}

function checkCurrentStep() {
  const input = state.steps[state.stepIndex];
  if (!input) return;

  if (!input.value) {
    els.feedback.textContent = "オレンジのマスに数字を入れてみよう。";
    els.feedback.className = "feedback try";
    focusActiveInput(input);
    return;
  }

  if (input.value === input.dataset.answer) {
    markInputCellSolved(input);
    input.classList.add("correct");
    input.classList.remove("wrong", "active");
    input.disabled = true;
    els.feedback.textContent = input.closest(".fill-equation")
      ? "見つけました。コインへ一歩近づきました。"
      : input.classList.contains("carry-input")
        ? "繰り上がりを書けました。次の計算に足します。"
        : "いいです。次のオレンジのマスへ進みます。";
    els.feedback.className = "feedback good";
    state.stepIndex += 1;
    activateCurrentStep();
    return;
  }

  applyMistakeAssist(input);
}

function checkAnswers() {
  checkCurrentStep();
}

function scheduleNextProblem(delay = NEXT_PROBLEM_DELAY) {
  window.clearTimeout(scheduleNextProblem.timer);
  scheduleNextProblem.timer = window.setTimeout(() => {
    renderProblem();
  }, delay);
}

function completeProblem() {
  if (state.completed || !state.problem) return;
  state.completed = true;
  let nextDelay = NEXT_PROBLEM_DELAY;

  try {
    const cleanClear = state.problemMistakes === 0 && !state.answerShown;
    const comboHit = cleanClear && (state.streak + 1) % 3 === 0;
    let earnedCoins = coinsForCompletedProblem(comboHit);
    const treasure = updateTreasureProgress();
    if (treasure.opened) earnedCoins += treasure.bonus;

    const backgroundReward = advanceBackgroundQuest();
    const nextStage = updateAutoStageProgress(cleanClear);
    if (nextStage) earnedCoins += STAGE_UP_BONUS;

    state.streak = cleanClear ? state.streak + 1 : 0;
    state.stars = Number(state.stars || 0) + 3;
    state.coins = Number(state.coins || 0) + earnedCoins;
    state.solvedToday = Number(state.solvedToday || 0) + 1;

    const kind = state.problem.kind || "multiply";
    if (kind === "multiplyFill") {
      state.stickers.fill = Number(state.stickers.fill || 0) + 1;
    } else if (kind === "divide") {
      state.stickers.divide = Number(state.stickers.divide || 0) + 1;
    } else {
      state.stickers.multiply = Number(state.stickers.multiply || 0) + 1;
    }

    state.lastPraise = praiseForCompletedProblem(comboHit);
    state.history.unshift({
      title: els.problemTitle?.textContent || courseDisplayName(),
      kind,
      mistakes: state.problemMistakes,
      coins: earnedCoins,
      at: new Date().toISOString(),
    });
    state.history = state.history.slice(0, 30);

    saveProgress();
    celebrate();
    setCharacterMood("happy", 2400);
    if (nextStage) showStageUpParty(nextStage, STAGE_UP_BONUS);

    const extras = [];
    if (comboHit) extras.push("フィーバーボーナス");
    if (treasure.opened) extras.push(`宝箱+${treasure.bonus}`);
    if (backgroundReward) extras.push(`背景「${backgroundReward.background.name}」`);
    if (nextStage) extras.push("ステージアップ");

    els.feedback.textContent = `${state.lastPraise} ${earnedCoins}コインをゲット。${extras.length ? extras.join(" / ") : "つぎの問題へ進みます。"}`;
    els.feedback.className = "feedback good";
    try {
      updateProgress();
      showRewardToast({
        coins: earnedCoins,
        comboHit,
        treasure,
        backgroundReward,
        nextStage,
      });
      showCompletionRewardEffects({ treasure, backgroundReward, nextStage });
    } catch (error) {
      console.error(error);
    }
    nextDelay = backgroundReward
      ? BACKGROUND_REWARD_DELAY
      : nextStage
        ? STAGE_UP_PROBLEM_DELAY
        : treasure.opened
          ? REWARD_PROBLEM_DELAY
          : NEXT_PROBLEM_DELAY;
  } catch (error) {
    console.error(error);
    els.feedback.textContent = "完成です。つぎの問題へ進みます。";
    els.feedback.className = "feedback good";
  } finally {
    scheduleNextProblem(nextDelay);
  }
}

function praiseForCompletedProblem(comboHit = false) {
  const problem = state.problem;
  const hasCarry = state.steps.some((input) => input.classList.contains("carry-input"));
  const noHint = state.hintLevel === 0;
  const noMiss = state.problemMistakes === 0 && !state.answerShown;
  const longProblem = isChallengeProblem(problem);

  if (!problem) return "完成。最後まで順番に追えました。";
  if (state.answerShown) return "答えを見ながら最後まで確認できました。次は同じ順番で自分で進めよう。";
  if (!noMiss) return "間違いを直して最後まで完成できました。やり直す力も大事です。";
  if (problem.kind === "multiplyFill") return comboHit ? "九九あなうめを連続で見つけました。" : "かくれた数を見つけられました。";
  if (problem.kind === "divide") return "商、かける、ひく、おろすを順番に進められました。";
  if (hasCarry) return "くり上がりも使って、筆算をていねいに進められました。";
  if (noHint && longProblem) return "ノーヒントで大きな数を最後まで進められました。";
  return "完成。計算の順番をよく追えました。";
}
function showHint() {
  const current = state.steps[state.stepIndex];
  if (!current) return;
  setCharacterMood("thinking", 2600);
  state.hintLevel += 1;
  if (state.hintLevel === 1) {
    els.feedback.textContent =
      state.problem?.kind === "multiplyFill"
        ? "答えはまだ見せません。右の説明を読んで、何の段かを見つけよう。"
        : "まず、右の説明を声に出して読んでみよう。";
  } else if (state.hintLevel === 2) {
    els.feedback.textContent = guideForInput(current).carry || "オレンジのマスを見て、順番に考えよう。";
  } else {
    els.feedback.textContent = "同じ位を指で追って、もう一度考えてみよう。確認したい時は答えを見るを使えます。";
  }
  els.feedback.className = "feedback try";
  focusActiveInput(current);
}

function showAnswer() {
  setCharacterMood("thinking", 2600);
  state.answerShown = true;
  state.problemMistakes += 1;
  state.steps.forEach((input) => {
    input.value = input.dataset.answer;
    markInputCellSolved(input);
    input.disabled = true;
    input.classList.add("correct");
    input.classList.remove("wrong", "active", "locked");
  });
  state.stepIndex = state.steps.length;
  const title = document.querySelector("#stepTitle");
  const text = document.querySelector("#stepText");
  const carry = document.querySelector("#carryText");
  const meter = document.querySelector("#stepMeter");
  const multiplyMemo = document.querySelector("#multiplyAssistMemo");
  if (title) title.textContent = "答えを表示しました";
  if (text) text.textContent = "次の問題では、オレンジの順番どおりに自分で入れてみよう。";
  if (carry) carry.textContent = "答えを見るのも大事な練習です。";
  if (multiplyMemo) {
    multiplyMemo.hidden = true;
    multiplyMemo.innerHTML = "";
  }
  if (meter) meter.style.width = "100%";
  els.feedback.textContent = "答えを見ました。次は同じ順番でやってみよう。";
  els.feedback.className = "feedback";
}

function markInputCellSolved(input) {
  const cell = input.closest(".digit-cell");
  if (!cell) return;
  cell.dataset.value = input.dataset.answer || input.value || "";
  if (input.classList.contains("carry-input")) {
    cell.classList.add("carry-solved-cell");
    return;
  }
  cell.classList.add("solved-cell");
}
function saveProgress() {
  localStorage.setItem("hp_streak", state.streak);
  localStorage.setItem("hp_stars", state.stars);
  localStorage.setItem("hp_coins", state.coins);
  localStorage.setItem(todayKey(), state.solvedToday);
  localStorage.setItem("hp_settings", JSON.stringify(state.settings));
  localStorage.setItem("hp_history", JSON.stringify(state.history));
  localStorage.setItem("hp_weak", JSON.stringify(state.weak));
  localStorage.setItem("hp_rewards", JSON.stringify(state.rewards));
  localStorage.setItem("hp_stickers", JSON.stringify(state.stickers));
  localStorage.setItem("hp_gacha_collection", JSON.stringify(state.gachaCollection));
  localStorage.setItem("hp_gacha_fragments", state.gachaFragments);
  localStorage.setItem("hp_selected_companion", state.selectedCompanion);
  localStorage.setItem("hp_reward_filter", state.rewardFilter);
  localStorage.setItem("hp_reward_tab", state.rewardTab);
  localStorage.setItem("hp_treasure_progress", state.treasureProgress);
  localStorage.setItem("hp_auto_progress", JSON.stringify(state.autoProgress));
  localStorage.setItem("hp_background_quest", JSON.stringify(state.backgroundQuest));
}

function renderParentDashboard() {
  const goal = Number(state.settings.dailyGoal || 3);
  const solvedToday = Number(state.solvedToday || 0);
  const solvedTotal = state.history.length || Math.floor(Number(state.stars || 0) / 3);
  const left = Math.max(0, goal - solvedToday);
  const focusLabels = {
    all: "ぜんぶ",
    multiply: "かけ算",
    divide: "わり算",
  };
  const weak = topWeakness();

  if (els.parentSolvedToday) els.parentSolvedToday.textContent = `${solvedToday} / ${goal}`;
  if (els.parentGoalText) {
    els.parentGoalText.textContent = left > 0 ? `今日の目標まで、あと${left}問。` : "今日の目標を達成しました。";
  }
  if (els.parentTotalSolved) els.parentTotalSolved.textContent = `${solvedTotal}問`;
  if (els.parentStreak) els.parentStreak.textContent = state.streak;
  if (els.parentFocusText) els.parentFocusText.textContent = focusLabels[state.settings.focus] || "ぜんぶ";
  if (els.parentWeakPointText) {
    els.parentWeakPointText.textContent = weak
      ? `いまは「${weak[0]}」を多めに見るとよさそうです。`
      : "まだ苦手記録はありません。";
  }
  if (els.parentWeakList) {
    const weakItems = Object.entries(state.weak || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    els.parentWeakList.innerHTML = weakItems.length
      ? weakItems.map(([label, count]) => `<span>${escapeHtml(label)} ${count}回</span>`).join("")
      : "<span>まだ記録なし</span>";
  }
  if (els.parentReviewButton) els.parentReviewButton.disabled = !weak;
  renderHistory();
}

function renderHistory() {
  if (!els.historyList) return;
  const items = (state.history || []).slice(0, 8);
  els.historyList.innerHTML = items.length
    ? items
        .map((item) => {
          const kind = item.kind === "divide" ? "わり算" : item.kind === "multiplyFill" ? "九九あなうめ" : "かけ算";
          const title = item.title || kind;
          const result = item.mistakes ? `ミス${item.mistakes}` : "ノーミス";
          return `<div class="history-item"><strong>${escapeHtml(title)}</strong><span>${kind} / ${result}</span></div>`;
        })
        .join("")
    : '<p class="mini-copy">まだ記録はありません。</p>';
}

function topWeakness() {
  const entries = Object.entries(state.weak || {}).filter(([, count]) => Number(count) > 0);
  if (entries.length === 0) return null;
  return entries.sort((a, b) => Number(b[1]) - Number(a[1]))[0];
}

function updateProgress() {
  els.streak.textContent = state.streak;
  els.stars.textContent = state.coins;
  const solvedTotal = Math.floor(state.stars / 3);
  if (els.rankTitle) els.rankTitle.textContent = rankFor(solvedTotal).name;
  const coin = coinProgress();
  if (els.missionProgress) {
    els.missionProgress.style.width = `${coin.ready > 0 ? 100 : Math.max(8, coin.percent)}%`;
  }
  const missionText = document.querySelector("#missionText");
  if (missionText) {
    missionText.textContent =
      coin.ready > 0 ? `ガチャを${coin.ready}回まわせます。いまがチャンス。` : `あと${coin.need}コインでガチャ。まずは1問進めよう。`;
  }
  if (els.homeCoinText) els.homeCoinText.textContent = `${state.coins}コイン`;
  if (els.homeGachaText) {
    els.homeGachaText.textContent =
      coin.ready > 0
        ? `いま${coin.ready}回ガチャをまわせます。新しい仲間を見に行こう。`
        : `あと${coin.need}コイン。${gachaProblemEstimate(coin)}でガチャが近づきます。`;
  }
  els.badgeList.innerHTML =
    coin.ready > 0 ? '<span class="badge">ガチャOK</span>' : '<span class="badge">あと' + coin.need + 'コイン</span>';
  updateComboPanel();
  updatePlayRewardPanel();
  updateStageStatusPanel();
  updateBackgroundQuestUi();
  renderParentDashboard();
  updateCompanion();
}

function updateBackgroundQuestUi() {
  const selected = selectedBackgroundInfo();
  const next = nextBackgroundQuestInfo();
  if (els.heroPanel) {
    els.heroPanel.style.setProperty("--home-bg", `url("${selected.background.image}")`);
    els.heroPanel.classList.add("has-quest-bg");
    BACKGROUND_FRAMES.forEach((frame) => els.heroPanel.classList.remove(frame.className));
    els.heroPanel.classList.add(selected.frame.className);
  }
  if (els.homeJourneyTitle) els.homeJourneyTitle.textContent = next.complete ? "背景コンプリート" : `背景まであと${next.left}問`;
  if (els.homeJourneyText) {
    els.homeJourneyText.textContent = next.complete
      ? `全${BACKGROUND_REWARDS.length}背景とフレームを集めました。好きな背景を選べます。`
      : `九九あなうめを進めると、ホームが新しい景色に変わります。`;
  }
  if (els.homeJourneyProgress) els.homeJourneyProgress.style.width = `${next.complete ? 100 : Math.max(4, next.progress)}%`;
}

function updateComboPanel() {
  const combo = state.streak % 3;
  const fever = state.streak > 0 && combo === 0;
  const remaining = combo === 0 ? 3 : 3 - combo;
  if (els.comboProgress) els.comboProgress.style.width = `${(fever ? 1 : combo / 3) * 100}%`;
  if (els.comboText) els.comboText.textContent = fever ? `${state.streak}れんぞく。フィーバー中` : `あと${remaining}問で宝箱チャンス`;
  if (els.comboPanel) els.comboPanel.classList.toggle("fever", fever);
}

function updatePlayRewardPanel() {
  if (!els.playRewardTitle || !els.playRewardText || !els.playRewardProgress) return;
  const goal = nextRewardGoalInfo();
  const panel = document.querySelector(".play-reward-panel");
  panel?.classList.remove("is-gacha-ready", "is-background", "is-treasure");
  panel?.classList.add(goal.className);
  els.playRewardTitle.textContent = goal.title;
  els.playRewardText.textContent = goal.text;
  els.playRewardProgress.style.width = `${Math.max(8, goal.progress)}%`;
}

function updateStageStatusPanel() {
  const coin = coinProgress();
  const treasure = treasureProgressInfo();
  if (els.activeCourseTitle) els.activeCourseTitle.textContent = selectedCourseName();
  if (els.currentStageName) {
    els.currentStageName.textContent =
      state.course === "autoAdventure" || state.mode === "auto" ? `${courseDisplayName()} / ${autoStageProgressText()}` : courseDisplayName();
  }
  if (els.treasureGoalText) {
    els.treasureGoalText.textContent = treasure.left === 1 ? "あと1問で宝箱" : `あと${treasure.left}問で宝箱`;
  }
  if (els.stageCoinGoalText) els.stageCoinGoalText.textContent = coin.ready > 0 ? `ガチャ${coin.ready}回` : `あと${coin.need}コイン`;
}
function celebrate() {
  els.celebration.innerHTML = "";
  for (let i = 0; i < 24; i += 1) {
    const spark = document.createElement("span");
    spark.className = "spark";
    spark.style.left = `${randomInt(6, 94)}vw`;
    spark.style.animationDelay = `${randomInt(0, 220)}ms`;
    els.celebration.appendChild(spark);
  }
  window.setTimeout(() => {
    els.celebration.innerHTML = "";
  }, 1200);
}

function showStageUpParty(stage, bonus = STAGE_UP_BONUS) {
  if (!els.stageUpOverlay || !stage) return;
  if (els.stageUpTitle) els.stageUpTitle.textContent = `${stage.name}へ！`;
  if (els.stageUpText) els.stageUpText.textContent = "新しい問題に挑戦できます。ステージアップボーナスもゲット。";
  if (els.stageUpBonus) els.stageUpBonus.textContent = `+${bonus}コイン`;
  els.stageUpOverlay.classList.add("show");
  els.stageUpOverlay.setAttribute("aria-hidden", "false");

  window.clearTimeout(showStageUpParty.timer);
  showStageUpParty.timer = window.setTimeout(() => {
    els.stageUpOverlay.classList.remove("show");
    els.stageUpOverlay.setAttribute("aria-hidden", "true");
  }, 2600);
}

function showRewardToast({ coins = 0, comboHit = false, treasure = {}, backgroundReward = null, nextStage = null } = {}) {
  if (!els.rewardToast || !els.rewardToastTitle || !els.rewardToastText || !els.rewardToastPrize) return;
  const coin = coinProgress();
  const nextGoal = nextRewardGoalInfo();
  const type = backgroundReward ? "background" : treasure.opened ? "treasure" : coin.ready > 0 ? "gacha-ready" : "coin";
  const prizeLabel = backgroundReward ? "景" : treasure.opened ? "宝" : coin.ready > 0 ? "玉" : "コ";
  const title = backgroundReward
    ? `背景「${backgroundReward.background.name}」をゲット`
    : treasure.opened
      ? `宝箱から${treasure.bonus}コイン`
      : coin.ready > 0
        ? "ガチャをまわせます"
        : `${coins}コインをゲット`;
  const extras = [];
  if (comboHit) extras.push("宝箱チャンス");
  if (nextStage) extras.push("ステージアップ");
  const text = backgroundReward
    ? "ホームに新しい景色が増えました。あとでコレクションから選べます。"
    : coin.ready > 0
      ? `新しい仲間に会いに行けます。${extras.join(" / ")}`
      : `${nextGoal.title}。${extras.length ? extras.join(" / ") : nextGoal.text}`;

  els.rewardToast.className = `reward-toast show ${type}`;
  els.rewardToast.setAttribute("aria-hidden", "false");
  els.rewardToastPrize.innerHTML = `<span>${escapeHtml(prizeLabel)}</span>`;
  els.rewardToastTitle.textContent = title;
  els.rewardToastText.textContent = text.trim();
  if (els.rewardToastRoad) els.rewardToastRoad.style.width = `${Math.max(8, nextGoal.progress)}%`;

  window.clearTimeout(showRewardToast.timer);
  showRewardToast.timer = window.setTimeout(() => {
    els.rewardToast.classList.remove("show");
    els.rewardToast.setAttribute("aria-hidden", "true");
  }, backgroundReward ? 3200 : treasure.opened || coin.ready > 0 ? 2300 : 1550);
}

function showRewardSpotlight({ type = "treasure", title = "", text = "", label = "ごほうび発見", visual = "宝", image = "" } = {}) {
  if (!els.rewardSpotlight || !els.rewardSpotlightVisual || !els.rewardSpotlightTitle || !els.rewardSpotlightText) return;
  els.rewardSpotlight.className = `reward-spotlight show ${type}`;
  els.rewardSpotlight.setAttribute("aria-hidden", "false");
  if (els.rewardSpotlightLabel) els.rewardSpotlightLabel.textContent = label;
  els.rewardSpotlightTitle.textContent = title;
  els.rewardSpotlightText.textContent = text;
  els.rewardSpotlightVisual.innerHTML = image
    ? `<span class="spotlight-image" style="background-image:url('${escapeHtml(image)}')"></span>`
    : `<span>${escapeHtml(visual)}</span>`;

  window.clearTimeout(showRewardSpotlight.timer);
  showRewardSpotlight.timer = window.setTimeout(() => {
    els.rewardSpotlight.classList.remove("show");
    els.rewardSpotlight.setAttribute("aria-hidden", "true");
  }, type === "background" ? 2600 : 2100);
}

function showCompletionRewardEffects({ treasure = {}, backgroundReward = null, nextStage = null } = {}) {
  if (backgroundReward) {
    showRewardSpotlight({
      type: "background",
      label: "50問クリア",
      title: `${backgroundReward.background.name}をゲット！`,
      text: `${backgroundReward.frame.name}フレームでホームが変わりました。次の景色へ進もう。`,
      image: backgroundReward.background.image,
    });
    return;
  }
  if (treasure.opened) {
    showRewardSpotlight({
      type: "treasure",
      label: "宝箱オープン",
      title: `${treasure.bonus}コインを発見`,
      text: nextStage ? "ステージアップも近づきました。" : "また3問進むと宝箱チャンスです。",
      visual: "宝",
    });
  }
}

function markTutorialSeen() {
  localStorage.setItem("hp_tutorial_seen", "1");
}

function showTutorial(force = false) {
  if (!els.tutorialOverlay) return;
  if (!force && localStorage.getItem("hp_tutorial_seen") === "1") return;
  els.tutorialOverlay.classList.add("show");
  els.tutorialOverlay.setAttribute("aria-hidden", "false");
  setCharacterMood("cheer");
}

function hideTutorial({ start = false } = {}) {
  if (!els.tutorialOverlay) return;
  markTutorialSeen();
  els.tutorialOverlay.classList.remove("show");
  els.tutorialOverlay.setAttribute("aria-hidden", "true");
  setCharacterMood("main");
  if (start) {
    showView("challenge");
  }
}

function showGachaParty(prize) {
  if (!els.gachaParty || !prize) return;
  const symbols = [prize.icon, "星", "♪", "100", "コ", "光", "金", prize.duplicate ? "かけら" : "大当たり"];
  els.gachaParty.className = `gacha-party-overlay show rarity-${prize.rarity}`;
  els.gachaParty.innerHTML = `
    <div class="party-burst"></div>
    <div class="party-rainbow"></div>
    <div class="party-prize" data-rarity="${escapeHtml(prize.rarity)}">
      ${prizeVisualHtml(prize)}
      <strong>${escapeHtml(prize.duplicate ? "かけらゲット" : prize.name)}</strong>
      <small>${escapeHtml(rarityLabel(prize.rarity))} / ${escapeHtml(prize.duplicate ? `${prize.fragmentsEarned}かけら` : prize.kind)}</small>
    </div>
    ${Array.from({ length: prize.rarity === "UR" ? 78 : prize.rarity === "SR" ? 64 : 52 }, (_, index) => {
      const symbol = symbols[index % symbols.length];
      return `<span class="party-spark" style="--x:${randomInt(4, 96)}%; --delay:${randomInt(0, 420)}ms; --rot:${randomInt(-28, 28)}deg;">${escapeHtml(symbol)}</span>`;
    }).join("")}
  `;
  window.clearTimeout(showGachaParty.timer);
  showGachaParty.timer = window.setTimeout(() => {
    els.gachaParty.classList.remove("show");
  }, prize.rarity === "UR" ? 2600 : prize.rarity === "SR" ? 2300 : 2000);
  window.setTimeout(() => {
    if (!els.gachaParty.classList.contains("show")) {
      els.gachaParty.innerHTML = "";
      els.gachaParty.className = "gacha-party-overlay";
    }
  }, prize.rarity === "UR" ? 3050 : 2600);
}
function renderGachaUi() {
  const coin = coinProgress();
  const hasCoin = state.coins >= GACHA_COST;
  const canRoll = hasCoin && !state.gachaRolling;
  const gachaView = document.querySelector(".gacha-view");
  gachaView?.classList.toggle("has-ticket", hasCoin);
  gachaView?.classList.toggle("has-result", Boolean(state.lastGachaPrize));
  if (els.gachaCoinText) els.gachaCoinText.textContent = state.coins;
  if (els.gachaTicketText) els.gachaTicketText.textContent = `${coin.ready}回`;
  if (els.gachaNeedText) els.gachaNeedText.textContent = canRoll ? "OK" : `${coin.need}`;
  if (els.gachaProgressText) {
    els.gachaProgressText.textContent = hasCoin ? `いま${coin.ready}回まわせます` : `${gachaProblemEstimate(coin)}でチャンス / あと${coin.need}コイン`;
  }
  if (els.gachaProgress) els.gachaProgress.style.width = `${hasCoin ? 100 : Math.max(8, coin.percent)}%`;
  if (els.gachaButton) {
    els.gachaButton.disabled = !canRoll;
    els.gachaButton.textContent = state.gachaRolling ? "ガチャ演出中..." : canRoll ? "ガチャをまわす" : "コインが足りません";
  }
  if (els.gachaResultIcon && els.gachaResultTitle && els.gachaResultText) {
    document.querySelector(".gacha-result")?.classList.toggle("has-prize", Boolean(state.lastGachaPrize));
    if (state.lastGachaPrize) {
      els.gachaResultIcon.innerHTML = prizeVisualHtml(state.lastGachaPrize);
      if (els.gachaResultRarity) {
        els.gachaResultRarity.textContent = state.lastGachaPrize.rarity;
        els.gachaResultRarity.className = `rarity-badge rarity-${state.lastGachaPrize.rarity}`;
      }
      els.gachaResultTitle.textContent = state.lastGachaPrize.exchanged
        ? `${state.lastGachaPrize.name}を交換しました`
        : state.lastGachaPrize.duplicate
          ? "かけらゲット"
          : `${state.lastGachaPrize.name}をゲット`;
      els.gachaResultText.textContent = state.lastGachaPrize.duplicate
        ? `${state.lastGachaPrize.name}は持っています。${state.lastGachaPrize.fragmentsEarned}かけらになりました。`
        : `${rarityLabel(state.lastGachaPrize.rarity)}の${state.lastGachaPrize.kind}です。`;
    } else {
      els.gachaResultIcon.textContent = "?";
      if (els.gachaResultRarity) {
        els.gachaResultRarity.textContent = "";
        els.gachaResultRarity.className = "rarity-badge";
      }
      els.gachaResultTitle.textContent = "次の仲間が待っています";
      els.gachaResultText.textContent = "100コインためると、ガチャに挑戦できます。";
    }
  }
  if (els.gachaPrizePreview) {
    const target = nextCharacterGoal();
    const exchange = exchangeTargets().slice(0, 3);
    const targetCards = RARITY_ORDER.map((rarity) => {
      const prize = GACHA_PRIZES.find((item) => item.rarity === rarity && !ownedPrize(item)) || GACHA_PRIZES.find((item) => item.rarity === rarity);
      const owned = ownedPrize(prize);
      return `
        <div class="gacha-target-card ${owned ? "owned" : ""}" data-rarity="${escapeHtml(rarity)}">
          <span>${prizeVisualHtml(prize, !owned)}</span>
          <div><strong>${owned ? "出会い済み" : escapeHtml(rarityLabel(rarity))}</strong><small>${owned ? `${rarity}は集まり中` : "まだ見ぬ仲間"}</small></div>
        </div>
      `;
    }).join("");
    const exchangeHtml = exchange.length
      ? exchange
          .map(
            (prize) => `
              <div class="exchange-card ${prize.canExchange ? "ready" : ""}" data-rarity="${escapeHtml(prize.rarity)}">
                <span class="exchange-icon">${prizeVisualHtml(prize, true)}</span>
                <div><strong>${escapeHtml(rarityLabel(prize.rarity))}の仲間</strong><small>${prize.canExchange ? "交換できます" : `あと${prize.cost - state.gachaFragments}かけら`}</small></div>
                <button class="mini-action-button exchange-button" type="button" data-exchange="${prize.key}" ${prize.canExchange ? "" : "disabled"}>${prize.canExchange ? "交換" : prize.cost}</button>
              </div>
            `,
          )
          .join("")
      : '<p class="mini-copy">まだ見ぬ仲間はぜんぶ集まりました。</p>';
    const prizeCards = GACHA_PRIZES.slice(0, 12)
      .map((prize) => {
        const owned = ownedPrize(prize);
        return `
          <div class="gacha-prize-card ${owned ? "owned" : ""}" data-rarity="${escapeHtml(prize.rarity)}">
            <span class="prize-portrait">${prizeVisualHtml(prize, !owned)}</span>
            <strong>${owned ? escapeHtml(prize.name) : "？"}</strong>
            <small>${escapeHtml(rarityLabel(prize.rarity))}</small>
          </div>
        `;
      })
      .join("");
    els.gachaPrizePreview.innerHTML = `
      <section class="gacha-focus-panel">
        <div class="focus-prize" data-rarity="${escapeHtml(target?.rarity || "N")}">${target ? prizeVisualHtml(target, !ownedPrize(target)) : "★"}</div>
        <div>
          <p class="eyebrow">つぎに会いたい仲間</p>
          <h3>${target ? (ownedPrize(target) ? "コレクションを見に行こう" : `${rarityLabel(target.rarity)}の仲間をねらおう`) : "ぜんぶ集まりました"}</h3>
          <p>${target ? `かけらは${state.gachaFragments}こ。ガチャでも交換でも、少しずつ仲間が増えます。` : "すごい。今ある仲間はぜんぶ集まりました。"}</p>
          <div class="gacha-target-grid">${targetCards}</div>
        </div>
      </section>
      <section class="gacha-exchange-teaser">
        <div><p class="eyebrow">かけら交換</p><h3>ダブっても前に進む</h3><p>同じキャラはかけらになります。あと少しの仲間を交換できます。</p></div>
        <div class="exchange-card-grid">${exchangeHtml}</div>
      </section>
      <section class="gacha-prize-list">
        <div class="gacha-list-head"><h3>仲間ずかん</h3><button class="compact-button ghost-button" type="button" data-nav="rewards">ぜんぶ見る</button></div>
        <div class="gacha-prize-grid">${prizeCards}</div>
      </section>
    `;
  }
}
function rollGacha() {
  if (state.gachaRolling || state.coins < GACHA_COST) return;
  const prize = pickGachaPrize();
  const alreadyOwned = (state.gachaCollection[prize.key] || 0) > 0;
  const fragmentsEarned = alreadyOwned ? duplicateFragmentsFor(prize) : 0;
  const resultPrize = { ...prize, duplicate: alreadyOwned, fragmentsEarned };
  const gachaView = document.querySelector(".gacha-view");
  gachaView?.classList.add("rolling", `rarity-${prize.rarity}`);
  state.gachaRolling = true;
  state.coins -= GACHA_COST;
  if (alreadyOwned) {
    state.gachaFragments += fragmentsEarned;
  } else {
    state.gachaCollection[prize.key] = 1;
  }
  state.lastGachaPrize = resultPrize;
  saveProgress();
  updateProgress();
  celebrate();
  showGachaParty(resultPrize);
  setCharacterMood("happy", 1800);
  window.setTimeout(() => {
    gachaView?.classList.remove("rolling", "rarity-N", "rarity-R", "rarity-SR", "rarity-UR");
    state.gachaRolling = false;
    updateProgress();
  }, 700);
}

function updateCompanion(event = "") {
  const solvedTotal = Math.floor(state.stars / 3);
  const world = [...WORLDS].reverse().find((item) => solvedTotal >= item.target) || WORLDS[0];
  const nextWorld = WORLDS.find((item) => solvedTotal < item.target);
  const nextReward = REWARDS.find((reward) => solvedTotal < reward.at);
  const coin = coinProgress();
  renderGachaUi();

  if (els.mapView) {
    const stageImage = world.image || WORLDS[0].image;
    els.mapView.classList.toggle("has-stage-art", Boolean(stageImage));
    if (stageImage) els.mapView.style.setProperty("--stage-art", `url("${stageImage}")`);
  }
  if (els.mapTitle) els.mapTitle.textContent = world.name;
  if (els.homeStageName) els.homeStageName.textContent = world.name;
  if (els.homeStageText) els.homeStageText.textContent = world.text;
  if (els.mapStageNote) els.mapStageNote.textContent = `${world.name}を進行中。${world.text}`;
  if (els.mapCurrentPlace) els.mapCurrentPlace.textContent = world.name;
  if (els.mapCurrentText) els.mapCurrentText.textContent = world.text;
  if (els.mapNextPlace) els.mapNextPlace.textContent = nextWorld ? nextWorld.name : "まだ見ぬ場所";
  if (els.mapNextText) els.mapNextText.textContent = nextWorld ? `あと${nextWorld.target - solvedTotal}問で到着` : "これから追加予定です。";
  if (els.mapRewardName) els.mapRewardName.textContent = nextReward ? nextReward.name : "すべて集めました";
  if (els.mapRewardText) els.mapRewardText.textContent = nextReward ? `あと${nextReward.at - solvedTotal}問で開く` : "ごほうび部屋を見に行こう。";
  if (els.mapJourneyText || els.mapJourneyProgress) {
    const base = world.target;
    const end = nextWorld?.target || Math.max(world.target + 10, solvedTotal + 1);
    const current = Math.max(0, solvedTotal - base);
    const total = Math.max(1, end - base);
    const remaining = Math.max(end - solvedTotal, 0);
    if (els.mapJourneyText) els.mapJourneyText.textContent = nextWorld ? `${current} / ${total}マス進行中。あと${remaining}問で${nextWorld.name}` : `${world.name}を進行中。`;
    if (els.mapJourneyProgress) els.mapJourneyProgress.style.width = `${Math.max(8, Math.min(100, (current / total) * 100))}%`;
  }
  if (els.homeNextReward) els.homeNextReward.textContent = `${ownedPrizeCount()} / ${GACHA_PRIZES.length}こ`;
  if (els.homeRewardText) {
    const nextCharacter = nextCharacterGoal();
    els.homeRewardText.textContent = coin.ready > 0
      ? `ガチャを${coin.ready}回まわせます。新しい仲間に会いに行こう。`
      : nextCharacter
        ? `${gachaProblemEstimate(coin)}でガチャ。集めたかけらでも仲間に近づきます。`
        : `${gachaProblemEstimate(coin)}でガチャ。コレクションを見に行こう。`;
  }
  if (els.nextRewardText) {
    els.nextRewardText.textContent = `キャラ${ownedPrizeCount()} / ${GACHA_PRIZES.length}体、称号${titleBadgeCount()} / ${TITLE_BADGES.length}こ。`;
  }
  if (els.mapStages) {
    els.mapStages.innerHTML = WORLDS.map(
      (item) => `
        <div class="stage-card ${item.name === world.name ? "current" : solvedTotal >= item.target ? "cleared" : "locked"}">
          <span class="stage-icon">${item.icon}</span>
          <strong>${item.name}</strong>
          <span>${item.name === world.name ? "挑戦中" : solvedTotal >= item.target ? "到着" : `${item.target}問から`}</span>
        </div>
      `,
    ).join("");
  }
  if (els.mapTrail) {
    const pos = solvedTotal % 10;
    els.mapTrail.innerHTML = Array.from({ length: 10 }, (_, index) => {
      const stateClass = index < pos ? "passed" : index === pos ? "current" : "next";
      const tileIcon = index === pos ? "星" : index < pos ? world.icon : "";
      const runner = index === pos ? `<img class="map-runner" src="${CHARACTER_IMAGES.cheer}" alt="" />` : "";
      return `<span class="${stateClass}"><b><span class="map-tile-icon">${tileIcon}</span>${runner}</b><small>${index + 1}</small></span>`;
    }).join("");
  }
  if (els.rewardShelf) {
    const validTabs = ["characters", "backgrounds", "stickers", "titles"];
    const activeTab = validTabs.includes(state.rewardTab) ? state.rewardTab : "characters";
    const activeFilter = RARITY_ORDER.includes(state.rewardFilter) ? state.rewardFilter : "all";
    const filteredRewards = GACHA_PRIZES.filter((reward) => activeFilter === "all" || reward.rarity === activeFilter);
    const rewardTabHtml = [
      ["characters", "キャラ", `${ownedPrizeCount()}/${GACHA_PRIZES.length}`],
      ["backgrounds", "背景", `${state.backgroundQuest.unlockedStage}/${BACKGROUND_REWARDS.length * BACKGROUND_FRAMES.length}`],
      ["stickers", "シール", `${Object.values(state.stickers).reduce((sum, count) => sum + Number(count || 0), 0)}枚`],
      ["titles", "称号", `${titleBadgeCount()}/${TITLE_BADGES.length}`],
    ]
      .map(
        ([tab, label, count]) =>
          `<button class="reward-tab-button ${activeTab === tab ? "active" : ""}" type="button" data-reward-tab="${tab}"><strong>${label}</strong><span>${count}</span></button>`,
      )
      .join("");
    const filterHtml = ["all", ...RARITY_ORDER].map((filter) => {
      const label = filter === "all" ? "ぜんぶ" : filter;
      const count = filter === "all" ? ownedPrizeCount() : GACHA_PRIZES.filter((prize) => prize.rarity === filter && ownedPrize(prize)).length;
      const total = filter === "all" ? GACHA_PRIZES.length : GACHA_PRIZES.filter((prize) => prize.rarity === filter).length;
      return `<button class="reward-filter-button ${activeFilter === filter ? "active" : ""}" type="button" data-reward-filter="${filter}">${label}<span>${count}/${total}</span></button>`;
    }).join("");
    const treasureHtml = filteredRewards.map((reward) => {
      const count = state.gachaCollection[reward.key] || 0;
      const unlocked = count > 0;
      const selected = state.selectedCompanion === reward.key;
      const cost = exchangeCostFor(reward);
      const canExchange = !unlocked && state.gachaFragments >= cost;
      return `
        <div class="reward-treasure ${unlocked ? "unlocked" : "locked"} ${selected ? "selected" : ""}" data-rarity="${reward.rarity}">
          <span class="treasure-icon">${prizeVisualHtml(reward, !unlocked)}</span>
          <strong>${unlocked ? reward.name : "？？？"}</strong>
          <small>${unlocked ? `${rarityLabel(reward.rarity)} / ${selected ? "相棒中" : reward.kind}` : `${rarityLabel(reward.rarity)} / ${cost}かけら`}</small>
          ${unlocked ? `<button class="mini-action-button" type="button" data-companion="${reward.key}" ${selected ? "disabled" : ""}>${selected ? "相棒中" : "相棒にする"}</button>` : `<button class="mini-action-button exchange-button" type="button" data-exchange="${reward.key}" ${canExchange ? "" : "disabled"}>${canExchange ? "交換する" : `あと${cost - state.gachaFragments}`}</button>`}
        </div>
      `;
    }).join("");
    const stickerHtml = STICKERS.map((sticker) => {
      const count = state.stickers[sticker.key] || 0;
      return `<div class="sticker-card ${count > 0 ? "owned" : "empty"}"><span>${stickerVisualHtml(sticker, count === 0)}</span><strong>${sticker.name}</strong><small>${count}まい / ${sticker.note}</small></div>`;
    }).join("");
    const titleHtml = titleBadgeStatus().map((badge) => `<div class="title-card ${badge.isUnlocked ? "owned" : "empty"}"><span>${titleBadgeVisualHtml(badge)}</span><strong>${badge.isUnlocked ? badge.name : "？？？"}</strong><small>${badge.note}</small></div>`).join("");
    const backgroundNext = nextBackgroundQuestInfo();
    const nextGoal = nextRewardGoalInfo();
    const nextCharacter = nextCharacterGoal();
    const nextGoalVisual = nextCharacter ? prizeVisualHtml(nextCharacter, !ownedPrize(nextCharacter)) : '<span class="prize-mark">★</span>';
    const collectionGoalHtml = `
      <section class="reward-section collection-goal-card ${escapeHtml(nextGoal.className)}">
        <div class="collection-goal-prize" data-rarity="${escapeHtml(nextCharacter?.rarity || "N")}">${nextGoalVisual}</div>
        <div>
          <p class="eyebrow">${escapeHtml(nextGoal.label)}</p>
          <h3>${escapeHtml(nextGoal.title)}</h3>
          <p>${escapeHtml(nextGoal.text)}</p>
          <div class="collection-goal-track" aria-hidden="true"><span style="width:${Math.max(8, nextGoal.progress)}%"></span></div>
        </div>
      </section>
    `;
    const backgroundHtml = BACKGROUND_REWARDS.map((background) => {
      const frameLevel = unlockedFrameLevelForBackground(background.id);
      const unlocked = frameLevel > 0;
      const selected = state.backgroundQuest.selected === background.id;
      const frame = BACKGROUND_FRAMES.find((item) => item.level === frameLevel) || BACKGROUND_FRAMES[0];
      return `<div class="background-card ${unlocked ? "owned" : "locked"} ${selected ? "selected" : ""} ${frame.className}"><span class="background-thumb" style="background-image:url('${background.image}')"></span><strong>${unlocked ? background.name : "？？？"}</strong><small>${unlocked ? frame.name : "まだ見つかっていません"}</small><button class="mini-action-button" type="button" data-background-select="${background.id}" ${unlocked && !selected ? "" : "disabled"}>${selected ? "ホーム背景" : unlocked ? "背景にする" : "ロック中"}</button></div>`;
    }).join("");
    const activeSectionHtml = {
      backgrounds: `<section class="reward-section background-book"><h3>ホーム背景 <span>${state.backgroundQuest.unlockedStage} / ${BACKGROUND_REWARDS.length * BACKGROUND_FRAMES.length}こ・次まで${backgroundNext.complete ? 0 : backgroundNext.left}問</span></h3><p class="background-book-note">九九あなうめを50問クリアするたびに、背景やフレームがふえます。</p><div class="background-grid">${backgroundHtml}</div></section>`,
      stickers: `<section class="reward-section sticker-book"><h3>練習シール</h3><div class="sticker-grid">${stickerHtml}</div></section>`,
      titles: `<section class="reward-section title-book"><h3>称号バッジ <span>${titleBadgeCount()} / ${TITLE_BADGES.length}こ</span></h3><div class="title-grid">${titleHtml}</div></section>`,
      characters: `<section class="reward-section"><h3>キャラコレクション <span>${ownedPrizeCount()} / ${GACHA_PRIZES.length}体・かけら${state.gachaFragments}こ</span></h3><div class="reward-filter-bar">${filterHtml}</div><div class="treasure-grid">${treasureHtml}</div></section>`,
    }[activeTab];
    els.rewardShelf.innerHTML = `
      ${collectionGoalHtml}
      <section class="reward-section reward-overview"><div class="reward-summary-grid"><div><p class="eyebrow">キャラ</p><strong>${ownedPrizeCount()} / ${GACHA_PRIZES.length}体</strong><span>相棒にしたいキャラを選べます。</span></div><div><p class="eyebrow">かけら</p><strong>${state.gachaFragments}こ</strong><span>重複したキャラはかけらになります。</span></div><div><p class="eyebrow">称号</p><strong>${titleBadgeCount()} / ${TITLE_BADGES.length}こ</strong><span>続けると解放されます。</span></div><div class="rarity-chip-row">${raritySummaryHtml()}</div></div></section>
      <nav class="reward-tab-bar" aria-label="コレクションの種類">${rewardTabHtml}</nav>
      ${activeSectionHtml}
    `;
  }
  renderParentDashboard();
  const weak = topWeakness();
  if (els.weakPointText) els.weakPointText.textContent = weak ? `いまは「${weak[0]}」を多めに練習するとよさそう。` : "まだ苦手記録はありません。";
  if (els.coachMessage) {
    const messages = {
      complete: state.lastPraise || "順番を守って最後までできたね。",
      mistake: "間違いは発見です。どの手順で迷ったか見つけよう。",
      weak: "苦手ポイントを記録しました。あとで復習できます。",
    };
    els.coachMessage.textContent = messages[event] || (weak ? `今日は「${weak[0]}」を一緒に練習しよう。` : "オレンジのマスだけ見れば大丈夫。ゆっくり進もう。");
  }
}
function parseCustomProblem(text) {
  const cleaned = text.replace(/\s/g, "").replace("×", "*").replace("÷", "/");
  let match = cleaned.match(/^(\d+)\*(\d+)$/);
  if (match) {
    const top = Number(match[1]);
    const bottom = Number(match[2]);
    const bottomDigits = String(bottom).split("").reverse().map(Number);
    const partials = bottomDigits.map((digit, index) => top * digit * 10 ** index);
    const rawPartials = bottomDigits.map((digit) => top * digit);
    const answer = top * bottom;
    const width = Math.max(String(answer).length, String(top).length, String(bottom).length + 1);
    return { kind: "multiply", top, bottom, partials, rawPartials, answer, width };
  }
  match = cleaned.match(/^(\d+)\/(\d+)$/);
  if (match) {
    const dividend = Number(match[1]);
    const divisor = Number(match[2]);
    if (divisor === 0) return null;
    const quotient = Math.floor(dividend / divisor);
    const remainder = dividend % divisor;
    const product = divisor * quotient;
    return { kind: "divide", divisor, dividend, quotient, product, remainder };
  }
  return null;
}
function startReviewProblem() {
  const weak = topWeakness();
  if (!weak) {
    els.feedback.textContent = "まだ復習する苦手記録はありません。まずは1問やってみよう。";
    els.feedback.className = "feedback try";
    return;
  }
  state.customProblem = weak[0].includes("わり") || ["かける", "ひく", "おろす", "商"].includes(weak[0])
    ? makeDivideProblem()
    : makeMultiplyProblem();
  showView("challenge");
  renderProblem();
}

function startParentReview() {
  if (topWeakness()) {
    startReviewProblem();
    return;
  }
  showView("review");
}
function playTone(type) {
  if (!state.settings.sound) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = type === "success" ? 720 : 260;
  gain.gain.value = 0.05;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  window.setTimeout(() => {
    osc.stop();
    ctx.close();
  }, 120);
}

function initSettingsUi() {
  if (els.dailyGoal) els.dailyGoal.value = state.settings.dailyGoal;
  if (els.practiceFocus) els.practiceFocus.value = state.settings.focus;
  if (els.soundToggle) els.soundToggle.checked = state.settings.sound;
}

function saveSettingsFromUi() {
  state.settings.dailyGoal = Math.max(1, Math.min(20, Number(els.dailyGoal?.value || 3)));
  state.settings.focus = els.practiceFocus?.value || "all";
  state.settings.sound = !!els.soundToggle?.checked;
  saveProgress();
  updateProgress();
}

function showParentResetMessage(message) {
  if (!els.parentResetMessage) return;
  els.parentResetMessage.textContent = message;
  window.clearTimeout(showParentResetMessage.timer);
  showParentResetMessage.timer = window.setTimeout(() => {
    els.parentResetMessage.textContent = "";
  }, 2600);
}

function resetRewardData(type) {
  const messages = {
    coins: "コインを0に戻します。学習履歴は残ります。よろしいですか？",
    gacha: "集めたキャラを空に戻します。学習履歴は残ります。よろしいですか？",
    all: "コインとキャラをリセットします。学習履歴は残ります。よろしいですか？",
  };
  if (!window.confirm(messages[type] || messages.all)) return;

  if (type === "coins" || type === "all") {
    state.coins = 0;
    state.treasureProgress = 0;
  }
  if (type === "gacha" || type === "all") {
    state.gachaCollection = { main: 1 };
    state.gachaFragments = 0;
    state.selectedCompanion = "main";
    state.lastGachaPrize = null;
  }

  saveProgress();
  updateProgress();
  const doneMessage =
    type === "coins"
      ? "コインを0に戻しました。"
      : type === "gacha"
        ? "集めたキャラを空に戻しました。"
        : "コインとキャラをリセットしました。";
  showParentResetMessage(doneMessage);
}

function resetAllProgressData() {
  const message =
    "解いた問題数、連続正解、苦手記録、コイン、ガチャ、シール、称号、背景など、これまでの記録をすべてリセットします。よろしいですか？";
  if (!window.confirm(message)) return;

  const preservedSettings = state.settings;
  Object.keys(localStorage)
    .filter((key) => key.startsWith("hp_") && key !== "hp_settings")
    .forEach((key) => localStorage.removeItem(key));

  state.mode = "auto";
  state.level = 1;
  state.course = "autoAdventure";
  state.problem = null;
  state.steps = [];
  state.stepIndex = 0;
  state.customProblem = null;
  state.reviewMode = false;
  state.hintLevel = 0;
  state.problemMistakes = 0;
  state.answerShown = false;
  state.streak = 0;
  state.stars = 0;
  state.coins = 0;
  state.solvedToday = 0;
  state.settings = preservedSettings;
  state.history = [];
  state.weak = {};
  state.rewards = [];
  state.stickers = {};
  state.gachaCollection = { main: 1 };
  state.gachaFragments = 0;
  state.selectedCompanion = "main";
  state.rewardFilter = "all";
  state.treasureProgress = 0;
  state.autoProgress = { stage: 0, clears: 0, noMiss: 0, misses: 0 };
  state.backgroundQuest = normalizeBackgroundQuest(null);
  state.lastGachaPrize = null;
  state.gachaRolling = false;
  state.lastPraise = "";

  els.courseButtons.forEach((item) => item.classList.toggle("active", item.dataset.course === "autoAdventure"));
  saveProgress();
  initSettingsUi();
  updateProgress();
  updateCompanion("main");
  renderProblem();
  showParentResetMessage("すべての記録をリセットしました。");
}
function registerOffline() {
  if (!("serviceWorker" in navigator)) return;

  const isLocalPreview = ["127.0.0.1", "localhost"].includes(window.location.hostname);
  if (isLocalPreview) {
    navigator.serviceWorker.getRegistrations?.().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    window.caches?.keys?.().then((keys) => {
      keys.filter((key) => key.startsWith("hissan-puzzle")).forEach((key) => window.caches.delete(key));
    });
    return;
  }

  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

els.modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    els.modeButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.mode = button.dataset.mode;
    renderProblem();
  });
});

els.courseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const course = COURSES[button.dataset.course] || COURSES.starter;
    els.courseButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.course = button.dataset.course;
    state.mode = course.mode;
    state.level = course.level;
    els.courseControls?.classList.add("compact");
    if (els.toggleCourses) els.toggleCourses.textContent = "コース変更";
    renderProblem();
    showView("challenge");
  });
});

document.querySelectorAll("[data-home-course]").forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.homeCourse;
    const course = COURSES[key] || COURSES.multiplyFill;
    const courseButton = document.querySelector(`.course-card[data-course="${key}"]`);
    els.courseButtons.forEach((item) => item.classList.remove("active"));
    courseButton?.classList.add("active");
    state.course = key;
    state.mode = course.mode;
    state.level = course.level;
    renderProblem();
    showView("challenge");
  });
});

els.toggleCourses?.addEventListener("click", () => {
  showView("courseSelect");
});

els.level?.addEventListener("change", () => {
  state.level = Number(els.level.value);
  renderProblem();
});

els.hintButton.addEventListener("click", showHint);
els.checkButton.addEventListener("click", checkAnswers);
els.showAnswerButton.addEventListener("click", showAnswer);
els.gachaButton?.addEventListener("click", rollGacha);

document.querySelectorAll("[data-nav]").forEach((button) => {
  button.dataset.navBound = "true";
  button.addEventListener("click", () => showView(button.getAttribute("data-nav")));
});

document.querySelectorAll("[data-tutorial-open]").forEach((button) => {
  button.addEventListener("click", () => showTutorial(true));
});

els.showTutorialButton?.addEventListener("click", () => showTutorial(true));
els.tutorialStartButton?.addEventListener("click", () => hideTutorial({ start: true }));
els.tutorialSkipButton?.addEventListener("click", () => hideTutorial());
els.tutorialCloseButton?.addEventListener("click", () => hideTutorial());
els.tutorialOverlay?.addEventListener("click", (event) => {
  if (event.target === els.tutorialOverlay) hideTutorial();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-nav]");
  if (!button || button.dataset.navBound === "true") return;
  showView(button.getAttribute("data-nav"));
});

els.gachaPrizePreview?.addEventListener("click", (event) => {
  const exchangeButton = event.target.closest("[data-exchange]");
  if (!exchangeButton) return;
  exchangePrize(exchangeButton.dataset.exchange);
});

els.customForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const problem = parseCustomProblem(els.customExpression.value);
  if (!problem) {
    els.feedback.textContent = "式は 445×45 や 117÷9 の形で入れてください。";
    els.feedback.className = "feedback try";
    return;
  }
  state.customProblem = problem;
  showView("challenge");
  renderProblem();
});

els.reviewButton?.addEventListener("click", startReviewProblem);
els.parentReviewButton?.addEventListener("click", startParentReview);
els.dailyGoal?.addEventListener("change", saveSettingsFromUi);
els.practiceFocus?.addEventListener("change", () => {
  saveSettingsFromUi();
  renderProblem();
});
els.soundToggle?.addEventListener("change", saveSettingsFromUi);
els.resetCoinsButton?.addEventListener("click", () => resetRewardData("coins"));
els.resetGachaButton?.addEventListener("click", () => resetRewardData("gacha"));
els.resetRewardButton?.addEventListener("click", () => resetRewardData("all"));
els.resetAllButton?.addEventListener("click", resetAllProgressData);

els.numpad?.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const current = state.steps[state.stepIndex];
  if (!current) return;
  if (button.dataset.num != null) {
    enterDigit(button.dataset.num);
  } else if (button.dataset.action === "back") {
    current.value = "";
    focusActiveInput(current);
  } else if (button.dataset.action === "hint") {
    showHint();
  }
});

els.rewardShelf?.addEventListener("click", (event) => {
  const tabButton = event.target.closest("[data-reward-tab]");
  if (tabButton) {
    state.rewardTab = tabButton.dataset.rewardTab || "characters";
    saveProgress();
    updateProgress();
    return;
  }
  const filterButton = event.target.closest("[data-reward-filter]");
  if (filterButton) {
    state.rewardFilter = filterButton.dataset.rewardFilter || "all";
    saveProgress();
    updateCompanion();
    return;
  }
  const companionButton = event.target.closest("[data-companion]");
  if (companionButton) {
    selectCompanion(companionButton.dataset.companion);
    return;
  }
  const backgroundButton = event.target.closest("[data-background-select]");
  if (backgroundButton) {
    selectHomeBackground(backgroundButton.dataset.backgroundSelect);
    return;
  }
  const exchangeButton = event.target.closest("[data-exchange]");
  if (exchangeButton) {
    exchangePrize(exchangeButton.dataset.exchange);
  }
});

applyJapaneseLabels();
initSettingsUi();
setCharacterMood("main");
updateProgress();
registerOffline();
renderProblem();
window.setTimeout(() => showTutorial(false), 450);























