/**
 * i18n của bot — 1 bot phục vụ cả 12 ngôn ngữ (mỗi user có locale riêng trong DB).
 *
 * Ghi chú: dùng bảng TS thuần thay vì @grammyjs/i18n (Fluent) vì chỉ ~11 chuỗi —
 * ít phụ thuộc, không cần copy thư mục .ftl vào image. Nếu số chuỗi phình to,
 * chuyển sang @grammyjs/i18n như nghiên cứu gợi ý.
 */
export const LOCALES = ['vi','en','zh','hi','es','pt','fr','de','ar','ru','ja','ko'] as const;
export type Locale = (typeof LOCALES)[number];

export const LANGUAGE_BUTTONS: { code: Locale; label: string }[] = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'vi', label: '🇻🇳 Tiếng Việt' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'ja', label: '🇯🇵 日本語' },
  { code: 'ko', label: '🇰🇷 한국어' },
  { code: 'pt', label: '🇵🇹 Português' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'zh', label: '🇨🇳 中文' },
  { code: 'hi', label: '🇮🇳 हिन्दी' },
  { code: 'ru', label: '🇷🇺 Русский' },
  { code: 'ar', label: '🇸🇦 العربية' },
];

type Key =
  | 'welcome' | 'privacyNote' | 'disclosure' | 'chooseLanguage' | 'languageSet'
  | 'stopped' | 'help' | 'viewDeal' | 'codeLabel' | 'exclusive' | 'noDeals';

const M: Record<Locale, Record<Key, string>> = {
  en: {
    welcome: '👋 Welcome to Dealeg! You will get the best tech deals right here.',
    privacyNote: 'By subscribing you agree to our privacy policy. Send /stop any time to unsubscribe.',
    disclosure: 'Dealeg may earn a commission from partner stores when you buy through our links.',
    chooseLanguage: '🌐 Choose your language:',
    languageSet: '✅ Language set to {lang}.',
    stopped: '🔕 You have unsubscribed. Send /start to turn deals back on.',
    help: 'Commands:\n/start – get deal alerts\n/language – change language\n/deals – latest deals\n/stop – unsubscribe\n/help – this message',
    viewDeal: '🛒 View deal',
    codeLabel: 'Code',
    exclusive: '🔒 Exclusive deal — open the page to reveal the full code',
    noDeals: 'No new deals yet. Check back soon!',
  },
  vi: {
    welcome: '👋 Chào mừng đến Dealeg! Bạn sẽ nhận các deal công nghệ tốt nhất tại đây.',
    privacyNote: 'Khi đăng ký, bạn đồng ý với chính sách bảo mật của chúng tôi. Gửi /stop bất cứ lúc nào để huỷ.',
    disclosure: 'Dealeg có thể nhận hoa hồng từ cửa hàng đối tác khi bạn mua qua link của chúng tôi.',
    chooseLanguage: '🌐 Chọn ngôn ngữ của bạn:',
    languageSet: '✅ Đã đổi ngôn ngữ sang {lang}.',
    stopped: '🔕 Bạn đã huỷ nhận deal. Gửi /start để bật lại.',
    help: 'Các lệnh:\n/start – bật nhận deal\n/language – đổi ngôn ngữ\n/deals – deal mới nhất\n/stop – huỷ nhận\n/help – trợ giúp',
    viewDeal: '🛒 Xem deal',
    codeLabel: 'Mã',
    exclusive: '🔒 Deal độc quyền — mở trang để xem mã đầy đủ',
    noDeals: 'Chưa có deal mới. Quay lại sau nhé!',
  },
  de: {
    welcome: '👋 Willkommen bei Dealeg! Hier bekommst du die besten Tech-Deals.',
    privacyNote: 'Mit dem Abo stimmst du unserer Datenschutzerklärung zu. Sende jederzeit /stop zum Abbestellen.',
    disclosure: 'Dealeg erhält ggf. eine Provision von Partner-Shops, wenn du über unsere Links kaufst.',
    chooseLanguage: '🌐 Wähle deine Sprache:',
    languageSet: '✅ Sprache auf {lang} gesetzt.',
    stopped: '🔕 Du hast dich abgemeldet. Sende /start, um Deals wieder zu erhalten.',
    help: 'Befehle:\n/start – Deal-Alerts erhalten\n/language – Sprache ändern\n/deals – neueste Deals\n/stop – abmelden\n/help – diese Nachricht',
    viewDeal: '🛒 Deal ansehen',
    codeLabel: 'Code',
    exclusive: '🔒 Exklusiver Deal — öffne die Seite für den vollständigen Code',
    noDeals: 'Noch keine neuen Deals. Schau bald wieder vorbei!',
  },
  ja: {
    welcome: '👋 Dealeg へようこそ！ここで最高のテックお得情報をお届けします。',
    privacyNote: '購読するとプライバシーポリシーに同意したことになります。解除はいつでも /stop で。',
    disclosure: 'Dealeg はリンク経由のご購入により提携ストアから手数料を得る場合があります。',
    chooseLanguage: '🌐 言語を選んでください：',
    languageSet: '✅ 言語を {lang} に設定しました。',
    stopped: '🔕 配信を停止しました。再開するには /start を送信してください。',
    help: 'コマンド:\n/start – お得情報を受け取る\n/language – 言語を変更\n/deals – 最新のお得情報\n/stop – 配信停止\n/help – このメッセージ',
    viewDeal: '🛒 詳細を見る',
    codeLabel: 'コード',
    exclusive: '🔒 限定ディール — 完全なコードはページで確認できます',
    noDeals: '新しいお得情報はまだありません。またお越しください！',
  },
  ko: {
    welcome: '👋 Dealeg에 오신 것을 환영합니다! 최고의 테크 딜을 여기서 받아보세요.',
    privacyNote: '구독하면 개인정보 처리방침에 동의하는 것입니다. 언제든 /stop 으로 해지하세요.',
    disclosure: 'Dealeg는 링크를 통한 구매 시 제휴 스토어로부터 수수료를 받을 수 있습니다.',
    chooseLanguage: '🌐 언어를 선택하세요:',
    languageSet: '✅ 언어가 {lang}(으)로 설정되었습니다.',
    stopped: '🔕 구독을 해지했습니다. 다시 받으려면 /start 를 보내세요.',
    help: '명령어:\n/start – 딜 알림 받기\n/language – 언어 변경\n/deals – 최신 딜\n/stop – 구독 해지\n/help – 도움말',
    viewDeal: '🛒 딜 보기',
    codeLabel: '코드',
    exclusive: '🔒 독점 딜 — 전체 코드는 페이지에서 확인하세요',
    noDeals: '아직 새로운 딜이 없습니다. 곧 다시 확인해 주세요!',
  },
  pt: {
    welcome: '👋 Bem-vindo ao Dealeg! Você vai receber as melhores promoções de tecnologia aqui.',
    privacyNote: 'Ao assinar, você concorda com nossa política de privacidade. Envie /stop a qualquer momento para cancelar.',
    disclosure: 'Ao comprar por meio de nossos links, o Dealeg pode receber uma comissão da loja parceira.',
    chooseLanguage: '🌐 Escolha seu idioma:',
    languageSet: '✅ Idioma definido para {lang}.',
    stopped: '🔕 Você cancelou a inscrição. Envie /start para voltar a receber.',
    help: 'Comandos:\n/start – receber promoções\n/language – mudar idioma\n/deals – promoções recentes\n/stop – cancelar\n/help – esta mensagem',
    viewDeal: '🛒 Ver promoção',
    codeLabel: 'Cupom',
    exclusive: '🔒 Promoção exclusiva — abra a página para ver o cupom completo',
    noDeals: 'Ainda não há promoções novas. Volte em breve!',
  },
  es: {
    welcome: '👋 ¡Bienvenido a Dealeg! Aquí recibirás las mejores ofertas tecnológicas.',
    privacyNote: 'Al suscribirte aceptas nuestra política de privacidad. Envía /stop cuando quieras para cancelar.',
    disclosure: 'Dealeg puede recibir una comisión de las tiendas asociadas si compras a través de nuestros enlaces.',
    chooseLanguage: '🌐 Elige tu idioma:',
    languageSet: '✅ Idioma configurado a {lang}.',
    stopped: '🔕 Has cancelado la suscripción. Envía /start para volver a recibir ofertas.',
    help: 'Comandos:\n/start – recibir ofertas\n/language – cambiar idioma\n/deals – ofertas recientes\n/stop – cancelar\n/help – este mensaje',
    viewDeal: '🛒 Ver oferta',
    codeLabel: 'Código',
    exclusive: '🔒 Oferta exclusiva — abre la página para ver el código completo',
    noDeals: 'Aún no hay ofertas nuevas. ¡Vuelve pronto!',
  },
  fr: {
    welcome: '👋 Bienvenue sur Dealeg ! Vous recevrez ici les meilleurs bons plans tech.',
    privacyNote: 'En vous abonnant, vous acceptez notre politique de confidentialité. Envoyez /stop à tout moment pour vous désabonner.',
    disclosure: 'Dealeg peut percevoir une commission des boutiques partenaires si vous achetez via nos liens.',
    chooseLanguage: '🌐 Choisissez votre langue :',
    languageSet: '✅ Langue définie sur {lang}.',
    stopped: '🔕 Vous êtes désabonné. Envoyez /start pour réactiver les offres.',
    help: 'Commandes :\n/start – recevoir les offres\n/language – changer de langue\n/deals – dernières offres\n/stop – se désabonner\n/help – ce message',
    viewDeal: '🛒 Voir l’offre',
    codeLabel: 'Code',
    exclusive: '🔒 Offre exclusive — ouvrez la page pour voir le code complet',
    noDeals: 'Pas encore de nouvelles offres. Revenez bientôt !',
  },
  zh: {
    welcome: '👋 欢迎来到 Dealeg！你将在这里收到最优质的科技优惠。',
    privacyNote: '订阅即表示你同意我们的隐私政策。随时发送 /stop 退订。',
    disclosure: '通过我们的链接购买时，Dealeg 可能会从合作商家获得佣金。',
    chooseLanguage: '🌐 请选择语言：',
    languageSet: '✅ 语言已设置为 {lang}。',
    stopped: '🔕 你已退订。发送 /start 可重新开启优惠推送。',
    help: '命令：\n/start – 接收优惠推送\n/language – 更改语言\n/deals – 最新优惠\n/stop – 退订\n/help – 帮助',
    viewDeal: '🛒 查看优惠',
    codeLabel: '优惠码',
    exclusive: '🔒 独家优惠 — 打开页面查看完整优惠码',
    noDeals: '暂无新优惠，请稍后再来！',
  },
  hi: {
    welcome: '👋 Dealeg में आपका स्वागत है! यहाँ आपको बेहतरीन टेक डील मिलेंगी।',
    privacyNote: 'सब्सक्राइब करके आप हमारी गोपनीयता नीति से सहमत होते हैं। कभी भी /stop भेजकर अनसब्सक्राइब करें।',
    disclosure: 'हमारे लिंक से खरीदने पर Dealeg को पार्टनर स्टोर से कमीशन मिल सकता है।',
    chooseLanguage: '🌐 अपनी भाषा चुनें:',
    languageSet: '✅ भाषा {lang} पर सेट कर दी गई।',
    stopped: '🔕 आपने अनसब्सक्राइब कर दिया। दोबारा शुरू करने के लिए /start भेजें।',
    help: 'कमांड:\n/start – डील अलर्ट पाएं\n/language – भाषा बदलें\n/deals – नई डील\n/stop – अनसब्सक्राइब\n/help – सहायता',
    viewDeal: '🛒 डील देखें',
    codeLabel: 'कोड',
    exclusive: '🔒 विशेष डील — पूरा कोड देखने के लिए पेज खोलें',
    noDeals: 'अभी कोई नई डील नहीं है। जल्द वापस आएं!',
  },
  ru: {
    welcome: '👋 Добро пожаловать в Dealeg! Здесь вы будете получать лучшие тех-скидки.',
    privacyNote: 'Подписываясь, вы соглашаетесь с нашей политикой конфиденциальности. Отправьте /stop в любой момент, чтобы отписаться.',
    disclosure: 'Dealeg может получать комиссию от магазинов-партнёров при покупке по нашим ссылкам.',
    chooseLanguage: '🌐 Выберите язык:',
    languageSet: '✅ Язык изменён на {lang}.',
    stopped: '🔕 Вы отписались. Отправьте /start, чтобы снова получать скидки.',
    help: 'Команды:\n/start – получать скидки\n/language – сменить язык\n/deals – свежие скидки\n/stop – отписаться\n/help – это сообщение',
    viewDeal: '🛒 Посмотреть',
    codeLabel: 'Промокод',
    exclusive: '🔒 Эксклюзив — откройте страницу, чтобы увидеть промокод целиком',
    noDeals: 'Новых скидок пока нет. Загляните позже!',
  },
  ar: {
    welcome: '👋 مرحبًا بك في Dealeg! ستصلك هنا أفضل عروض التقنية.',
    privacyNote: 'بالاشتراك فإنك توافق على سياسة الخصوصية. أرسل /stop في أي وقت لإلغاء الاشتراك.',
    disclosure: 'قد يحصل Dealeg على عمولة من المتاجر الشريكة عند الشراء عبر روابطنا.',
    chooseLanguage: '🌐 اختر لغتك:',
    languageSet: '✅ تم ضبط اللغة على {lang}.',
    stopped: '🔕 تم إلغاء اشتراكك. أرسل /start لتفعيل العروض مجددًا.',
    help: 'الأوامر:\n/start – استقبال العروض\n/language – تغيير اللغة\n/deals – أحدث العروض\n/stop – إلغاء الاشتراك\n/help – هذه الرسالة',
    viewDeal: '🛒 عرض الصفقة',
    codeLabel: 'الكود',
    exclusive: '🔒 عرض حصري — افتح الصفحة لعرض الكود كاملًا',
    noDeals: 'لا توجد عروض جديدة بعد. عد قريبًا!',
  },
};

/** Lấy chuỗi theo locale, fallback 'en'. Hỗ trợ thay {lang}. */
export function t(locale: string, key: Key, vars?: Record<string, string>): string {
  const table = M[(LOCALES as readonly string[]).includes(locale) ? (locale as Locale) : 'en'];
  let s = table[key] ?? M.en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

/** Telegram language_code (vd "de-DE", "pt-BR") → locale của Dealeg, mặc định 'en'. */
export function normalizeLocale(code?: string): Locale {
  if (!code) return 'en';
  const base = code.toLowerCase().split('-')[0];
  return (LOCALES as readonly string[]).includes(base) ? (base as Locale) : 'en';
}
