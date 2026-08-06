import {
  normalizeSnapshotRequest, validateScenario
}
from './validation.js';
import {
  buildHazardSnapshot
}
from './snapshot-builder.js';
import {
  runHazardScenario
}
from './scenario-engine.js';
import {
  populationExposure
}
from './population-exposure.js';
import {
  infrastructureExposure
}
from './infrastructure-exposure.js';
import {
  logisticsExposure
}
from './logistics-exposure.js';
import {
  economicImpact
}
from './economic-impact.js';
import {
  responsePriority
}
from './response-priority.js';
import {
  evaluateHazardAlerts
}
from './alert-evaluator.js';
import {
  HazardWatchlist
}
from './watchlist.js';
import {
  HazardExportService
}
from './export-service.js';
import {
  hazardDiagnostics
}
from './diagnostics.js';
import {
  hazardCatalog
}
from './hazard-catalog.js';
import {
  portfolioExposure
}
from './portfolio-exposure.js';
export class HazardPlatform {
  constructor(options= {
  }) {
    this.events=options.events;
    this.intelligenceCatalog=options.intelligenceCatalog;
    this.shippingCatalog=options.shippingCatalog;
    this.logistics=options.logistics;
    this.watchlist=new HazardWatchlist(options.repository);
    this.exporter=new HazardExportService();
    this.policies=options.policies|| {
    };
    this.lastSnapshot=null;
  }
  catalogue() {
    return hazardCatalog();
  }
  async snapshot(input= {
  }) {
    const request=normalizeSnapshotRequest(input);
    const source=await this.events.globalSnapshot( {
      maxAgeMs:20_000, limit:5000
    });
    const snapshot=buildHazardSnapshot(source, {
      ...request, policy: {
        ...this.policies, ...request.policy
      }
    });
    this.lastSnapshot=snapshot;
    return snapshot;
  }
  async event(id, options= {
  }) {
    const snapshot=await this.snapshot( {
      ...options, materialOnly:false, limit:5000
    });
    return snapshot.events.find(event=>event.id===id)||snapshot.materialEvents.find(event=>event.id===id)||null;
  }
  places() {
    try {
      return [...(this.intelligenceCatalog?.listCities?.( {
        limit:5000
      })||[]), ...(this.intelligenceCatalog?.listCountries?.( {
        limit:500
      })||[])];
    }catch {
      return[];
    }
  }
  logisticsCatalogue() {
    return {
      ports:this.shippingCatalog?.listPorts?.( {
        limit:2500
      })||this.shippingCatalog?.ports||[], chokepoints:this.shippingCatalog?.listChokepoints?.( {
        limit:500
      })||this.shippingCatalog?.chokepoints||[]
    };
  }
  async scenario(input= {
  }) {
    validateScenario(input);
    return runHazardScenario(input, {
      places:this.places(), logistics:this.logisticsCatalogue()
    });
  }
  async exposure(input= {
  }) {
    const event=input.event?.materiality?input.event:(await this.scenario( {
      event:input.event||input, places:[], assets:[]
    })).event;
    const population=populationExposure(event, input.places||this.places(), input);
    const infrastructure=infrastructureExposure(event, input.assets||[], input);
    const logistics=logisticsExposure(event, input.logistics||this.logisticsCatalogue(), input);
    const populationScore=Math.min(100, Math.log10(Math.max(1, population.estimatedPopulation))*12);
    const exposure= {
      population, populationScore, infrastructure, logistics
    };
    return Object.freeze( {
      event, exposure:Object.freeze(exposure), economics:economicImpact(event, exposure, input.economics), priority:responsePriority(event, exposure), generatedAt:new Date().toISOString()
    });
  }
  async portfolio(input= {
  }) {
    const snapshot=await this.snapshot(input);
    return portfolioExposure(snapshot.events, input.assets||[], input);
  }
  async alerts(input= {
  }) {
    const snapshot=await this.snapshot(input);
    return Object.freeze( {
      alerts:evaluateHazardAlerts(snapshot.events, input), generatedAt:snapshot.generatedAt
    });
  }
  diagnostics() {
    return hazardDiagnostics(this);
  }
}
