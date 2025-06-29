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
      rulerTraits: document.getElementById('ruler-traits')
    };
  }

  updateMonth(month) {
    if (this.elements.month) {
      this.elements.month.textContent = month;
    }
  }

  updateLevel(level) {
    if (this.elements.level) {
      this.elements.level.textContent = level;
    }
  }

  updateXP(xp, next) {
    if (this.elements.xp) this.elements.xp.textContent = xp;
    if (this.elements.xpNext) this.elements.xpNext.textContent = next;
  }

  updateSeason(text) {
    if (this.elements.season) this.elements.season.textContent = text;
  }

  updateMorale(val) {
    if (this.elements.morale) this.elements.morale.textContent = val;
  }
}

export const uiManager = new UIManager();
