/* ============================================================
   مای پیکسل — پنل مدیریت
   ============================================================ */
(function(){
'use strict';

const API = '/api';
const TK = 'mp_admin_token';
let token = localStorage.getItem(TK) || '';
let me = null;
let current = 'dashboard';
let cache = { categories: [], statuses: [], statusLabels: {} };

const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fa = n => String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const money = n => fa(Number(n||0).toLocaleString('en-US')) + ' تومان';
const num = n => fa(Number(n||0).toLocaleString('en-US'));

function fmtDate(s){
  if(!s) return '—';
  const d = new Date(s.replace(' ','T') + (s.includes('Z')?'':'Z'));
  if(isNaN(d)) return s;
  try{ return new Intl.DateTimeFormat('fa-IR',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(d); }
  catch(_){ return d.toLocaleString(); }
}

const I = {
  dash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7.5" height="8.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="5" rx="2"/><rect x="13.5" y="10.5" width="7.5" height="10.5" rx="2"/><rect x="3" y="14" width="7.5" height="7" rx="2"/></svg>',
  box:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z"/><path d="m3.5 7 8.5 4.5L20.5 7M12 11.5v10"/></svg>',
  grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>',
  cart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M2.5 3.5h2.2l2.3 11.3a1.7 1.7 0 0 0 1.7 1.4h8.2a1.7 1.7 0 0 0 1.7-1.4L20.2 7H6"/></svg>',
  users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.9 3-6.2 6.5-6.2s6.5 2.3 6.5 6.2"/><path d="M16.5 5.2a3.4 3.4 0 0 1 0 6.4M18 13.9c2.2.5 3.5 2.3 3.5 5"/></svg>',
  chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a8 8 0 0 1-11.6 7.1L3.5 20.5l1.4-5.9A8 8 0 1 1 21 12z"/></svg>',
  card:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19M6 15h4"/></svg>',
  help:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M9.4 9.2a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.2-2.6 3.9"/><circle cx="12" cy="17.4" r=".9" fill="currentColor" stroke="none"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 15V10a6 6 0 1 0-12 0v5l-1.6 2.6h15.2z"/><path d="M9.8 20.5a2.4 2.4 0 0 0 4.4 0"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3.2"/><path d="M19.5 12c0-.5 0-1-.1-1.4l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-2.4-1.4L14.4 2.8H9.6l-.3 2.5a7.6 7.6 0 0 0-2.4 1.4l-2.3-1-2 3.4 2 1.5a8.4 8.4 0 0 0 0 2.8l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 2.4 1.4l.3 2.5h4.8l.3-2.5a7.6 7.6 0 0 0 2.4-1.4l2.3 1 2-3.4-2-1.5c.1-.4.1-.9.1-1.4z"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.4 14.4 4.6 9.6l4.8-4.8"/><path d="M4.6 9.6h9.8a5 5 0 0 1 0 10H8.6"/></svg>',
  receipt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M5 2.6h14v18.8l-2.3-1.6-2.3 1.6-2.4-1.6-2.4 1.6-2.3-1.6L5 21.4z"/><path d="M8.6 8h6.8M8.6 12h6.8M8.6 16h4"/></svg>',
  sms:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M21 11.6a7.6 7.6 0 0 1-11 6.8L3.5 20l1.4-5.9A7.6 7.6 0 1 1 21 11.6z"/><path d="M8.6 11.4h.01M12 11.4h.01M15.4 11.4h.01" stroke-width="2.2"/></svg>',
  ban:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/></svg>',
  media:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="2.4"/><circle cx="8.6" cy="9.8" r="1.8"/><path d="m4 16.5 5-5 3.4 3.4 3.6-4 4 5.6"/></svg>',
  doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M6 2.6h8l4 4v14.8H6z"/><path d="M14 2.6v4h4"/><path d="M9 12h6M9 16h4"/></svg>',
  store:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3.4 9.6 5 4.4h14l1.6 5.2a3 3 0 0 1-5.7 1.6 3 3 0 0 1-5.8 0 3 3 0 0 1-5.7-1.6z"/><path d="M4.6 11.4v8.2h14.8v-8.2"/><path d="M9.6 19.6v-5h4.8v5"/></svg>',
  spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="m12 2.6 2 5.4 5.4 2-5.4 2-2 5.4-2-5.4-5.4-2 5.4-2z"/><path d="m18.6 15.4.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z"/></svg>',
  ticket:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3 8.4V5.6h18v2.8a2.6 2.6 0 0 0 0 5.2v5H3v-5a2.6 2.6 0 0 0 0-5.2z"/><path d="M9.5 5.6v13"/></svg>',
  image:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="2.4"/><circle cx="8.6" cy="9.8" r="1.8"/><path d="m4 16.5 5-5 3.4 3.4 3.6-4 4 5.6"/></svg>',
  coin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><ellipse cx="12" cy="6.6" rx="7.6" ry="3.2"/><path d="M4.4 6.6v10.8c0 1.8 3.4 3.2 7.6 3.2s7.6-1.4 7.6-3.2V6.6"/><path d="M4.4 12c0 1.8 3.4 3.2 7.6 3.2s7.6-1.4 7.6-3.2"/></svg>',
  globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a13.4 13.4 0 0 1 0 18 13.4 13.4 0 0 1 0-18z"/></svg>',
  plug:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M9 2.6v5M15 2.6v5"/><path d="M6.4 7.6h11.2v3.8a5.6 5.6 0 0 1-11.2 0z"/><path d="M12 17v4.4"/></svg>',
  log:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 3.5h14v17H5z"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/></svg>',
  edit:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 20h4L19 9a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5z"/></svg>',
  trash:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 6.5h16M9.5 6.5V4.5h5v2M6.5 6.5 7.5 20h9l1-13.5"/></svg>',
  eye:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/></svg>',
  check:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><polyline points="5 13 10 18 19 7"/></svg>',
  plus:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  x:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>',
  empty:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3.5 8.5 12 4l8.5 4.5v7L12 20l-8.5-4.5z"/><path d="M3.5 8.5 12 13m0 0 8.5-4.5M12 13v7"/></svg>',
  art:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="8" width="34" height="30" rx="3"/><circle cx="17" cy="18" r="3.2"/><path d="M9 33l9-10 6 6 8-9 8 9"/></svg>',
  figure:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><circle cx="24" cy="13" r="5.2"/><path d="M14 39v-7a10 10 0 0 1 20 0v7"/></svg>',
  car:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 29l3-10a4 4 0 0 1 3.8-2.8h18.4a4 4 0 0 1 3.6 2.2l4.6 8.6v6a2 2 0 0 1-2 2h-3"/><path d="M6 29v4a2 2 0 0 0 2 2h3"/><circle cx="16" cy="33" r="3.6"/><circle cx="33" cy="33" r="3.6"/></svg>'
};
const PRODICON = k => (window.MPIcons ? MPIcons.get(k) : (I[k] || I.box));

const SECTIONS = [
  {group:'مدیریت فروشگاه'},
  {id:'dashboard',     title:'داشبورد',          icon:'dash'},
  {id:'products',      title:'محصولات',           icon:'box'},
  {id:'categories',    title:'دسته‌بندی‌ها',       icon:'grid'},
  {id:'orders',        title:'سفارش‌ها',          icon:'cart'},
  {group:'کاربران و محتوا'},
  {id:'users',         title:'کاربران',           icon:'users'},
  {id:'comments',      title:'نظرات',             icon:'chat', badge:'comments_pending'},
  {id:'faqs',          title:'سوالات متداول',     icon:'help'},
  {id:'announcements', title:'اطلاعیه‌ها',        icon:'bell'},
  {id:'returns',       title:'مرجوعی‌ها',         icon:'back', badge:'returns_pending'},
  {id:'cancelled',     title:'سفارش‌های لغوشده',  icon:'ban'},
  {group:'فروش و تبلیغات'},
  {id:'promotions',    title:'پروموشن‌ها',        icon:'spark'},
  {id:'coupons',       title:'کدهای تخفیف',       icon:'ticket'},
  {id:'banners',       title:'بنرهای تبلیغاتی',   icon:'image'},
  {id:'platforms',     title:'پلتفرم‌های فروش',   icon:'store'},
  {id:'channels',      title:'کانال‌های پشتیبانی', icon:'chat'},
  {group:'پیکربندی'},
  {id:'gateways',      title:'درگاه‌های پرداخت',  icon:'card'},
  {id:'transactions',  title:'تراکنش‌ها',         icon:'receipt'},
  {id:'payments',      title:'پرداخت، مالیات و مکان', icon:'coin'},
  {id:'media',         title:'مدیریت رسانه',      icon:'media'},
  {id:'terms',         title:'قوانین و مقررات',   icon:'doc'},
  {id:'sms',           title:'پنل پیامکی',        icon:'sms'},
  {id:'seo',           title:'مدیریت سئو',        icon:'globe'},
  {id:'integrations',  title:'ورود با گوگل و نمادها', icon:'plug'},
  {id:'settings',      title:'تنظیمات سایت',      icon:'gear'},
  {id:'logs',          title:'گزارش فعالیت',      icon:'log'}
];

/* ------------------------------------------------------------------ */
async function api(path, opts = {}){
  const headers = Object.assign({}, opts.headers || {});
  if(opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if(token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API + path, Object.assign({credentials:'include'}, opts, {headers}));
  const data = await res.json().catch(()=>({}));
  if(res.status === 401 || res.status === 403){ logout(true); throw new Error(data.error || 'دسترسی نداری'); }
  if(!res.ok) throw new Error(data.error || 'خطای سرور');
  return data;
}

let toastT;
function toast(msg, kind=''){
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'toast show ' + kind;
  clearTimeout(toastT);
  toastT = setTimeout(()=>el.classList.remove('show'), 2600);
}

/* ==================================================================
   ورود
================================================================== */
async function login(){
  const u = $('#lgUser').value.trim(), p = $('#lgPass').value;
  const err = $('#loginErr');
  err.classList.remove('show');
  if(!u || !p){ err.textContent = 'نام کاربری و رمز رو وارد کن.'; err.classList.add('show'); return; }
  $('#lgBtn').disabled = true;
  try{
    const r = await fetch(API + '/auth/admin/login', {
      method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
      body: JSON.stringify({username:u, password:p})
    });
    const d = await r.json();
    if(!r.ok) throw new Error(d.error || 'ورود ناموفق');
    token = d.token; me = d.user;
    localStorage.setItem(TK, token);
    boot();
  }catch(e){
    err.textContent = e.message; err.classList.add('show');
  }finally{ $('#lgBtn').disabled = false; }
}

function logout(silent){
  token = ''; me = null;
  localStorage.removeItem(TK);
  fetch(API + '/auth/logout', {method:'POST', credentials:'include'}).catch(()=>{});
  $('#shell').classList.remove('on');
  $('#loginScreen').style.display = 'flex';
  if(!silent) toast('از پنل خارج شدی');
}

/* ==================================================================
   ناوبری
================================================================== */
function renderNav(stats){
  $('#sbNav').innerHTML = SECTIONS.map(s => {
    if(s.group) return `<div class="sb-label">${esc(s.group)}</div>`;
    const n = s.badge && stats && stats[s.badge] ? `<span class="cnt">${fa(stats[s.badge])}</span>` : '';
    return `<button class="sb-link ${current===s.id?'active':''}" data-sec="${s.id}">${I[s.icon]}<span>${esc(s.title)}</span>${n}</button>`;
  }).join('');
  $$('.sb-link').forEach(b => b.onclick = () => go(b.dataset.sec));
}

function go(id){
  current = id;
  const s = SECTIONS.find(x => x.id === id);
  $('#pageTitle').textContent = s ? s.title : '';
  $$('.sb-link').forEach(b => b.classList.toggle('active', b.dataset.sec === id));
  closeSidebar();
  ({dashboard:viewDashboard, products:viewProducts, categories:viewCategories, orders:viewOrders,
    users:viewUsers, comments:viewComments, gateways:viewGateways, faqs:viewFaqs,
    announcements:viewAnnouncements, settings:viewSettings, logs:viewLogs,
    returns:viewReturns, promotions:viewPromotions, coupons:viewCoupons, banners:viewBanners,
    payments:viewPayments, seo:viewSeo, integrations:viewIntegrations,
    platforms:viewPlatforms, channels:viewChannels, sms:viewSms,
    cancelled:viewCancelled, media:viewMedia, terms:viewTerms,
    transactions:viewTransactions}[id] || viewDashboard)();
}

function closeSidebar(){ $('#sidebar').classList.remove('open'); $('#sbBackdrop').classList.remove('on'); }

/* ==================================================================
   مودال
================================================================== */
function modal(title, bodyHtml, footHtml){
  $('#modal').innerHTML = `
    <div class="modal-head"><h3>${esc(title)}</h3>
      <button class="icon-act" id="mdClose">${I.x}</button></div>
    <div class="err-line" id="mdErr"></div>
    ${bodyHtml}
    <div class="modal-foot">${footHtml || `<button class="btn btn-ghost" id="mdCancel">بستن</button>`}</div>`;
  $('#modal').classList.add('on');
  $('#overlay').classList.add('on');
  $('#mdClose').onclick = closeModal;
  const c = $('#mdCancel'); if(c) c.onclick = closeModal;
}
function closeModal(){ $('#modal').classList.remove('on'); $('#overlay').classList.remove('on'); }
function modalErr(m){ const e = $('#mdErr'); if(e){ e.textContent = m; e.classList.add('show'); } }

function confirmBox(text, onYes){
  modal('تایید عملیات', `<p style="color:var(--text-2);line-height:1.9">${esc(text)}</p>`,
    `<button class="btn btn-ghost" id="mdCancel">انصراف</button>
     <button class="btn btn-danger" id="mdYes">بله، انجام بده</button>`);
  $('#mdYes').onclick = async () => { closeModal(); await onYes(); };
}

const val = id => { const el = $('#'+id); return el ? el.value.trim() : ''; };
const chk = id => { const el = $('#'+id); return el ? el.checked : false; };

/* ==================================================================
   داشبورد
================================================================== */
async function viewDashboard(){
  $('#content').innerHTML = `<div class="card">در حال بارگذاری…</div>`;
  const s = await api('/admin/stats');
  renderNav(s);
  const max = Math.max(1, ...s.sales_7d.map(d => d.v));
  $('#content').innerHTML = `
    <div class="stat-grid">
      <div class="stat"><div class="lbl">فروش کل</div><div class="val cyan">${money(s.revenue)}</div>
        <div class="sub">از سفارش‌های پرداخت‌شده</div></div>
      <div class="stat"><div class="lbl">سفارش‌ها</div><div class="val">${num(s.orders)}</div>
        <div class="sub">${fa(s.orders_open)} سفارش باز</div></div>
      <div class="stat"><div class="lbl">محصولات</div><div class="val">${num(s.products)}</div>
        <div class="sub">${fa(s.products_active)} فعال · ${fa(s.low_stock)} رو به اتمام</div></div>
      <div class="stat"><div class="lbl">کاربران</div><div class="val">${num(s.users)}</div>
        <div class="sub">${fa(s.categories)} دسته‌بندی</div></div>
      <div class="stat"><div class="lbl">نظرات در انتظار</div>
        <div class="val ${s.comments_pending?'warn':''}">${num(s.comments_pending)}</div>
        <div class="sub">نیازمند بررسی</div></div>
    </div>

    <div class="card" style="margin-bottom:18px">
      <div class="card-head"><h3>فروش هفت روز اخیر</h3></div>
      ${s.sales_7d.length ? `
        <div class="spark">${s.sales_7d.map(d=>`<i style="height:${Math.max(4,(d.v/max)*100)}%" title="${money(d.v)}"></i>`).join('')}</div>
        <div class="spark-labels">${s.sales_7d.map(d=>`<span>${esc(d.d.slice(5))}</span>`).join('')}</div>`
        : `<div class="empty">${I.empty}<h4>هنوز سفارشی ثبت نشده</h4></div>`}
    </div>

    <div class="card">
      <div class="card-head"><h3>آخرین سفارش‌ها</h3>
        <div class="spacer"></div>
        <button class="btn btn-ghost btn-sm" id="goOrders">همه سفارش‌ها</button></div>
      ${s.recent_orders.length ? `
      <div class="table-wrap"><table>
        <thead><tr><th>کد پیگیری</th><th>مشتری</th><th>مبلغ</th><th>وضعیت</th><th>تاریخ</th></tr></thead>
        <tbody>${s.recent_orders.map(o=>`<tr>
          <td class="mono" style="color:var(--cyan);font-weight:700">${esc(o.tracking_code)}</td>
          <td>${esc(o.customer_name)}</td>
          <td>${money(o.total)}</td>
          <td><span class="tag ${statusTag(o.status)}">${esc(o.status_fa)}</span></td>
          <td class="muted">${esc(fmtDate(o.created_at))}</td>
        </tr>`).join('')}</tbody>
      </table></div>` : `<div class="empty">${I.empty}<h4>سفارشی نیست</h4></div>`}
    </div>`;
  const g = $('#goOrders'); if(g) g.onclick = () => go('orders');
}

function statusTag(st){
  return {pending:'tag-warn', paid:'tag-cyan', processing:'tag-cyan', packed:'tag-cyan',
          shipped:'tag-cyan', delivered:'tag-on', cancelled:'tag-danger', refunded:'tag-danger'}[st] || 'tag-off';
}

/* ==================================================================
   محصولات
================================================================== */
let prodState = {q:'', category:'', status:'', page:1};

async function viewProducts(){
  const c = await api('/admin/categories'); cache.categories = c.items;
  await paintProducts();
}

async function paintProducts(){
  const qs = new URLSearchParams({page:prodState.page, limit:20});
  if(prodState.q) qs.set('q', prodState.q);
  if(prodState.category) qs.set('category', prodState.category);
  if(prodState.status) qs.set('status', prodState.status);
  const r = await api('/admin/products?' + qs);

  $('#content').innerHTML = `
    <div class="filters">
      <input class="inp inp-sm" id="pQ" placeholder="جستجو در نام یا SKU" value="${esc(prodState.q)}">
      <select class="inp inp-sm" id="pCat">
        <option value="">همه دسته‌بندی‌ها</option>
        ${cache.categories.map(c=>`<option value="${c.id}" ${prodState.category==String(c.id)?'selected':''}>${esc(c.name_fa)}</option>`).join('')}
      </select>
      <select class="inp inp-sm" id="pStatus">
        <option value="">همه وضعیت‌ها</option>
        <option value="active" ${prodState.status==='active'?'selected':''}>فعال</option>
        <option value="inactive" ${prodState.status==='inactive'?'selected':''}>غیرفعال</option>
      </select>
      <span class="muted">${fa(r.total)} محصول</span>
      <button class="btn btn-primary btn-sm" id="pNew" style="margin-inline-start:auto">${I.plus} محصول جدید</button>
    </div>

    ${r.items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>محصول</th><th>دسته‌بندی</th><th>قیمت</th><th>موجودی</th><th>وضعیت</th><th></th></tr></thead>
      <tbody>${r.items.map(p=>`<tr>
        <td><div class="cell-title">
          <span class="cell-thumb">${p.image_url?`<img src="${esc(p.image_url)}">`:PRODICON(p.icon)}</span>
          <span>${esc(p.name_fa)}<br><span class="muted mono">${esc(p.sku||p.slug)}</span></span></div></td>
        <td>${esc(p.category_fa || '—')}</td>
        <td>${p.discount_price
              ? `<span style="color:var(--cyan)">${money(p.discount_price)}</span><br><span class="muted" style="text-decoration:line-through">${money(p.price)}</span>`
              : money(p.price)}</td>
        <td class="${p.stock<=2?'':''}"><span class="tag ${p.stock<=0?'tag-danger':p.stock<=2?'tag-warn':'tag-off'}">${fa(p.stock)}</span></td>
        <td>${p.is_active?'<span class="tag tag-on">فعال</span>':'<span class="tag tag-off">غیرفعال</span>'}
            ${p.is_featured?'<span class="tag tag-feat">ویژه</span>':''}</td>
        <td class="actions">
          <button class="icon-act" data-edit="${p.id}" title="ویرایش">${I.edit}</button>
          <button class="icon-act del" data-del="${p.id}" title="حذف">${I.trash}</button></td>
      </tr>`).join('')}</tbody></table></div>
      ${pager(r.pages, prodState.page, 'pProdPage')}`
    : `<div class="empty">${I.empty}<h4>محصولی پیدا نشد</h4><p>با دکمه «محصول جدید» اولین محصول رو اضافه کن.</p></div>`}`;

  $('#pNew').onclick = () => productForm(null);
  $('#pQ').oninput = debounce(e => { prodState.q = e.target.value; prodState.page=1; paintProducts(); }, 350);
  $('#pCat').onchange = e => { prodState.category = e.target.value; prodState.page=1; paintProducts(); };
  $('#pStatus').onchange = e => { prodState.status = e.target.value; prodState.page=1; paintProducts(); };
  $$('[data-edit]').forEach(b => b.onclick = () => productForm(r.items.find(x=>x.id==b.dataset.edit)));
  $$('[data-del]').forEach(b => b.onclick = () => {
    const p = r.items.find(x=>x.id==b.dataset.del);
    confirmBox(`محصول «${p.name_fa}» کامل حذف بشه؟ این کار برگشت‌پذیر نیست.`, async () => {
      try{ await api('/admin/products/'+p.id, {method:'DELETE'}); toast('محصول حذف شد','ok'); paintProducts(); }
      catch(e){ toast(e.message,'err'); }
    });
  });
  wirePager('pProdPage', n => { prodState.page = n; paintProducts(); });
}

function iconOptions(sel){
  const keys = (window.MPIcons && MPIcons.keys()) || ['box','art','figure','car'];
  return keys.map(k => `<option value="${k}" ${sel===k?'selected':''}>${(window.MPIcons?MPIcons.label(k):k)}</option>`).join('');
}

function iconPicker(id, sel){
  const all = (window.MPIcons && MPIcons.all()) || [];
  return `<div class="icon-picker" id="${id}">
    ${all.map(i => `<button type="button" class="ico-opt ${sel===i.key?'on':''}" data-ico="${i.key}" title="${esc(i.fa)}">${i.svg}</button>`).join('')}
  </div>`;
}
function wireIconPicker(id){
  const host = $('#'+id); if(!host) return;
  host.onclick = e => {
    const b = e.target.closest('[data-ico]'); if(!b) return;
    $$('.ico-opt', host).forEach(x => x.classList.toggle('on', x === b));
    host.dataset.value = b.dataset.ico;
  };
  const cur = $('.ico-opt.on', host);
  host.dataset.value = cur ? cur.dataset.ico : 'box';
}

/** نگه‌داری موقت تصویر/سایز/رنگ برای محصولی که هنوز ذخیره نشده */
const draft = { files: [], urls: [], sizes: [], colors: [] };

function productForm(p){
  const isNew = !p;
  draft.files = []; draft.urls = []; draft.sizes = []; draft.colors = [];
  modal(isNew ? 'محصول جدید' : 'ویرایش محصول', `
    <div class="ftabs" id="pTabs">
      <button class="on" data-ft="basic">اطلاعات پایه</button>
      <button data-ft="media">تصاویر</button>
      <button data-ft="opts">سایز و رنگ</button>
      <button data-ft="stock">موجودی ترکیب‌ها</button>
      <button data-ft="pc">نقاط قوت و ضعف</button>
    </div>

    <div data-fp="basic">
      <div class="form-grid">
        <div class="fld full"><label>نام فارسی *</label><input class="inp" id="fNameFa" value="${esc(p?.name_fa||'')}"></div>
        <div class="fld full"><label>نام انگلیسی</label><input class="inp" id="fNameEn" dir="ltr" value="${esc(p?.name_en||'')}"></div>
        <div class="fld"><label>دسته‌بندی</label><select class="inp" id="fCat">
          <option value="">— بدون دسته —</option>
          ${cache.categories.map(c=>`<option value="${c.id}" ${p?.category_id==c.id?'selected':''}>${esc(c.name_fa)}</option>`).join('')}
        </select></div>
        <div class="fld"><label>کد کالا (SKU)</label><input class="inp mono" id="fSku" dir="ltr" value="${esc(p?.sku||'')}"></div>
        <div class="fld"><label>قیمت (تومان) *</label><input class="inp mono" id="fPrice" type="number" dir="ltr" value="${p?.price||0}"></div>
        <div class="fld"><label>قیمت با تخفیف</label><input class="inp mono" id="fDisc" type="number" dir="ltr" value="${p?.discount_price||''}" placeholder="خالی = بدون تخفیف"></div>
        <div class="fld"><label>موجودی کل</label>
          <input class="inp mono" id="fStock" type="number" dir="ltr" value="${p?.stock??0}">
          <div class="hint" id="stockHint"></div></div>
        <div class="fld"><label>اسلاگ (آدرس)</label><input class="inp mono" id="fSlug" dir="ltr" value="${esc(p?.slug||'')}" placeholder="خودکار ساخته می‌شود"></div>
        <div class="fld full"><label>آیکون (وقتی تصویر ندارد نمایش داده می‌شود)</label>
          ${iconPicker('fIconPick', p?.icon || 'box')}</div>
        <div class="fld full"><label>توضیحات فارسی</label><textarea class="inp" id="fDescFa">${esc(p?.desc_fa||'')}</textarea></div>
        <div class="fld full"><label>توضیحات انگلیسی</label><textarea class="inp" id="fDescEn" dir="ltr">${esc(p?.desc_en||'')}</textarea></div>
        <div class="fld full" style="display:flex;gap:22px;flex-wrap:wrap;padding-top:6px">
          <label class="check"><input type="checkbox" id="fActive" ${!p||p.is_active?'checked':''}><span class="bx">${I.check}</span>فعال در سایت</label>
          <label class="check"><input type="checkbox" id="fFeat" ${p?.is_featured?'checked':''}><span class="bx">${I.check}</span>نمایش در «محصولات ویژه»</label>
          <label class="check"><input type="checkbox" id="fWar" ${!p||p.has_warranty!==0?'checked':''}><span class="bx">${I.check}</span>گارانتی اصالت</label>
        </div>
      </div>
    </div>

    <div data-fp="media" hidden>
      <div class="fld full"><label>افزودن تصویر (می‌تونی چند فایل با هم انتخاب کنی)</label>
        <input type="file" id="fFiles" accept="image/*" multiple>
        <div class="hint">حداکثر ۱۲ فایل، هرکدام تا ۵ مگابایت. اولین تصویر کاور می‌شود.
          ${isNew ? 'تصاویر بعد از ثبت محصول آپلود می‌شوند.' : ''}</div></div>
      <div class="fld full"><label>یا آدرس تصویر را دستی وارد کن</label>
        <div style="display:flex;gap:8px">
          <input class="inp" id="fImgUrl" dir="ltr" placeholder="https://…/photo.jpg">
          <button class="btn btn-ghost btn-sm" id="fAddUrl" type="button">${I.plus} افزودن</button>
        </div></div>
      <div class="gal-grid" id="fGallery"></div>
      <input type="hidden" id="fImg" value="${esc(p?.image_url||'')}">
    </div>

    <div data-fp="opts" hidden>
      ${isNew ? `<p class="hint" style="margin-bottom:14px">
        سایز و رنگ‌هایی که اینجا اضافه کنی، همراه با ثبت محصول ذخیره می‌شوند.</p>` : ''}
      <div class="opt-admin">
          <h4>سایزها</h4>
          <p class="hint">هر سایز به‌صورت یک دکمه به مشتری نشان داده می‌شود. اگر سایز تعریف کنی، انتخاب یکی از آنها برای مشتری اجباری می‌شود.</p>
          <div class="opt-add">
            <input class="inp inp-sm" id="szLabel" placeholder="مقدار — مثلاً ۵۰">
            <input class="inp inp-sm" id="szUnit" placeholder="واحد — سانتی‌متر">
            <input class="inp inp-sm mono" id="szDiff" type="number" dir="ltr" placeholder="± قیمت" value="0">
            <button class="btn btn-primary btn-sm" id="szAdd" type="button">${I.plus} افزودن سایز</button>
          </div>
          <div class="opt-list" id="szList"></div>
        </div>

        <div class="opt-admin" style="margin-top:22px">
          <h4>رنگ‌ها</h4>
          <p class="hint">کد رنگ در صفحه محصول به‌عنوان پیش‌نمایش دایره‌ای رنگی نمایش داده می‌شود.</p>
          <div class="opt-add">
            <input class="inp inp-sm" id="clLabel" placeholder="نام رنگ — مثلاً آبی نفتی">
            <div class="color-input">
              <input type="color" id="clHex" value="#2EE6F5">
              <input class="inp inp-sm mono" id="clHexTxt" dir="ltr" value="#2EE6F5" maxlength="7">
            </div>
            <input class="inp inp-sm mono" id="clDiff" type="number" dir="ltr" placeholder="± قیمت" value="0">
            <button class="btn btn-primary btn-sm" id="clAdd" type="button">${I.plus} افزودن رنگ</button>
          </div>
          <div class="opt-list" id="clList"></div>
        </div>
    </div>

    <div data-fp="stock" hidden>
      ${isNew ? `<p class="hint" style="padding:14px;background:rgba(46,230,245,.06);border-radius:12px">
        اول محصول را ذخیره کن؛ بعد از همین‌جا موجودی هر ترکیب سایز×رنگ را جدا وارد کن.</p>`
      : `<p class="hint" style="margin-bottom:12px">موجودی هر ترکیب سایز و رنگ را جداگانه وارد کن.
        موجودی کل محصول خودکار برابر مجموع این‌ها می‌شود.</p>
        <div id="vxBox"><div class="hint">در حال بارگذاری…</div></div>`}
    </div>

    <div data-fp="pc" hidden>
      <div class="form-grid">
        <div class="fld full"><label style="color:#2ED573">نقاط قوت (فارسی) — هر مورد در یک خط</label>
          <textarea class="inp" id="fProsFa" rows="4" placeholder="چاپ باکیفیت و ماندگار&#10;قاب آماده نصب">${esc(p?.pros_fa||'')}</textarea></div>
        <div class="fld full"><label style="color:#FF6B6B">نقاط ضعف (فارسی) — هر مورد در یک خط</label>
          <textarea class="inp" id="fConsFa" rows="4" placeholder="وزن نسبتاً بالا&#10;فقط سه رنگ موجوده">${esc(p?.cons_fa||'')}</textarea></div>
        <div class="fld full"><label style="color:#2ED573">نقاط قوت (انگلیسی)</label>
          <textarea class="inp" id="fProsEn" dir="ltr" rows="3">${esc(p?.pros_en||'')}</textarea></div>
        <div class="fld full"><label style="color:#FF6B6B">نقاط ضعف (انگلیسی)</label>
          <textarea class="inp" id="fConsEn" dir="ltr" rows="3">${esc(p?.cons_en||'')}</textarea></div>
        <div class="fld full"><p class="hint">اگر هر کدام از این دو بخش خالی باشد، در صفحه محصول اصلاً نمایش داده نمی‌شود.</p></div>
      </div>
    </div>`,
    `<button class="btn btn-ghost" id="mdCancel">${isNew?'انصراف':'بستن'}</button>
     <button class="btn btn-primary" id="mdSave">${isNew?'ثبت محصول':'ذخیره تغییرات'}</button>`);

  // ── تب‌ها ──
  $$('#pTabs [data-ft]').forEach(b => b.onclick = () => {
    $$('#pTabs button').forEach(x => x.classList.toggle('on', x === b));
    $$('[data-fp]').forEach(pane => pane.hidden = pane.dataset.fp !== b.dataset.ft);
  });
  wireIconPicker('fIconPick');

  if(!isNew){ loadGallery(p.id); loadOptions(p.id); loadVariants(p.id); }
  else { paintDraftGallery(); paintDraftOptions(); }

  // ── تصاویر ──
  $('#fFiles').onchange = async e => {
    const files = Array.from(e.target.files || []);
    if(!files.length) return;
    if(isNew){
      draft.files.push(...files);
      e.target.value = '';
      paintDraftGallery();
      return;
    }
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    try{
      const r = await fetch(`${API}/admin/products/${p.id}/images`, {
        method:'POST', headers:{'Authorization':'Bearer '+token}, credentials:'include', body:fd });
      const d = await r.json();
      if(!r.ok) throw new Error(d.error);
      toast(`${fa(files.length)} تصویر آپلود شد`, 'ok');
      e.target.value = '';
      loadGallery(p.id);
    }catch(err){ toast(err.message || 'آپلود ناموفق', 'err'); }
  };

  $('#fAddUrl').onclick = async () => {
    const u = val('fImgUrl');
    if(!u) return;
    if(isNew){ draft.urls.push(u); $('#fImgUrl').value=''; paintDraftGallery(); return; }
    try{
      await api(`/admin/products/${p.id}/images`, { method:'POST', body: JSON.stringify({ urls:[u] }) });
      $('#fImgUrl').value = '';
      loadGallery(p.id);
    }catch(e){ toast(e.message, 'err'); }
  };

  // ── سایز ──
  $('#szAdd').onclick = async () => {
    const label = val('szLabel');
    if(!label) return toast('مقدار سایز رو وارد کن', 'err');
    const item = { label, unit: val('szUnit'), price_diff: parseInt(val('szDiff'))||0 };
    $('#szLabel').value=''; $('#szDiff').value='0';
    if(isNew){ draft.sizes.push(item); paintDraftOptions(); return; }
    try{
      await api(`/admin/products/${p.id}/options`, {method:'POST', body: JSON.stringify({kind:'size', ...item})});
      loadOptions(p.id); loadVariants(p.id);
    }catch(e){ toast(e.message, 'err'); }
  };

  // ── رنگ ──
  const sync = (a,b) => { $('#'+a).oninput = () => { $('#'+b).value = $('#'+a).value; }; };
  sync('clHex','clHexTxt'); sync('clHexTxt','clHex');
  $('#clAdd').onclick = async () => {
    const label = val('clLabel'), hex = val('clHexTxt');
    if(!label) return toast('نام رنگ رو وارد کن', 'err');
    if(!/^#[0-9a-fA-F]{6}$/.test(hex)) return toast('کد رنگ باید مثل ‎#1E90FF باشه', 'err');
    const item = { label, color_hex: hex, price_diff: parseInt(val('clDiff'))||0 };
    $('#clLabel').value=''; $('#clDiff').value='0';
    if(isNew){ draft.colors.push(item); paintDraftOptions(); return; }
    try{
      await api(`/admin/products/${p.id}/options`, {method:'POST', body: JSON.stringify({kind:'color', ...item})});
      loadOptions(p.id); loadVariants(p.id);
    }catch(e){ toast(e.message, 'err'); }
  };

  $('#mdSave').onclick = async () => {
    const body = {
      name_fa: val('fNameFa'), name_en: val('fNameEn'),
      slug: val('fSlug') || undefined,
      category_id: val('fCat') ? parseInt(val('fCat')) : null,
      sku: val('fSku') || null,
      price: parseInt(val('fPrice')) || 0,
      discount_price: val('fDisc') ? parseInt(val('fDisc')) : null,
      stock: parseInt(val('fStock')) || 0,
      icon: ($('#fIconPick') && $('#fIconPick').dataset.value) || 'box',
      image_url: val('fImg') || null,
      desc_fa: val('fDescFa'), desc_en: val('fDescEn'),
      pros_fa: val('fProsFa'), cons_fa: val('fConsFa'),
      pros_en: val('fProsEn'), cons_en: val('fConsEn'),
      is_active: chk('fActive'), is_featured: chk('fFeat'), has_warranty: chk('fWar')
    };
    if(!body.name_fa) return modalErr('نام فارسی محصول لازمه.');
    if(body.discount_price && body.discount_price >= body.price) return modalErr('قیمت با تخفیف باید کمتر از قیمت اصلی باشه.');
    try{
      const r = await api(isNew ? '/admin/products' : '/admin/products/'+p.id,
        {method: isNew?'POST':'PUT', body: JSON.stringify(body)});

      if(isNew && r.item){
        const pid = r.item.id;
        try{ await flushDraft(pid); }
        catch(err){ toast('محصول ثبت شد ولی بخشی از تصاویر/تنوع ذخیره نشد: ' + err.message, 'err'); }
      }

      toast(isNew ? 'محصول ثبت شد' : 'تغییرات ذخیره شد', 'ok');
      closeModal();
      paintProducts();
    }catch(e){ modalErr(e.message); }
  };
}

/* ---------- پیش‌نویس محصول جدید ---------- */
function paintDraftGallery(){
  const host = $('#fGallery'); if(!host) return;
  const all = [...draft.files.map((f,i) => ({kind:'file', i, name:f.name, url:URL.createObjectURL(f)})),
               ...draft.urls.map((u,i) => ({kind:'url', i, name:u, url:u}))];
  host.innerHTML = all.length ? all.map(x => `
    <div class="gal-item">
      <img src="${esc(x.url)}" alt="">
      <div class="gal-acts"><button type="button" class="del" data-dk="${x.kind}" data-di="${x.i}">${I.trash}</button></div>
      ${x.kind==='file' ? '<span class="gal-badge">آپلود می‌شود</span>' : ''}
    </div>`).join('')
    : '<div class="hint" style="grid-column:1/-1">هنوز تصویری اضافه نشده.</div>';

  $$('[data-dk]', host).forEach(b => b.onclick = () => {
    const i = parseInt(b.dataset.di);
    if(b.dataset.dk === 'file') draft.files.splice(i,1); else draft.urls.splice(i,1);
    paintDraftGallery();
  });
}

function paintDraftOptions(){
  const sz = $('#szList'), cl = $('#clList');
  if(!sz || !cl) return;
  sz.innerHTML = draft.sizes.length ? draft.sizes.map((o,i) => `
    <div class="opt-chip"><b>${esc(o.label)}</b>${o.unit?`<small>${esc(o.unit)}</small>`:''}
      ${o.price_diff?`<span class="diff">${o.price_diff>0?'+':''}${fa(o.price_diff.toLocaleString('en-US'))}</span>`:''}
      <button type="button" data-dsz="${i}">${I.x}</button></div>`).join('')
    : '<div class="hint">سایزی اضافه نشده — محصول بدون انتخاب سایز فروخته می‌شود.</div>';
  cl.innerHTML = draft.colors.length ? draft.colors.map((o,i) => `
    <div class="opt-chip"><span class="sw" style="background:${esc(o.color_hex)}"></span>
      <b>${esc(o.label)}</b><small class="mono">${esc(o.color_hex)}</small>
      ${o.price_diff?`<span class="diff">${o.price_diff>0?'+':''}${fa(o.price_diff.toLocaleString('en-US'))}</span>`:''}
      <button type="button" data-dcl="${i}">${I.x}</button></div>`).join('')
    : '<div class="hint">رنگی اضافه نشده — محصول بدون انتخاب رنگ فروخته می‌شود.</div>';

  $$('[data-dsz]').forEach(b => b.onclick = () => { draft.sizes.splice(parseInt(b.dataset.dsz),1); paintDraftOptions(); });
  $$('[data-dcl]').forEach(b => b.onclick = () => { draft.colors.splice(parseInt(b.dataset.dcl),1); paintDraftOptions(); });
}

/** پیش‌نویس را روی محصول تازه‌ساخته‌شده ذخیره می‌کند */
async function flushDraft(pid){
  if(draft.files.length){
    const fd = new FormData();
    draft.files.forEach(f => fd.append('files', f));
    const r = await fetch(`${API}/admin/products/${pid}/images`, {
      method:'POST', headers:{'Authorization':'Bearer '+token}, credentials:'include', body:fd });
    if(!r.ok) throw new Error((await r.json().catch(()=>({}))).error || 'آپلود تصویر ناموفق');
  }
  if(draft.urls.length){
    await api(`/admin/products/${pid}/images`, {method:'POST', body: JSON.stringify({urls: draft.urls})});
  }
  for(const o of draft.sizes){
    await api(`/admin/products/${pid}/options`, {method:'POST', body: JSON.stringify({kind:'size', ...o})});
  }
  for(const o of draft.colors){
    await api(`/admin/products/${pid}/options`, {method:'POST', body: JSON.stringify({kind:'color', ...o})});
  }
  draft.files = []; draft.urls = []; draft.sizes = []; draft.colors = [];
}

/* ---------- گالری تصاویر ---------- */
async function loadGallery(pid){
  const host = $('#fGallery'); if(!host) return;
  try{
    const r = await api(`/admin/products/${pid}/images`);
    const cover = val('fImg');
    host.innerHTML = r.items.length ? r.items.map(im => `
      <div class="gal-item ${im.url===cover?'cover':''}">
        <img src="${esc(im.url)}" alt="">
        <div class="gal-acts">
          <button type="button" data-cover="${im.id}" data-url="${esc(im.url)}" title="کاور">${I.check}</button>
          <button type="button" class="del" data-delimg="${im.id}" title="حذف">${I.trash}</button>
        </div>
        ${im.url===cover ? '<span class="gal-badge">کاور</span>' : ''}
      </div>`).join('')
      : `<div class="hint" style="grid-column:1/-1">هنوز تصویری اضافه نشده.</div>`;

    $$('[data-cover]', host).forEach(b => b.onclick = async () => {
      await api(`/admin/products/${pid}/images/${b.dataset.cover}/cover`, {method:'PATCH'});
      $('#fImg').value = b.dataset.url;
      toast('کاور تغییر کرد','ok'); loadGallery(pid); paintProducts();
    });
    $$('[data-delimg]', host).forEach(b => b.onclick = async () => {
      await api(`/admin/products/${pid}/images/${b.dataset.delimg}`, {method:'DELETE'});
      toast('تصویر حذف شد','ok'); loadGallery(pid); paintProducts();
    });
  }catch(e){ host.innerHTML = `<div class="hint">${esc(e.message)}</div>`; }
}

/** انتخاب تصویر برای یک رنگ از میان گالری محصول */
function pickColorImage(pid, opt, gallery){
  if(!gallery.length){
    return toast('اول از تب «تصاویر» چند عکس برای این محصول آپلود کن', 'warn');
  }
  modal(`تصویر رنگ «${opt.label}»`, `
    <p class="hint" style="margin-bottom:14px">
      وقتی مشتری این رنگ رو انتخاب کنه، گالری صفحه محصول روی همین عکس می‌ره.</p>
    <div class="gal-grid pick-grid">
      <button type="button" class="gal-item none ${opt.image_url?'':'on'}" data-cimg="">
        <span>${I.x}<br>بدون تصویر</span></button>
      ${gallery.map(im => `
        <button type="button" class="gal-item ${opt.image_url===im.url?'on':''}" data-cimg="${esc(im.url)}">
          <img src="${esc(im.url)}" alt="">
        </button>`).join('')}
    </div>`,
    `<button class="btn btn-ghost" id="mdCancel">انصراف</button>`);

  $$('[data-cimg]').forEach(b => b.onclick = async () => {
    try{
      await api('/admin/options/' + opt.id, {method:'PUT',
        body: JSON.stringify({ image_url: b.dataset.cimg || null })});
      closeModal();
      toast(b.dataset.cimg ? 'تصویر رنگ ثبت شد' : 'تصویر رنگ برداشته شد', 'ok');
      loadOptions(pid);
    }catch(e){ modalErr(e.message); }
  });
}

/* ---------- ماتریس موجودی ترکیب‌ها ---------- */
async function loadVariants(pid){
  const box = $('#vxBox');
  if(!box) return;
  try{
    const r = await api(`/admin/products/${pid}/variants`);
    const hint = $('#stockHint');
    const fStock = $('#fStock');

    if(!r.has_variants){
      box.innerHTML = `<div class="hint">این محصول سایز یا رنگ ندارد؛ موجودی از فیلد «موجودی کل» در تب اطلاعات پایه خوانده می‌شود.</div>`;
      if(hint) hint.textContent = '';
      if(fStock) fStock.disabled = false;
      return;
    }
    if(hint) hint.textContent = 'خودکار از مجموع ترکیب‌ها محاسبه می‌شود';
    if(fStock){ fStock.disabled = true; fStock.value = r.product_stock; }

    const val = (sid, cid) => {
      const v = r.variants.find(x => (x.size_id ?? null) === (sid ?? null) && (x.color_id ?? null) === (cid ?? null));
      return v || null;
    };
    const S = r.sizes.length ? r.sizes : [null];
    const C = r.colors.length ? r.colors : [null];

    box.innerHTML = `
      <div class="vx-wrap"><table class="vx">
        <thead><tr><th></th>
          ${C.map(c => `<th>${c ? `<span class="vx-c"><i style="background:${esc(c.color_hex||'#888')}"></i>${esc(c.label)}</span>` : '—'}</th>`).join('')}
          <th class="vx-sum">جمع</th></tr></thead>
        <tbody>
          ${S.map(sz => `<tr>
            <th>${sz ? esc(sz.label + (sz.unit ? ' ' + sz.unit : '')) : '—'}</th>
            ${C.map(c => { const v = val(sz?sz.id:null, c?c.id:null);
              return `<td>${v ? `<input class="vx-in" type="number" min="0" dir="ltr"
                data-vid="${v.id}" value="${v.stock}">` : '—'}</td>`; }).join('')}
            <td class="vx-sum" data-rowsum="${sz?sz.id:'n'}">0</td></tr>`).join('')}
        </tbody>
        <tfoot><tr><th>جمع</th>
          ${C.map(c => `<td class="vx-sum" data-colsum="${c?c.id:'n'}">0</td>`).join('')}
          <td class="vx-sum vx-total" id="vxTotal">0</td></tr></tfoot>
      </table></div>
      <div class="vx-bar">
        <button class="btn btn-ghost btn-sm" type="button" id="vxFill">پر کردن همه با یک عدد</button>
        <button class="btn btn-primary btn-sm" type="button" id="vxSave">ذخیره موجودی‌ها</button>
      </div>`;

    const recalc = () => {
      let total = 0;
      const colTotals = {};
      S.forEach(sz => {
        let rowSum = 0;
        C.forEach(c => {
          const v = val(sz?sz.id:null, c?c.id:null);
          if(!v) return;
          const inp = box.querySelector(`[data-vid="${v.id}"]`);
          const n = parseInt(inp.value) || 0;
          rowSum += n;
          const ck = c ? c.id : 'n';
          colTotals[ck] = (colTotals[ck] || 0) + n;
          inp.classList.toggle('zero', n === 0);
        });
        const cell = box.querySelector(`[data-rowsum="${sz?sz.id:'n'}"]`);
        if(cell) cell.textContent = fa(rowSum);
        total += rowSum;
      });
      Object.entries(colTotals).forEach(([k, v]) => {
        const cell = box.querySelector(`[data-colsum="${k}"]`);
        if(cell) cell.textContent = fa(v);
      });
      $('#vxTotal').textContent = fa(total);
      if(fStock) fStock.value = total;
    };

    $$('.vx-in', box).forEach(i => i.oninput = recalc);
    recalc();

    $('#vxFill').onclick = () => {
      const n = prompt('موجودی همه ترکیب‌ها چند باشد؟', '5');
      if(n === null) return;
      $$('.vx-in', box).forEach(i => i.value = Math.max(0, parseInt(n) || 0));
      recalc();
    };
    $('#vxSave').onclick = async () => {
      const rows = $$('.vx-in', box).map(i => ({ id: parseInt(i.dataset.vid), stock: parseInt(i.value) || 0 }));
      try{
        const res = await api(`/admin/products/${pid}/variants`, {method:'PUT', body: JSON.stringify({variants: rows})});
        toast(`موجودی ذخیره شد — مجموع ${fa(res.product_stock)}`, 'ok');
        if(fStock) fStock.value = res.product_stock;
        paintProducts();
      }catch(e){ toast(e.message, 'err'); }
    };
  }catch(e){ box.innerHTML = `<div class="hint">${esc(e.message)}</div>`; }
}

/* ---------- سایز و رنگ ---------- */
async function loadOptions(pid){
  const sz = $('#szList'), cl = $('#clList');
  if(!sz || !cl) return;
  try{
    const r = await api(`/admin/products/${pid}/options`);
    sz.innerHTML = r.sizes.length ? r.sizes.map(o => `
      <div class="opt-chip">
        <b>${esc(o.label)}</b>${o.unit ? `<small>${esc(o.unit)}</small>` : ''}
        ${o.price_diff ? `<span class="diff">${o.price_diff>0?'+':''}${fa(o.price_diff.toLocaleString('en-US'))}</span>` : ''}
        <button type="button" data-delopt="${o.id}">${I.x}</button>
      </div>`).join('') : '<div class="hint">سایزی تعریف نشده — محصول بدون انتخاب سایز فروخته می‌شود.</div>';

    const gallery = r.images || [];
    cl.innerHTML = r.colors.length ? r.colors.map(o => `
      <div class="opt-chip color-chip">
        <span class="sw" style="background:${esc(o.color_hex||'#888')}"></span>
        <b>${esc(o.label)}</b><small class="mono">${esc(o.color_hex||'')}</small>
        ${o.price_diff ? `<span class="diff">${o.price_diff>0?'+':''}${fa(o.price_diff.toLocaleString('en-US'))}</span>` : ''}
        <button type="button" class="pick-img ${o.image_url?'has':''}" data-pickimg="${o.id}"
          title="${o.image_url ? 'تغییر تصویر این رنگ' : 'انتخاب تصویر برای این رنگ'}">
          ${o.image_url ? `<img src="${esc(o.image_url)}" alt="">` : I.image}
        </button>
        <button type="button" data-delopt="${o.id}">${I.x}</button>
      </div>`).join('') : '<div class="hint">رنگی تعریف نشده — محصول بدون انتخاب رنگ فروخته می‌شود.</div>';

    if(r.colors.length){
      cl.insertAdjacentHTML('beforeend',
        `<div class="hint" style="width:100%;margin-top:8px">
          روی مربع تصویر کنار هر رنگ بزن تا مشخص کنی با انتخاب اون رنگ کدوم عکس به مشتری نشون داده بشه.
          ${gallery.length ? '' : '<b>اول از تب «تصاویر» چند عکس آپلود کن.</b>'}</div>`);
    }

    $$('[data-pickimg]', cl).forEach(b => b.onclick = () => {
      const o = r.colors.find(x => x.id == b.dataset.pickimg);
      pickColorImage(pid, o, gallery);
    });

    $$('[data-delopt]').forEach(b => b.onclick = async () => {
      await api('/admin/options/' + b.dataset.delopt, {method:'DELETE'});
      loadOptions(pid); loadVariants(pid);
    });
  }catch(e){ sz.innerHTML = `<div class="hint">${esc(e.message)}</div>`; }
}

/* ==================================================================
   دسته‌بندی‌ها
================================================================== */
async function viewCategories(){
  const r = await api('/admin/categories');
  cache.categories = r.items;
  $('#content').innerHTML = `
    <div class="filters">
      <span class="muted">${fa(r.items.length)} دسته‌بندی</span>
      <button class="btn btn-primary btn-sm" id="cNew" style="margin-inline-start:auto">${I.plus} دسته‌بندی جدید</button>
    </div>
    ${r.items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>دسته‌بندی</th><th>اسلاگ</th><th>تعداد محصول</th><th>ترتیب</th><th>وضعیت</th><th></th></tr></thead>
      <tbody>${r.items.map(c=>`<tr>
        <td><div class="cell-title"><span class="cell-thumb">${PRODICON(c.icon)}</span>
          <span>${esc(c.name_fa)}<br><span class="muted">${esc(c.name_en||'—')}</span></span></div></td>
        <td class="mono muted">${esc(c.slug)}</td>
        <td>${fa(c.product_count)}</td>
        <td>${fa(c.sort_order)}</td>
        <td>${c.is_active?'<span class="tag tag-on">فعال</span>':'<span class="tag tag-off">غیرفعال</span>'}</td>
        <td class="actions">
          <button class="icon-act" data-edit="${c.id}">${I.edit}</button>
          <button class="icon-act del" data-del="${c.id}">${I.trash}</button></td>
      </tr>`).join('')}</tbody></table></div>`
    : `<div class="empty">${I.empty}<h4>دسته‌بندی‌ای نیست</h4></div>`}`;

  $('#cNew').onclick = () => categoryForm(null);
  $$('[data-edit]').forEach(b => b.onclick = () => categoryForm(r.items.find(x=>x.id==b.dataset.edit)));
  $$('[data-del]').forEach(b => b.onclick = () => {
    const c = r.items.find(x=>x.id==b.dataset.del);
    confirmBox(`دسته‌بندی «${c.name_fa}» حذف بشه؟`, async () => {
      try{ await api('/admin/categories/'+c.id, {method:'DELETE'}); toast('حذف شد','ok'); viewCategories(); }
      catch(e){ toast(e.message,'err'); }
    });
  });
}

function categoryForm(c){
  const isNew = !c;
  modal(isNew?'دسته‌بندی جدید':'ویرایش دسته‌بندی', `
    <div class="form-grid">
      <div class="fld"><label>نام فارسی *</label><input class="inp" id="cNameFa" value="${esc(c?.name_fa||'')}"></div>
      <div class="fld"><label>نام انگلیسی</label><input class="inp" id="cNameEn" dir="ltr" value="${esc(c?.name_en||'')}"></div>
      <div class="fld"><label>اسلاگ (آدرس)</label><input class="inp mono" id="cSlug" dir="ltr" value="${esc(c?.slug||'')}" placeholder="wall-art"></div>
      <div class="fld full"><label>آیکون</label>${iconPicker('cIconPick', c?.icon || 'box')}</div>
      <div class="fld"><label>ترتیب نمایش</label><input class="inp mono" id="cSort" type="number" dir="ltr" value="${c?.sort_order??0}"></div>
      <div class="fld" style="display:flex;align-items:flex-end;padding-bottom:6px">
        <label class="check"><input type="checkbox" id="cActive" ${!c||c.is_active?'checked':''}><span class="bx">${I.check}</span>فعال</label></div>
      <div class="fld full"><label>توضیح فارسی</label><textarea class="inp" id="cDescFa">${esc(c?.desc_fa||'')}</textarea></div>
      <div class="fld full"><label>توضیح انگلیسی</label><textarea class="inp" id="cDescEn" dir="ltr">${esc(c?.desc_en||'')}</textarea></div>
    </div>`,
    `<button class="btn btn-ghost" id="mdCancel">انصراف</button>
     <button class="btn btn-primary" id="mdSave">${isNew?'ثبت':'ذخیره'}</button>`);

  wireIconPicker('cIconPick');

  $('#mdSave').onclick = async () => {
    const body = {name_fa:val('cNameFa'), name_en:val('cNameEn'), slug:val('cSlug'),
      icon: ($('#cIconPick') && $('#cIconPick').dataset.value) || 'box', sort_order:parseInt(val('cSort'))||0, is_active:chk('cActive'),
      desc_fa:val('cDescFa'), desc_en:val('cDescEn')};
    if(!body.name_fa) return modalErr('نام فارسی لازمه.');
    try{
      await api(isNew?'/admin/categories':'/admin/categories/'+c.id, {method:isNew?'POST':'PUT', body:JSON.stringify(body)});
      closeModal(); toast('ذخیره شد','ok'); viewCategories();
    }catch(e){ modalErr(e.message); }
  };
}

/* ==================================================================
   سفارش‌ها
================================================================== */
let orderState = {q:'', status:'all', page:1};

async function viewOrders(){
  const qs = new URLSearchParams({page:orderState.page, limit:20, status:orderState.status});
  if(orderState.q) qs.set('q', orderState.q);
  const r = await api('/admin/orders?' + qs);
  cache.statuses = r.statuses; cache.statusLabels = r.status_labels;

  $('#content').innerHTML = `
    <div class="filters">
      <input class="inp inp-sm" id="oQ" placeholder="کد پیگیری، نام یا موبایل" value="${esc(orderState.q)}">
      <select class="inp inp-sm" id="oStatus">
        <option value="all">همه وضعیت‌ها</option>
        ${r.statuses.map(s=>`<option value="${s}" ${orderState.status===s?'selected':''}>${esc(r.status_labels[s])}</option>`).join('')}
      </select>
      <span class="muted">${fa(r.total)} سفارش</span>
    </div>
    ${r.items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>کد پیگیری</th><th>مشتری</th><th>مبلغ</th><th>پرداخت</th><th>وضعیت</th><th>تاریخ</th><th></th></tr></thead>
      <tbody>${r.items.map(o=>`<tr>
        <td class="mono" style="color:var(--cyan);font-weight:700">${esc(o.tracking_code)}</td>
        <td>${esc(o.customer_name)}<br><span class="muted mono">${esc(o.phone)}</span></td>
        <td>${money(o.total)}</td>
        <td><span class="tag ${o.payment_status==='paid'?'tag-on':'tag-off'}">${o.payment_status==='paid'?'پرداخت شده':'پرداخت نشده'}</span></td>
        <td><span class="tag ${statusTag(o.status)}">${esc(o.status_fa)}</span></td>
        <td class="muted">${esc(fmtDate(o.created_at))}</td>
        <td class="actions">
          <button class="icon-act" data-view="${o.id}" title="مدیریت">${I.eye}</button>
          <button class="icon-act del" data-del="${o.id}">${I.trash}</button></td>
      </tr>`).join('')}</tbody></table></div>
      ${pager(r.pages, orderState.page, 'oPage')}`
    : `<div class="empty">${I.empty}<h4>سفارشی پیدا نشد</h4></div>`}`;

  $('#oQ').oninput = debounce(e => { orderState.q = e.target.value; orderState.page=1; viewOrders(); }, 350);
  $('#oStatus').onchange = e => { orderState.status = e.target.value; orderState.page=1; viewOrders(); };
  $$('[data-view]').forEach(b => b.onclick = () => orderDetail(b.dataset.view));
  $$('[data-del]').forEach(b => b.onclick = () => confirmBox('این سفارش کامل حذف بشه؟', async () => {
    try{ await api('/admin/orders/'+b.dataset.del, {method:'DELETE'}); toast('حذف شد','ok'); viewOrders(); }
    catch(e){ toast(e.message,'err'); }
  }));
  wirePager('oPage', n => { orderState.page = n; viewOrders(); });
}

async function orderDetail(id){
  const d = await api('/admin/orders/' + id);
  const o = d.order;
  modal('سفارش ' + o.tracking_code, `
    <div class="stat-grid" style="margin-bottom:16px">
      <div class="stat"><div class="lbl">مشتری</div><div class="val" style="font-size:1rem">${esc(o.customer_name)}</div>
        <div class="sub mono">${esc(o.phone)}</div></div>
      <div class="stat"><div class="lbl">مبلغ کل</div><div class="val cyan" style="font-size:1.1rem">${money(o.total)}</div>
        <div class="sub">ارسال: ${money(o.shipping_cost)}</div></div>
    </div>

    <div class="fld" style="margin-bottom:14px"><label>آدرس</label>
      <div class="inp" style="min-height:auto">${esc([o.province,o.city,o.address,o.postal_code].filter(Boolean).join('، ') || '—')}</div></div>
    ${o.note ? `<div class="fld" style="margin-bottom:14px"><label>یادداشت مشتری</label><div class="inp">${esc(o.note)}</div></div>` : ''}

    ${o.status === 'cancelled' ? `
    <div class="cancel-info">
      <span class="ci-head">${I.ban}<b>اطلاعات لغو سفارش</b>
        <span class="tag ${o.cancelled_by==='customer'?'tag-warn':'tag-off'}">
          ${o.cancelled_by==='customer'?'لغو توسط مشتری':'لغو توسط فروشگاه'}</span></span>
      <div class="form-grid">
        ${o.cancel_reason ? `<div class="fld full"><label>دلیل</label>
          <div class="inp">${esc(o.cancel_reason)}</div></div>` : ''}
        <div class="fld"><label>آیدی تلگرام</label>
          ${o.cancel_telegram
            ? `<a class="inp tg-inp" dir="ltr" href="https://t.me/${esc(o.cancel_telegram)}"
                 target="_blank" rel="noopener">@${esc(o.cancel_telegram)} ↗</a>`
            : `<div class="inp muted">ثبت نشده</div>`}</div>
        <div class="fld"><label>نام صاحب کارت</label>
          <div class="inp">${esc(o.cancel_holder || '—')}</div></div>
        <div class="fld full"><label>شماره کارت برای بازگشت وجه</label>
          ${o.cancel_card
            ? `<div class="inp mono card-no" dir="ltr">${esc(fmtCard(o.cancel_card))}
                 <button class="copy-card" data-card="${esc(o.cancel_card)}" type="button">کپی</button></div>`
            : `<div class="inp muted">${o.payment_status==='paid'?'ثبت نشده — با مشتری تماس بگیر':'پرداختی نداشته'}</div>`}</div>
      </div>
    </div>` : ''}

    <div class="fld"><label>اقلام سفارش</label>
      <div class="table-wrap"><table style="min-width:auto"><tbody>
        ${d.items.map(i=>`<tr><td>${esc(i.title_snapshot)}</td><td class="mono">×${fa(i.qty)}</td>
          <td style="text-align:end">${money(i.unit_price*i.qty)}</td></tr>`).join('')}
      </tbody></table></div></div>

    <label style="display:block;font-size:.77rem;color:var(--text-2);margin:18px 0 0;font-weight:600">تغییر وضعیت سفارش</label>
    <div class="status-flow" id="stFlow">
      ${cache.statuses.map(s=>`<button class="status-opt ${o.status===s?'active':''}" data-st="${s}">${esc(cache.statusLabels[s])}</button>`).join('')}
    </div>
    <div class="form-grid">
      <div class="fld"><label>وضعیت پرداخت</label><select class="inp" id="oPay">
        ${['unpaid','paid','failed','refunded'].map(p=>`<option value="${p}" ${o.payment_status===p?'selected':''}>${({unpaid:'پرداخت نشده',paid:'پرداخت شده',failed:'ناموفق',refunded:'مرجوع شده'})[p]}</option>`).join('')}
      </select></div>
      <div class="fld"><label>کد رهگیری پست</label><input class="inp mono" id="oPost" dir="ltr" value="${esc(o.tracking_post||'')}"></div>
      <div class="fld full"><label>یادداشت (برای مشتری در صفحه پیگیری دیده می‌شود)</label>
        <input class="inp" id="oNote" placeholder="مثلاً: بسته تحویل پست شد"></div>
    </div>

    <label style="display:block;font-size:.77rem;color:var(--text-2);margin:18px 0 0;font-weight:600">تاریخچه</label>
    <div class="hist">${d.history.slice().reverse().map(h=>`
      <div class="hist-item"><b>${esc(h.status_fa)}</b>${h.note?` — ${esc(h.note)}`:''}
        <br><span class="when">${esc(fmtDate(h.created_at))}</span></div>`).join('')}</div>`,
    `<button class="btn btn-ghost" id="mdCancel">بستن</button>
     <button class="btn btn-primary" id="mdSave">ذخیره وضعیت</button>`);

  const cc = $('.copy-card');
  if(cc) cc.onclick = async () => {
    try{ await navigator.clipboard.writeText(cc.dataset.card); toast('شماره کارت کپی شد','ok'); }
    catch(_){ toast(cc.dataset.card); }
  };

  let picked = o.status;
  $$('#stFlow .status-opt').forEach(b => b.onclick = () => {
    picked = b.dataset.st;
    $$('#stFlow .status-opt').forEach(x => x.classList.toggle('active', x === b));
  });
  $('#mdSave').onclick = async () => {
    try{
      await api(`/admin/orders/${o.id}/status`, {method:'PATCH', body: JSON.stringify({
        status: picked, note: val('oNote'), payment_status: val('oPay'), tracking_post: val('oPost')
      })});
      closeModal(); toast('وضعیت سفارش به‌روز شد','ok'); viewOrders();
    }catch(e){ modalErr(e.message); }
  };
}

/* ==================================================================
   کاربران
================================================================== */
let userState = {q:'', role:'', page:1};

async function viewUsers(){
  const qs = new URLSearchParams({page:userState.page, limit:20});
  if(userState.q) qs.set('q', userState.q);
  if(userState.role) qs.set('role', userState.role);
  const r = await api('/admin/users?' + qs);

  $('#content').innerHTML = `
    <div class="filters">
      <input class="inp inp-sm" id="uQ" placeholder="نام، موبایل یا ایمیل" value="${esc(userState.q)}">
      <select class="inp inp-sm" id="uRole">
        <option value="">همه نقش‌ها</option>
        <option value="customer" ${userState.role==='customer'?'selected':''}>مشتری</option>
        <option value="admin" ${userState.role==='admin'?'selected':''}>مدیر</option>
      </select>
      <span class="muted">${fa(r.total)} کاربر</span>
      <button class="btn btn-primary btn-sm" id="uNew" style="margin-inline-start:auto">${I.plus} کاربر جدید</button>
    </div>
    ${r.items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>کاربر</th><th>موبایل</th><th>نقش</th><th>سفارش‌ها</th><th>آخرین ورود</th><th>وضعیت</th><th></th></tr></thead>
      <tbody>${r.items.map(u=>`<tr>
        <td><b>${esc((u.first_name+' '+u.last_name).trim() || '—')}</b>${u.email?`<br><span class="muted mono">${esc(u.email)}</span>`:''}</td>
        <td class="mono">${esc(u.phone||'—')}</td>
        <td>${u.role==='admin'?'<span class="tag tag-cyan">مدیر</span>':'<span class="tag tag-off">مشتری</span>'}</td>
        <td>${fa(u.order_count)}</td>
        <td class="muted">${esc(fmtDate(u.last_login_at))}</td>
        <td>${u.is_banned?'<span class="tag tag-danger">مسدود</span>':(u.is_active?'<span class="tag tag-on">فعال</span>':'<span class="tag tag-off">غیرفعال</span>')}</td>
        <td class="actions">
          <button class="icon-act" data-edit="${u.id}">${I.edit}</button>
          <button class="icon-act del" data-del="${u.id}">${I.trash}</button></td>
      </tr>`).join('')}</tbody></table></div>
      ${pager(r.pages, userState.page, 'uPage')}`
    : `<div class="empty">${I.empty}<h4>کاربری پیدا نشد</h4></div>`}`;

  $('#uQ').oninput = debounce(e => { userState.q = e.target.value; userState.page=1; viewUsers(); }, 350);
  $('#uRole').onchange = e => { userState.role = e.target.value; userState.page=1; viewUsers(); };
  $('#uNew').onclick = () => userForm(null);
  $$('[data-edit]').forEach(b => b.onclick = () => userForm(r.items.find(x=>x.id==b.dataset.edit)));
  $$('[data-del]').forEach(b => b.onclick = () => confirmBox('این کاربر حذف بشه؟', async () => {
    try{ await api('/admin/users/'+b.dataset.del, {method:'DELETE'}); toast('حذف شد','ok'); viewUsers(); }
    catch(e){ toast(e.message,'err'); }
  }));
  wirePager('uPage', n => { userState.page = n; viewUsers(); });
}

function userForm(u){
  const isNew = !u;
  modal(isNew?'کاربر جدید':'ویرایش کاربر', `
    <div class="form-grid">
      <div class="fld"><label>نام</label><input class="inp" id="uFirst" value="${esc(u?.first_name||'')}"></div>
      <div class="fld"><label>نام خانوادگی</label><input class="inp" id="uLast" value="${esc(u?.last_name||'')}"></div>
      <div class="fld"><label>موبایل</label><input class="inp mono" id="uPhone" dir="ltr" value="${esc(u?.phone||'')}" placeholder="09123456789"></div>
      <div class="fld"><label>ایمیل</label><input class="inp mono" id="uEmail" dir="ltr" value="${esc(u?.email||'')}"></div>
      <div class="fld"><label>نقش</label><select class="inp" id="uRoleF">
        <option value="customer" ${u?.role!=='admin'?'selected':''}>مشتری</option>
        <option value="admin" ${u?.role==='admin'?'selected':''}>مدیر (دسترسی کامل)</option>
      </select></div>
      <div class="fld"><label>نام کاربری (فقط مدیر)</label><input class="inp mono" id="uUsername" dir="ltr" value="${esc(u?.username||'')}"></div>
      <div class="fld full"><label>رمز عبور ${isNew?'':'جدید'}</label><input class="inp" id="uPass" type="password" placeholder="${isNew?'برای حساب مدیر لازمه':'خالی بذار تا تغییر نکنه'}">
        <div class="hint">رمز فقط برای حساب مدیر استفاده می‌شود. مشتری‌ها با کد پیامکی وارد می‌شوند.</div></div>
      <div class="fld full" style="display:flex;gap:22px;flex-wrap:wrap">
        <label class="check"><input type="checkbox" id="uActive" ${!u||u.is_active?'checked':''}><span class="bx">${I.check}</span>فعال</label>
        <label class="check"><input type="checkbox" id="uBanned" ${u?.is_banned?'checked':''}><span class="bx">${I.check}</span>مسدود</label>
      </div>
    </div>`,
    `<button class="btn btn-ghost" id="mdCancel">انصراف</button>
     <button class="btn btn-primary" id="mdSave">${isNew?'ثبت':'ذخیره'}</button>`);

  $('#mdSave').onclick = async () => {
    const body = {first_name:val('uFirst'), last_name:val('uLast'), phone:val('uPhone')||null,
      email:val('uEmail')||null, role:val('uRoleF'), username:val('uUsername')||null,
      is_active:chk('uActive'), is_banned:chk('uBanned')};
    if(val('uPass')) body.password = val('uPass');
    if(body.role === 'admin' && isNew && !body.password) return modalErr('برای حساب مدیر رمز عبور لازمه.');
    try{
      await api(isNew?'/admin/users':'/admin/users/'+u.id, {method:isNew?'POST':'PUT', body:JSON.stringify(body)});
      closeModal(); toast('ذخیره شد','ok'); viewUsers();
    }catch(e){ modalErr(e.message); }
  };
}

/* ==================================================================
   نظرات
================================================================== */
let cmState = 'pending';

async function viewComments(){
  const r = await api('/admin/comments?status=' + cmState);
  $('#content').innerHTML = `
    <div class="filters">
      ${[['pending','در انتظار'],['approved','تایید شده'],['rejected','رد شده'],['all','همه']]
        .map(([k,l])=>`<button class="btn btn-sm ${cmState===k?'btn-primary':'btn-ghost'}" data-st="${k}">${l}</button>`).join('')}
      <span class="muted" style="margin-inline-start:auto">${fa(r.items.length)} نظر</span>
    </div>
    ${r.items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>نویسنده</th><th>محصول</th><th>امتیاز</th><th>متن</th><th>وضعیت</th><th></th></tr></thead>
      <tbody>${r.items.map(c=>`<tr>
        <td><b>${esc(c.author_name)}</b><br><span class="muted">${esc(fmtDate(c.created_at))}</span></td>
        <td>${esc(c.product_fa||'—')}</td>
        <td style="color:var(--warn)">${'★'.repeat(c.rating)}</td>
        <td style="max-width:280px">${esc(c.body)}</td>
        <td><span class="tag ${c.status==='approved'?'tag-on':c.status==='rejected'?'tag-danger':'tag-warn'}">
          ${({pending:'در انتظار',approved:'تایید شده',rejected:'رد شده'})[c.status]}</span></td>
        <td class="actions">
          ${c.status!=='approved'?`<button class="icon-act" data-ok="${c.id}" title="تایید">${I.check}</button>`:''}
          ${c.status!=='rejected'?`<button class="icon-act del" data-no="${c.id}" title="رد">${I.x}</button>`:''}
          <button class="icon-act del" data-del="${c.id}">${I.trash}</button></td>
      </tr>`).join('')}</tbody></table></div>`
    : `<div class="empty">${I.empty}<h4>نظری در این دسته نیست</h4></div>`}`;

  $$('[data-st]').forEach(b => b.onclick = () => { cmState = b.dataset.st; viewComments(); });
  const setStatus = async (id, status) => {
    try{ await api('/admin/comments/'+id, {method:'PATCH', body:JSON.stringify({status})}); toast('انجام شد','ok'); viewComments(); }
    catch(e){ toast(e.message,'err'); }
  };
  $$('[data-ok]').forEach(b => b.onclick = () => setStatus(b.dataset.ok, 'approved'));
  $$('[data-no]').forEach(b => b.onclick = () => setStatus(b.dataset.no, 'rejected'));
  $$('[data-del]').forEach(b => b.onclick = () => confirmBox('این نظر حذف بشه؟', async () => {
    try{ await api('/admin/comments/'+b.dataset.del, {method:'DELETE'}); toast('حذف شد','ok'); viewComments(); }
    catch(e){ toast(e.message,'err'); }
  }));
}

/* ==================================================================
   درگاه‌های پرداخت
================================================================== */
async function viewGateways(){
  const r = await api('/admin/gateways');
  const cfg = (await api('/admin/settings')).settings || {};
  const site = (cfg.site_url || '').replace(/\/+$/, '') || location.origin;

  $('#content').innerHTML = `
    <div class="card" style="margin-bottom:18px">
      <div class="card-head"><h3>کلیدهای درگاه</h3></div>
      <p class="hint" style="margin-bottom:14px">
        این کلیدها فقط روی سرور می‌مانند و هرگز برای مشتری ارسال نمی‌شوند.
        آدرس بازگشت را در پنل درگاه دقیقاً همین بگذار:</p>

      <div class="form-grid">
        <div class="fld full"><label>آدرس سایت (برای ساخت callback)</label>
          <input class="inp mono" id="gwSite" dir="ltr" value="${esc(cfg.site_url||'')}"
            placeholder="https://mypixel.ir">
          <div class="hint">خالی بگذاری، از آدرس درخواست حدس زده می‌شود — روی سرور حتماً پرش کن.</div></div>

        <div class="fld"><label>کد پذیرنده زرین‌پال</label>
          <input class="inp mono" id="gwZp" dir="ltr" type="password"
            value="${esc(cfg.private_zarinpal_merchant||'')}"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
          <div class="hint">آدرس بازگشت: <span class="mono">${esc(site)}/api/payments/callback/zarinpal</span></div></div>

        <div class="fld"><label>کد پذیرنده زیبال</label>
          <input class="inp mono" id="gwZb" dir="ltr" type="password"
            value="${esc(cfg.private_zibal_merchant||'')}" placeholder="برای تست: zibal">
          <div class="hint">آدرس بازگشت: <span class="mono">${esc(site)}/api/payments/callback/zibal</span></div></div>

        <div class="fld full" style="padding-top:4px">
          <label class="check"><input type="checkbox" id="gwSandbox" ${cfg.zarinpal_sandbox==='1'?'checked':''}>
            <span class="bx">${I.check}</span>حالت آزمایشی زرین‌پال (sandbox)</label>
          <div class="hint">در حالت آزمایشی پول واقعی جابه‌جا نمی‌شود. قبل از انتشار خاموشش کن.</div></div>
      </div>
      <div class="modal-foot"><button class="btn btn-primary" id="gwSaveKeys">ذخیره کلیدها</button></div>
    </div>

    <div class="filters">
      <span class="muted">${fa(r.items.length)} درگاه</span>
      <button class="btn btn-primary btn-sm" id="gNew" style="margin-inline-start:auto">${I.plus} درگاه جدید</button>
    </div>
    ${r.items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>درگاه</th><th>کد</th><th>مرچنت</th><th>حالت</th><th>وضعیت</th><th></th></tr></thead>
      <tbody>${r.items.map(g=>`<tr>
        <td><b>${esc(g.name_fa)}</b><br><span class="muted">${esc(g.name_en||'')}</span></td>
        <td class="mono muted">${esc(g.code)}</td>
        <td class="mono muted">${esc(g.merchant_id ? g.merchant_id.slice(0,10)+'…' : '—')}</td>
        <td>${g.sandbox?'<span class="tag tag-warn">تست</span>':'<span class="tag tag-cyan">واقعی</span>'}</td>
        <td>${g.is_active?'<span class="tag tag-on">فعال</span>':'<span class="tag tag-off">غیرفعال</span>'}</td>
        <td class="actions">
          <button class="icon-act" data-edit="${g.id}">${I.edit}</button>
          <button class="icon-act del" data-del="${g.id}">${I.trash}</button></td>
      </tr>`).join('')}</tbody></table></div>`
    : `<div class="empty">${I.empty}<h4>درگاهی تعریف نشده</h4></div>`}`;

  $('#gwSaveKeys').onclick = async () => {
    try{
      await api('/admin/settings', {method:'PUT', body: JSON.stringify({
        site_url: val('gwSite').replace(/\/+$/, ''),
        private_zarinpal_merchant: val('gwZp'),
        private_zibal_merchant: val('gwZb'),
        zarinpal_sandbox: chk('gwSandbox') ? '1' : '0'
      })});
      toast('کلیدها ذخیره شد','ok');
      viewGateways();
    }catch(e){ toast(e.message,'err'); }
  };

  $('#gNew').onclick = () => gatewayForm(null);
  $$('[data-edit]').forEach(b => b.onclick = () => gatewayForm(r.items.find(x=>x.id==b.dataset.edit)));
  $$('[data-del]').forEach(b => b.onclick = () => confirmBox('این درگاه حذف بشه؟', async () => {
    try{ await api('/admin/gateways/'+b.dataset.del, {method:'DELETE'}); toast('حذف شد','ok'); viewGateways(); }
    catch(e){ toast(e.message,'err'); }
  }));
}

function gatewayForm(g){
  const isNew = !g;
  modal(isNew?'درگاه جدید':'ویرایش درگاه', `
    <div class="form-grid">
      <div class="fld"><label>نام فارسی *</label><input class="inp" id="gFa" value="${esc(g?.name_fa||'')}"></div>
      <div class="fld"><label>نام انگلیسی</label><input class="inp" id="gEn" dir="ltr" value="${esc(g?.name_en||'')}"></div>
      <div class="fld"><label>کد درگاه *</label><input class="inp mono" id="gCode" dir="ltr" value="${esc(g?.code||'')}" ${isNew?'':'disabled'} placeholder="zarinpal"></div>
      <div class="fld"><label>ترتیب</label><input class="inp mono" id="gSort" type="number" dir="ltr" value="${g?.sort_order??0}"></div>
      <div class="fld full"><label>Merchant ID / کلید API</label><input class="inp mono" id="gMerchant" dir="ltr" value="${esc(g?.merchant_id||'')}"></div>
      <div class="fld full"><label>آدرس بازگشت (Callback)</label><input class="inp mono" id="gCb" dir="ltr" value="${esc(g?.callback_url||'')}" placeholder="https://mypixel.ir/api/payment/callback/zarinpal"></div>
      <div class="fld full"><label>تنظیمات اضافه (JSON)</label><textarea class="inp mono" id="gCfg" dir="ltr">${esc(g?.config_json||'{}')}</textarea></div>
      <div class="fld full" style="display:flex;gap:22px;flex-wrap:wrap">
        <label class="check"><input type="checkbox" id="gActive" ${g?.is_active?'checked':''}><span class="bx">${I.check}</span>فعال</label>
        <label class="check"><input type="checkbox" id="gSandbox" ${!g||g.sandbox?'checked':''}><span class="bx">${I.check}</span>حالت تست (Sandbox)</label>
      </div>
    </div>`,
    `<button class="btn btn-ghost" id="mdCancel">انصراف</button>
     <button class="btn btn-primary" id="mdSave">${isNew?'ثبت':'ذخیره'}</button>`);

  $('#mdSave').onclick = async () => {
    const cfg = val('gCfg') || '{}';
    try{ JSON.parse(cfg); }catch(_){ return modalErr('تنظیمات اضافه باید JSON معتبر باشه.'); }
    const body = {name_fa:val('gFa'), name_en:val('gEn'), code:val('gCode'),
      merchant_id:val('gMerchant'), callback_url:val('gCb'), config_json:cfg,
      sort_order:parseInt(val('gSort'))||0, is_active:chk('gActive'), sandbox:chk('gSandbox')};
    if(!body.name_fa || (isNew && !body.code)) return modalErr('نام و کد درگاه لازمه.');
    try{
      await api(isNew?'/admin/gateways':'/admin/gateways/'+g.id, {method:isNew?'POST':'PUT', body:JSON.stringify(body)});
      closeModal(); toast('ذخیره شد','ok'); viewGateways();
    }catch(e){ modalErr(e.message); }
  };
}

/* ==================================================================
   سوالات متداول
================================================================== */
async function viewFaqs(){
  const r = await api('/admin/faqs');
  $('#content').innerHTML = `
    <div class="filters">
      <span class="muted">${fa(r.items.length)} سوال</span>
      <button class="btn btn-primary btn-sm" id="fNew" style="margin-inline-start:auto">${I.plus} سوال جدید</button>
    </div>
    ${r.items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>سوال</th><th>جواب</th><th>ترتیب</th><th>وضعیت</th><th></th></tr></thead>
      <tbody>${r.items.map(f=>`<tr>
        <td style="max-width:250px"><b>${esc(f.question_fa)}</b></td>
        <td class="muted" style="max-width:320px">${esc(f.answer_fa.slice(0,110))}${f.answer_fa.length>110?'…':''}</td>
        <td>${fa(f.sort_order)}</td>
        <td>${f.is_active?'<span class="tag tag-on">فعال</span>':'<span class="tag tag-off">مخفی</span>'}</td>
        <td class="actions"><button class="icon-act" data-edit="${f.id}">${I.edit}</button>
          <button class="icon-act del" data-del="${f.id}">${I.trash}</button></td>
      </tr>`).join('')}</tbody></table></div>`
    : `<div class="empty">${I.empty}<h4>سوالی ثبت نشده</h4></div>`}`;

  $('#fNew').onclick = () => faqForm(null);
  $$('[data-edit]').forEach(b => b.onclick = () => faqForm(r.items.find(x=>x.id==b.dataset.edit)));
  $$('[data-del]').forEach(b => b.onclick = () => confirmBox('این سوال حذف بشه؟', async () => {
    try{ await api('/admin/faqs/'+b.dataset.del, {method:'DELETE'}); toast('حذف شد','ok'); viewFaqs(); }
    catch(e){ toast(e.message,'err'); }
  }));
}

function faqForm(f){
  const isNew = !f;
  modal(isNew?'سوال جدید':'ویرایش سوال', `
    <div class="form-grid">
      <div class="fld full"><label>سوال (فارسی) *</label><input class="inp" id="qFa" value="${esc(f?.question_fa||'')}"></div>
      <div class="fld full"><label>جواب (فارسی) *</label><textarea class="inp" id="aFa">${esc(f?.answer_fa||'')}</textarea></div>
      <div class="fld full"><label>سوال (انگلیسی)</label><input class="inp" id="qEn" dir="ltr" value="${esc(f?.question_en||'')}"></div>
      <div class="fld full"><label>جواب (انگلیسی)</label><textarea class="inp" id="aEn" dir="ltr">${esc(f?.answer_en||'')}</textarea></div>
      <div class="fld"><label>ترتیب</label><input class="inp mono" id="qSort" type="number" dir="ltr" value="${f?.sort_order??0}"></div>
      <div class="fld" style="display:flex;align-items:flex-end;padding-bottom:6px">
        <label class="check"><input type="checkbox" id="qActive" ${!f||f.is_active?'checked':''}><span class="bx">${I.check}</span>نمایش در سایت</label></div>
    </div>`,
    `<button class="btn btn-ghost" id="mdCancel">انصراف</button>
     <button class="btn btn-primary" id="mdSave">${isNew?'ثبت':'ذخیره'}</button>`);

  $('#mdSave').onclick = async () => {
    const body = {question_fa:val('qFa'), answer_fa:val('aFa'), question_en:val('qEn'), answer_en:val('aEn'),
      sort_order:parseInt(val('qSort'))||0, is_active:chk('qActive')};
    if(!body.question_fa || !body.answer_fa) return modalErr('سوال و جواب فارسی لازمه.');
    try{
      await api(isNew?'/admin/faqs':'/admin/faqs/'+f.id, {method:isNew?'POST':'PUT', body:JSON.stringify(body)});
      closeModal(); toast('ذخیره شد','ok'); viewFaqs();
    }catch(e){ modalErr(e.message); }
  };
}

/* ==================================================================
   اطلاعیه‌ها
================================================================== */
async function viewAnnouncements(){
  const r = await api('/admin/announcements');
  $('#content').innerHTML = `
    <div class="filters">
      <span class="muted">${fa(r.items.length)} اطلاعیه</span>
      <button class="btn btn-primary btn-sm" id="aNew" style="margin-inline-start:auto">${I.plus} اطلاعیه جدید</button>
    </div>
    ${r.items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>عنوان</th><th>متن</th><th>نوع</th><th>وضعیت</th><th>تاریخ</th><th></th></tr></thead>
      <tbody>${r.items.map(a=>`<tr>
        <td style="max-width:240px"><b>${esc(a.title_fa)}</b>${a.is_pinned?' <span class="tag tag-cyan">سنجاق</span>':''}</td>
        <td class="muted" style="max-width:300px">${esc((a.body_fa||'').slice(0,100))}${(a.body_fa||'').length>100?'…':''}</td>
        <td><span class="tag ${a.level==='success'?'tag-on':a.level==='warning'?'tag-warn':'tag-cyan'}">
          ${({info:'اطلاع',success:'خبر خوب',warning:'هشدار'})[a.level]||a.level}</span></td>
        <td>${a.is_active?'<span class="tag tag-on">منتشر شده</span>':'<span class="tag tag-off">پیش‌نویس</span>'}</td>
        <td class="muted">${esc(fmtDate(a.published_at))}</td>
        <td class="actions"><button class="icon-act" data-edit="${a.id}">${I.edit}</button>
          <button class="icon-act del" data-del="${a.id}">${I.trash}</button></td>
      </tr>`).join('')}</tbody></table></div>`
    : `<div class="empty">${I.empty}<h4>اطلاعیه‌ای نیست</h4></div>`}`;

  $('#aNew').onclick = () => annForm(null);
  $$('[data-edit]').forEach(b => b.onclick = () => annForm(r.items.find(x=>x.id==b.dataset.edit)));
  $$('[data-del]').forEach(b => b.onclick = () => confirmBox('این اطلاعیه حذف بشه؟', async () => {
    try{ await api('/admin/announcements/'+b.dataset.del, {method:'DELETE'}); toast('حذف شد','ok'); viewAnnouncements(); }
    catch(e){ toast(e.message,'err'); }
  }));
}

function annForm(a){
  const isNew = !a;
  modal(isNew?'اطلاعیه جدید':'ویرایش اطلاعیه', `
    <div class="form-grid">
      <div class="fld full"><label>عنوان (فارسی) *</label><input class="inp" id="tFa" value="${esc(a?.title_fa||'')}"></div>
      <div class="fld full"><label>متن (فارسی)</label><textarea class="inp" id="bFa">${esc(a?.body_fa||'')}</textarea></div>
      <div class="fld full"><label>عنوان (انگلیسی)</label><input class="inp" id="tEn" dir="ltr" value="${esc(a?.title_en||'')}"></div>
      <div class="fld full"><label>متن (انگلیسی)</label><textarea class="inp" id="bEn" dir="ltr">${esc(a?.body_en||'')}</textarea></div>
      <div class="fld"><label>نوع</label><select class="inp" id="aLevel">
        <option value="info" ${a?.level==='info'?'selected':''}>اطلاع‌رسانی</option>
        <option value="success" ${a?.level==='success'?'selected':''}>خبر خوب</option>
        <option value="warning" ${a?.level==='warning'?'selected':''}>هشدار</option>
      </select></div>
      <div class="fld" style="display:flex;align-items:flex-end;gap:18px;padding-bottom:6px;flex-wrap:wrap">
        <label class="check"><input type="checkbox" id="aPin" ${a?.is_pinned?'checked':''}><span class="bx">${I.check}</span>سنجاق بالا</label>
        <label class="check"><input type="checkbox" id="aActive" ${!a||a.is_active?'checked':''}><span class="bx">${I.check}</span>منتشر شود</label>
      </div>
    </div>`,
    `<button class="btn btn-ghost" id="mdCancel">انصراف</button>
     <button class="btn btn-primary" id="mdSave">${isNew?'ثبت':'ذخیره'}</button>`);

  $('#mdSave').onclick = async () => {
    const body = {title_fa:val('tFa'), body_fa:val('bFa'), title_en:val('tEn'), body_en:val('bEn'),
      level:val('aLevel'), is_pinned:chk('aPin'), is_active:chk('aActive')};
    if(!body.title_fa) return modalErr('عنوان فارسی لازمه.');
    try{
      await api(isNew?'/admin/announcements':'/admin/announcements/'+a.id, {method:isNew?'POST':'PUT', body:JSON.stringify(body)});
      closeModal(); toast('ذخیره شد','ok'); viewAnnouncements();
    }catch(e){ modalErr(e.message); }
  };
}

/* ==================================================================
   تنظیمات
================================================================== */
const SETTING_FIELDS = [
  {k:'site_name_fa', l:'نام سایت (فارسی)'},
  {k:'site_name_en', l:'نام سایت (انگلیسی)', ltr:1},
  {k:'tagline_fa', l:'شعار سایت'},
  {k:'shipping_cost', l:'هزینه ارسال (تومان)', ltr:1, num:1},
  {k:'free_shipping_from', l:'ارسال رایگان از (تومان)', ltr:1, num:1, hint:'صفر یعنی ارسال رایگان نداریم'},
  {k:'support_phone', l:'تلفن پشتیبانی', ltr:1},
  {k:'support_telegram', l:'لینک تلگرام', ltr:1},
  {k:'support_instagram', l:'لینک اینستاگرام', ltr:1},
  {k:'support_hours', l:'ساعت کاری'},
  {k:'about_fa', l:'متن کوتاه درباره ما', area:1}
];

async function viewSettings(){
  const r = await api('/admin/settings');
  const s = r.settings || {};
  $('#content').innerHTML = `
    <div class="card" style="max-width:760px">
      <div class="card-head"><h3>تنظیمات کلی</h3></div>
      <div class="form-grid">
        ${SETTING_FIELDS.map(f=>`
          <div class="fld ${f.area?'full':''}"><label>${esc(f.l)}</label>
            ${f.area
              ? `<textarea class="inp" id="set_${f.k}">${esc(s[f.k]||'')}</textarea>`
              : `<input class="inp ${f.ltr?'mono':''}" id="set_${f.k}" ${f.ltr?'dir="ltr"':''} ${f.num?'type="number"':''} value="${esc(s[f.k]||'')}">`}
            ${f.hint?`<div class="hint">${esc(f.hint)}</div>`:''}
          </div>`).join('')}
        <div class="fld full" style="padding-top:6px">
          <label class="check"><input type="checkbox" id="set_maintenance" ${s.maintenance==='1'?'checked':''}>
            <span class="bx">${I.check}</span>حالت تعمیر و نگهداری</label>
          <div class="hint">وقتی روشن باشد، بازدیدکننده‌ها صفحه «در حال به‌روزرسانی» را می‌بینند.
            پنل مدیریت و حساب‌های ادمین همچنان کار می‌کنند.</div>
        </div>
        <div class="fld full"><label>پیام حالت تعمیر</label>
          <textarea class="inp" id="set_maintenance_message" rows="2">${esc(s.maintenance_message||'')}</textarea></div>
      </div>
      <div class="modal-foot"><button class="btn btn-primary" id="setSave">ذخیره تنظیمات</button></div>
    </div>

    <div class="card" style="max-width:760px;margin-top:18px">
      <div class="card-head"><h3>رمز عبور حساب مدیر</h3></div>
      <div class="form-grid">
        <div class="fld full"><label>رمز عبور جدید</label><input class="inp" id="newPass" type="password" placeholder="حداقل ۸ کاراکتر"></div>
        <div class="fld full"><label>تکرار رمز</label><input class="inp" id="newPass2" type="password"></div>
      </div>
      <div class="modal-foot"><button class="btn btn-ghost" id="passSave">تغییر رمز</button></div>
    </div>`;

  $('#setSave').onclick = async () => {
    const body = {};
    SETTING_FIELDS.forEach(f => body[f.k] = $('#set_'+f.k).value.trim());
    body.maintenance = chk('set_maintenance') ? '1' : '0';
    body.maintenance_message = $('#set_maintenance_message').value.trim();
    try{ await api('/admin/settings', {method:'PUT', body:JSON.stringify(body)}); toast('تنظیمات ذخیره شد','ok'); }
    catch(e){ toast(e.message,'err'); }
  };
  $('#passSave').onclick = async () => {
    const p1 = val('newPass'), p2 = val('newPass2');
    if(p1.length < 8) return toast('رمز حداقل ۸ کاراکتر باشه','err');
    if(p1 !== p2) return toast('تکرار رمز یکی نیست','err');
    try{
      await api('/admin/users/'+me.id, {method:'PUT', body:JSON.stringify({password:p1})});
      toast('رمز عوض شد','ok'); $('#newPass').value=''; $('#newPass2').value='';
    }catch(e){ toast(e.message,'err'); }
  };
}

/* ==================================================================
   گزارش فعالیت
================================================================== */
async function viewLogs(){
  const r = await api('/admin/logs');
  const ACT = {create:'ایجاد', update:'ویرایش', delete:'حذف', login:'ورود'};
  const ENT = {product:'محصول', category:'دسته‌بندی', order:'سفارش', order_status:'وضعیت سفارش',
    user:'کاربر', comment:'نظر', gateway:'درگاه', faq:'سوال متداول', announcement:'اطلاعیه',
    settings:'تنظیمات', upload:'آپلود', admin:'پنل'};
  $('#content').innerHTML = r.items.length ? `<div class="table-wrap"><table>
    <thead><tr><th>مدیر</th><th>عملیات</th><th>مورد</th><th>شناسه</th><th>زمان</th></tr></thead>
    <tbody>${r.items.map(l=>`<tr>
      <td>${esc((l.first_name||'')+' '+(l.last_name||'')) || esc(l.username||'—')}</td>
      <td><span class="tag ${l.action==='delete'?'tag-danger':l.action==='create'?'tag-on':'tag-cyan'}">${esc(ACT[l.action]||l.action)}</span></td>
      <td>${esc(ENT[l.entity]||l.entity)}</td>
      <td class="mono muted">${esc(l.entity_id||'—')}</td>
      <td class="muted">${esc(fmtDate(l.created_at))}</td>
    </tr>`).join('')}</tbody></table></div>`
    : `<div class="empty">${I.empty}<h4>هنوز فعالیتی ثبت نشده</h4></div>`;
}


/* ══════════════════════════════════════════════════
   پروموشن‌ها
══════════════════════════════════════════════════ */
const PROMO_KIND = { flash:'تخفیف شگفت‌انگیز', suggested:'پیشنهادی', discount:'تخفیف‌دار' };

async function viewPromotions(){
  const r = await api('/admin/promotions');
  $('#content').innerHTML = `
    <div class="filters">
      <span class="muted">${fa(r.items.length)} پروموشن</span>
      <button class="btn btn-primary btn-sm" id="prNew" style="margin-inline-start:auto">${I.plus} پروموشن جدید</button>
    </div>
    <p class="hint" style="margin-bottom:14px">محصولات انتخاب‌شده در هر پروموشن، در صفحه اصلی سایت زیر عنوان همان پروموشن نمایش داده می‌شوند.</p>
    ${r.items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>عنوان</th><th>نوع</th><th>محصولات</th><th>تخفیف</th><th>بازه</th><th>وضعیت</th><th></th></tr></thead>
      <tbody>${r.items.map(p=>`<tr>
        <td><b>${esc(p.title_fa)}</b>${p.subtitle_fa?`<br><span class="muted">${esc(p.subtitle_fa)}</span>`:''}</td>
        <td><span class="tag ${p.kind==='flash'?'tag-warn':'tag-cyan'}">${esc(PROMO_KIND[p.kind]||p.kind)}</span></td>
        <td>${fa(p.product_count)}</td>
        <td>${p.discount_percent ? fa(p.discount_percent)+'٪' : '—'}</td>
        <td class="muted">${p.starts_at||p.ends_at
          ? `${esc(fmtDate(p.starts_at)||'—')}<br>تا ${esc(fmtDate(p.ends_at)||'—')}` : 'همیشه'}</td>
        <td>${p.is_active?'<span class="tag tag-on">فعال</span>':'<span class="tag tag-off">غیرفعال</span>'}</td>
        <td class="actions">
          <button class="icon-act" data-edit="${p.id}">${I.edit}</button>
          <button class="icon-act del" data-del="${p.id}">${I.trash}</button></td>
      </tr>`).join('')}</tbody></table></div>`
    : `<div class="empty">${I.empty}<h4>هنوز پروموشنی نساختی</h4><p>مثلاً «تخفیف شگفت‌انگیز امروز» بساز و چند محصول بهش اضافه کن.</p></div>`}`;

  $('#prNew').onclick = () => promoForm(null);
  $$('[data-edit]').forEach(b => b.onclick = () => promoForm(b.dataset.edit));
  $$('[data-del]').forEach(b => b.onclick = () => confirmBox('این پروموشن حذف بشه؟', async () => {
    try{ await api('/admin/promotions/'+b.dataset.del, {method:'DELETE'}); toast('حذف شد','ok'); viewPromotions(); }
    catch(e){ toast(e.message,'err'); }
  }));
}

/** تبدیل «2026-08-01 09:30:00» ↔ «2026-08-01T09:30» برای input[datetime-local] */
function toLocalDT(v){
  if(!v) return '';
  return String(v).trim().replace(' ', 'T').slice(0, 16);
}
function fromLocalDT(v){
  if(!v) return null;
  return String(v).replace('T', ' ') + ':00';
}

async function promoForm(id){
  const isNew = !id;
  let p = { title_fa:'', title_en:'', subtitle_fa:'', kind:'suggested', badge_fa:'',
            discount_percent:0, starts_at:'', ends_at:'', is_active:1, sort_order:0, products:[] };
  if(!isNew) p = (await api('/admin/promotions/'+id)).item;

  // نقشه‌ی انتخاب‌شده‌ها: id → {id, name_fa, image_url, icon}
  const picked = new Map((p.products||[]).map(x => [x.id, x]));

  modal(isNew?'پروموشن جدید':'ویرایش پروموشن', `
    <div class="ftabs" id="prTabs">
      <button class="on" data-pt="info">اطلاعات</button>
      <button data-pt="items">محصولات <span class="tab-count" id="prCount">${fa(picked.size)}</span></button>
    </div>

    <div data-pp="info">
      <div class="form-grid">
        <div class="fld full"><label>عنوان (فارسی) *</label><input class="inp" id="pTitle" value="${esc(p.title_fa)}"></div>
        <div class="fld full"><label>زیرعنوان</label><input class="inp" id="pSub" value="${esc(p.subtitle_fa)}" placeholder="مثلاً: تا ۲۴ ساعت دیگر"></div>
        <div class="fld"><label>نوع</label><select class="inp" id="pKind">
          ${Object.entries(PROMO_KIND).map(([k,v])=>`<option value="${k}" ${p.kind===k?'selected':''}>${v}</option>`).join('')}
        </select></div>
        <div class="fld"><label>برچسب نمایشی</label><input class="inp" id="pBadge" value="${esc(p.badge_fa)}" placeholder="شگفت‌انگیز"></div>
        <div class="fld"><label>درصد تخفیف (اختیاری)</label><input class="inp mono" id="pPct" type="number" dir="ltr" min="0" max="99" value="${p.discount_percent||0}"></div>
        <div class="fld"><label>ترتیب نمایش</label><input class="inp mono" id="pSort" type="number" dir="ltr" value="${p.sort_order||0}"></div>

        <div class="fld"><label>تاریخ و ساعت شروع</label>
          <input class="inp mono" id="pStart" type="datetime-local" value="${esc(toLocalDT(p.starts_at))}">
          <div class="hint">خالی بگذاری، از همین حالا فعاله.</div></div>
        <div class="fld"><label>تاریخ و ساعت پایان</label>
          <input class="inp mono" id="pEnd" type="datetime-local" value="${esc(toLocalDT(p.ends_at))}">
          <div class="hint">خالی بگذاری، همیشه فعال می‌مونه.</div></div>

        <div class="fld full">
          <div class="quick-dates">
            <span class="hint" style="margin:0">میان‌بر:</span>
            <button type="button" class="btn btn-ghost btn-sm" data-quick="24">۲۴ ساعت</button>
            <button type="button" class="btn btn-ghost btn-sm" data-quick="72">۳ روز</button>
            <button type="button" class="btn btn-ghost btn-sm" data-quick="168">۱ هفته</button>
            <button type="button" class="btn btn-ghost btn-sm" data-quick="0">پاک کردن</button>
          </div>
        </div>

        <div class="fld full" style="padding-top:4px">
          <label class="check"><input type="checkbox" id="pActive" ${p.is_active?'checked':''}><span class="bx">${I.check}</span>فعال</label></div>
      </div>
    </div>

    <div data-pp="items" hidden>
      <div class="pick-head">
        <input class="inp inp-sm" id="pSearch" placeholder="جستجو در نام یا SKU — خالی بگذار تا همه نمایش داده شوند">
        <button class="btn btn-ghost btn-sm" id="pAll" type="button">انتخاب همه</button>
        <button class="btn btn-ghost btn-sm" id="pNone" type="button">هیچ‌کدام</button>
      </div>
      <div class="pick-list" id="pList"><div class="hint">در حال بارگذاری…</div></div>
      <div class="pick-chosen" id="pChosen"></div>
    </div>`,
    `<button class="btn btn-ghost" id="mdCancel">انصراف</button>
     <button class="btn btn-primary" id="mdSave">${isNew?'ثبت':'ذخیره'}</button>`);

  // ── تب‌ها ──
  $$('#prTabs [data-pt]').forEach(b => b.onclick = () => {
    $$('#prTabs button').forEach(x => x.classList.toggle('on', x === b));
    $$('[data-pp]').forEach(pane => pane.hidden = pane.dataset.pp !== b.dataset.pt);
    if(b.dataset.pt === 'items' && !$('#pList').dataset.loaded) loadPickList('');
  });

  // ── میان‌برهای تاریخ ──
  $$('[data-quick]').forEach(b => b.onclick = () => {
    const h = parseInt(b.dataset.quick);
    if(!h){ $('#pStart').value = ''; $('#pEnd').value = ''; return; }
    const now = new Date();
    const pad = n => String(n).padStart(2,'0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    $('#pStart').value = fmt(now);
    $('#pEnd').value = fmt(new Date(now.getTime() + h*3600e3));
  });

  // ── لیست انتخاب با چک‌باکس ──
  let lastRows = [];
  async function loadPickList(q){
    const host = $('#pList');
    host.dataset.loaded = '1';
    host.innerHTML = '<div class="hint">در حال بارگذاری…</div>';
    try{
      const r = await api('/admin/products/lookup?q=' + encodeURIComponent(q || ''));
      lastRows = r.items;
      if(!r.items.length){ host.innerHTML = '<div class="hint">محصولی پیدا نشد.</div>'; return; }
      host.innerHTML = r.items.map(x => `
        <label class="pick-item ${picked.has(x.id)?'on':''}" data-row="${x.id}">
          <input type="checkbox" ${picked.has(x.id)?'checked':''} data-cb="${x.id}">
          <span class="bx">${I.check}</span>
          <span class="cell-thumb">${x.image_url?`<img src="${esc(x.image_url)}">`:PRODICON(x.icon)}</span>
          <span class="pi-name">${esc(x.name_fa)}</span>
          <span class="pi-price">${fa((x.discount_price||x.price).toLocaleString('en-US'))}</span>
        </label>`).join('');

      $$('[data-cb]', host).forEach(cb => cb.onchange = () => {
        const pid = parseInt(cb.dataset.cb);
        const row = lastRows.find(y => y.id === pid);
        if(cb.checked) picked.set(pid, row); else picked.delete(pid);
        cb.closest('.pick-item').classList.toggle('on', cb.checked);
        paintChosen();
      });
    }catch(e){ host.innerHTML = `<div class="hint">${esc(e.message)}</div>`; }
  }

  function paintChosen(){
    $('#prCount').textContent = fa(picked.size);
    $('#pChosen').innerHTML = picked.size
      ? [...picked.values()].map(x => `<span class="pick-chip">${esc(x.name_fa)}
          <button type="button" data-unpick="${x.id}">${I.x}</button></span>`).join('')
      : '<div class="hint">هنوز محصولی انتخاب نشده.</div>';
    $$('[data-unpick]').forEach(b => b.onclick = () => {
      const pid = parseInt(b.dataset.unpick);
      picked.delete(pid);
      const cb = $(`[data-cb="${pid}"]`);
      if(cb){ cb.checked = false; cb.closest('.pick-item').classList.remove('on'); }
      paintChosen();
    });
  }
  paintChosen();

  let tm;
  $('#pSearch').oninput = e => {
    clearTimeout(tm);
    tm = setTimeout(() => loadPickList(e.target.value.trim()), 280);
  };
  $('#pAll').onclick = () => {
    lastRows.forEach(x => picked.set(x.id, x));
    $$('[data-cb]').forEach(cb => { cb.checked = true; cb.closest('.pick-item').classList.add('on'); });
    paintChosen();
  };
  $('#pNone').onclick = () => {
    picked.clear();
    $$('[data-cb]').forEach(cb => { cb.checked = false; cb.closest('.pick-item').classList.remove('on'); });
    paintChosen();
  };

  $('#mdSave').onclick = async () => {
    const body = {
      title_fa: val('pTitle'), subtitle_fa: val('pSub'), kind: val('pKind'),
      badge_fa: val('pBadge'), discount_percent: parseInt(val('pPct'))||0,
      sort_order: parseInt(val('pSort'))||0,
      starts_at: fromLocalDT(val('pStart')), ends_at: fromLocalDT(val('pEnd')),
      is_active: chk('pActive'), product_ids: [...picked.keys()]
    };
    if(!body.title_fa) return modalErr('عنوان پروموشن لازمه.');
    if(body.starts_at && body.ends_at && body.ends_at <= body.starts_at)
      return modalErr('تاریخ پایان باید بعد از تاریخ شروع باشه.');
    if(!body.product_ids.length) return modalErr('حداقل یک محصول انتخاب کن.');
    try{
      await api(isNew?'/admin/promotions':'/admin/promotions/'+id, {method:isNew?'POST':'PUT', body:JSON.stringify(body)});
      closeModal(); toast('ذخیره شد','ok'); viewPromotions();
    }catch(e){ modalErr(e.message); }
  };
}

/* ══════════════════════════════════════════════════
   کدهای تخفیف
══════════════════════════════════════════════════ */
async function viewCoupons(){
  const r = await api('/admin/coupons');
  $('#content').innerHTML = `
    <div class="filters">
      <span class="muted">${fa(r.items.length)} کد تخفیف</span>
      <button class="btn btn-primary btn-sm" id="cpNew" style="margin-inline-start:auto">${I.plus} کد جدید</button>
    </div>
    ${r.items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>کد</th><th>نوع</th><th>مقدار</th><th>حداقل سفارش</th><th>استفاده</th><th>وضعیت</th><th></th></tr></thead>
      <tbody>${r.items.map(c=>`<tr>
        <td class="mono" style="color:var(--cyan);font-weight:700">${esc(c.code)}</td>
        <td>${c.kind==='percent'?'درصدی':'مبلغ ثابت'}</td>
        <td>${c.kind==='percent' ? fa(c.value)+'٪' : fa(c.value.toLocaleString('en-US'))+' تومان'}
            ${c.kind==='percent'&&c.max_amount?`<br><span class="muted">سقف ${fa(c.max_amount.toLocaleString('en-US'))}</span>`:''}</td>
        <td>${c.min_order?fa(c.min_order.toLocaleString('en-US')):'—'}</td>
        <td>${fa(c.used_count)}${c.max_uses?' / '+fa(c.max_uses):''}</td>
        <td>${c.is_active?'<span class="tag tag-on">فعال</span>':'<span class="tag tag-off">غیرفعال</span>'}</td>
        <td class="actions">
          <button class="icon-act" data-edit="${c.id}">${I.edit}</button>
          <button class="icon-act del" data-del="${c.id}">${I.trash}</button></td>
      </tr>`).join('')}</tbody></table></div>`
    : `<div class="empty">${I.empty}<h4>کد تخفیفی تعریف نشده</h4></div>`}`;

  $('#cpNew').onclick = () => couponForm(null);
  $$('[data-edit]').forEach(b => b.onclick = () => couponForm(r.items.find(x=>x.id==b.dataset.edit)));
  $$('[data-del]').forEach(b => b.onclick = () => confirmBox('این کد تخفیف حذف بشه؟', async () => {
    try{ await api('/admin/coupons/'+b.dataset.del, {method:'DELETE'}); toast('حذف شد','ok'); viewCoupons(); }
    catch(e){ toast(e.message,'err'); }
  }));
}

function couponForm(c){
  const isNew = !c;
  modal(isNew?'کد تخفیف جدید':'ویرایش کد تخفیف', `
    <div class="form-grid">
      <div class="fld"><label>کد *</label><input class="inp mono" id="cpCode" dir="ltr"
        value="${esc(c?.code||'')}" ${isNew?'':'disabled'} placeholder="PIXEL10" style="text-transform:uppercase"></div>
      <div class="fld"><label>نوع</label><select class="inp" id="cpKind">
        <option value="percent" ${c?.kind!=='amount'?'selected':''}>درصدی</option>
        <option value="amount" ${c?.kind==='amount'?'selected':''}>مبلغ ثابت</option>
      </select></div>
      <div class="fld"><label>مقدار (درصد یا تومان)</label><input class="inp mono" id="cpVal" type="number" dir="ltr" value="${c?.value??0}"></div>
      <div class="fld"><label>سقف تخفیف (فقط درصدی)</label><input class="inp mono" id="cpMax" type="number" dir="ltr" value="${c?.max_amount??0}" placeholder="۰ = بی‌نهایت"></div>
      <div class="fld"><label>حداقل مبلغ سفارش</label><input class="inp mono" id="cpMin" type="number" dir="ltr" value="${c?.min_order??0}"></div>
      <div class="fld"><label>حداکثر دفعات استفاده</label><input class="inp mono" id="cpUses" type="number" dir="ltr" value="${c?.max_uses??0}" placeholder="۰ = نامحدود"></div>
      <div class="fld"><label>شروع</label><input class="inp mono" id="cpStart" dir="ltr" value="${esc(c?.starts_at||'')}" placeholder="2026-08-01 00:00:00"></div>
      <div class="fld"><label>پایان</label><input class="inp mono" id="cpEnd" dir="ltr" value="${esc(c?.ends_at||'')}" placeholder="2026-09-01 00:00:00"></div>
      <div class="fld full" style="padding-top:4px">
        <label class="check"><input type="checkbox" id="cpActive" ${!c||c.is_active?'checked':''}><span class="bx">${I.check}</span>فعال</label></div>
    </div>`,
    `<button class="btn btn-ghost" id="mdCancel">انصراف</button>
     <button class="btn btn-primary" id="mdSave">${isNew?'ثبت':'ذخیره'}</button>`);

  $('#mdSave').onclick = async () => {
    const body = { code: val('cpCode'), kind: val('cpKind'), value: parseInt(val('cpVal'))||0,
      max_amount: parseInt(val('cpMax'))||0, min_order: parseInt(val('cpMin'))||0,
      max_uses: parseInt(val('cpUses'))||0, starts_at: val('cpStart')||null,
      ends_at: val('cpEnd')||null, is_active: chk('cpActive') };
    if(isNew && !body.code) return modalErr('کد تخفیف رو وارد کن.');
    try{
      await api(isNew?'/admin/coupons':'/admin/coupons/'+c.id, {method:isNew?'POST':'PUT', body:JSON.stringify(body)});
      closeModal(); toast('ذخیره شد','ok'); viewCoupons();
    }catch(e){ modalErr(e.message); }
  };
}

/* ══════════════════════════════════════════════════
   بنرهای تبلیغاتی
══════════════════════════════════════════════════ */
const BANNER_POS = { home_top:'بالای صفحه اصلی (زیر هدر)', home_mid:'میان صفحه (بعد از محصولات ویژه)', home_bottom:'پایین صفحه (قبل از فوتر)' };

async function viewBanners(){
  const r = await api('/admin/banners');
  $('#content').innerHTML = `
    <div class="filters">
      <span class="muted">${fa(r.items.length)} بنر</span>
      <button class="btn btn-primary btn-sm" id="bnNew" style="margin-inline-start:auto">${I.plus} بنر جدید</button>
    </div>
    ${r.items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>بنر</th><th>جایگاه</th><th>لینک</th><th>وضعیت</th><th></th></tr></thead>
      <tbody>${r.items.map(b=>`<tr>
        <td><div class="cell-title">
          <span class="cell-thumb">${b.image_url?`<img src="${esc(b.image_url)}">`:I.image}</span>
          <span>${esc(b.title_fa||'—')}<br><span class="muted">${esc((b.body_fa||'').slice(0,50))}</span></span></div></td>
        <td>${esc(BANNER_POS[b.position]||b.position)}</td>
        <td class="mono muted" dir="ltr">${esc((b.link_url||'—').slice(0,34))}</td>
        <td>${b.is_active?'<span class="tag tag-on">فعال</span>':'<span class="tag tag-off">غیرفعال</span>'}</td>
        <td class="actions">
          <button class="icon-act" data-edit="${b.id}">${I.edit}</button>
          <button class="icon-act del" data-del="${b.id}">${I.trash}</button></td>
      </tr>`).join('')}</tbody></table></div>`
    : `<div class="empty">${I.empty}<h4>بنری تعریف نشده</h4></div>`}`;

  $('#bnNew').onclick = () => bannerForm(null);
  $$('[data-edit]').forEach(b => b.onclick = () => bannerForm(r.items.find(x=>x.id==b.dataset.edit)));
  $$('[data-del]').forEach(b => b.onclick = () => confirmBox('این بنر حذف بشه؟', async () => {
    try{ await api('/admin/banners/'+b.dataset.del, {method:'DELETE'}); toast('حذف شد','ok'); viewBanners(); }
    catch(e){ toast(e.message,'err'); }
  }));
}

function bannerForm(b){
  const isNew = !b;
  modal(isNew?'بنر جدید':'ویرایش بنر', `
    <div class="form-grid">
      <div class="fld full"><label>عنوان</label><input class="inp" id="bnTitle" value="${esc(b?.title_fa||'')}"></div>
      <div class="fld full"><label>متن</label><textarea class="inp" id="bnBody">${esc(b?.body_fa||'')}</textarea></div>
      <div class="fld full"><label>آدرس تصویر</label>
        <input class="inp" id="bnImg" dir="ltr" value="${esc(b?.image_url||'')}" placeholder="/uploads/banner.jpg">
        <input type="file" id="bnFile" accept="image/*" style="margin-top:8px;font-size:.8rem"></div>
      <div class="fld full"><label>لینک مقصد</label><input class="inp" id="bnLink" dir="ltr" value="${esc(b?.link_url||'')}" placeholder="#/products?category=wall-art"></div>
      <div class="fld"><label>جایگاه</label><select class="inp" id="bnPos">
        ${Object.entries(BANNER_POS).map(([k,v])=>`<option value="${k}" ${b?.position===k?'selected':''}>${v}</option>`).join('')}
      </select></div>
      <div class="fld"><label>ترتیب</label><input class="inp mono" id="bnSort" type="number" dir="ltr" value="${b?.sort_order??0}"></div>
      <div class="fld full" style="padding-top:4px">
        <label class="check"><input type="checkbox" id="bnActive" ${!b||b.is_active?'checked':''}><span class="bx">${I.check}</span>فعال</label></div>
    </div>`,
    `<button class="btn btn-ghost" id="mdCancel">انصراف</button>
     <button class="btn btn-primary" id="mdSave">${isNew?'ثبت':'ذخیره'}</button>`);

  $('#bnFile').onchange = async e => {
    const f = e.target.files[0]; if(!f) return;
    const fd = new FormData(); fd.append('file', f);
    try{
      const r = await fetch(API+'/admin/upload', {method:'POST', headers:{'Authorization':'Bearer '+token}, credentials:'include', body:fd});
      const d = await r.json(); if(!r.ok) throw new Error(d.error);
      $('#bnImg').value = d.url; toast('تصویر آپلود شد','ok');
    }catch(err){ toast(err.message,'err'); }
  };

  $('#mdSave').onclick = async () => {
    const body = { title_fa: val('bnTitle'), body_fa: val('bnBody'), image_url: val('bnImg')||null,
      link_url: val('bnLink'), position: val('bnPos'), sort_order: parseInt(val('bnSort'))||0,
      is_active: chk('bnActive') };
    try{
      await api(isNew?'/admin/banners':'/admin/banners/'+b.id, {method:isNew?'POST':'PUT', body:JSON.stringify(body)});
      closeModal(); toast('ذخیره شد','ok'); viewBanners();
    }catch(e){ modalErr(e.message); }
  };
}

/* ══════════════════════════════════════════════════
   سفارش‌های لغوشده
══════════════════════════════════════════════════ */
let cancelBy = 'all';

async function viewCancelled(){
  const r = await api('/admin/orders?status=cancelled&limit=100');
  const items = r.items.filter(o => cancelBy === 'all' || (o.cancelled_by || 'admin') === cancelBy);
  const byCustomer = r.items.filter(o => o.cancelled_by === 'customer').length;
  const byShop = r.items.length - byCustomer;
  const lost = r.items.reduce((n, o) => n + o.total, 0);

  $('#content').innerHTML = `
    <div class="stat-grid" style="margin-bottom:18px">
      <div class="stat"><div class="lbl">کل لغوشده</div><div class="val">${fa(r.items.length)}</div></div>
      <div class="stat"><div class="lbl">توسط مشتری</div><div class="val warn">${fa(byCustomer)}</div></div>
      <div class="stat"><div class="lbl">توسط فروشگاه</div><div class="val">${fa(byShop)}</div></div>
      <div class="stat"><div class="lbl">مبلغ ازدست‌رفته</div>
        <div class="val cyan" style="font-size:1.1rem">${fa(lost.toLocaleString('en-US'))} تومان</div></div>
    </div>

    <div class="filters">
      ${[['all','همه'],['customer','لغو توسط مشتری'],['admin','لغو توسط فروشگاه']]
        .map(([k,l]) => `<button class="btn btn-sm ${cancelBy===k?'btn-primary':'btn-ghost'}" data-cb="${k}">${l}</button>`).join('')}
      <span class="muted" style="margin-inline-start:auto">${fa(items.length)} سفارش</span>
    </div>

    ${items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>کد پیگیری</th><th>مشتری</th><th>تماس</th><th>دلیل</th>
        <th>بازگشت وجه</th><th>مبلغ</th><th>تاریخ</th><th></th></tr></thead>
      <tbody>${items.map(o => `<tr>
        <td class="mono" style="color:var(--cyan);font-weight:700">${esc(o.tracking_code)}</td>
        <td>${esc(o.customer_name)}<br>
          <span class="tag ${o.cancelled_by==='customer'?'tag-warn':'tag-off'}">
            ${o.cancelled_by==='customer'?'مشتری':'فروشگاه'}</span></td>
        <td><span class="mono muted">${esc(o.phone)}</span>
          ${o.cancel_telegram ? `<br><a class="tg-link" href="https://t.me/${esc(o.cancel_telegram)}"
            target="_blank" rel="noopener">${I.sms} @${esc(o.cancel_telegram)}</a>` : ''}</td>
        <td class="muted" style="max-width:190px">${esc(o.cancel_reason || '—')}</td>
        <td>${o.payment_status === 'paid'
          ? (o.cancel_card
              ? `<span class="mono" style="font-size:.76rem">${esc(fmtCard(o.cancel_card))}</span>
                 <br><span class="muted">${esc(o.cancel_holder || '—')}</span>`
              : '<span class="tag tag-danger">کارت ثبت نشده</span>')
          : '<span class="tag tag-off">پرداخت نشده</span>'}</td>
        <td>${fa(o.total.toLocaleString('en-US'))}</td>
        <td class="muted">${esc(fmtDate(o.updated_at || o.created_at))}</td>
        <td class="actions"><button class="icon-act" data-view="${o.id}">${I.eye}</button></td>
      </tr>`).join('')}</tbody></table></div>`
    : `<div class="empty">${I.empty}<h4>سفارش لغوشده‌ای نیست</h4>
       <p>خبر خوبیه — یعنی همه سفارش‌ها به مقصد رسیدن.</p></div>`}`;

  $$('[data-cb]').forEach(b => b.onclick = () => { cancelBy = b.dataset.cb; viewCancelled(); });
  $$('[data-view]').forEach(b => b.onclick = () => orderDetail(b.dataset.view));
}

/** شماره کارت را چهارتایی جدا می‌کند */
function fmtCard(v){
  const s = String(v || '').replace(/\D/g, '');
  return s ? fa(s.replace(/(.{4})/g, '$1 ').trim()) : '';
}

/* ══════════════════════════════════════════════════
   قوانین و مقررات
══════════════════════════════════════════════════ */
async function viewTerms(){
  const r = await api('/admin/settings');
  const s = r.settings || {};

  $('#content').innerHTML = `
    <div class="card" style="max-width:900px">
      <div class="card-head"><h3>متن قوانین و مقررات</h3>
        <div class="spacer"></div>
        <a class="btn btn-ghost btn-sm" href="/terms" target="_blank">مشاهده در سایت ↗</a></div>

      <div class="form-grid">
        <div class="fld"><label>عنوان صفحه</label>
          <input class="inp" id="tmTitle" value="${esc(s.terms_title||'قوانین و مقررات')}"></div>
        <div class="fld"><label>تاریخ آخرین به‌روزرسانی</label>
          <input class="inp" id="tmUpdated" value="${esc(s.terms_updated||'')}" placeholder="۱۵ مرداد ۱۴۰۵"></div>
      </div>

      <p class="hint" style="margin:14px 0 8px">
        نوشتن با مارک‌داون ساده: <span class="mono">## عنوان</span> برای تیتر،
        <span class="mono">- مورد</span> برای فهرست، و <span class="mono">**متن**</span> برای پررنگ.</p>

      <div class="terms-edit">
        <textarea class="inp" id="tmBody" rows="20">${esc(s.terms_body||'')}</textarea>
        <div class="terms-preview" id="tmPrev"></div>
      </div>

      <div class="modal-foot">
        <button class="btn btn-ghost" id="tmSample">درج متن نمونه</button>
        <button class="btn btn-primary" id="tmSave">ذخیره</button></div>
    </div>`;

  const md = src => {
    const lines = String(src||'').split('\n');
    let out = '', list = false;
    const inline = x => esc(x).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
    for(const raw of lines){
      const l = raw.trim();
      if(!l){ if(list){ out += '</ul>'; list = false; } continue; }
      if(/^#{2,3}\s/.test(l)){ if(list){out+='</ul>';list=false;} out += `<h4>${inline(l.replace(/^#+\s*/,''))}</h4>`; }
      else if(/^[-*]\s/.test(l)){ if(!list){out+='<ul>';list=true;} out += `<li>${inline(l.replace(/^[-*]\s*/,''))}</li>`; }
      else { if(list){out+='</ul>';list=false;} out += `<p>${inline(l)}</p>`; }
    }
    return out + (list ? '</ul>' : '');
  };

  const paint = () => { $('#tmPrev').innerHTML = md($('#tmBody').value); };
  $('#tmBody').oninput = debounce(paint, 220);
  paint();

  $('#tmSample').onclick = () => {
    if($('#tmBody').value.trim() && !confirm('متن فعلی جایگزین بشه؟')) return;
    $('#tmBody').value = `## ۱. ثبت سفارش
سفارش بعد از ثبت و پرداخت قطعی می‌شه. تا قبل از ارسال، از صفحه پیگیری می‌تونی لغوش کنی.

## ۲. ارسال
سفارش‌ها با پست پیشتاز یا تیپاکس ارسال می‌شن و کد رهگیری در صفحه پیگیری قرار می‌گیره.

## ۳. مرجوعی
تا ۷ روز بعد از تحویل، اگر کالا معیوب یا اشتباه بود، از بخش مرجوعی درخواست بده.`;
    paint();
  };

  $('#tmSave').onclick = async () => {
    try{
      await api('/admin/settings', {method:'PUT', body: JSON.stringify({
        terms_title: val('tmTitle'), terms_updated: val('tmUpdated'),
        terms_body: $('#tmBody').value })});
      toast('قوانین ذخیره شد','ok');
    }catch(e){ toast(e.message,'err'); }
  };
}

/* ══════════════════════════════════════════════════
   مدیریت رسانه
══════════════════════════════════════════════════ */
let mediaQ = '', mediaOnly = 'all';

async function viewMedia(){
  const r = await api('/admin/media?q=' + encodeURIComponent(mediaQ));
  const items = mediaOnly === 'unused' ? r.items.filter(i => !i.usage.length) : r.items;
  const mb = n => (n/1048576).toFixed(1);

  $('#content').innerHTML = `
    <div class="filters">
      <input class="inp inp-sm" id="mdQ" placeholder="جستجو در نام فایل" value="${esc(mediaQ)}">
      ${[['all','همه'],['unused','بدون استفاده']].map(([k,l]) =>
        `<button class="btn btn-sm ${mediaOnly===k?'btn-primary':'btn-ghost'}" data-mf="${k}">
          ${l}${k==='unused'&&r.unused?` (${fa(r.unused)})`:''}</button>`).join('')}
      <span class="muted">${fa(items.length)} فایل · ${fa(mb(r.total_size))} مگابایت</span>
      <label class="btn btn-primary btn-sm" style="margin-inline-start:auto;cursor:pointer">
        ${I.plus} آپلود<input type="file" id="mdUp" accept="image/*" multiple hidden></label>
    </div>

    ${items.length ? `<div class="media-grid">
      ${items.map(m => `
        <div class="media-item ${m.usage.length?'':'unused'}" data-mid="${m.id}">
          <div class="mi-img"><img src="${esc(m.url)}" alt="${esc(m.alt||'')}" loading="lazy"></div>
          <div class="mi-body">
            <b title="${esc(m.filename)}">${esc(m.title || m.filename)}</b>
            <span>${fa((m.size/1024).toFixed(0))} کیلوبایت</span>
            ${m.usage.length
              ? `<span class="mi-use">${I.check} در ${fa(m.usage.length)} جا</span>`
              : `<span class="mi-free">بدون استفاده</span>`}
          </div>
          <div class="mi-acts">
            <button class="icon-act" data-medit="${m.id}" title="ویرایش">${I.edit}</button>
            <button class="icon-act" data-mcopy="${esc(m.url)}" title="کپی آدرس">${I.eye}</button>
            <button class="icon-act del" data-mdel="${m.id}" title="حذف">${I.trash}</button>
          </div>
        </div>`).join('')}
    </div>` : `<div class="empty">${I.empty}<h4>فایلی آپلود نشده</h4>
       <p>از همین‌جا یا از فرم محصولات تصویر آپلود کن.</p></div>`}`;

  $('#mdQ').oninput = debounce(e => { mediaQ = e.target.value; viewMedia(); }, 320);
  $$('[data-mf]').forEach(b => b.onclick = () => { mediaOnly = b.dataset.mf; viewMedia(); });

  $('#mdUp').onchange = async e => {
    const files = Array.from(e.target.files || []);
    if(!files.length) return;
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    try{
      const res = await fetch(API + '/admin/media', {method:'POST',
        headers:{'Authorization':'Bearer ' + token}, credentials:'include', body: fd});
      const d = await res.json();
      if(!res.ok) throw new Error(d.error);
      toast(`${fa(files.length)} فایل آپلود شد`,'ok');
      viewMedia();
    }catch(err){ toast(err.message || 'آپلود ناموفق','err'); }
  };

  $$('[data-mcopy]').forEach(b => b.onclick = async () => {
    try{ await navigator.clipboard.writeText(location.origin + b.dataset.mcopy); toast('آدرس کپی شد','ok'); }
    catch(_){ toast(b.dataset.mcopy); }
  });

  $$('[data-medit]').forEach(b => b.onclick = () =>
    mediaForm(r.items.find(x => x.id == b.dataset.medit)));

  $$('[data-mdel]').forEach(b => b.onclick = () => {
    const m = r.items.find(x => x.id == b.dataset.mdel);
    const used = m.usage.length;
    confirmBox(used
      ? `این تصویر در ${used} جا استفاده شده (${m.usage.map(u=>u.title).slice(0,3).join('، ')}). با حذف، از همه‌جا برداشته می‌شه. مطمئنی؟`
      : 'این فایل برای همیشه حذف بشه؟', async () => {
      try{
        await api(`/admin/media/${m.id}${used?'?force=1':''}`, {method:'DELETE'});
        toast('حذف شد','ok'); viewMedia();
      }catch(e){ toast(e.message,'err'); }
    });
  });
}

function mediaForm(m){
  if(!m) return;
  modal('ویرایش فایل', `
    <div class="media-prev"><img src="${esc(m.url)}" alt=""></div>
    <div class="form-grid">
      <div class="fld full"><label>عنوان</label>
        <input class="inp" id="mdTitle" value="${esc(m.title||'')}" placeholder="${esc(m.filename)}"></div>
      <div class="fld full"><label>متن جایگزین (alt)</label>
        <input class="inp" id="mdAlt" value="${esc(m.alt||'')}" placeholder="توضیح کوتاه تصویر برای سئو"></div>
      <div class="fld full"><label>آدرس فایل</label>
        <input class="inp mono" dir="ltr" value="${esc(m.url)}" readonly></div>
      ${m.usage.length ? `<div class="fld full"><label>استفاده‌شده در</label>
        <div class="use-list">${m.usage.map(u => `<span class="use-chip">${esc(u.title||u.id)}</span>`).join('')}</div></div>`
        : `<div class="fld full"><p class="hint">این فایل هیچ‌جا استفاده نشده.</p></div>`}
    </div>`,
    `<button class="btn btn-ghost" id="mdCancel">بستن</button>
     <button class="btn btn-primary" id="mdSave">ذخیره</button>`);

  $('#mdSave').onclick = async () => {
    try{
      await api('/admin/media/' + m.id, {method:'PUT', body: JSON.stringify({
        title: val('mdTitle'), alt: val('mdAlt') })});
      closeModal(); toast('ذخیره شد','ok'); viewMedia();
    }catch(e){ modalErr(e.message); }
  };
}

/* ══════════════════════════════════════════════════
   تراکنش‌های پرداخت
══════════════════════════════════════════════════ */
let txFilter = 'all';
const TX_STATUS = { pending:['در انتظار','tag-warn'], paid:['موفق','tag-on'],
  failed:['ناموفق','tag-danger'], cancelled:['انصراف','tag-off'] };

async function viewTransactions(){
  const r = await api('/admin/payments?status=' + txFilter);
  const st = r.stats || {};
  const n = k => (st[k] ? st[k].count : 0);

  $('#content').innerHTML = `
    <div class="stat-grid" style="margin-bottom:18px">
      <div class="stat"><div class="lbl">پرداخت موفق</div>
        <div class="val ok">${fa(n('paid'))}</div></div>
      <div class="stat"><div class="lbl">مبلغ دریافتی</div>
        <div class="val cyan" style="font-size:1.05rem">${fa(r.total_paid.toLocaleString('en-US'))} تومان</div></div>
      <div class="stat"><div class="lbl">ناموفق</div>
        <div class="val danger">${fa(n('failed'))}</div></div>
      <div class="stat"><div class="lbl">در انتظار</div>
        <div class="val warn">${fa(n('pending'))}</div></div>
    </div>

    <div class="filters">
      ${[['all','همه'],['paid','موفق'],['pending','در انتظار'],['failed','ناموفق'],['cancelled','انصراف']]
        .map(([k,l]) => `<button class="btn btn-sm ${txFilter===k?'btn-primary':'btn-ghost'}" data-tx="${k}">${l}</button>`).join('')}
      <span class="muted" style="margin-inline-start:auto">${fa(r.items.length)} تراکنش</span>
    </div>

    ${r.items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>سفارش</th><th>مشتری</th><th>درگاه</th><th>مبلغ</th>
        <th>وضعیت</th><th>کد پیگیری بانک</th><th>زمان</th><th></th></tr></thead>
      <tbody>${r.items.map(x => {
        const s = TX_STATUS[x.status] || [x.status,'tag-off'];
        return `<tr>
          <td class="mono" style="color:var(--cyan);font-weight:700">${esc(x.tracking_code)}</td>
          <td>${esc(x.customer_name)}<br><span class="mono muted">${esc(x.phone)}</span></td>
          <td>${esc(x.gateway === 'zarinpal' ? 'زرین‌پال' : x.gateway === 'zibal' ? 'زیبال' : x.gateway)}</td>
          <td>${fa(x.amount.toLocaleString('en-US'))}</td>
          <td><span class="tag ${s[1]}">${s[0]}</span>
            ${x.fail_reason ? `<br><span class="muted" style="font-size:.68rem">${esc(x.fail_reason.slice(0,44))}</span>` : ''}</td>
          <td class="mono muted">${esc(x.ref_id || '—')}
            ${x.card_pan ? `<br><span style="font-size:.7rem">${esc(x.card_pan)}</span>` : ''}</td>
          <td class="muted">${esc(fmtDate(x.created_at))}</td>
          <td class="actions"><button class="icon-act" data-txv="${x.id}">${I.eye}</button></td>
        </tr>`; }).join('')}</tbody></table></div>`
    : `<div class="empty">${I.empty}<h4>تراکنشی ثبت نشده</h4>
       <p>بعد از اولین پرداخت آنلاین اینجا پر می‌شود.</p></div>`}`;

  $$('[data-tx]').forEach(b => b.onclick = () => { txFilter = b.dataset.tx; viewTransactions(); });
  $$('[data-txv]').forEach(b => b.onclick = () => txDetail(b.dataset.txv));
}

async function txDetail(id){
  const { item: x } = await api('/admin/payments/' + id);
  const s = TX_STATUS[x.status] || [x.status,'tag-off'];
  const pretty = j => { try{ return JSON.stringify(JSON.parse(j), null, 2); }catch(_){ return j || '—'; } };

  modal(`تراکنش ${x.tracking_code}`, `
    <div class="form-grid">
      <div class="fld"><label>وضعیت</label>
        <div class="inp"><span class="tag ${s[1]}">${s[0]}</span></div></div>
      <div class="fld"><label>درگاه</label>
        <div class="inp">${esc(x.gateway === 'zarinpal' ? 'زرین‌پال' : x.gateway === 'zibal' ? 'زیبال' : x.gateway)}</div></div>
      <div class="fld"><label>مبلغ تراکنش</label>
        <div class="inp mono">${fa(x.amount.toLocaleString('en-US'))} تومان</div></div>
      <div class="fld"><label>مبلغ سفارش</label>
        <div class="inp mono ${x.amount !== x.order_total ? 'mismatch' : ''}">
          ${fa(x.order_total.toLocaleString('en-US'))} تومان</div></div>
      <div class="fld"><label>کد پیگیری بانک</label>
        <div class="inp mono" dir="ltr">${esc(x.ref_id || '—')}</div></div>
      <div class="fld"><label>کارت پرداخت‌کننده</label>
        <div class="inp mono" dir="ltr">${esc(x.card_pan || '—')}</div></div>
      <div class="fld full"><label>شناسه تراکنش نزد درگاه</label>
        <div class="inp mono" dir="ltr">${esc(x.authority || '—')}</div></div>
      ${x.fail_reason ? `<div class="fld full"><label>دلیل ناموفق بودن</label>
        <div class="inp" style="color:var(--danger)">${esc(x.fail_reason)}</div></div>` : ''}
      <div class="fld"><label>زمان ایجاد</label><div class="inp">${esc(fmtDate(x.created_at))}</div></div>
      <div class="fld"><label>زمان تایید</label><div class="inp">${x.verified_at ? esc(fmtDate(x.verified_at)) : '—'}</div></div>
    </div>

    <details class="raw-box"><summary>پاسخ خام درگاه</summary>
      <div class="raw-cols">
        <div><b>درخواست</b><pre dir="ltr">${esc(pretty(x.raw_request))}</pre></div>
        <div><b>تایید</b><pre dir="ltr">${esc(pretty(x.raw_verify))}</pre></div>
      </div></details>`,
    `<button class="btn btn-ghost" id="mdCancel">بستن</button>`);
}

/* ══════════════════════════════════════════════════
   پنل پیامکی
══════════════════════════════════════════════════ */
const SMS_DRIVERS = [
  ['console',     'کنسول (فقط لاگ سرور — برای تست)'],
  ['kavenegar',   'کاوه‌نگار'],
  ['smsir',       'SMS.ir'],
  ['melipayamak', 'ملی پیامک'],
  ['ghasedak',    'قاصدک']
];
let smsTab = 'templates';

async function viewSms(){
  $('#content').innerHTML = `
    <div class="ftabs" id="smsTabs">
      <button class="${smsTab==='templates'?'on':''}" data-st="templates">قالب‌های پیامک</button>
      <button class="${smsTab==='config'?'on':''}"    data-st="config">تنظیمات پنل</button>
      <button class="${smsTab==='log'?'on':''}"       data-st="log">تاریخچه ارسال</button>
    </div>
    <div id="smsBody"><div class="hint">در حال بارگذاری…</div></div>`;

  $$('#smsTabs [data-st]').forEach(b => b.onclick = () => {
    smsTab = b.dataset.st;
    $$('#smsTabs button').forEach(x => x.classList.toggle('on', x === b));
    paintSms();
  });
  paintSms();
}

function paintSms(){
  if(smsTab === 'templates') return smsTemplates();
  if(smsTab === 'config')    return smsConfig();
  return smsLog();
}

/* ---------- قالب‌ها ---------- */
async function smsTemplates(){
  const box = $('#smsBody');
  const r = await api('/admin/sms/templates');

  box.innerHTML = `
    <p class="hint" style="margin-bottom:14px">متن هر پیامک را می‌تونی عوض کنی.
      متغیرها داخل آکولاد نوشته می‌شن و موقع ارسال با مقدار واقعی جایگزین می‌شن.</p>
    <div class="tpl-list">
      ${r.items.map(t => `
        <div class="tpl ${t.is_active?'':'off'}" data-tpl="${esc(t.key)}">
          <div class="tpl-head">
            <label class="check">
              <input type="checkbox" data-tplon="${esc(t.key)}" ${t.is_active?'checked':''}>
              <span class="bx">${I.check}</span></label>
            <b>${esc(t.title_fa)}</b>
            <span class="mono muted">${esc(t.key)}</span>
            <button class="btn btn-ghost btn-sm" data-reset="${esc(t.key)}" type="button">بازگردانی پیش‌فرض</button>
          </div>
          <textarea class="inp tpl-body" data-body="${esc(t.key)}" rows="3">${esc(t.body)}</textarea>
          <div class="tpl-vars">
            ${(t.vars||[]).map(v => `<button class="var-chip" type="button"
              data-var="${esc(v)}" data-for="${esc(t.key)}">{${esc(v)}}</button>`).join('')}
            <span class="tpl-len" data-len="${esc(t.key)}"></span>
          </div>
          <div class="tpl-prev" data-prev="${esc(t.key)}"></div>
        </div>`).join('')}
    </div>
    <div class="vx-bar" style="margin-top:16px">
      <button class="btn btn-primary btn-sm" id="tplSave">ذخیره همه قالب‌ها</button>
    </div>`;

  const lenOf = txt => {
    // پیامک فارسی ۷۰ کاراکتری است
    const n = txt.length;
    const parts = n === 0 ? 0 : Math.ceil(n / 70);
    return `${fa(n)} کاراکتر · ${fa(parts)} پیامک`;
  };

  const preview = async key => {
    const body = $(`[data-body="${key}"]`).value;
    $(`[data-len="${key}"]`).textContent = lenOf(body);
    try{
      const p = await api('/admin/sms/preview', {method:'POST', body: JSON.stringify({body})});
      $(`[data-prev="${key}"]`).innerHTML = `<span class="pv-tag">پیش‌نمایش</span>${esc(p.text).replace(/\n/g,'<br>')}`;
    }catch(_){ }
  };

  r.items.forEach(t => preview(t.key));

  $$('[data-body]').forEach(ta => ta.oninput = debounce(() => preview(ta.dataset.body), 260));
  $$('[data-var]').forEach(b => b.onclick = () => {
    const ta = $(`[data-body="${b.dataset.for}"]`);
    const pos = ta.selectionStart ?? ta.value.length;
    ta.value = ta.value.slice(0, pos) + `{${b.dataset.var}}` + ta.value.slice(pos);
    ta.focus(); preview(b.dataset.for);
  });
  $$('[data-tplon]').forEach(cb => cb.onchange = () =>
    cb.closest('.tpl').classList.toggle('off', !cb.checked));
  $$('[data-reset]').forEach(b => b.onclick = () => {
    const t = r.items.find(x => x.key === b.dataset.reset);
    if(!t || !t.default_body) return;
    $(`[data-body="${t.key}"]`).value = t.default_body;
    preview(t.key);
  });

  $('#tplSave').onclick = async () => {
    try{
      for(const t of r.items){
        await api('/admin/sms/templates/' + encodeURIComponent(t.key), {method:'PUT', body: JSON.stringify({
          body: $(`[data-body="${t.key}"]`).value,
          is_active: $(`[data-tplon="${t.key}"]`).checked
        })});
      }
      toast('قالب‌ها ذخیره شد','ok');
    }catch(e){ toast(e.message,'err'); }
  };
}

/* ---------- تنظیمات پنل ---------- */
async function smsConfig(){
  const box = $('#smsBody');
  const r = await api('/admin/settings');
  const s = r.settings || {};
  const drv = s.sms_driver || 'console';

  box.innerHTML = `
    <div class="card" style="max-width:720px">
      <div class="card-head"><h3>اتصال به پنل پیامکی</h3></div>
      <div class="form-grid">
        <div class="fld full" style="padding-top:2px">
          <label class="check"><input type="checkbox" id="smsOn" ${s.sms_enabled!=='0'?'checked':''}>
            <span class="bx">${I.check}</span>ارسال پیامک فعال باشد</label>
          <div class="hint">اگر خاموش کنی، هیچ پیامکی ارسال نمی‌شود ولی در تاریخچه به‌عنوان «رد شده» ثبت می‌شود.</div>
        </div>
        <div class="fld full"><label>سرویس‌دهنده</label>
          <select class="inp" id="smsDriver">
            ${SMS_DRIVERS.map(([k,v]) => `<option value="${k}" ${drv===k?'selected':''}>${esc(v)}</option>`).join('')}
          </select>
          <div class="hint">با «کنسول» پیامک‌ها فقط در لاگ سرور چاپ می‌شوند — برای تست لوکال عالیه.</div></div>
        <div class="fld full"><label>کلید API</label>
          <input class="inp mono" id="smsKey" dir="ltr" type="password"
            value="${esc(s.private_sms_api_key||'')}" placeholder="کلید پنل پیامکی">
          <div class="hint">این مقدار هرگز به سمت کاربر ارسال نمی‌شود.</div></div>
        <div class="fld"><label>شماره فرستنده</label>
          <input class="inp mono" id="smsSender" dir="ltr" value="${esc(s.sms_sender||'')}" placeholder="10008663"></div>
        <div class="fld"><label>شماره خط (SMS.ir)</label>
          <input class="inp mono" id="smsLine" dir="ltr" value="${esc(s.sms_line||'')}" placeholder="30007732"></div>
        <div class="fld full"><label>نام الگوی کد ورود (کاوه‌نگار)</label>
          <input class="inp mono" id="smsTpl" dir="ltr" value="${esc(s.sms_otp_template||'')}" placeholder="mypixel-otp">
          <div class="hint">اگر پر باشد، کد ورود با سرویس lookup و الگوی تاییدشده ارسال می‌شود.</div></div>
      </div>
      <div class="modal-foot"><button class="btn btn-primary" id="smsSave">ذخیره تنظیمات</button></div>
    </div>

    <div class="card" style="max-width:720px;margin-top:18px">
      <div class="card-head"><h3>ارسال پیامک تست</h3></div>
      <div class="form-grid">
        <div class="fld"><label>شماره موبایل</label>
          <input class="inp mono" id="testPhone" dir="ltr" placeholder="09123456789"></div>
        <div class="fld"><label>قالب</label><select class="inp" id="testKey"></select></div>
      </div>
      <div class="modal-foot"><button class="btn btn-ghost" id="testSend">ارسال تست</button></div>
    </div>`;

  api('/admin/sms/templates').then(t => {
    $('#testKey').innerHTML = t.items.map(x =>
      `<option value="${esc(x.key)}">${esc(x.title_fa)}</option>`).join('');
  });

  $('#smsSave').onclick = async () => {
    try{
      await api('/admin/settings', {method:'PUT', body: JSON.stringify({
        sms_enabled: chk('smsOn') ? '1' : '0',
        sms_driver: val('smsDriver'),
        private_sms_api_key: val('smsKey'),
        sms_sender: val('smsSender'),
        sms_line: val('smsLine'),
        sms_otp_template: val('smsTpl')
      })});
      toast('تنظیمات پیامک ذخیره شد','ok');
    }catch(e){ toast(e.message,'err'); }
  };

  $('#testSend').onclick = async () => {
    const b = $('#testSend'); b.disabled = true;
    try{
      const r2 = await api('/admin/sms/test', {method:'POST', body: JSON.stringify({
        phone: val('testPhone'), key: val('testKey') })});
      toast(r2.message,'ok');
    }catch(e){ toast(e.message,'err'); }
    finally{ b.disabled = false; }
  };
}

/* ---------- تاریخچه ---------- */
let smsLogFilter = 'all';

async function smsLog(){
  const box = $('#smsBody');
  const r = await api('/admin/sms/log?status=' + smsLogFilter);
  const st = r.stats || {};

  box.innerHTML = `
    <div class="filters">
      ${[['all','همه'],['sent','ارسال‌شده'],['failed','ناموفق'],['skipped','رد شده']]
        .map(([k,l]) => `<button class="btn btn-sm ${smsLogFilter===k?'btn-primary':'btn-ghost'}" data-sl="${k}">
          ${l}${k!=='all'&&st[k]?` (${fa(st[k])})`:''}</button>`).join('')}
      <button class="btn btn-ghost btn-sm" id="logClear" style="margin-inline-start:auto">${I.trash} پاک کردن تاریخچه</button>
    </div>
    ${r.items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>گیرنده</th><th>قالب</th><th>متن</th><th>وضعیت</th><th>سرویس</th><th>زمان</th></tr></thead>
      <tbody>${r.items.map(x => `<tr>
        <td class="mono" dir="ltr">${esc(x.phone)}</td>
        <td class="muted">${esc(x.template)}</td>
        <td style="max-width:300px" class="muted">${esc((x.body||'').slice(0,90))}</td>
        <td><span class="tag ${x.status==='sent'?'tag-on':x.status==='failed'?'tag-danger':'tag-off'}">
          ${x.status==='sent'?'ارسال شد':x.status==='failed'?'ناموفق':'رد شد'}</span>
          ${x.error?`<br><span class="muted" style="font-size:.7rem">${esc(x.error.slice(0,50))}</span>`:''}</td>
        <td class="muted">${esc(x.driver||'—')}</td>
        <td class="muted">${esc(fmtDate(x.created_at))}</td>
      </tr>`).join('')}</tbody></table></div>`
    : `<div class="empty">${I.empty}<h4>هنوز پیامکی ارسال نشده</h4>
       <p>بعد از اولین ورود یا سفارش، اینجا پر می‌شود.</p></div>`}`;

  $$('[data-sl]').forEach(b => b.onclick = () => { smsLogFilter = b.dataset.sl; smsLog(); });
  $('#logClear').onclick = () => confirmBox('کل تاریخچه پیامک‌ها پاک بشه؟', async () => {
    await api('/admin/sms/log', {method:'DELETE'});
    toast('پاک شد','ok'); smsLog();
  });
}

/* ══════════════════════════════════════════════════
   کانال‌های پشتیبانی
══════════════════════════════════════════════════ */
const CHAN_KINDS = [
  ['telegram','تلگرام'], ['instagram','اینستاگرام'], ['whatsapp','واتساپ'],
  ['phone','تماس تلفنی'], ['email','ایمیل'], ['hours','ساعت کاری'], ['custom','سایر']
];
const CHAN_HINT = {
  telegram:'لینک کامل — مثلاً https://t.me/mypixel',
  instagram:'لینک کامل — مثلاً https://instagram.com/mypixel',
  whatsapp:'شماره با کد کشور (989121234567) یا لینک کامل wa.me',
  phone:'شماره تماس — مثلاً 02191000000',
  email:'آدرس ایمیل — مثلاً support@mypixel.ir',
  hours:'متن ساعت کاری — مثلاً شنبه تا چهارشنبه، ۱۰ تا ۱۸',
  custom:'لینک یا متنی که می‌خوای روی کارت بیاد'
};

async function viewChannels(){
  const r = await api('/admin/support-channels');
  $('#content').innerHTML = `
    <div class="filters">
      <span class="muted">${fa(r.items.length)} کانال</span>
      <button class="btn btn-primary btn-sm" id="chNew" style="margin-inline-start:auto">${I.plus} کانال جدید</button>
    </div>
    <p class="hint" style="margin-bottom:14px">این‌ها کارت‌های صفحه «پشتیبانی» سایت هستند. برای هرکدام می‌تونی تصویر پس‌زمینه بذاری که بلورشده پشت کارت نمایش داده می‌شه.</p>
    ${r.items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>کانال</th><th>نوع</th><th>مقدار</th><th>پس‌زمینه</th><th>ترتیب</th><th>وضعیت</th><th></th></tr></thead>
      <tbody>${r.items.map(x=>`<tr>
        <td><div class="cell-title">
          <span class="cell-thumb">${x.logo_url?`<img src="${esc(x.logo_url)}">`:(window.MPIcons?MPIcons.get(x.icon):I.chat)}</span>
          <span>${esc(x.name_fa)}<br><span class="muted">${esc((x.desc_fa||'').slice(0,42))}</span></span></div></td>
        <td>${esc((CHAN_KINDS.find(k=>k[0]===x.kind)||['','—'])[1])}</td>
        <td class="mono muted" dir="ltr">${esc((x.value||'—').slice(0,32))}</td>
        <td>${x.bg_url?'<span class="tag tag-cyan">دارد</span>':'<span class="tag tag-off">—</span>'}</td>
        <td>${fa(x.sort_order)}</td>
        <td>${x.is_active?'<span class="tag tag-on">فعال</span>':'<span class="tag tag-off">مخفی</span>'}</td>
        <td class="actions">
          <button class="icon-act" data-edit="${x.id}">${I.edit}</button>
          <button class="icon-act del" data-del="${x.id}">${I.trash}</button></td>
      </tr>`).join('')}</tbody></table></div>`
    : `<div class="empty">${I.empty}<h4>کانالی ثبت نشده</h4>
       <p>تلگرام، اینستاگرام یا شماره تماس رو اضافه کن.</p></div>`}`;

  $('#chNew').onclick = () => channelForm(null);
  $$('[data-edit]').forEach(b => b.onclick = () => channelForm(r.items.find(x=>x.id==b.dataset.edit)));
  $$('[data-del]').forEach(b => b.onclick = () => confirmBox('این کانال حذف بشه؟', async () => {
    try{ await api('/admin/support-channels/'+b.dataset.del, {method:'DELETE'}); toast('حذف شد','ok'); viewChannels(); }
    catch(e){ toast(e.message,'err'); }
  }));
}

function channelForm(x){
  const isNew = !x;
  const kind = x?.kind || 'telegram';
  modal(isNew?'کانال پشتیبانی جدید':'ویرایش کانال', `
    <div class="form-grid">
      <div class="fld"><label>نام فارسی *</label><input class="inp" id="chFa" value="${esc(x?.name_fa||'')}"></div>
      <div class="fld"><label>نام انگلیسی</label><input class="inp" id="chEn" dir="ltr" value="${esc(x?.name_en||'')}"></div>
      <div class="fld"><label>نوع</label><select class="inp" id="chKind">
        ${CHAN_KINDS.map(([k,v])=>`<option value="${k}" ${kind===k?'selected':''}>${v}</option>`).join('')}
      </select></div>
      <div class="fld"><label>ترتیب نمایش</label><input class="inp mono" id="chSort" type="number" dir="ltr" value="${x?.sort_order??0}"></div>
      <div class="fld full"><label>مقدار</label>
        <input class="inp mono" id="chValue" dir="ltr" value="${esc(x?.value||'')}">
        <div class="hint" id="chHint">${esc(CHAN_HINT[kind])}</div></div>
      <div class="fld full"><label>توضیح فارسی</label>
        <textarea class="inp" id="chDescFa" rows="2">${esc(x?.desc_fa||'')}</textarea></div>
      <div class="fld full"><label>توضیح انگلیسی</label>
        <textarea class="inp" id="chDescEn" dir="ltr" rows="2">${esc(x?.desc_en||'')}</textarea></div>
      <div class="fld full"><label>آیکون</label>${iconPicker('chIconPick', x?.icon || 'chat')}</div>
      <div class="fld full"><label>لوگوی اختصاصی (اختیاری)</label>
        <input class="inp" id="chLogo" dir="ltr" value="${esc(x?.logo_url||'')}" placeholder="/uploads/telegram.png">
        <input type="file" id="chLogoFile" accept="image/*" style="margin-top:8px;font-size:.8rem">
        <div class="hint">اگر پر باشد جای آیکون داخلی می‌نشیند.</div></div>
      <div class="fld full"><label>تصویر پس‌زمینه کارت</label>
        <input class="inp" id="chBg" dir="ltr" value="${esc(x?.bg_url||'')}" placeholder="/uploads/telegram-bg.jpg">
        <input type="file" id="chBgFile" accept="image/*" style="margin-top:8px;font-size:.8rem">
        <div class="hint">بلورشده پشت کارت نمایش داده می‌شود.</div>
        <div class="bg-preview" id="chBgPrev"></div></div>
      <div class="fld full" style="padding-top:4px">
        <label class="check"><input type="checkbox" id="chActive" ${!x||x.is_active?'checked':''}>
          <span class="bx">${I.check}</span>نمایش در صفحه پشتیبانی</label></div>
    </div>`,
    `<button class="btn btn-ghost" id="mdCancel">انصراف</button>
     <button class="btn btn-primary" id="mdSave">${isNew?'ثبت':'ذخیره'}</button>`);

  wireIconPicker('chIconPick');
  $('#chKind').onchange = e => { $('#chHint').textContent = CHAN_HINT[e.target.value] || ''; };

  const upload = (fileId, targetId, after) => {
    $('#'+fileId).onchange = async e => {
      const f = e.target.files[0]; if(!f) return;
      const fd = new FormData(); fd.append('file', f);
      try{
        const res = await fetch(API+'/admin/upload', {method:'POST',
          headers:{'Authorization':'Bearer '+token}, credentials:'include', body:fd});
        const d = await res.json(); if(!res.ok) throw new Error(d.error);
        $('#'+targetId).value = d.url; toast('تصویر آپلود شد','ok');
        if(after) after(d.url);
      }catch(err){ toast(err.message,'err'); }
    };
  };
  const paintBg = url => {
    const box = $('#chBgPrev'); if(!box) return;
    box.innerHTML = url ? `<span class="bg-blur" style="background-image:url('${esc(url)}')"></span>
      <span class="bg-tag">پیش‌نمایش بلور</span>` : '';
    box.classList.toggle('on', !!url);
  };
  upload('chLogoFile','chLogo');
  upload('chBgFile','chBg', paintBg);
  $('#chBg').oninput = e => paintBg(e.target.value.trim());
  paintBg(x?.bg_url || '');

  $('#mdSave').onclick = async () => {
    const body = { name_fa: val('chFa'), name_en: val('chEn'), kind: val('chKind'),
      value: val('chValue'), desc_fa: val('chDescFa'), desc_en: val('chDescEn'),
      icon: ($('#chIconPick') && $('#chIconPick').dataset.value) || 'chat',
      logo_url: val('chLogo')||null, bg_url: val('chBg')||null,
      sort_order: parseInt(val('chSort'))||0, is_active: chk('chActive') };
    if(!body.name_fa) return modalErr('نام کانال لازمه.');
    try{
      await api(isNew?'/admin/support-channels':'/admin/support-channels/'+x.id,
        {method:isNew?'POST':'PUT', body:JSON.stringify(body)});
      closeModal(); toast('ذخیره شد','ok'); viewChannels();
    }catch(e){ modalErr(e.message); }
  };
}

/* ══════════════════════════════════════════════════
   پلتفرم‌های فروش
══════════════════════════════════════════════════ */
const PLAT_SLUGS = [
  ['digikala','دیجی‌کالا'], ['basalam','باسلام'], ['torob','ترب'],
  ['emalls','ایمالز'], ['custom','سایر (آیکون عمومی)']
];

async function viewPlatforms(){
  const r = await api('/admin/platforms');
  $('#content').innerHTML = `
    <div class="filters">
      <span class="muted">${fa(r.items.length)} پلتفرم</span>
      <button class="btn btn-primary btn-sm" id="plNew" style="margin-inline-start:auto">${I.plus} پلتفرم جدید</button>
    </div>
    <p class="hint" style="margin-bottom:14px">این‌ها در صفحه «پلتفرم‌ها» در فوتر سایت نمایش داده می‌شوند. اگر لینک خالی باشد، کارت غیرفعال و خاکستری نشان داده می‌شود.</p>
    ${r.items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>پلتفرم</th><th>نوع آیکون</th><th>لینک</th><th>ترتیب</th><th>وضعیت</th><th></th></tr></thead>
      <tbody>${r.items.map(x=>`<tr>
        <td><div class="cell-title">
          <span class="cell-thumb">${x.logo_url?`<img src="${esc(x.logo_url)}">`:I.store}</span>
          <span>${esc(x.name_fa)}<br><span class="muted">${esc(x.name_en||'—')}</span></span></div></td>
        <td class="muted">${esc((PLAT_SLUGS.find(p=>p[0]===x.slug)||['','—'])[1])}</td>
        <td class="mono muted" dir="ltr">${x.url ? esc(x.url.slice(0,36)) : '<span class="tag tag-warn">بدون لینک</span>'}</td>
        <td>${fa(x.sort_order)}</td>
        <td>${x.is_active?'<span class="tag tag-on">فعال</span>':'<span class="tag tag-off">مخفی</span>'}</td>
        <td class="actions">
          <button class="icon-act" data-edit="${x.id}">${I.edit}</button>
          <button class="icon-act del" data-del="${x.id}">${I.trash}</button></td>
      </tr>`).join('')}</tbody></table></div>`
    : `<div class="empty">${I.empty}<h4>پلتفرمی ثبت نشده</h4>
       <p>مثلاً دیجی‌کالا، باسلام، ترب یا ایمالز را اضافه کن.</p></div>`}`;

  $('#plNew').onclick = () => platformForm(null);
  $$('[data-edit]').forEach(b => b.onclick = () => platformForm(r.items.find(x=>x.id==b.dataset.edit)));
  $$('[data-del]').forEach(b => b.onclick = () => confirmBox('این پلتفرم حذف بشه؟', async () => {
    try{ await api('/admin/platforms/'+b.dataset.del, {method:'DELETE'}); toast('حذف شد','ok'); viewPlatforms(); }
    catch(e){ toast(e.message,'err'); }
  }));
}

function platformForm(x){
  const isNew = !x;
  modal(isNew?'پلتفرم جدید':'ویرایش پلتفرم', `
    <div class="form-grid">
      <div class="fld"><label>نام فارسی *</label><input class="inp" id="plFa" value="${esc(x?.name_fa||'')}"></div>
      <div class="fld"><label>نام انگلیسی</label><input class="inp" id="plEn" dir="ltr" value="${esc(x?.name_en||'')}"></div>
      <div class="fld"><label>آیکون داخلی</label><select class="inp" id="plSlug">
        ${PLAT_SLUGS.map(([k,v])=>`<option value="${k}" ${x?.slug===k?'selected':''}>${v}</option>`).join('')}
      </select><div class="hint">اگر لوگوی اختصاصی آپلود کنی، این نادیده گرفته می‌شود.</div></div>
      <div class="fld"><label>ترتیب نمایش</label><input class="inp mono" id="plSort" type="number" dir="ltr" value="${x?.sort_order??0}"></div>
      <div class="fld full"><label>لینک غرفه</label>
        <input class="inp mono" id="plUrl" dir="ltr" value="${esc(x?.url||'')}" placeholder="https://www.digikala.com/seller/…">
        <div class="hint">خالی بگذاری، کارت غیرفعال نمایش داده می‌شود.</div></div>
      <div class="fld full"><label>لوگوی اختصاصی</label>
        <input class="inp" id="plLogo" dir="ltr" value="${esc(x?.logo_url||'')}" placeholder="/uploads/digikala.png">
        <input type="file" id="plFile" accept="image/*" style="margin-top:8px;font-size:.8rem"></div>
      <div class="fld full"><label>تصویر پس‌زمینه کارت</label>
        <input class="inp" id="plBg" dir="ltr" value="${esc(x?.bg_url||'')}" placeholder="/uploads/digikala-bg.jpg">
        <input type="file" id="plBgFile" accept="image/*" style="margin-top:8px;font-size:.8rem">
        <div class="hint">در صفحه پلتفرم‌ها به‌صورت بلورشده پشت کارت نمایش داده می‌شود.
          نسبت پیشنهادی ۴:۳ یا مربع.</div>
        <div class="bg-preview" id="plBgPrev"></div></div>
      <div class="fld full"><label>توضیح کوتاه</label>
        <textarea class="inp" id="plDesc" rows="2">${esc(x?.desc_fa||'')}</textarea></div>
      <div class="fld full" style="padding-top:4px">
        <label class="check"><input type="checkbox" id="plActive" ${!x||x.is_active?'checked':''}>
          <span class="bx">${I.check}</span>نمایش در سایت</label></div>
    </div>`,
    `<button class="btn btn-ghost" id="mdCancel">انصراف</button>
     <button class="btn btn-primary" id="mdSave">${isNew?'ثبت':'ذخیره'}</button>`);

  const upTo = (fileId, targetId, after) => {
    $('#'+fileId).onchange = async e => {
      const f = e.target.files[0]; if(!f) return;
      const fd = new FormData(); fd.append('file', f);
      try{
        const res = await fetch(API+'/admin/upload', {method:'POST',
          headers:{'Authorization':'Bearer '+token}, credentials:'include', body:fd});
        const d = await res.json(); if(!res.ok) throw new Error(d.error);
        $('#'+targetId).value = d.url; toast('تصویر آپلود شد','ok');
        if(after) after(d.url);
      }catch(err){ toast(err.message,'err'); }
    };
  };
  const paintBg = url => {
    const box = $('#plBgPrev'); if(!box) return;
    box.innerHTML = url ? `<span class="bg-blur" style="background-image:url('${esc(url)}')"></span>
      <span class="bg-tag">پیش‌نمایش بلور</span>` : '';
    box.classList.toggle('on', !!url);
  };
  upTo('plFile', 'plLogo');
  upTo('plBgFile', 'plBg', paintBg);
  $('#plBg').oninput = e => paintBg(e.target.value.trim());
  paintBg(x?.bg_url || '');

  $('#mdSave').onclick = async () => {
    const body = { name_fa: val('plFa'), name_en: val('plEn'), slug: val('plSlug'),
      url: val('plUrl'), logo_url: val('plLogo')||null, bg_url: val('plBg')||null,
      desc_fa: val('plDesc'), sort_order: parseInt(val('plSort'))||0, is_active: chk('plActive') };
    if(!body.name_fa) return modalErr('نام پلتفرم لازمه.');
    try{
      await api(isNew?'/admin/platforms':'/admin/platforms/'+x.id,
        {method:isNew?'POST':'PUT', body:JSON.stringify(body)});
      closeModal(); toast('ذخیره شد','ok'); viewPlatforms();
    }catch(e){ modalErr(e.message); }
  };
}

/* ══════════════════════════════════════════════════
   مرجوعی‌ها
══════════════════════════════════════════════════ */
let retState = 'pending';

async function viewReturns(){
  const r = await api('/admin/returns?status=' + retState);
  $('#content').innerHTML = `
    <div class="filters">
      ${[['pending','در انتظار'],['approved','تاییدشده'],['received','دریافت شد'],
         ['refunded','بازگشت وجه'],['rejected','رد شده'],['all','همه']]
        .map(([k,l])=>`<button class="btn btn-sm ${retState===k?'btn-primary':'btn-ghost'}" data-st="${k}">${l}</button>`).join('')}
      <span class="muted" style="margin-inline-start:auto">${fa(r.items.length)} درخواست</span>
    </div>
    ${r.items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>کد پیگیری</th><th>مشتری</th><th>دلیل</th><th>توضیحات</th><th>وضعیت</th><th>تاریخ</th><th></th></tr></thead>
      <tbody>${r.items.map(x=>`<tr>
        <td class="mono" style="color:var(--cyan);font-weight:700">${esc(x.tracking_code)}</td>
        <td>${esc(x.full_name||'—')}<br><span class="muted mono">${esc(x.phone)}</span></td>
        <td>${esc(x.reason_fa)}<br><span class="muted">${fa((x.items||[]).reduce((n,i)=>n+i.qty,0))} قلم</span></td>
        <td class="muted" style="max-width:220px">
          ${x.telegram ? `<a class="tg-link" href="https://t.me/${esc(x.telegram)}" target="_blank" rel="noopener">
            ${I.sms} @${esc(x.telegram)}</a><br>` : ''}
          ${esc((x.description||'—').slice(0,70))}</td>
        <td><span class="tag ${x.status==='refunded'?'tag-on':x.status==='rejected'?'tag-danger':x.status==='pending'?'tag-warn':'tag-cyan'}">${esc(x.status_fa)}</span></td>
        <td class="muted">${esc(fmtDate(x.created_at))}</td>
        <td class="actions">
          <button class="icon-act" data-view="${x.id}">${I.eye}</button>
          <button class="icon-act del" data-del="${x.id}">${I.trash}</button></td>
      </tr>`).join('')}</tbody></table></div>`
    : `<div class="empty">${I.empty}<h4>درخواستی در این دسته نیست</h4></div>`}`;

  $$('[data-st]').forEach(b => b.onclick = () => { retState = b.dataset.st; viewReturns(); });
  $$('[data-view]').forEach(b => b.onclick = () => returnDetail(r.items.find(x=>x.id==b.dataset.view), r.statuses));
  $$('[data-del]').forEach(b => b.onclick = () => confirmBox('این درخواست حذف بشه؟', async () => {
    try{ await api('/admin/returns/'+b.dataset.del, {method:'DELETE'}); toast('حذف شد','ok'); viewReturns(); }
    catch(e){ toast(e.message,'err'); }
  }));
}

function returnDetail(x, statuses){
  modal('مرجوعی ' + x.tracking_code, `
    <div class="stat-grid" style="margin-bottom:16px">
      <div class="stat"><div class="lbl">مشتری</div><div class="val" style="font-size:1rem">${esc(x.full_name||'—')}</div>
        <div class="sub mono">${esc(x.phone)}</div></div>
      <div class="stat"><div class="lbl">دلیل</div><div class="val" style="font-size:.95rem">${esc(x.reason_fa)}</div>
        <div class="sub">${esc(fmtDate(x.created_at))}</div></div>
    </div>
    <div class="form-grid" style="margin-bottom:6px">
      <div class="fld"><label>شماره تماس</label>
        <div class="inp mono" dir="ltr">${esc(x.phone || '—')}</div></div>
      <div class="fld"><label>آیدی تلگرام</label>
        ${x.telegram
          ? `<a class="inp tg-inp" dir="ltr" href="https://t.me/${esc(x.telegram)}" target="_blank" rel="noopener">
               @${esc(x.telegram)} ↗</a>`
          : `<div class="inp muted">ثبت نشده</div>`}</div>
    </div>

    <div class="fld full"><label>کالاهای مرجوعی</label>
      ${(x.items && x.items.length) ? `<div class="table-wrap"><table style="min-width:auto"><tbody>
        ${x.items.map(i => `<tr>
          <td>${esc(i.title)}${i.opt_size||i.opt_color
            ? `<br><span class="muted">${esc([i.opt_size,i.opt_color].filter(Boolean).join(' · '))}</span>` : ''}</td>
          <td class="mono" style="width:70px">×${fa(i.qty)}</td>
          <td style="text-align:end;width:130px">${fa((i.unit_price*i.qty).toLocaleString('en-US'))} تومان</td>
        </tr>`).join('')}
        <tr><td colspan="2"><b>جمع</b></td>
          <td style="text-align:end"><b style="color:var(--cyan)">${fa(x.items.reduce((n,i)=>n+i.unit_price*i.qty,0).toLocaleString('en-US'))} تومان</b></td></tr>
      </tbody></table></div>` : '<div class="hint">قلمی ثبت نشده (کل سفارش)</div>'}
    </div>

    ${x.description ? `<div class="fld" style="margin-bottom:14px"><label>توضیحات مشتری</label>
      <div class="inp">${esc(x.description)}</div></div>` : ''}
    <label style="display:block;font-size:.77rem;color:var(--text-2);margin:6px 0 0;font-weight:600">تغییر وضعیت</label>
    <div class="status-flow" id="retFlow">
      ${Object.entries(statuses).map(([k,v])=>`<button class="status-opt ${x.status===k?'active':''}" data-st="${k}">${esc(v)}</button>`).join('')}
    </div>
    <div class="fld full"><label>یادداشت برای مشتری</label>
      <textarea class="inp" id="retNote">${esc(x.admin_note||'')}</textarea></div>`,
    `<button class="btn btn-ghost" id="mdCancel">بستن</button>
     <button class="btn btn-primary" id="mdSave">ذخیره</button>`);

  let picked = x.status;
  $$('#retFlow .status-opt').forEach(b => b.onclick = () => {
    picked = b.dataset.st;
    $$('#retFlow .status-opt').forEach(y => y.classList.toggle('active', y === b));
  });
  $('#mdSave').onclick = async () => {
    try{
      await api('/admin/returns/'+x.id, {method:'PATCH', body:JSON.stringify({status:picked, admin_note:val('retNote')})});
      closeModal(); toast('به‌روز شد','ok'); viewReturns();
    }catch(e){ modalErr(e.message); }
  };
}

/* ══════════════════════════════════════════════════
   بخش‌های مبتنی بر تنظیمات
══════════════════════════════════════════════════ */
async function settingsSection(title, groups){
  const r = await api('/admin/settings');
  const s = r.settings || {};

  $('#content').innerHTML = groups.map(g => `
    <div class="card" style="max-width:780px;margin-bottom:18px">
      <div class="card-head"><h3>${esc(g.title)}</h3></div>
      ${g.hint ? `<p class="hint" style="margin-bottom:14px">${g.hint}</p>` : ''}
      <div class="form-grid">
        ${g.fields.map(f => {
          const v = s[f.k] ?? f.def ?? '';
          if(f.type === 'check') return `<div class="fld full" style="padding-top:4px">
            <label class="check"><input type="checkbox" id="set_${f.k}" ${v==='1'?'checked':''}>
              <span class="bx">${I.check}</span>${esc(f.l)}</label>
            ${f.hint?`<div class="hint">${esc(f.hint)}</div>`:''}</div>`;
          if(f.type === 'select') return `<div class="fld ${f.full?'full':''}"><label>${esc(f.l)}</label>
            <select class="inp" id="set_${f.k}">${f.options.map(o=>`<option value="${esc(o[0])}" ${v===o[0]?'selected':''}>${esc(o[1])}</option>`).join('')}</select>
            ${f.hint?`<div class="hint">${esc(f.hint)}</div>`:''}</div>`;
          if(f.type === 'area') return `<div class="fld full"><label>${esc(f.l)}</label>
            <textarea class="inp ${f.ltr?'mono':''}" id="set_${f.k}" ${f.ltr?'dir="ltr"':''} rows="${f.rows||3}">${esc(v)}</textarea>
            ${f.hint?`<div class="hint">${esc(f.hint)}</div>`:''}</div>`;
          if(f.upload) return `<div class="fld ${f.full?'full':''}"><label>${esc(f.l)}</label>
            <div class="up-row">
              <input class="inp mono" id="set_${f.k}" dir="ltr" value="${esc(v)}" placeholder="${esc(f.ph||'')}">
              <label class="up-btn">${I.plus}<span>آپلود</span>
                <input type="file" accept="image/*" data-up="${f.k}"></label>
            </div>
            <div class="up-prev ${v?'on':''}" id="prev_${f.k}">${v?`<img src="${esc(v)}" alt="">`:''}</div>
            ${f.hint?`<div class="hint">${esc(f.hint)}</div>`:''}</div>`;
          return `<div class="fld ${f.full?'full':''}"><label>${esc(f.l)}</label>
            <input class="inp ${f.ltr?'mono':''}" id="set_${f.k}" ${f.ltr?'dir="ltr"':''}
              ${f.num?'type="number"':''} ${f.pass?'type="password"':''} value="${esc(v)}" placeholder="${esc(f.ph||'')}">
            ${f.hint?`<div class="hint">${esc(f.hint)}</div>`:''}</div>`;
        }).join('')}
      </div>
    </div>`).join('') + `
    <div style="max-width:780px"><button class="btn btn-primary" id="secSave" style="width:100%">ذخیره ${esc(title)}</button></div>`;

  // آپلود مستقیم برای فیلدهای دارای دکمه آپلود
  const paintPrev = k => {
    const box = $('#prev_' + k), url = ($('#set_' + k) || {}).value || '';
    if(!box) return;
    box.innerHTML = url ? `<img src="${esc(url)}" alt="">` : '';
    box.classList.toggle('on', !!url);
  };
  $$('[data-up]').forEach(inp => {
    const k = inp.dataset.up;
    const field = $('#set_' + k);
    if(field) field.oninput = () => paintPrev(k);
    inp.onchange = async e => {
      const f = e.target.files[0]; if(!f) return;
      const fd = new FormData(); fd.append('file', f);
      try{
        const res = await fetch(API + '/admin/upload', {method:'POST',
          headers:{'Authorization':'Bearer ' + token}, credentials:'include', body:fd});
        const d = await res.json(); if(!res.ok) throw new Error(d.error);
        field.value = d.url; paintPrev(k); toast('لوگو آپلود شد','ok');
      }catch(err){ toast(err.message || 'آپلود ناموفق','err'); }
      e.target.value = '';
    };
  });

  $('#secSave').onclick = async () => {
    const body = {};
    groups.forEach(g => g.fields.forEach(f => {
      const el = $('#set_'+f.k);
      if(!el) return;
      body[f.k] = f.type === 'check' ? (el.checked ? '1' : '0') : el.value.trim();
    }));
    try{ await api('/admin/settings', {method:'PUT', body:JSON.stringify(body)}); toast('ذخیره شد','ok'); }
    catch(e){ toast(e.message,'err'); }
  };
}

/* ---------- پرداخت، مالیات و مکان ---------- */
function viewPayments(){
  return settingsSection('تنظیمات', [
    { title:'مالیات', hint:'اگر درصد را صفر بگذاری، مالیات در فاکتور نمایش داده نمی‌شود.',
      fields:[
        {k:'tax_rate', l:'درصد مالیات بر ارزش افزوده', ltr:1, num:1, def:'0', ph:'9'},
        {k:'tax_label_fa', l:'عنوان مالیات در فاکتور', def:'مالیات بر ارزش افزوده'}
      ]},
    { title:'هزینه ارسال و مکان', hint:'اگر استان فروشگاه را تعیین کنی، برای سفارش‌های همان استان هزینه جداگانه اعمال می‌شود.',
      fields:[
        {k:'shipping_cost', l:'هزینه ثابت ارسال (تومان)', ltr:1, num:1},
        {k:'free_shipping_from', l:'ارسال رایگان از مبلغ (تومان)', ltr:1, num:1, hint:'صفر یعنی ارسال رایگان نداریم'},
        {k:'home_province', l:'استان فروشگاه', ph:'تهران'},
        {k:'shipping_cost_home', l:'هزینه ارسال داخل همان استان', ltr:1, num:1},
        {k:'shipping_carriers_fa', l:'سرویس‌های ارسال', full:1, ph:'پست پیشتاز، تیپاکس'},
        {k:'return_days', l:'مهلت مرجوعی (روز)', ltr:1, num:1, def:'7'}
      ]},
    { title:'آدرس و موقعیت فروشگاه',
      fields:[
        {k:'store_address_fa', l:'آدرس فروشگاه', type:'area', rows:2},
        {k:'store_lat', l:'عرض جغرافیایی', ltr:1, ph:'35.6892'},
        {k:'store_lng', l:'طول جغرافیایی', ltr:1, ph:'51.3890'}
      ]}
  ]);
}

/* ---------- سئو ---------- */
function viewSeo(){
  return settingsSection('تنظیمات سئو', [
    { title:'متادیتای پایه', hint:'این مقادیر در تگ‌های <code>&lt;title&gt;</code> و <code>&lt;meta&gt;</code> صفحه اصلی قرار می‌گیرند.',
      fields:[
        {k:'seo_title', l:'عنوان صفحه (Title)', full:1, ph:'مای پیکسل | فروشگاه اشیای کلکسیونی',
         hint:'بین ۵۰ تا ۶۰ کاراکتر بهترین نتیجه را می‌دهد'},
        {k:'seo_description', l:'توضیح متا (Description)', type:'area', rows:2,
         hint:'بین ۱۲۰ تا ۱۵۵ کاراکتر'},
        {k:'seo_keywords', l:'کلیدواژه‌ها', type:'area', rows:2, hint:'با ویرگول جدا کن'},
        {k:'seo_canonical', l:'آدرس کاننیکال', ltr:1, ph:'https://mypixel.ir'},
        {k:'seo_robots', l:'دستور روبات‌ها', type:'select', options:[
          ['index,follow','ایندکس شود و لینک‌ها دنبال شوند'],
          ['noindex,follow','ایندکس نشود ولی لینک‌ها دنبال شوند'],
          ['index,nofollow','ایندکس شود ولی لینک‌ها دنبال نشوند'],
          ['noindex,nofollow','هیچ‌کدام']]}
      ]},
    { title:'اشتراک‌گذاری در شبکه‌های اجتماعی',
      fields:[
        {k:'seo_og_image', l:'تصویر Open Graph', ltr:1, full:1, ph:'/uploads/og.jpg',
         hint:'اندازه پیشنهادی ۱۲۰۰×۶۳۰ پیکسل'}
      ]},
    { title:'ابزارهای تحلیلی و تایید مالکیت',
      fields:[
        {k:'seo_ga', l:'شناسه Google Analytics', ltr:1, ph:'G-XXXXXXXXXX'},
        {k:'seo_gtm', l:'شناسه Google Tag Manager', ltr:1, ph:'GTM-XXXXXXX'},
        {k:'seo_verification', l:'تگ تایید مالکیت', type:'area', ltr:1, rows:2,
         hint:'کل تگ meta را همین‌جا بچسبان'}
      ]}
  ]);
}

/** آیکون‌های قابل انتخاب برای نمادهای اعتماد */
const TRUST_ICONS = (window.MPIcons ? MPIcons.all() : []).map(i => [i.key, i.fa]);

/* ---------- ورود با گوگل و نمادها ---------- */
function viewIntegrations(){
  return settingsSection('اتصالات', [
    { title:'ورود با گوگل',
      hint:'از <span class="mono">console.cloud.google.com</span> یک OAuth Client از نوع Web Application بساز و مقادیر را اینجا بگذار.',
      fields:[
        {k:'google_enabled', l:'ورود با گوگل فعال باشد', type:'check'},
        {k:'google_client_id', l:'Client ID', ltr:1, full:1, ph:'xxxxx.apps.googleusercontent.com'},
        {k:'private_google_client_secret', l:'Client Secret', ltr:1, full:1, pass:1,
         hint:'این مقدار هرگز به سمت کاربر ارسال نمی‌شود'},
        {k:'google_redirect_uri', l:'Redirect URI', ltr:1, full:1,
         ph:'https://mypixel.ir/api/auth/google/callback',
         hint:'دقیقاً همین آدرس را در کنسول گوگل هم ثبت کن'}
      ]},
    { title:'نماد اول — پیش‌فرض: نماد اعتماد',
      hint:'لینک که بگذاری کلیک‌پذیر می‌شود؛ خالی بگذاری خاکستری و «به‌زودی» نمایش داده می‌شود.',
      fields:[
        {k:'trust_enamad_title', l:'عنوان', ph:'نماد اعتماد'},
        {k:'trust_enamad_desc',  l:'توضیح کوتاه', ph:'ای‌نماد'},
        {k:'trust_enamad_url',   l:'لینک', ltr:1, full:1, ph:'https://trustseal.enamad.ir/?id=…'},
        {k:'trust_enamad_icon',  l:'آیکون داخلی', type:'select', options: TRUST_ICONS},
        {k:'trust_enamad_logo',  l:'لوگوی اختصاصی', ltr:1, upload:1, ph:'/uploads/enamad.png',
         hint:'اگر پر باشد جای آیکون داخلی می‌نشیند'}
      ]},
    { title:'نماد دوم — پیش‌فرض: ترب',
      fields:[
        {k:'trust_torob_title', l:'عنوان', ph:'ترب'},
        {k:'trust_torob_desc',  l:'توضیح کوتاه', ph:'مقایسه قیمت'},
        {k:'trust_torob_url',   l:'لینک', ltr:1, full:1, ph:'https://torob.com/shop/…'},
        {k:'trust_torob_icon',  l:'آیکون داخلی', type:'select', options: TRUST_ICONS},
        {k:'trust_torob_logo',  l:'لوگوی اختصاصی', ltr:1, upload:1, ph:'/uploads/torob.png'}
      ]},
    { title:'نماد سوم — پیش‌فرض: ایمالز',
      fields:[
        {k:'trust_emalls_title', l:'عنوان', ph:'ایمالز'},
        {k:'trust_emalls_desc',  l:'توضیح کوتاه', ph:'رصد قیمت'},
        {k:'trust_emalls_url',   l:'لینک', ltr:1, full:1, ph:'https://emalls.ir/shop/…'},
        {k:'trust_emalls_icon',  l:'آیکون داخلی', type:'select', options: TRUST_ICONS},
        {k:'trust_emalls_logo',  l:'لوگوی اختصاصی', ltr:1, upload:1, ph:'/uploads/emalls.png'}
      ]}
  ]);
}

/* ==================================================================
   کمکی
================================================================== */
function pager(pages, page, id){
  if(pages <= 1) return '';
  return `<div class="pager" id="${id}">${Array.from({length:pages},(_,i)=>
    `<button class="${page===i+1?'active':''}" data-p="${i+1}">${fa(i+1)}</button>`).join('')}</div>`;
}
function wirePager(id, cb){
  const el = $('#'+id); if(!el) return;
  el.onclick = e => { const b = e.target.closest('[data-p]'); if(b) cb(parseInt(b.dataset.p)); };
}
function debounce(fn, ms){
  let tm; return (...a) => { clearTimeout(tm); tm = setTimeout(()=>fn(...a), ms); };
}

/* ==================================================================
   راه‌اندازی
================================================================== */
async function boot(){
  try{
    const r = await api('/auth/me');
    if(!r.user || r.user.role !== 'admin'){ logout(true); return; }
    me = r.user;
  }catch(_){ logout(true); return; }

  $('#loginScreen').style.display = 'none';
  $('#shell').classList.add('on');
  $('#admName').textContent = ((me.first_name||'') + ' ' + (me.last_name||'')).trim() || me.username;
  renderNav();
  go('dashboard');
}

function init(){
  $('#lgBtn').onclick = login;
  $('#lgPass').addEventListener('keydown', e => { if(e.key === 'Enter') login(); });
  $('#lgUser').addEventListener('keydown', e => { if(e.key === 'Enter') $('#lgPass').focus(); });
  $('#logoutBtn').onclick = () => logout();
  $('#overlay').onclick = closeModal;
  $('#menuToggle').onclick = () => { $('#sidebar').classList.toggle('open'); $('#sbBackdrop').classList.toggle('on'); };
  $('#sbBackdrop').onclick = closeSidebar;
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

  if(token) boot();
  else $('#loginScreen').style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', init);
})();
