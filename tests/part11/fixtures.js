export const rawEvents = [
{
  id: 'c1',
  source: 'ACLED',
  title: 'Army launches cross-border missile strike on power station',
  category: 'conflict',
  country: 'Exampleland',
  region: 'North',
  lat: 34.1,
  lon: 36.2,
  time: '2026-08-04T10:00:00Z',
  severity: 5,
  attributes: {
    actor1: 'Example Army',
    actor2: 'Northern Forces',
    crossBorder: true,
    fatalities: 12,
    independentSources: 3,
    sourceQuality: 88,
    agreement: 82,
    theatreId: 'example-war'
  }
},
{
  id: 'c2',
  source: 'Reuters',
  title: 'Heavy artillery shelling hits civilian district and hospital',
  category: 'conflict',
  country: 'Exampleland',
  region: 'North',
  lat: 34.3,
  lon: 36.5,
  time: '2026-08-04T08:00:00Z',
  severity: 4,
  attributes: {
    actor1: 'Northern Forces',
    actor2: 'Example Army',
    civilianTarget: true,
    fatalities: 24,
    independentSources: 2,
    sourceQuality: 90,
    agreement: 85,
    theatreId: 'example-war'
  }
},
{
  id: 'c3',
  source: 'AP',
  title: 'Ground battle produces territorial change near border crossing',
  category: 'conflict',
  country: 'Exampleland',
  region: 'North',
  lat: 34.5,
  lon: 36.7,
  time: '2026-08-03T18:00:00Z',
  severity: 4,
  attributes: {
    actors: ['Example Army',
    'Northern Forces'],
    fatalities: 18,
    territorialChange: true,
    independentSources: 2,
    theatreId: 'example-war'
  }
},
{
  id: 'c4',
  source: 'UN',
  title: 'Ceasefire violation reported after overnight drone strike',
  category: 'conflict',
  country: 'Exampleland',
  region: 'North',
  lat: 34.2,
  lon: 36.4,
  time: '2026-08-03T12:00:00Z',
  severity: 4,
  attributes: {
    actor1: 'Northern Forces',
    actor2: 'Example Army',
    fatalities: 3,
    independentSources: 2,
    theatreId: 'example-war'
  }
},
{
  id: 'c5',
  source: 'BBC',
  title: 'Troop mobilization and reinforcements move toward front',
  category: 'conflict',
  country: 'Exampleland',
  region: 'North',
  lat: 34.7,
  lon: 36.8,
  time: '2026-08-02T12:00:00Z',
  severity: 3,
  attributes: {
    actor1: 'Example Army',
    independentSources: 2,
    theatreId: 'example-war'
  }
},
{
  id: 'd1',
  source: 'Reuters',
  title: 'Clashes reported between Delta militia and security forces',
  category: 'conflict',
  country: 'Deltora',
  region: 'West',
  lat: 11.1,
  lon: 22.1,
  time: '2026-08-04T09:00:00Z',
  severity: 3,
  attributes: {
    actors: ['Delta Militia',
    'Security Forces'],
    fatalities: 2,
    independentSources: 2,
    theatreId: 'delta-conflict'
  }
}
];
