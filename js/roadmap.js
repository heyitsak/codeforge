/**
 * Roadmap Explorer
 * An interactive 5-tier curriculum roadmap explorer.
 */
export class RoadmapExplorer {
  /**
   * @param {HTMLElement} containerEl - The DOM container for the Roadmap view
   */
  constructor(containerEl) {
    this.container = containerEl;
    
    // Built-in tier data
    this.tiers = [
      {
        name: 'Computational Spark',
        duration: 'Day 1-14',
        colorClass: 'badge-emerald',
        markerClass: 'tier-marker-0',
        description: 'Master the fundamental building blocks of programming.',
        topics: ['Variables & Types', 'Control Flow', 'Loops', 'Functions', 'Arrays', 'Dictionaries', 'Basic I/O'],
        drills: '200+ syntax & boolean logic drills',
        capstone: 'In-browser arcade game (Snake/Asteroids)',
        progress: 0
      },
      {
        name: 'Software Engineer Foundations',
        duration: 'Month 1-2',
        colorClass: 'badge-cyan',
        markerClass: 'tier-marker-1',
        description: 'Transition from coding to software engineering.',
        topics: ['Stack vs Heap', 'Pointers/References', 'OOP', 'Functional Programming', 'Big-O Analysis', 'Binary Search', 'BFS/DFS', 'Trees', 'Dynamic Programming', 'Git Mastery', 'Unit Testing'],
        drills: '500+ Big-O and bug-spotting drills',
        capstone: 'Custom Git implementation',
        progress: 0
      },
      {
        name: 'Production Full-Stack',
        duration: 'Month 3-4',
        colorClass: 'badge-amber',
        markerClass: 'tier-marker-2',
        description: 'Build production-ready, scalable web applications.',
        topics: ['PostgreSQL', 'Indexing (B-Trees)', 'Query Optimization', 'REST/GraphQL/gRPC', 'WebSockets', 'OAuth2/JWT', 'Redis Caching', 'Docker', 'CI/CD'],
        drills: 'SQL joins, HTTP status codes, Docker commands',
        capstone: 'Collaborative Workspace (Linear clone) with Stripe',
        progress: 0
      },
      {
        name: 'Distributed Systems',
        duration: 'Month 5-6',
        colorClass: 'badge-violet',
        markerClass: 'tier-marker-3',
        description: 'Architect resilient systems at scale.',
        topics: ['Concurrency', 'Goroutines/Channels', 'Mutexes', 'Raft Consensus', 'Kafka', 'Event Sourcing', 'CQRS', 'Sharding', 'Write-Ahead Logs'],
        drills: 'Race condition spotting, CAP theorem',
        capstone: 'Distributed Key-Value Store',
        progress: 0
      },
      {
        name: 'Staff Architect & AI-Native',
        duration: 'Month 7+',
        colorClass: 'badge-coral',
        markerClass: 'tier-marker-4',
        description: 'Master cutting-edge performance and AI integration.',
        topics: ['System Design (100M+ DAU)', 'eBPF', 'Zero-Copy Networking', 'SIMD', 'Vector Search (HNSW)', 'Agentic AI', 'RAG Pipelines', 'Fine-Tuning'],
        drills: 'Latency estimation, system bottleneck spotting',
        capstone: 'Multi-Agent Code Generation Engine',
        progress: 0
      }
    ];
  }

  /**
   * Initializes and renders the full roadmap.
   */
  init() {
    this.container.innerHTML = '<div class="roadmap-timeline" id="roadmap-timeline"></div>';
    const timeline = this.container.querySelector('#roadmap-timeline');
    
    this.tiers.forEach((tier, index) => {
      const tierEl = this.renderTier(tier, index);
      timeline.appendChild(tierEl);
    });
  }

  /**
   * Renders a single tier card.
   * @param {Object} tier - The tier data object
   * @param {number} index - Index of the tier
   * @returns {HTMLElement} - The tier element
   */
  renderTier(tier, index) {
    const el = document.createElement('div');
    el.className = `roadmap-tier`;
    el.dataset.index = index;
    
    let topicsHtml = '';
    tier.topics.forEach(topic => {
      topicsHtml += `<span class="tier-topic ${tier.colorClass}">${topic}</span>`;
    });
    
    el.innerHTML = `
      <div class="tier-marker ${tier.markerClass}"></div>
      <div class="tier-content">
        <div class="tier-header">
          <div class="tier-name">${index}: ${tier.name}</div>
          <div class="tier-duration ${tier.colorClass}">${tier.duration}</div>
        </div>
        <div class="tier-desc">${tier.description}</div>
        
        <div class="progress-bar">
          <div class="progress-bar-fill ${tier.colorClass}" style="width: ${tier.progress}%"></div>
        </div>
        
        <div class="tier-details">
          <div class="tier-topics">${topicsHtml}</div>
          <div class="tier-drills"><strong>Drills:</strong> ${tier.drills}</div>
          <div class="tier-capstone">
            <span class="tier-capstone-icon">🏆</span> 
            <strong>Capstone:</strong> ${tier.capstone}
          </div>
        </div>
      </div>
    `;
    
    // Toggle expand/collapse on click
    el.addEventListener('click', () => this.toggleTier(index));
    
    return el;
  }

  /**
   * Toggles the expanded state of a tier.
   * @param {number} index - Index of the tier to toggle
   */
  toggleTier(index) {
    const timeline = this.container.querySelector('#roadmap-timeline');
    const tiers = timeline.querySelectorAll('.roadmap-tier');
    
    tiers.forEach((tierEl, i) => {
      if (i === index) {
        tierEl.classList.toggle('expanded');
      } else {
        tierEl.classList.remove('expanded');
      }
    });
  }

  /**
   * Updates the progress bar for a tier.
   * @param {number} tierIndex - Index of the tier
   * @param {number} percent - Progress percentage (0-100)
   */
  updateProgress(tierIndex, percent) {
    if (tierIndex < 0 || tierIndex >= this.tiers.length) return;
    
    this.tiers[tierIndex].progress = Math.max(0, Math.min(100, percent));
    
    const timeline = this.container.querySelector('#roadmap-timeline');
    if (!timeline) return;
    
    const tierEl = timeline.querySelector(`.roadmap-tier[data-index="${tierIndex}"]`);
    if (tierEl) {
      const fillEl = tierEl.querySelector('.progress-bar-fill');
      if (fillEl) {
        fillEl.style.width = `${this.tiers[tierIndex].progress}%`;
      }
    }
  }
}
