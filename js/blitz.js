import { DRILLS } from './drills.js';
import { AudioEngine } from './audio.js';

/**
 * Lightweight syntax highlighter
 * @param {string} code - The code to highlight
 * @returns {string} - Highlighted HTML string
 */
function highlightCode(code) {
  if (!code) return '';
  
  const keywords = /\b(def|function|class|return|if|else|for|while|import|from|const|let|var|await|async|new|export|switch|case|break|continue|try|catch|finally|throw|typeof|instanceof)\b/g;
  const builtins = /\b(console|Math|Object|Array|String|Number|Boolean|Date|Promise|Error|window|document|Map|Set)\b/g;
  const numbers = /\b\d+(\.\d+)?\b/g;
  const operators = /([+\-*/%=<>!&|^~?:]+)/g;
  const functions = /\b([a-zA-Z_$][0-9a-zA-Z_$]*)\s*(?=\()/g;

  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  const placeholders = [];
  
  html = html.replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, (match) => {
    placeholders.push(`<span class="syn-string">${match}</span>`);
    return `___PLACEHOLDER_${placeholders.length - 1}___`;
  });
  
  html = html.replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, (match) => {
    placeholders.push(`<span class="syn-comment">${match}</span>`);
    return `___PLACEHOLDER_${placeholders.length - 1}___`;
  });

  html = html
    .replace(keywords, '<span class="syn-keyword">$1</span>')
    .replace(builtins, '<span class="syn-builtin">$1</span>')
    .replace(functions, '<span class="syn-function">$1</span>')
    .replace(numbers, '<span class="syn-number">$&</span>')
    .replace(operators, '<span class="syn-operator">$1</span>');
    
  html = html.replace(/___PLACEHOLDER_(\d+)___/g, (_, i) => placeholders[i]);
  html = html.replace(/___/g, '<span class="syn-blank">___</span>');
  
  return html;
}

export class BlitzEngine {
  constructor(containerEl, audioEngine) {
    this.containerEl = containerEl;
    this.audioEngine = audioEngine;
    
    this.currentDrill = null;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.elo = 1200;
    this.drillIndex = 0;
    this.drillQueue = [];
    this.timerInterval = null;
    this.timeRemaining = 0;
    this.isRunning = false;
    this.totalAnswered = 0;
    this.totalCorrect = 0;
    this.sessionStartTime = null;
    this.isShowingFeedback = false;
    
    /** @type {Function|null} Callback when stats update */
    this.onStatsUpdate = null;
    
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  start() {
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.elo = 1200;
    this.totalAnswered = 0;
    this.totalCorrect = 0;
    this.sessionStartTime = new Date();
    this.isRunning = true;
    this.isShowingFeedback = false;
    
    this.drillQueue = [...DRILLS].sort(() => Math.random() - 0.5);
    this.drillIndex = 0;
    
    document.addEventListener('keydown', this.handleKeyDown);
    
    this.renderLayout();
    this.nextDrill();
  }

  stop() {
    this.isRunning = false;
    this.clearTimer();
    document.removeEventListener('keydown', this.handleKeyDown);
    this.showSessionSummary();
  }

  renderLayout() {
    this.containerEl.innerHTML = `
      <div class="blitz-layout">
        <div class="blitz-main">
          <div id="drill-container"></div>
        </div>
        <div class="blitz-sidebar">
          <div id="timer-container" class="timer-ring-wrap">
            <svg class="timer-ring-svg" width="80" height="80">
              <circle class="timer-ring-bg" cx="40" cy="40" r="34" stroke-width="6" fill="none" />
              <circle class="timer-ring-progress" cx="40" cy="40" r="34" stroke-width="6" fill="none" stroke-dasharray="213.63" stroke-dashoffset="0" />
            </svg>
            <div class="timer-text">0.0</div>
          </div>
          <div id="stats-container" class="stats-card"></div>
        </div>
      </div>
      <div id="overlay-container"></div>
    `;
  }

  nextDrill() {
    if (this.drillIndex >= this.drillQueue.length) {
      this.stop();
      return;
    }
    
    this.isShowingFeedback = false;
    this.currentDrill = this.drillQueue[this.drillIndex++];
    this.timeRemaining = this.currentDrill.timeLimit || 10;
    
    this.renderStats();
    this.renderDrill(this.currentDrill);
    this.startTimer();
  }

  submitAnswer(answer) {
    if (!this.isRunning || this.isShowingFeedback) return;
    
    this.clearTimer();
    this.isShowingFeedback = true;
    this.totalAnswered++;
    
    const isCorrect = String(answer).trim() === String(this.currentDrill.correctAnswer).trim();
    
    if (isCorrect) {
      this.totalCorrect++;
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;
      
      const timeRatio = this.timeRemaining / (this.currentDrill.timeLimit || 10);
      const points = Math.round(100 + (100 * timeRatio)) * (1 + (this.streak * 0.1));
      this.score += Math.round(points);
      
      this.elo += Math.round(15 + (15 * timeRatio));
      
      try { this.audioEngine.playCorrect(); } catch(e) {}
    } else {
      this.streak = 0;
      this.elo -= 20;
      if (this.elo < 0) this.elo = 0;
      
      try { this.audioEngine.playWrong(); } catch(e) {}
    }
    
    this.renderStats();
    if (this.onStatsUpdate) this.onStatsUpdate({ streak: this.streak, elo: this.elo });
    this.showFeedback(isCorrect, this.currentDrill.correctAnswer, this.currentDrill.explanation);
    
    setTimeout(() => {
      if (this.isRunning && this.isShowingFeedback) {
        this.nextDrill();
      }
    }, 800);
  }

  startTimer() {
    this.clearTimer();
    const tickRate = 100;
    let lastSecond = Math.ceil(this.timeRemaining);
    
    this.timerInterval = setInterval(() => {
      this.timeRemaining -= tickRate / 1000;
      
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.renderTimer();
        this.submitAnswer('');
        return;
      }
      
      const currentSecond = Math.ceil(this.timeRemaining);
      
      if (currentSecond < lastSecond) {
        if (currentSecond > 3) {
          try { this.audioEngine.playTick(); } catch(e) {}
        }
        lastSecond = currentSecond;
      }
      
      const roundedRemaining = Math.round(this.timeRemaining * 10) / 10;
      if (roundedRemaining === 3.0) {
        try { this.audioEngine.playUrgent(); } catch(e) {}
      } else if (roundedRemaining < 3.0 && roundedRemaining > 0 && Math.round(this.timeRemaining * 10) % 5 === 0) {
        try { this.audioEngine.playTick(); } catch(e) {}
      }
      
      this.renderTimer();
    }, tickRate);
    
    this.renderTimer();
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  renderDrill(drill) {
    const container = document.getElementById('drill-container');
    let drillHtml = '';
    
    switch (drill.category) {
      case 'bug-spotter': drillHtml = this.renderBugSpotter(drill); break;
      case 'output-predictor': drillHtml = this.renderOutputPredictor(drill); break;
      case 'bigo-reflex': drillHtml = this.renderBigoReflex(drill); break;
      case 'syntax-fill': drillHtml = this.renderSyntaxFill(drill); break;
      case 'cli-reflex': drillHtml = this.renderCliReflex(drill); break;
      case 'pattern-match': drillHtml = this.renderPatternMatch(drill); break;
      default: drillHtml = `<div>Unknown drill category</div>`;
    }
    
    container.innerHTML = `
      <div class="drill-card">
        <div class="drill-card-header">
          <span class="badge-${drill.category} drill-category">${drill.category}</span>
          <span class="drill-level">Lvl ${drill.difficulty || 1}</span>
        </div>
        <div class="drill-card-body">
          <div class="drill-prompt">${drill.prompt}</div>
          ${drillHtml}
        </div>
      </div>
    `;
    
    this.attachDrillEvents(drill);
  }

  attachDrillEvents(drill) {
    if (drill.category === 'bug-spotter') {
      document.querySelectorAll('.code-line').forEach(el => {
        el.addEventListener('click', (e) => this.submitAnswer(e.currentTarget.dataset.line));
      });
    } else if (drill.category === 'output-predictor' || drill.category === 'pattern-match') {
      document.querySelectorAll('.answer-btn').forEach((el, index) => {
        el.addEventListener('click', () => this.submitAnswer(index + 1));
      });
    } else if (drill.category === 'bigo-reflex') {
      document.querySelectorAll('.bigo-btn').forEach(el => {
        el.addEventListener('click', (e) => this.submitAnswer(e.currentTarget.dataset.val));
      });
    } else if (drill.category === 'syntax-fill' || drill.category === 'cli-reflex') {
      const input = document.querySelector('.cli-input') || document.querySelector('.syntax-input');
      if (input) {
        input.focus();
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') this.submitAnswer(input.value);
        });
      }
    }
  }

  renderBugSpotter(drill) {
    const lines = drill.code.split('\n');
    let html = '<div class="code-block">';
    lines.forEach((line, i) => {
      const lineNum = i + 1;
      html += `<div class="code-line" data-line="${lineNum}"><span class="line-number">${lineNum}</span><span class="line-content">${highlightCode(line) || ' '}</span></div>`;
    });
    return html + '</div>';
  }

  renderOutputPredictor(drill) {
    let html = `<div class="code-block"><div class="line-content">${highlightCode(drill.code)}</div></div><div class="answer-options">`;
    drill.options.forEach((opt, i) => {
      html += `<button class="answer-btn" data-index="${i}"><span class="answer-key">${i + 1}</span>${opt}</button>`;
    });
    return html + '</div>';
  }

  renderBigoReflex(drill) {
    const options = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n^2)', 'O(2^n)'];
    let html = `<div class="code-block"><div class="line-content">${highlightCode(drill.code)}</div></div><div class="bigo-options">`;
    options.forEach(opt => html += `<button class="bigo-btn" data-val="${opt}">${opt}</button>`);
    return html + '</div>';
  }

  renderSyntaxFill(drill) {
    const codeWithInput = drill.code.replace('___', '<input type="text" class="syntax-input cli-input" autocomplete="off" />');
    return `<div class="code-block"><div class="line-content">${highlightCode(codeWithInput)}</div></div>`;
  }

  renderCliReflex(drill) {
    return `<div class="cli-input-wrap"><span class="cli-prompt-symbol">$</span><input type="text" class="cli-input" autocomplete="off" /></div>`;
  }

  renderPatternMatch(drill) {
    let html = '<div class="answer-options">';
    drill.options.forEach((opt, i) => {
      html += `<button class="answer-btn" data-index="${i}"><span class="answer-key">${i + 1}</span>${opt}</button>`;
    });
    return html + '</div>';
  }

  renderTimer() {
    const progressEl = document.querySelector('.timer-ring-progress');
    const textEl = document.querySelector('.timer-text');
    if (!progressEl || !textEl) return;
    
    const maxTime = this.currentDrill ? (this.currentDrill.timeLimit || 10) : 10;
    const ratio = this.timeRemaining / maxTime;
    progressEl.style.strokeDashoffset = (1 - ratio) * 213.63;
    textEl.textContent = this.timeRemaining.toFixed(1);
    
    progressEl.style.stroke = 'var(--emerald, #10b981)';
    if (this.timeRemaining <= 5) progressEl.style.stroke = 'var(--amber, #f59e0b)';
    if (this.timeRemaining <= 3) progressEl.style.stroke = 'var(--coral, #f43f5e)';
    if (this.timeRemaining <= 1.5) progressEl.style.stroke = 'var(--coral, #f43f5e)';
  }

  renderStats() {
    const container = document.getElementById('stats-container');
    if (!container) return;
    const accuracy = this.totalAnswered > 0 ? Math.round((this.totalCorrect / this.totalAnswered) * 100) : 0;
    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-item"><div class="stat-item-label">Score</div><div class="stat-item-value">${this.score}</div></div>
        <div class="stat-item"><div class="stat-item-label">Streak</div><div class="stat-item-value">${this.streak}🔥</div></div>
        <div class="stat-item"><div class="stat-item-label">Accuracy</div><div class="stat-item-value">${accuracy}%</div></div>
        <div class="stat-item"><div class="stat-item-label">ELO</div><div class="stat-item-value">${this.elo}</div></div>
      </div>
    `;
  }

  showFeedback(isCorrect, correctAnswer, explanation) {
    const colorClass = isCorrect ? 'correct' : 'wrong';
    
    const flash = document.getElementById('feedback-flash');
    if (flash) {
      flash.className = `feedback-flash ${colorClass}`;
      setTimeout(() => { flash.className = 'feedback-flash'; }, 400);
    }
    
    if (isCorrect && this.streak > 0 && this.streak % 5 === 0) {
      const combo = document.getElementById('combo-overlay');
      if (combo) {
        combo.textContent = `${this.streak}x COMBO!`;
        combo.style.color = this.streak >= 10 ? 'var(--amber)' : 'var(--emerald)';
        combo.classList.remove('show');
        void combo.offsetHeight;
        combo.classList.add('show');
        setTimeout(() => combo.classList.remove('show'), 700);
      }
      try { this.audioEngine.playCombo(this.streak); } catch(e) {}
    }
    
    const card = document.querySelector('.drill-card');
    if (card) {
      card.classList.add(`drill-${colorClass}`);
      const feedbackEl = document.createElement('div');
      feedbackEl.className = 'drill-feedback';
      feedbackEl.innerHTML = `
        <h4>${isCorrect ? '✅ Correct!' : '❌ Incorrect'}</h4>
        <p>${!isCorrect ? 'Answer: ' + correctAnswer + '<br>' : ''}${explanation || ''}</p>
        <p class="skip-hint" style="margin-top:8px;font-size:0.75rem;color:var(--text-ghost);">Press Space to continue...</p>
      `;
      card.appendChild(feedbackEl);
    }
  }

  showSessionSummary() {
    const container = document.getElementById('drill-container');
    const accuracy = this.totalAnswered > 0 ? Math.round((this.totalCorrect / this.totalAnswered) * 100) : 0;
    const duration = Math.round((new Date() - this.sessionStartTime) / 1000);
    const eloChange = this.elo - 1200;
    const eloSign = eloChange >= 0 ? '+' : '';
    
    container.innerHTML = `
      <div class="drill-card summary-card" style="text-align:center;padding:var(--space-8);">
        <h2 style="margin-bottom:var(--space-6);">🏆 Session Complete!</h2>
        <div class="stats-grid" style="max-width:400px;margin:0 auto;">
          <div class="stat-item"><div class="stat-item-label">Total Score</div><div class="stat-item-value" style="color:var(--amber);">${this.score}</div></div>
          <div class="stat-item"><div class="stat-item-label">Accuracy</div><div class="stat-item-value">${accuracy}%</div></div>
          <div class="stat-item"><div class="stat-item-label">Best Streak</div><div class="stat-item-value" style="color:var(--coral);">${this.maxStreak} 🔥</div></div>
          <div class="stat-item"><div class="stat-item-label">Final ELO</div><div class="stat-item-value" style="color:var(--cyan);">${this.elo} (${eloSign}${eloChange})</div></div>
          <div class="stat-item"><div class="stat-item-label">Answered</div><div class="stat-item-value">${this.totalCorrect}/${this.totalAnswered}</div></div>
          <div class="stat-item"><div class="stat-item-label">Time</div><div class="stat-item-value">${Math.floor(duration / 60)}m ${duration % 60}s</div></div>
        </div>
        <button class="btn btn-primary" style="margin-top:var(--space-6);" onclick="window.codeforge && window.codeforge.blitz && window.codeforge.blitz.start()">⚡ Play Again</button>
      </div>
    `;
  }

  getStats() {
    return {
      score: this.score,
      streak: this.streak,
      maxStreak: this.maxStreak,
      elo: this.elo,
      totalAnswered: this.totalAnswered,
      totalCorrect: this.totalCorrect
    };
  }

  handleKeyDown(e) {
    if (!this.isRunning) return;
    
    if (e.key === 'Escape') {
      this.stop();
      return;
    }
    
    if (this.isShowingFeedback) {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        this.nextDrill();
      }
      return;
    }
    
    if (['1', '2', '3', '4'].includes(e.key)) {
      if (this.currentDrill && (this.currentDrill.category === 'output-predictor' || this.currentDrill.category === 'pattern-match')) {
        this.submitAnswer(parseInt(e.key));
      }
    }
  }
}
