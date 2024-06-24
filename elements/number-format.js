import { findNearestVulgarFraction, roundToConfidenceInterval, samplingError } from '../utils.js';

export default class NumberFormat extends HTMLElement {
  constructor() {
    super();
    this.mutationObserver = null;
  }

  connectedCallback() {
    this.mutationObserver = new MutationObserver(() => this.updateState());
    this.updateState();
    this.mutationObserver.observe(this, { childList: true });
  }

  updateState() {
    // stop observing while updating
    this.mutationObserver.disconnect();
    const number = parseFloat(this.textContent);
    const sampleSize = parseInt(this.getAttribute('sample-size'), 10);
    const total = parseInt(this.getAttribute('total'), 10);
    const precision = parseInt(this.getAttribute('precision'), 10);
    const fuzzy = this.getAttribute('fuzzy') !== 'false';
    if (Number.isNaN(number)) {
      this.textContent = '-';
      this.setAttribute('title', 'no data available');
    } else {
      this.textContent = roundToConfidenceInterval(
        number,
        Number.isNaN(sampleSize) ? 0 : sampleSize,
        precision,
        fuzzy,
      );

      // set the title to the original number
      this.title = number;
      if (!Number.isNaN(sampleSize)) {
        this.title = `${number} ±${samplingError(number, sampleSize)}`;
      }
      // remove all classes ending with '-of-total'
      Array.from(this.classList)
        .filter((cls) => cls.endsWith('-of-total'))
        .forEach((cls) => {
          this.classList.remove(cls);
        });
      // if the total is given, add the percentage class
      if (!Number.isNaN(total) && total > 0) {
        const fraction = number / total;
        this.classList.add(`${findNearestVulgarFraction(fraction)}-of-total`);
      }
    }
    // resume observing
    this.mutationObserver.observe(this, { childList: true });
  }
}
