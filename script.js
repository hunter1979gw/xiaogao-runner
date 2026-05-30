document.addEventListener('DOMContentLoaded', () => {

  // ===== 打卡系统 =====
  const STORAGE_KEY = 'xiaogao_checkins';
  const OWNER_NAME = '想PB的小高';

  const sampleData = [
    { name: OWNER_NAME, date: '2026-05-25', km: 5.0, isOwner: true },
    { name: OWNER_NAME, date: '2026-05-26', km: 8.0, isOwner: true },
    { name: OWNER_NAME, date: '2026-05-27', km: 3.5, isOwner: true },
    { name: OWNER_NAME, date: '2026-05-28', km: 10.0, isOwner: true },
    { name: OWNER_NAME, date: '2026-05-29', km: 6.0, isOwner: true },
    { name: '跑步小白', date: '2026-05-26', km: 3.0, isOwner: false },
    { name: '奔跑的风', date: '2026-05-27', km: 5.5, isOwner: false },
    { name: '追梦人', date: '2026-05-28', km: 7.0, isOwner: false },
    { name: '跑步小白', date: '2026-05-29', km: 4.2, isOwner: false },
    { name: '大正粉丝', date: '2026-05-29', km: 6.8, isOwner: false },
    { name: OWNER_NAME, date: '2026-05-30', km: 5.5, isOwner: true },
  ];

  function loadCheckins() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleData));
      return [...sampleData];
    }
    return JSON.parse(stored);
  }

  function saveCheckins(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  let checkins = loadCheckins();

  // 设置默认日期为今天
  const dateInput = document.getElementById('checkinDate');
  dateInput.value = new Date().toISOString().split('T')[0];

  // 打卡提交
  document.getElementById('btnCheckin').addEventListener('click', () => {
    const nameInput = document.getElementById('checkinName');
    const kmInput = document.getElementById('checkinKm');
    const isOwner = document.getElementById('isOwner').checked;
    const name = isOwner ? OWNER_NAME : (nameInput.value.trim() || '匿名跑者');
    const date = dateInput.value;
    const km = parseFloat(kmInput.value);

    if (!date || !km || km <= 0) {
      shakeBtn();
      return;
    }

    checkins.push({ name, date, km, isOwner });
    saveCheckins(checkins);

    // 成功动画
    const btn = document.getElementById('btnCheckin');
    btn.classList.add('success');
    btn.innerHTML = '<span>✅ 打卡成功！</span>';
    setTimeout(() => {
      btn.classList.remove('success');
      btn.innerHTML = '<span>🏃 打卡签到</span>';
    }, 1500);

    kmInput.value = '';
    renderCheckinData();
  });

  function shakeBtn() {
    const btn = document.getElementById('btnCheckin');
    btn.style.animation = 'shake 0.4s ease';
    setTimeout(() => btn.style.animation = '', 400);
  }

  // 切换博主模式
  document.getElementById('isOwner').addEventListener('change', function() {
    const nameInput = document.getElementById('checkinName');
    if (this.checked) {
      nameInput.value = OWNER_NAME;
      nameInput.disabled = true;
      nameInput.style.opacity = '0.5';
    } else {
      nameInput.value = '';
      nameInput.disabled = false;
      nameInput.style.opacity = '1';
    }
  });

  function renderCheckinData() {
    const totalKm = checkins.reduce((sum, c) => sum + c.km, 0);
    const persons = new Set(checkins.map(c => c.name)).size;
    const today = new Date().toISOString().split('T')[0];

    // 计算连续天数
    const ownerDates = [...new Set(checkins.filter(c => c.isOwner).map(c => c.date))].sort().reverse();
    let streak = 0;
    let checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const ds = checkDate.toISOString().split('T')[0];
      if (ownerDates.includes(ds)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      } else {
        break;
      }
    }

    // 动画计数器
    animateCounter('totalKm', totalKm, 1);
    animateCounter('checkinCount', checkins.length, 0);
    animateCounter('personCount', persons, 0);
    animateCounter('streakDays', streak, 0);

    // 环形进度条 (目标1000km)
    const progress = Math.min(totalKm / 1000, 1);
    const circumference = 553;
    const offset = circumference * (1 - progress);
    document.querySelector('.track-progress').style.strokeDashoffset = offset;

    // 柱状图
    renderChart();

    // 记录列表
    renderRecords();
  }

  function animateCounter(id, target, decimals) {
    const el = document.getElementById(id);
    const duration = 1200;
    const start = performance.now();
    const startVal = parseFloat(el.textContent) || 0;

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (target - startVal) * eased;
      el.textContent = current.toFixed(decimals);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function renderChart() {
    const container = document.getElementById('chartBars');
    container.innerHTML = '';

    const days = [];
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().split('T')[0], dayName: dayNames[d.getDay()] });
    }

    let maxKm = 0;
    const dayData = days.map(d => {
      const ownerKm = checkins.filter(c => c.date === d.date && c.isOwner).reduce((s, c) => s + c.km, 0);
      const otherKm = checkins.filter(c => c.date === d.date && !c.isOwner).reduce((s, c) => s + c.km, 0);
      const total = ownerKm + otherKm;
      if (total > maxKm) maxKm = total;
      return { ...d, ownerKm, otherKm, total };
    });

    dayData.forEach((d, i) => {
      const group = document.createElement('div');
      group.className = 'bar-group';

      const barWrapper = document.createElement('div');
      barWrapper.style.cssText = 'width:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;flex:1;position:relative;';

      if (d.total > 0) {
        const totalH = maxKm > 0 ? (d.total / maxKm) * 80 : 0;

        if (d.otherKm > 0) {
          const otherBar = document.createElement('div');
          otherBar.className = 'bar other';
          const otherH = (d.otherKm / d.total) * totalH;
          otherBar.style.height = '0%';
          setTimeout(() => { otherBar.style.height = otherH + '%'; }, i * 100);
          barWrapper.appendChild(otherBar);
        }

        if (d.ownerKm > 0) {
          const ownerBar = document.createElement('div');
          ownerBar.className = 'bar owner';
          const ownerH = (d.ownerKm / d.total) * totalH;
          ownerBar.style.height = '0%';
          const valEl = document.createElement('div');
          valEl.className = 'bar-val';
          valEl.textContent = d.total.toFixed(1);
          ownerBar.appendChild(valEl);
          setTimeout(() => { ownerBar.style.height = ownerH + '%'; }, i * 100 + 50);
          barWrapper.appendChild(ownerBar);
        }

        if (d.ownerKm === 0 && d.otherKm > 0) {
          const lastBar = barWrapper.lastChild;
          const valEl = document.createElement('div');
          valEl.className = 'bar-val';
          valEl.textContent = d.total.toFixed(1);
          lastBar.appendChild(valEl);
        }
      }

      group.appendChild(barWrapper);

      const dayLabel = document.createElement('div');
      dayLabel.className = 'bar-day';
      dayLabel.textContent = d.dayName;
      group.appendChild(dayLabel);

      container.appendChild(group);
    });
  }

  function renderRecords() {
    const container = document.getElementById('recordsList');
    const countEl = document.getElementById('recordCount');
    countEl.textContent = checkins.length;

    const sorted = [...checkins].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.km - a.km;
    });

    if (sorted.length === 0) {
      container.innerHTML = '<div class="empty-records">还没有打卡记录，快来第一个签到吧！🏃‍♀️</div>';
      return;
    }

    container.innerHTML = sorted.map(record => {
      const cls = record.isOwner ? 'record-item owner' : 'record-item';
      const emoji = record.isOwner ? '⭐' : '🏃';
      return `
        <div class="${cls}">
          <div class="record-avatar">${emoji}</div>
          <div class="record-detail">
            <div class="record-name">${escapeHtml(record.name)}</div>
            <div class="record-date-info">${record.date}</div>
          </div>
          <div class="record-km">${record.km.toFixed(1)} <span class="record-unit">km</span></div>
        </div>
      `;
    }).join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 初始化打卡数据
  renderCheckinData();

  // ===== Tab切换 =====
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.remove('active');
        if (c.id === `tab-${target}`) c.classList.add('active');
      });
    });
  });

  // ===== 关注按钮 =====
  let followed = false;
  document.querySelector('.btn-follow').addEventListener('click', function() {
    followed = !followed;
    if (followed) {
      this.innerHTML = '<span>✓ 已关注</span>';
      this.style.background = 'var(--bg-card)';
      this.style.border = '1px solid var(--border)';
    } else {
      this.innerHTML = '<span>+ 关注</span>';
      this.style.background = 'var(--gradient)';
      this.style.border = 'none';
    }
  });

  // ===== 数字动画 =====
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const display = el.dataset.display;
        if (display) {
          animateToDisplay(el, display);
        } else {
          const target = parseInt(el.dataset.target) || 0;
          animateStatNum(el, target);
        }
        statObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-num[data-target]').forEach(el => statObserver.observe(el));

  function animateStatNum(el, target) {
    const duration = 1200;
    const start = performance.now();
    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target;
    }
    requestAnimationFrame(update);
  }

  function animateToDisplay(el, display) {
    const duration = 1000;
    const start = performance.now();
    const chars = display.split('');
    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      if (progress < 1) {
        const revealed = Math.floor(progress * chars.length);
        el.textContent = chars.slice(0, revealed + 1).join('');
        requestAnimationFrame(update);
      } else {
        el.textContent = display;
      }
    }
    requestAnimationFrame(update);
  }

  // ===== 入场动画 =====
  const animObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        animObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.highlight-card, .gear-card, .daily-card, .quote-card, .journey-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    animObserver.observe(el);
  });

  // shake动画样式
  const style = document.createElement('style');
  style.textContent = `
    .visible { opacity: 1 !important; transform: translateY(0) !important; }
    @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
  `;
  document.head.appendChild(style);
});
