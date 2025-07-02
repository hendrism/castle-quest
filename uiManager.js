export class UIManager {
  constructor() {
    this.elements = {
      month: document.getElementById('month'),
      level: document.getElementById('level'),
      xp: document.getElementById('xp'),
      xpNext: document.getElementById('xp-next'),
      morale: document.getElementById('morale'),
      season: document.getElementById('season'),
      nextMonthBtn: document.getElementById('next-month-btn'),
      explorationsLeft: document.getElementById('explorations-left'),
      explorationMax: document.getElementById('exploration-max'),
      rulerName: document.getElementById('ruler-name'),
      rulerAge: document.getElementById('ruler-age'),
      rulerTraits: document.getElementById('ruler-traits'),
      xpCurrent: document.getElementById('xp-current'),
      xpRequired: document.getElementById('xp-required'),
      levelDetailed: document.getElementById('level-detailed')
    };
  }

  pulse(el) {
    if (!el) return;
    const target = el.closest('.stat-card') || el;
    target.classList.add('pulse');
    setTimeout(() => target.classList.remove('pulse'), 500);
  }

  updateRulerYears(years) {
  const el = document.getElementById('ruler-years');
  if (el) el.textContent = years;
}

  updateMonth(month) {
    if (this.elements.month) {
      this.elements.month.textContent = month;
      this.pulse(this.elements.month);
    }
  }

  updateLevel(level) {
    if (this.elements.level) {
      this.elements.level.textContent = level;
      this.pulse(this.elements.level);
    }
    if (this.elements.levelDetailed) {
      this.elements.levelDetailed.textContent = level;
      this.pulse(this.elements.levelDetailed);
    }
  }

  updateXP(xp, next) {
    if (this.elements.xp) this.elements.xp.textContent = xp;
    if (this.elements.xpNext) this.elements.xpNext.textContent = next;
    if (this.elements.xpCurrent) this.elements.xpCurrent.textContent = xp;
    if (this.elements.xpRequired) this.elements.xpRequired.textContent = next;
    const prog = document.getElementById('xp-progress');
    if (prog) {
      prog.max = next;
      prog.value = xp;
      prog.classList.add('shimmer');
      this.pulse(prog);
      setTimeout(() => prog.classList.remove('shimmer'), 1000);
    }
  }

  updateSeason(text) {
    if (this.elements.season) this.elements.season.textContent = text;
  }

  updateMorale(val) {
    if (this.elements.morale) {
      let face = '😀';
      if (val < 25) face = '😠';
      else if (val < 50) face = '😟';
      else if (val < 75) face = '🙂';
      this.elements.morale.textContent = `${face} ${val}`;
      this.pulse(this.elements.morale);
    }
  }
}

export const uiManager = new UIManager();
