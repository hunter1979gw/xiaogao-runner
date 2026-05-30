document.addEventListener('DOMContentLoaded', () => {

  // ===== 打卡系统 =====
  const STORAGE_KEY = 'xiaogao_run_checkins_v2';
  const OWNER = '想PB的小高';

  const seed = [
    { name: OWNER, date: '2026-05-24', km: 6.0, isOwner: true },
    { name: OWNER, date: '2026-05-25', km: 8.5, isOwner: true },
    { name: OWNER, date: '2026-05-26', km: 5.0, isOwner: true },
    { name: OWNER, date: '2026-05-27', km: 12.0, isOwner: true },
    { name: OWNER, date: '2026-05-28', km: 4.5, isOwner: true },
    { name: OWNER, date: '2026-05-29', km: 8.0, isOwner: true },
    { name: OWNER, date: '2026-05-30', km: 6.5, isOwner: true },
    { name: '奔跑的风', date: '2026-05-25', km: 5.0, isOwner: false },
    { name: '追梦人', date: '2026-05-26', km: 8.0, isOwner: false },
    { name: '跑步小白', date: '2026-05-27', km: 3.5, isOwner: false },
    { name: '大正粉丝', date: '2026-05-28', km: 10.0, isOwner: false },
    { name: '奔跑的风', date: '2026-05-29', km: 6.5, isOwner: false },
    { name: '跑步小白', date: '2026-05-30', km: 4.0, isOwner: false },
  ];

  let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || seed;

  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  // 默认今天
  document.getElementById('checkinDate').value = new Date().toISOString().split('T')[0];

  // 博主模式切换
  document.getElementById('isOwner').addEventListener('change', function () {
    const nameInput = document.getElementById('checkinName');
    if (this.checked) {
      nameInput.value = OWNER;
      nameInput.disabled = true;
    } else {
      nameInput.value = '';
      nameInput.disabled = false;
    }
  });

  // 打卡提交
  document.getElementById('btnCheckin').addEventListener('click', () => {
    const name = document.getElementById('isOwner').checked
      ? OWNER
      : (document.getElementById('checkinName').value.trim() || '匿名跑者');
    const date = document.getElementById('checkinDate').value;
    const km = parseFloat(document.getElementById('checkinKm').value);
    const isOwner = document.getElementById('isOwner').checked;

    if (!date || !km || km <= 0) {
      const btn = document.getElementById('btnCheckin');
      btn.style.animation = 'shake .4s ease';
      setTimeout(() => btn.style.animation = '', 400);
      return;
    }

    data.push({ name, date, km, isOwner });
    save();
    document.getElementById('checkinKm').value = '';

    const btn = document.getElementById('btnCheckin');
    btn.classList.add('success');
    btn.textContent = '✅ 打卡成功！';
    setTimeout(() => {
      btn.classList.remove('success');
      btn.textContent = '打卡签到 →';
    }, 1500);

    render();
  });

  function render() {
    const total = data.reduce((s, r) => s + r.km, 0);
    const persons = new Set(data.map(r => r.name)).size;
    const checkinCount = data.length;

    // 连续天数（小高）
    const ownerDates = [...new Set(data.filter(r => r.isOwner).map(r => r.date))].sort().reverse();
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const ds = d.toISOString().split('T')[0];
      if (ownerDates.includes(ds)) { streak++; d.setDate(d.getDate() - 1); }
      else if (i === 0) { d.setDate(d.getDate() - 1); }
      else break;
    }

    // 数字动画
    animateNum('totalKmDisplay', total, 1);
    animateNum('checkinCount', checkinCount, 0);
    animateNum('personCount', persons, 0);
    animateNum('streakDays', streak, 0);

    // 跑道进度
    const pct = Math.min(total / 1000, 1);
    const totalLen = 1320;
    const offset = totalLen * (1 - pct);
    document.querySelector('#trackProgress').style.strokeDashoffset = offset;
    document.getElementById('trackPct').textContent = (pct * 100).toFixed(1) + '%';

    // 跑者位置（沿跑道SVG路径）
    const runner = document.getElementById('runnerDot');
    const emojiEl = document.getElementById('runnerEmoji');
    // 简化：线性映射到矩形跑道位置
    const angle = pct * 2 * Math.PI;
    const cx = 300 + 270 * Math.cos(angle - Math.PI / 2);
    const cy = 100 + 80 * Math.sin(angle - Math.PI / 2);
    runner.setAttribute('cx', cx);
    runner.setAttribute('cy', cy);
    emojiEl.setAttribute('x', cx - 7);
    emojiEl.setAttribute('y', cy + 5);

    renderChart();
    renderRecords();
  }

  function animateNum(id, target, dec) {
    const el = document.getElementById(id);
    const start = performance.now();
    const from = parseFloat(el.textContent) || 0;
    const dur = 1200;
    const tick = now => {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = (from + (target - from) * ease).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(dec);
    };
    requestAnimationFrame(tick);
  }

  function renderChart() {
    const container = document.getElementById('chartContainer');
    container.innerHTML = '';

    const days = [];
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().split('T')[0], label: dayNames[d.getDay()] });
    }

    const maxKm = Math.max(...days.map(d => {
      const ownerKm = data.filter(r => r.date === d.date && r.isOwner).reduce((s, r) => s + r.km, 0);
      const otherKm = data.filter(r => r.date === d.date && !r.isOwner).reduce((s, r) => s + r.km, 0);
      return ownerKm + otherKm;
    }), 1);

    days.forEach((d, i) => {
      const ownerKm = data.filter(r => r.date === d.date && r.isOwner).reduce((s, r) => s + r.km, 0);
      const otherKm = data.filter(r => r.date === d.date && !r.isOwner).reduce((s, r) => s + r.km, 0);
      const total = ownerKm + otherKm;
      const totalH = (total / maxKm) * 76;
      const ownerH = ownerKm ? (ownerKm / total) * totalH : 0;
      const otherH = otherKm ? (otherKm / total) * totalH : 0;

      const wrap = document.createElement('div');
      wrap.className = 'bar-wrap';

      const valEl = document.createElement('div');
      valEl.className = 'bar-val';
      valEl.textContent = total > 0 ? total.toFixed(1) : '';
      wrap.appendChild(valEl);

      const stack = document.createElement('div');
      stack.className = 'bar-stack';
      stack.style.height = totalH + 'px';

      if (otherKm > 0) {
        const b = document.createElement('div');
        b.className = 'bar-seg others-bar';
        b.style.height = '0px';
        stack.appendChild(b);
        setTimeout(() => b.style.height = otherH + 'px', i * 80);
      }
      if (ownerKm > 0) {
        const b = document.createElement('div');
        b.className = 'bar-seg owner-bar';
        b.style.height = '0px';
        stack.appendChild(b);
        setTimeout(() => b.style.height = ownerH + 'px', i * 80 + 40);
      }

      wrap.appendChild(stack);

      const dayEl = document.createElement('div');
      dayEl.className = 'bar-day';
      dayEl.textContent = d.label;
      wrap.appendChild(dayEl);

      container.appendChild(wrap);
    });
  }

  function renderRecords() {
    const list = document.getElementById('recordsList');
    const countEl = document.getElementById('recordCount');
    countEl.textContent = data.length;

    const sorted = [...data].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.km - a.km;
    });

    if (sorted.length === 0) {
      list.innerHTML = '<p class="empty-tip">还没有打卡记录，快来第一个签到！</p>';
      return;
    }

    list.innerHTML = sorted.map(r => {
      const cls = r.isOwner ? 'record-item owner-record' : 'record-item';
      const em = r.isOwner ? '⭐' : '🏃';
      return `
        <div class="${cls}">
          <div class="record-avatar">${em}</div>
          <div style="flex:1;min-width:0">
            <div class="record-name">${escHtml(r.name)}</div>
            <div class="record-date">${r.date}</div>
          </div>
          <div>
            <span class="record-km-val">${r.km.toFixed(1)}</span>
            <span class="record-km-unit"> km</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function escHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  render();

  // ===== 入场动画 =====
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
    .reveal { opacity:0; transform:translateY(24px); transition:opacity .6s ease, transform .6s ease; }
    .reveal.visible { opacity:1; transform:translateY(0); }
  `;
  document.head.appendChild(style);

  const obs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 60);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.video-card, .gallery-item, .quote-big, .checkin-form').forEach(el => {
    el.classList.add('reveal');
    obs.observe(el);
  });
});
