export class UIManager {
  constructor() {
    this.elements = {
      day: document.getElementById('day'),
      level: document.getElementById('level'),
      xp: document.getElementById('xp'),
      xpNext: document.getElementById('xp-next'),
      season: document.getElementById('season'),
      sleepBtn: document.getElementById('sleep-btn'),
      explorationsLeft: document.getElementById('explorations-left'),
      explorationMax: document.getElementById('exploration-max'),
      rulerName: document.getElementById('ruler-name'),
      rulerAge: document.getElementById('ruler-age'),
      rulerTraits: document.getElementById('ruler-traits')
    };
  }

  updateDay(day) {
    if (this.elements.day) {
      this.elements.day.textContent = day;
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
}

export const uiManager = new UIManager();
