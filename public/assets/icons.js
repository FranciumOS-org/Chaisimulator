/* ============================================================
   مای پیکسل — کتابخانه آیکون
   همه با stroke="currentColor" تا با تم سایت هماهنگ بمانند
   ============================================================ */
window.MPIcons = (function () {
  const S = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
  const w = (d, extra = '') => `<svg viewBox="0 0 24 24" ${S}>${d}${extra}</svg>`;

  const P = {
    box:       '<path d="M12 2.6 20.4 7v10L12 21.4 3.6 17V7z"/><path d="m3.6 7 8.4 4.4L20.4 7M12 11.4v10"/>',
    art:       '<rect x="3" y="4" width="18" height="16" rx="2.4"/><circle cx="8.4" cy="9.4" r="1.7"/><path d="m4 17 4.6-5 3.2 3.2L15.8 11 20 16"/>',
    figure:    '<circle cx="12" cy="6.2" r="2.9"/><path d="M7 21v-4.4a5 5 0 0 1 10 0V21"/><path d="M9.4 12.6 7 15m8-2.4 2.4 2.4"/>',
    car:       '<path d="M3.4 14.6 5 9.8A2.4 2.4 0 0 1 7.3 8.2h9.4a2.4 2.4 0 0 1 2.2 1.4l2.1 4.4v3.4h-2.2"/><path d="M3.4 14.6V18h2.2"/><circle cx="7.6" cy="17.4" r="1.9"/><circle cx="16.4" cy="17.4" r="1.9"/><path d="M9.5 17.4h5"/>',
    plane:     '<path d="M10.2 3.4a1.5 1.5 0 0 1 3 0v5.1l7.3 4v2.3l-7.3-2.2v4.3l2.4 1.8v1.7l-3.9-1.1-3.9 1.1v-1.7l2.4-1.8v-4.3L2.9 14.8v-2.3l7.3-4z"/>',
    ship:      '<path d="M3.4 15.4 5 9.6h14l1.6 5.8"/><path d="M12 3.4v6.2M8 9.6V6.8h8v2.8"/><path d="M2.6 18.4c1.6 0 1.6 1.6 3.2 1.6s1.6-1.6 3.2-1.6 1.6 1.6 3.2 1.6 1.6-1.6 3.2-1.6 1.6 1.6 3.2 1.6"/>',
    rocket:    '<path d="M12 2.6c3 2.2 4.6 5.4 4.6 9v3.6H7.4v-3.6c0-3.6 1.6-6.8 4.6-9z"/><circle cx="12" cy="9.6" r="1.9"/><path d="M7.4 13 4.6 15.8v3.2l2.8-1.6m9.2-4.4 2.8 2.8v3.2l-2.8-1.6"/><path d="M10.4 18.4h3.2l-1.6 3z"/>',
    robot:     '<rect x="4.4" y="8" width="15.2" height="11" rx="2.6"/><path d="M12 4v4M9 4.6h6"/><circle cx="9.2" cy="13" r="1.3"/><circle cx="14.8" cy="13" r="1.3"/><path d="M9.6 16.4h4.8"/><path d="M2.4 12v3m19.2-3v3"/>',
    gamepad:   '<path d="M7.4 8h9.2a4.6 4.6 0 0 1 4.4 5.8l-.8 3.2a2.4 2.4 0 0 1-4.1 1L14 16H10l-2.1 2a2.4 2.4 0 0 1-4.1-1l-.8-3.2A4.6 4.6 0 0 1 7.4 8z"/><path d="M7.6 11.4v2.4M6.4 12.6h2.4"/><circle cx="15.6" cy="11.8" r=".9" fill="currentColor" stroke="none"/><circle cx="17.6" cy="13.6" r=".9" fill="currentColor" stroke="none"/>',
    dice:      '<rect x="3.4" y="3.4" width="17.2" height="17.2" rx="3.2"/><circle cx="8.4" cy="8.4" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.6" cy="8.4" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="8.4" cy="15.6" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.6" cy="15.6" r="1.1" fill="currentColor" stroke="none"/>',
    puzzle:    '<path d="M9.6 3.4h4.8v2.2a1.8 1.8 0 1 0 3.6 0V3.4h2.6v4.8h-2.2a1.8 1.8 0 1 0 0 3.6h2.2v4.8h-4.8v-2.2a1.8 1.8 0 1 0-3.6 0v2.2H3.4v-4.8h2.2a1.8 1.8 0 1 0 0-3.6H3.4V3.4h6.2z"/>',
    lamp:      '<path d="M9 21h6M10 18h4"/><path d="M12 3a6 6 0 0 1 3.6 10.8V18H8.4v-4.2A6 6 0 0 1 12 3z"/>',
    neon:      '<path d="M4 15.4C4 9.6 7.6 5.4 12 5.4s8 4.2 8 10"/><path d="M7.4 18.6h9.2"/><path d="M12 2.4v1.6M4.4 6.2 5.6 7.4M19.6 6.2 18.4 7.4"/>',
    frame:     '<rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.2"/><rect x="6.8" y="6.8" width="10.4" height="10.4" rx="1.2"/>',
    camera:    '<path d="M3.4 8.6h3.2l1.6-2.4h7.6l1.6 2.4h3.2v10.4H3.4z"/><circle cx="12" cy="13.4" r="3.4"/>',
    music:     '<circle cx="7" cy="17.4" r="2.6"/><circle cx="17.4" cy="15.4" r="2.6"/><path d="M9.6 17.4V6.6l10.4-2.2v10.8"/><path d="M9.6 9.6 20 7.4"/>',
    headphone: '<path d="M4 14.4v-2a8 8 0 0 1 16 0v2"/><rect x="2.6" y="13.6" width="4.2" height="6.4" rx="2.1"/><rect x="17.2" y="13.6" width="4.2" height="6.4" rx="2.1"/>',
    keyboard:  '<rect x="2.4" y="6.4" width="19.2" height="11.2" rx="2.2"/><path d="M6 10h.01M9.4 10h.01M12.8 10h.01M16.2 10h.01M6 13.4h.01M9.4 13.4h.01M12.8 13.4h.01M16.2 13.4h.01M18.6 10h.01M18.6 13.4h.01" stroke-width="2.1"/><path d="M8.4 16h7.2"/>',
    mouse:     '<rect x="7.4" y="2.6" width="9.2" height="18.8" rx="4.6"/><path d="M12 6.4v3.2"/>',
    cpu:       '<rect x="6.4" y="6.4" width="11.2" height="11.2" rx="2"/><rect x="9.8" y="9.8" width="4.4" height="4.4" rx="1"/><path d="M9.4 2.6v3.8M14.6 2.6v3.8M9.4 17.6v3.8M14.6 17.6v3.8M2.6 9.4h3.8M2.6 14.6h3.8M17.6 9.4h3.8M17.6 14.6h3.8"/>',
    watch:     '<circle cx="12" cy="12" r="5.6"/><path d="M12 9.4V12l1.8 1.2"/><path d="M8.6 6.6 9 2.6h6l.4 4M8.6 17.4 9 21.4h6l.4-4"/>',
    shirt:     '<path d="M8.4 3.4 4 6l1.6 4 2-.8V20.6h8.8V9.2l2 .8L20 6l-4.4-2.6a3.6 3.6 0 0 1-7.2 0z"/>',
    bag:       '<path d="M4.4 8h15.2l1.2 12.6H3.2z"/><path d="M8.6 10.4V6.6a3.4 3.4 0 0 1 6.8 0v3.8"/>',
    cup:       '<path d="M4.4 6.4h12v9.2a4.6 4.6 0 0 1-4.6 4.6H9a4.6 4.6 0 0 1-4.6-4.6z"/><path d="M16.4 8.4h1.8a2.8 2.8 0 0 1 0 5.6h-1.8"/><path d="M7 2.6v2M11 2.6v2"/>',
    book:      '<path d="M4.4 4.4A2 2 0 0 1 6.4 2.4h13.2v16.4H6.4a2 2 0 0 0-2 2z"/><path d="M4.4 4.4v16.4M8.4 6.6h7"/>',
    pen:       '<path d="M3.4 20.6h4.2L20 8.2a2.9 2.9 0 0 0-4.2-4.2L3.4 16.4z"/><path d="m14.4 5.4 4.2 4.2"/>',
    sticker:   '<path d="M14.4 3.4H6.4a3 3 0 0 0-3 3v11.2a3 3 0 0 0 3 3h5.4l8.8-8.8V9.4z"/><path d="M13.4 20.6v-5.2a1.8 1.8 0 0 1 1.8-1.8h5.4"/>',
    card:      '<rect x="2.6" y="5.4" width="18.8" height="13.2" rx="2.4"/><path d="M2.6 9.6h18.8"/><path d="M6.4 14.4h4"/>',
    coin:      '<ellipse cx="12" cy="7" rx="7.6" ry="3.4"/><path d="M4.4 7v10c0 1.9 3.4 3.4 7.6 3.4s7.6-1.5 7.6-3.4V7"/><path d="M4.4 12c0 1.9 3.4 3.4 7.6 3.4s7.6-1.5 7.6-3.4"/>',
    medal:     '<circle cx="12" cy="15" r="5.4"/><path d="m8.4 10.2-3-7.6M15.6 10.2l3-7.6M9.6 2.6h4.8"/><path d="m12 12.6.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" stroke-width="1.2"/>',
    trophy:    '<path d="M8 4.4h8v6a4 4 0 0 1-8 0z"/><path d="M8 6.4H5.4a2.6 2.6 0 0 0 2.6 4M16 6.4h2.6a2.6 2.6 0 0 1-2.6 4"/><path d="M12 14.4v3M8.6 20.6h6.8l-.8-3.2H9.4z"/>',
    crown:     '<path d="M3.4 7.6 6.8 13 12 5.4 17.2 13l3.4-5.4v10.4a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6z"/>',
    gem:       '<path d="M6.4 3.4h11.2l3.8 5.4L12 20.6 2.6 8.8z"/><path d="M2.6 8.8h18.8M8.4 8.8 12 20.6l3.6-11.8M6.4 3.4l2 5.4M17.6 3.4l-2 5.4"/>',
    star:      '<path d="m12 3.2 2.8 5.7 6.3.9-4.6 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.8l6.3-.9z"/>',
    heart:     '<path d="M12 20.4 4.6 13a4.9 4.9 0 0 1 7-6.9l.4.4.4-.4a4.9 4.9 0 0 1 7 6.9z"/>',
    skull:     '<path d="M12 2.6a8 8 0 0 0-4.6 14.6v2.2a1.6 1.6 0 0 0 1.6 1.6h6a1.6 1.6 0 0 0 1.6-1.6v-2.2A8 8 0 0 0 12 2.6z"/><circle cx="9" cy="11" r="1.9"/><circle cx="15" cy="11" r="1.9"/><path d="M11 15.6h2"/>',
    ghost:     '<path d="M4.6 20.6V10a7.4 7.4 0 0 1 14.8 0v10.6l-2.5-1.8-2.4 1.8-2.5-1.8-2.5 1.8-2.4-1.8z"/><circle cx="9.4" cy="10" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.6" cy="10" r="1.2" fill="currentColor" stroke="none"/>',
    cat:       '<path d="M4.4 8.4 3.6 3.6l4 2.6a9.6 9.6 0 0 1 8.8 0l4-2.6-.8 4.8a7.6 7.6 0 1 1-15.2 0z"/><circle cx="9.4" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.6" cy="12" r="1.1" fill="currentColor" stroke="none"/><path d="M12 14.4v1.4M10 16.6h4"/>',
    dog:       '<path d="M5.4 6.4 4 3.4l3.4 1.4a9 9 0 0 1 9.2 0L20 3.4l-1.4 3a7.4 7.4 0 0 1-.4 12.6H5.8a7.4 7.4 0 0 1-.4-12.6z"/><circle cx="9.4" cy="11.4" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.6" cy="11.4" r="1.1" fill="currentColor" stroke="none"/><path d="M12 14v1.6"/>',
    dragon:    '<path d="M3 12.4c0-3.4 2.8-6 6.2-6h4.4l2-3.4 1.4 3.6 3.6.8-2.4 2.6.6 3.6-3.2-1.4-2.6 1.6"/><path d="M9.2 12.4c-2.4 0-3.6 1.8-3.6 3.6s1.6 3.6 4 3.6h7.6"/>',
    tree:      '<path d="M12 2.6 6.4 10h3L5.4 16h5.2v5h2.8v-5h5.2L14.6 10h3z"/>',
    flower:    '<circle cx="12" cy="9.4" r="2.4"/><path d="M12 7a2.8 2.8 0 1 1 0-2.4M14.4 9.4a2.8 2.8 0 1 1 2-1.4M14 11.6a2.8 2.8 0 1 1 1.2 2.2M10 11.6a2.8 2.8 0 1 0-1.2 2.2M9.6 9.4a2.8 2.8 0 1 0-2-1.4"/><path d="M12 12.2V21M12 17l3-2.4M12 18.6 9 16.4"/>',
    globe:     '<circle cx="12" cy="12" r="9.2"/><path d="M2.8 12h18.4"/><path d="M12 2.8a13.6 13.6 0 0 1 0 18.4 13.6 13.6 0 0 1 0-18.4z"/>',
    map:       '<path d="m2.8 6.4 6-2.6 6.4 2.6 6-2.6v14l-6 2.6-6.4-2.6-6 2.6z"/><path d="M8.8 3.8v14M15.2 6.4v14"/>',
    anchor:    '<circle cx="12" cy="5" r="2.4"/><path d="M12 7.4v13.2"/><path d="M7.6 11h8.8"/><path d="M3.4 14.4a8.6 8.6 0 0 0 17.2 0"/><path d="M3.4 14.4h2.6M18 14.4h2.6"/>',
    sword:     '<path d="m14.4 3.4 6.2 0-.1 6.2-9.4 9.3-6.1-6.1z"/><path d="m6.4 15.4-3 3 2.2 2.2 3-3M9.6 8.6 15 14"/>',
    shield:    '<path d="M12 2.8 4.4 6v6c0 4.4 3.2 8 7.6 9.2 4.4-1.2 7.6-4.8 7.6-9.2V6z"/><path d="m8.8 11.8 2.2 2.2 4.2-4.2"/>',
    wand:      '<path d="m4.4 19.6 11-11"/><path d="m14.2 4.4.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/><path d="m19.4 12.4.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"/>',
    palette:   '<path d="M12 3a9 9 0 0 0 0 18c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8h2.1A5.3 5.3 0 0 0 22 9.7C21.6 5.9 17.3 3 12 3z"/><circle cx="7.4" cy="11.4" r="1.2" fill="currentColor" stroke="none"/><circle cx="10.4" cy="7.4" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.4" cy="8" r="1.2" fill="currentColor" stroke="none"/>',
    telegram:  '<path d="M21.4 4.2 2.9 11.3a.6.6 0 0 0 .05 1.13l4.6 1.44 1.75 5.4a.6.6 0 0 0 1 .24l2.5-2.5 4.6 3.4a.6.6 0 0 0 .95-.36l3.1-15.1a.6.6 0 0 0-.85-.65z"/><path d="m7.55 13.87 11-7.1-8 8.6"/>',
    instagram: '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/>',
    whatsapp:  '<path d="M3.2 20.8 4.6 16a8.6 8.6 0 1 1 3.4 3.3z"/><path d="M9 9.2c0 3 2.4 5.4 5.4 5.4l.9-1.5-1.9-.9-.9.9a4.4 4.4 0 0 1-1.9-1.9l.9-.9-.9-1.9z"/>',
    chat:      '<path d="M21 12a8 8 0 0 1-11.6 7.1L3.5 20.5l1.4-5.9A8 8 0 1 1 21 12z"/><path d="M8.6 11.4h.01M12 11.4h.01M15.4 11.4h.01" stroke-width="2.2"/>',
    phone:     '<path d="M6.2 3.4h3.2l1.6 4-2 1.4a11 11 0 0 0 5.2 5.2l1.4-2 4 1.6v3.2a1.8 1.8 0 0 1-2 1.8A16.4 16.4 0 0 1 4.4 5.4a1.8 1.8 0 0 1 1.8-2z"/>',
    mail:      '<rect x="2.6" y="5" width="18.8" height="14" rx="2.6"/><path d="m3.4 6.6 8.6 6 8.6-6"/>',
    clock2:    '<circle cx="12" cy="12" r="9"/><path d="M12 6.6V12l3.6 2.2"/>',
    location:  '<path d="M12 21.4S4.8 15 4.8 9.8a7.2 7.2 0 0 1 14.4 0C19.2 15 12 21.4 12 21.4z"/><circle cx="12" cy="9.8" r="2.6"/>',
    twitter:   '<path d="M21.4 5.6a7.4 7.4 0 0 1-2.2.7 3.9 3.9 0 0 0 1.7-2.2 7.7 7.7 0 0 1-2.4 1 3.8 3.8 0 0 0-6.6 2.6c0 .3 0 .6.1.9A11 11 0 0 1 3.9 4.4a3.8 3.8 0 0 0 1.2 5.1 3.8 3.8 0 0 1-1.7-.5 3.8 3.8 0 0 0 3 3.8 3.9 3.9 0 0 1-1.7.1 3.8 3.8 0 0 0 3.6 2.6A7.7 7.7 0 0 1 2.6 17a10.9 10.9 0 0 0 5.9 1.7c7.1 0 11-5.9 11-11v-.5a7.8 7.8 0 0 0 1.9-2z"/>',
    linkedin:  '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="3"/><path d="M8 10.4v6.4M8 7.2v.01" stroke-width="2.1"/><path d="M12.4 16.8v-3.6a2.4 2.4 0 0 1 4.8 0v3.6"/>',
    youtube:   '<rect x="2.6" y="6" width="18.8" height="12" rx="3.4"/><path d="m10.4 9.6 5.2 2.4-5.2 2.4z"/>',
    sparkle:   '<path d="m12 2.6 2 5.4 5.4 2-5.4 2-2 5.4-2-5.4-5.4-2 5.4-2z"/><path d="m18.6 15.4.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z"/>'
  };

  const FA = {
    box:'جعبه', art:'تابلو', figure:'فیگور', car:'ماشین', plane:'هواپیما', ship:'کشتی',
    rocket:'موشک', robot:'ربات', gamepad:'گیم', dice:'بازی رومیزی', puzzle:'پازل',
    lamp:'لامپ و نور', neon:'نئون', frame:'قاب عکس', camera:'دوربین', music:'موسیقی',
    headphone:'هدفون', keyboard:'کیبورد', mouse:'ماوس', cpu:'قطعات کامپیوتر', watch:'ساعت',
    shirt:'پوشاک', bag:'کیف', cup:'ماگ و لیوان', book:'کتاب', pen:'نوشت‌افزار',
    sticker:'استیکر', card:'کارت کلکسیونی', coin:'سکه', medal:'مدال', trophy:'جام',
    crown:'تاج', gem:'جواهر', star:'ستاره', heart:'قلب', skull:'اسکلت', ghost:'روح',
    cat:'گربه', dog:'سگ', dragon:'اژدها', tree:'گیاه', flower:'گل', globe:'کره زمین',
    map:'نقشه', anchor:'لنگر', sword:'شمشیر', shield:'سپر', wand:'جادو',
    telegram:'تلگرام', instagram:'اینستاگرام', whatsapp:'واتساپ', chat:'گفتگو',
    phone:'تلفن', mail:'ایمیل', clock2:'ساعت', location:'موقعیت',
    twitter:'ایکس (توییتر)', linkedin:'لینکدین', youtube:'یوتیوب',
    palette:'رنگ و نقاشی', sparkle:'درخشش'
  };

  return {
    /** SVG یک آیکون را برمی‌گرداند */
    get: k => w(P[k] || P.box),
    /** فهرست کلیدها برای انتخابگر پنل ادمین */
    keys: () => Object.keys(P),
    /** نام فارسی */
    label: k => FA[k] || k,
    /** همه به صورت [{key, fa, svg}] */
    all: () => Object.keys(P).map(k => ({ key: k, fa: FA[k] || k, svg: w(P[k]) }))
  };
})();
