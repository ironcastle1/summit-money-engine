import {
  escapeHtml,
  score
}
from './format.js';
export function comparisonPanel(result){
  if(!result?.countries?.length)return'';
  return `<section class="country-risk-comparison"><h3>COUNTRY COMPARISON</h3>${result.countries.map(item=>`<div><b>${
    escapeHtml(item.name)
  }
  </b><span>${
    score(item.score)
  }
  · ${
    escapeHtml(item.band)
  }
  </span><small>${
    escapeHtml(item.topDrivers.join(', '))
  }
  </small></div>`).join('')}</section>`;
}
