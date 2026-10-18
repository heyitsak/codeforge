/**
 * ═══════════════════════════════════════════════════════════════════
 * CodeForge — Main Application Orchestrator
 * Handles view switching, keyboard shortcuts, command palette,
 * and wiring all modules together.
 * ═══════════════════════════════════════════════════════════════════
 */

import { AudioEngine } from './audio.js';
import { BlitzEngine } from './blitz.js';
import { MemoryVision } from './memory-vision.js';
import { RoadmapExplorer } from './roadmap.js';

class CodeForgeApp {
  constructor() {
    /** @type {string} Current active view */
    this.currentView = 'start';

    /** @type {AudioEngine} */
    this.audio = new AudioEngine();

    /** @type {BlitzEngine|null} */
    this.blitz = null;

    /** @type {MemoryVision|null} */
    this.memoryVision = null;

    /** @type {RoadmapExplorer|null} */
    this.roadmap = null;

    /** @type {boolean} Whether command palette is open */
    this.cmdkOpen = false;

    /** @type {number} Currently selected command palette index */
    this.cmdkSelectedIndex = 0;

    this.init();
  }

  /** Initialize the application */
  init() {
    this.bindNavigation();
    this.bindCommandPalette();
    this.bindGlobalKeys();
    this.bindStartScreen();
    this.bindSoundToggle();

    // Initialize modules lazily on first view
    this.initBlitz();
    this.initMemoryVision();
    this.initRoadmap();

    console.log('%c⚡ CodeForge Initialized', 'color: #F59E0B; font-size: 14px; font-weight: bold;');
  }

  // ─── Module Initialization ──────────────────────────────────────

  /** Initialize the Blitz engine */
  initBlitz() {
    const container = document.getElementById('drill-container');
    if (container) {
      this.blitz = new BlitzEngine(container, this.audio);
      // Wire up stats updates
      this.blitz.onStatsUpdate = (stats) => this.updateNavStats(stats);
    }
  }

  /** Initialize Memory Vision */
  initMemoryVision() {
    const container = document.getElementById('memory-vision-container');
    if (container) {
      this.memoryVision = new MemoryVision(container);
      this.memoryVision.init();
    }
  }

  /** Initialize Roadmap Explorer */
  initRoadmap() {
    const container = document.getElementById('roadmap-container');
    if (container) {
      this.roadmap = new RoadmapExplorer(container);
      this.roadmap.init();
    }
  }

  // ─── Navigation ─────────────────────────────────────────────────

  /** Bind navigation link click handlers */
  bindNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-view]');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        const view = link.dataset.view;
        this.switchView(view);
      });
    });
  }

  /**
   * Switch to a different view
   * @param {string} viewName - The view identifier
   */
  switchView(viewName) {
    if (viewName === this.currentView) return;

    // Deactivate all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    // Activate target view
    const targetView = document.getElementById(`view-${viewName}`);
    const targetLink = document.querySelector(`.nav-link[data-view="${viewName}"]`);

    if (targetView) {
      targetView.classList.add('active');
      // Re-trigger animation
      targetView.style.animation = 'none';
      targetView.offsetHeight; // Force reflow
      targetView.style.animation = '';
    }
    if (targetLink) targetLink.classList.add('active');

    this.currentView = viewName;

    // Close command palette if open
    if (this.cmdkOpen) this.closeCmdk();
  }

  // ─── Start Screen ──────────────────────────────────────────────

  /** Bind start screen buttons */
  bindStartScreen() {
    const startBlitzBtn = document.getElementById('start-blitz-btn');
    const startExploreBtn = document.getElementById('start-explore-btn');
    const blitzStartBtn = document.getElementById('blitz-start-btn');

    if (startBlitzBtn) {
      startBlitzBtn.addEventListener('click', () => {
        this.switchView('blitz');
        // Auto-start after a brief delay
        setTimeout(() => {
          if (this.blitz) this.blitz.start();
        }, 400);
      });
    }

    if (startExploreBtn) {
      startExploreBtn.addEventListener('click', () => {
        this.switchView('roadmap');
      });
    }

    if (blitzStartBtn) {
      blitzStartBtn.addEventListener('click', () => {
        if (this.blitz) this.blitz.start();
      });
    }

    // Feature cards click
    document.querySelectorAll('.feature-card[data-view]').forEach(card => {
      card.addEventListener('click', () => {
        this.switchView(card.dataset.view);
      });
    });
  }

  // ─── Sound Toggle ──────────────────────────────────────────────

  /** Bind sound toggle button */
  bindSoundToggle() {
    const btn = document.getElementById('sound-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const enabled = this.audio.toggle();
        btn.textContent = enabled ? '🔊' : '🔇';
        btn.classList.toggle('active', enabled);
        if (enabled) this.audio.playKeystroke();
      });
    }
  }

  // ─── Nav Stats ─────────────────────────────────────────────────

  /**
   * Update streak and ELO in the nav bar
   * @param {{streak: number, elo: number}} stats
   */
  updateNavStats(stats) {
    const streakEl = document.getElementById('streak-count');
    const eloEl = document.getElementById('elo-count');
    if (streakEl && stats.streak !== undefined) streakEl.textContent = stats.streak;
    if (eloEl && stats.elo !== undefined) eloEl.textContent = stats.elo;
  }

  // ─── Command Palette (Cmd+K / Ctrl+K) ──────────────────────────

  /** Bind command palette interactions */
  bindCommandPalette() {
    const overlay = document.getElementById('cmdk-overlay');
    const input = document.getElementById('cmdk-input');
    const trigger = document.getElementById('cmdk-trigger');
    const list = document.getElementById('cmdk-list');

    if (trigger) {
      trigger.addEventListener('click', () => this.openCmdk());
    }

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeCmdk();
      });
    }

    if (input) {
      input.addEventListener('input', () => this.filterCmdk(input.value));
      input.addEventListener('keydown', (e) => this.handleCmdkKeydown(e));
    }
  }

  /** Open the command palette */
  openCmdk() {
    const overlay = document.getElementById('cmdk-overlay');
    const input = document.getElementById('cmdk-input');
    if (overlay) {
      overlay.classList.add('open');
      this.cmdkOpen = true;
      this.cmdkSelectedIndex = 0;
      this.updateCmdkSelection();
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 50);
      }
      this.filterCmdk('');
    }
  }

  /** Close the command palette */
  closeCmdk() {
    const overlay = document.getElementById('cmdk-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      this.cmdkOpen = false;
    }
  }

  /**
   * Filter command palette items
   * @param {string} query
   */
  filterCmdk(query) {
    const items = document.querySelectorAll('#cmdk-list .cmdk-item');
    const q = query.toLowerCase().trim();
    let visibleCount = 0;

    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      const match = !q || text.includes(q);
      item.style.display = match ? '' : 'none';
      if (match) visibleCount++;
    });

    this.cmdkSelectedIndex = 0;
    this.updateCmdkSelection();
  }

  /** Update visual selection in command palette */
  updateCmdkSelection() {
    const items = Array.from(document.querySelectorAll('#cmdk-list .cmdk-item'))
      .filter(i => i.style.display !== 'none');

    items.forEach((item, idx) => {
      item.classList.toggle('selected', idx === this.cmdkSelectedIndex);
    });
  }

  /**
   * Handle keydown events in command palette
   * @param {KeyboardEvent} e
   */
  handleCmdkKeydown(e) {
    const items = Array.from(document.querySelectorAll('#cmdk-list .cmdk-item'))
      .filter(i => i.style.display !== 'none');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.cmdkSelectedIndex = Math.min(this.cmdkSelectedIndex + 1, items.length - 1);
      this.updateCmdkSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.cmdkSelectedIndex = Math.max(this.cmdkSelectedIndex - 1, 0);
      this.updateCmdkSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = items[this.cmdkSelectedIndex];
      if (selected) this.executeCmdkAction(selected.dataset.action);
    } else if (e.key === 'Escape') {
      this.closeCmdk();
    }
  }

  /**
   * Execute a command palette action
   * @param {string} action - e.g. "view:blitz", "blitz:start", "sound:toggle"
   */
  executeCmdkAction(action) {
    if (!action) return;
    this.closeCmdk();

    const [type, target] = action.split(':');

    switch (type) {
      case 'view':
        this.switchView(target);
        break;
      case 'blitz':
        if (target === 'start') {
          this.switchView('blitz');
          setTimeout(() => { if (this.blitz) this.blitz.start(); }, 400);
        }
        break;
      case 'sound':
        if (target === 'toggle') {
          const btn = document.getElementById('sound-toggle');
          if (btn) btn.click();
        }
        break;
    }
  }

  // ─── Global Keyboard Shortcuts ─────────────────────────────────

  /** Bind global keyboard event listeners */
  bindGlobalKeys() {
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K → Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (this.cmdkOpen) {
          this.closeCmdk();
        } else {
          this.openCmdk();
        }
        return;
      }

      // Escape → Close command palette
      if (e.key === 'Escape' && this.cmdkOpen) {
        this.closeCmdk();
        return;
      }

      // Don't process shortcuts when typing in inputs
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // Escape from blitz
      if (e.key === 'Escape' && this.currentView === 'blitz' && this.blitz && this.blitz.isRunning) {
        this.blitz.stop();
        return;
      }
    });
  }
}

// ─── Boot ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.codeforge = new CodeForgeApp();
});
