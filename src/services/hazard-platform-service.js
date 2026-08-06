import {
  HazardPlatform
}
from '../hazards/hazard-platform.js';
export function createHazardPlatformService(dependencies, options= {
}) {
  return new HazardPlatform( {
    events:dependencies.eventService, intelligenceCatalog:dependencies.intelligenceCatalog, shippingCatalog:dependencies.shippingCatalog, logistics:dependencies.logistics, repository:options.repository, policies:options.policies
  });
}
