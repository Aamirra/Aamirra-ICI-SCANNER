/* ICI Bar Replay — ici-indicator.js ke setReplayCandles() ko use karta hai
   taake EMA/SMA/fractals/structure/HTF sab replay ke sath sync rahein.
   Timeframe change pe bhi replay position yaad rehti hai (per-slot). */
class ICIBarReplay {
  constructor(chart, series, containerId, allBars) {
    this.chart = chart;
    this.series = series;
    this.containerId = containerId;
    this.containerEl = document.getElementById(containerId);
    this.allBars = allBars;

    this.index = 0;
    this.pickingStart = false;
    this.active = false;
    this.playing = false;
    this.speedMs = 500;
    this.timer = null;

    window.ICIReplayState = window.ICIReplayState || {};

    this._buildUI();
    this._bindChartClick();
    this._tryResume();
  }

  _tryResume() {
    const saved = window.ICIReplayState[this.containerId];
    if (!saved || !saved.active || saved.time == null) return;
    let idx = 0;
    for (let i = 0; i < this.allBars.length; i++) {
      if (this.allBars[i].time <= saved.time) idx = i; else break;
    }
    this.speedMs = saved.speedMs || 500;
    this.start(idx).then(() => {
      if (saved.playing) this.play();
    });
  }

  _saveState() {
    window.ICIReplayState[this.containerId] = {
      active: this.active,
      time: (this.active && this.allBars[this.index]) ? this.allBars[this.index].time : null,
      speedMs: this.speedMs,
      playing: this.playing
    };
  }

  _buildUI() {
    if (getComputedStyle(this.containerEl).position === 'static') {
      this.containerEl.style.position = 'relative';
    }

    const trigger = document.createElement('button');
    trigger.textContent = '⟲ Replay';
    trigger.style.cssText = 'position:absolute;top:8px;right:8px;z-index:40;background:#2a2e39;color:#d1d4dc;border:1px solid #363a45;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;font-family:sans-serif;';
    trigger.onclick = () => this.enable();
    this.containerEl.appendChild(trigger);
    this.trigger = trigger;

    const bar = document.createElement('div');
    bar.style.cssText = 'position:absolute;left:50%;bottom:20px;transform:translateX(-50%);display:none;align-items:center;gap:8px;background:#1e222d;border:1px solid #363a45;border-radius:8px;padding:6px 10px;z-index:50;font-family:sans-serif;font-size:12px;color:#d1d4dc;box-shadow:0 2px 10px rgba(0,0,0,.4);';
    bar.innerHTML = `
      <button data-act="exit" style="${this._btnCss()}">&#10005;</button>
      <button data-act="back" style="${this._btnCss()}">&#9198;</button>
      <button data-act="play" style="${this._btnCss()}">&#9654;</button>
      <button data-act="fwd" style="${this._btnCss()}">&#9197;</button>
      <select data-act="speed" style="background:#131722;color:#d1d4dc;border:1px solid #363a45;border-radius:4px;padding:2px 4px;">
        <option value="1000">0.5x</option>
        <option value="500" selected>1x</option>
        <option value="200">2.5x</option>
        <option value="80">6x</option>
        <option value="0">Max</option>
      </select>
      <span data-act="label" style="opacity:.75;min-width:80px;"></span>
    `;
    this.containerEl.appendChild(bar);
    this.bar = bar;

    bar.querySelector('[data-act="exit"]').onclick = () => this.exit();
    bar.querySelector('[data-act="back"]').onclick = () => this.stepBack();
    bar.querySelector('[data-act="fwd"]').onclick = () => this.stepForward();
    this.playBtn = bar.querySelector('[data-act="play"]');
    this.playBtn.onclick = () => this.togglePlay();
    bar.querySelector('[data-act="speed"]').onchange = (e) => { this.speedMs = Number(e.target.value); this._saveState(); };
    this.label = bar.querySelector('[data-act="label"]');
  }

  _btnCss() {
    return 'background:#2a2e39;color:#d1d4dc;border:1px solid #363a45;border-radius:4px;width:26px;height:26px;cursor:pointer;';
  }

  _bindChartClick() {
    this._clickHandler = (param) => {
      if (!this.pickingStart || !param.time) return;
      const idx = this.allBars.findIndex(b => b.time === param.time);
      if (idx >= 0) this.start(idx);
    };
    this.chart.subscribeClick(this._clickHandler);
  }

  enable() {
    this.pickingStart = !this.pickingStart;
    this.trigger.textContent = this.pickingStart ? '📍 Click a candle…' : '⟲ Replay';
  }

  async start(index) {
    this.pickingStart = false;
    this.active = true;
    this.trigger.style.display = 'none';
    this.index = Math.max(0, Math.min(index, this.allBars.length - 1));
    this.bar.style.display = 'flex';
    await this._renderSlice();
  }

  async _renderSlice() {
    const slice = this.allBars.slice(0, this.index + 1);
    if (window.ICIIndicator && window.ICIIndicator.setReplayCandles) {
      await window.ICIIndicator.setReplayCandles(this.containerId, slice);
    } else {
      this.series.setData(slice);
    }
    this._updateLabel();
    this._saveState();
  }

  async stepForward() {
    if (this.index >= this.allBars.length - 1) { this.pause(); return; }
    this.index++;
    await this._renderSlice();
  }

  async stepBack() {
    if (this.index <= 0) return;
    this.index--;
    await this._renderSlice();
  }

  togglePlay() { this.playing ? this.pause() : this.play(); }

  play() {
    if (this.playing) return;
    this.playing = true;
    this.playBtn.innerHTML = '&#10074;&#10074;';
    this._saveState();
    const loop = async () => {
      if (!this.playing) return;
      await this.stepForward();
      if (!this.playing || this.index >= this.allBars.length - 1) { this.pause(); return; }
      this.timer = this.speedMs > 0 ? setTimeout(loop, this.speedMs) : requestAnimationFrame(loop);
    };
    loop();
  }

  pause() {
    this.playing = false;
    this.playBtn.innerHTML = '&#9654;';
    clearTimeout(this.timer);
    cancelAnimationFrame(this.timer);
    this._saveState();
  }

  _updateLabel() {
    const t = this.allBars[this.index].time;
    const d = typeof t === 'number' ? new Date(t * 1000) : new Date(t);
    this.label.textContent = d.toLocaleDateString();
  }

  exit() {
    this.pause();
    this.active = false;
    this.bar.style.display = 'none';
    this.trigger.style.display = 'block';
    this.trigger.textContent = '⟲ Replay';
    this._saveState();
    if (window.ICIIndicator && window.ICIIndicator.setReplayCandles) {
      window.ICIIndicator.setReplayCandles(this.containerId, this.allBars);
    } else {
      this.series.setData(this.allBars);
    }
  }

  destroy() {
    this.pause();
    try { this.chart.unsubscribeClick(this._clickHandler); } catch(e) {}
    try { this.trigger.remove(); } catch(e) {}
    try { this.bar.remove(); } catch(e) {}
  }
}
