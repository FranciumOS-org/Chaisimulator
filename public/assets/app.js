/* ============================================================
   مای پیکسل — منطق فروشگاه
   ============================================================ */
(function () {
'use strict';

const API = (location.protocol === 'file:') ? null : '/api';
const LS = { lang: 'mp_lang', cart: 'mp_cart', token: 'mp_token', theme: 'mp_theme' };

/* ------------------------------------------------------------------
   آیکون‌ها
------------------------------------------------------------------ */
const ICONS = {
  art:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="7" y="8" width="34" height="30" rx="3"/><circle cx="17" cy="18" r="3.2"/><path d="M9 33l9-10 6 6 8-9 8 9"/></svg>',
  figure:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="24" cy="13" r="5.2"/><path d="M14 39v-7a10 10 0 0 1 20 0v7"/><line x1="7" y1="20" x2="41" y2="20" stroke-dasharray="2 3.5"/><line x1="7" y1="27" x2="41" y2="27" stroke-dasharray="2 3.5"/></svg>',
  car:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 29l3-10a4 4 0 0 1 3.8-2.8h18.4a4 4 0 0 1 3.6 2.2l4.6 8.6v6a2 2 0 0 1-2 2h-3"/><path d="M6 29v4a2 2 0 0 0 2 2h3"/><circle cx="16" cy="33" r="3.6"/><circle cx="33" cy="33" r="3.6"/><line x1="19.6" y1="33" x2="29.4" y2="33"/></svg>',
  box:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M24 5 41 13v22L24 43 7 35V13z"/><path d="M7 13l17 8 17-8M24 21v22"/></svg>',
  grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>',
  bag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 8h16l-1.2 12.2a1.8 1.8 0 0 1-1.8 1.6H7a1.8 1.8 0 0 1-1.8-1.6z"/><path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2"/></svg>',
  truck:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1.8" y="6" width="12" height="10" rx="1.6"/><path d="M13.8 9.5h4l3 3.2V16h-7z"/><circle cx="6.2" cy="18" r="2"/><circle cx="17.4" cy="18" r="2"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 15V10a6 6 0 1 0-12 0v5l-1.6 2.6h15.2z"/><path d="M9.8 20.5a2.4 2.4 0 0 0 4.4 0"/></svg>',
  help:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M9.4 9.2a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.2-2.6 3.9"/><circle cx="12" cy="17.4" r=".9" fill="currentColor" stroke="none"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".9" fill="currentColor" stroke="none"/></svg>',
  headset:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 13a8 8 0 1 1 16 0"/><rect x="2.5" y="13" width="4" height="6" rx="2"/><rect x="17.5" y="13" width="4" height="6" rx="2"/><path d="M20 19v.6a2.4 2.4 0 0 1-2.4 2.4H13"/></svg>',
  chev:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 6 9 12 15 18"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>',
  user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c0-4.2 3.4-6.6 7.5-6.6s7.5 2.4 7.5 6.6"/></svg>',
  google:'<svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6z"/><path fill="#34A853" d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.6-2-6.5-4.8H1.7v3a11.5 11.5 0 0 0 10.3 6.4z"/><path fill="#FBBC05" d="M5.5 14.1a6.9 6.9 0 0 1 0-4.4v-3H1.7a11.5 11.5 0 0 0 0 10.4z"/><path fill="#EA4335" d="M12 5c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.5 11.5 0 0 0 1.7 6.7l3.8 3a6.9 6.9 0 0 1 6.5-4.7z"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.4l3.4 2"/></svg>',
  tg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M21 4.5 2.8 11.3l5.2 1.7 2 5.5 2.7-3.3 4.4 3.3z"/><path d="m8 13 9.6-6.6L10 15.2"/></svg>',
  ig:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor"/></svg>',
  phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 3.5h3.2l1.6 4-2 1.4a12 12 0 0 0 5.8 5.8l1.4-2 4 1.6V19a1.6 1.6 0 0 1-1.8 1.6A16.4 16.4 0 0 1 3.4 5.3 1.6 1.6 0 0 1 5 3.5z"/></svg>',
  empty:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3.5 8.5 12 4l8.5 4.5v7L12 20l-8.5-4.5z"/><path d="M3.5 8.5 12 13m0 0 8.5-4.5M12 13v7"/></svg>',
  logout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.5 4.5H6.5A2 2 0 0 0 4.5 6.5v11a2 2 0 0 0 2 2h8"/><path d="M17 8.5 20.5 12 17 15.5M20 12h-9"/></svg>'
};
const FLAG_IR = '<svg viewBox="0 0 30 20" width="19" height="13"><rect width="30" height="20" fill="#fff"/><rect width="30" height="6.67" fill="#239f40"/><rect y="13.33" width="30" height="6.67" fill="#da0000"/></svg>';
const FLAG_GB = '<svg viewBox="0 0 30 20" width="19" height="13"><rect width="30" height="20" fill="#00247d"/><path d="M0,0 L30,20 M30,0 L0,20" stroke="#fff" stroke-width="4"/><path d="M0,0 L30,20 M30,0 L0,20" stroke="#cf142b" stroke-width="1.6"/><path d="M15,0 V20 M0,10 H30" stroke="#fff" stroke-width="6.6"/><path d="M15,0 V20 M0,10 H30" stroke="#cf142b" stroke-width="4"/></svg>';

/* ------------------------------------------------------------------
   ترجمه‌ها
------------------------------------------------------------------ */
const T = {
  fa:{
    'pay_now': 'پرداخت آنلاین',
    'pay_redirect': 'داری به درگاه بانک منتقل می‌شی…',
    'pay_ok': 'پرداخت با موفقیت انجام شد',
    'ref_id': 'کد پیگیری بانک',
    'pay_cancel': 'پرداخت لغو شد',
    'pay_cancel_sub': 'از درگاه انصراف دادی. هر وقت خواستی دوباره امتحان کن.',
    'pay_fail': 'پرداخت ناموفق بود',
    'pay_fail_sub': 'اگه مبلغ از حسابت کم شده، تا ۷۲ ساعت کاری برمی‌گرده.',
    'pay_mismatch': 'مبلغ پرداختی با سفارش نمی‌خواند',
    'pay_dberror': 'پرداخت انجام شد ولی ثبت نهایی مشکل داشت',
    'pay_contact': 'لطفاً با پشتیبانی تماس بگیر و کد پیگیری سفارش رو بگو.',
    'pay_notfound': 'تراکنش پیدا نشد',
    'color_other_size': 'برای این سایز موجود نیست — سایز دیگری را امتحان کن',
    'color_sold_out': 'این رنگ کاملاً تمام شده',
    'size_out_for_color': 'این سایز برای رنگ انتخابی موجود نیست',
    'theme_to_light': 'حالت روشن',
    'theme_to_dark': 'حالت تاریک',
    'theme_light_on': 'حالت روشن فعال شد',
    'theme_dark_on': 'حالت تاریک فعال شد',
    'invoice_phone_hint': 'فاکتور اطلاعات کامل سفارش رو داره. برای دیدنش، شماره موبایلی که موقع ثبت سفارش وارد شده رو بنویس.',
    'nf_title': 'این صفحه پیدا نشد',
    'nf_sub': 'شاید آدرس اشتباه تایپ شده یا این صفحه جابه‌جا شده. از این‌جا ادامه بده:',
    'nf_search': 'دنبال چیز خاصی می‌گردی؟',
    'nav_terms': 'قوانین و مقررات',
    'last_updated': 'آخرین به‌روزرسانی',
    'terms_empty': 'هنوز متنی برای قوانین ثبت نشده.',
    'invoice': 'فاکتور',
    'view_invoice': 'مشاهده فاکتور',
    'print': 'چاپ فاکتور',
    'close': 'بستن',
    'buyer': 'خریدار',
    'product': 'کالا',
    'qty': 'تعداد',
    'unit_price': 'قیمت واحد',
    'row_total': 'جمع',
    'paid': 'پرداخت شده',
    'unpaid': 'پرداخت نشده',
    'popup_blocked': 'مرورگر پنجره را بست. اجازه باز شدن پاپ‌آپ را بده.',
    'card_number': 'شماره کارت',
    'card_holder': 'نام صاحب کارت',
    'card_hint': '۱۶ رقم، به نام خودت',
    'refund_needed': 'اطلاعات بازگشت وجه',
    'refund_optional': 'اطلاعات بازگشت وجه (اختیاری)',
    'refund_hint_paid': 'چون این سفارش پرداخت شده، برای برگرداندن وجه به شماره کارت به نام خودت نیاز داریم.',
    'refund_hint_unpaid': 'این سفارش پرداخت نشده، ولی اگر خواستی می‌تونی شماره کارت رو ثبت کنی.',
    'cancel_confirm_paid': 'با لغو سفارش، موجودی کالاها برمی‌گرده و وجه پرداختی تا ۷۲ ساعت کاری به کارتت واریز می‌شه.',
    'telegram_id': 'آیدی تلگرام (اختیاری)',
    'telegram_hint': 'برای هماهنگی سریع‌تر — بدون @ بنویس، مثل mypixel_ir',
    'need_login_orders': 'برای دیدن سفارش‌هات اول وارد حسابت شو',
    'welcome_new': 'حسابت ساخته شد — خوش اومدی!',
    'add_phone_hint': 'برای پیگیری سفارش، شماره موبایلت رو در بخش «اطلاعات من» اضافه کن',
    'google_unavailable': 'ارتباط با گوگل برقرار نشد. دوباره امتحان کن.',
    'ret_pick_items': 'کدوم کالاها رو می‌خوای مرجوع کنی؟',
    'select_all': 'انتخاب همه',
    'clear_selection': 'برداشتن انتخاب',
    'of': 'از',
    'ret_nothing_left': 'همه اقلام این سفارش قبلاً مرجوع شدن.',
    'ret_pick_first': 'حداقل یک کالا رو انتخاب کن.',
    'combo_out': 'این ترکیب موجود نیست',
    'chan_open': 'باز کردن',
    'my_orders_btn': 'سفارش‌های من',
    'searching': 'در حال جستجو…',
    'in_categories': 'دسته‌بندی‌ها',
    'in_products': 'محصولات',
    'browse_cats': 'دسته‌بندی‌ها را ببین',
    'decrease': 'کم کردن',
    'increase': 'زیاد کردن',
    'go_checkout': 'رفتن به سبد',
    'max_stock': 'بیشتر از موجودی نمی‌شه',
    'need_login_checkout': 'برای ثبت سفارش اول وارد حسابت شو',
    'need_account': 'برای ثبت سفارش وارد شو',
    'need_account_sub': 'برای پیگیری سفارش، ذخیره آدرس و مرجوعی، به یک حساب کاربری نیاز داری. ساختنش کمتر از یک دقیقه طول می‌کشه.',
    'pick_address': 'یک آدرس انتخاب یا اضافه کن',
    'phone_locked': 'شماره موبایل قابل تغییر نیست',
    'no_returns_sub': 'اگه سفارشی رو تحویل گرفتی و مشکلی داشت، از صفحه مرجوعی اقدام کن.',
    'days': 'روز',
    'cancel_order': 'لغو سفارش',
    'request_return': 'درخواست مرجوعی',
    'days_left': 'روز مانده',
    'cancel_confirm': 'با لغو سفارش، موجودی کالاها برمی‌گرده و اگه پرداخت کرده باشی وجه تا ۷۲ ساعت کاری عودت داده می‌شه.',
    'cancel_phone_hint': 'همان شماره‌ای که موقع ثبت سفارش وارد کردی',
    'cancel_reason': 'دلیل لغو (اختیاری)',
    'confirm_cancel': 'بله، لغو کن',
    'return_window_over': 'مهلت مرجوعی این سفارش گذشته.',
    'order_cancelled': 'این سفارش لغو شده.',
    'order_refunded': 'وجه این سفارش برگردانده شده.',
    'no_action_yet': 'این سفارش ارسال شده و دیگه قابل لغو نیست. بعد از تحویل می‌تونی درخواست مرجوعی بدی.',
    'nav_platforms': 'پلتفرم‌ها',
    'plat_head': 'مای پیکسل کجاها فعاله؟',
    'plat_about_default': 'مای پیکسل اشیای کلکسیونی طراحی و تولید می‌کنه؛ از تابلوهای نوری تا فیگورهای اسکن‌شده و ماشین‌های فلزی.',
    'plat_where': 'ما را کجا پیدا کنید',
    'plat_where_sub': 'علاوه بر سایت خودمون، روی این پلتفرم‌ها هم فعالیم.',
    'plat_visit': 'مشاهده غرفه',
    'plat_none': 'هنوز پلتفرمی ثبت نشده',
    'plat_none_sub': 'به‌زودی اینجا اضافه می‌شن.',
    'plat_note': 'قیمت‌ها و موجودی روی سایت خودمون همیشه به‌روزترن.',
    'nav_home': 'خانه',
    'prev_image': 'تصویر قبلی',
    'next_image': 'تصویر بعدی',
    'filters': 'فیلترها',
    'rate_1': 'خیلی بد',
    'rate_2': 'بد',
    'rate_3': 'متوسط',
    'rate_4': 'خوب',
    'rate_5': 'عالی',
    'ret_check': 'بررسی سفارش',
    'ret_need_code': 'کد پیگیری سفارش رو وارد کن',
    'ret_only_delivered': 'درخواست مرجوعی فقط برای سفارش‌هایی ثبت می‌شه که تحویل داده شدن. اول کد پیگیری رو وارد کن تا وضعیت سفارش رو بررسی کنیم.',
    'ret_eligible': 'این سفارش قابل مرجوع کردنه — {d} روز فرصت داری.',
    'ret_no_delivered': 'وضعیت این سفارش «{s}» هست. مرجوعی فقط بعد از تحویل ممکنه.',
    'ret_no_expired': 'مهلت {d} روزه مرجوعی این سفارش گذشته.',
    'ret_no_dup': 'برای این سفارش یه درخواست مرجوعی باز داری. صبر کن تا بررسی بشه.',
    'ret_items': 'اقلام این سفارش',
    'recent_searches': 'جستجوهای اخیر',
    'clear_all': 'پاک کردن همه',
    'search_results': 'نتایج',
    'wish_add': 'افزودن به علاقه‌مندی',
    'wish_remove': 'حذف از علاقه‌مندی',
    'wish_added': 'به علاقه‌مندی‌ها اضافه شد',
    'wish_removed': 'از علاقه‌مندی‌ها حذف شد',
    'wish_login_hint': 'برای ذخیره دائمی وارد حسابت شو',
    'wish_empty': 'لیست علاقه‌مندی خالیه',
    'wish_empty_sub': 'روی قلب هر محصولی بزنی، اینجا ذخیره می‌شه.',
    'wish_need_login': 'برای دیدن علاقه‌مندی‌ها باید وارد حسابت بشی.',
    'share': 'اشتراک‌گذاری',
    'copy': 'کپی',
    'copied': 'کپی شد',
    'link_copied': 'لینک کپی شد',
    'insta_copied': 'لینک کپی شد — توی استوری یا دایرکت بذارش',
    'pick_size': 'سایز:',
    'pick_color': 'رنگ:',
    'stock_left': 'موجودی',
    'warranty_title': 'گارانتی اصالت و سلامت فیزیکی کالا',
    'warranty_sub': 'اگه کالا اصل نبود یا آسیب‌دیده رسید، بدون سوال مرجوع می‌شه.',
    'pros': 'نقاط قوت',
    'cons': 'نقاط ضعف',
    'one_per_line': 'هر مورد در یک خط',
    'reviews_eyebrow': 'نظر خریدارها',
    'reviews_title': 'دیدگاه‌ها و امتیازها',
    'reviews_word': 'دیدگاه',
    'see_reviews': 'دیدن دیدگاه‌ها',
    'no_rating': 'هنوز امتیازی ثبت نشده',
    'from': 'از',
    'based_on': 'بر اساس',
    'buyer_reviews': 'دیدگاه خریدار',
    'verified_buyer': 'خریدار تاییدشده',
    'no_reviews': 'هنوز دیدگاهی ثبت نشده',
    'be_first': 'اولین نفری باش که نظرش رو می‌نویسه.',
    'write_review': 'دیدگاهت رو بنویس',
    'your_rating': 'امتیاز تو',
    'your_review': 'نظر کلی',
    'review_ph': 'تجربه‌ات از این محصول چطور بود؟',
    'pros_ph': 'مثلاً: کیفیت چاپ عالی بود',
    'cons_ph': 'مثلاً: بسته‌بندی می‌تونست بهتر باشه',
    'send_review': 'ثبت دیدگاه',
    'review_need_login': 'برای ثبت دیدگاه باید حساب کاربری داشته باشی.',
    'already_reviewed': 'قبلاً برای این محصول دیدگاه ثبت کردی.',
    'buyer_can_rate': 'چون این محصول رو خریدی، می‌تونی امتیاز و نقاط قوت و ضعف هم بدی.',
    'nonbuyer_note': 'فقط خریداران این محصول می‌تونن امتیاز و نقاط قوت/ضعف ثبت کنن. تو می‌تونی نظر عمومی بذاری.',
    'review_too_short': 'متن دیدگاه خیلی کوتاهه',
    'review_deleted': 'دیدگاه حذف شد',
    'shop_reply': 'پاسخ فروشگاه',
    'pending_review': 'در انتظار تایید',
    'published': 'منتشر شده',
    'rejected': 'رد شده',
    'login_register': 'ورود یا ثبت‌نام',
    'delete': 'حذف',
    'edit': 'ویرایش',
    'cancel': 'انصراف',
    'save': 'ذخیره',
    'save_changes': 'ذخیره تغییرات',
    'saved': 'ذخیره شد',
    'err_generic': 'یه مشکلی پیش اومد',
    'back_to_products': 'برگشت به محصولات',
    'not_found': 'محصول پیدا نشد',
    'not_found_sub': 'شاید حذف شده یا آدرس اشتباهه.',
    'limited': 'محدود',
    'delivery_address': 'آدرس تحویل',
    'payment_method': 'روش پرداخت',
    'order_note': 'یادداشت سفارش',
    'note_ph': 'اگه نکته‌ای هست بنویس (اختیاری)',
    'order_summary': 'خلاصه سفارش',
    'subtotal': 'جمع کالاها',
    'discount': 'تخفیف',
    'shipping': 'هزینه ارسال',
    'tax': 'مالیات',
    'payable': 'قابل پرداخت',
    'place_order': 'ثبت نهایی سفارش',
    'checkout_hint': 'با ثبت سفارش، قوانین فروشگاه رو می‌پذیری.',
    'coupon_ph': 'کد تخفیف داری؟',
    'apply': 'اعمال',
    'coupon_ok': 'کد اعمال شد —',
    'coupon_bad': 'کد تخفیف معتبر نیست',
    'no_gateway': 'فعلاً درگاه پرداختی فعال نیست.',
    'order_placed': 'سفارشت ثبت شد',
    'order_placed_sub': 'کد پیگیری زیر رو نگه دار تا وضعیت سفارش رو دنبال کنی.',
    'save_code': 'این کد رو یادداشت کن یا اسکرین‌شات بگیر.',
    'track_order': 'پیگیری سفارش',
    'continue_shopping': 'ادامه خرید',
    'add_address': 'افزودن آدرس جدید',
    'edit_address': 'ویرایش آدرس',
    'addr_title': 'عنوان آدرس',
    'my_address': 'آدرس من',
    'province': 'استان',
    'pick_province': 'استان رو انتخاب کن',
    'city': 'شهر',
    'full_address': 'آدرس کامل',
    'addr_ph': 'خیابان، محله و نشانی دقیق',
    'street': 'کوچه',
    'plaque': 'پلاک',
    'unit': 'واحد',
    'plaque_unit': 'پلاک و واحد',
    'postal': 'کد پستی',
    'who_receives': 'تحویل‌گیرنده چه کسی هست؟',
    'myself': 'خودم',
    'someone_else': 'شخص دیگری',
    'receiver_name': 'نام و نام خانوادگی تحویل‌گیرنده',
    'receiver_phone': 'شماره تماس تحویل‌گیرنده',
    'set_default': 'آدرس پیش‌فرض من باشه',
    'default': 'پیش‌فرض',
    'addr_added': 'آدرس اضافه شد',
    'addr_updated': 'آدرس به‌روز شد',
    'addr_deleted': 'آدرس حذف شد',
    'confirm_del_addr': 'این آدرس حذف بشه؟',
    'no_address': 'هنوز آدرسی ثبت نکردی',
    'no_address_sub': 'برای تکمیل سفارش حداقل یک آدرس لازمه.',
    'tab_profile': 'اطلاعات من',
    'tab_orders': 'سفارش‌ها',
    'tab_addresses': 'آدرس‌ها',
    'tab_wishlist': 'علاقه‌مندی‌ها',
    'tab_reviews': 'دیدگاه‌های من',
    'tab_returns': 'مرجوعی‌ها',
    'personal_info': 'اطلاعات شخصی',
    'first_name': 'نام',
    'last_name': 'نام خانوادگی',
    'email': 'ایمیل',
    'phone': 'شماره موبایل',
    'no_orders': 'هنوز سفارشی ثبت نکردی',
    'start_shopping': 'شروع خرید',
    'no_my_reviews': 'هنوز دیدگاهی ننوشتی',
    'no_returns': 'درخواست مرجوعی نداری',
    'new_return': 'ثبت درخواست مرجوعی',
    'admin_note': 'یادداشت پشتیبانی',
    'nav_returns': 'قوانین مرجوعی',
    'nav_shipping': 'اطلاعات حمل و نقل',
    'ret_window': 'مهلت مرجوعی',
    'ret_window_body': 'تا {d} روز بعد از تحویل می‌تونی درخواست مرجوعی بدی.',
    'ret_condition': 'شرایط کالا',
    'ret_condition_body': 'کالا باید در بسته‌بندی اصلی و بدون آسیب باشه.',
    'ret_refund': 'بازگشت وجه',
    'ret_refund_body': 'بعد از تایید کارشناس، وجه تا ۷۲ ساعت کاری برمی‌گرده.',
    'ret_rules': 'قوانین مرجوعی',
    'ret_submit': 'ثبت درخواست مرجوعی',
    'ret_r1': 'کالا باید همراه فاکتور و بسته‌بندی اصلی برگردانده شود.',
    'ret_r2': 'کالاهای سفارشی‌سازی‌شده مرجوع نمی‌شوند.',
    'ret_r3': 'اگر کالا معیوب یا اشتباه ارسال شده باشد، هزینه ارسال با ماست.',
    'ret_r4': 'در صورت انصراف، هزینه رفت و برگشت با خریدار است.',
    'ret_r5': 'بعد از تایید درخواست، کد رهگیری پستی را برای ما بفرست.',
    'tracking_code': 'کد پیگیری سفارش',
    'ret_reason': 'دلیل مرجوعی',
    'ret_desc': 'توضیحات',
    'ret_desc_ph': 'اگه توضیحی داری بنویس',
    'ret_send': 'ارسال درخواست',
    'ret_defective': 'کالا معیوب یا شکسته بود',
    'ret_wrong': 'کالای اشتباه ارسال شد',
    'ret_notdesc': 'با توضیحات سایت مطابقت نداشت',
    'ret_mind': 'منصرف شدم',
    'ret_other': 'دلیل دیگر',
    'ship_post': 'پست پیشتاز',
    'ship_post_body': 'ارسال به سراسر ایران، معمولاً ۲ تا ۴ روز کاری.',
    'ship_tipax': 'تیپاکس',
    'ship_tipax_body': 'برای بسته‌های بزرگ و شکستنی، با بیمه و تحویل درب منزل.',
    'ship_code': 'کد رهگیری',
    'ship_code_body': 'بعد از ارسال، کد رهگیری پستی در صفحه پیگیری سفارش قرار می‌گیره.',
    'ship_costs': 'هزینه‌های ارسال',
    'ship_flat': 'هزینه ثابت ارسال',
    'ship_free_from': 'ارسال رایگان از',
    'ship_carriers': 'سرویس‌های ارسال',
    'badge_soon': 'به‌زودی',
    account:'حساب کاربری', search_ph:'دنبال چی می‌گردی؟',
    nav_categories:'دسته‌بندی‌ها', nav_products:'محصولات', nav_track:'پیگیری سفارش',
    nav_ann:'اطلاعیه‌ها', nav_faq:'سوالات متداول', nav_about:'درباره ما', nav_support:'پشتیبانی',
    panel_group_shop:'فروشگاه', panel_group_help:'راهنما و پشتیبانی',
    panel_foot:'مای پیکسل — اشیای دیجیتال، در دنیای واقعی.',
    hero_eyebrow:'فروشگاه اشیای کالکشنی', hero_title:'از <span style="color:var(--cyan)">پیکسل</span> تا واقعیت',
    hero_sub:'تابلوهای طرح‌دار، فیگورهای اسکن‌شده و ماشین‌های فلزی کالکشنی؛ اشیای خاص برای فضایی که دوستش داری.',
    hero_cta1:'دیدن محصولات', hero_cta2:'درباره مای پیکسل',
    featured_eyebrow:'محصولات ویژه', featured_title:'انتخاب‌های این هفته', featured_sub:'چیزهایی که بیشتر از بقیه دیده و خریده شدن.',
    see_all:'همه محصولات ←', see_all_cats:'همه دسته‌بندی‌ها ←',
    cat_eyebrow:'دسته‌بندی‌ها', cat_title:'از کجا شروع کنیم؟',
    cat_page_title:'دنیای مای پیکسل', cat_page_sub:'هر دسته یه قفسه‌ی جداست. روی هرکدوم بزنی محصولاتش فیلتر می‌شه.',
    prod_eyebrow:'فروشگاه', prod_page_title:'همه محصولات',
    sort_by:'مرتب‌سازی', sort_newest:'جدیدترین', sort_popular:'پرفروش‌ترین', sort_cheap:'ارزان‌ترین',
    sort_expensive:'گران‌ترین', sort_name:'حروف الفبا', price_max:'تا قیمت', in_stock_only:'فقط موجود',
    reset_filters:'پاک کردن فیلترها', all:'همه',
    add_to_cart:'افزودن به سبد', out_of_stock:'ناموجود', view:'مشاهده', product_count:'محصول',
    off:'تخفیف', new_tag:'جدید', toman:'تومان', free:'رایگان',
    track_eyebrow:'پیگیری سفارش', track_title:'سفارشت کجاست؟',
    track_sub:'کد پیگیری‌ای که موقع ثبت سفارش گرفتی رو وارد کن تا وضعیت لحظه‌ایش رو ببینی.',
    track_ph:'مثلاً MP-A7K2X9QP', track_btn:'پیگیری',
    track_recipient:'گیرنده', track_city:'شهر', track_total:'مبلغ کل', track_post:'کد رهگیری پست',
    track_items:'اقلام سفارش', track_history:'مسیر سفارش', track_placed:'تاریخ ثبت',
    faq_eyebrow:'راهنما', faq_title:'سوالات متداول', faq_sub:'اگه جوابت اینجا نبود، از بخش پشتیبانی بهمون پیام بده.',
    ann_eyebrow:'اطلاعیه‌ها', ann_title:'تازه‌ها و اطلاعیه‌ها', ann_sub:'خبرهای فروشگاه، تخفیف‌ها و تغییرات ارسال اینجا اعلام می‌شه.',
    pinned:'مهم',
    about_eyebrow:'درباره ما', about_title:'مای پیکسل چیه؟',
    support_eyebrow:'پشتیبانی', support_title:'کمک می‌خوای؟',
    support_sub:'سریع‌ترین راه تلگرامه. اگه درباره سفارشته، کد پیگیری رو هم بفرست.',
    support_before_t:'قبل از پیام دادن',
    cart_title:'سبد خرید', cart_empty:'سبد خریدت خالیه', cart_empty_sub:'یه سر به محصولات بزن.',
    cart_subtotal:'جمع سبد', cart_shipping:'هزینه ارسال', cart_total:'قابل پرداخت', cart_checkout:'ادامه و ثبت سفارش',
    tab_login:'ورود', tab_register:'ثبت‌نام',
    auth_title_login:'خوش برگشتی', auth_sub_login:'شماره موبایلت رو وارد کن تا کد بفرستیم.',
    auth_title_register:'ساخت حساب', auth_sub_register:'چند ثانیه بیشتر طول نمی‌کشه.',
    ph_first:'نام', ph_last:'نام خانوادگی', ph_phone:'شماره موبایل',
    next_step:'مرحله بعد', verify_title:'کد تایید', verify_sub:'کد پنج‌رقمی که پیامک شد رو وارد کن:',
    verify_btn:'تایید و ورود', resend:'ارسال دوباره', back:'برگشت',
    or:'یا', google_login:'ورود با گوگل',
    my_orders:'سفارش‌های من', my_profile:'اطلاعات حساب', logout:'خروج از حساب', soon:'به‌زودی',
    hello:'سلام', no_results:'چیزی پیدا نشد', no_results_sub:'یه عبارت دیگه امتحان کن.',
    search_all:'دیدن همه نتایج برای', products_found:'محصول پیدا شد',
    toast_added:'به سبد اضافه شد', toast_soon:'این بخش هنوز آماده نیست — به‌زودی!',
    toast_logout:'از حساب خارج شدی', toast_login:'خوش اومدی!', toast_offline:'ارتباط با سرور برقرار نشد',
    err_generic:'یه مشکلی پیش اومد. دوباره امتحان کن.',
    foot_col1:'فروشگاه', foot_col2:'راهنما', foot_col3:'ارتباط',
    foot_ig:'اینستاگرام', foot_tg:'تلگرام', foot_tagline:'اشیای دیجیتال، در دنیای واقعی.',
    foot_copy:'© ۱۴۰۵ مای پیکسل. تمامی حقوق محفوظ است.',
    about_lead:'مای پیکسل جاییه که ایده‌های دیجیتال به اشیای واقعی تبدیل می‌شن؛ برای کسایی که دنبال کالکشن‌هایی متفاوت از همیشه‌ان.',
    about_c1_t:'از اسکن تا قفسه', about_c1_d:'مدل‌ها با اسکنر سه‌بعدی گرفته می‌شن، رزینی پرینت می‌شن و آخرش با دست رنگ می‌خورن.',
    about_c2_t:'تعداد محدود', about_c2_d:'هر مدل در تیراژ کم تولید می‌شه. وقتی تموم شد، دوباره تولید نمی‌شه.',
    about_c3_t:'پرداخت و ارسال امن', about_c3_d:'پرداخت از درگاه بانکی و بسته‌بندی ضدضربه؛ کد پیگیری هم لحظه‌ای به‌روز می‌شه.',
    about_story_t:'چطور شروع شد',
    about_story_1:'شروعش یه اسکنر سه‌بعدی بود و چند تا فیگور که فقط برای خودمون ساختیم. کم‌کم دوستا سفارش دادن، بعد دوستِ دوستا، و آخرش شد یه فروشگاه.',
    about_story_2:'الان روی سه چیز تمرکز داریم: تابلوهای طرح‌دار، فیگورهای اسکن‌شده و ماشین‌های فلزی کالکشنی. هر کدوم رو خودمون قبل از ارسال چک می‌کنیم.',
    about_contact_t:'راه ارتباطی',
    about_contact_1:'اگه سوالی داری یا دنبال یه مدل خاصی می‌گردی، از بخش پشتیبانی پیام بده. معمولاً همون روز جواب می‌دیم.',
    sup_tg_t:'تلگرام', sup_tg_d:'سریع‌ترین راه. معمولاً زیر یک ساعت جواب می‌دیم.',
    sup_ig_t:'اینستاگرام', sup_ig_d:'عکس محصولات و کارهای جدید اینجاست.',
    sup_phone_t:'تماس تلفنی', sup_phone_d:'در ساعت‌های کاری پاسخگوییم.',
    sup_hours_t:'ساعت کاری', sup_hours_d:'شنبه تا چهارشنبه، ۱۰ تا ۱۸'
  },
  en:{
    'pay_now': 'Pay online',
    'pay_redirect': 'Redirecting you to the bank…',
    'pay_ok': 'Payment successful',
    'ref_id': 'Bank reference',
    'pay_cancel': 'Payment cancelled',
    'pay_cancel_sub': 'You cancelled at the gateway. You can try again anytime.',
    'pay_fail': 'Payment failed',
    'pay_fail_sub': 'If the amount was deducted, it returns within 72 business hours.',
    'pay_mismatch': 'Paid amount does not match the order',
    'pay_dberror': 'Payment went through but recording it failed',
    'pay_contact': 'Please contact support with your order tracking code.',
    'pay_notfound': 'Transaction not found',
    'color_other_size': 'Not available in this size — try another size',
    'color_sold_out': 'This colour is sold out',
    'size_out_for_color': 'Not available in the selected colour',
    'theme_to_light': 'Light mode',
    'theme_to_dark': 'Dark mode',
    'theme_light_on': 'Light mode on',
    'theme_dark_on': 'Dark mode on',
    'invoice_phone_hint': 'The invoice contains full order details. Enter the mobile number used when placing the order.',
    'nf_title': 'Page not found',
    'nf_sub': 'The address may be mistyped or this page has moved. Continue from here:',
    'nf_search': 'Looking for something specific?',
    'nav_terms': 'Terms and conditions',
    'last_updated': 'Last updated',
    'terms_empty': 'No terms have been published yet.',
    'invoice': 'Invoice',
    'view_invoice': 'View invoice',
    'print': 'Print invoice',
    'close': 'Close',
    'buyer': 'Buyer',
    'product': 'Item',
    'qty': 'Qty',
    'unit_price': 'Unit price',
    'row_total': 'Total',
    'paid': 'Paid',
    'unpaid': 'Unpaid',
    'popup_blocked': 'Your browser blocked the window. Allow pop-ups.',
    'card_number': 'Card number',
    'card_holder': 'Cardholder name',
    'card_hint': '16 digits, in your own name',
    'refund_needed': 'Refund details',
    'refund_optional': 'Refund details (optional)',
    'refund_hint_paid': 'This order was paid, so we need a card number in your own name to refund it.',
    'refund_hint_unpaid': 'This order was not paid, but you may still add a card number.',
    'cancel_confirm_paid': 'Cancelling restores stock and your payment is refunded to your card within 72 business hours.',
    'telegram_id': 'Telegram ID (optional)',
    'telegram_hint': 'For faster follow-up — without @, e.g. mypixel_ir',
    'need_login_orders': 'Sign in to see your orders',
    'welcome_new': 'Your account is ready — welcome!',
    'add_phone_hint': 'Add your mobile number under "My info" so you can track orders',
    'google_unavailable': 'Could not reach Google. Please try again.',
    'ret_pick_items': 'Which items do you want to return?',
    'select_all': 'Select all',
    'clear_selection': 'Clear selection',
    'of': 'of',
    'ret_nothing_left': 'All items in this order have already been returned.',
    'ret_pick_first': 'Pick at least one item.',
    'combo_out': 'This combination is out of stock',
    'chan_open': 'Open',
    'my_orders_btn': 'My orders',
    'searching': 'Searching…',
    'in_categories': 'Categories',
    'in_products': 'Products',
    'browse_cats': 'Browse categories',
    'decrease': 'Decrease',
    'increase': 'Increase',
    'go_checkout': 'Go to cart',
    'max_stock': 'That is all we have in stock',
    'need_login_checkout': 'Sign in first to place an order',
    'need_account': 'Sign in to place your order',
    'need_account_sub': 'You need an account to track orders, save addresses and request returns. It takes less than a minute.',
    'pick_address': 'Pick or add an address',
    'phone_locked': 'Mobile number cannot be changed',
    'no_returns_sub': 'If something was wrong with a delivered order, start a return.',
    'days': 'days',
    'cancel_order': 'Cancel order',
    'request_return': 'Request a return',
    'days_left': 'days left',
    'cancel_confirm': 'Cancelling restores stock, and any payment is refunded within 72 business hours.',
    'cancel_phone_hint': 'The number you used when ordering',
    'cancel_reason': 'Reason (optional)',
    'confirm_cancel': 'Yes, cancel it',
    'return_window_over': 'The return window for this order has passed.',
    'order_cancelled': 'This order was cancelled.',
    'order_refunded': 'This order has been refunded.',
    'no_action_yet': 'This order has shipped and can no longer be cancelled. You can request a return after delivery.',
    'nav_platforms': 'Platforms',
    'plat_head': 'Where you can find My Pixel',
    'plat_about_default': 'My Pixel designs and makes collectible objects — from LED wall art to 3D-scanned figures and die-cast cars.',
    'plat_where': 'Find us here',
    'plat_where_sub': 'Besides our own shop, we are active on these marketplaces.',
    'plat_visit': 'Visit store',
    'plat_none': 'No platform listed yet',
    'plat_none_sub': 'They will show up here soon.',
    'plat_note': 'Prices and stock are always most up to date on our own site.',
    'nav_home': 'Home',
    'prev_image': 'Previous image',
    'next_image': 'Next image',
    'filters': 'Filters',
    'rate_1': 'Terrible',
    'rate_2': 'Poor',
    'rate_3': 'Okay',
    'rate_4': 'Good',
    'rate_5': 'Excellent',
    'ret_check': 'Check order',
    'ret_need_code': 'Enter your order tracking code',
    'ret_only_delivered': 'Returns can only be requested for delivered orders. Enter your tracking code so we can check the order status first.',
    'ret_eligible': 'This order is eligible — you have {d} days left.',
    'ret_no_delivered': 'This order is "{s}". Returns are only possible after delivery.',
    'ret_no_expired': 'The {d}-day return window for this order has passed.',
    'ret_no_dup': 'You already have an open return request for this order.',
    'ret_items': 'Items in this order',
    'recent_searches': 'Recent searches',
    'clear_all': 'Clear all',
    'search_results': 'Results',
    'wish_add': 'Add to wishlist',
    'wish_remove': 'Remove from wishlist',
    'wish_added': 'Added to wishlist',
    'wish_removed': 'Removed from wishlist',
    'wish_login_hint': 'Sign in to save it permanently',
    'wish_empty': 'Your wishlist is empty',
    'wish_empty_sub': 'Tap the heart on any product to save it here.',
    'wish_need_login': 'Sign in to see your wishlist.',
    'share': 'Share',
    'copy': 'Copy',
    'copied': 'Copied',
    'link_copied': 'Link copied',
    'insta_copied': 'Link copied — paste it in your story or DM',
    'pick_size': 'Size:',
    'pick_color': 'Color:',
    'stock_left': 'In stock',
    'warranty_title': 'Authenticity and condition guarantee',
    'warranty_sub': 'If it is not genuine or arrives damaged, we take it back — no questions.',
    'pros': 'Pros',
    'cons': 'Cons',
    'one_per_line': 'one per line',
    'reviews_eyebrow': 'Buyer feedback',
    'reviews_title': 'Reviews and ratings',
    'reviews_word': 'reviews',
    'see_reviews': 'See reviews',
    'no_rating': 'No ratings yet',
    'from': 'from',
    'based_on': 'Based on',
    'buyer_reviews': 'buyer reviews',
    'verified_buyer': 'Verified buyer',
    'no_reviews': 'No reviews yet',
    'be_first': 'Be the first to write one.',
    'write_review': 'Write a review',
    'your_rating': 'Your rating',
    'your_review': 'Your review',
    'review_ph': 'How was your experience with this product?',
    'pros_ph': 'e.g. Print quality was excellent',
    'cons_ph': 'e.g. Packaging could be better',
    'send_review': 'Submit review',
    'review_need_login': 'You need an account to write a review.',
    'already_reviewed': 'You already reviewed this product.',
    'buyer_can_rate': 'Since you bought this, you can also rate it and list pros and cons.',
    'nonbuyer_note': 'Only buyers can rate and list pros and cons. You can still leave a general comment.',
    'review_too_short': 'Your review is too short',
    'review_deleted': 'Review deleted',
    'shop_reply': 'Shop reply',
    'pending_review': 'Pending',
    'published': 'Published',
    'rejected': 'Rejected',
    'login_register': 'Sign in or register',
    'delete': 'Delete',
    'edit': 'Edit',
    'cancel': 'Cancel',
    'save': 'Save',
    'save_changes': 'Save changes',
    'saved': 'Saved',
    'err_generic': 'Something went wrong',
    'back_to_products': 'Back to products',
    'not_found': 'Product not found',
    'not_found_sub': 'It may have been removed or the link is wrong.',
    'limited': 'Limited',
    'delivery_address': 'Delivery address',
    'payment_method': 'Payment method',
    'order_note': 'Order note',
    'note_ph': 'Anything we should know? (optional)',
    'order_summary': 'Order summary',
    'subtotal': 'Subtotal',
    'discount': 'Discount',
    'shipping': 'Shipping',
    'tax': 'Tax',
    'payable': 'Total',
    'place_order': 'Place order',
    'checkout_hint': 'By placing the order you accept our terms.',
    'coupon_ph': 'Have a coupon?',
    'apply': 'Apply',
    'coupon_ok': 'Coupon applied —',
    'coupon_bad': 'Invalid coupon',
    'no_gateway': 'No payment gateway is active yet.',
    'order_placed': 'Order placed',
    'order_placed_sub': 'Keep the tracking code below to follow your order.',
    'save_code': 'Write it down or take a screenshot.',
    'track_order': 'Track order',
    'continue_shopping': 'Continue shopping',
    'add_address': 'Add new address',
    'edit_address': 'Edit address',
    'addr_title': 'Address label',
    'my_address': 'My address',
    'province': 'Province',
    'pick_province': 'Select a province',
    'city': 'City',
    'full_address': 'Full address',
    'addr_ph': 'Street, district and exact address',
    'street': 'Alley',
    'plaque': 'No.',
    'unit': 'Unit',
    'plaque_unit': 'No. and unit',
    'postal': 'Postal code',
    'who_receives': 'Who is receiving this order?',
    'myself': 'Myself',
    'someone_else': 'Someone else',
    'receiver_name': 'Receiver full name',
    'receiver_phone': 'Receiver phone',
    'set_default': 'Make this my default address',
    'default': 'Default',
    'addr_added': 'Address added',
    'addr_updated': 'Address updated',
    'addr_deleted': 'Address deleted',
    'confirm_del_addr': 'Delete this address?',
    'no_address': 'No address saved yet',
    'no_address_sub': 'You need at least one address to check out.',
    'tab_profile': 'My info',
    'tab_orders': 'Orders',
    'tab_addresses': 'Addresses',
    'tab_wishlist': 'Wishlist',
    'tab_reviews': 'My reviews',
    'tab_returns': 'Returns',
    'personal_info': 'Personal info',
    'first_name': 'First name',
    'last_name': 'Last name',
    'email': 'Email',
    'phone': 'Mobile',
    'no_orders': 'No orders yet',
    'start_shopping': 'Start shopping',
    'no_my_reviews': 'You have not written any review',
    'no_returns': 'No return requests',
    'new_return': 'Request a return',
    'admin_note': 'Support note',
    'nav_returns': 'Return policy',
    'nav_shipping': 'Shipping info',
    'ret_window': 'Return window',
    'ret_window_body': 'You can request a return up to {d} days after delivery.',
    'ret_condition': 'Item condition',
    'ret_condition_body': 'The item must be in its original packaging and undamaged.',
    'ret_refund': 'Refund',
    'ret_refund_body': 'After approval, the refund is issued within 72 business hours.',
    'ret_rules': 'Return rules',
    'ret_submit': 'Submit a return request',
    'ret_r1': 'The item must be returned with its invoice and original packaging.',
    'ret_r2': 'Customized items cannot be returned.',
    'ret_r3': 'If the item is defective or wrong, we cover the shipping cost.',
    'ret_r4': 'For a change of mind, the buyer covers both-way shipping.',
    'ret_r5': 'After approval, send us the postal tracking code.',
    'tracking_code': 'Order tracking code',
    'ret_reason': 'Reason',
    'ret_desc': 'Description',
    'ret_desc_ph': 'Add any detail you want',
    'ret_send': 'Send request',
    'ret_defective': 'Item was defective or broken',
    'ret_wrong': 'Wrong item was sent',
    'ret_notdesc': 'Did not match the description',
    'ret_mind': 'Changed my mind',
    'ret_other': 'Other reason',
    'ship_post': 'Express Post',
    'ship_post_body': 'Nationwide delivery, usually 2 to 4 business days.',
    'ship_tipax': 'Tipax',
    'ship_tipax_body': 'For large or fragile parcels, insured and delivered to your door.',
    'ship_code': 'Tracking code',
    'ship_code_body': 'Once shipped, the postal tracking code appears on the order tracking page.',
    'ship_costs': 'Shipping costs',
    'ship_flat': 'Flat shipping fee',
    'ship_free_from': 'Free shipping from',
    'ship_carriers': 'Carriers',
    'badge_soon': 'Coming soon',
    account:'Account', search_ph:'What are you looking for?',
    nav_categories:'Categories', nav_products:'Products', nav_track:'Track Order',
    nav_ann:'Announcements', nav_faq:'FAQ', nav_about:'About Us', nav_support:'Support',
    panel_group_shop:'Shop', panel_group_help:'Help & Support',
    panel_foot:'MY PIXEL — digital objects, in the real world.',
    hero_eyebrow:'Collectible Objects Store', hero_title:'From <span style="color:var(--cyan)">Pixel</span> to Reality',
    hero_sub:'Wall art, scanned figures and collectible metal cars — distinctive pieces for a space you love.',
    hero_cta1:'Browse Products', hero_cta2:'About My Pixel',
    featured_eyebrow:'Featured', featured_title:'This Week\u2019s Picks', featured_sub:'The pieces people are viewing and buying most.',
    see_all:'All products →', see_all_cats:'All categories →',
    cat_eyebrow:'Categories', cat_title:'Where to start?',
    cat_page_title:'The My Pixel World', cat_page_sub:'Each category is its own shelf. Tap one to filter its products.',
    prod_eyebrow:'Shop', prod_page_title:'All Products',
    sort_by:'Sort', sort_newest:'Newest', sort_popular:'Best selling', sort_cheap:'Price: low to high',
    sort_expensive:'Price: high to low', sort_name:'Alphabetical', price_max:'Max price', in_stock_only:'In stock only',
    reset_filters:'Clear filters', all:'All',
    add_to_cart:'Add to cart', out_of_stock:'Out of stock', view:'View', product_count:'products',
    off:'Sale', new_tag:'New', toman:'Toman', free:'Free',
    track_eyebrow:'Track Order', track_title:'Where is your order?',
    track_sub:'Enter the tracking code you received at checkout to see its live status.',
    track_ph:'e.g. MP-A7K2X9QP', track_btn:'Track',
    track_recipient:'Recipient', track_city:'City', track_total:'Total', track_post:'Post tracking',
    track_items:'Items', track_history:'Order journey', track_placed:'Placed on',
    faq_eyebrow:'Help', faq_title:'Frequently Asked Questions', faq_sub:'If your answer isn\u2019t here, message us from Support.',
    ann_eyebrow:'Announcements', ann_title:'News & Announcements', ann_sub:'Store news, discounts and shipping changes go here.',
    pinned:'Pinned',
    about_eyebrow:'About Us', about_title:'What is My Pixel?',
    support_eyebrow:'Support', support_title:'Need a hand?',
    support_sub:'Telegram is fastest. If it\u2019s about an order, include your tracking code.',
    support_before_t:'Before you message',
    cart_title:'Cart', cart_empty:'Your cart is empty', cart_empty_sub:'Take a look at the products.',
    cart_subtotal:'Subtotal', cart_shipping:'Shipping', cart_total:'Total', cart_checkout:'Continue to checkout',
    tab_login:'Sign in', tab_register:'Sign up',
    auth_title_login:'Welcome back', auth_sub_login:'Enter your mobile number and we\u2019ll text you a code.',
    auth_title_register:'Create account', auth_sub_register:'Takes just a few seconds.',
    ph_first:'First name', ph_last:'Last name', ph_phone:'Mobile number',
    next_step:'Next step', verify_title:'Verification code', verify_sub:'Enter the 5-digit code we texted you:',
    verify_btn:'Verify and sign in', resend:'Resend', back:'Back',
    or:'or', google_login:'Continue with Google',
    my_orders:'My orders', my_profile:'Account details', logout:'Sign out', soon:'Soon',
    hello:'Hi', no_results:'Nothing found', no_results_sub:'Try a different phrase.',
    search_all:'See all results for', products_found:'products found',
    toast_added:'Added to cart', toast_soon:'This part isn\u2019t ready yet — coming soon!',
    toast_logout:'Signed out', toast_login:'Welcome!', toast_offline:'Couldn\u2019t reach the server',
    err_generic:'Something went wrong. Try again.',
    foot_col1:'Shop', foot_col2:'Help', foot_col3:'Connect',
    foot_ig:'Instagram', foot_tg:'Telegram', foot_tagline:'Digital objects, in the real world.',
    foot_copy:'© 2026 My Pixel. All rights reserved.',
    about_lead:'My Pixel is where digital ideas become real objects — for people after collections that break from the usual.',
    about_c1_t:'From scan to shelf', about_c1_d:'Models are 3D-scanned, resin-printed, then hand-painted.',
    about_c2_t:'Limited runs', about_c2_d:'Every model is made in small batches. When it sells out, it\u2019s gone.',
    about_c3_t:'Safe payment & shipping', about_c3_d:'Bank gateway payment, shock-proof packing, and live tracking updates.',
    about_story_t:'How it started',
    about_story_1:'It began with a 3D scanner and a few figures we made for ourselves. Friends started ordering, then friends of friends — and it became a store.',
    about_story_2:'Today we focus on three things: wall art, scanned figures and collectible metal cars. Every piece is checked by hand before it ships.',
    about_contact_t:'Getting in touch',
    about_contact_1:'Questions, or hunting for a specific model? Message us from Support — we usually reply the same day.',
    sup_tg_t:'Telegram', sup_tg_d:'Fastest route. Usually answered within the hour.',
    sup_ig_t:'Instagram', sup_ig_d:'Product photos and new work land here first.',
    sup_phone_t:'Phone', sup_phone_d:'Reachable during working hours.',
    sup_hours_t:'Working hours', sup_hours_d:'Sat–Wed, 10:00–18:00'
  }
};

const STATUS_LABEL = {
  fa:{pending:'در انتظار پرداخت',paid:'پرداخت شد',processing:'در حال آماده‌سازی',packed:'بسته‌بندی شد',
      shipped:'ارسال شد',delivered:'تحویل داده شد',cancelled:'لغو شد',refunded:'مرجوع شد'},
  en:{pending:'Awaiting payment',paid:'Paid',processing:'Preparing',packed:'Packed',
      shipped:'Shipped',delivered:'Delivered',cancelled:'Cancelled',refunded:'Refunded'}
};

/* ------------------------------------------------------------------
   داده‌ی نمایشی (وقتی سرور در دسترس نیست)
------------------------------------------------------------------ */
const DEMO = {
  categories:[
    {id:1,slug:'wall-art',name_fa:'تابلو',name_en:'Wall Art',icon:'art',product_count:2,
     desc_fa:'طرح‌های خاص و باکیفیت برای دیوارهای خاص.',desc_en:'Distinctive, high-quality designs for distinctive walls.'},
    {id:2,slug:'scanned-figures',name_fa:'فیگور اسکن‌شده',name_en:'Scanned Figures',icon:'figure',product_count:2,
     desc_fa:'از اسکن دیجیتال تا مجسمه‌ی رومیزی، با جزئیات دقیق.',desc_en:'From a digital scan to a detailed desk figurine.'},
    {id:3,slug:'metal-cars',name_fa:'ماشین فلزی',name_en:'Metal Cars',icon:'car',product_count:2,
     desc_fa:'ماشین‌های کالکشنی فلزی با جزئیات ماندگار.',desc_en:'Collectible metal cars with lasting detail.'},
    {id:4,slug:'accessories',name_fa:'لوازم جانبی',name_en:'Accessories',icon:'box',product_count:2,
     desc_fa:'پایه، استند و جعبه‌های نگهداری کالکشن.',desc_en:'Stands, bases and display cases.'}
  ],
  products:[
    {id:1,slug:'foggy-city-led',name_fa:'تابلو LED شهر مه‌آلود',name_en:'Foggy City LED Wall Art',category_slug:'wall-art',category_fa:'تابلو',category_en:'Wall Art',icon:'art',price:450000,discount_price:null,stock:12,is_featured:1,sold_count:24,desc_fa:'تابلوی نوری با نورپردازی LED پشت‌زمینه؛ ابعاد ۴۰×۶۰ سانتی‌متر، قاب چوبی مات.'},
    {id:2,slug:'neon-grid',name_fa:'تابلو گرید نئون',name_en:'Neon Grid Wall Art',category_slug:'wall-art',category_fa:'تابلو',category_en:'Wall Art',icon:'art',price:380000,discount_price:320000,stock:8,is_featured:1,sold_count:31,desc_fa:'گرید نئونی روی بک‌گراند تیره؛ مناسب اتاق گیمینگ و استودیو.'},
    {id:3,slug:'cyber-warrior',name_fa:'فیگور اسکن‌شده جنگجوی سایبری',name_en:'Cyber Warrior Scanned Figure',category_slug:'scanned-figures',category_fa:'فیگور اسکن‌شده',category_en:'Scanned Figures',icon:'figure',price:890000,discount_price:null,stock:5,is_featured:1,sold_count:12,desc_fa:'اسکن سه‌بعدی با رزین دقیق، ارتفاع ۱۸ سانتی‌متر، رنگ‌آمیزی دستی.'},
    {id:4,slug:'space-explorer',name_fa:'فیگور اسکن‌شده کاوشگر فضایی',name_en:'Space Explorer Scanned Figure',category_slug:'scanned-figures',category_fa:'فیگور اسکن‌شده',category_en:'Scanned Figures',icon:'figure',price:950000,discount_price:null,stock:3,is_featured:0,sold_count:7,desc_fa:'فیگور کاوشگر با کلاه شفاف و پایه‌ی فلزی؛ ارتفاع ۲۰ سانتی‌متر.'},
    {id:5,slug:'classic-roadster',name_fa:'ماشین فلزی رودستر کلاسیک',name_en:'Classic Roadster Metal Car',category_slug:'metal-cars',category_fa:'ماشین فلزی',category_en:'Metal Cars',icon:'car',price:620000,discount_price:null,stock:15,is_featured:1,sold_count:19,desc_fa:'مقیاس ۱:۲۴، بدنه‌ی فلزی، درب‌های بازشو و داشبورد با جزئیات کامل.'},
    {id:6,slug:'racing-gt',name_fa:'ماشین فلزی GT مسابقه‌ای',name_en:'Racing GT Metal Car',category_slug:'metal-cars',category_fa:'ماشین فلزی',category_en:'Metal Cars',icon:'car',price:710000,discount_price:649000,stock:9,is_featured:1,sold_count:26,desc_fa:'مقیاس ۱:۱۸ با لاستیک لاستیکی و شاسی فلزی؛ همراه استند نمایش.'},
    {id:7,slug:'display-stand',name_fa:'استند نمایش فیگور',name_en:'Figure Display Stand',category_slug:'accessories',category_fa:'لوازم جانبی',category_en:'Accessories',icon:'box',price:180000,discount_price:null,stock:30,is_featured:0,sold_count:44,desc_fa:'استند آکریلیک شفاف دو طبقه برای نمایش فیگور و ماشین.'},
    {id:8,slug:'dust-case',name_fa:'باکس محافظ کالکشن',name_en:'Collection Dust Case',category_slug:'accessories',category_fa:'لوازم جانبی',category_en:'Accessories',icon:'box',price:260000,discount_price:null,stock:0,is_featured:0,sold_count:15,desc_fa:'باکس ضد گردوغبار با درب مگنتی؛ مناسب فیگورهای تا ۲۵ سانتی‌متر.'}
  ],
  faqs:[
    {id:1,question_fa:'ارسال سفارش چقدر طول می‌کشه؟',answer_fa:'سفارش‌ها معمولاً ۱ تا ۲ روز کاری آماده و تحویل پست می‌شن. زمان رسیدن بسته به شهر مقصد بین ۲ تا ۵ روز کاری متغیره.',question_en:'How long does shipping take?',answer_en:'Orders ship within 1–2 business days and arrive in 2–5 business days.'},
    {id:2,question_fa:'امکان مرجوع کردن کالا هست؟',answer_fa:'تا ۷ روز بعد از تحویل، اگر کالا باز نشده و سالم باشه می‌تونی مرجوعش کنی.',question_en:'Can I return an item?',answer_en:'Unopened, undamaged items can be returned within 7 days of delivery.'},
    {id:3,question_fa:'کد پیگیری سفارشم رو کجا ببینم؟',answer_fa:'بلافاصله بعد از ثبت سفارش کد پیگیری نمایش داده می‌شه و پیامک هم می‌شه. از بخش «پیگیری سفارش» توی منو وضعیت لحظه‌ای رو ببین.',question_en:'Where do I find my tracking code?',answer_en:'It appears right after checkout and is texted to you.'}
  ],
  announcements:[
    {id:1,title_fa:'فروشگاه با نام جدید «مای پیکسل» راه‌اندازی شد',body_fa:'اسم و لوگوی فروشگاه عوض شد ولی همون تیم و همون کیفیت. سفارش‌های قبلی با همون کد پیگیری قابل رهگیری‌ان.',level:'success',is_pinned:1,published_at:'2026-08-01'},
    {id:2,title_fa:'تخفیف تابستانه روی دسته‌ی ماشین فلزی',body_fa:'تا پایان مرداد روی محصولات منتخب دسته‌ی ماشین فلزی تخفیف داریم. تعداد محدوده.',level:'info',is_pinned:0,published_at:'2026-07-24'},
    {id:3,title_fa:'تعطیلی ارسال در روزهای تعطیل رسمی',body_fa:'در روزهای تعطیل رسمی ارسال انجام نمی‌شه و سفارش‌ها اولین روز کاری بعد پست می‌شن.',level:'warning',is_pinned:0,published_at:'2026-07-10'}
  ],
  settings:{shipping_cost:'65000',free_shipping_from:'2000000',support_telegram:'https://t.me/mypixel',
            support_instagram:'https://instagram.com/mypixel',support_phone:'02100000000',
            support_hours:'شنبه تا چهارشنبه، ۱۰ تا ۱۸'}
};

/* ------------------------------------------------------------------
   وضعیت
------------------------------------------------------------------ */
const S = {
  lang: localStorage.getItem(LS.lang) || 'fa',
  cart: JSON.parse(localStorage.getItem(LS.cart) || '[]'),
  token: localStorage.getItem(LS.token) || null,
  user: null,
  categories: [],
  products: [],
  settings: {},
  offline: false,
  filters: { category:'all', sort:'newest', max:null, inStock:false, q:'', page:1 },
  auth: { mode:'login', step:1, phone:'', first:'', last:'', timer:0, interval:null }
};

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const t  = k => (T[S.lang] && T[S.lang][k]) || k;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function faDigits(n){
  return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
}
function money(n){
  const s = Number(n || 0).toLocaleString('en-US');
  return S.lang === 'fa' ? faDigits(s) + ' ' + t('toman') : s + ' ' + t('toman');
}
function num(n){ return S.lang === 'fa' ? faDigits(n) : String(n); }
function pName(p){ return (S.lang === 'en' && p.name_en) ? p.name_en : p.name_fa; }
function cName(c){ return (S.lang === 'en' && c.name_en) ? c.name_en : c.name_fa; }
function cDesc(c){ return (S.lang === 'en' && c.desc_en) ? c.desc_en : c.desc_fa; }
function icon(k){ return ICONS[k] || ICONS.box; }
function finalPrice(p){ return p.discount_price || p.price; }
function fmtDate(s){
  if(!s) return '';
  const d = new Date(s.replace(' ', 'T') + (s.includes('Z') ? '' : 'Z'));
  if(isNaN(d)) return s;
  try{
    return new Intl.DateTimeFormat(S.lang === 'fa' ? 'fa-IR' : 'en-GB',
      {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(d);
  }catch(_){ return d.toLocaleString(); }
}

/* ------------------------------------------------------------------
   ارتباط با سرور
------------------------------------------------------------------ */
async function api(path, opts = {}){
  if(!API) throw new Error('offline');
  const headers = Object.assign({}, opts.headers || {});
  if(opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if(S.token) headers['Authorization'] = 'Bearer ' + S.token;
  const res = await fetch(API + path, Object.assign({credentials:'include'}, opts, {headers}));
  const data = await res.json().catch(() => ({}));
  if(!res.ok) throw Object.assign(new Error(data.error || t('err_generic')), {status:res.status, data});
  return data;
}

/* ------------------------------------------------------------------
   توست
------------------------------------------------------------------ */
let toastTimer;
function toast(msg, kind = ''){
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'toast show ' + kind;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ==================================================================
   هدر: پنل کشویی
================================================================== */
const PANEL_LINKS = [
  {group:'panel_group_shop'},
  {key:'nav_categories', href:'/categories', icon:'grid'},
  {key:'nav_products',   href:'/products',   icon:'bag'},
  {key:'nav_track',      href:'/track',      icon:'truck'},
  {group:'panel_group_help'},
  {key:'nav_ann',        href:'/announcements', icon:'bell', badge:true},
  {key:'nav_faq',        href:'/faq',       icon:'help'},
  {key:'nav_about',      href:'/about',     icon:'info'},
  {key:'nav_support',    href:'/support',   icon:'headset'}
];

function renderPanelNav(){
  const route = location.pathname + location.search;
  $('#panelNav').innerHTML = PANEL_LINKS.map(l => {
    if(l.group) return `<div class="panel-label">${esc(t(l.group))}</div>`;
    const active = route.startsWith(l.href) ? ' active' : '';
    const badge = (l.badge && S.annCount) ? `<span class="panel-badge">${num(S.annCount)}</span>` : `<span class="chev">${ICONS.chev}</span>`;
    return `<a class="panel-link${active}" href="${l.href}">
      <span class="pi">${icon(l.icon)}</span><span>${esc(t(l.key))}</span>${badge}</a>`;
  }).join('');
}

function openPanel(){
  $('#sidePanel').classList.add('open');
  $('#panelOverlay').classList.add('open');
  $('#burgerBtn').classList.add('active');
  $('#burgerBtn').setAttribute('aria-expanded','true');
  $('#sidePanel').setAttribute('aria-hidden','false');
  lockScroll();
}
function closePanel(){
  $('#sidePanel').classList.remove('open');
  $('#panelOverlay').classList.remove('open');
  $('#burgerBtn').classList.remove('active');
  $('#burgerBtn').setAttribute('aria-expanded','false');
  $('#sidePanel').setAttribute('aria-hidden','true');
  unlockScroll();
}
function lockScroll(){ document.body.style.overflow = 'hidden'; }
function unlockScroll(){
  const anyOpen = $('#sidePanel').classList.contains('open')
    || $('#cartDrawer').classList.contains('open')
    || $('#accountModal').classList.contains('open')
    || $('#searchSheet').classList.contains('open');
  if(!anyOpen) document.body.style.overflow = '';
}

/* ==================================================================
   هدر: جستجو
================================================================== */
let searchTimer, lastResults = [];

async function runSearch(q, target){
  if(!q || q.trim().length < 1){ target.classList.remove('open'); target.innerHTML=''; return; }
  let items = [];
  try{
    const r = await api('/search?q=' + encodeURIComponent(q));
    items = r.items;
  }catch(_){
    const needle = q.trim().toLowerCase();
    items = DEMO.products.filter(p =>
      p.name_fa.toLowerCase().includes(needle) ||
      (p.name_en||'').toLowerCase().includes(needle) ||
      (p.category_fa||'').toLowerCase().includes(needle)).slice(0,8);
  }
  lastResults = items;
  target.innerHTML = items.length ? (
    items.map(p => `
      <a class="sr-item" href="/product/${esc(p.slug)}">
        <span class="sr-thumb">${p.image_url ? `<img src="${esc(p.image_url)}" alt="" loading="lazy" decoding="async">` : icon(p.icon)}</span>
        <span class="sr-info">
          <h5>${esc(pName(p))}</h5>
          <span>${esc(S.lang==='en' ? (p.category_en||'') : (p.category_fa||''))}</span>
        </span>
        <span class="sr-price">${money(finalPrice(p))}</span>
      </a>`).join('') +
      `<a class="sr-foot" href="/products?q=${encodeURIComponent(q)}">${esc(t('search_all'))} «${esc(q)}»</a>`
  ) : `<div class="sr-empty"><strong>${esc(t('no_results'))}</strong><br>${esc(t('no_results_sub'))}</div>`;
  target.classList.add('open');
}

function wireSearch(input, box, results, isSheet){
  input.addEventListener('input', () => {
    box.classList.toggle('has-value', !!input.value);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => runSearch(input.value, results), 230);
  });
  input.addEventListener('keydown', e => {
    if(e.key === 'Enter'){
      const q = input.value.trim();
      if(q){ go('/products?q=' + encodeURIComponent(q)); results.classList.remove('open'); input.blur(); if(isSheet) closeSearchSheet(); }
    }
    if(e.key === 'Escape'){ results.classList.remove('open'); input.blur(); if(isSheet) closeSearchSheet(); }
  });
  results.addEventListener('click', e => {
    if(e.target.closest('a')){ results.classList.remove('open'); if(isSheet) closeSearchSheet(); }
  });
}

function openSearchSheet(){
  $('#searchSheet').classList.add('open');
  lockScroll();
  setTimeout(() => $('#searchInputM').focus(), 120);
}
function closeSearchSheet(){
  $('#searchSheet').classList.remove('open');
  unlockScroll();
}

/* ==================================================================
   سبد خرید
================================================================== */
function saveCart(){ localStorage.setItem(LS.cart, JSON.stringify(S.cart)); }

/** اقلام بی‌اعتبار سبد را حذف می‌کند تا شمارنده با محتوای واقعی بخواند */
function pruneCart(){
  const before = S.cart.length;
  S.cart = S.cart.filter(c => c && c.id && c.qty > 0 &&
    (findProduct(c.id) || (c.name && c.price != null)));
  if(S.cart.length !== before) saveCart();
  return before - S.cart.length;
}
function findProduct(id){ return S.products.find(p => p.id === id) || DEMO.products.find(p => p.id === id); }

function cartKey(id, o){ return id + '|' + (o && o.size_id || '') + '|' + (o && o.color_id || ''); }

function addToCart(id, opt){
  const p = findProduct(id);
  if(!p || p.stock <= 0) return;
  const o = opt || {};
  const key = cartKey(id, o);
  const line = S.cart.find(c => cartKey(c.id, c) === key);
  if(line){ if(line.qty < p.stock) line.qty++; }
  else S.cart.push({
    id, qty:1,
    size_id: o.size_id || null, size: o.size || '',
    color_id: o.color_id || null, color: o.color || '',
    name: pName(p),
    price: finalPrice(p) + (o.price_diff || 0)
  });
  saveCart(); renderCart(); bumpCart();
  toast(t('toast_added'), 'ok');
}
function bumpCart(){
  const el = $('#cartCount');
  el.textContent = num(S.cart.reduce((s,c) => s + c.qty, 0));
  el.style.transform = 'scale(1.4)';
  setTimeout(() => el.style.transform = 'scale(1)', 200);
}
function cartTotals(){
  let subtotal = 0;
  for(const c of S.cart){
    if(c.price != null){ subtotal += c.price * c.qty; continue; }
    const p = findProduct(c.id);
    if(p) subtotal += finalPrice(p) * c.qty;
  }
  const freeFrom = parseInt(S.settings.free_shipping_from || '0', 10);
  const flat = parseInt(S.settings.shipping_cost || '0', 10);
  const ship = (!subtotal || (freeFrom > 0 && subtotal >= freeFrom)) ? 0 : flat;
  return {subtotal, ship, total: subtotal + ship};
}
function renderCart(){
  const box = $('#cartItems');
  if(!S.cart.length){
    box.innerHTML = `<div class="empty-state"><div class="ei">${ICONS.bag}</div>
      <h3>${esc(t('cart_empty'))}</h3><p>${esc(t('cart_empty_sub'))}</p></div>`;
  } else {
    box.innerHTML = S.cart.map(c => {
      // اگر محصول در حافظه نبود از اسنپ‌شات لحظه‌ی افزودن استفاده کن
      const p = findProduct(c.id) || { id:c.id, name_fa:c.name||'—', name_en:c.name||'—',
        image_url:null, icon:'box', price:c.price||0, discount_price:null, stock:99 };
      const vk = cartKey(c.id, c);
      const variant = [c.size, c.color].filter(Boolean).join(' · ');
      return `<div class="cart-item">
        <span class="ci-visual">${p.image_url ? `<img src="${esc(p.image_url)}" alt="" loading="lazy" decoding="async">` : icon(p.icon)}</span>
        <div class="ci-info"><h4>${esc(pName(p))}</h4>
          ${variant ? `<div style="font-size:.71rem;color:var(--text-3);margin:2px 0 3px">${esc(variant)}</div>` : ''}
          <div class="ci-price">${money(c.price != null ? c.price : finalPrice(p))}</div></div>
        <div class="ci-qty">
          <button class="qty-btn" data-act="minus" data-key="${esc(vk)}" aria-label="−">−</button>
          <span>${num(c.qty)}</span>
          <button class="qty-btn" data-act="plus" data-key="${esc(vk)}" aria-label="+">+</button>
        </div>
        <button class="ci-remove" data-act="remove" data-key="${esc(vk)}" aria-label="حذف">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>
        </button>
      </div>`;
    }).join('');
  }
  const {subtotal, ship, total} = cartTotals();
  $('#cartSubtotal').textContent = money(subtotal);
  $('#cartShipping').textContent = ship ? money(ship) : t('free');
  $('#cartTotal').textContent = money(total);
  $('#checkoutBtn').disabled = !S.cart.length;
  $('#cartCount').textContent = num(S.cart.reduce((s,c) => s + c.qty, 0));
}
function openCart(){ $('#cartDrawer').classList.add('open'); $('#cartOverlay').classList.add('open');
  $('#cartDrawer').setAttribute('aria-hidden','false'); renderCart(); lockScroll(); }
function closeCart(){ $('#cartDrawer').classList.remove('open'); $('#cartOverlay').classList.remove('open');
  $('#cartDrawer').setAttribute('aria-hidden','true'); unlockScroll(); }

/* ==================================================================
   مودال حساب کاربری
================================================================== */
function openAccount(){
  renderAccount();
  $('#accountModal').classList.add('open');
  $('#accountOverlay').classList.add('open');
  $('#accountModal').setAttribute('aria-hidden','false');
  lockScroll();
}
/** بعد از ورود موفق، اگر مقصدی در انتظار بود کاربر را همان‌جا ببر */
function afterLoginRedirect(){
  const dest = S2 && S2.afterLogin;
  if(dest){ S2.afterLogin = null; setTimeout(() => go(dest), 220); }
}

function closeAccount(){
  $('#accountModal').classList.remove('open');
  $('#accountOverlay').classList.remove('open');
  $('#accountModal').setAttribute('aria-hidden','true');
  clearInterval(S.auth.interval);
  unlockScroll();
}

function renderAccount(){
  const body = $('#accountBody');

  /* --- وارد شده --- */
  if(S.user){
    body.innerHTML = `
      <div class="account-user">
        <div class="account-avatar">${ICONS.user}</div>
        <h4>${esc(t('hello'))} ${esc(S.user.first_name || '')} ${esc(S.user.last_name || '')}</h4>
        <div class="phone">${esc(S.user.phone || '')}</div>
        <div class="account-links">
          <a href="/account?tab=orders"    data-acc-link>${ICONS.truck}<span>${esc(t('tab_orders'))}</span></a>
          <a href="/account?tab=wishlist"  data-acc-link>${IC2.heart}<span>${esc(t('tab_wishlist'))}</span></a>
          <a href="/account?tab=addresses" data-acc-link>${IC2.pin}<span>${esc(t('tab_addresses'))}</span></a>
          <a href="/account?tab=reviews"   data-acc-link>${IC2.star}<span>${esc(t('tab_reviews'))}</span></a>
          <a href="/account?tab=returns"   data-acc-link>${IC2.back}<span>${esc(t('tab_returns'))}</span></a>
          <a href="/account?tab=profile"   data-acc-link>${ICONS.user}<span>${esc(t('tab_profile'))}</span></a>
        </div>
        <button class="btn btn-ghost btn-block" id="logoutBtn">${ICONS.logout}<span>${esc(t('logout'))}</span></button>
      </div>`;
    $('#logoutBtn').onclick = doLogout;
    $$('[data-acc-link]').forEach(a => a.onclick = () => closeAccount());
    return;
  }

  /* --- مرحله ۱: تب‌ها + فرم --- */
  const a = S.auth;
  if(a.step === 1){
    const isReg = a.mode === 'register';
    body.innerHTML = `
      <div class="modal-brand">
        <svg viewBox="0 0 40 40" fill="none"><rect x="1" y="1" width="38" height="38" rx="11" stroke="#2EE6F5" stroke-opacity=".4" stroke-width="1.4"/>
          <g fill="#2EE6F5"><rect x="9" y="10" width="5" height="5" rx="1"/><rect x="26" y="10" width="5" height="5" rx="1"/>
          <rect x="9" y="16" width="5" height="5" rx="1"/><rect x="14.5" y="16" width="5" height="5" rx="1" opacity=".62"/>
          <rect x="20.5" y="16" width="5" height="5" rx="1" opacity=".62"/><rect x="26" y="16" width="5" height="5" rx="1"/>
          <rect x="9" y="22" width="5" height="5" rx="1"/><rect x="17.5" y="22" width="5" height="5" rx="1" opacity=".4"/>
          <rect x="26" y="22" width="5" height="5" rx="1"/><rect x="9" y="28" width="5" height="5" rx="1"/>
          <rect x="26" y="28" width="5" height="5" rx="1"/></g></svg>
        <h3>${esc(t(isReg ? 'auth_title_register' : 'auth_title_login'))}</h3>
        <p>${esc(t(isReg ? 'auth_sub_register' : 'auth_sub_login'))}</p>
      </div>

      <div class="auth-tabs" data-tab="${a.mode}">
        <span class="indicator"></span>
        <button class="auth-tab ${!isReg?'active':''}" data-mode="login">${esc(t('tab_login'))}</button>
        <button class="auth-tab ${isReg?'active':''}" data-mode="register">${esc(t('tab_register'))}</button>
      </div>

      <div class="auth-stage">
        <div class="auth-step slide-in" id="stepOne">
          ${isReg ? `<div class="form-row">
            <input class="form-field" id="fFirst" placeholder="${esc(t('ph_first'))}" value="${esc(a.first)}" autocomplete="given-name">
            <input class="form-field" id="fLast" placeholder="${esc(t('ph_last'))}" value="${esc(a.last)}" autocomplete="family-name">
          </div>` : ''}
          <input class="form-field" id="fPhone" type="tel" inputmode="numeric" dir="ltr"
                 placeholder="${esc(t('ph_phone'))}" value="${esc(a.phone)}" autocomplete="tel">
          <div class="form-error" id="authErr"></div>
          <button class="btn btn-primary btn-block" id="nextBtn">${esc(t('next_step'))}</button>
        </div>
      </div>

      <div class="divider">${esc(t('or'))}</div>
      <button class="google-btn" id="googleBtn">${ICONS.google}<span>${esc(t('google_login'))}</span></button>`;

    $$('.auth-tab', body).forEach(b => b.onclick = () => {
      S.auth.mode = b.dataset.mode;
      S.auth.step = 1;
      renderAccount();
    });
    $('#nextBtn').onclick = requestOtp;
    $('#fPhone').addEventListener('keydown', e => { if(e.key === 'Enter') requestOtp(); });
    wireGoogle();
    return;
  }

  /* --- مرحله ۲: کد تایید --- */
  body.innerHTML = `
    <div class="modal-brand">
      <svg viewBox="0 0 40 40" fill="none"><rect x="1" y="1" width="38" height="38" rx="11" stroke="#2EE6F5" stroke-opacity=".4" stroke-width="1.4"/>
        <g fill="#2EE6F5"><rect x="9" y="10" width="5" height="5" rx="1"/><rect x="26" y="10" width="5" height="5" rx="1"/>
        <rect x="9" y="16" width="5" height="5" rx="1"/><rect x="26" y="16" width="5" height="5" rx="1"/>
        <rect x="9" y="22" width="5" height="5" rx="1"/><rect x="26" y="22" width="5" height="5" rx="1"/>
        <rect x="9" y="28" width="5" height="5" rx="1"/><rect x="26" y="28" width="5" height="5" rx="1"/></g></svg>
      <h3>${esc(t('verify_title'))}</h3>
      <p>${esc(t('verify_sub'))} <span dir="ltr" style="color:var(--cyan)">${esc(S.auth.phone)}</span></p>
    </div>
    <div class="auth-step slide-in">
      <div class="otp-row" id="otpRow">
        ${[0,1,2,3,4].map(i => `<input class="otp-box" maxlength="1" inputmode="numeric" data-i="${i}">`).join('')}
      </div>
      <div class="otp-meta">
        <span class="otp-timer" id="otpTimer"></span>
        <button class="otp-resend" id="resendBtn" disabled>${esc(t('resend'))}</button>
      </div>
      <div class="form-error" id="authErr"></div>
      <button class="btn btn-primary btn-block" id="verifyBtn">${esc(t('verify_btn'))}</button>
      <button class="back-link" id="backBtn">${ICONS.chev}<span>${esc(t('back'))}</span></button>
    </div>`;

  const boxes = $$('.otp-box', body);
  boxes[0].focus();
  boxes.forEach((b, i) => {
    b.addEventListener('input', () => {
      b.value = b.value.replace(/\D/g,'').slice(0,1);
      b.classList.toggle('filled', !!b.value);
      if(b.value && i < 4) boxes[i+1].focus();
      if(boxes.every(x => x.value)) verifyOtp();
    });
    b.addEventListener('keydown', e => {
      if(e.key === 'Backspace' && !b.value && i > 0) boxes[i-1].focus();
      if(e.key === 'Enter') verifyOtp();
    });
    b.addEventListener('paste', e => {
      e.preventDefault();
      const digits = (e.clipboardData.getData('text') || '').replace(/\D/g,'').slice(0,5).split('');
      digits.forEach((d, k) => { if(boxes[k]){ boxes[k].value = d; boxes[k].classList.add('filled'); } });
      if(digits.length === 5) verifyOtp();
    });
  });
  $('#verifyBtn').onclick = verifyOtp;
  $('#resendBtn').onclick = requestOtp;
  $('#backBtn').onclick = () => { S.auth.step = 1; clearInterval(S.auth.interval); renderAccount(); };
  startOtpTimer();
}

function authError(msg){
  const el = $('#authErr');
  if(!el) return;
  el.textContent = msg;
  el.classList.add('show');
}
function startOtpTimer(){
  clearInterval(S.auth.interval);
  S.auth.timer = 120;
  const tick = () => {
    const el = $('#otpTimer'), btn = $('#resendBtn');
    if(!el) return clearInterval(S.auth.interval);
    const m = Math.floor(S.auth.timer / 60), s = S.auth.timer % 60;
    el.textContent = num(`${m}:${String(s).padStart(2,'0')}`);
    if(btn) btn.disabled = S.auth.timer > 0;
    if(S.auth.timer <= 0){ clearInterval(S.auth.interval); el.textContent = ''; }
    S.auth.timer--;
  };
  tick();
  S.auth.interval = setInterval(tick, 1000);
}

function normPhone(v){
  const en = String(v).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  let p = en.replace(/[^\d+]/g,'');
  if(p.startsWith('+98')) p = '0' + p.slice(3);
  else if(p.startsWith('0098')) p = '0' + p.slice(4);
  else if(p.startsWith('98') && p.length === 12) p = '0' + p.slice(2);
  else if(p.length === 10 && p.startsWith('9')) p = '0' + p;
  return p;
}

async function requestOtp(){
  const a = S.auth;
  const phoneEl = $('#fPhone');
  if(phoneEl) a.phone = normPhone(phoneEl.value);
  if(a.mode === 'register'){
    a.first = ($('#fFirst') || {}).value?.trim() || a.first;
    a.last  = ($('#fLast')  || {}).value?.trim() || a.last;
    if(!a.first || a.first.length < 2) return authError(S.lang==='fa' ? 'نام رو کامل وارد کن.' : 'Enter your first name.');
    if(!a.last  || a.last.length  < 2) return authError(S.lang==='fa' ? 'نام خانوادگی رو کامل وارد کن.' : 'Enter your last name.');
  }
  if(!/^09\d{9}$/.test(a.phone))
    return authError(S.lang==='fa' ? 'شماره موبایل معتبر نیست. مثل 09123456789 وارد کن.' : 'Enter a valid mobile number.');

  const btn = $('#nextBtn') || $('#resendBtn');
  if(btn) btn.disabled = true;

  try{
    const r = await api('/auth/otp/request', {method:'POST', body: JSON.stringify({
      phone:a.phone, mode:a.mode, first_name:a.first, last_name:a.last })});
    a.step = 2;
    renderAccount();
    if(r.dev_code) toast((S.lang==='fa'?'کد تست: ':'Test code: ') + r.dev_code);
  }catch(err){
    if(err.message === 'offline'){
      // حالت نمایشی بدون سرور
      a.step = 2; renderAccount();
      toast(S.lang==='fa' ? 'حالت نمایشی: کد ۱۲۳۴۵ رو وارد کن' : 'Demo mode: use code 12345');
    } else {
      authError(err.message);
      if(btn) btn.disabled = false;
    }
  }
}

async function verifyOtp(){
  const code = $$('.otp-box').map(b => b.value).join('');
  if(code.length < 5) return authError(S.lang==='fa' ? 'کد پنج‌رقمیه.' : 'The code has 5 digits.');
  const btn = $('#verifyBtn');
  if(btn) btn.disabled = true;

  try{
    const r = await api('/auth/otp/verify', {method:'POST', body: JSON.stringify({phone:S.auth.phone, code})});
    S.token = r.token; S.user = r.user;
    if(typeof loadWish === 'function') loadWish().then(() => paintWishButtons());
    if(typeof afterLoginRedirect === 'function') afterLoginRedirect();
    localStorage.setItem(LS.token, r.token);
    updateAccountLabel();
    closeAccount();
    toast(t('toast_login'), 'ok');
  }catch(err){
    if(err.message === 'offline'){
      if(code === '12345'){
        S.user = {first_name:S.auth.first || (S.lang==='fa'?'کاربر':'Guest'), last_name:S.auth.last||'', phone:S.auth.phone};
        updateAccountLabel(); closeAccount(); toast(t('toast_login'), 'ok');
      } else { authError(S.lang==='fa'?'کد درست نیست.':'Wrong code.'); if(btn) btn.disabled = false; }
    } else {
      authError(err.message);
      if(btn) btn.disabled = false;
      $$('.otp-box').forEach(b => { b.value=''; b.classList.remove('filled'); });
      ($$('.otp-box')[0] || {}).focus?.();
    }
  }
}

async function doLogout(){
  try{ await api('/auth/logout', {method:'POST'}); }catch(_){}
  S.user = null; S.token = null;
  localStorage.removeItem(LS.token);
  updateAccountLabel();
  closeAccount();
  toast(t('toast_logout'));
}

function updateAccountLabel(){
  const label = S.user ? (S.user.first_name || t('account')) : t('account');
  const a = $('#accountBtnLabel'), b = $('#accountPanelLabel');
  if(a) a.textContent = label;
  if(b) b.textContent = label;
}

/* ==================================================================
   بارگذاری داده
================================================================== */
async function loadData(){
  try{
    const [c, p, s] = await Promise.all([
      api('/categories'), api('/products?limit=60'), api('/settings')
    ]);
    S.categories = c.items;
    S.products = p.items;
    S.settings = s.settings || {};
    S.offline = false;
  }catch(_){
    S.categories = DEMO.categories;
    S.products = DEMO.products;
    S.settings = DEMO.settings;
    S.offline = true;
  }
  if(S.token && !S.offline){
    try{ const r = await api('/auth/me'); S.user = r.user; }catch(_){}
  }
  updateAccountLabel();
  applySettingsLinks();
  if(typeof renderTrust === 'function') renderTrust();   // تنظیمات نمادها تازه رسیده

  // نشست ممکن است بعد از رندر اولیه برسد؛ بخش‌های وابسته به کاربر را تازه کن
  // (مثلاً فرم دیدگاه که به «خریدار بودن» نیاز دارد)
  if(S.user) refreshUserBoundViews();
}

/** بخش‌هایی که به وضعیت ورود کاربر وابسته‌اند را بعد از بازیابی نشست دوباره می‌سازد */
function refreshUserBoundViews(){
  const hash = location.pathname || '';
  if(hash.startsWith('/product/') && typeof renderProduct === 'function'){
    renderProduct(hash.replace('/product/', ''));
  } else if(hash.startsWith('/checkout') || hash.startsWith('/account')
         || hash.startsWith('/wishlist') || hash.startsWith('/track')){
    if(typeof route === 'function') route();
  }
  if(typeof loadWish === 'function') loadWish().then(() => paintWishButtons());
}

function applySettingsLinks(){
  const tg = S.settings.support_telegram || '#';
  const ig = S.settings.support_instagram || '#';
  ['#soTg','#footTg'].forEach(s => { const el = $(s); if(el) el.href = tg; });
  ['#soIg','#footIg'].forEach(s => { const el = $(s); if(el) el.href = ig; });
}

/* ==================================================================
   کارت محصول
================================================================== */
function productCard(p){
  const off = p.discount_price && p.discount_price < p.price;
  const pct = off ? Math.round((1 - p.discount_price / p.price) * 100) : 0;
  const out = p.stock <= 0;
  const cat = S.lang === 'en' ? (p.category_en || '') : (p.category_fa || '');
  return `<article class="prod-card">
    <a href="/product/${esc(p.slug)}" class="prod-visual" aria-label="${esc(pName(p))}">
      <div class="prod-badges">
        ${cat ? `<span class="badge badge-cat">${esc(cat)}</span>` : ''}
        ${off ? `<span class="badge badge-off">${num(pct)}٪ ${esc(t('off'))}</span>` : ''}
        ${out ? `<span class="badge badge-out">${esc(t('out_of_stock'))}</span>` : ''}
      </div>
      ${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(pName(p))}" loading="lazy" decoding="async">` : icon(p.icon)}
    </a>
    <div class="prod-body">
      <h3><a href="/product/${esc(p.slug)}">${esc(pName(p))}</a></h3>
      <div class="price-row">
        <span class="price">${money(finalPrice(p))}</span>
        ${off ? `<span class="price-old">${money(p.price)}</span>` : ''}
      </div>
      <div class="prod-actions">
        <button class="add-btn" data-add="${p.id}" ${out ? 'disabled' : ''}>
          ${esc(out ? t('out_of_stock') : t('add_to_cart'))}
        </button>
      </div>
    </div>
  </article>`;
}

/* ==================================================================
   صفحه‌ها
================================================================== */
function renderHome(){
  const featured = S.products.filter(p => p.is_featured).slice(0, 8);
  const list = featured.length ? featured : S.products.slice(0, 8);
  $('#featuredGrid').innerHTML = list.map(productCard).join('');
  $('#homeCatList').innerHTML = S.categories.slice(0, 3).map(categoryRow).join('');
}

function categoryRow(c){
  return `<a class="cat-row" href="/products?category=${esc(c.slug)}">
    <span class="cat-ico">${icon(c.icon)}</span>
    <span class="cat-info">
      <h3>${esc(cName(c))}</h3>
      <p>${esc(cDesc(c))}</p>
    </span>
    ${c.product_count != null ? `<span class="cat-count">${num(c.product_count)} ${esc(t('product_count'))}</span>` : ''}
    <span class="cat-arrow">${ICONS.chev}</span>
  </a>`;
}

function _origRenderCategories(){
  $('#catList').innerHTML = S.categories.length
    ? S.categories.map(categoryRow).join('')
    : `<div class="empty-state"><div class="ei">${ICONS.empty}</div><h3>${esc(t('no_results'))}</h3></div>`;
}

/* ---------- محصولات + فیلتر ---------- */
function renderCatChips(){
  const chips = [{slug:'all', name:t('all')}].concat(S.categories.map(c => ({slug:c.slug, name:cName(c)})));
  $('#catChips').innerHTML = chips.map(c =>
    `<button class="chip ${S.filters.category === c.slug ? 'active' : ''}" data-cat="${esc(c.slug)}">${esc(c.name)}</button>`
  ).join('');
}

function maxPriceOf(list){
  return list.reduce((m, p) => Math.max(m, finalPrice(p)), 0) || 1000000;
}

function filteredProducts(){
  let list = S.products.slice();
  const f = S.filters;
  if(f.category !== 'all') list = list.filter(p => p.category_slug === f.category);
  if(f.q){
    const n = f.q.toLowerCase();
    list = list.filter(p => pName(p).toLowerCase().includes(n)
      || (p.name_en||'').toLowerCase().includes(n)
      || (p.name_fa||'').toLowerCase().includes(n));
  }
  if(f.max) list = list.filter(p => finalPrice(p) <= f.max);
  if(f.inStock) list = list.filter(p => p.stock > 0);

  const cmp = {
    newest:(a,b) => b.id - a.id,
    popular:(a,b) => (b.sold_count||0) - (a.sold_count||0),
    cheap:(a,b) => finalPrice(a) - finalPrice(b),
    expensive:(a,b) => finalPrice(b) - finalPrice(a),
    name:(a,b) => pName(a).localeCompare(pName(b), 'fa')
  }[f.sort];
  return list.sort(cmp);
}

function _origRenderProducts(){
  renderCatChips();
  const all = filteredProducts();
  const perPage = 12;
  const pages = Math.max(1, Math.ceil(all.length / perPage));
  if(S.filters.page > pages) S.filters.page = 1;
  const slice = all.slice((S.filters.page - 1) * perPage, S.filters.page * perPage);

  $('#resultCount').textContent = `${num(all.length)} ${t('products_found')}`;
  $('#productsGrid').innerHTML = slice.length
    ? slice.map(productCard).join('')
    : `<div class="empty-state" style="grid-column:1/-1"><div class="ei">${ICONS.empty}</div>
        <h3>${esc(t('no_results'))}</h3><p>${esc(t('no_results_sub'))}</p></div>`;

  $('#pagination').innerHTML = pages > 1
    ? Array.from({length:pages}, (_,i) =>
        `<button class="${S.filters.page === i+1 ? 'active' : ''}" data-page="${i+1}">${num(i+1)}</button>`).join('')
    : '';

  const rng = $('#priceRange');
  const top = maxPriceOf(S.products);
  rng.max = top;
  if(S.filters.max == null){ rng.value = top; $('#priceRangeLabel').textContent = money(top); }
  $('#sortSelect').value = S.filters.sort;
  $('#inStockOnly').checked = S.filters.inStock;
}

/* ---------- جزئیات محصول ---------- */
async function renderProduct(slug){
  const box = $('#productDetail');
  box.innerHTML = `<div class="skeleton" style="height:340px"></div>`;
  let p = S.products.find(x => x.slug === slug);
  try{ const r = await api('/products/' + encodeURIComponent(slug)); p = r.item; }catch(_){}
  if(!p){
    box.innerHTML = `<div class="empty-state"><div class="ei">${ICONS.empty}</div><h3>${esc(t('no_results'))}</h3></div>`;
    return;
  }
  const off = p.discount_price && p.discount_price < p.price;
  const out = p.stock <= 0;
  box.innerHTML = `
    <div class="pd-grid">
      <div class="pd-visual">${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(pName(p))}" loading="lazy" decoding="async">` : icon(p.icon)}</div>
      <div class="pd-info">
        <div class="eyebrow">${esc(S.lang==='en' ? (p.category_en||'') : (p.category_fa||''))}</div>
        <h1>${esc(pName(p))}</h1>
        <div class="pd-specs">
          ${p.sku ? `<span class="spec">SKU ${esc(p.sku)}</span>` : ''}
          <span class="spec">${out ? esc(t('out_of_stock')) : (S.lang==='fa' ? `${num(p.stock)} عدد موجود` : `${p.stock} in stock`)}</span>
          ${p.sold_count ? `<span class="spec">${S.lang==='fa' ? `${num(p.sold_count)} فروش` : `${p.sold_count} sold`}</span>` : ''}
        </div>
        <div class="pd-price">
          <span class="price">${money(finalPrice(p))}</span>
          ${off ? `<span class="price-old">${money(p.price)}</span>` : ''}
        </div>
        <p class="pd-desc">${esc((S.lang==='en' && p.desc_en) ? p.desc_en : (p.desc_fa || ''))}</p>
        <div class="pd-actions">
          <button class="btn btn-primary" data-add="${p.id}" ${out?'disabled':''}>${esc(out ? t('out_of_stock') : t('add_to_cart'))}</button>
          <a href="/products" class="btn btn-ghost">${esc(t('nav_products'))}</a>
        </div>
      </div>
    </div>`;
}

/* ---------- پیگیری سفارش ---------- */
async function doTrack(){
  const code = $('#trackInput').value.trim().toUpperCase();
  S2.trackPhone = ($('#trackPhone') && $('#trackPhone').value.trim()) || S2.trackPhone || '';
  const box = $('#trackResult');
  if(!code){ box.innerHTML = ''; return; }
  box.innerHTML = `<div class="skeleton" style="height:180px"></div>`;

  try{
    const r = await api('/orders/track/' + encodeURIComponent(code));
    const o = r.order;
    const stFa = STATUS_LABEL[S.lang][o.status] || o.status;
    box.innerHTML = `
      <div class="track-card">
        <div class="track-top">
          <div>
            <div class="track-code">${esc(o.tracking_code)}</div>
            <div style="font-size:.8rem;color:var(--text-3)">${esc(t('track_placed'))}: ${esc(fmtDate(o.created_at))}</div>
          </div>
          <div class="track-top-side">
            <span class="status-pill st-${esc(o.status)}">${esc(stFa)}</span>
            <div class="track-acts" id="trackActs"></div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-cell"><span>${esc(t('track_recipient'))}</span><strong>${esc(o.customer_name)}</strong></div>
          <div class="summary-cell"><span>${esc(t('track_city'))}</span><strong>${esc(o.city || '—')}</strong></div>
          <div class="summary-cell"><span>${esc(t('track_total'))}</span><strong style="color:var(--cyan)">${money(o.total)}</strong></div>
          ${o.tracking_post ? `<div class="summary-cell"><span>${esc(t('track_post'))}</span><strong dir="ltr">${esc(o.tracking_post)}</strong></div>` : ''}
        </div>

        <h3 style="font-size:.95rem;margin:20px 0 10px">${esc(t('track_items'))}</h3>
        ${r.items.map(i => `<div class="total-row"><span>${esc(i.title_snapshot)} × ${num(i.qty)}</span><span>${money(i.unit_price * i.qty)}</span></div>`).join('')}

        <h3 style="font-size:.95rem;margin:22px 0 12px">${esc(t('track_history'))}</h3>
        <div class="timeline">
          ${r.history.slice().reverse().map((h, i) => `
            <div class="tl-item ${i===0?'':'past'}">
              <div class="tl-title">${esc(STATUS_LABEL[S.lang][h.status] || h.status)}</div>
              ${h.note ? `<div class="tl-note">${esc(h.note)}</div>` : ''}
              <div class="tl-meta">${esc(fmtDate(h.created_at))}</div>
            </div>`).join('')}
        </div>
      </div>`;
    paintTrackActions(o);
    paintPayBox(o);
  }catch(err){
    box.innerHTML = `<div class="empty-state"><div class="ei">${ICONS.truck}</div>
      <h3>${esc(err.message === 'offline'
        ? (S.lang==='fa' ? 'برای پیگیری باید به سرور وصل باشی' : 'Tracking needs the server')
        : err.message)}</h3>
      <p>${esc(S.lang==='fa' ? 'کد پیگیری با MP- شروع می‌شه.' : 'Tracking codes start with MP-.')}</p></div>`;
  }
}

/** جعبه‌ی پرداخت: نتیجه‌ی بازگشت از درگاه یا دکمه‌ی پرداخت */
async function paintPayBox(o){
  const host = $('#trackActs');
  if(!host) return;

  const params = new URLSearchParams(location.search);
  const pay = params.get('pay');

  // پیام نتیجه‌ی بازگشت از درگاه
  if(pay){
    const map = {
      ok:       ['ok',   t('pay_ok'),       params.get('ref') ? `${t('ref_id')}: ${params.get('ref')}` : ''],
      cancel:   ['warn', t('pay_cancel'),   t('pay_cancel_sub')],
      fail:     ['err',  t('pay_fail'),     t('pay_fail_sub')],
      mismatch: ['err',  t('pay_mismatch'), t('pay_contact')],
      dberror:  ['err',  t('pay_dberror'),  t('pay_contact')],
      notfound: ['err',  t('pay_notfound'), '']
    };
    const m = map[pay] || map.fail;
    const box = document.createElement('div');
    box.className = 'pay-result ' + m[0];
    box.innerHTML = `<span class="pr-ic">${m[0]==='ok' ? IC2.check : IC2.alert}</span>
      <span class="pr-body"><b>${esc(m[1])}</b>${m[2] ? `<span>${esc(m[2])}</span>` : ''}</span>`;
    host.parentNode.insertBefore(box, host);
    // آدرس را تمیز کن تا رفرش دوباره پیام ندهد
    history.replaceState(null, '', '/track?code=' + encodeURIComponent(o.tracking_code));
    if(pay === 'ok') setTimeout(() => toast(t('pay_ok'), 'ok'), 300);
  }

  // اگر هنوز پرداخت نشده، دکمه‌ی پرداخت بگذار
  let st = null;
  try{
    const ph = S2.trackPhone || (S.user && S.user.phone) || '';
    st = await api('/payments/status/' + encodeURIComponent(o.tracking_code)
      + (ph ? '?phone=' + encodeURIComponent(ph) : ''));
  }catch(_){ return; }

  if(!st.payable) return;

  const btn = document.createElement('button');
  btn.className = 'track-btn pay-now';
  btn.id = 'tkPay';
  btn.innerHTML = `${IC2.card}<span>${esc(t('pay_now'))}</span>
    <em>${money(st.total)}</em>`;
  host.insertBefore(btn, host.firstChild);

  btn.onclick = async () => {
    btn.disabled = true;
    try{
      const ph = S2.trackPhone || (S.user && S.user.phone) || '';
      const r = await api('/payments/start', { method:'POST', body: JSON.stringify({
        tracking_code: o.tracking_code, phone: ph })});
      toast(t('pay_redirect'), 'ok');
      setTimeout(() => { location.href = r.redirect_url; }, 500);
    }catch(e){
      toast(e.message || t('err_generic'), 'err');
      btn.disabled = false;
    }
  };
}

/** دکمه‌های لغو سفارش و درخواست مرجوعی زیر وضعیت سفارش */
async function paintTrackActions(o){
  const host = $('#trackActs');
  if(!host) return;
  let a = null;
  try{ a = await api('/orders/actions/' + encodeURIComponent(o.tracking_code)); }catch(_){ }
  if(!a){ host.innerHTML = ''; return; }

  const btns = [];
  if(a.can_cancel){
    btns.push(`<button class="track-btn danger" id="tkCancel"
      title="${esc(t('cancel_order'))}">${IC2.x}<span>${esc(t('cancel_order'))}</span></button>`);
  }
  if(a.can_return){
    btns.push(`<a class="track-btn" href="/returns?code=${encodeURIComponent(o.tracking_code)}"
      title="${esc(t('request_return'))} — ${num(a.days_left)} ${esc(t('days_left'))}">
      ${IC2.back}<span>${esc(t('request_return'))}</span></a>`);
  }
  btns.push(`<a class="track-btn" href="/account?tab=orders" data-need-login
    title="${esc(t('tab_orders'))}">${IC2.bag}<span>${esc(t('my_orders_btn'))}</span></a>`);
  btns.push(`<button class="track-btn" id="tkInvoice"
    title="${esc(t('invoice'))}">${IC2.receipt}<span>${esc(t('invoice'))}</span></button>`);
  btns.push(`<a class="track-btn support" href="/support"
    title="${esc(t('nav_support'))}">${IC2.help}<span>${esc(t('nav_support'))}</span></a>`);

  // اگر هیچ اقدامی ممکن نبود، دلیلش را زیر دکمه‌ها بنویس
  let note = '';
  if(!a.can_cancel && !a.can_return){
    const why = o.status === 'delivered' ? t('return_window_over')
              : o.status === 'cancelled' ? t('order_cancelled')
              : o.status === 'refunded'  ? t('order_refunded')
              : t('no_action_yet');
    note = `<span class="track-note">${IC2.alert}<span>${esc(why)}</span></span>`;
  }
  host.innerHTML = btns.join('') + note;

  // اگر وارد نشده، اول پنجره ورود باز شود
  $$('[data-need-login]', host).forEach(a => a.onclick = e => {
    if(S.user) return;
    e.preventDefault();
    S2.afterLogin = '/account?tab=orders';
    toast(t('need_login_orders'), 'warn');
    setTimeout(openAccount, 200);
  });

  const inv = $('#tkInvoice');
  if(inv) inv.onclick = () => openInvoice(o.tracking_code, S2.trackPhone || (S.user && S.user.phone) || '');

  const cb = $('#tkCancel');
  if(cb) cb.onclick = () => {
    const paid = !!a.is_paid;
    openSheet(t('cancel_order'), `
      <p class="sheet-lead">${esc(paid ? t('cancel_confirm_paid') : t('cancel_confirm'))}</p>
      <div class="ff-grid">
        ${fld('ckPhone', t('phone'), {value: S.user?.phone || '', dir:'ltr',
          mode:'numeric', max:11, icon: IC2.user, hint: t('cancel_phone_hint')})}
        ${fld('ckTelegram', t('telegram_id'), {dir:'ltr', icon: IC2.telegram, hint: t('telegram_hint')})}
        ${fld('ckReason', t('cancel_reason'), {area:1, rows:2, wide:1})}
      </div>

      <div class="refund-box ${paid?'need':''}">
        <span class="rb-head">${IC2.price}<b>${esc(paid ? t('refund_needed') : t('refund_optional'))}</b></span>
        <p>${esc(paid ? t('refund_hint_paid') : t('refund_hint_unpaid'))}</p>
        <div class="ff-grid">
          ${fld('ckCard', t('card_number'), {dir:'ltr', mode:'numeric', max:19, wide:1,
            icon: IC2.card, hint: t('card_hint')})}
          ${fld('ckHolder', t('card_holder'), {wide:1,
            value: `${S.user?.first_name||''} ${S.user?.last_name||''}`.trim()})}
        </div>
      </div>`,
      `<button class="btn btn-ghost" data-sheet-close>${esc(t('cancel'))}</button>
       <button class="btn btn-danger" id="ckGo">${esc(t('confirm_cancel'))}</button>`);
    wireFloating($('#mpSheet'));

    // شماره کارت را چهارتایی جدا کن
    const card = $('#ckCard');
    card.addEventListener('input', () => {
      const raw = card.value.replace(/\D/g, '').slice(0, 16);
      card.value = raw.replace(/(.{4})/g, '$1 ').trim();
    });

    $('#ckGo').onclick = async () => {
      const g = $('#ckGo'); g.disabled = true;
      try{
        const r = await api('/orders/cancel', { method:'POST', body: JSON.stringify({
          tracking_code: o.tracking_code, phone: $('#ckPhone').value,
          reason: $('#ckReason').value, telegram: $('#ckTelegram').value,
          card: $('#ckCard').value, card_holder: $('#ckHolder').value })});
        closeSheet(); toast(r.message, 'ok');
        $('#trackInput').value = o.tracking_code; doTrack();
      }catch(e){ toast(e.message || t('err_generic'), 'err'); g.disabled = false; }
    };
  };
}

/* ---------- سوالات متداول ---------- */
async function renderFaq(){
  let items = DEMO.faqs;
  try{ const r = await api('/faqs'); items = r.items; }catch(_){}
  $('#faqList').innerHTML = items.map((f, i) => {
    const q = (S.lang === 'en' && f.question_en) ? f.question_en : f.question_fa;
    const a = (S.lang === 'en' && f.answer_en) ? f.answer_en : f.answer_fa;
    return `<div class="faq-item" data-faq="${i}">
      <button class="faq-q">
        <span class="fi"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>
        <span>${esc(q)}</span>
      </button>
      <div class="faq-a"><div>${esc(a)}</div></div>
    </div>`;
  }).join('');
}

/* ---------- اطلاعیه‌ها ---------- */
async function renderAnnouncements(){
  let items = DEMO.announcements;
  try{ const r = await api('/announcements'); items = r.items; }catch(_){}
  S.annCount = items.length;
  $('#annList').innerHTML = items.length ? items.map(a => {
    const title = (S.lang === 'en' && a.title_en) ? a.title_en : a.title_fa;
    const body = (S.lang === 'en' && a.body_en) ? a.body_en : a.body_fa;
    return `<article class="ann-item level-${esc(a.level || 'info')}">
      <div class="ann-head">
        <h3>${esc(title)}</h3>
        ${a.is_pinned ? `<span class="pin-tag">${esc(t('pinned'))}</span>` : ''}
        <span class="ann-date">${esc(fmtDate(a.published_at))}</span>
      </div>
      <p>${esc(body)}</p>
    </article>`;
  }).join('') : `<div class="empty-state"><div class="ei">${ICONS.bell}</div><h3>${esc(t('no_results'))}</h3></div>`;
  renderPanelNav();
}

/* ---------- پشتیبانی ---------- */
async function renderSupport(){
  const host = $('#supportGrid');
  if(!host) return;
  host.innerHTML = `<div class="skel" style="height:150px"></div>`;

  let items = [];
  try{ items = (await api('/support-channels')).items || []; }catch(_){ }

  // اگر جدول خالی بود یا سرور در دسترس نبود، از تنظیمات قدیمی بساز
  if(!items.length){
    const st = S.settings || {};
    items = [
      { kind:'telegram',  name_fa:t('sup_tg_t'),    desc_fa:t('sup_tg_d'),    value:st.support_telegram||'',  icon:'telegram' },
      { kind:'instagram', name_fa:t('sup_ig_t'),    desc_fa:t('sup_ig_d'),    value:st.support_instagram||'', icon:'instagram' },
      { kind:'phone',     name_fa:t('sup_phone_t'), desc_fa:'',               value:st.support_phone||'',     icon:'phone' },
      { kind:'hours',     name_fa:t('sup_hours_t'), desc_fa:'',               value:st.support_hours||t('sup_hours_d'), icon:'clock' }
    ].filter(x => x.value);
  }

  host.innerHTML = items.map(ch => {
    const name = (S.lang === 'en' && ch.name_en) ? ch.name_en : ch.name_fa;
    const desc = (S.lang === 'en' && ch.desc_en) ? ch.desc_en : ch.desc_fa;
    const art  = ch.logo_url ? `<img src="${esc(ch.logo_url)}" alt="${esc(name)}">` : chanIcon(ch);

    // مقصد کارت بر اساس نوع کانال
    let href = '';
    if(ch.kind === 'phone')      href = ch.value ? 'tel:' + ch.value.replace(/\s/g,'') : '';
    else if(ch.kind === 'email') href = ch.value ? 'mailto:' + ch.value : '';
    else if(ch.kind === 'whatsapp') href = ch.value ? (/^https?:/.test(ch.value) ? ch.value
                                        : 'https://wa.me/' + ch.value.replace(/\D/g,'')) : '';
    else if(ch.kind !== 'hours' && ch.kind !== 'custom') href = ch.value || '';
    else if(/^https?:/.test(ch.value || '')) href = ch.value;

    const tag = href ? 'a' : 'div';
    const attrs = href ? ` href="${esc(href)}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}` : '';
    // برای تلفن و ساعت کاری، خود مقدار زیر عنوان نشان داده می‌شود
    let line = (ch.kind === 'phone' || ch.kind === 'hours' || (!href && ch.value)) ? ch.value : '';
    if(line && desc && line.trim() === desc.trim()) line = '';   // تکرار نشود

    return `<${tag} class="info-card chan ${ch.bg_url?'has-bg':''} ${href?'':'plain'}"${attrs}>
      ${ch.bg_url ? `<span class="chan-bg" style="background-image:url('${esc(ch.bg_url)}')"></span>` : ''}
      <span class="chan-body">
        <span class="ii">${art}</span>
        <h3>${esc(name)}</h3>
        ${desc ? `<p>${esc(desc)}</p>` : ''}
        ${line ? `<p class="chan-val"${ch.kind==='phone'?' dir="ltr"':''}>${esc(line)}</p>` : ''}
        ${href ? `<span class="chan-go">${esc(t('chan_open'))} ${IC2.chev}</span>` : ''}
      </span>
    </${tag}>`;
  }).join('');
}

/** آیکون کانال: اول آیکون داخلی، بعد نگاشت بر اساس نوع */
function chanIcon(ch){
  const byKind = { telegram: IC2.telegram, instagram: IC2.instagram, whatsapp: IC2.whatsapp,
                   phone: ICONS.phone, hours: IC2.clock, email: IC2.pin };
  if(ch.icon && window.MPIcons && MPIcons.keys().includes(ch.icon)) return MPIcons.get(ch.icon);
  if(ch.icon && IC2[ch.icon]) return IC2[ch.icon];
  return byKind[ch.kind] || IC2.help;
}

/* ==================================================================
   مسیریابی
================================================================== */
/* ══════════════════════════════════════════
   مسیریابی با History API — بدون # در آدرس
══════════════════════════════════════════ */

/** آدرس فعلی را می‌خواند؛ اگر هنوز روی # بود، به مسیر واقعی تبدیلش می‌کند */
function parseHash(){
  // سازگاری با لینک‌های قدیمی /#/products
  if(location.hash && location.hash.startsWith('#/')){
    const legacy = location.hash.slice(1);
    history.replaceState(null, '', legacy);
  }
  const [path, qs] = (location.pathname + location.search).split('?');
  const params = new URLSearchParams(qs || '');
  return { parts: path.split('/').filter(Boolean), params };
}

/** به یک مسیر می‌رود بدون بارگذاری دوباره صفحه */
function go(url, replace){
  const target = String(url || '/').replace(/^#/, '');
  const cur = location.pathname + location.search;
  if(target === cur){ route(); return; }
  history[replace ? 'replaceState' : 'pushState'](null, '', target);
  route();
}

/** روی همه لینک‌های داخلی می‌نشیند تا صفحه دوباره لود نشود */
function wireLinks(scope){
  (scope || document).addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if(!a) return;
    if(a.target === '_blank' || a.hasAttribute('download')) return;
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    const href = a.getAttribute('href');
    if(!href || href.startsWith('http') || href.startsWith('mailto:')
       || href.startsWith('tel:') || href.startsWith('//')) return;

    // لنگر داخل همان صفحه دست‌نخورده بماند
    if(href.startsWith('#') && !href.startsWith('#/')) return;

    e.preventDefault();
    go(href.startsWith('#') ? href.slice(1) : href);
  });
}

function _origRoute(){
  const {parts, params} = parseHash();
  const name = parts[0] || 'home';
  const pages = {home:'page-home', categories:'page-categories', products:'page-products',
                 product:'page-product', track:'page-track', faq:'page-faq',
                 announcements:'page-announcements', about:'page-about', support:'page-support'};
  const id = pages[name] || 'page-home';

  $$('.page').forEach(p => p.classList.toggle('active', p.id === id));
  window.scrollTo({top:0, behavior:'instant'});
  closePanel();
  renderPanelNav();

  if(name === 'home' || !pages[name]) renderHome();
  if(name === 'categories') renderCategories();
  if(name === 'products'){
    S.filters.category = params.get('category') || 'all';
    S.filters.q = params.get('q') || '';
    S.filters.page = parseInt(params.get('page')) || 1;
    if(S.filters.q){ const si = $('#searchInput'); if(si) si.value = S.filters.q; }
    renderProducts();
  }
  if(name === 'product') renderProduct(parts[1] || '');
  if(name === 'track'){
    const c = params.get('code');
    if(c){ $('#trackInput').value = c; doTrack(); }
  }
  if(name === 'faq') renderFaq();
  if(name === 'announcements') renderAnnouncements();
  if(name === 'support') renderSupport();
}

/* ==================================================================
   زبان
================================================================== */
function _origApplyLang(lang){
  S.lang = lang;
  localStorage.setItem(LS.lang, lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';

  $$('[data-i18n]').forEach(el => { const k = el.dataset.i18n; if(T[lang][k] !== undefined) el.textContent = T[lang][k]; });
  $$('[data-i18n-html]').forEach(el => { const k = el.dataset.i18nHtml; if(T[lang][k] !== undefined) el.innerHTML = T[lang][k]; });
  $$('[data-i18n-ph]').forEach(el => { const k = el.dataset.i18nPh; if(T[lang][k] !== undefined) el.placeholder = T[lang][k]; });

  const flag = lang === 'fa' ? FLAG_IR : FLAG_GB;
  ['#langFlag','#langFlagPanel'].forEach(s => { const el = $(s); if(el) el.innerHTML = flag; });
  ['#langLabel','#langLabelPanel'].forEach(s => { const el = $(s); if(el) el.textContent = lang === 'fa' ? 'FA' : 'EN'; });

  $('#brandFa').textContent = lang === 'fa' ? 'مای پیکسل' : 'MY PIXEL';
  document.title = lang === 'fa' ? 'مای پیکسل | MY PIXEL' : 'MY PIXEL | مای پیکسل';

  updateAccountLabel();
  renderPanelNav();
  renderCart();
  route();
}

/* ==================================================================
   راه‌اندازی
================================================================== */
function wireEvents(){
  // پنل
  $('#burgerBtn').onclick = () => $('#sidePanel').classList.contains('open') ? closePanel() : openPanel();
  $('#panelClose').onclick = closePanel;
  $('#panelOverlay').onclick = closePanel;

  // جستجو
  wireSearch($('#searchInput'), $('#searchBox'), $('#searchResults'), false);
  wireSearch($('#searchInputM'), $('#searchBoxM'), $('#searchResultsM'), true);
  $('#searchClear').onclick = () => { window.__clearedSearch = true;
    $('#searchInput').value = '';
    $('#searchBox').classList.remove('has-value');
    $('#searchResults').classList.remove('open');
    $('#searchInput').focus();
  };
  $('#searchMobileBtn').onclick = openSearchSheet;
  $('#searchSheetClose').onclick = closeSearchSheet;
  document.addEventListener('click', e => {
    if(!e.target.closest('#searchWrap')) $('#searchResults').classList.remove('open');
  });

  // زبان
  $('#langBtn').onclick = () => applyLang(S.lang === 'fa' ? 'en' : 'fa');
  $('#langBtnPanel').onclick = () => applyLang(S.lang === 'fa' ? 'en' : 'fa');

  // حساب کاربری
  $('#accountBtn').onclick = openAccount;
  $('#accountBtnPanel').onclick = () => { closePanel(); openAccount(); };
  $('#accountClose').onclick = closeAccount;
  $('#accountOverlay').onclick = closeAccount;

  // سبد
  $('#cartBtn').onclick = openCart;
  $('#cartClose').onclick = closeCart;
  $('#cartOverlay').onclick = closeCart;
  $('#cartItems').addEventListener('click', e => {
    const btn = e.target.closest('button[data-act]');
    if(!btn) return;
    const key = btn.dataset.key;
    const line = S.cart.find(c => cartKey(c.id, c) === key);
    if(!line) return;
    const p = findProduct(line.id);
    if(btn.dataset.act === 'remove') S.cart = S.cart.filter(c => cartKey(c.id, c) !== key);
    else if(btn.dataset.act === 'plus'){ if(!p || line.qty < p.stock) line.qty++; }
    else if(btn.dataset.act === 'minus'){ line.qty--; if(line.qty <= 0) S.cart = S.cart.filter(c => cartKey(c.id, c) !== key); }
    saveCart(); renderCart();
  });
  $('#checkoutBtn').onclick = () => { if(S.cart.length) toast(t('toast_soon')); };

  // افزودن به سبد (سراسری)
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-add]');
    if(btn && !btn.disabled) addToCart(parseInt(btn.dataset.add));
  });

  // فیلترها
  $('#catChips').addEventListener('click', e => {
    const c = e.target.closest('[data-cat]');
    if(!c) return;
    S.filters.category = c.dataset.cat; S.filters.page = 1;
    renderProducts();
  });
  $('#sortSelect').onchange = e => { S.filters.sort = e.target.value; S.filters.page = 1; renderProducts(); };
  $('#priceRange').oninput = e => {
    S.filters.max = parseInt(e.target.value);
    $('#priceRangeLabel').textContent = money(S.filters.max);
  };
  $('#priceRange').onchange = () => { S.filters.page = 1; renderProducts(); };
  $('#inStockOnly').onchange = e => { S.filters.inStock = e.target.checked; S.filters.page = 1; renderProducts(); };
  $('#resetFilters').onclick = () => {
    S.filters = {category:'all', sort:'newest', max:null, inStock:false, q:'', page:1};
    $('#priceRange').value = $('#priceRange').max;
    $('#priceRangeLabel').textContent = money(parseInt($('#priceRange').max));
    go('/products');
    renderProducts();
  };
  $('#pagination').addEventListener('click', e => {
    const b = e.target.closest('[data-page]');
    if(!b) return;
    S.filters.page = parseInt(b.dataset.page);
    renderProducts();
    window.scrollTo({top:200, behavior:'smooth'});
  });

  // پیگیری
  $('#trackBtn').onclick = doTrack;
  $('#trackInput').addEventListener('keydown', e => { if(e.key === 'Enter') doTrack(); });

  // آکاردئون سوالات
  $('#faqList').addEventListener('click', e => {
    const q = e.target.closest('.faq-q');
    if(!q) return;
    const item = q.parentElement;
    const answer = item.querySelector('.faq-a');
    const isOpen = item.classList.contains('open');
    $$('.faq-item').forEach(i => { i.classList.remove('open'); i.querySelector('.faq-a').style.maxHeight = null; });
    if(!isOpen){ item.classList.add('open'); answer.style.maxHeight = answer.scrollHeight + 'px'; }
  });

  // کیبورد
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape'){ closePanel(); closeCart(); closeAccount(); closeSearchSheet(); }
    if((e.ctrlKey || e.metaKey) && e.key === 'k'){
      e.preventDefault();
      if(window.innerWidth <= 820) openSearchSheet(); else $('#searchInput').focus();
    }
  });

  // اسکرول هدر
  // فقط وقتی از آستانه رد شد کلاس عوض شود — نه در هر فریم اسکرول
  let wasScrolled = false, scrollTick = false;
  const nav = $('#siteNav');
  window.addEventListener('scroll', () => {
    if(scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      const now = window.scrollY > 24;
      if(now !== wasScrolled){ wasScrolled = now; nav.classList.toggle('scrolled', now); }
      scrollTick = false;
    });
  }, {passive:true});

  window.addEventListener('popstate', route);
  wireLinks();
}

function spawnPixels(){
  const field = $('#blobField');
  if(!field) return;
  // روی موبایل و دستگاه‌های ضعیف تعداد کمتر
  const weak = window.innerWidth < 900
    || (navigator.hardwareConcurrency || 8) <= 4
    || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = weak ? 6 : 14;
  for(let i = 0; i < count; i++){
    const p = document.createElement('div');
    p.className = 'pixel';
    p.style.left = Math.random() * 100 + '%';
    p.style.bottom = '-10px';
    p.style.animationDuration = (8 + Math.random() * 10) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    field.appendChild(p);
  }
}

async function init(){
  wireEvents();
  spawnPixels();
  await loadData();
  applyLang(S.lang);
  renderCart();
  route();
  if(S.offline) console.info('مای پیکسل در حالت نمایشی اجرا شد (سرور در دسترس نیست).');
}


/* ══════════════════════════════════════════════════════════════
   بخش دوم — قابلیت‌های افزوده
   توابعِ هم‌نام، نسخه‌های بالاتر را بازنویسی می‌کنند (hoisting)
══════════════════════════════════════════════════════════════ */

const LS2 = { hist:'mp_search_hist', wish:'mp_wish_local' };

const S2 = {
  wish: new Set(),
  wishBusy: false,
  provinces: [],
  promotions: [],
  gateways: [],
  addresses: [],
  product: null,
  pick: { size:null, color:null, img:0 },
  co: { addressId:null, gateway:null, coupon:null, couponAmount:0 },
  acctTab: 'profile'
};

/* ---------- آیکون‌های افزوده ---------- */
const IC2 = {
  heart:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 20.4 4.6 13a4.9 4.9 0 0 1 7-6.9l.4.4.4-.4a4.9 4.9 0 0 1 7 6.9z"/></svg>',
  heartOn:  '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M12 20.4 4.6 13a4.9 4.9 0 0 1 7-6.9l.4.4.4-.4a4.9 4.9 0 0 1 7 6.9z"/></svg>',
  heartOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M12 20.4 4.6 13a4.9 4.9 0 0 1 7-6.9l.4.4.4-.4a4.9 4.9 0 0 1 7 6.9z"/><line x1="4.6" y1="4.4" x2="19.4" y2="19.6" stroke-width="2.1"/></svg>',
  share:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5.6" r="2.8"/><circle cx="6" cy="12" r="2.8"/><circle cx="18" cy="18.4" r="2.8"/><path d="m8.5 10.7 7-3.5m-7 6.1 7 3.5"/></svg>',
  shield:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.6 4.2 6v6.1c0 4.5 3.3 8.2 7.8 9.3 4.5-1.1 7.8-4.8 7.8-9.3V6z"/><path d="m8.6 11.8 2.3 2.3 4.5-4.5"/></svg>',
  star:     '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 3.2 2.8 5.7 6.3.9-4.6 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.8l6.3-.9z"/></svg>',
  starO:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="m12 3.2 2.8 5.7 6.3.9-4.6 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.8l6.3-.9z"/></svg>',
  clock:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/></svg>',
  x:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>',
  telegram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M21.4 4.2 2.9 11.3a.6.6 0 0 0 .05 1.13l4.6 1.44 1.75 5.4a.6.6 0 0 0 1 .24l2.5-2.5 4.6 3.4a.6.6 0 0 0 .95-.36l3.1-15.1a.6.6 0 0 0-.85-.65z"/><path d="m7.55 13.87 11-7.1-8 8.6"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.2 20.8 4.6 16a8.6 8.6 0 1 1 3.4 3.3z"/><path d="M9 9.2c0 3 2.4 5.4 5.4 5.4l.9-1.5-1.9-.9-.9.9a4.4 4.4 0 0 1-1.9-1.9l.9-.9-.9-1.9z"/></svg>',
  instagram:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg>',
  copy:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="8.4" y="8.4" width="12.2" height="12.2" rx="2.4"/><path d="M15.6 5.4H5.8a2.4 2.4 0 0 0-2.4 2.4v9.8"/></svg>',
  pin:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 21.4S4.8 15 4.8 9.8a7.2 7.2 0 0 1 14.4 0C19.2 15 12 21.4 12 21.4z"/><circle cx="12" cy="9.8" r="2.6"/></svg>',
  truck:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M2.6 6.4h11.2v10H2.6z"/><path d="M13.8 10h3.6l3 3.4v3h-6.6"/><circle cx="7" cy="18" r="1.9"/><circle cx="17.4" cy="18" r="1.9"/></svg>',
  back:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.4 14.4 4.6 9.6l4.8-4.8"/><path d="M4.6 9.6h9.8a5 5 0 0 1 0 10H8.6"/></svg>',
  user:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c0-4.2 3.4-6.6 7.5-6.6s7.5 2.4 7.5 6.6"/></svg>',
  check:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 13 10 18 19 6"/></svg>',
  edit:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M4 20h4L19 9a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5z"/></svg>',
  trash:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.5h16M9.5 6.5V4.5h5v2M6.5 6.5 7.5 20h9l1-13.5"/></svg>',
  plus:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  bag:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4.4 8h15.2l1.2 12.6H3.2z"/><path d="M8.6 10.4V6.6a3.4 3.4 0 0 1 6.8 0v3.8"/></svg>',
  badge:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="m12 2.4 2.5 1.8 3-.2 1 2.9 2.5 1.7-1 2.9 1 2.9-2.5 1.7-1 2.9-3-.2L12 21.6l-2.5-1.8-3 .2-1-2.9L3 15.4l1-2.9-1-2.9 2.5-1.7 1-2.9 3 .2z"/><path d="m9 12 2.2 2.2L15.4 10"/></svg>',
  receipt:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 2.6h14v18.8l-2.3-1.6-2.3 1.6-2.4-1.6-2.4 1.6-2.3-1.6L5 21.4z"/><path d="M8.6 8h6.8M8.6 12h6.8M8.6 16h4"/></svg>',
  card:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.6h19M6 14.6h4"/></svg>',
  minus:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  users:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.9 3-6.2 6.5-6.2s6.5 2.3 6.5 6.2"/><path d="M16.5 5.2a3.4 3.4 0 0 1 0 6.4M18 13.9c2.2.5 3.5 2.3 3.5 5"/></svg>',
  search:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>',
  help:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M9.4 9.2a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.2-2.6 3.9"/><circle cx="12" cy="17.4" r=".9" fill="currentColor" stroke="none"/></svg>',
  sparkle:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="m12 2.6 2 5.4 5.4 2-5.4 2-2 5.4-2-5.4-5.4-2 5.4-2z"/><path d="m18.6 15.4.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z"/></svg>',
  home:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3.4 10.6 12 3.6l8.6 7v9a1.4 1.4 0 0 1-1.4 1.4H4.8a1.4 1.4 0 0 1-1.4-1.4z"/><path d="M9.4 21v-6.6h5.2V21"/></svg>',
  chev:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 5 16 12 9 19"/></svg>',
  chevBig:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14 5 7 12 14 19"/></svg>',
  filter:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M3 6.4h18M6.4 12h11.2M10 17.6h4"/></svg>',
  alert:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.6v5.2"/><circle cx="12" cy="16.6" r=".9" fill="currentColor" stroke="none"/></svg>',
  price:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M20.6 12.6 12.9 20.3a2 2 0 0 1-2.8 0l-6.4-6.4a2 2 0 0 1-.6-1.4V4.6a1.2 1.2 0 0 1 1.2-1.2h7.9a2 2 0 0 1 1.4.6l6.4 6.4a2 2 0 0 1 0 2.2z"/><circle cx="7.6" cy="7.6" r="1.4"/></svg>'
};

/* ---------- ابزار ---------- */
function icon2(k){ return IC2[k] || ''; }
function starsHtml(v, max=5){
  let h = '<span class="stars">';
  for(let i=1; i<=max; i++) h += `<span class="${i<=Math.round(v)?'s-on':'s-off'}">${i<=Math.round(v)?IC2.star:IC2.starO}</span>`;
  return h + '</span>';
}
function stagger(el){
  if(!el) return;
  el.classList.remove('stagger-in');
  void el.offsetWidth;
  el.classList.add('stagger-in');
}
function ripple(e){
  const b = e.currentTarget;
  if(!b.classList.contains('ripple')) b.classList.add('ripple');
  const r = b.getBoundingClientRect();
  const d = Math.max(r.width, r.height);
  const sp = document.createElement('span');
  sp.className = 'rip';
  sp.style.width = sp.style.height = d + 'px';
  sp.style.left = (e.clientX - r.left - d/2) + 'px';
  sp.style.top  = (e.clientY - r.top  - d/2) + 'px';
  b.appendChild(sp);
  setTimeout(() => sp.remove(), 560);
}

/* ══════════════════════════════════════════
   رفع پرش پنل‌ها هنگام تعویض زبان
══════════════════════════════════════════ */
function applyLang(lang){
  // ترنزیشن‌ها را یک فریم خاموش کن تا پنل‌ها موقع تغییر جهت از وسط صفحه رد نشوند
  const root = document.documentElement;
  root.classList.add('lang-switching');

  _origApplyLang(lang);   // پرچم، برند، عنوان صفحه، لیبل حساب، ناوبری، سبد، روتر

  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('lang-switching')));
  renderTrust();
}

/* ══════════════════════════════════════════
   تم روشن و تاریک
══════════════════════════════════════════ */
const SYS_THEME = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

/** تم فعلی: انتخاب کاربر، وگرنه تم سیستم */
function currentTheme(){
  const saved = localStorage.getItem(LS.theme);
  if(saved === 'light' || saved === 'dark') return saved;
  return SYS_THEME && SYS_THEME.matches ? 'light' : 'dark';
}

function applyTheme(mode, animate){
  const root = document.documentElement;
  if(animate){
    root.classList.add('theme-switching');
    setTimeout(() => root.classList.remove('theme-switching'), 320);
  }
  root.dataset.theme = mode;

  // نوار آدرس مرورگر موبایل هم هماهنگ شود
  let meta = document.querySelector('meta[name="theme-color"]');
  if(!meta){
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = mode === 'light' ? '#F4F7F8' : '#06070A';

  const label = mode === 'light' ? t('theme_to_dark') : t('theme_to_light');
  ['#themeBtn', '#themeBtnPanel'].forEach(sel => {
    const b = $(sel);
    if(b){ b.title = label; b.setAttribute('aria-label', label); }
  });
}

function toggleTheme(){
  const next = currentTheme() === 'light' ? 'dark' : 'light';
  localStorage.setItem(LS.theme, next);
  applyTheme(next, true);
  toast(next === 'light' ? t('theme_light_on') : t('theme_dark_on'), 'ok');
}

function wireTheme(){
  applyTheme(currentTheme(), false);
  ['#themeBtn', '#themeBtnPanel'].forEach(sel => {
    const b = $(sel);
    if(b) b.onclick = toggleTheme;
  });
  // اگر کاربر انتخابی نکرده، با تغییر تم سیستم همراه شو
  if(SYS_THEME && SYS_THEME.addEventListener){
    SYS_THEME.addEventListener('change', () => {
      if(!localStorage.getItem(LS.theme)) applyTheme(currentTheme(), true);
    });
  }
}

/* ══════════════════════════════════════════
   ورود با گوگل
══════════════════════════════════════════ */
let GOOGLE_CONF = null;

/** تنظیمات گوگل را یک بار می‌گیرد و کش می‌کند */
async function googleConf(){
  if(GOOGLE_CONF) return GOOGLE_CONF;
  try{ GOOGLE_CONF = await api('/auth/google/config'); }
  catch(_){ GOOGLE_CONF = { enabled:false }; }
  return GOOGLE_CONF;
}

/** اسکریپت Google Identity را فقط وقتی لازم شد لود می‌کند */
function loadGoogleScript(){
  if(window.google && google.accounts) return Promise.resolve(true);
  if(window.__gsiLoading) return window.__gsiLoading;
  window.__gsiLoading = new Promise((resolve, reject) => {
    const sc = document.createElement('script');
    sc.src = 'https://accounts.google.com/gsi/client';
    sc.async = true; sc.defer = true;
    sc.onload = () => resolve(true);
    sc.onerror = () => reject(new Error('gsi-load-failed'));
    document.head.appendChild(sc);
  });
  return window.__gsiLoading;
}

async function wireGoogle(){
  const btn = $('#googleBtn');
  if(!btn) return;

  const conf = await googleConf();
  if(!conf.enabled || !conf.client_id){
    btn.hidden = true;
    const dv = btn.previousElementSibling;
    if(dv && dv.classList.contains('divider')) dv.hidden = true;
    return;
  }
  btn.hidden = false;

  btn.onclick = async () => {
    btn.disabled = true;
    try{
      await loadGoogleScript();
      google.accounts.id.initialize({
        client_id: conf.client_id,
        callback: async resp => {
          try{
            const r = await api('/auth/google', { method:'POST',
              body: JSON.stringify({ credential: resp.credential }) });
            S.token = r.token; S.user = r.user;
            localStorage.setItem(LS.token, r.token);
            updateAccountLabel(); closeAccount();
            toast(r.is_new ? t('welcome_new') : t('toast_login'), 'ok');
            if(typeof loadWish === 'function') loadWish().then(() => paintWishButtons());
            if(r.needs_phone) setTimeout(() => toast(t('add_phone_hint'), 'warn'), 1400);
            if(typeof afterLoginRedirect === 'function') afterLoginRedirect();
          }catch(e){ authError(e.message || t('err_generic')); }
          finally{ btn.disabled = false; }
        }
      });
      // پنجره‌ی گوگل؛ اگر مرورگر بلاکش کرد، دکمه‌ی رسمی را نشان بده
      google.accounts.id.prompt(n => {
        if(n.isNotDisplayed && n.isNotDisplayed()){
          const holder = document.createElement('div');
          holder.id = 'gsiBtn'; holder.style.marginTop = '10px';
          btn.parentNode.insertBefore(holder, btn.nextSibling);
          google.accounts.id.renderButton(holder,
            { theme:'filled_black', size:'large', shape:'pill', text:'continue_with', locale: S.lang });
          btn.hidden = true;
        }
        btn.disabled = false;
      });
    }catch(e){
      btn.disabled = false;
      toast(t('google_unavailable'), 'err');
    }
  };
}

/* ══════════════════════════════════════════
   تاریخچه جستجو
══════════════════════════════════════════ */
function histGet(){ try{ return JSON.parse(localStorage.getItem(LS2.hist) || '[]'); }catch(_){ return []; } }
function histAdd(q){
  q = String(q||'').trim();
  if(q.length < 2) return;
  const h = histGet().filter(x => x !== q);
  h.unshift(q);
  localStorage.setItem(LS2.hist, JSON.stringify(h.slice(0, 8)));
}
function histRemove(q){
  localStorage.setItem(LS2.hist, JSON.stringify(histGet().filter(x => x !== q)));
}
function histClear(){ localStorage.removeItem(LS2.hist); }

function histHtml(){
  const h = histGet();
  if(!h.length) return '';
  return `<div class="sr-section">
    <div class="sr-section-head"><span>${esc(t('recent_searches'))}</span>
      <button data-hist-clear>${esc(t('clear_all'))}</button></div>
    ${h.map(q => `<div class="sr-hist" data-hist="${esc(q)}">
      ${IC2.clock}<span>${esc(q)}</span>
      <span class="x" data-hist-del="${esc(q)}">${IC2.x}</span></div>`).join('')}
  </div>`;
}

async function runSearch(q, target){
  const term = String(q || '').trim();

  // کادر خالی → تاریخچه + دسته‌بندی‌ها
  if(!term){
    const html = histHtml() + quickCatsHtml();
    target.innerHTML = html;
    target.classList.toggle('open', !!html.trim());
    wireHist(target); wirePick(target);
    return;
  }

  target.classList.add('open');
  target.innerHTML = `<div class="sr-loading">${esc(t('searching'))}</div>`;

  let items = [], cats = [];
  try{
    const r = await api('/search?q=' + encodeURIComponent(term));
    items = r.items || []; cats = r.categories || [];
  }catch(_){
    const n = term.toLowerCase();
    items = (DEMO.products||[]).filter(p => p.name_fa.toLowerCase().includes(n)
      || (p.name_en||'').toLowerCase().includes(n) || (p.category_fa||'').toLowerCase().includes(n)).slice(0,8);
    cats = (DEMO.categories||[]).filter(c => c.name_fa.toLowerCase().includes(n)
      || (c.name_en||'').toLowerCase().includes(n)).slice(0,4);
  }
  lastResults = items;

  let html = '';
  if(cats.length){
    html += `<div class="sr-group"><div class="sr-group-head">${esc(t('in_categories'))}</div>
      <div class="sr-cats">${cats.map(c => `
        <a class="sr-cat" href="/products?category=${esc(c.slug)}" data-pick="${esc(term)}">
          <span class="sr-cat-ic">${icon(c.icon)}</span>
          <span>${esc(S.lang==='en' && c.name_en ? c.name_en : c.name_fa)}</span>
          ${c.product_count != null ? `<em>${num(c.product_count)}</em>` : ''}
        </a>`).join('')}</div></div>`;
  }
  if(items.length){
    html += `<div class="sr-group"><div class="sr-group-head">${esc(t('in_products'))}</div>
      ${items.map(p => `
        <a class="sr-item" href="/product/${esc(p.slug)}" data-pick="${esc(term)}">
          <span class="sr-thumb">${p.image_url ? `<img src="${esc(p.image_url)}" alt="" loading="lazy" decoding="async">` : icon(p.icon)}</span>
          <span class="sr-info"><h5>${hilite(pName(p), term)}</h5>
            <span>${esc(S.lang==='en' ? (p.category_en||'') : (p.category_fa||''))}</span></span>
          <span class="sr-price">${money(finalPrice(p))}</span>
        </a>`).join('')}
      <a class="sr-foot" href="/products?q=${encodeURIComponent(term)}" data-pick="${esc(term)}">
        ${esc(t('search_all'))} «${esc(term)}»</a></div>`;
  }
  if(!html){
    html = `<div class="sr-empty"><strong>${esc(t('no_results'))}</strong><br>${esc(t('no_results_sub'))}</div>`
         + quickCatsHtml() + histHtml();
  }

  target.innerHTML = html;
  target.classList.add('open');
  wireHist(target); wirePick(target);
}

/** واژه‌ی جستجو را در نام محصول برجسته می‌کند */
function hilite(text, term){
  const t0 = String(text||''), q = String(term||'').trim();
  if(!q) return esc(t0);
  const i = t0.toLowerCase().indexOf(q.toLowerCase());
  if(i < 0) return esc(t0);
  return esc(t0.slice(0,i)) + '<mark>' + esc(t0.slice(i,i+q.length)) + '</mark>' + esc(t0.slice(i+q.length));
}

/** دسته‌بندی‌ها به عنوان میان‌بر وقتی کادر خالی است */
function quickCatsHtml(){
  const cats = (S.categories||[]).slice(0,6);
  if(!cats.length) return '';
  return `<div class="sr-group"><div class="sr-group-head">${esc(t('browse_cats'))}</div>
    <div class="sr-cats">${cats.map(c => `
      <a class="sr-cat" href="/products?category=${esc(c.slug)}">
        <span class="sr-cat-ic">${icon(c.icon)}</span>
        <span>${esc(S.lang==='en' && c.name_en ? c.name_en : c.name_fa)}</span>
      </a>`).join('')}</div></div>`;
}

/** کلیک روی نتیجه: ثبت در تاریخچه، خالی کردن کادر، بستن */
function wirePick(target){
  const inp = target.id === 'searchResultsM' ? $('#searchInputM') : $('#searchInput');
  const close = () => {
    if(inp){ inp.value=''; const bx = inp.closest('.search-box'); if(bx) bx.classList.remove('has-value'); }
    target.classList.remove('open');
    if(typeof closeSearchSheet === 'function') closeSearchSheet();
  };
  $$('[data-pick]', target).forEach(a => a.addEventListener('click', () => { histAdd(a.dataset.pick); close(); }));
  $$('.sr-cat:not([data-pick])', target).forEach(a => a.addEventListener('click', close));
}

function wireHist(target){
  $$('[data-hist]', target).forEach(el => {
    el.addEventListener('click', e => {
      if(e.target.closest('[data-hist-del]')) return;
      const q = el.dataset.hist;
      histAdd(q);
      go('/products?q=' + encodeURIComponent(q));
      target.classList.remove('open');
      closeSearchSheet();
    });
  });
  $$('[data-hist-del]', target).forEach(el => el.addEventListener('click', e => {
    e.stopPropagation();
    histRemove(el.dataset.histDel);
    const input = target.id === 'searchResultsM' ? $('#searchInputM') : $('#searchInput');
    runSearch(input ? input.value : '', target);
  }));
  const cl = $('[data-hist-clear]', target);
  if(cl) cl.addEventListener('click', () => {
    histClear();
    const input = target.id === 'searchResultsM' ? $('#searchInputM') : $('#searchInput');
    runSearch(input ? input.value : '', target);
  });
}

/* ══════════════════════════════════════════
   علاقه‌مندی‌ها
══════════════════════════════════════════ */
async function loadWish(){
  if(!S.token){
    try{ S2.wish = new Set(JSON.parse(localStorage.getItem(LS2.wish) || '[]')); }catch(_){ S2.wish = new Set(); }
    return;
  }
  try{
    const r = await api('/account/wishlist/ids');
    S2.wish = new Set(r.ids);
  }catch(e){
    S2.wish = new Set();
    // توکن منقضی یا نامعتبر → پاکش کن تا درخواست‌های بعدی ۴۰۳ نگیرند
    if(e && (e.status === 401 || e.status === 403)){
      S.token = ''; S.user = null;
      localStorage.removeItem(LS.token);
      if(typeof updateAccountLabel === 'function') updateAccountLabel();
    }
  }
}

async function toggleWish(productId, btn){
  if(S2.wishBusy) return;
  S2.wishBusy = true;
  if(btn){ btn.disabled = true; btn.classList.add('bump'); }

  const wasOn = S2.wish.has(productId);

  if(!S.token){
    // مهمان: محلی نگه می‌داریم و به ورود دعوت می‌کنیم
    if(wasOn) S2.wish.delete(productId); else S2.wish.add(productId);
    localStorage.setItem(LS2.wish, JSON.stringify([...S2.wish]));
    toast(wasOn ? t('wish_removed') : t('wish_login_hint'), wasOn ? '' : 'warn');
    paintWishButtons();
  } else {
    try{
      const r = await api(`/account/wishlist/${productId}`, { method:'POST' });
      if(r.wished) S2.wish.add(productId); else S2.wish.delete(productId);
      toast(r.wished ? t('wish_added') : t('wish_removed'), 'ok');
      paintWishButtons();
      if(location.pathname.startsWith('/wishlist')) renderWishlist();
    }catch(e){ toast(e.message || t('err_generic'), 'err'); }
  }

  // یک ثانیه تاخیر ضد اسپم
  setTimeout(() => {
    S2.wishBusy = false;
    if(btn){ btn.disabled = false; btn.classList.remove('bump'); }
  }, 1000);
}

function paintWishButtons(){
  $$('[data-wish]').forEach(b => {
    const on = S2.wish.has(parseInt(b.dataset.wish));
    b.classList.toggle('on', on);
    const lbl = b.querySelector('.wish-label');
    b.querySelector('.wish-ico').innerHTML = on ? IC2.heartOff : IC2.heart;
    if(lbl) lbl.textContent = on ? t('wish_remove') : t('wish_add');
    b.title = on ? t('wish_remove') : t('wish_add');
  });
}

function wireWishButtons(scope){
  $$('[data-wish]', scope || document).forEach(b => {
    if(b.dataset.wired) return;
    b.dataset.wired = '1';
    b.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      ripple(e);
      toggleWish(parseInt(b.dataset.wish), b);
    });
  });
}

/* ══════════════════════════════════════════
   کارت محصول با دکمه قلب
══════════════════════════════════════════ */
function productCard(p){
  const off = p.discount_price && p.discount_price < p.price;
  const pct = off ? Math.round((1 - p.discount_price / p.price) * 100) : 0;
  const out = p.stock <= 0;
  const cat = S.lang === 'en' ? (p.category_en || '') : (p.category_fa || '');
  const on  = S2.wish.has(p.id);
  return `<article class="prod-card">
    <button class="card-wish ${on?'on':''}" data-wish="${p.id}" title="${esc(on?t('wish_remove'):t('wish_add'))}">
      <span class="wish-ico">${on ? IC2.heartOff : IC2.heart}</span>
    </button>
    <a href="/product/${esc(p.slug)}" class="prod-visual" aria-label="${esc(pName(p))}">
      <div class="prod-badges">
        ${cat ? `<span class="badge badge-cat">${esc(cat)}</span>` : ''}
        ${off ? `<span class="badge badge-off">${num(pct)}٪ ${esc(t('off'))}</span>` : ''}
        ${out ? `<span class="badge badge-out">${esc(t('out_of_stock'))}</span>` : ''}
      </div>
      ${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(pName(p))}" loading="lazy" decoding="async">` : icon(p.icon)}
    </a>
    <div class="prod-body">
      <h3><a href="/product/${esc(p.slug)}">${esc(pName(p))}</a></h3>
      ${p.rating_count ? `<div class="rating-line" style="margin:-4px 0 8px">${starsHtml(p.rating_avg)}
        <span>${num(p.rating_avg)} (${num(p.rating_count)})</span></div>` : ''}
      <div class="price-row">
        <span class="price">${money(finalPrice(p))}</span>
        ${off ? `<span class="price-old">${money(p.price)}</span>` : ''}
      </div>
      <div class="prod-actions">
        <button class="add-btn" data-add="${p.id}" ${out ? 'disabled' : ''}>
          ${esc(out ? t('out_of_stock') : t('add_to_cart'))}
        </button>
      </div>
    </div>
  </article>`;
}

/* ══════════════════════════════════════════
   صفحه اصلی — با پروموشن‌ها
══════════════════════════════════════════ */
async function renderHome(){
  const featured = S.products.filter(p => p.is_featured).slice(0, 8);
  const list = featured.length ? featured : S.products.slice(0, 8);
  const fg = $('#featuredGrid');
  fg.innerHTML = list.map(x => `<div class="hs-cell">${productCard(x)}</div>`).join('');
  stagger(fg);
  const hsHost = $('[data-hs="featured"]');
  if(hsHost){
    const pv = hsHost.querySelector('.hs-nav.prev'), nx = hsHost.querySelector('.hs-nav.next');
    if(pv && !pv.innerHTML.trim()) pv.innerHTML = IC2.chevBig;
    if(nx && !nx.innerHTML.trim()) nx.innerHTML = IC2.chevBig;
    initHScroll(hsHost);
  }
  const hc = $('#homeCatList');
  hc.innerHTML = S.categories.slice(0, 3).map(categoryRow).join('');
  stagger(hc);
  wireWishButtons(fg);

  try{
    const r = await api('/promotions');
    S2.promotions = r.items || [];
  }catch(_){ S2.promotions = []; }
  renderPromotions();
  loadBanners();
}

function renderPromotions(){
  let host = $('#promoHost');
  if(!host){
    host = document.createElement('div');
    host.id = 'promoHost';
    const anchor = $('#featuredGrid');
    const block = anchor ? anchor.closest('.block') : null;
    if(block && block.parentNode) block.parentNode.insertBefore(host, block.nextSibling);
    else return;
  }
  if(!S2.promotions.length){ host.innerHTML = ''; return; }

  host.innerHTML = S2.promotions.map(pr => `
    <section class="block">
      <div class="wrap">
        <div class="block-head">
          <div>
            ${pr.badge_fa ? `<div class="eyebrow">${esc(pr.badge_fa)}</div>` : ''}
            <h2>${esc(S.lang==='en' && pr.title_en ? pr.title_en : pr.title_fa)}</h2>
            ${pr.subtitle_fa ? `<p>${esc(pr.subtitle_fa)}</p>` : ''}
          </div>
          ${pr.ends_at ? `<span class="badge badge-off">${esc(t('limited'))}</span>` : ''}
        </div>
        <div class="hscroll" data-hs="${pr.id}">
          <button class="hs-nav prev" aria-label="${esc(t('prev_image'))}">${IC2.chevBig}</button>
          <div class="hs-track" id="promo-${pr.id}">
            ${pr.products.map(x => `<div class="hs-cell">${productCard(x)}</div>`).join('')}
          </div>
          <button class="hs-nav next" aria-label="${esc(t('next_image'))}">${IC2.chevBig}</button>
        </div>
      </div>
    </section>`).join('');

  S2.promotions.forEach(pr => { stagger($('#promo-' + pr.id)); initHScroll($(`[data-hs="${pr.id}"]`)); });
  wireWishButtons(host);
  $$('[data-add]', host).forEach(b => b.addEventListener('click', () => addToCart(parseInt(b.dataset.add))));
}

/* ══════════════════════════════════════════
   بنرهای تبلیغاتی — سه جایگاه، اسلایدر خودکار
══════════════════════════════════════════ */
const BANNER_TIMERS = {};

async function loadBanners(){
  try{ S2.banners = (await api('/banners')).items || []; }
  catch(_){ S2.banners = []; }
  ['home_top','home_mid','home_bottom'].forEach(pos => renderBannerSlot(pos));
}

function renderBannerSlot(pos){
  const host = $('#banner-' + pos);
  if(!host) return;
  const items = (S2.banners || []).filter(b => b.position === pos);

  if(!items.length){ host.innerHTML = ''; host.classList.remove('has'); return; }
  host.classList.add('has');

  host.innerHTML = `
    <div class="bn-slider" data-pos="${pos}">
      <div class="bn-track">
        ${items.map(b => `
          <${b.link_url ? 'a' : 'div'} class="bn-slide"${b.link_url ? ` href="${esc(b.link_url)}"` : ''}>
            ${b.image_url
              ? `<img src="${esc(b.image_url)}" alt="${esc(b.title_fa||'')}" draggable="false">`
              : `<span class="bn-fallback">${window.MPIcons ? MPIcons.get('sparkle') : ''}</span>`}
            ${(b.title_fa || b.body_fa) ? `<span class="bn-text">
              ${b.title_fa ? `<b>${esc(b.title_fa)}</b>` : ''}
              ${b.body_fa ? `<em>${esc(b.body_fa)}</em>` : ''}
            </span>` : ''}
          </${b.link_url ? 'a' : 'div'}>`).join('')}
      </div>
      ${items.length > 1 ? `
        <button class="bn-nav prev" aria-label="${esc(t('prev_image'))}">${IC2.chevBig}</button>
        <button class="bn-nav next" aria-label="${esc(t('next_image'))}">${IC2.chevBig}</button>
        <div class="bn-dots">${items.map((_,i)=>`<button class="${i?'':'on'}" data-dot="${i}"></button>`).join('')}</div>` : ''}
    </div>`;

  if(items.length > 1) initBannerSlider(host.querySelector('.bn-slider'), items.length, pos);
}

function initBannerSlider(root, count, pos){
  const track = root.querySelector('.bn-track');
  // در RTL اسلاید اول سمت راست است (row-reverse) پس ترک به راست حرکت می‌کند
  const SIGN = document.documentElement.dir === 'rtl' ? 1 : -1;
  let idx = 0, paused = false;

  const go = (i, animate = true) => {
    idx = (i + count) % count;
    track.style.transition = animate ? 'transform .5s cubic-bezier(.3,1,.4,1)' : 'none';
    track.style.transform = `translateX(${SIGN * idx * 100}%)`;
    root.querySelectorAll('[data-dot]').forEach((d,j) => d.classList.toggle('on', j === idx));
  };

  root.querySelector('.prev').onclick = e => { e.preventDefault(); go(idx - 1); bump(); };
  root.querySelector('.next').onclick = e => { e.preventDefault(); go(idx + 1); bump(); };
  root.querySelectorAll('[data-dot]').forEach(d =>
    d.onclick = e => { e.preventDefault(); go(parseInt(d.dataset.dot)); bump(); });

  // پخش خودکار هر ۵ ثانیه، با توقف روی هاور
  clearInterval(BANNER_TIMERS[pos]);
  const tick = () => { if(!paused && !document.hidden) go(idx + 1); };
  BANNER_TIMERS[pos] = setInterval(tick, 5000);
  const bump = () => { clearInterval(BANNER_TIMERS[pos]); BANNER_TIMERS[pos] = setInterval(tick, 5000); };

  root.addEventListener('mouseenter', () => paused = true);
  root.addEventListener('mouseleave', () => paused = false);

  // سوایپ دستی
  let x0 = null, dx = 0, dragging = false;
  const w = () => root.getBoundingClientRect().width || 1;
  const down = e => { x0 = (e.touches?e.touches[0].clientX:e.clientX); dx = 0; dragging = true;
                      paused = true; track.style.transition = 'none'; };
  const move = e => {
    if(!dragging) return;
    dx = (e.touches?e.touches[0].clientX:e.clientX) - x0;
    track.style.transform = `translateX(${SIGN*idx*100 + (dx/w())*100}%)`;
    if(e.cancelable && Math.abs(dx) > 12) e.preventDefault();
  };
  const up = e => {
    if(!dragging) return;
    dragging = false; paused = false;
    if(Math.abs(dx) > w()*0.15){ if(e) e.preventDefault?.(); go(idx + (dx*SIGN > 0 ? -1 : 1)); bump(); }
    else go(idx);
    x0 = null; dx = 0;
  };
  root.addEventListener('touchstart', down, {passive:true});
  root.addEventListener('touchmove',  move, {passive:false});
  root.addEventListener('touchend',   up);
  root.addEventListener('mousedown',  down);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup',   up);
  // جلوگیری از باز شدن لینک بعد از درگ
  root.querySelectorAll('a.bn-slide').forEach(a =>
    a.addEventListener('click', e => { if(Math.abs(dx) > 6) e.preventDefault(); }));

  go(0, false);
}

/** ردیف افقی قابل اسکرول با دکمه‌های چپ/راست */
function initHScroll(root){
  if(!root) return;
  const track = root.querySelector('.hs-track');
  const prev = root.querySelector('.hs-nav.prev'), next = root.querySelector('.hs-nav.next');
  const step = () => Math.max(220, track.clientWidth * 0.75);
  const rtl = document.documentElement.dir === 'rtl';

  const paint = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    const x = Math.abs(track.scrollLeft);
    prev.disabled = x <= 2;
    next.disabled = x >= max;
    root.classList.toggle('no-nav', track.scrollWidth <= track.clientWidth + 4);
  };

  prev.onclick = () => track.scrollBy({left: (rtl ? 1 : -1) * step(), behavior:'smooth'});
  next.onclick = () => track.scrollBy({left: (rtl ? -1 : 1) * step(), behavior:'smooth'});
  track.addEventListener('scroll', paint, {passive:true});
  window.addEventListener('resize', paint);
  paint();
}

/* ══════════════════════════════════════════
   صفحه محصول — کامل
══════════════════════════════════════════ */
async function renderProduct(slug){
  const host = $('#productBody') || $('#page-product .wrap');
  if(!host) return;
  host.innerHTML = `<div class="prod-layout">
    <div class="skel" style="aspect-ratio:1/1;border-radius:22px"></div>
    <div><div class="skel" style="height:34px;margin-bottom:14px"></div>
    <div class="skel" style="height:18px;width:60%;margin-bottom:26px"></div>
    <div class="skel" style="height:120px"></div></div></div>`;

  let p;
  try{
    const r = await api('/products/' + encodeURIComponent(slug));
    p = r.item;
  }catch(_){
    p = DEMO.products.find(x => x.slug === slug);
    if(p){ p.images = []; p.sizes = []; p.colors = []; p.comments = []; }
  }
  if(!p){
    host.innerHTML = `<div class="empty-state">${IC2.bag}<h4>${esc(t('not_found'))}</h4>
      <p>${esc(t('not_found_sub'))}</p>
      <a class="btn btn-primary" href="/products">${esc(t('nav_products'))}</a></div>`;
    return;
  }

  S2.product = p;
  S2.pick = { size: p.sizes && p.sizes.length ? p.sizes[0] : null,
              color: p.colors && p.colors.length ? p.colors[0] : null, img: 0 };

  // روی اولین ترکیب موجود باز شو، نه لزوماً اولین گزینه
  if(p.has_variants && (p.variants || []).length){
    const inStock = p.variants.filter(v => v.stock > 0);
    if(inStock.length){
      const v = inStock[0];
      const sz = (p.sizes || []).find(x => x.id === v.size_id);
      const cl = (p.colors || []).find(x => x.id === v.color_id);
      if(sz) S2.pick.size = sz;
      if(cl) S2.pick.color = cl;
    }
  }
  if(p.is_wished) S2.wish.add(p.id);

  const pros = (S.lang==='en' && p.pros_en ? p.pros_en : p.pros_fa || '').split('\n').map(x=>x.trim()).filter(Boolean);
  const cons = (S.lang==='en' && p.cons_en ? p.cons_en : p.cons_fa || '').split('\n').map(x=>x.trim()).filter(Boolean);
  const imgs = (p.images && p.images.length) ? p.images : (p.image_url ? [{id:0,url:p.image_url}] : []);
  S2.galImages = imgs;
  const off  = p.discount_price && p.discount_price < p.price;
  const out  = p.stock <= 0;
  const wOn  = S2.wish.has(p.id);

  host.innerHTML = `
  <nav class="crumb">
    <a href="/" class="crumb-home">${IC2.home}<span>${esc(t('nav_home'))}</span></a>
    <span class="crumb-sep">${IC2.chev}</span>
    <a href="/products">${esc(t('nav_products'))}</a>
    ${p.category_fa ? `<span class="crumb-sep">${IC2.chev}</span>
      <a href="/products?category=${esc(p.category_slug||'')}">${esc(S.lang==='en'?(p.category_en||''):p.category_fa)}</a>` : ''}
    <span class="crumb-sep">${IC2.chev}</span>
    <span class="crumb-now">${esc(pName(p))}</span>
  </nav>

  <div class="prod-layout">

    <!-- گالری -->
    <div>
      <div class="gallery-main" id="galMain">
        <div class="gal-track" id="galTrack">
          ${imgs.length
            ? imgs.map(im => `<div class="gal-slide"><img src="${esc(im.url)}" alt="${esc(pName(p))}" draggable="false"></div>`).join('')
            : `<div class="gal-slide"><span class="ph">${icon(p.icon)}</span></div>`}
        </div>
        ${imgs.length > 1 ? `
          <button class="gal-nav prev" id="galPrev" aria-label="${esc(t('prev_image'))}">${IC2.chevBig}</button>
          <button class="gal-nav next" id="galNext" aria-label="${esc(t('next_image'))}">${IC2.chevBig}</button>
          <div class="gal-dots" id="galDots">
            ${imgs.map((_,i)=>`<button class="${i===0?'on':''}" data-dot="${i}" aria-label="${i+1}"></button>`).join('')}
          </div>
          <span class="gal-count" id="galCount">${num(1)} / ${num(imgs.length)}</span>` : ''}
      </div>
      ${imgs.length > 1 ? `<div class="gallery-thumbs" id="galThumbs">
        ${imgs.map((im,i) => `<button class="${i===0?'on':''}" data-img="${i}">
          <img src="${esc(im.url)}" alt="" loading="lazy" decoding="async"></button>`).join('')}
      </div>` : ''}
    </div>

    <!-- اطلاعات -->
    <div>
      ${p.category_fa ? `<div class="eyebrow">${esc(S.lang==='en'?(p.category_en||''):p.category_fa)}</div>` : ''}
      <h1 style="font-size:1.55rem;font-weight:800;margin:6px 0 10px">${esc(pName(p))}</h1>

      ${p.rating_count ? `<div class="rating-line" style="margin-bottom:14px">
        ${starsHtml(p.rating_avg)}<span>${num(p.rating_avg)} ${esc(t('from'))} ${num(p.rating_count)} ${esc(t('reviews_word'))}</span>
        <a href="#reviews" style="color:var(--cyan)">${esc(t('see_reviews'))}</a></div>`
        : `<div class="rating-line" style="margin-bottom:14px">${starsHtml(0)}<span>${esc(t('no_rating'))}</span></div>`}

      <div class="price-row" style="margin:16px 0">
        <span class="price" style="font-size:1.6rem" id="prPrice">${money(finalPrice(p))}</span>
        ${off ? `<span class="price-old">${money(p.price)}</span>` : ''}
      </div>

      ${p.desc_fa || p.desc_en ? `<p style="color:var(--text-2);line-height:2.1;font-size:.9rem">
        ${esc(S.lang==='en' && p.desc_en ? p.desc_en : p.desc_fa)}</p>` : ''}

      ${p.sizes && p.sizes.length ? `
      <div class="opt-group">
        <label>${esc(t('pick_size'))} <span class="picked" id="lblSize">${esc(((S2.pick.size||p.sizes[0]).label + ' ' + ((S2.pick.size||p.sizes[0]).unit||'')).trim())}</span></label>
        <div class="size-row" id="sizeRow">
          ${p.sizes.map(s => `<button class="size-btn ripple ${S2.pick.size && S2.pick.size.id===s.id?'on':''}" data-size="${s.id}">
            ${esc(s.label)}${s.unit ? `<small>${esc(s.unit)}</small>` : ''}
          </button>`).join('')}
        </div>
      </div>` : ''}

      ${p.colors && p.colors.length ? `
      <div class="opt-group">
        <label>${esc(t('pick_color'))} <span class="picked" id="lblColor">${esc((S2.pick.color||p.colors[0]).label)}</span></label>
        <div class="color-row" id="colorRow">
          ${p.colors.map(c => `<button class="color-btn ripple ${S2.pick.color && S2.pick.color.id===c.id?'on':''}" data-color="${c.id}">
            <span class="swatch" style="background:${esc(c.color_hex||'#888')}"></span>${esc(c.label)}
          </button>`).join('')}
        </div>
      </div>` : ''}

      <div class="buy-row" id="buyRow">
        <button class="btn btn-primary" id="prAdd" ${out?'disabled':''}>
          ${IC2.bag}<span>${esc(out ? t('out_of_stock') : t('add_to_cart'))}</span>
        </button>
        <div class="qty-stepper" id="prQty" hidden>
          <button data-q="-" aria-label="${esc(t('decrease'))}">${IC2.minus}</button>
          <span class="qv" id="prQtyVal">${num(1)}</span>
          <button data-q="+" aria-label="${esc(t('increase'))}">${IC2.plus}</button>
        </div>
        <a class="btn btn-ghost go-cart" id="prGoCart" hidden href="/checkout">
          ${esc(t('go_checkout'))}</a>
      </div>

      <div class="prod-tools">
        <button class="tool-btn wish-btn ${wOn?'on':''}" data-wish="${p.id}">
          <span class="wish-ico">${wOn ? IC2.heartOff : IC2.heart}</span>
          <span class="wish-label only-desktop">${esc(wOn ? t('wish_remove') : t('wish_add'))}</span>
        </button>
        <button class="tool-btn" id="prShare">
          ${IC2.share}<span class="only-desktop">${esc(t('share'))}</span>
        </button>
        <span class="rating-line stock-line" id="prStock" style="margin-inline-start:auto"></span>
      </div>

      ${p.has_warranty !== 0 ? `
      <div class="warranty">
        <span class="shield">${IC2.shield}</span>
        <span><b>${esc(t('warranty_title'))}</b>
          <span>${esc(t('warranty_sub'))}</span></span>
      </div>` : ''}

      ${(pros.length || cons.length) ? `
      <div class="proscons">
        ${pros.length ? `<div class="pc-box pc-pros">
          <h4>${IC2.check} ${esc(t('pros'))}</h4>
          <ul>${pros.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
        ${cons.length ? `<div class="pc-box pc-cons">
          <h4>${IC2.x} ${esc(t('cons'))}</h4>
          <ul>${cons.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      </div>` : ''}
    </div>
  </div>

  <!-- دیدگاه‌ها -->
  <section id="reviews" style="margin-top:52px">
    <div class="block-head"><div>
      <div class="eyebrow">${esc(t('reviews_eyebrow'))}</div>
      <h2 style="font-size:1.25rem">${esc(t('reviews_title'))}</h2>
    </div></div>
    <div id="reviewArea"></div>
  </section>`;

  // ── گالری: فلش، نقطه، تصویر کوچک، سوایپ ──
  initGallery(Math.max(1, imgs.length));

  // ── تنوع ──
  $$('#sizeRow [data-size]').forEach(b => b.onclick = e => {
    if(b.disabled) return;
    ripple(e);
    S2.pick.size = p.sizes.find(s => s.id == b.dataset.size);
    $$('#sizeRow button').forEach(x => x.classList.toggle('on', x === b));
    $('#lblSize').textContent = S2.pick.size.label + ' ' + (S2.pick.size.unit || '');
    refreshPrice(p); paintStock(p); syncBuyRow(p);
  });
  $$('#colorRow [data-color]').forEach(b => b.onclick = e => {
    if(b.disabled) return;
    ripple(e);
    S2.pick.color = p.colors.find(c => c.id == b.dataset.color);
    $$('#colorRow button').forEach(x => x.classList.toggle('on', x === b));
    $('#lblColor').textContent = S2.pick.color.label;
    // اگر سایز فعلی برای این رنگ موجود نیست، اولین سایز موجود را انتخاب کن
    if(p.has_variants && S2.pick.size && variantStock(p) <= 0){
      const alt = (p.sizes || []).find(sz => variantStock(p, sz.id, S2.pick.color.id) > 0);
      if(alt){
        S2.pick.size = alt;
        $$('#sizeRow [data-size]').forEach(x => x.classList.toggle('on', x.dataset.size == alt.id));
        const lbl = $('#lblSize');
        if(lbl) lbl.textContent = (alt.label + ' ' + (alt.unit || '')).trim();
      }
    }
    refreshPrice(p); paintStock(p); syncBuyRow(p);
    jumpToColorImage(p);
  });

  $('#prAdd').onclick = () => {
    addToCart(p.id, {
      size_id: S2.pick.size ? S2.pick.size.id : null,
      size: S2.pick.size ? (S2.pick.size.label + ' ' + (S2.pick.size.unit||'')).trim() : '',
      color_id: S2.pick.color ? S2.pick.color.id : null,
      color: S2.pick.color ? S2.pick.color.label : '',
      price_diff: (S2.pick.size ? (S2.pick.size.price_diff||0) : 0)
                + (S2.pick.color ? (S2.pick.color.price_diff||0) : 0)
    });
    syncBuyRow(p);
  };
  $('#prShare').onclick = () => openShare(p);
  wireWishButtons(host);
  renderReviews(p);
  paintStock(p);
  syncBuyRow(p);
  jumpToColorImage(p);

  $$('#prQty [data-q]').forEach(b => b.onclick = () => {
    const line = currentCartLine(p);
    if(!line) return;
    const cap = variantStock(p) || p.stock || 99;
    if(b.dataset.q === '+'){ if(line.qty < cap) line.qty++; else return toast(t('max_stock'), 'warn'); }
    else { line.qty--; if(line.qty <= 0) S.cart = S.cart.filter(c => c !== line); }
    saveCart(); renderCart(); syncBuyRow(p);
  });
}

/** کلاس رنگی وضعیت سفارش */
function statusPill(st){
  return {pending:'p-warn', paid:'p-cyan', processing:'p-cyan', packed:'p-cyan',
    shipped:'p-cyan', delivered:'p-ok', cancelled:'p-off', refunded:'p-off'}[st] || 'p-off';
}

/** جعبه‌ی «چیزی اینجا نیست» با شکل یکسان در همه تب‌ها */
function emptyBox(ic, title, sub, action){
  return `<div class="empty-box">
    <span class="eb-ic">${ic}</span>
    <b>${esc(title)}</b>
    ${sub ? `<span>${esc(sub)}</span>` : ''}
    ${action || ''}</div>`;
}

/** خط سبد مربوط به تنوع انتخاب‌شده‌ی فعلی */
function currentCartLine(p){
  const key = cartKey(p.id, {
    size_id: S2.pick.size ? S2.pick.size.id : null,
    color_id: S2.pick.color ? S2.pick.color.id : null
  });
  return S.cart.find(c => cartKey(c.id, c) === key);
}

/** دکمه «افزودن» را با استپر تعداد جابه‌جا می‌کند */
function syncBuyRow(p){
  const add = $('#prAdd'), qty = $('#prQty'), go = $('#prGoCart'), val = $('#prQtyVal');
  if(!add || !qty) return;
  const line = currentCartLine(p);
  if(line){
    add.hidden = true; qty.hidden = false; go.hidden = false;
    val.textContent = num(line.qty);
    qty.querySelector('[data-q="+"]').disabled = line.qty >= (variantStock(p) || p.stock || 99);
  } else {
    add.hidden = false; qty.hidden = true; go.hidden = true;
  }
}

/** اسلایدر گالری: فلش، نقطه، بندانگشتی، سوایپ لمسی و درگ ماوس */
function initGallery(count){
  const track = $('#galTrack');
  if(!track || count < 1) return;

  const SIGN = document.documentElement.dir === 'rtl' ? 1 : -1;
  let idx = 0;
  S2.galGo = i => go(i);          // تا انتخاب رنگ بتواند گالری را جابه‌جا کند

  function go(i, animate = true){
    idx = Math.max(0, Math.min(count - 1, i));
    S2.pick.img = idx;
    track.style.transition = animate ? 'transform .38s cubic-bezier(.3,1,.4,1)' : 'none';
    track.style.transform = `translateX(${SIGN * idx * 100}%)`;
    $$('#galDots [data-dot]').forEach((d,j) => d.classList.toggle('on', j === idx));
    $$('#galThumbs [data-img]').forEach((b,j) => b.classList.toggle('on', j === idx));
    const c = $('#galCount'); if(c) c.textContent = `${num(idx+1)} / ${num(count)}`;
    const pv = $('#galPrev'), nx = $('#galNext');
    if(pv) pv.disabled = idx === 0;
    if(nx) nx.disabled = idx === count - 1;
  }

  const prev = $('#galPrev'), next = $('#galNext');
  if(prev) prev.onclick = () => go(idx - 1);
  if(next) next.onclick = () => go(idx + 1);
  $$('#galDots [data-dot]').forEach(d => d.onclick = () => go(parseInt(d.dataset.dot)));
  $$('#galThumbs [data-img]').forEach(b => b.onclick = () => go(parseInt(b.dataset.img)));

  // کیبورد
  const main = $('#galMain');
  const rtl = document.documentElement.dir === 'rtl';
  main.tabIndex = 0;
  main.onkeydown = e => {
    if(e.key === 'ArrowRight') go(rtl ? idx - 1 : idx + 1);
    if(e.key === 'ArrowLeft')  go(rtl ? idx + 1 : idx - 1);
  };

  // سوایپ لمسی و درگ ماوس
  let x0 = null, dx = 0, dragging = false;
  const w = () => main.getBoundingClientRect().width || 1;

  const down = e => {
    x0 = (e.touches ? e.touches[0].clientX : e.clientX);
    dx = 0; dragging = true;
    track.style.transition = 'none';
  };
  const move = e => {
    if(!dragging || x0 === null) return;
    dx = (e.touches ? e.touches[0].clientX : e.clientX) - x0;
    track.style.transform = `translateX(${SIGN * idx * 100 + (dx / w()) * 100}%)`;
    if(e.cancelable && Math.abs(dx) > 12) e.preventDefault();
  };
  const up = () => {
    if(!dragging) return;
    dragging = false;
    const th = w() * 0.18;
    if(Math.abs(dx) > th) go(idx + (dx * SIGN > 0 ? -1 : 1));
    else go(idx);
    x0 = null; dx = 0;
  };

  main.addEventListener('touchstart', down, {passive:true});
  main.addEventListener('touchmove',  move, {passive:false});
  main.addEventListener('touchend',   up);
  main.addEventListener('mousedown',  down);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup',   up);

  go(0, false);
}

/** موجودی ترکیب سایز×رنگ انتخاب‌شده (اگر محصول ترکیب نداشته باشد، موجودی کل) */
function variantStock(p, sizeId, colorId){
  if(!p.has_variants) return p.stock;
  const sid = sizeId ?? (S2.pick.size ? S2.pick.size.id : null);
  const cid = colorId ?? (S2.pick.color ? S2.pick.color.id : null);
  const v = (p.variants || []).find(x => (x.size_id ?? null) === (sid ?? null)
                                      && (x.color_id ?? null) === (cid ?? null));
  return v ? v.stock : 0;
}

/** موجودی را نشان می‌دهد و گزینه‌های ناموجود را علامت می‌زند */
function paintStock(p){
  const box = $('#prStock');
  const n = variantStock(p);
  const combo = [S2.pick.size ? (S2.pick.size.label + ' ' + (S2.pick.size.unit||'')).trim() : '',
                 S2.pick.color ? S2.pick.color.label : ''].filter(Boolean).join(' · ');

  if(box){
    box.innerHTML = n > 0
      ? `<span>${esc(t('stock_left'))}${combo ? ` <em class="combo">${esc(combo)}</em>` : ''}:</span>
         <b class="${n <= 3 ? 'low' : ''}">${num(n)}</b>`
      : `<b class="none">${esc(combo ? t('combo_out') : t('out_of_stock'))}</b>`;
    box.classList.toggle('is-out', n <= 0);
    box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
  }

  // رنگ‌های ناموجود برای سایز فعلی و برعکس
  if(p.has_variants){
    const sid = S2.pick.size ? S2.pick.size.id : null;
    const cid = S2.pick.color ? S2.pick.color.id : null;
    // رنگ‌ها: اگر در هیچ سایزی موجود نباشند کاملاً غیرفعال، وگرنه فقط برای سایز فعلی علامت‌دار
    $$('#colorRow [data-color]').forEach(b => {
      const id = parseInt(b.dataset.color);
      const here = variantStock(p, sid, id);
      const anywhere = (p.variants || []).some(v => (v.color_id ?? null) === id && v.stock > 0);
      b.classList.toggle('sold', here <= 0);
      b.disabled = !anywhere;
      b.title = anywhere
        ? (here > 0 ? `${t('stock_left')}: ${num(here)}` : t('color_other_size'))
        : t('color_sold_out');
    });

    // سایزها: برای رنگ انتخاب‌شده ناموجود باشند، غیرقابل انتخاب می‌شوند
    $$('#sizeRow [data-size]').forEach(b => {
      const id = parseInt(b.dataset.size);
      const st = variantStock(p, id, cid);
      b.classList.toggle('sold', st <= 0);
      b.disabled = st <= 0;
      b.title = st > 0 ? `${t('stock_left')}: ${num(st)}` : t('size_out_for_color');
    });
  }

  // دکمه افزودن با موجودی همین ترکیب هماهنگ شود
  const add = $('#prAdd');
  if(add){
    add.disabled = n <= 0;
    const lbl = add.querySelector('span');
    if(lbl) lbl.textContent = n > 0 ? t('add_to_cart') : t('out_of_stock');
  }
}

/** اگر برای رنگ انتخابی تصویری تعریف شده، گالری روی همان می‌رود */
function jumpToColorImage(p){
  const c = S2.pick.color;
  if(!c || !c.image_url) return;
  const imgs = S2.galImages || [];
  const i = imgs.findIndex(x => x.url === c.image_url);
  if(i >= 0 && typeof S2.galGo === 'function') S2.galGo(i);
}

function refreshPrice(p){
  let v = finalPrice(p);
  if(S2.pick.size)  v += S2.pick.size.price_diff || 0;
  if(S2.pick.color) v += S2.pick.color.price_diff || 0;
  const el = $('#prPrice');
  if(el){ el.textContent = money(v); el.style.animation='none'; void el.offsetWidth; el.style.animation='mpPop .3s ease'; }
}

/* ══════════════════════════════════════════
   دیدگاه‌ها
══════════════════════════════════════════ */
function renderReviews(p){
  const host = $('#reviewArea');
  if(!host) return;
  const list = p.comments || [];

  const summary = p.rating_count ? `
    <div class="rating-big" style="margin-bottom:20px">
      <span class="rating-score">${num(p.rating_avg)}</span>
      <span>${starsHtml(p.rating_avg)}<br>
        <span style="font-size:.78rem;color:var(--text-3)">${esc(t('based_on'))} ${num(p.rating_count)} ${esc(t('buyer_reviews'))}</span></span>
    </div>` : '';

  const items = list.length ? `<div class="review-list">${list.map(c => {
    const pr = (c.pros||'').split('\n').map(x=>x.trim()).filter(Boolean);
    const cn = (c.cons||'').split('\n').map(x=>x.trim()).filter(Boolean);
    const mine = S.user && c.user_id === S.user.id;
    return `<article class="review">
      <div class="review-head">
        <b>${esc(c.author_name)}</b>
        ${c.is_buyer ? `<span class="tag-buyer">${esc(t('verified_buyer'))}</span>` : ''}
        ${c.is_buyer && c.rating ? starsHtml(c.rating) : ''}
        <span class="when">${esc(fmtDate(c.created_at))}
          ${mine ? `<button class="review-del" data-del-review="${c.id}">${esc(t('delete'))}</button>` : ''}</span>
      </div>
      <div class="review-body">${esc(c.body)}</div>
      ${(pr.length || cn.length) ? `<div class="review-pc">
        ${pr.length ? `<div class="rp"><b>${esc(t('pros'))}</b><ul>${pr.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
        ${cn.length ? `<div class="rc"><b>${esc(t('cons'))}</b><ul>${cn.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      </div>` : ''}
      ${c.admin_reply ? `<div class="review-reply"><b>${esc(t('shop_reply'))}:</b> ${esc(c.admin_reply)}</div>` : ''}
    </article>`;
  }).join('')}</div>` :
    `<div class="empty-state" style="padding:34px 20px">${IC2.star}
      <h4>${esc(t('no_reviews'))}</h4><p>${esc(t('be_first'))}</p></div>`;

  let form;
  if(!S.user){
    form = `<div class="review-gate">
      <p>${esc(t('review_need_login'))}</p>
      <button class="btn btn-primary" id="revLogin">${esc(t('login_register'))}</button></div>`;
  } else if(p.has_reviewed){
    form = `<div class="review-gate"><p>${esc(t('already_reviewed'))}</p></div>`;
  } else {
    const buyer = p.is_buyer;
    form = `<div class="review-form">
      <h4 style="font-size:.92rem;font-weight:700;margin-bottom:6px">${esc(t('write_review'))}</h4>
      <p style="font-size:.78rem;color:var(--text-3);margin-bottom:16px">
        ${esc(buyer ? t('buyer_can_rate') : t('nonbuyer_note'))}</p>

      ${buyer ? `
      <div class="field"><label>${esc(t('your_rating'))}</label>
        <div class="rate-row">
          <div class="star-pick" id="starPick">
            ${[5,4,3,2,1].map(v=>`<button data-star="${v}" title="${v}">${IC2.starO}</button>`).join('')}
          </div>
          <span class="rate-num" id="rateNum"><b>${num(5)}</b><small>/${num(5)}</small>
            <em id="rateWord">${esc(t('rate_5'))}</em></span>
        </div></div>` : ''}

      <div class="field"><label>${esc(t('your_review'))}</label>
        <textarea class="form-field" id="revBody" rows="3" placeholder="${esc(t('review_ph'))}"></textarea></div>

      ${buyer ? `
      <div class="field"><label style="color:#2ED573">${esc(t('pros'))} — ${esc(t('one_per_line'))}</label>
        <textarea class="form-field" id="revPros" rows="2" placeholder="${esc(t('pros_ph'))}"></textarea></div>
      <div class="field"><label style="color:#FF6B6B">${esc(t('cons'))} — ${esc(t('one_per_line'))}</label>
        <textarea class="form-field" id="revCons" rows="2" placeholder="${esc(t('cons_ph'))}"></textarea></div>` : ''}

      <button class="btn btn-primary" id="revSend" style="width:100%;margin-top:6px">${esc(t('send_review'))}</button>
    </div>`;
  }

  host.innerHTML = summary + items + form;

  const lg = $('#revLogin'); if(lg) lg.onclick = () => openAccount();

  let rating = 5;
  const paintRate = v => {
    $$('#starPick button').forEach(x => x.classList.toggle('on', parseInt(x.dataset.star) >= v ? false : false));
    $$('#starPick button').forEach(x => x.classList.toggle('on', parseInt(x.dataset.star) === v));
    const n = $('#rateNum'), wd = $('#rateWord');
    if(n) n.querySelector('b').textContent = num(v);
    if(wd) wd.textContent = t('rate_' + v);
    if(n) n.dataset.v = v;
  };
  $$('#starPick [data-star]').forEach(b => {
    b.onclick = () => { rating = parseInt(b.dataset.star); paintRate(rating); };
    b.onmouseenter = () => {
      const n = $('#rateNum'), wd = $('#rateWord'), v = parseInt(b.dataset.star);
      if(n) n.querySelector('b').textContent = num(v);
      if(wd) wd.textContent = t('rate_' + v);
    };
  });
  const sp = $('#starPick');
  if(sp) sp.onmouseleave = () => paintRate(rating);
  paintRate(5);

  const send = $('#revSend');
  if(send) send.onclick = async () => {
    const body = ($('#revBody').value || '').trim();
    if(body.length < 3) return toast(t('review_too_short'), 'err');
    send.disabled = true;
    try{
      const r = await api(`/products/${p.id}/comments`, { method:'POST', body: JSON.stringify({
        body, rating,
        pros: $('#revPros') ? $('#revPros').value : '',
        cons: $('#revCons') ? $('#revCons').value : ''
      })});
      toast(r.message, 'ok');
      p.has_reviewed = true;
      renderReviews(p);
    }catch(e){ toast(e.message || t('err_generic'), 'err'); send.disabled = false; }
  };

  $$('[data-del-review]').forEach(b => b.onclick = async () => {
    try{
      await api('/comments/' + b.dataset.delReview, { method:'DELETE' });
      toast(t('review_deleted'), 'ok');
      renderProduct(p.slug);
    }catch(e){ toast(e.message, 'err'); }
  });
}

function fmtDate(s){
  if(!s) return '';
  const d = new Date(String(s).replace(' ','T') + (String(s).includes('Z')?'':'Z'));
  if(isNaN(d)) return s;
  try{
    return new Intl.DateTimeFormat(S.lang==='fa'?'fa-IR':'en-US',
      {year:'numeric',month:'short',day:'numeric'}).format(d);
  }catch(_){ return d.toLocaleDateString(); }
}

/* ══════════════════════════════════════════
   اشتراک‌گذاری
══════════════════════════════════════════ */
function openShare(p){
  const url = location.origin + '/#/product/' + p.slug;
  const txt = `${pName(p)} — ${S.settings.site_name_fa || 'مای پیکسل'}`;
  $('#shareName').textContent = pName(p);
  $('#shareUrl').value = url;
  $('#shareNet').innerHTML = `
    <a href="https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">
      ${IC2.telegram}<span>تلگرام</span></a>
    <a href="https://wa.me/?text=${encodeURIComponent(txt + ' ' + url)}" target="_blank" rel="noopener">
      ${IC2.whatsapp}<span>واتساپ</span></a>
    <a href="https://www.instagram.com/" target="_blank" rel="noopener" data-insta>
      ${IC2.instagram}<span>اینستاگرام</span></a>`;

  $('[data-insta]').onclick = () => {
    navigator.clipboard && navigator.clipboard.writeText(url);
    toast(t('insta_copied'), 'ok');
  };
  $('#sharePop').classList.add('open');
  $('#accountOverlay').classList.add('open');
}
function closeShare(){
  $('#sharePop').classList.remove('open');
  if(!$('#accountModal').classList.contains('open')) $('#accountOverlay').classList.remove('open');
}

/* ══════════════════════════════════════════
   نمادهای اعتماد در فوتر
══════════════════════════════════════════ */
function renderTrust(){
  const host = $('#trustRow');
  if(!host) return;
  const st = S.settings || {};
  const DEFAULTS = {
    enamad: { title:'نماد اعتماد', desc:'ای‌نماد',      icon:'shield' },
    torob:  { title:'ترب',         desc:'مقایسه قیمت', icon:'search' },
    emalls: { title:'ایمالز',      desc:'رصد قیمت',    icon:'bag' }
  };

  host.innerHTML = ['enamad','torob','emalls'].map(k => {
    const d = DEFAULTS[k];
    const url   = (st[`trust_${k}_url`]   || '').trim();
    const title = (st[`trust_${k}_title`] || d.title).trim();
    const desc  = (st[`trust_${k}_desc`]  || d.desc).trim();
    const logo  = (st[`trust_${k}_logo`]  || '').trim();
    const ico   = (st[`trust_${k}_icon`]  || d.icon).trim();
    const art   = logo ? `<img src="${esc(logo)}" alt="${esc(title)}">`
                       : (window.MPIcons ? MPIcons.get(ico) : IC2.shield);
    return url
      ? `<a class="trust-badge" href="${esc(url)}" target="_blank" rel="noopener nofollow">
           ${art}<span><b>${esc(title)}</b><small>${esc(desc)}</small></span></a>`
      : `<span class="trust-badge off" title="${esc(t('badge_soon'))}">
           ${art}<span><b>${esc(title)}</b><small>${esc(t('badge_soon'))}</small></span></span>`;
  }).join('');
}

/* ══════════════════════════════════════════
   تسویه حساب
══════════════════════════════════════════ */
async function renderCheckout(){
  const host = $('#checkoutBody');
  if(!host) return;

  if(!S.user){
    host.innerHTML = `<div class="gate-card">
      <span class="gate-ic">${IC2.user}</span>
      <h3>${esc(t('need_account'))}</h3>
      <p>${esc(t('need_account_sub'))}</p>
      <div class="gate-acts">
        <button class="btn btn-primary" id="gateLogin">${esc(t('login_register'))}</button>
        <a class="btn btn-ghost" href="/products">${esc(t('continue_shopping'))}</a>
      </div></div>`;
    const g = $('#gateLogin');
    if(g) g.onclick = () => { S2.afterLogin = '/checkout'; openAccount(); };
    return;
  }

  if(!S.cart.length){
    host.innerHTML = `<div class="empty-state">${IC2.bag}<h4>${esc(t('cart_empty'))}</h4>
      <p>${esc(t('cart_empty_sub'))}</p>
      <a class="btn btn-primary" href="/products">${esc(t('nav_products'))}</a></div>`;
    return;
  }

  if(!S2.provinces.length){
    try{ S2.provinces = (await api('/provinces')).items; }catch(_){ S2.provinces = ['تهران']; }
  }
  if(!S2.gateways.length){
    try{ S2.gateways = (await api('/gateways')).items || []; }catch(_){ S2.gateways = []; }
  }
  if(S.token){
    try{ S2.addresses = (await api('/account/addresses')).items; }catch(_){ S2.addresses = []; }
    if(!S2.co.addressId){
      const d = S2.addresses.find(a => a.is_default) || S2.addresses[0];
      if(d) S2.co.addressId = d.id;
    }
  }
  if(!S2.co.gateway && S2.gateways.length) S2.co.gateway = S2.gateways[0].id;

  const sub = S.cart.reduce((s,i) => s + i.price * i.qty, 0);
  const shipCost = parseInt(S.settings.shipping_cost || 0);
  const freeFrom = parseInt(S.settings.free_shipping_from || 0);
  const ship = (freeFrom > 0 && (sub - S2.co.couponAmount) >= freeFrom) ? 0 : shipCost;
  const taxRate = parseFloat(S.settings.tax_rate || 0);
  const tax = taxRate > 0 ? Math.round((sub - S2.co.couponAmount) * taxRate / 100) : 0;
  const total = sub - S2.co.couponAmount + ship + tax;

  host.innerHTML = `<div class="checkout-grid">
    <div>
      <!-- آدرس -->
      <div class="co-step">
        <h3><span class="num">۱</span>${esc(t('delivery_address'))}</h3>
        ${S2.addresses.length ? `
          <div class="addr-list" id="coAddrList">
            ${S2.addresses.map(a => addrCard(a, a.id === S2.co.addressId)).join('')}
          </div>` : `
          <div class="addr-empty">${IC2.pin}
            <b>${esc(t('no_address'))}</b><span>${esc(t('no_address_sub'))}</span></div>`}
        <button class="btn btn-ghost add-addr" id="coNewAddr">
          ${IC2.plus}<span>${esc(t('add_address'))}</span></button>
      </div>

      <!-- پرداخت -->
      <div class="co-step">
        <h3><span class="num">۲</span>${esc(t('payment_method'))}</h3>
        <div class="pay-list" id="payList">
          ${S2.gateways.length ? S2.gateways.map(g => `
            <button class="pay-opt ${g.id === S2.co.gateway ? 'on':''}" data-gw="${g.id}">
              <span class="dot"></span>${esc(g.name_fa)}</button>`).join('')
            : `<p style="font-size:.84rem;color:var(--text-3)">${esc(t('no_gateway'))}</p>`}
        </div>
      </div>

      <!-- یادداشت -->
      <div class="co-step">
        <h3><span class="num">۳</span>${esc(t('order_note'))}</h3>
        <textarea class="form-field" id="coNote" rows="2" placeholder="${esc(t('note_ph'))}"></textarea>
      </div>
    </div>

    <!-- خلاصه -->
    <div class="co-summary glass">
      <h3 style="font-size:.95rem;font-weight:700;margin-bottom:14px">${esc(t('order_summary'))}</h3>
      ${S.cart.map(i => `<div class="co-line">
        <span>${esc(i.name)}${i.size||i.color ? `<br><small style="color:var(--text-3)">${esc([i.size,i.color].filter(Boolean).join(' · '))}</small>` : ''} × ${num(i.qty)}</span>
        <span>${money(i.price * i.qty)}</span></div>`).join('')}

      <div class="coupon-row">
        <input id="coCoupon" placeholder="${esc(t('coupon_ph'))}" value="${esc(S2.co.coupon||'')}">
        <button id="coApply">${esc(t('apply'))}</button>
      </div>

      <div style="border-top:1px solid rgba(255,255,255,.08);margin-top:6px;padding-top:8px">
        <div class="co-line"><span>${esc(t('subtotal'))}</span><span>${money(sub)}</span></div>
        ${S2.co.couponAmount ? `<div class="co-line"><span>${esc(t('discount'))} (${esc(S2.co.coupon)})</span>
          <span class="off">− ${money(S2.co.couponAmount)}</span></div>` : ''}
        <div class="co-line"><span>${esc(t('shipping'))}</span>
          <span>${ship === 0 ? `<span class="off">${esc(t('free'))}</span>` : money(ship)}</span></div>
        ${tax ? `<div class="co-line"><span>${esc(S.settings.tax_label_fa || t('tax'))}</span><span>${money(tax)}</span></div>` : ''}
        <div class="co-line total"><span>${esc(t('payable'))}</span><span>${money(total)}</span></div>
      </div>

      <button class="btn btn-primary" id="coSubmit" style="width:100%;margin-top:16px">
        ${esc(t('place_order'))}</button>
      <p style="font-size:.72rem;color:var(--text-3);text-align:center;margin-top:10px">
        ${esc(t('checkout_hint'))}</p>
    </div>
  </div>`;

  // ── وقایع ──
  $$('#coAddrList [data-addr]').forEach(c => c.onclick = e => {
    if(e.target.closest('[data-edit-addr],[data-del-addr]')) return;
    S2.co.addressId = parseInt(c.dataset.addr);
    $$('#coAddrList .addr-card').forEach(x => x.classList.toggle('on', x === c));
  });
  wireAddrActions(() => renderCheckout());
  const na = $('#coNewAddr'); if(na) na.onclick = () => openAddrForm(null, () => renderCheckout());

  $$('#payList [data-gw]').forEach(b => b.onclick = () => {
    S2.co.gateway = parseInt(b.dataset.gw);
    $$('#payList .pay-opt').forEach(x => x.classList.toggle('on', x === b));
  });

  $('#coApply').onclick = async () => {
    const code = $('#coCoupon').value.trim();
    if(!code){ S2.co.coupon = null; S2.co.couponAmount = 0; return renderCheckout(); }
    try{
      const r = await api('/coupon/check', { method:'POST', body: JSON.stringify({ code, subtotal: sub }) });
      S2.co.coupon = r.code; S2.co.couponAmount = r.amount;
      toast(t('coupon_ok') + ' ' + money(r.amount), 'ok');
      renderCheckout();
    }catch(e){
      S2.co.coupon = null; S2.co.couponAmount = 0;
      toast(e.message || t('coupon_bad'), 'err');
    }
  };

  $('#coSubmit').onclick = submitOrder;
}

function guestAddrForm(pref){
  const a = pref || {};
  return `
  <div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <div class="field"><label>${esc(t('first_name'))}</label>
      <input class="form-field" id="gFirst" value="${esc(a.first||'')}"></div>
    <div class="field"><label>${esc(t('last_name'))}</label>
      <input class="form-field" id="gLast" value="${esc(a.last||'')}"></div>
    <div class="field"><label>${esc(t('phone'))}</label>
      <input class="form-field" id="gPhone" dir="ltr" inputmode="numeric" value="${esc(a.phone||'')}"></div>
    <div class="field"><label>${esc(t('province'))}</label>
      <select class="form-field" id="gProvince">
        ${S2.provinces.map(p => `<option ${a.province===p?'selected':''}>${esc(p)}</option>`).join('')}
      </select></div>
    <div class="field"><label>${esc(t('city'))}</label>
      <input class="form-field" id="gCity" value="${esc(a.city||'')}"></div>
    <div class="field"><label>${esc(t('postal'))}</label>
      <input class="form-field" id="gPostal" dir="ltr" inputmode="numeric" value="${esc(a.postal||'')}"></div>
    <div class="field" style="grid-column:1/-1"><label>${esc(t('full_address'))}</label>
      <textarea class="form-field" id="gAddress" rows="2">${esc(a.address||'')}</textarea></div>
    <div class="field"><label>${esc(t('street'))}</label>
      <input class="form-field" id="gStreet" value="${esc(a.street||'')}"></div>
    <div class="field"><label>${esc(t('plaque_unit'))}</label>
      <div style="display:flex;gap:8px">
        <input class="form-field" id="gPlaque" placeholder="${esc(t('plaque'))}" value="${esc(a.plaque||'')}">
        <input class="form-field" id="gUnit" placeholder="${esc(t('unit'))}" value="${esc(a.unit||'')}">
      </div></div>
  </div>`;
}

async function submitOrder(){
  const btn = $('#coSubmit');
  btn.disabled = true;

  const payload = {
    items: S.cart.map(i => ({ product_id: i.id, qty: i.qty, size_id: i.size_id || null, color_id: i.color_id || null })),
    gateway_id: S2.co.gateway,
    coupon_code: S2.co.coupon || '',
    note: ($('#coNote') && $('#coNote').value) || ''
  };

  if(S.token && S2.co.addressId){
    payload.address_id = S2.co.addressId;
    const a = S2.addresses.find(x => x.id === S2.co.addressId);
    if(a){ payload.customer_name = a.receiver_name; payload.phone = a.receiver_phone; }
  } else {
    toast(t('pick_address'), 'err');
    btn.disabled = false;
    return;
  }

  try{
    const r = await api('/orders', { method:'POST', body: JSON.stringify(payload) });
    S.cart = [];
    localStorage.setItem(LS.cart, '[]');
    renderCart();
    S2.co = { addressId:null, gateway:null, coupon:null, couponAmount:0 };

    $('#checkoutBody').innerHTML = `
      <div class="order-done glass">
        <div class="tick">${IC2.check}</div>
        <h3 style="font-size:1.2rem;font-weight:800">${esc(t('order_placed'))}</h3>
        <p style="color:var(--text-2);margin-top:8px">${esc(t('order_placed_sub'))}</p>
        <div class="code">${esc(r.tracking_code)}</div>
        <p style="font-size:.8rem;color:var(--text-3)">${esc(t('save_code'))}</p>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:22px;flex-wrap:wrap">
          <button class="btn btn-primary" id="donePay" hidden>${IC2.card}<span>${esc(t('pay_now'))}</span></button>
          <button class="btn btn-ghost" id="doneInvoice">${IC2.receipt}<span>${esc(t('view_invoice'))}</span></button>
          <a class="btn btn-ghost" href="/track?code=${encodeURIComponent(r.tracking_code)}">${esc(t('track_order'))}</a>
          <a class="btn btn-ghost" href="/products">${esc(t('continue_shopping'))}</a>
        </div>
      </div>`;
    const di = $('#doneInvoice');
    if(di) di.onclick = () => openInvoice(r.tracking_code, payload.phone);

    // اگر درگاه آنلاین آماده است، دکمه‌ی پرداخت را نشان بده
    const dp = $('#donePay');
    if(dp){
      api('/payments/status/' + encodeURIComponent(r.tracking_code)
          + '?phone=' + encodeURIComponent(payload.phone))
        .then(st => {
          if(!st.payable) return;
          dp.hidden = false;
          dp.onclick = async () => {
            dp.disabled = true;
            try{
              const pr = await api('/payments/start', { method:'POST', body: JSON.stringify({
                tracking_code: r.tracking_code, phone: payload.phone })});
              toast(t('pay_redirect'), 'ok');
              setTimeout(() => { location.href = pr.redirect_url; }, 500);
            }catch(e){ toast(e.message || t('err_generic'), 'err'); dp.disabled = false; }
          };
        }).catch(() => {});
    }
    window.scrollTo({top:0, behavior:'smooth'});
  }catch(e){
    toast(e.message || t('err_generic'), 'err');
    btn.disabled = false;
  }
}

/* ══════════════════════════════════════════
   فیلد با لیبل شناور
══════════════════════════════════════════ */
/** ورودی با عنوانی که وقتی خالی است داخل کادر و بعد از تایپ بالای آن می‌نشیند */
function fld(id, label, opt = {}){
  const v = opt.value == null ? '' : String(opt.value);
  const cls = `ff ${v ? 'filled' : ''} ${opt.wide ? 'wide' : ''} ${opt.icon ? 'has-ic' : ''}`;
  const attrs = [
    opt.dir ? `dir="${opt.dir}"` : '',
    opt.mode ? `inputmode="${opt.mode}"` : '',
    opt.type ? `type="${opt.type}"` : '',
    opt.max ? `maxlength="${opt.max}"` : '',
    opt.disabled ? 'disabled' : ''
  ].filter(Boolean).join(' ');

  if(opt.area){
    return `<label class="${cls}">
      ${opt.icon ? `<span class="ff-ic">${opt.icon}</span>` : ''}
      <textarea id="${id}" rows="${opt.rows||3}" placeholder=" " ${attrs}>${esc(v)}</textarea>
      <span class="ff-lbl">${esc(label)}</span>
      ${opt.hint ? `<span class="ff-hint">${esc(opt.hint)}</span>` : ''}
    </label>`;
  }
  if(opt.options){
    return `<label class="${cls} is-select">
      ${opt.icon ? `<span class="ff-ic">${opt.icon}</span>` : ''}
      <select id="${id}" ${attrs}>
        <option value=""></option>
        ${opt.options.map(o => {
          const val = Array.isArray(o) ? o[0] : o, txt = Array.isArray(o) ? o[1] : o;
          return `<option value="${esc(val)}" ${String(val)===v?'selected':''}>${esc(txt)}</option>`;
        }).join('')}
      </select>
      <span class="ff-lbl">${esc(label)}</span>
      <span class="ff-caret">${IC2.chev}</span>
    </label>`;
  }
  return `<label class="${cls}">
    ${opt.icon ? `<span class="ff-ic">${opt.icon}</span>` : ''}
    <input id="${id}" value="${esc(v)}" placeholder=" " ${attrs}>
    <span class="ff-lbl">${esc(label)}</span>
    ${opt.hint ? `<span class="ff-hint">${esc(opt.hint)}</span>` : ''}
  </label>`;
}

/** کلاس filled را روی فیلدهای شناور همگام نگه می‌دارد */
function wireFloating(scope){
  $$('.ff input, .ff textarea, .ff select', scope || document).forEach(el => {
    if(el.dataset.ff) return;
    el.dataset.ff = '1';
    const sync = () => el.closest('.ff').classList.toggle('filled', !!String(el.value||'').trim());
    el.addEventListener('input', sync);
    el.addEventListener('change', sync);
    el.addEventListener('blur', sync);
    sync();
  });
}

/* ══════════════════════════════════════════
   آدرس‌ها
══════════════════════════════════════════ */
function addrCard(a, on){
  return `<button class="addr-card ${on?'on':''}" data-addr="${a.id}">
    <span class="ttl">${IC2.pin} ${esc(a.title)}
      ${a.is_default ? `<span class="tag-default">${esc(t('default'))}</span>` : ''}</span>
    <span class="body">${esc([a.province, a.city, a.address].filter(Boolean).join('، '))}
      ${a.street ? `، ${esc(t('street'))} ${esc(a.street)}` : ''}
      ${a.plaque ? `، ${esc(t('plaque'))} ${esc(a.plaque)}` : ''}
      ${a.unit ? `، ${esc(t('unit'))} ${esc(a.unit)}` : ''}</span>
    <span class="who">${IC2.user} ${esc(a.receiver_name)} — <span dir="ltr">${esc(a.receiver_phone)}</span></span>
    <span class="acts">
      <span role="button" data-edit-addr="${a.id}" title="${esc(t('edit'))}">${IC2.edit}</span>
      <span role="button" class="del" data-del-addr="${a.id}" title="${esc(t('delete'))}">${IC2.trash}</span>
    </span>
  </button>`;
}

function wireAddrActions(after){
  $$('[data-edit-addr]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const a = S2.addresses.find(x => x.id == b.dataset.editAddr);
    openAddrForm(a, after);
  });
  $$('[data-del-addr]').forEach(b => b.onclick = async e => {
    e.stopPropagation();
    if(!confirm(t('confirm_del_addr'))) return;
    try{
      await api('/account/addresses/' + b.dataset.delAddr, { method:'DELETE' });
      S2.addresses = (await api('/account/addresses')).items;
      toast(t('addr_deleted'), 'ok');
      after && after();
    }catch(err){ toast(err.message, 'err'); }
  });
}

async function openAddrForm(a, after){
  if(!S2.provinces.length){
    try{ S2.provinces = (await api('/provinces')).items; }catch(_){ S2.provinces = ['تهران']; }
  }
  const isNew = !a;
  const rt = a ? a.receiver_type : 'self';

  const body = `
    <div class="ff-grid">
      ${fld('aTitle', t('addr_title'), {value: a?.title || t('my_address'), wide:1, icon: IC2.pin})}
      ${fld('aProvince', t('province'), {value: a?.province || '', options: S2.provinces})}
      ${fld('aCity', t('city'), {value: a?.city || ''})}
      ${fld('aAddress', t('full_address'), {value: a?.address || '', area:1, rows:3, wide:1,
        hint: t('addr_ph')})}
      ${fld('aStreet', t('street'), {value: a?.street || ''})}
      ${fld('aPostal', t('postal'), {value: a?.postal_code || '', dir:'ltr', mode:'numeric', max:10})}
      ${fld('aPlaque', t('plaque'), {value: a?.plaque || ''})}
      ${fld('aUnit', t('unit'), {value: a?.unit || ''})}
    </div>

    <div class="rec-block">
      <span class="rec-q">${esc(t('who_receives'))}</span>
      <div class="receiver-pick" id="recPick">
        <button data-rt="self"  class="${rt==='self'?'on':''}">${IC2.user}<span>${esc(t('myself'))}</span></button>
        <button data-rt="other" class="${rt==='other'?'on':''}">${IC2.users||IC2.user}<span>${esc(t('someone_else'))}</span></button>
      </div>
      <div class="slide-fields ${rt==='other'?'open':''}" id="recFields">
        <div class="ff-grid">
          ${fld('aRecName', t('receiver_name'), {value: rt==='other'?(a?.receiver_name||''):'', wide:1})}
          ${fld('aRecPhone', t('receiver_phone'), {value: rt==='other'?(a?.receiver_phone||''):'',
            dir:'ltr', mode:'numeric', max:11, wide:1})}
        </div>
      </div>
    </div>

    <label class="ff-check">
      <input type="checkbox" id="aDefault" ${a?.is_default?'checked':''}>
      <span class="bx">${IC2.check}</span>${esc(t('set_default'))}
    </label>`;

  openSheet(isNew ? t('add_address') : t('edit_address'), body,
    `<button class="btn btn-ghost" data-sheet-close>${esc(t('cancel'))}</button>
     <button class="btn btn-primary" id="aSave">${esc(isNew ? t('save') : t('save_changes'))}</button>`);

  wireFloating($('#mpSheet'));

  let type = rt;
  $$('#recPick [data-rt]').forEach(b => b.onclick = () => {
    type = b.dataset.rt;
    $$('#recPick button').forEach(x => x.classList.toggle('on', x === b));
    $('#recFields').classList.toggle('open', type === 'other');
  });

  $('#aSave').onclick = async () => {
    const btn = $('#aSave'); btn.disabled = true;
    const payload = {
      title: $('#aTitle').value, province: $('#aProvince').value, city: $('#aCity').value,
      address: $('#aAddress').value, street: $('#aStreet').value, plaque: $('#aPlaque').value,
      unit: $('#aUnit').value, postal_code: $('#aPostal').value,
      receiver_type: type, receiver_name: $('#aRecName').value, receiver_phone: $('#aRecPhone').value,
      is_default: $('#aDefault').checked
    };
    try{
      await api(isNew ? '/account/addresses' : '/account/addresses/' + a.id,
        { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(payload) });
      S2.addresses = (await api('/account/addresses')).items;
      closeSheet();
      toast(isNew ? t('addr_added') : t('addr_updated'), 'ok');
      after && after();
    }catch(e){ toast(e.message || t('err_generic'), 'err'); btn.disabled = false; }
  };
}

/* شیت عمومی برای فرم‌ها */
function openSheet(title, body, foot){
  let el = $('#mpSheet');
  if(!el){
    el = document.createElement('div');
    el.id = 'mpSheet';
    el.className = 'account-modal';
    el.style.maxHeight = '86vh';
    el.style.overflowY = 'auto';
    el.style.width = 'min(430px,94vw)';
    document.body.appendChild(el);
  }
  el.innerHTML = `<button class="modal-close" data-sheet-close>${IC2.x}</button>
    <h3 style="font-size:1rem;font-weight:700;margin-bottom:16px">${esc(title)}</h3>
    ${body}
    <div style="display:flex;gap:9px;margin-top:18px">${foot}</div>`;
  el.classList.add('open');
  $('#accountOverlay').classList.add('open');
  $$('[data-sheet-close]', el).forEach(b => b.onclick = closeSheet);
}
function closeSheet(){
  const el = $('#mpSheet');
  if(el) el.classList.remove('open');
  if(!$('#accountModal').classList.contains('open') && !$('#sharePop').classList.contains('open'))
    $('#accountOverlay').classList.remove('open');
}

/* ══════════════════════════════════════════
   صفحه حساب کاربری
══════════════════════════════════════════ */
async function renderAccountPage(){
  if(!S.user){ openAccount(); go('/', true); return; }

  // ?tab=wishlist از لینک‌های مودال یا فوتر
  const q = location.search.replace(/^\?/, '');
  const want = new URLSearchParams(q).get('tab');
  const valid = ['profile','orders','addresses','wishlist','reviews','returns'];
  if(want && valid.includes(want)) S2.acctTab = want;

  $('#acctTitle').textContent = `${S.user.first_name || ''} ${S.user.last_name || ''}`.trim() || t('account');
  $('#acctSub').textContent = S.user.phone || '';

  const tabs = [
    ['profile',   t('tab_profile')],
    ['orders',    t('tab_orders')],
    ['addresses', t('tab_addresses')],
    ['wishlist',  t('tab_wishlist')],
    ['reviews',   t('tab_reviews')],
    ['returns',   t('tab_returns')]
  ];
  $('#acctTabs').innerHTML = tabs.map(([k,l]) =>
    `<button class="${S2.acctTab===k?'on':''}" data-tab="${k}">${esc(l)}</button>`).join('');
  $$('#acctTabs [data-tab]').forEach(b => b.onclick = () => {
    if(S2.acctTab === b.dataset.tab) return;
    S2.acctTab = b.dataset.tab;
    history.replaceState(null, '', '/account?tab=' + b.dataset.tab);
    // محتوا اول محو می‌شود، بعد دوباره ساخته و بالا می‌آید
    const body = $('#acctBody');
    if(body){
      body.classList.add('swapping');
      setTimeout(() => { body.classList.remove('swapping'); renderAccountPage(); }, 160);
    } else renderAccountPage();
  });

  const host = $('#acctBody');
  host.innerHTML = `<div class="skel" style="height:180px"></div>`;
  const replay = () => { host.style.animation = 'none'; void host.offsetWidth; host.style.animation = ''; };

  if(S2.acctTab === 'profile'){
    host.innerHTML = `<div class="acct-card">
      <div class="acct-card-head">${IC2.user}<h3>${esc(t('personal_info'))}</h3></div>
      <div class="ff-grid">
        ${fld('pfFirst', t('first_name'), {value:S.user.first_name||''})}
        ${fld('pfLast',  t('last_name'),  {value:S.user.last_name||''})}
        ${fld('pfEmail', t('email'), {value:S.user.email||'', dir:'ltr', type:'email', wide:1,
          hint:'you@example.com'})}
        ${fld('pfPhone', t('phone'), {value:S.user.phone||'', dir:'ltr', disabled:1, wide:1,
          hint: t('phone_locked')})}
      </div>
      <button class="btn btn-primary" id="pfSave">${esc(t('save_changes'))}</button>
    </div>`;
    wireFloating(host);
    $('#pfSave').onclick = async () => {
      try{
        const r = await api('/auth/me', { method:'PATCH', body: JSON.stringify({
          first_name: $('#pfFirst').value, last_name: $('#pfLast').value, email: $('#pfEmail').value
        })});
        S.user = r.user || S.user;
        toast(t('saved'), 'ok');
        renderAccountPage();
      }catch(e){ toast(e.message, 'err'); }
    };
  }

  if(S2.acctTab === 'orders'){
    try{
      const r = await api('/orders/mine');
      host.innerHTML = r.items.length ? `<div class="row-list">${r.items.map(o => `
        <div class="row-card order-row">
          <span class="rc-ic">${IC2.bag}</span>
          <span class="rc-main">
            <b class="mono">${esc(o.tracking_code)}</b>
            <span>${esc(fmtDate(o.created_at))}</span>
          </span>
          <span class="rc-side">
            <b>${money(o.total)}</b>
            <span class="pill ${statusPill(o.status)}">${esc(o.status_fa)}</span>
          </span>
          <span class="rc-acts">
            <button class="rc-btn" data-inv="${esc(o.tracking_code)}" title="${esc(t('invoice'))}">${IC2.receipt}</button>
            <a class="rc-btn" href="/track?code=${encodeURIComponent(o.tracking_code)}"
              title="${esc(t('track_order'))}">${IC2.truck}</a>
          </span>
        </div>`).join('')}</div>`
        : emptyBox(IC2.bag, t('no_orders'), '', `<a class="btn btn-primary" href="/products">${esc(t('start_shopping'))}</a>`);
      $$('[data-inv]', host).forEach(b => b.onclick = () => openInvoice(b.dataset.inv, S.user?.phone));
    }catch(e){ host.innerHTML = `<p style="color:var(--danger)">${esc(e.message)}</p>`; }
  }

  if(S2.acctTab === 'addresses'){
    try{ S2.addresses = (await api('/account/addresses')).items; }catch(_){ S2.addresses = []; }
    host.innerHTML = `
      <button class="btn btn-primary add-addr" id="acNewAddr">
        ${IC2.plus}<span>${esc(t('add_address'))}</span></button>
      ${S2.addresses.length ? `<div class="addr-list">${S2.addresses.map(a => addrCard(a,false)).join('')}</div>`
        : emptyBox(IC2.pin, t('no_address'), t('no_address_sub'))}`;
    $('#acNewAddr').onclick = () => openAddrForm(null, renderAccountPage);
    wireAddrActions(renderAccountPage);
  }

  if(S2.acctTab === 'wishlist'){
    await paintWishlistInto(host);
  }

  if(S2.acctTab === 'reviews'){
    try{
      const r = await api('/account/reviews');
      host.innerHTML = r.items.length ? `<div class="row-list">${r.items.map(c => `
        <article class="row-card static">
          <span class="rc-ic">${c.image_url ? `<img src="${esc(c.image_url)}" alt="">` : icon(c.icon)}</span>
          <span class="rc-main">
            <b><a href="/product/${esc(c.product_slug)}">${esc(c.product_fa)}</a></b>
            <span class="rc-sub">${c.is_buyer && c.rating ? starsHtml(c.rating) : ''}
              <em>${esc(fmtDate(c.created_at))}</em></span>
            <span class="rc-text">${esc(c.body)}</span>
            ${c.admin_reply ? `<span class="rc-reply"><b>${esc(t('shop_reply'))}:</b> ${esc(c.admin_reply)}</span>` : ''}
          </span>
          <span class="rc-side">
            <span class="pill ${c.status==='approved'?'p-ok':c.status==='rejected'?'p-off':'p-warn'}">
              ${esc(c.status==='approved'?t('published'):c.status==='rejected'?t('rejected'):t('pending_review'))}</span>
            <button class="rc-del" data-del-review="${c.id}">${IC2.trash}</button>
          </span>
        </article>`).join('')}</div>`
        : emptyBox(IC2.star, t('no_my_reviews'), t('be_first'));
      $$('[data-del-review]').forEach(b => b.onclick = async () => {
        try{ await api('/comments/' + b.dataset.delReview, { method:'DELETE' });
          toast(t('review_deleted'),'ok'); renderAccountPage(); }
        catch(e){ toast(e.message,'err'); }
      });
    }catch(e){ host.innerHTML = `<p style="color:var(--danger)">${esc(e.message)}</p>`; }
  }

  if(S2.acctTab === 'returns'){
    try{
      const r = await api('/account/returns/mine');
      host.innerHTML = `
        <a class="btn btn-primary add-addr" href="/returns">${IC2.back}<span>${esc(t('new_return'))}</span></a>
        ${r.items.length ? `<div class="row-list">${r.items.map(x => `
          <div class="row-card static">
            <span class="rc-ic">${IC2.back}</span>
            <span class="rc-main">
              <b class="mono">${esc(x.tracking_code)}</b>
              <span class="rc-sub"><em>${esc(x.reason_fa)}</em></span>
              ${x.items && x.items.length ? `<span class="rc-text">${esc(x.items.map(i =>
                `${i.title}${i.opt_size||i.opt_color ? ` (${[i.opt_size,i.opt_color].filter(Boolean).join(' · ')})` : ''} × ${i.qty}`
              ).join('، '))}</span>` : ''}
              ${x.description ? `<span class="rc-text">${esc(x.description)}</span>` : ''}
              ${x.admin_note ? `<span class="rc-reply"><b>${esc(t('admin_note'))}:</b> ${esc(x.admin_note)}</span>` : ''}
            </span>
            <span class="rc-side"><span class="pill ${x.status==='refunded'?'p-ok':x.status==='rejected'?'p-off':'p-warn'}">${esc(x.status_fa)}</span></span>
          </div>`).join('')}</div>`
          : emptyBox(IC2.back, t('no_returns'), t('no_returns_sub'))}`;
    }catch(e){ host.innerHTML = `<p style="color:var(--danger)">${esc(e.message)}</p>`; }
  }
}

async function paintWishlistInto(host){
  if(!S.token){
    host.innerHTML = `<div class="review-gate">
      <p>${esc(t('wish_need_login'))}</p>
      <button class="btn btn-primary" id="wlLogin">${esc(t('login_register'))}</button></div>`;
    const b = $('#wlLogin'); if(b) b.onclick = () => openAccount();
    return;
  }
  try{
    const r = await api('/account/wishlist');
    S2.wish = new Set(r.items.map(i => i.id));
    host.innerHTML = r.items.length
      ? `<div class="prod-grid compact" id="wishGrid">${r.items.map(productCard).join('')}</div>`
      : emptyBox(IC2.heart, t('wish_empty'), t('wish_empty_sub'),
          `<a class="btn btn-primary" href="/products">${esc(t('nav_products'))}</a>`);
    stagger($('#wishGrid'));
    wireWishButtons(host);
    $$('[data-add]', host).forEach(b => b.onclick = () => addToCart(parseInt(b.dataset.add)));
  }catch(e){ host.innerHTML = `<p style="color:var(--danger)">${esc(e.message)}</p>`; }
}

async function renderWishlist(){
  const host = $('#wishBody');
  if(host) await paintWishlistInto(host);
}

/* ══════════════════════════════════════════
   فاکتور
══════════════════════════════════════════ */
/** فاکتور را در یک پنجره‌ی جدا باز و آماده چاپ می‌کند */
async function openInvoice(code, phone){
  const fetchInv = async ph => {
    const qs = ph ? '?phone=' + encodeURIComponent(ph) : '';
    return api('/orders/invoice/' + encodeURIComponent(code) + qs);
  };

  let d;
  try{
    d = await fetchInv(phone);
  }catch(e){
    // فاکتور اطلاعات حساس دارد؛ اگر مالکیت تایید نشد، شماره سفارش را بپرس
    if(e.status === 403){ askInvoicePhone(code); return; }
    return toast(e.message || t('err_generic'), 'err');
  }

  const o = d.order, shop = d.shop;
  const addr = [o.province, o.city, o.address,
    o.street && `${t('street')} ${o.street}`,
    o.plaque && `${t('plaque')} ${o.plaque}`,
    o.unit && `${t('unit')} ${o.unit}`].filter(Boolean).join('، ');

  const rows = d.items.map((i, n) => `<tr>
    <td>${num(n+1)}</td>
    <td>${esc(i.title_snapshot)}${i.opt_size||i.opt_color
      ? `<br><small>${esc([i.opt_size,i.opt_color].filter(Boolean).join(' · '))}</small>` : ''}</td>
    <td>${num(i.qty)}</td>
    <td>${money(i.unit_price)}</td>
    <td>${money(i.unit_price * i.qty)}</td></tr>`).join('');

  const html = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
<title>${esc(t('invoice'))} ${esc(o.tracking_code)}</title>
<link href="https://fonts.googleapis.com/css2?family=Estedad:wght@400;600;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Estedad,system-ui,sans-serif;background:#fff;color:#141a1f;padding:28px;font-size:13px;line-height:1.9}
.sheet{max-width:780px;margin:0 auto}
.top{display:flex;justify-content:space-between;align-items:flex-start;
  padding-bottom:16px;border-bottom:2px solid #0B7285;margin-bottom:18px}
.brand h1{font-size:20px;font-weight:800;color:#0B7285}
.brand p{font-size:11px;color:#667}
.meta{text-align:end;font-size:12px}
.meta b{display:block;font-size:15px;font-family:monospace;color:#0B7285;letter-spacing:1px}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}
.box{border:1px solid #dde3e6;border-radius:10px;padding:12px 14px}
.box h4{font-size:11px;color:#667;font-weight:600;margin-bottom:6px}
.box p{font-size:12.5px}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
th,td{padding:9px 10px;border-bottom:1px solid #e6ebee;text-align:start;font-size:12.5px}
th{background:#f3f6f7;font-size:11px;color:#556;font-weight:600}
td small{color:#778;font-size:11px}
tfoot td{border:none;padding:5px 10px}
.sum{margin-inline-start:auto;width:290px}
.sum tr td:first-child{color:#556}
.sum tr td:last-child{text-align:end;font-weight:600}
.sum .total td{border-top:2px solid #0B7285;padding-top:10px;font-size:15px;font-weight:800;color:#0B7285}
.note{border:1px dashed #cfd8dc;border-radius:10px;padding:10px 12px;font-size:12px;margin-bottom:14px}
.foot{margin-top:22px;padding-top:14px;border-top:1px solid #e6ebee;
  display:flex;justify-content:space-between;font-size:11px;color:#778}
.badge{display:inline-block;padding:2px 9px;border-radius:20px;font-size:11px;
  background:#e6f7f9;color:#0B7285;border:1px solid #b9e6ec}
.bar{margin-bottom:16px;display:flex;gap:8px}
.bar button{padding:9px 18px;border:none;border-radius:9px;font-family:inherit;
  font-size:13px;font-weight:600;cursor:pointer;background:#0B7285;color:#fff}
.bar button.ghost{background:#eef2f4;color:#334}
@media print{.bar{display:none}body{padding:0}}
</style></head><body>
<div class="bar">
  <button onclick="window.print()">${esc(t('print'))}</button>
  <button class="ghost" onclick="window.close()">${esc(t('close'))}</button>
</div>
<div class="sheet">
  <div class="top">
    <div class="brand">
      <h1>${esc(shop.name)}</h1>
      ${shop.phone ? `<p>${esc(t('phone'))}: ${esc(shop.phone)}</p>` : ''}
      ${shop.address ? `<p>${esc(shop.address)}</p>` : ''}
    </div>
    <div class="meta">
      <span>${esc(t('invoice'))}</span>
      <b>${esc(o.tracking_code)}</b>
      <span>${esc(fmtDate(o.created_at))}</span><br>
      <span class="badge">${esc(o.status_fa)}</span>
    </div>
  </div>

  <div class="cols">
    <div class="box"><h4>${esc(t('buyer'))}</h4>
      <p>${esc(o.customer_name)}</p>
      <p dir="ltr" style="text-align:start">${esc(o.phone)}</p>
      ${o.receiver_name && o.receiver_name !== o.customer_name
        ? `<p>${esc(t('receiver_name'))}: ${esc(o.receiver_name)}</p>` : ''}</div>
    <div class="box"><h4>${esc(t('delivery_address'))}</h4>
      <p>${esc(addr)}</p>
      ${o.postal_code ? `<p>${esc(t('postal'))}: ${esc(o.postal_code)}</p>` : ''}
      ${o.tracking_post ? `<p>${esc(t('ship_code'))}: <span dir="ltr">${esc(o.tracking_post)}</span></p>` : ''}</div>
  </div>

  <table>
    <thead><tr><th>#</th><th>${esc(t('product'))}</th><th>${esc(t('qty'))}</th>
      <th>${esc(t('unit_price'))}</th><th>${esc(t('row_total'))}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <table class="sum">
    <tr><td>${esc(t('subtotal'))}</td><td>${money(o.subtotal)}</td></tr>
    ${o.discount_amount ? `<tr><td>${esc(t('discount'))}${o.coupon_code ? ` (${esc(o.coupon_code)})` : ''}</td>
      <td>− ${money(o.discount_amount)}</td></tr>` : ''}
    <tr><td>${esc(t('shipping'))}</td><td>${o.shipping_cost ? money(o.shipping_cost) : esc(t('free'))}</td></tr>
    ${o.tax_amount ? `<tr><td>${esc(shop.tax_label)}</td><td>${money(o.tax_amount)}</td></tr>` : ''}
    <tr class="total"><td>${esc(t('payable'))}</td><td>${money(o.total)}</td></tr>
  </table>

  ${o.note ? `<div class="note"><b>${esc(t('order_note'))}:</b> ${esc(o.note)}</div>` : ''}

  <div class="foot">
    <span>${esc(t('payment_method'))}: ${esc(o.gateway || '—')} ·
      ${esc(o.payment_status === 'paid' ? t('paid') : t('unpaid'))}</span>
    <span>${esc(shop.hours || '')}</span>
  </div>
</div></body></html>`;

  const win = window.open('', '_blank');
  if(!win) return toast(t('popup_blocked'), 'err');
  win.document.write(html);
  win.document.close();
}

/** وقتی شماره‌ی حساب با سفارش نمی‌خواند، شماره‌ی خود سفارش را می‌پرسد */
function askInvoicePhone(code){
  openSheet(t('invoice'), `
    <p class="sheet-lead">${esc(t('invoice_phone_hint'))}</p>
    <div class="ff-grid">
      ${fld('ivPhone', t('phone'), {dir:'ltr', mode:'numeric', max:11, wide:1, icon: IC2.user})}
    </div>`,
    `<button class="btn btn-ghost" data-sheet-close>${esc(t('cancel'))}</button>
     <button class="btn btn-primary" id="ivGo">${esc(t('view_invoice'))}</button>`);
  wireFloating($('#mpSheet'));
  const go2 = () => { const v = $('#ivPhone').value.trim(); if(!v) return; closeSheet(); openInvoice(code, v); };
  $('#ivGo').onclick = go2;
  $('#ivPhone').addEventListener('keydown', e => { if(e.key === 'Enter') go2(); });
}

/* ══════════════════════════════════════════
   صفحه ۴۰۴
══════════════════════════════════════════ */
function show404(parts){
  $$('.page').forEach(p => p.classList.toggle('active', p.id === 'page-404'));
  window.scrollTo({top:0, behavior:'instant'});
  closePanel();
  renderPanelNav();
  document.title = t('nf_title') + ' | ' + (S.settings.site_name_fa || 'مای پیکسل');

  const pathEl = $('#nfPath');
  if(pathEl) pathEl.innerHTML = `<span dir="ltr">${esc(location.pathname)}</span>`;

  const inp = $('#nfInput'), btn = $('#nfGo');
  if(btn && !btn.dataset.wired){
    btn.dataset.wired = '1';
    btn.innerHTML = IC2.search;
    const fire = () => {
      const q = (inp.value || '').trim();
      if(q) go('/products?q=' + encodeURIComponent(q));
    };
    btn.onclick = fire;
    inp.addEventListener('keydown', e => { if(e.key === 'Enter') fire(); });
  }
}

/* ══════════════════════════════════════════
   قوانین و مقررات
══════════════════════════════════════════ */
/** مارک‌داون سبک: ## عنوان، - فهرست، **پررنگ** و پاراگراف */
function miniMarkdown(src){
  const lines = String(src || '').split('\n');
  let html = '', list = false;
  const inline = x => esc(x)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\[(.+?)\]\((\S+?)\)/g, '<a href="$2">$1</a>');

  for(const raw of lines){
    const line = raw.trim();
    if(!line){ if(list){ html += '</ul>'; list = false; } continue; }
    if(/^#{2,3}\s/.test(line)){
      if(list){ html += '</ul>'; list = false; }
      html += `<h3>${inline(line.replace(/^#+\s*/, ''))}</h3>`;
    } else if(/^[-*]\s/.test(line)){
      if(!list){ html += '<ul>'; list = true; }
      html += `<li>${inline(line.replace(/^[-*]\s*/, ''))}</li>`;
    } else {
      if(list){ html += '</ul>'; list = false; }
      html += `<p>${inline(line)}</p>`;
    }
  }
  if(list) html += '</ul>';
  return html;
}

function renderTerms(){
  const host = $('#termsBody');
  if(!host) return;
  const st = S.settings || {};
  const title = st.terms_title || t('nav_terms');
  const ttl = $('#termsTitle'); if(ttl) ttl.textContent = title;
  const upd = $('#termsUpdated');
  if(upd) upd.textContent = st.terms_updated ? `${t('last_updated')}: ${st.terms_updated}` : '';

  host.innerHTML = `<article class="terms glass">${miniMarkdown(st.terms_body || t('terms_empty'))}</article>
    <div class="terms-foot">
      <a class="btn btn-ghost" href="/returns">${esc(t('nav_returns'))}</a>
      <a class="btn btn-ghost" href="/shipping">${esc(t('nav_shipping'))}</a>
      <a class="btn btn-primary" href="/support">${esc(t('nav_support'))}</a>
    </div>`;
}

/* ══════════════════════════════════════════
   پلتفرم‌های فروش
══════════════════════════════════════════ */
const PLAT_ICON = {
  digikala:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M5.6 10.4h20.8l-1.6 15.2H7.2z"/><path d="M11.4 13.4V8.6a4.6 4.6 0 0 1 9.2 0v4.8"/><path d="m12.6 18.4 2.4 2.4 4.6-4.8"/></svg>',
  basalam:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M16 4.4 27 10v12L16 27.6 5 22V10z"/><path d="M5 10l11 5.6L27 10M16 15.6v12"/></svg>',
  torob:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><circle cx="13.6" cy="13.6" r="8.6"/><path d="m19.8 19.8 7.2 7.2"/><path d="M10.2 13.6h6.8M13.6 10.2v6.8"/></svg>',
  emalls:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4.6 25.4V14l5.6-4 5.8 6 5.8-8 5.6 5.4v12z"/><circle cx="10.6" cy="7.4" r="2.4"/></svg>',
  custom:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="4.4" y="8" width="23.2" height="17" rx="3"/><path d="M4.4 13.6h23.2M10.6 4.6v5M21.4 4.6v5"/></svg>'
};

async function renderPlatforms(){
  const host = $('#platformsBody');
  if(!host) return;
  host.innerHTML = '<div class="skel" style="height:220px"></div>';

  let items = [];
  try{ items = (await api('/platforms')).items || []; }catch(_){ items = []; }
  const st = S.settings || {};

  host.innerHTML = `
    ${items.length ? `<div class="plat-grid">${items.map(pl => {
      const ic = pl.logo_url ? `<img src="${esc(pl.logo_url)}" alt="${esc(pl.name_fa)}">`
                             : (PLAT_ICON[pl.slug] || PLAT_ICON.custom);
      const tag = pl.url ? 'a' : 'div';
      return `<${tag} class="plat-card ${pl.url?'':'off'} ${pl.bg_url?'has-bg':''}"
        ${pl.url ? `href="${esc(pl.url)}" target="_blank" rel="noopener"` : ''}>
        ${pl.bg_url ? `<span class="plat-bg" style="background-image:url('${esc(pl.bg_url)}')"></span>` : ''}
        <span class="plat-body">
          <span class="plat-ic">${ic}</span>
          <b>${esc(pl.name_fa)}</b>
          ${pl.name_en ? `<em class="en">${esc(pl.name_en)}</em>` : ''}
          ${pl.desc_fa ? `<span class="plat-desc">${esc(pl.desc_fa)}</span>` : ''}
          <span class="plat-go">${pl.url ? esc(t('plat_visit')) : esc(t('badge_soon'))}
            ${pl.url ? IC2.chev : ''}</span>
        </span>
      </${tag}>`;
    }).join('')}</div>`
    : emptyBox(PLAT_ICON.custom, t('plat_none'), t('plat_none_sub'))}

    <div class="plat-foot">
      <p>${esc(t('plat_note'))}</p>
      <a class="btn btn-primary" href="/products">${esc(t('nav_products'))}</a>
      <a class="btn btn-ghost" href="/support">${esc(t('nav_support'))}</a>
    </div>`;
}

/* ══════════════════════════════════════════
   قوانین مرجوعی + ثبت درخواست
══════════════════════════════════════════ */
function renderReturns(){
  const host = $('#returnsBody');
  if(!host) return;
  const days = S.settings.return_days || '۷';

  host.innerHTML = `
  <div class="info-grid">
    <div class="info-card"><div class="ic">${IC2.clock}</div>
      <h4>${esc(t('ret_window'))}</h4>
      <p>${esc(t('ret_window_body')).replace('{d}', num(days))}</p></div>
    <div class="info-card"><div class="ic">${IC2.badge}</div>
      <h4>${esc(t('ret_condition'))}</h4>
      <p>${esc(t('ret_condition_body'))}</p></div>
    <div class="info-card"><div class="ic">${IC2.price}</div>
      <h4>${esc(t('ret_refund'))}</h4>
      <p>${esc(t('ret_refund_body'))}</p></div>
  </div>

  <h3 style="font-size:1.05rem;font-weight:700;margin:34px 0 4px">${esc(t('ret_rules'))}</h3>
  <div class="rule-list">
    ${[t('ret_r1'), t('ret_r2'), t('ret_r3'), t('ret_r4'), t('ret_r5')].map((x,i) =>
      `<div class="rule"><span class="n">${num(i+1)}</span><p>${esc(x)}</p></div>`).join('')}
  </div>

  <div class="ret-quick">
    ${S.user ? `<a class="track-btn" href="/account?tab=orders">${IC2.bag}<span>${esc(t('my_orders_btn'))}</span></a>` : ''}
    <a class="track-btn" href="/track">${IC2.truck}<span>${esc(t('track_order'))}</span></a>
    ${S.user ? `<a class="track-btn" href="/account?tab=returns">${IC2.back}<span>${esc(t('tab_returns'))}</span></a>` : ''}
    <a class="track-btn ghost" href="/support">${IC2.help}<span>${esc(t('nav_support'))}</span></a>
  </div>

  <div class="co-step" style="max-width:600px;margin-top:22px">
    <h3><span class="num">${IC2.back}</span>${esc(t('ret_submit'))}</h3>
    <p class="hint-line">${esc(t('ret_only_delivered'))}</p>

    <div class="ff-grid">
      ${fld('rtCode', t('tracking_code'), {dir:'ltr', icon: IC2.bag, hint:'MP-XXXXXXXX'})}
      ${fld('rtPhone', t('phone'), {dir:'ltr', mode:'numeric', max:11,
        value: S.user?.phone || '', icon: IC2.user})}
    </div>
    <button class="btn btn-primary" id="rtCheck" style="width:100%;margin-top:6px">
      ${IC2.search}<span>${esc(t('ret_check'))}</span></button>

    <div class="ret-msg" id="rtMsg"></div>

    <div class="ret-form" id="rtFormBox">
      <div class="ret-items">
        <div class="ret-items-head">
          <b>${esc(t('ret_pick_items'))}</b>
          <button type="button" class="ret-all" id="rtAll">${esc(t('select_all'))}</button>
        </div>
        <div id="rtItems"></div>
      </div>
      <div class="ff-grid">
        ${fld('rtTelegram', t('telegram_id'), {wide:1, dir:'ltr', icon: IC2.telegram,
          hint: t('telegram_hint')})}
        ${fld('rtReason', t('ret_reason'), {wide:1, options:[
          ['defective', t('ret_defective')], ['wrong_item', t('ret_wrong')],
          ['not_as_described', t('ret_notdesc')], ['changed_mind', t('ret_mind')],
          ['other', t('ret_other')]]})}
        ${fld('rtDesc', t('ret_desc'), {area:1, rows:3, wide:1, hint: t('ret_desc_ph')})}
      </div>
      <button class="btn btn-primary" id="rtSend" style="width:100%">${esc(t('ret_send'))}</button>
    </div>
  </div>`;

  wireFloating(host);
  const rtCheck = $('#rtCheck'), rtBox = $('#rtFormBox'), rtMsg = $('#rtMsg');

  // اگر از صفحه پیگیری آمده، کد را پر کن و خودکار بررسی کن
  const pre = new URLSearchParams(location.search).get('code');
  if(pre){
    $('#rtCode').value = pre.toUpperCase();
    wireFloating(host);
    setTimeout(() => $('#rtCheck').click(), 350);
  }

  async function check(){
    rtMsg.className = 'ret-msg'; rtMsg.innerHTML = '';
    rtBox.classList.remove('open');
    const code = $('#rtCode').value.trim(), phone = $('#rtPhone').value.trim();
    if(!code) return showMsg('warn', t('ret_need_code'));

    rtCheck.disabled = true;
    try{
      const r = await api('/account/returns/check', { method:'POST', body: JSON.stringify({ tracking_code: code, phone })});
      if(r.eligible){
        showMsg('ok', t('ret_eligible').replace('{d}', num(r.days_left)));
        rtBox.classList.add('open');
        S2.retOrder = { code, phone, items: r.items };
        S2.retItems = r.items.filter(i => i.max_qty > 0).map(i => ({ ...i, picked:false, take:1 }));
        paintReturnItems();
      } else {
        const why = { not_delivered: t('ret_no_delivered').replace('{s}', esc(statusFa(r.status))),
                      expired: t('ret_no_expired').replace('{d}', num(r.return_days)),
                      duplicate: t('ret_no_dup') }[r.reason] || t('err_generic');
        showMsg('err', why);
      }
    }catch(e){ showMsg('err', e.message || t('err_generic')); }
    finally{ rtCheck.disabled = false; }
  }

  /** فهرست اقلام سفارش با چک‌باکس و انتخاب تعداد */
  function paintReturnItems(){
    const box = $('#rtItems');
    if(!box) return;
    const list = S2.retItems || [];
    box.innerHTML = list.length ? list.map((i, idx) => `
      <label class="ret-item ${i.picked?'on':''}" data-ri="${idx}">
        <input type="checkbox" ${i.picked?'checked':''} data-ric="${idx}">
        <span class="bx">${IC2.check}</span>
        <span class="ri-main">
          <b>${esc(i.title_snapshot)}</b>
          ${i.opt_size||i.opt_color ? `<em>${esc([i.opt_size,i.opt_color].filter(Boolean).join(' · '))}</em>` : ''}
          <span class="ri-price">${money(i.unit_price)}</span>
        </span>
        <span class="ri-qty" data-qty="${idx}">
          <button type="button" data-rq="-" ${i.take<=1?'disabled':''}>${IC2.minus}</button>
          <b>${num(i.take)}</b>
          <button type="button" data-rq="+" ${i.take>=i.max_qty?'disabled':''}>${IC2.plus}</button>
          <small>${esc(t('of'))} ${num(i.max_qty)}</small>
        </span>
      </label>`).join('')
      : `<p class="hint-line" style="margin:0">${esc(t('ret_nothing_left'))}</p>`;

    $$('[data-ric]', box).forEach(cb => cb.onchange = () => {
      list[parseInt(cb.dataset.ric)].picked = cb.checked;
      paintReturnItems();
    });
    $$('[data-rq]', box).forEach(b => b.onclick = e => {
      e.preventDefault(); e.stopPropagation();
      const idx = parseInt(b.closest('[data-qty]').dataset.qty);
      const it = list[idx];
      if(b.dataset.rq === '+'){ if(it.take < it.max_qty) it.take++; }
      else if(it.take > 1) it.take--;
      it.picked = true;
      paintReturnItems();
    });

    const all = $('#rtAll');
    if(all){
      const every = list.length && list.every(i => i.picked);
      all.textContent = every ? t('clear_selection') : t('select_all');
      all.onclick = () => { list.forEach(i => i.picked = !every); paintReturnItems(); };
    }
  }

  function showMsg(kind, text){
    rtMsg.className = 'ret-msg show ' + kind;
    rtMsg.innerHTML = `${kind === 'ok' ? IC2.check : IC2.alert}<span>${text}</span>`;
  }

  rtCheck.onclick = check;
  $('#rtCode').addEventListener('keydown', e => { if(e.key === 'Enter') check(); });

  $('#rtSend').onclick = async () => {
    const btn = $('#rtSend');
    btn.disabled = true;
    try{
      const picked = (S2.retItems || []).filter(i => i.picked);
      if(!picked.length){ btn.disabled = false; return showMsg('warn', t('ret_pick_first')); }
      const r = await api('/account/returns', { method:'POST', body: JSON.stringify({
        tracking_code: $('#rtCode').value, phone: $('#rtPhone').value,
        reason: $('#rtReason').value, description: $('#rtDesc').value,
        telegram: $('#rtTelegram') ? $('#rtTelegram').value : '',
        items: picked.map(i => ({ order_item_id: i.id, qty: i.take }))
      })});
      showMsg('ok', r.message);
      rtBox.classList.remove('open');
      $('#rtCode').value = ''; $('#rtDesc').value = '';
    }catch(e){ showMsg('err', e.message || t('err_generic')); }
    finally{ btn.disabled = false; }
  };
}

function statusFa(st){
  return ({pending:'در انتظار پرداخت', paid:'پرداخت‌شده', processing:'در حال آماده‌سازی',
    packed:'بسته‌بندی‌شده', shipped:'ارسال‌شده', delivered:'تحویل‌شده',
    cancelled:'لغوشده', refunded:'مرجوع‌شده'})[st] || st;
}

/* ══════════════════════════════════════════
   اطلاعات حمل و نقل
══════════════════════════════════════════ */
function renderShipping(){
  const host = $('#shippingBody');
  if(!host) return;
  const cost = parseInt(S.settings.shipping_cost || 0);
  const free = parseInt(S.settings.free_shipping_from || 0);

  host.innerHTML = `
  <div class="info-grid">
    <div class="info-card"><div class="ic">${IC2.truck}</div>
      <h4>${esc(t('ship_post'))}</h4><p>${esc(t('ship_post_body'))}</p></div>
    <div class="info-card"><div class="ic">${IC2.bag}</div>
      <h4>${esc(t('ship_tipax'))}</h4><p>${esc(t('ship_tipax_body'))}</p></div>
    <div class="info-card"><div class="ic">${IC2.badge}</div>
      <h4>${esc(t('ship_code'))}</h4><p>${esc(t('ship_code_body'))}</p></div>
  </div>

  <div class="co-step" style="max-width:560px;margin-top:26px">
    <h3><span class="num">${IC2.price}</span>${esc(t('ship_costs'))}</h3>
    <div class="co-line"><span>${esc(t('ship_flat'))}</span><span>${money(cost)}</span></div>
    ${free > 0 ? `<div class="co-line"><span>${esc(t('ship_free_from'))}</span>
      <span class="off">${money(free)}</span></div>` : ''}
    <div class="co-line"><span>${esc(t('ship_carriers'))}</span>
      <span>${esc(S.settings.shipping_carriers_fa || 'پست پیشتاز، تیپاکس')}</span></div>
  </div>

  <div style="display:flex;gap:10px;margin-top:24px;flex-wrap:wrap">
    <a class="btn btn-primary" href="/track">${esc(t('track_order'))}</a>
    <a class="btn btn-ghost" href="/returns">${esc(t('nav_returns'))}</a>
  </div>`;
}

/* ══════════════════════════════════════════
   انیمیشن هنگام فیلتر و دسته‌بندی
══════════════════════════════════════════ */
function renderProducts(){
  setupMobileFilters();
  updateFilterCount();
  const grid = $('#productsGrid');
  if(grid) grid.classList.add('grid-swap');
  setTimeout(() => {
    _origRenderProducts();
    const g = $('#productsGrid');
    if(g){ g.classList.remove('grid-swap'); stagger(g); wireWishButtons(g); }
    paintWishButtons();
  }, 120);
}

function renderCategories(){
  _origRenderCategories();
  stagger($('#catList'));
}

/* ══════════════════════════════════════════
   روتر گسترش‌یافته
══════════════════════════════════════════ */
function route(){
  const {parts, params} = parseHash();
  const name = parts[0] || 'home';
  const extra = {checkout:'page-checkout', account:'page-account', wishlist:'page-wishlist',
                 returns:'page-returns', shipping:'page-shipping', platforms:'page-platforms',
                 terms:'page-terms', invoice:'page-invoice'};

  if(extra[name]){
    $$('.page').forEach(p => p.classList.toggle('active', p.id === extra[name]));
    window.scrollTo({top:0, behavior:'instant'});
    closePanel();
    renderPanelNav();
    if(name === 'checkout') renderCheckout();
    if(name === 'account')  renderAccountPage();
    if(name === 'wishlist') renderWishlist();
    if(name === 'returns')  renderReturns();
    if(name === 'shipping') renderShipping();
    if(name === 'platforms') renderPlatforms();
    if(name === 'terms')     renderTerms();
    return;
  }

  // مسیر ناشناخته → صفحه ۴۰۴
  const known = ['home','categories','products','product','track','faq','announcements',
    'about','support','checkout','account','wishlist','returns','shipping','platforms','terms'];
  if(name !== 'home' && !known.includes(name)){
    show404(parts, params);
    return;
  }

  _origRoute();
  setTimeout(() => { if(pruneCart()) renderCart(); }, 400);
  if(name === 'products') setTimeout(setupMobileFilters, 30);
  paintWishButtons();
  wireWishButtons();
}

/* ══════════════════════════════════════════
   راه‌اندازی بخش دوم
══════════════════════════════════════════ */
/** روی موبایل فیلترها را پشت یک دکمه جمع می‌کند */
function setupMobileFilters(){
  const bar = $('.filter-bar');
  if(!bar || bar.dataset.wired) return;
  bar.dataset.wired = '1';

  const rows = $$('.filter-row', bar);
  if(rows.length < 2) return;

  // ردیف‌های دوم به بعد داخل یک باکس جمع‌شونده
  const wrap = document.createElement('div');
  wrap.className = 'filter-collapse';
  wrap.id = 'filterCollapse';
  rows.slice(1).forEach(r => wrap.appendChild(r));

  const btn = document.createElement('button');
  btn.className = 'filter-toggle';
  btn.id = 'filterToggle';
  btn.innerHTML = `${IC2.filter}<span>${esc(t('filters'))}</span>
    <span class="fcount" id="filterCount" hidden>0</span>
    <span class="caret">${IC2.chev}</span>`;

  bar.appendChild(btn);
  bar.appendChild(wrap);

  btn.onclick = () => {
    const open = wrap.classList.toggle('open');
    btn.classList.toggle('open', open);
  };
  updateFilterCount();
}

/** تعداد فیلترهای فعال را روی دکمه نشان می‌دهد */
function updateFilterCount(){
  const el = $('#filterCount');
  if(!el) return;
  let n = 0;
  const sort = $('#sortSelect'), min = $('#minPrice'), max = $('#maxPrice'), stock = $('#inStockOnly');
  if(sort && sort.value && sort.value !== 'newest') n++;
  if(min && min.value) n++;
  if(max && max.value) n++;
  if(stock && stock.checked) n++;
  el.textContent = num(n);
  el.hidden = n === 0;
}

async function init2(){
  wireTheme();
  await loadWish();
  pruneCart(); renderCart();

  // دکمه ادامه ثبت سفارش
  const cb = $('#checkoutBtn');
  if(cb) cb.onclick = () => {
    if(!S.cart.length) return;
    closeCart();
    if(!S.user){
      S2.afterLogin = '/checkout';
      toast(t('need_login_checkout'), 'warn');
      setTimeout(openAccount, 260);
      return;
    }
    go('/checkout');
  };

  // اشتراک‌گذاری
  const sc = $('#shareClose'); if(sc) sc.onclick = closeShare;
  const cp = $('#shareCopy');
  if(cp) cp.onclick = async () => {
    const u = $('#shareUrl').value;
    try{ await navigator.clipboard.writeText(u); }
    catch(_){ $('#shareUrl').select(); document.execCommand('copy'); }
    cp.textContent = t('copied');
    toast(t('link_copied'), 'ok');
    setTimeout(() => cp.textContent = t('copy'), 1600);
  };

  const ov = $('#accountOverlay');
  if(ov) ov.addEventListener('click', () => { closeShare(); closeSheet(); });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape'){ closeShare(); closeSheet(); }
  });

  // کادر جستجوی خالی → تاریخچه (فوکوس، کلیک، بعد از پاک کردن)
  [['#searchInput','#searchResults'], ['#searchInputM','#searchResultsM']].forEach(([i,r]) => {
    const inp = $(i), res = $(r);
    if(!inp || !res) return;
    const showHist = () => { if(!inp.value.trim()) runSearch('', res); };
    inp.addEventListener('focus', showHist);
    inp.addEventListener('click', showHist);
    inp.addEventListener('input', () => { if(!inp.value.trim()) showHist(); });
  });

  // دکمه ✕ کادر جستجو → تاریخچه را نشان بده
  const sc2 = $('#searchClear');
  if(sc2) sc2.addEventListener('click', () => setTimeout(() => {
    const inp = $('#searchInput'), res = $('#searchResults');
    if(inp && res){ inp.focus(); runSearch('', res); }
  }, 20));

  // باز شدن شیت جستجوی موبایل → تاریخچه
  const sbm = $('#searchMobileBtn');
  if(sbm) sbm.addEventListener('click', () => setTimeout(() => {
    const inp = $('#searchInputM'), res = $('#searchResultsM');
    if(inp && res && !inp.value.trim()) runSearch('', res);
  }, 260));

  renderTrust();
  paintWishButtons();
  wireWishButtons();
}

document.addEventListener('DOMContentLoaded', () => setTimeout(init2, 60));


document.addEventListener('DOMContentLoaded', init);
})();
