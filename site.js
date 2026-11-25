const menu = document.querySelector('#mobile-menu');
const toggle = document.querySelector('.hamb');
toggle.addEventListener('click', () => {
  menu.showModal();
  toggle.setAttribute('aria-expanded', 'true');
});
menu.querySelector('.close-menu').addEventListener('click', () => menu.close());
menu.addEventListener('close', () => toggle.setAttribute('aria-expanded', 'false'));
menu.addEventListener('click', e => {
  if (e.target.closest('a')) menu.close();
});
const desktopAbout = document.querySelector('.desktop details');
document.addEventListener('click', e => {
  if (!desktopAbout.contains(e.target)) desktopAbout.open = false;
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && desktopAbout.open) {
    desktopAbout.open = false;
    desktopAbout.querySelector('summary').focus();
  }
});
const caseFilters = document.querySelector('.casefilters');
if (caseFilters) {
  const groups = [...caseFilters.querySelectorAll('[data-axis]')];
  const cards = [...document.querySelectorAll('.casegrid .casecard')];
  function filter() {
    cards.forEach(card => {
      card.hidden = groups.some(group => {
        const value = group.querySelector('[aria-pressed="true"]').dataset.value;
        return value !== '全部' && card.dataset[group.dataset.axis] !== value;
      });
    });
    const selected = groups.map(group => group.querySelector('[aria-pressed="true"]').dataset.value);
    history.replaceState({...history.state, caseFilters:selected}, '');
    document.querySelector('#no-cases').hidden = cards.some(card => !card.hidden);
  }
  const saved = history.state?.caseFilters;
  if (Array.isArray(saved)) {
    groups.forEach((group, i) => {
      const buttons = [...group.querySelectorAll('button')];
      const chosen = buttons.find(button => button.dataset.value === saved[i]) || buttons[0];
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button === chosen)));
    });
    filter();
  }
  groups.forEach(group => group.addEventListener('click', event => {
    const active = event.target.closest('button');
    if (!active) return;
    group.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === active)));
    filter();
  }));
  document.querySelector('#reset').addEventListener('click', () => {
    groups.forEach(group => group.querySelector('button').click());
    groups[0].querySelector('button').focus();
  });
  let previous = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (Math.abs(previous-y) > 5) {
      document.body.classList.toggle('down', y > previous && y > 160);
      previous = y;
    }
  }, {passive:true});
}
const form = document.querySelector('#inquiry');
if (form) {
  const result = form.querySelector('.result');
  const labels = {name:'姓名',company:'公司',role:'职位',email:'工作邮箱',phone:'工作电话',size:'企业规模',service:'业务',message:'需求',source_service:'浏览的服务'};
  const params = new URLSearchParams(location.search);
  const sourceOption = [...form.elements.service.options].find(option => option.dataset.service === params.get('service'));
  if (sourceOption) {
    sourceOption.defaultSelected = true;
    sourceOption.selected = true;
    form.elements.source_service.defaultValue = sourceOption.value;
    form.elements.source_service.disabled = false;
  }
  function emailOption(data, preview = false) {
    const draft = Object.entries(data).filter(([,v])=>v).map(([k,v]) => labels[k]+'：'+v).join('\n');
    const mail = document.createElement('a');
    mail.href = 'mailto:rose@brallent.cn?subject='+encodeURIComponent('Brallent 企业定制预约')+'&body='+encodeURIComponent(draft);
    mail.textContent = '用邮件发送预约';
    result.replaceChildren(preview ? '请在邮件应用中确认发送。需要重新打开时可点' : '在线提交暂不可用。您也可以',mail,'。');
    if (preview) window.location.href = mail.href;
  }
  form.addEventListener('submit',async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    if (form.dataset.delivery === 'email') {emailOption(values, true);return;}
    if (location.protocol === 'file:') {emailOption(values);return;}
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    result.textContent = '正在提交…';
    try {
      const response = await fetch(form.action, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});
      if (response.status === 422) {
        result.textContent = '请检查公司名称、姓名、工作邮箱及选填的工作电话。';
        return;
      }
      if (!response.ok || !(await response.json()).received) throw new Error('Submission unavailable');
      result.textContent = '咨询已登记。感谢您留下联系方式。';
      form.reset();
    } catch {
      emailOption(values);
    } finally {
      submit.disabled = false;
    }
  });
}
const floatContact = document.querySelector('.float-contact');
const inquirySection = document.querySelector('#contactForm');
const footerContact = document.querySelector('footer .footgrid > div:last-child > a');
function showContactShortcut() {
  const bounds = inquirySection?.getBoundingClientRect();
  const atContact = bounds && bounds.top < innerHeight && bounds.bottom > 0;
  const footerInReach = footerContact.getBoundingClientRect().top < innerHeight - 8;
  floatContact.hidden = scrollY < innerHeight * 0.65 || atContact || footerInReach;
}
window.addEventListener('scroll', showContactShortcut, {passive:true});
window.addEventListener('resize', showContactShortcut);
showContactShortcut();

// Start each entrance only when it reaches the viewport. Initial content stays readable.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function installEntrances() {
  if (!('IntersectionObserver' in window) || reducedMotion.matches) return;
  const selector = [
    '.section .wrap > h2', '.blocks > article', '.solutions > a', '.process > li',
    '.case-strip > a', '.casegrid > a', '.gallery > figure', '.service-catalog > article',
    '.reader > h2', '.reader > p', '.form-layout > div', '.form-layout > form'
  ].join(',');
  const pending = new Set();
  function show(node, delay = 0) {
    if (!pending.delete(node)) return;
    observer.unobserve(node);
    node.style.setProperty('--entrance-delay',delay+'ms');
    node.classList.remove('await-entry');
  }
  const observer = new IntersectionObserver(entries => {
    const counts = new Map();
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const parent = entry.target.parentElement;
      const order = counts.get(parent) || 0;
      counts.set(parent,order+1);
      show(entry.target, Math.min(order,3)*75);
    }
  },{threshold:0,rootMargin:'0px 0px -12px 0px'});
  document.querySelectorAll(selector).forEach(node => {
    const rect = node.getBoundingClientRect();
    if (!node.hidden && rect.top < innerHeight && rect.bottom > 0 &&
        rect.left < innerWidth && rect.right > 0) return;
    node.classList.add('scroll-entry','await-entry');
    pending.add(node);observer.observe(node);
  });
  document.addEventListener('focusin', event => {
    const node = event.target.closest('.await-entry');
    if (node) show(node);
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) [...pending].forEach(node => show(node));
  });
}
installEntrances();

function iconButton(label, glyph) {
  const button = document.createElement('button');
  button.type = 'button';button.className = 'round-control';
  button.setAttribute('aria-label',label);button.textContent = glyph;
  return button;
}
function installCaseNavigation(strip) {
  const cards = [...strip.children];
  const controls = document.createElement('div');
  controls.className = 'strip-controls';
  const previous = iconButton('向前浏览案例','‹'), next = iconButton('向后浏览案例','›');
  const position = document.createElement('span');
  controls.append(previous,position,next);strip.after(controls);
  const rail = document.createElement('div');
  rail.className = 'case-industries';
  rail.setAttribute('role', 'group');
  rail.setAttribute('aria-label', '按行业浏览案例');
  strip.id = 'home-case-slides';
  rail.style.setProperty('--sectors', cards.length);
  const choices = cards.map((card, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = card.dataset.sector;
    button.setAttribute('aria-controls', strip.id);
    button.style.setProperty('--order', i);
    button.onclick = () => go(i);
    rail.append(button);
    return button;
  });
  strip.before(rail);

  let active = 0;
  function go(index) {
    const target = cards[Math.min(cards.length - 1, Math.max(0, index))];
    strip.scrollTo({
      left: strip.scrollLeft + target.getBoundingClientRect().left - strip.getBoundingClientRect().left,
      behavior: reducedMotion.matches ? 'instant' : 'smooth'
    });
  }
  function update() {
    const bounds = strip.getBoundingClientRect();
    const offsets = cards.map(card => card.getBoundingClientRect().left - bounds.left);
    active = offsets.reduce((nearest, x, i) => Math.abs(x) < Math.abs(offsets[nearest]) ? i : nearest, 0);
    const last = cards.filter(card => card.getBoundingClientRect().right <= bounds.right + 2).length;
    const end = strip.scrollWidth - strip.clientWidth;
    controls.hidden = end < 2;
    previous.disabled = strip.scrollLeft <= 2;
    next.disabled = strip.scrollLeft >= end - 2;
    const firstVisible = Math.max(0, cards.findIndex(card => card.getBoundingClientRect().right > bounds.left + 2));
    position.textContent = (last > firstVisible + 1 ? (firstVisible + 1) + '–' + last : String(active + 1)) + ' / ' + cards.length;
    rail.style.setProperty('--active-sector', active);
    choices.forEach((choice, i) => choice.setAttribute('aria-pressed', String(i === active)));
  }
  previous.onclick = () => go(Math.ceil(strip.scrollLeft / (cards[1].offsetLeft - cards[0].offsetLeft) - 0.01) - 1);
  next.onclick = () => go(active + 1);
  strip.addEventListener('scroll', update, {passive:true});
  new ResizeObserver(update).observe(strip);
  update();
}
const caseStrip=document.querySelector('.case-strip');
if(caseStrip && caseStrip.children.length>1) installCaseNavigation(caseStrip);

function installMobileSections() {
  const phone = matchMedia('(max-width:680px) and (prefers-reduced-motion:no-preference)');
  const headings = document.querySelectorAll('.home #cases h2, .home #process h2, .home #contactForm h2, .company h1');
  if (!headings.length || !('IntersectionObserver' in window)) return;

  for (const heading of headings) {
    const title = heading.textContent;
    heading.setAttribute('aria-label', title);
    heading.replaceChildren(...Array.from(title, (letter, i) => {
      const span = document.createElement('span');
      span.setAttribute('aria-hidden', 'true');
      span.style.setProperty('--order', i);
      span.textContent = letter;
      return span;
    }));
  }

  const fields = document.querySelectorAll('#inquiry > :is(label, .form-extras, .form-note, button)');
  fields.forEach((field, index) => field.style.setProperty('--order', index + 1));

  const targets = document.querySelectorAll(
    '.home #contactForm h2, .home #inquiry, .home #cases h2, .home .case-industries, .home .case-strip .casecard, .home #process h2, .company h1, .company-copy, .company-services'
  );
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      entry.target.classList.toggle('in-view', entry.isIntersecting);
    }
  });
  function configure() {
    observer.disconnect();
    for (const target of targets) {
      target.classList.remove('in-view');
      if (phone.matches) observer.observe(target);
    }
  }
  phone.addEventListener('change', configure);
  configure();
}
installMobileSections();

function installCooperationTimeline(list) {
  const steps = [...list.children];
  const contact = document.querySelector('#contactForm');
  const heading = contact.querySelector('.contact-heading');
  const signal = contact.querySelector('.delivery-signal');
  const phone = matchMedia('(max-width:680px)');
  let frame = 0;
  function paint() {
    frame = 0;
    const readingLine = innerHeight * 0.66;
    const bounds = steps.map(step => step.getBoundingClientRect());
    const last = bounds[bounds.length - 1];
    const contactTop = contact.getBoundingClientRect().top;
    const headingTop = heading.getBoundingClientRect().top;
    steps.forEach((step, i) => {
      const distance = readingLine - bounds[i].top - 18;
      step.classList.toggle('reached', distance >= 0);
      step.style.setProperty('--fill', Math.max(0, Math.min(1, distance / bounds[i].height)));
    });
    if (phone.matches) {
      const start = last.top + 36;
      signal.style.top = (start - contactTop) + 'px';
      signal.style.height = Math.max(0, headingTop - 12 - start) + 'px';
      const arrived = readingLine >= last.top + 18;
      contact.classList.toggle('arrived', arrived);
      if (!arrived) contact.classList.remove('at-form');
      else if (contactTop <= 8) contact.classList.add('at-form');
    }
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(paint);
  }
  const visible = new Set();
  function listen(active) {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    cancelAnimationFrame(frame);
    frame = 0;
    if (active) {
      window.addEventListener('scroll', schedule, {passive:true});
      window.addEventListener('resize', schedule);
      paint();
    }
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    }
    listen(visible.size > 0 && !reducedMotion.matches);
  });
  function configure() {
    observer.disconnect();
    visible.clear();
    listen(false);
    list.classList.toggle('tracking', !reducedMotion.matches);
    contact.classList.toggle('handoff', phone.matches && !reducedMotion.matches);
    contact.classList.remove('arrived', 'at-form');
    if (reducedMotion.matches) {
      steps.forEach(step => step.style.removeProperty('--fill'));
    } else {
      paint();
      observer.observe(list);
      observer.observe(contact);
    }
  }
  reducedMotion.addEventListener('change', configure);
  phone.addEventListener('change', configure);
  configure();
}
const cooperation = document.querySelector('.home .cooperation');
if (cooperation && 'IntersectionObserver' in window) installCooperationTimeline(cooperation);

function installGallery(galleries) {
  const viewer=document.createElement('dialog');
  viewer.className='photo-viewer';viewer.setAttribute('aria-label','图片详情');
  const photo=new Image(),caption=document.createElement('p'),bar=document.createElement('div');
  photo.className='viewer-photo';caption.setAttribute('aria-live','polite');bar.className='viewer-nav';
  const close=iconButton('关闭大图','×'),prev=iconButton('上一张图片','‹'),next=iconButton('下一张图片','›');
  const stage = document.createElement('div');
  stage.className = 'viewer-stage';
  stage.append(photo);
  close.classList.add('viewer-close');bar.append(prev,caption,next);viewer.append(close,stage,bar);document.body.append(viewer);
  const inquiry=document.createElement('a');
  inquiry.href='index.html?service=apparel#contactForm';inquiry.textContent='咨询服装定制';
  inquiry.className='viewer-inquiry';inquiry.hidden=true;bar.append(inquiry);
  inquiry.addEventListener('click',()=>viewer.close());
  let items=[],at=0,paired=false;
  function display(index) {
    const count = paired ? items.length * 2 : items.length;
    at = (index + count) % count;
    const figure = items[paired ? Math.floor(at / 2) : at];
    const source = figure.querySelector('img');
    const side = paired ? (at % 2 ? ' · 背面' : ' · 正面') : '';
    viewer.classList.toggle('design-viewer', paired);
    stage.classList.toggle('back-view', paired && at % 2 === 1);
    viewer.classList.toggle('rack-viewer', Boolean(figure.closest('.rack')));
    const anonymous=Boolean(figure.closest('.studio-rack'));
    caption.hidden=anonymous;
    inquiry.hidden=!anonymous;
    photo.src = source.currentSrc || source.src;
    photo.alt = source.alt + side;
    const name = figure.closest('.look-photos') ? source.alt : figure.querySelector('figcaption').textContent + side;
    caption.textContent = figure.closest('.rack') ? name : name + '　' + (at+1) + ' / ' + count;
  }
  galleries.forEach(gallery=>{
    const figures=[...gallery.querySelectorAll('figure')];
    figures.forEach((figure,index)=>{
      const source=figure.querySelector('img');
      const opener=document.createElement('button');opener.type='button';opener.className='photo-open';
      opener.setAttribute('aria-label','放大查看'+source.alt);opener.setAttribute('aria-haspopup','dialog');
      source.before(opener);opener.append(source);
      opener.onclick=()=>{items=figures;paired=Boolean(gallery.closest('#design-references'));display(paired ? index * 2 : index);viewer.showModal();close.focus();};
    });
  });
  prev.onclick=()=>display(at-1);next.onclick=()=>display(at+1);close.onclick=()=>viewer.close();
  viewer.addEventListener('click',e=>{if(e.target===viewer)viewer.close();});
  viewer.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();display(at+(e.key==='ArrowLeft'?-1:1));}
  });
  let touch;
  photo.addEventListener('touchstart',e=>{touch=e.touches.length===1?[e.touches[0].clientX,e.touches[0].clientY]:null;},{passive:true});
  photo.addEventListener('touchend',e=>{
    if(!touch)return;
    const dx=e.changedTouches[0].clientX-touch[0],dy=e.changedTouches[0].clientY-touch[1];touch=null;
    if(Math.abs(dx)>45 && Math.abs(dx)>2*Math.abs(dy))display(at+(dx<0?1:-1));
  },{passive:true});
}
const galleries=[...document.querySelectorAll('.gallery, .rack-pieces, .look-photos')];
if(galleries.length)installGallery(galleries);

function installRack(rack) {
  const pieces = [...rack.querySelectorAll('.rack-piece')];
  const room = rack.querySelector('.rack-room');
  const controls = rack.querySelector('.rack-controls');
  const status = rack.querySelector('.rack-announcement');
  let current = 0;

  const showcase = rack.classList.contains('studio-rack');
  function positionHangers(center) {
    const count = pieces.length;
    pieces.forEach((piece, i) => {
      const offset = ((i - center + count * 2.5) % count + count) % count - count / 2;
      const depth = Math.abs(offset);
      const first = Math.min(1, depth);
      const stack = 1 - Math.exp(-Math.max(0, depth - 1) / (showcase ? 2.2 : 3.1));
      const distance = (showcase ? 34 : 25) * first + (showcase ? 24 : 28) * stack;
      const angle = (showcase ? 64 : 54) * first + (showcase ? 14 : 19) * (1 - Math.exp(-depth / 3));
      const direction = Math.sign(offset);
      piece.style.setProperty('--pos', (50 + direction * distance) + '%');
      piece.style.setProperty('--angle', (-direction * angle) + 'deg');
      piece.style.setProperty('--size', 1 - first * .13 - .012 * depth);
      piece.style.setProperty('--tone', Math.max(.78, 1 - depth * .04));
      piece.style.zIndex = Math.round((count - depth) * 100);
    });
  }
  function select(index) {
    current = ((index % pieces.length) + pieces.length) % pieces.length;
    positionHangers(current);
    pieces.forEach((piece, i) => {
      const side = i !== current;
      const open = piece.querySelector('button');
      const name = piece.querySelector('img').alt;
      open.tabIndex = side ? -1 : 0;
      open.setAttribute('aria-label', side ? '选择' + name : '放大查看' + name);
      if (side) open.removeAttribute('aria-haspopup');
      else open.setAttribute('aria-haspopup','dialog');
    });
    status.textContent = pieces[current].querySelector('img').alt;
  }
  controls.querySelector('.rack-prev').onclick = () => select(current - 1);
  controls.querySelector('.rack-next').onclick = () => select(current + 1);
  let start, suppressClickUntil = 0;
  room.addEventListener('pointerdown', e => {
    if (!e.isPrimary) return;
    suppressClickUntil = 0;
    start = [e.clientX, e.clientY];
  });
  function dragStep() { return Math.max(86, Math.min(160, room.clientWidth * .30)); }
  function releaseDrag() {
    start = null;
    room.classList.remove('dragging');
    room.style.removeProperty('--drag');
    if (showcase) positionHangers(current);
  }
  room.addEventListener('pointermove', e => {
    if (!start || !e.isPrimary) return;
    const dx = e.clientX - start[0];
    if (Math.abs(dx) < 7 || Math.abs(dx) < Math.abs(e.clientY - start[1])) return;
    room.classList.add('dragging');
    room.setPointerCapture(e.pointerId);
    if (showcase) positionHangers(current - dx / dragStep());
    else room.style.setProperty('--drag', Math.max(-48, Math.min(48, dx * .38)) + 'px');
  });
  room.addEventListener('dragstart', e => e.preventDefault());
  room.addEventListener('pointercancel', releaseDrag);
  room.addEventListener('pointerup', e => {
    if (!start) return;
    const dx = e.clientX - start[0], dy = e.clientY - start[1];
    releaseDrag();
    if (Math.abs(dx) > 35 && Math.abs(dx) > 1.5 * Math.abs(dy)) {
      const steps = showcase ? Math.max(1, Math.round(Math.abs(dx) / dragStep())) : 1;
      select(current - Math.sign(dx) * steps);
      suppressClickUntil = performance.now() + 350;
    }
  });
  room.addEventListener('click', e => {
    const index = pieces.indexOf(e.target.closest('.rack-piece'));
    if (index < 0 || (index === current && performance.now() >= suppressClickUntil)) return;
    e.stopPropagation();
    if (performance.now() >= suppressClickUntil) select(index);
  }, true);
  rack.addEventListener('keydown', e => {
    if (!['ArrowLeft','ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    select(current + (e.key === 'ArrowLeft' ? -1 : 1));
    pieces[current].querySelector('button').focus({preventScroll:true});
  });
  select(0);
  controls.hidden = false;
  rack.classList.add('rack-ready');
  requestAnimationFrame(() => requestAnimationFrame(() => rack.classList.add('rack-interactive')));
}
document.querySelectorAll('.rack').forEach(installRack);

const lookCards = document.querySelectorAll('.look-card');
if (lookCards.length && 'IntersectionObserver' in window) {
  const incoming = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('on-display');
      incoming.unobserve(entry.target);
    }
  }, { threshold: .12 });
  lookCards.forEach(card => incoming.observe(card));
}

// The published number stays in the reading order while its visual copy counts.
function installResultCounters() {
  if (!('IntersectionObserver' in window)) return;
  const nodes = document.querySelectorAll('.result-number');
  if (!nodes.length) return;
  const counters = new Map();
  for (const node of nodes) {
    const published = document.createElement('span');
    published.textContent = node.textContent;
    const digits = document.createElement('span');
    digits.setAttribute('aria-hidden', 'true');
    digits.textContent = published.textContent;
    node.replaceChildren(published, digits);
    const chart = node.closest('.graphic');
    counters.set(node, {
      digits, end:Number(published.textContent), start:Number(node.dataset.from), frame:0,
      bar:chart?.querySelector('.outcome .chart-track i'), maximum:Number(chart?.dataset.maximum)
    });
  }
  function render(counter, value) {
    const text = String(Math.round(value));
    if (counter.digits.textContent !== text) counter.digits.textContent = text;
    if (counter.bar) counter.bar.style.setProperty('--share', value / counter.maximum);
  }
  function finish(counter) {
    cancelAnimationFrame(counter.frame);
    counter.frame = 0;
    render(counter, counter.end);
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const counter = counters.get(entry.target);
      if (!entry.isIntersecting || reducedMotion.matches) {
        finish(counter);
        continue;
      }
      const began = performance.now();
      function tick(now) {
        const t = Math.max(0, Math.min(1, (now - began) / 1400));
        const eased = t * (2 - t);
        render(counter, counter.start + (counter.end - counter.start) * eased);
        if (t < 1) counter.frame = requestAnimationFrame(tick);
      }
      tick(began);
    }
  });
  function configure() {
    observer.disconnect();
    for (const [node, counter] of counters) {
      finish(counter);
      if (!reducedMotion.matches) observer.observe(node);
    }
  }
  configure();
  reducedMotion.addEventListener('change', configure);
}
installResultCounters();
