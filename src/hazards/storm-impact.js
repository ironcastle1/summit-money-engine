import {
  clamp, round
}
from './numbers.js';
export function stormImpact(event= {
}) {
  const a=event.attributes|| {
  };
  const wind=Number(a.windKph??a.maximumWindKph??a.windSpeedKph??0);
  const gust=Number(a.gustKph??0);
  const pressure=Number(a.pressureHpa??1010);
  const category=Number(a.category??0);
  const surge=Number(a.stormSurgeMetres??0);
  const score=clamp((wind/250)*55+(gust/300)*10+Math.max(0, (1010-pressure)/100)*15+category*5+surge*4);
  return Object.freeze( {
    score:round(score, 1), windKph:wind||null, gustKph:gust||null, pressureHpa:pressure||null, category:category||null, stormSurgeMetres:surge||null
  });
}
