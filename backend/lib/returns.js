// دلیل‌ها و وضعیت‌های مرجوعی — مشترک بین routes/account.js و routes/admin.js
const RETURN_REASONS = {
  defective:        'کالا معیوب یا شکسته بود',
  wrong_item:       'کالای اشتباه ارسال شد',
  not_as_described: 'با توضیحات سایت مطابقت نداشت',
  changed_mind:     'منصرف شدم',
  other:            'دلیل دیگر'
};

const RETURN_STATUS = {
  pending:  'در انتظار بررسی',
  approved: 'تایید شد — کالا را ارسال کن',
  rejected: 'رد شد',
  received: 'کالا دریافت شد',
  refunded: 'وجه بازگردانده شد'
};

module.exports = { RETURN_REASONS, RETURN_STATUS };
