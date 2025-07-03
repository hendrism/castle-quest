export let debugMode = false;
export const eventLog = [];

import { gameState } from './gameState.js';
import { rollDice } from './dice.js';
import { BUILDING_TYPES } from './data/buildings.js';

export function setDebugMode(value) {
  debugMode = value;
  const panel = document.getElementById('debug-panel');
  if (panel) {
    panel.style.display = debugMode ? 'block' : 'none';
  }
  console.log('Debug mode:', debugMode ? 'enabled' : 'disabled');
}

export function logEvent(description, data = null) {
  const entry = {
    timestamp: new Date().toLocaleTimeString(),
    description,
    data
  };
  
  // Always add to event log
  eventLog.push(entry);
  if (eventLog.length > 200) eventLog.shift();
  
  // Only log to console and update display if debug mode is on
  if (debugMode) {
    console.log(`[${entry.timestamp}] ${description}`, data || '');
    updateLogDisplay();
  }
}

function updateLogDisplay() {
  const logArea = document.getElementById('debug-log');
  if (!logArea) return;
  
  const entries = eventLog.slice(-50);
  logArea.textContent = entries
    .map(e => `[${e.timestamp}] ${e.description}` + (e.data ? ` ${JSON.stringify(e.data)}` : ''))
    .join('\n');
  logArea.scrollTop = logArea.scrollHeight;
}

export function printGameState() {
  console.log('=== CURRENT GAME STATE ===');
  console.log(JSON.parse(JSON.stringify(gameState)));
  logEvent('Game state printed to console');
}

export function copyLog() {
  const logData = JSON.stringify(eventLog, null, 2);
  navigator.clipboard.writeText(logData)
    .then(() => {
      logEvent('Event log copied to clipboard');
      showToast('Debug log copied to clipboard!');
    })
    .catch(err => {
      console.error('Copy failed', err);
      logEvent('Failed to copy log to clipboard', { error: err.message });
    });
}

export function runTestScenario() {
  logEvent('=== TEST SCENARIO STARTED ===');
  
  // Roll dice
  const roll = rollDice();
  logEvent(`Rolled a ${roll}`, { roll });

  // Try to build a farm
  const farm = { id: Date.now(), level: 'basic' };
  gameState.settlement.farms.push(farm);
  logEvent('Built Farm', { id: farm.id, level: farm.level });

  // Try to upgrade the farm
  const nextLevel = BUILDING_TYPES.farm.levels[farm.level].upgradeTo;
  if (nextLevel) {
    farm.level = nextLevel;
    logEvent('Upgraded Farm', { id: farm.id, newLevel: farm.level });
  } else {
    logEvent('Farm already at max level', { id: farm.id });
  }

  // Add some resources
  gameState.resources.wood += 10;
  gameState.resources.stone += 5;
  logEvent('Added test resources', { wood: 10, stone: 5 });

  logEvent('=== TEST SCENARIO COMPLETED ===');
  
  // Refresh the UI if the main game has that function
  if (window.game && typeof window.game.refreshGameInterface === 'function') {
    window.game.refreshGameInterface();
    logEvent('UI refreshed');
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }
}

function injectCSS() {
  const css = `
    #debug-panel {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.9);
      color: #f0f0f0;
      font-family: 'Courier New', Monaco, monospace;
      padding: 12px;
      border: 2px solid #5bc0de;
      border-radius: 8px;
      width: 300px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      font-size: 12px;
    }
    
    #debug-panel.collapsed {
      padding: 8px;
      width: auto;
    }
    
    #debug-panel.collapsed .debug-content {
      display: none;
    }
    
    #debug-toggle {
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border: 1px solid #5bc0de;
      border-radius: 4px;
      cursor: pointer;
      width: 100%;
      padding: 8px;
      font-size: 12px;
      font-weight: bold;
      font-family: inherit;
      transition: background 0.2s ease;
    }
    
    #debug-toggle:hover {
      background: rgba(91, 192, 222, 0.2);
    }
    
    #debug-panel.collapsed #debug-toggle {
      width: auto;
      font-size: 11px;
      padding: 6px 12px;
    }
    
    #debug-log {
      height: 150px;
      overflow-y: auto;
      background: rgba(255, 255, 255, 0.1);
      margin: 12px 0;
      padding: 8px;
      white-space: pre-wrap;
      font-size: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      line-height: 1.3;
      font-family: inherit;
    }
    
    #debug-log::-webkit-scrollbar {
      width: 6px;
    }
    
    #debug-log::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }
    
    #debug-log::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }
    
    #debug-log::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
    
    .debug-btn {
      display: block;
      width: 100%;
      margin-bottom: 6px;
      padding: 8px;
      background: rgba(91, 192, 222, 0.3);
      color: white;
      border: 1px solid #5bc0de;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      font-weight: bold;
      font-family: inherit;
      transition: all 0.2s ease;
    }
    
    .debug-btn:hover {
      background: rgba(91, 192, 222, 0.5);
      transform: translateY(-1px);
    }
    
    .debug-btn:active {
      transform: scale(0.98);
    }
    
    .debug-btn:last-child {
      margin-bottom: 0;
    }
    
    .debug-info {
      font-size: 10px;
      opacity: 0.7;
      margin-bottom: 8px;
      text-align: center;
    }
  `;
  
  const styleSheet = document.createElement('style');
  styleSheet.textContent = css;
  document.head.appendChild(styleSheet);
}

function createDebugHTML() {
  const debugPanel = document.createElement('div');
  debugPanel.id = 'debug-panel';
  debugPanel.className = 'collapsed';
  
  debugPanel.innerHTML = `
    <button id="debug-toggle">🐞 Debug Panel</button>
    <div class="debug-content">
      <div class="debug-info">Ctrl+Shift+D to toggle</div>
      <pre id="debug-log"></pre>
      <button id="debug-test-btn" class="debug-btn">🎲 Run Test Scenario</button>
      <button id="debug-print-btn" class="debug-btn">📊 Print Game State</button>
      <button id="debug-copy-btn" class="debug-btn">📋 Copy Log</button>
    </div>
  `;
  
  document.body.appendChild(debugPanel);
  return debugPanel;
}

function setupDebugPanel() {
  console.log('Setting up debug panel...');
  
  // Inject CSS first
  injectCSS();
  
  // Create the HTML structure
  const panel = createDebugHTML();
  
  // Enable debug mode by default for testing
  setDebugMode(true);
  
  const toggle = document.getElementById('debug-toggle');
  
  if (toggle) {
    toggle.addEventListener('click', () => {
      panel.classList.toggle('collapsed');
      const isCollapsed = panel.classList.contains('collapsed');
      logEvent(`Debug panel ${isCollapsed ? 'collapsed' : 'expanded'}`);
    });
  }

  // Setup button event listeners
  const testBtn = document.getElementById('debug-test-btn');
  const copyBtn = document.getElementById('debug-copy-btn');
  const printBtn = document.getElementById('debug-print-btn');

  if (testBtn) {
    testBtn.addEventListener('click', runTestScenario);
    logEvent('Test button event listener added');
  }
  
  if (copyBtn) {
    copyBtn.addEventListener('click', copyLog);
    logEvent('Copy button event listener added');
  }
  
  if (printBtn) {
    printBtn.addEventListener('click', printGameState);
    logEvent('Print button event listener added');
  }

  logEvent('Debug panel setup completed');
  updateLogDisplay();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupDebugPanel);
} else {
  setupDebugPanel();
}

// Add keyboard shortcut to toggle debug mode
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+D to toggle debug mode
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    e.preventDefault();
    setDebugMode(!debugMode);
    logEvent(`Debug mode toggled: ${debugMode ? 'ON' : 'OFF'}`);
  }
});

// Export functions for external use
window.debugUtils = {
  setDebugMode,
  logEvent,
  printGameState,
  copyLog,
  runTestScenario,
  getEventLog: () => eventLog
};