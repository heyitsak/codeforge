/**
 * Memory Vision Engine
 * Visualizes code execution with stack frames, heap objects, and pointer relationships.
 */
export class MemoryVision {
  /**
   * @param {HTMLElement} containerEl - The DOM container for the Memory Vision view
   */
  constructor(containerEl) {
    this.container = containerEl;
    this.currentStep = 0;
    this.isPlaying = false;
    this.playInterval = null;

    // Built-in demo program
    this.code = `class Node:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next

def sum_list(head):
    total = 0
    curr = head
    while curr:
        total += curr.val
        curr = curr.next
    return total

a = Node(10)
b = Node(20, a)
c = Node(30, b)
result = sum_list(c)`;

    // Demo execution steps
    this.steps = [
      {
        line: 14,
        stack: [{ name: '<module>', vars: [] }],
        heap: [],
        description: 'Creating Node a with value 10.'
      },
      {
        line: 14,
        stack: [{ name: '<module>', vars: [{ name: 'a', value: 'Node', addr: '0x100' }] }],
        heap: [{ addr: '0x100', type: 'Node', fields: [{ name: 'val', value: '10' }, { name: 'next', value: 'None' }] }],
        description: 'Node a allocated on heap.'
      },
      {
        line: 15,
        stack: [{ name: '<module>', vars: [{ name: 'a', value: 'Node', addr: '0x100' }, { name: 'b', value: 'Node', addr: '0x101' }] }],
        heap: [
          { addr: '0x100', type: 'Node', fields: [{ name: 'val', value: '10' }, { name: 'next', value: 'None' }] },
          { addr: '0x101', type: 'Node', fields: [{ name: 'val', value: '20' }, { name: 'next', value: 'Node', addr: '0x100' }] }
        ],
        description: 'Node b allocated, pointing to Node a.'
      },
      {
        line: 16,
        stack: [{ name: '<module>', vars: [{ name: 'a', value: 'Node', addr: '0x100' }, { name: 'b', value: 'Node', addr: '0x101' }, { name: 'c', value: 'Node', addr: '0x102' }] }],
        heap: [
          { addr: '0x100', type: 'Node', fields: [{ name: 'val', value: '10' }, { name: 'next', value: 'None' }] },
          { addr: '0x101', type: 'Node', fields: [{ name: 'val', value: '20' }, { name: 'next', value: 'Node', addr: '0x100' }] },
          { addr: '0x102', type: 'Node', fields: [{ name: 'val', value: '30' }, { name: 'next', value: 'Node', addr: '0x101' }] }
        ],
        description: 'Node c allocated, pointing to Node b.'
      },
      {
        line: 17,
        stack: [{ name: '<module>', vars: [{ name: 'a', value: 'Node', addr: '0x100' }, { name: 'b', value: 'Node', addr: '0x101' }, { name: 'c', value: 'Node', addr: '0x102' }] }],
        heap: [
          { addr: '0x100', type: 'Node', fields: [{ name: 'val', value: '10' }, { name: 'next', value: 'None' }] },
          { addr: '0x101', type: 'Node', fields: [{ name: 'val', value: '20' }, { name: 'next', value: 'Node', addr: '0x100' }] },
          { addr: '0x102', type: 'Node', fields: [{ name: 'val', value: '30' }, { name: 'next', value: 'Node', addr: '0x101' }] }
        ],
        description: 'Calling sum_list(c).'
      },
      {
        line: 6,
        stack: [
          { name: '<module>', vars: [{ name: 'a', value: 'Node', addr: '0x100' }, { name: 'b', value: 'Node', addr: '0x101' }, { name: 'c', value: 'Node', addr: '0x102' }] },
          { name: 'sum_list', vars: [{ name: 'head', value: 'Node', addr: '0x102' }] }
        ],
        heap: [
          { addr: '0x100', type: 'Node', fields: [{ name: 'val', value: '10' }, { name: 'next', value: 'None' }] },
          { addr: '0x101', type: 'Node', fields: [{ name: 'val', value: '20' }, { name: 'next', value: 'Node', addr: '0x100' }] },
          { addr: '0x102', type: 'Node', fields: [{ name: 'val', value: '30' }, { name: 'next', value: 'Node', addr: '0x101' }] }
        ],
        description: 'Entering sum_list function.'
      },
      {
        line: 7,
        stack: [
          { name: '<module>', vars: [{ name: 'a', value: 'Node', addr: '0x100' }, { name: 'b', value: 'Node', addr: '0x101' }, { name: 'c', value: 'Node', addr: '0x102' }] },
          { name: 'sum_list', vars: [{ name: 'head', value: 'Node', addr: '0x102' }, { name: 'total', value: '0' }] }
        ],
        heap: [
          { addr: '0x100', type: 'Node', fields: [{ name: 'val', value: '10' }, { name: 'next', value: 'None' }] },
          { addr: '0x101', type: 'Node', fields: [{ name: 'val', value: '20' }, { name: 'next', value: 'Node', addr: '0x100' }] },
          { addr: '0x102', type: 'Node', fields: [{ name: 'val', value: '30' }, { name: 'next', value: 'Node', addr: '0x101' }] }
        ],
        description: 'Initializing total to 0.'
      },
      {
        line: 8,
        stack: [
          { name: '<module>', vars: [{ name: 'a', value: 'Node', addr: '0x100' }, { name: 'b', value: 'Node', addr: '0x101' }, { name: 'c', value: 'Node', addr: '0x102' }] },
          { name: 'sum_list', vars: [{ name: 'head', value: 'Node', addr: '0x102' }, { name: 'total', value: '0' }, { name: 'curr', value: 'Node', addr: '0x102' }] }
        ],
        heap: [
          { addr: '0x100', type: 'Node', fields: [{ name: 'val', value: '10' }, { name: 'next', value: 'None' }] },
          { addr: '0x101', type: 'Node', fields: [{ name: 'val', value: '20' }, { name: 'next', value: 'Node', addr: '0x100' }] },
          { addr: '0x102', type: 'Node', fields: [{ name: 'val', value: '30' }, { name: 'next', value: 'Node', addr: '0x101' }] }
        ],
        description: 'Setting curr to head.'
      },
      {
        line: 10,
        stack: [
          { name: '<module>', vars: [{ name: 'a', value: 'Node', addr: '0x100' }, { name: 'b', value: 'Node', addr: '0x101' }, { name: 'c', value: 'Node', addr: '0x102' }] },
          { name: 'sum_list', vars: [{ name: 'head', value: 'Node', addr: '0x102' }, { name: 'total', value: '30' }, { name: 'curr', value: 'Node', addr: '0x102' }] }
        ],
        heap: [
          { addr: '0x100', type: 'Node', fields: [{ name: 'val', value: '10' }, { name: 'next', value: 'None' }] },
          { addr: '0x101', type: 'Node', fields: [{ name: 'val', value: '20' }, { name: 'next', value: 'Node', addr: '0x100' }] },
          { addr: '0x102', type: 'Node', fields: [{ name: 'val', value: '30' }, { name: 'next', value: 'Node', addr: '0x101' }] }
        ],
        description: 'Adding curr.val (30) to total.'
      },
      {
        line: 11,
        stack: [
          { name: '<module>', vars: [{ name: 'a', value: 'Node', addr: '0x100' }, { name: 'b', value: 'Node', addr: '0x101' }, { name: 'c', value: 'Node', addr: '0x102' }] },
          { name: 'sum_list', vars: [{ name: 'head', value: 'Node', addr: '0x102' }, { name: 'total', value: '30' }, { name: 'curr', value: 'Node', addr: '0x101' }] }
        ],
        heap: [
          { addr: '0x100', type: 'Node', fields: [{ name: 'val', value: '10' }, { name: 'next', value: 'None' }] },
          { addr: '0x101', type: 'Node', fields: [{ name: 'val', value: '20' }, { name: 'next', value: 'Node', addr: '0x100' }] },
          { addr: '0x102', type: 'Node', fields: [{ name: 'val', value: '30' }, { name: 'next', value: 'Node', addr: '0x101' }] }
        ],
        description: 'Advancing curr to curr.next.'
      },
      {
        line: 10,
        stack: [
          { name: '<module>', vars: [{ name: 'a', value: 'Node', addr: '0x100' }, { name: 'b', value: 'Node', addr: '0x101' }, { name: 'c', value: 'Node', addr: '0x102' }] },
          { name: 'sum_list', vars: [{ name: 'head', value: 'Node', addr: '0x102' }, { name: 'total', value: '50' }, { name: 'curr', value: 'Node', addr: '0x101' }] }
        ],
        heap: [
          { addr: '0x100', type: 'Node', fields: [{ name: 'val', value: '10' }, { name: 'next', value: 'None' }] },
          { addr: '0x101', type: 'Node', fields: [{ name: 'val', value: '20' }, { name: 'next', value: 'Node', addr: '0x100' }] },
          { addr: '0x102', type: 'Node', fields: [{ name: 'val', value: '30' }, { name: 'next', value: 'Node', addr: '0x101' }] }
        ],
        description: 'Adding curr.val (20) to total.'
      },
      {
        line: 11,
        stack: [
          { name: '<module>', vars: [{ name: 'a', value: 'Node', addr: '0x100' }, { name: 'b', value: 'Node', addr: '0x101' }, { name: 'c', value: 'Node', addr: '0x102' }] },
          { name: 'sum_list', vars: [{ name: 'head', value: 'Node', addr: '0x102' }, { name: 'total', value: '50' }, { name: 'curr', value: 'Node', addr: '0x100' }] }
        ],
        heap: [
          { addr: '0x100', type: 'Node', fields: [{ name: 'val', value: '10' }, { name: 'next', value: 'None' }] },
          { addr: '0x101', type: 'Node', fields: [{ name: 'val', value: '20' }, { name: 'next', value: 'Node', addr: '0x100' }] },
          { addr: '0x102', type: 'Node', fields: [{ name: 'val', value: '30' }, { name: 'next', value: 'Node', addr: '0x101' }] }
        ],
        description: 'Advancing curr to curr.next.'
      },
      {
        line: 10,
        stack: [
          { name: '<module>', vars: [{ name: 'a', value: 'Node', addr: '0x100' }, { name: 'b', value: 'Node', addr: '0x101' }, { name: 'c', value: 'Node', addr: '0x102' }] },
          { name: 'sum_list', vars: [{ name: 'head', value: 'Node', addr: '0x102' }, { name: 'total', value: '60' }, { name: 'curr', value: 'Node', addr: '0x100' }] }
        ],
        heap: [
          { addr: '0x100', type: 'Node', fields: [{ name: 'val', value: '10' }, { name: 'next', value: 'None' }] },
          { addr: '0x101', type: 'Node', fields: [{ name: 'val', value: '20' }, { name: 'next', value: 'Node', addr: '0x100' }] },
          { addr: '0x102', type: 'Node', fields: [{ name: 'val', value: '30' }, { name: 'next', value: 'Node', addr: '0x101' }] }
        ],
        description: 'Adding curr.val (10) to total.'
      },
      {
        line: 11,
        stack: [
          { name: '<module>', vars: [{ name: 'a', value: 'Node', addr: '0x100' }, { name: 'b', value: 'Node', addr: '0x101' }, { name: 'c', value: 'Node', addr: '0x102' }] },
          { name: 'sum_list', vars: [{ name: 'head', value: 'Node', addr: '0x102' }, { name: 'total', value: '60' }, { name: 'curr', value: 'None' }] }
        ],
        heap: [
          { addr: '0x100', type: 'Node', fields: [{ name: 'val', value: '10' }, { name: 'next', value: 'None' }] },
          { addr: '0x101', type: 'Node', fields: [{ name: 'val', value: '20' }, { name: 'next', value: 'Node', addr: '0x100' }] },
          { addr: '0x102', type: 'Node', fields: [{ name: 'val', value: '30' }, { name: 'next', value: 'Node', addr: '0x101' }] }
        ],
        description: 'Advancing curr to curr.next (None).'
      },
      {
        line: 12,
        stack: [
          { name: '<module>', vars: [{ name: 'a', value: 'Node', addr: '0x100' }, { name: 'b', value: 'Node', addr: '0x101' }, { name: 'c', value: 'Node', addr: '0x102' }] },
          { name: 'sum_list', vars: [{ name: 'head', value: 'Node', addr: '0x102' }, { name: 'total', value: '60' }, { name: 'curr', value: 'None' }] }
        ],
        heap: [
          { addr: '0x100', type: 'Node', fields: [{ name: 'val', value: '10' }, { name: 'next', value: 'None' }] },
          { addr: '0x101', type: 'Node', fields: [{ name: 'val', value: '20' }, { name: 'next', value: 'Node', addr: '0x100' }] },
          { addr: '0x102', type: 'Node', fields: [{ name: 'val', value: '30' }, { name: 'next', value: 'Node', addr: '0x101' }] }
        ],
        description: 'Returning total (60).'
      }
    ];
  }

  /**
   * Initializes the Memory Vision layout and renders the first step.
   */
  init() {
    this.container.innerHTML = `
      <div class="mv-layout">
        <div class="mv-code-panel">
          <div class="mv-code-header">Code</div>
          <div class="mv-code-body" id="mv-code-body"></div>
        </div>
        <div class="mv-vis-panel">
          <div class="mv-section">
            <div class="mv-section-header">Stack</div>
            <div class="mv-section-body" id="mv-stack-body"></div>
          </div>
          <div class="mv-section">
            <div class="mv-section-header">Heap</div>
            <div class="mv-section-body" id="mv-heap-body"></div>
          </div>
        </div>
      </div>
      <div class="mv-scrubber" id="mv-scrubber-container"></div>
    `;

    this.renderCode();
    this.renderScrubber();
    this.goToStep(0);
  }

  /**
   * Applies lightweight syntax highlighting to code.
   * @param {string} text - Code text to highlight
   * @returns {string} - Highlighted HTML
   */
  highlightSyntax(text) {
    return text
      .replace(/\\b(class|def|return|while|for|if|else|elif|import|from)\\b/g, '<span class="syn-keyword">$1</span>')
      .replace(/\\b(Node|sum_list|__init__)\\b/g, '<span class="syn-function">$1</span>')
      .replace(/\\b(\\d+)\\b/g, '<span class="syn-number">$1</span>')
      .replace(/("[^"]*"|'[^']*')/g, '<span class="syn-string">$1</span>')
      .replace(/(#.*)/g, '<span class="syn-comment">$1</span>');
  }

  /**
   * Renders the code panel with line numbers.
   */
  renderCode() {
    const codeBody = this.container.querySelector('#mv-code-body');
    const lines = this.code.split('\\n');
    let html = '';
    
    lines.forEach((line, i) => {
      const lineNum = i + 1;
      const highlighted = this.highlightSyntax(line || ' ');
      html += `
        <div class="mv-line" id="mv-line-${lineNum}">
          <div class="line-number">${lineNum}</div>
          <div class="line-content">${highlighted}</div>
        </div>
      `;
    });
    
    codeBody.innerHTML = html;
  }

  /**
   * Updates visualization to show the state at the given step.
   * @param {number} stepIndex - Index of the step to show
   */
  goToStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.steps.length) return;
    this.currentStep = stepIndex;
    
    const step = this.steps[this.currentStep];
    
    // Highlight active line
    this.container.querySelectorAll('.mv-line').forEach(el => el.classList.remove('active'));
    const activeLineEl = this.container.querySelector(`#mv-line-${step.line}`);
    if (activeLineEl) {
      activeLineEl.classList.add('active');
      activeLineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    this.renderStack(step.stack);
    this.renderHeap(step.heap);
    
    // Update scrubber
    const slider = this.container.querySelector('#mv-slider');
    if (slider) slider.value = this.currentStep;
    
    const desc = this.container.querySelector('#mv-step-desc');
    if (desc) desc.textContent = step.description;
    
    const counter = this.container.querySelector('#mv-step-counter');
    if (counter) counter.textContent = `Step ${this.currentStep + 1} / ${this.steps.length}`;
  }

  /**
   * Renders stack frames.
   * @param {Array} stackFrames - Array of stack frame objects
   */
  renderStack(stackFrames) {
    const stackBody = this.container.querySelector('#mv-stack-body');
    let html = '';
    
    stackFrames.forEach(frame => {
      let varsHtml = '';
      frame.vars.forEach(v => {
        const addrHtml = v.addr ? `<span class="mv-var-addr">→ ${v.addr}</span>` : '';
        varsHtml += `
          <div class="mv-var">
            <span class="mv-var-name">${v.name}:</span>
            <span class="mv-var-value">${v.value}</span>
            ${addrHtml}
          </div>
        `;
      });
      
      html += `
        <div class="mv-frame">
          <div class="mv-frame-title">${frame.name}</div>
          ${varsHtml || '<div class="mv-var-empty">No local variables</div>'}
        </div>
      `;
    });
    
    stackBody.innerHTML = html;
  }

  /**
   * Renders heap objects.
   * @param {Array} heapObjects - Array of heap objects
   */
  renderHeap(heapObjects) {
    const heapBody = this.container.querySelector('#mv-heap-body');
    let html = '';
    
    heapObjects.forEach(obj => {
      let fieldsHtml = '';
      obj.fields.forEach(f => {
        const addrHtml = f.addr ? `<span class="mv-var-addr">→ ${f.addr}</span>` : '';
        fieldsHtml += `
          <div class="mv-var">
            <span class="mv-var-name">${f.name}:</span>
            <span class="mv-var-value">${f.value}</span>
            ${addrHtml}
          </div>
        `;
      });
      
      html += `
        <div class="mv-heap-obj">
          <div class="mv-heap-addr">${obj.addr} <span class="mv-type-badge">${obj.type}</span></div>
          ${fieldsHtml}
        </div>
      `;
    });
    
    heapBody.innerHTML = html;
  }

  /**
   * Renders the bottom scrubber bar.
   */
  renderScrubber() {
    const scrubberContainer = this.container.querySelector('#mv-scrubber-container');
    scrubberContainer.innerHTML = `
      <div class="mv-scrubber-controls">
        <button class="mv-scrub-btn" id="mv-btn-prev">◀</button>
        <button class="mv-scrub-btn" id="mv-btn-play">▶</button>
        <button class="mv-scrub-btn" id="mv-btn-next">▶▶</button>
      </div>
      <div class="mv-scrubber-track-container">
        <input type="range" class="mv-scrubber-track" id="mv-slider" min="0" max="${this.steps.length - 1}" value="0">
        <div class="mv-step-desc" id="mv-step-desc"></div>
      </div>
      <div class="mv-step-counter" id="mv-step-counter"></div>
    `;
    
    this.container.querySelector('#mv-btn-prev').addEventListener('click', () => this.stepBack());
    this.container.querySelector('#mv-btn-next').addEventListener('click', () => this.stepForward());
    this.container.querySelector('#mv-btn-play').addEventListener('click', () => {
      if (this.isPlaying) this.pause();
      else this.play();
    });
    
    this.container.querySelector('#mv-slider').addEventListener('input', (e) => {
      this.pause();
      this.goToStep(parseInt(e.target.value));
    });
  }

  /**
   * Advances to the next step.
   */
  stepForward() {
    if (this.currentStep < this.steps.length - 1) {
      this.goToStep(this.currentStep + 1);
    } else {
      this.pause();
    }
  }

  /**
   * Goes back to the previous step.
   */
  stepBack() {
    if (this.currentStep > 0) {
      this.goToStep(this.currentStep - 1);
    }
  }

  /**
   * Auto-advances steps periodically.
   */
  play() {
    if (this.currentStep >= this.steps.length - 1) {
      this.goToStep(0);
    }
    
    this.isPlaying = true;
    const playBtn = this.container.querySelector('#mv-btn-play');
    if (playBtn) playBtn.textContent = '⏸';
    
    this.playInterval = setInterval(() => {
      this.stepForward();
    }, 1500);
  }

  /**
   * Stops auto-advance.
   */
  pause() {
    this.isPlaying = false;
    const playBtn = this.container.querySelector('#mv-btn-play');
    if (playBtn) playBtn.textContent = '▶';
    
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
  }
}
