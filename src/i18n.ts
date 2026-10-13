// 全站 UI 文案集中管理：支持 en / zh / ja / ko 四种语言。
// 新增语言只需在此文件补一组翻译，并在下方 LANGS、astro.config.mjs、content.config.ts 同步即可。

export const LANGS = ['en', 'zh', 'ja', 'ko'] as const;
export type Lang = (typeof LANGS)[number];

// 语言切换器上显示的短标签
export const LOCALE_LABELS: Record<Lang, string> = {
  en: 'EN',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
};

interface UIStrings {
  brand: string;
  nav: { home: string; heritage: string; food: string; travel: string; cities: string; about: string; contact: string };
  footer: string;
  home: { heroTitle: string; heroSub: string; latest: string; introTitle: string; intro: string[] };
  heritage: { title: string; sub: string };
  food: { title: string; sub: string };
  travel: { title: string; sub: string };
  cities: { hero: string; sub: string; soon: string; stories: string };
  city: { crumb: string; sub: string };
  about: { title: string; heading: string; paragraphs: string[]; sign: string };
  post: { faq: string; catHeritage: string; catFood: string; catTravel: string };
  contact: {
    title: string;
    heading: string;
    intro: string;
    nameLabel: string;
    emailLabel: string;
    datesLabel: string;
    datesPlaceholder: string;
    interestLabel: string;
    interestVisa: string;
    interestItinerary: string;
    interestFood: string;
    interestCulture: string;
    interestOther: string;
    msgLabel: string;
    msgPlaceholder: string;
    submit: string;
    success: string;
    error: string;
    setupNote: string;
  };
  newsletter: { title: string; placeholder: string; button: string; success: string; error: string };
}

export const ui: Record<Lang, UIStrings> = {
  en: {
    brand: 'China Living · Food & Heritage',
    nav: { home: 'Home', heritage: 'Heritage', food: 'Food', travel: 'Travel', cities: 'Cities', about: 'About', contact: 'Contact' },
    footer: '© 2026 China Living · Sharing real China through food and craft.',
    home: {
      heroTitle: 'Real China, one dish and one craft at a time',
      heroSub: 'We share authentic Chinese food and living heritage, so the world can see China as it really is.',
      latest: 'Latest stories',
      introTitle: 'About this blog',
      intro: [
        'It is hard to grasp just how vast China is. Its 9.6 million square kilometers are roughly the size of all of Europe, and many of its provinces are the scale of an entire European country.',
        'For over two decades, work has taken me to nearly every corner of China — except Tibet. I live in Shanghai, and I watch China change fast, meeting more international friends every day.',
        'This blog is where I share what I have seen and learned, to show you a China you will not find in ordinary travel guides.',
      ],
    },
    heritage: { title: 'Intangible Cultural Heritage', sub: 'Centuries-old crafts, alive in Chinese hands today.' },
    food: { title: 'Chinese Food', sub: 'From street snacks to banquet craft, every bowl tells a story.' },
    travel: { title: 'Travel Essentials', sub: 'Visa, payments, connectivity, transit — read these before you fly.' },
    cities: { hero: 'China, city by city — one understanding at a time', sub: 'Lit cities have my real recommendations. Tap one to step inside.', soon: 'Soon', stories: 'stories' },
    city: { crumb: 'Cities', sub: 'I’ve walked {name}. Here’s what I most want you to know.' },
    about: {
      title: 'About',
      heading: 'Meet Lao Ai',
      paragraphs: [
        'For ten years, my job as a sales director took me all over China. My flight app (think Flighty, but Chinese) adds it up: <strong>833 flights, 991,903 kilometers</strong> — enough to circle the equator about 25 times — across <strong>73 cities</strong>, every province except Tibet.',
        'But the numbers were never the point.',
        'The point was what happened on the ground. Eating feichang fen at 3 a.m. in a Chengdu alley. Getting lost in a Kashgar bazaar and being pulled into a stranger’s home for milk tea. Learning that every Chinese city has its own temper, its own taste, its own reason for surviving a thousand years.',
        'Most of what the world sees of China comes through algorithms — fast, shallow, and gone by tomorrow. I wanted to build something different: a slower, warmer, more focused way to understand this country. Not a list of facts, but one person’s real understanding of its cities, told one story at a time.',
        'If you’ve ever wanted to know China beyond the headlines, you’re in the right place. I’ll take you there — starting with the places I’ve actually stood.',
      ],
      sign: '— Lao Ai',
    },
    post: { faq: 'FAQ', catHeritage: 'Heritage', catFood: 'Food', catTravel: 'Travel' },
    contact: {
      title: 'Contact',
      heading: 'Plan your China trip with me',
      intro: 'Thinking about a trip to China? Tell me a bit about your plans and I’ll get back to you with honest, hands-on advice — visa, payments, routes, or just where to eat. No packages, no hard sell.',
      nameLabel: 'Your name',
      emailLabel: 'Email',
      datesLabel: 'Tentative travel dates',
      datesPlaceholder: 'e.g. Oct 2026, 2 weeks',
      interestLabel: 'What do you need help with?',
      interestVisa: 'Visa & entry',
      interestItinerary: 'Itinerary & routes',
      interestFood: 'Food & where to eat',
      interestCulture: 'Culture & heritage',
      interestOther: 'Something else',
      msgLabel: 'Your message',
      msgPlaceholder: 'Tell me about your trip, your questions, anything…',
      submit: 'Send my request',
      success: 'Thanks! Your request is in. I’ll reply by email soon.',
      error: 'Something went wrong. Please email me directly.',
      setupNote: 'Form not configured yet — add your Web3Forms key in site.config.ts.',
    },
    newsletter: {
      title: 'Get China travel notes in your inbox',
      placeholder: 'you@email.com',
      button: 'Subscribe',
      success: 'You’re in! Check your inbox to confirm.',
      error: 'Couldn’t subscribe — please try again.',
    },
  },

  zh: {
    brand: '中国生活 · 美食与非遗',
    nav: { home: '首页', heritage: '非遗', food: '美食', travel: '旅游', cities: '城市', about: '关于', contact: '咨询' },
    footer: '© 2026 中国生活 · 用美食与手作，让世界看见真实的中国。',
    home: {
      heroTitle: '真实的中国，从一碗饭、一门手艺开始',
      heroSub: '我们分享中国的地道美食与非物质文化遗产，让世界看见有温度的中国生活。',
      latest: '最新内容',
      introTitle: '关于这个博客',
      intro: [
        '很难想象中国究竟有多大。960 万平方公里国土，和整个欧洲面积大致相当，很多省份的规模堪比一个欧洲国家。',
        '二十多年来，工作带我走遍中国几乎每一处，除了西藏。我住在上海，亲眼看见中国快速变化，每天都能结识更多国际友人。',
        '这个博客用来分享我的所见所学，带你看见普通旅游攻略里找不到的中国。',
      ],
    },
    heritage: { title: '非物质文化遗产', sub: '千年手艺，活在当下的中国人手里。' },
    food: { title: '地道美食', sub: '从街边小吃到宴席功夫，一碗一筷都是中国。' },
    travel: { title: '实用旅游信息', sub: '签证、支付、上网、交通——来中国之前，先把这几篇读一遍。' },
    cities: { hero: '我走过的中国，一座城一个理解', sub: '点亮的城市都有我的真实推荐。点一下，跟我走进那座城。', soon: '筹备中', stories: '篇' },
    city: { crumb: '城市', sub: '我走过{name}，这是我最想让你知道的几样。' },
    about: {
      title: '关于',
      heading: '认识老艾',
      paragraphs: [
        '十年里，我的工作把我带到了中国的各个角落。我的航旅 app（类似 Flighty 的中国版）记下了一组数字：<strong>833 次飞行、991,903 公里</strong>——差不多够绕赤道 25 圈——走过 <strong>73 座城市</strong>，除了西藏，每个省都到过。',
        '但数字从来不是重点。',
        '重点发生在地面上。在成都的小巷里，凌晨三点吃一碗刚出锅的肥肠粉。在喀什的巴扎里迷了路，被一位大叔拽进家里喝奶茶。我渐渐明白，每一座中国城市都有自己的脾气、自己的味道、自己活过千年的理由。',
        '今天，世界看见的中国大多来自算法——来得快、看得浅、明天就刷过去。我想做一些不一样的：一条更慢、更暖、更专注的路，去理解这个国家。不是一堆冷冰冰的事实，而是一个真正走过的人，对一座座城市的理解，一次讲一座城。',
        '如果你也曾想认识新闻头条之外的中国，你来对了地方。我带你去看——从我真正站过的那些地方开始。',
      ],
      sign: '—— 老艾',
    },
    post: { faq: '常见问题', catHeritage: '非遗', catFood: '美食', catTravel: '旅游' },
    contact: {
      title: '咨询',
      heading: '让我帮你规划中国之行',
      intro: '正在计划来中国？告诉我一点你的行程，我会给你真诚、接地气的建议——签证、支付、路线，或者单纯去哪吃。不卖套餐，不硬推。',
      nameLabel: '你的称呼',
      emailLabel: '邮箱',
      datesLabel: '预计出行时间',
      datesPlaceholder: '例如：2026年10月，约2周',
      interestLabel: '你想了解什么？',
      interestVisa: '签证与入境',
      interestItinerary: '行程与路线',
      interestFood: '美食与觅食',
      interestCulture: '文化与非遗',
      interestOther: '其他',
      msgLabel: '想说的话',
      msgPlaceholder: '说说你的行程、疑问，随便什么…',
      submit: '发送咨询',
      success: '谢谢！已收到你的咨询，我会尽快邮件回复你。',
      error: '提交失败了，请直接给我发邮件。',
      setupNote: '表单尚未配置——请在 site.config.ts 填入 Web3Forms 密钥。',
    },
    newsletter: {
      title: '把中国旅行笔记寄到你的邮箱',
      placeholder: '你的邮箱',
      button: '订阅',
      success: '订阅成功！去邮箱确认一下。',
      error: '订阅失败，请重试。',
    },
  },

  ja: {
    brand: 'チャイナ・リビング｜食と無形文化遺産',
    nav: { home: 'ホーム', heritage: '無形文化遺産', food: '食', travel: '旅の準備', cities: '都市', about: '紹介', contact: 'お問い合わせ' },
    footer: '© 2026 China Living｜食と工芸を通じて、真の中国を世界へ。',
    home: {
      heroTitle: '本当の中国を、一皿の料理と一つの技から',
      heroSub: '本物の中国料理と生きた無形文化遺産をお届けし、世界に中国の真の姿を見てもらいます。',
      latest: '最新記事',
      introTitle: 'このブログについて',
      intro: [
        '中国がいかに広いか、なかなか実感できません。960万平方キロの国土は、ヨーロッパ全体とほぼ同じ大きさで、多くの省は一つのヨーロッパの国ほどの規模です。',
        '20年以上、仕事で中国のほとんど隅々まで足を運びました（チベットだけはまだ）。私は上海に住み、中国の急速な変化をこの目で見て、毎日のように多くの外国人の友だちと出会っています。',
        'このブログは、私が見て学んだことを共有し、普通の旅行ガイドには載らない中国をお見せするための場所です。',
      ],
    },
    heritage: { title: '無形文化遺産', sub: '数百年の技が、今も中国人の手の中で生きている。' },
    food: { title: '中国料理', sub: '屋台の軽食から宴会の技まで、一碗一箸に中国が宿る。' },
    travel: { title: '旅の準備', sub: 'ビザ・決済・通信・移動——渡航前にまず読んでおいて。' },
    cities: { hero: '中国を都市ごとに——ひとつずつ理解していく', sub: '点灯した都市には私の本当のおすすめがあります。タップして中へ。', soon: '準備中', stories: '記事' },
    city: { crumb: '都市', sub: '{name}を歩き尽くしました。一番伝えたいことを紹介します。' },
    about: {
      title: '紹介',
      heading: 'ラオ・アイについて',
      paragraphs: [
        '10年間、営業部長としての仕事で中国中を飛び回りました。フライト管理アプリ（Flightyの中国版と思えば）が計算してくれます。833便、991,903キロ——赤道を約25周する距離——73の都市を、チベットを除くすべての省を訪れました。',
        'でも、数字自体が重要なのではありませんでした。',
        '大切なのは大地の上で起きたことです。成都の路地で午前3時にふかふかの肥腸粉を食べたこと。カシュガルのバザーで道に迷い、見知らぬ人の家に引っ張り込まれてミルクティーをごちそうになったこと。どの中国の都市にも、独自の気質と味わいと、千年生き延びてきた理由があると気づいたこと。',
        '世界が中国から見るものの多くはアルゴリズムを通じて届きます——速く、浅く、明日には消える。だから私は違うものを作りたかったのです。この国を理解する、よりゆっくりで、温かく、焦点を絞った方法を。事実の列挙ではなく、一人の人間が本当に歩いた都市への理解を、物語を一つずつ紡ぐように。',
        'もしあなたが見出しの向こうの中国を知りたいと思ったことがあるなら、ここは正しい場所です。私が案内します——まずは私が本当に立った場所から。',
      ],
      sign: '——ラオ・アイ',
    },
    post: { faq: 'よくある質問', catHeritage: '無形文化遺産', catFood: '食', catTravel: '旅の準備' },
    contact: {
      title: 'お問い合わせ',
      heading: '中国旅行を一緒に計画しましょう',
      intro: '中国への旅行を考え中ですか？計画の概要を教えてください。ビザ・決済・ルート、あるいは「どこで食べるか」まで、正直で実践的なアドバイスをお返しします。パッケージ旅行も強引な勧誘もありません。',
      nameLabel: 'お名前',
      emailLabel: 'メールアドレス',
      datesLabel: '予定の旅行時期',
      datesPlaceholder: '例：2026年10月、2週間',
      interestLabel: 'どんなことでお手伝いしましょうか？',
      interestVisa: 'ビザ・入国',
      interestItinerary: '旅程・ルート',
      interestFood: '食・お店',
      interestCulture: '文化・無形文化遺産',
      interestOther: 'その他',
      msgLabel: 'メッセージ',
      msgPlaceholder: '旅行のこと、質問、何でもどうぞ…',
      submit: '送信する',
      success: 'ありがとうございます！リクエストを受け付けました。メールで折り返しご連絡します。',
      error: '送信に失敗しました。直接メールでご連絡ください。',
      setupNote: 'フォーム未設定：site.config.ts に Web3Forms キーを設定してください。',
    },
    newsletter: {
      title: '中国旅行の便りをメールで',
      placeholder: 'メールアドレス',
      button: '登録',
      success: '登録完了！受信箱で確認してください。',
      error: '登録できませんでした。もう一度お試しください。',
    },
  },

  ko: {
    brand: '차이나 리빙｜음식과 무형문화유산',
    nav: { home: '홈', heritage: '무형문화유산', food: '음식', travel: '여행 준비', cities: '도시', about: '소개', contact: '문의' },
    footer: '© 2026 차이나 리빙｜음식과 공예로 진짜 중국을 세상에.',
    home: {
      heroTitle: '진짜 중국을, 한 그릇의 요리와 하나의 기술로',
      heroSub: '진짜 중국 음식과 살아있는 무형문화유산을 공유해, 세상이 진짜 중국을 보게 합니다.',
      latest: '최신 글',
      introTitle: '이 블로그에 대하여',
      intro: [
        '중국이 얼마나 큰지 가늠하기 쉽지 않습니다. 960만 제곱킬로미터의 국토는 유럽 전체와 비슷한 크기이고, 많은 성(省)은 하나의 유럽 국가만큼 됩니다.',
        '20여 년간, 일 때문에 티베트를 뺀 중국 거의 모든 곳을 누볐습니다. 저는 상하이에 살며 중국의 빠른 변화를 눈앞에서 보고, 매일 더 많은 외국인 친구를 만납니다.',
        '이 블로그는 제가 보고 배운 것을 나누어, 일반적인 여행 가이드에서는 찾을 수 없는 중국을 보여주려 합니다.',
      ],
    },
    heritage: { title: '무형문화유산', sub: '수백 년 된 기술이 지금도 중국인의 손끝에서 살아있습니다.' },
    food: { title: '중국 음식', sub: '길거리 간식부터 연회 요리까지, 한 그릇 한 젓가락에 중국이 담깁니다.' },
    travel: { title: '여행 준비', sub: '비자·결제·인터넷·교통——중국 오기 전에 먼저 읽어보세요.' },
    cities: { hero: '도시별로 보는 중국——하나씩 이해해 가기', sub: '불이 켜진 도시에는 제 진짜 추천이 있습니다. 눌러 안으로 들어가 보세요.', soon: '준비 중', stories: '편' },
    city: { crumb: '도시', sub: '{name}를 다 걸어봤습니다. 가장 알려주고 싶은 것들을 소개할게요.' },
    about: {
      title: '소개',
      heading: '라오아이를 소개합니다',
      paragraphs: [
        '10년간 영업 본부장으로 일하며 중국 곳곳을 누비고 다녔습니다. 탑승 기록 앱(플라이트리의 중국판이라 생각하면 됩니다)이 합산해 줍니다. 833회 비행, 991,903km——적도를 약 25바퀴 도는 거리——티베트를 뺀 모든 성을 포함해 73개 도시를 누볐습니다.',
        '하지만 숫자 자체가 중요했던 건 아닙니다.',
        '중요한 건 땅 위에서 일어난 일들이었습니다. 청두 골목에서 새벽 3시에 끓여 낸 퉁런 펀(肥肠粉)을 먹었고, 카슈가르 바자에서 길을 잃고 낯선 이의 집에 끌려가 밀크티를 대접받았습니다. 그리고 모든 중국 도시에는 저마다의 기질과 맛, 천 년을 버텨온 이유가 있다는 걸 배웠습니다.',
        '세상이 중국에서 보는 대부분은 알고리즘을 통해 옵니다——빠르고, 얕고, 내일이면 사라집니다. 그래서 저는 다른 무언가를 만들고 싶었습니다. 이 나라를 이해하는, 더 느리고 따뜻하며 집중된 방식을. 사실 나열이 아니라, 한 사람이 정말 걸어본 도시들에 대한 이해를 이야기 하나씩 풀어가는 방식으로.',
        '만약 헤드라인 너머의 중국을 알고 싶었던 적이 있다면, 당신은 올바른 곳에 있습니다. 제가 안내할게요——먼저 제가 실제로 서 본 장소들부터.',
      ],
      sign: '—— 라오아이',
    },
    post: { faq: '자주 묻는 질문', catHeritage: '무형문화유산', catFood: '음식', catTravel: '여행 준비' },
    contact: {
      title: '문의',
      heading: '중국 여행을 함께 계획해요',
      intro: '중국 여행을 생각 중이신가요? 계획을 좀 알려주시면 비자·결제·동선은 물론 "어디서 먹을지"까지 정직하고 실용적인 조언을 드립니다. 묶음 상품도 없고 강매도 없습니다.',
      nameLabel: '성함',
      emailLabel: '이메일',
      datesLabel: '예상 여행 시기',
      datesPlaceholder: '예: 2026년 10월, 2주',
      interestLabel: '무엇이 필요하신가요?',
      interestVisa: '비자·입국',
      interestItinerary: '일정·동선',
      interestFood: '음식·맛집',
      interestCulture: '문화·무형유산',
      interestOther: '기타',
      msgLabel: '남기실 말씀',
      msgPlaceholder: '여행이나 궁금한 점, 무엇이든…',
      submit: '문의 보내기',
      success: '감사합니다! 문의를 접수했어요. 곧 메일로 답장드리겠습니다.',
      error: '전송에 실패했습니다. 직접 메일 주세요.',
      setupNote: '폼 미설정: site.config.ts에 Web3Forms 키를 넣어주세요.',
    },
    newsletter: {
      title: '중국 여행 편지를 메일로',
      placeholder: '이메일 주소',
      button: '구독',
      success: '구독 완료! 받은편지함을 확인하세요.',
      error: '구독에 실패했어요. 다시 시도해 주세요.',
    },
  },
};

// 取文案：找不到该语言时回退英文，避免页面崩
export function t(lang: string): UIStrings {
  return ui[(lang as Lang)] ?? ui.en;
}
