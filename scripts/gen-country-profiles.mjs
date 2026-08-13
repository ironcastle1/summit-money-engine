import fs from 'node:fs';
import {REGIONS} from '../src/catalog/regions.js';
const countries=JSON.parse(fs.readFileSync('./public/data/countries.json','utf8')).countries;
const by=new Map(countries.map(c=>[c.iso2,c]));
const defaults={
'europe':{themes:['NATO/EU posture','energy security','trade and industrial policy','rates/inflation','transport continuity'],exposures:['EUR/GBP','European gas/power','European equities','defence','shipping'],questions:['Could policy change sanctions, trade or defence commitments?','Are ports, borders, power or rail physically affected?','Does the development alter regional risk premiums?']},
'russia-eurasia':{themes:['Russia/Ukraine spillover','sanctions and evasion','energy exports','domestic financial stability','China-linked trade'],exposures:['Brent/Urals','gas','RUB/local FX','metals','grain/shipping'],questions:['Does this change export volume, payment access or logistics?','Is the signal official rhetoric or an operational change?','Could secondary sanctions reach third-country counterparties?']},
'middle-east':{themes:['military escalation','energy/shipping','sanctions','nuclear/diplomacy','airspace and domestic security'],exposures:['Brent','LNG','tanker freight','gold/USD','airlines'],questions:['Does this affect Hormuz, Red Sea or energy infrastructure?','Are costly force-protection or evacuation actions occurring?','Is de-escalation verified operationally or only rhetorical?']},
'north-america':{themes:['Fed/liquidity','trade and sanctions','military posture','energy/logistics','cyber infrastructure'],exposures:['USD','US Treasuries','US equities','WTI/LNG','global trade'],questions:['Is this a legal/operational policy action or political rhetoric?','What is the effective date and transmission channel?','Does it change USD liquidity or global trade access?']},
'strategic-asia':{themes:['Taiwan/China security','Korean Peninsula','semiconductors','shipping chokepoints','monetary/trade policy'],exposures:['semiconductors','JPY/KRW/TWD/CNY','Asian equities','container freight','critical minerals'],questions:['Does this affect Taiwan Strait, South China Sea or Malacca traffic?','Is advanced technology production/export access affected?','Are alliance forces or airspace posture changing?']}
};
const priority={US:100,IR:100,IL:98,TW:100,CN:100,RU:100,UA:99,JP:96,KR:96,KP:95,SA:95,AE:91,QA:93,TR:92,GB:94,DE:95,FR:94,PL:92,RO:86,LT:87,LV:85,EE:86,FI:87,SE:86,NO:91,NL:89,BE:84,IT:86,ES:82,GR:84,BG:81,HU:80,RS:78,BY:91,KZ:86,AZ:83,AM:80,GE:82,IQ:88,SY:89,LB:88,JO:82,YE:88,EG:87,OM:86,BH:82,KW:84,PH:89,VN:84,SG:91,MY:83,ID:84,IN:90,PK:84,HK:87,TH:79,BD:74,CA:84,MX:81};
const overrides={
US:{nodes:['Washington policy center','New York financial system','Houston Ship Channel','Cushing','Los Angeles/Long Beach'],themes:['Federal Reserve and USD liquidity','sanctions/export controls','China/Iran/Russia policy','defence posture','Gulf Coast energy','major ports and cyber']},
IR:{nodes:['Strait of Hormuz','Kharg Island','Bandar Abbas','Natanz','Fordow'],themes:['US/Israel escalation','nuclear file and IAEA','oil sanctions/export enforcement','IRGC Gulf posture','domestic currency stress']},
IL:{nodes:['Haifa','Ashdod','Eastern Mediterranean'],themes:['Iran/Hezbollah/Hamas escalation','air and missile defence','US security support','ceasefire diplomacy','domestic mobilisation/economy']},
TW:{nodes:['Taiwan Strait','Hsinchu Science Park','Kaohsiung','Luzon Strait'],themes:['PLA air/naval pressure','blockade/quarantine indicators','TSMC/fab continuity','US/Japan posture','shipping and undersea cables']},
CN:{nodes:['Taiwan Strait','South China Sea','Shanghai/Yangshan','Shenzhen/Yantian','Hainan'],themes:['Taiwan military posture','US/EU export controls','rare-earth restrictions','PBOC liquidity/property','South China Sea','industrial/export demand']},
RU:{nodes:['Moscow','Black Sea','Novorossiysk','Baltic','Murmansk/Yamal'],themes:['Ukraine force posture','nuclear signalling','sanctions/secondary sanctions','oil/gas export logistics','rouble/capital controls','domestic stability']},
UA:{nodes:['Odesa','Black Sea','western border logistics'],themes:['front-line/missile escalation','air defence and aid','Black Sea exports','energy grid','mobilisation','ceasefire terms']},
JP:{nodes:['Okinawa/Ryukyu','Yokosuka'],themes:['BOJ/JPY','Taiwan contingency','North Korea','semiconductor export controls','energy imports']},
KR:{nodes:['Korean DMZ','Busan','Camp Humphreys'],themes:['North Korea escalation','US alliance posture','semiconductors/memory','KRW/BoK','China trade']},
KP:{nodes:['Korean DMZ'],themes:['ICBM/nuclear tests','artillery/border activity','Russia/China ties','sanctions','regime stability']},
SA:{nodes:['Ras Tanura','Abqaiq','Red Sea'],themes:['OPEC+ production','energy infrastructure security','Iran/Yemen risk','US relations','Gulf investment/liquidity']},
QA:{nodes:['Ras Laffan','Persian Gulf'],themes:['LNG exports','Gulf/US mediation','Iran escalation','shipping security']},
AE:{nodes:['Fujairah','Jebel Ali','Strait of Hormuz'],themes:['Hormuz security','oil/logistics','sanctions compliance','regional finance','Iran ties']},
TR:{nodes:['Bosporus','Incirlik','Eastern Mediterranean'],themes:['Black Sea access','NATO/Russia balancing','Syria/Iraq security','TRY/inflation','energy transit']},
GB:{nodes:['English Channel','North Sea'],themes:['BoE/GBP','NATO/Ukraine','sanctions','North Sea energy','shipping/ports','US/EU trade']},
DE:{nodes:['Rhine','Hamburg'],themes:['ECB/German rates','industrial production','gas/power','China trade/autos','Ukraine/defence spending']},
PL:{nodes:['Suwalki Gap','Baltic/Gdansk','Ukraine border'],themes:['NATO eastern flank','Ukraine logistics','defence procurement','EU politics','energy diversification']},
BY:{nodes:['Suwalki approaches'],themes:['Russia force integration','sanctions','Ukraine border','domestic stability']},
KZ:{nodes:['Caspian/CPC'],themes:['CPC oil exports','Russia/China balancing','sanctions-evasion exposure','KZT/central bank','uranium']},
PH:{nodes:['Second Thomas Shoal','Scarborough Shoal','Luzon Strait'],themes:['China coast-guard confrontations','US alliance access','shipping','domestic defence posture']},
SG:{nodes:['Singapore/Malacca'],themes:['Malacca shipping','port/bunkering','Asian finance','China/US trade','MAS policy']},
IN:{nodes:['Indian Ocean approaches'],themes:['Gulf energy dependence','Russia oil trade','China border/security','INR/RBI','technology/manufacturing investment']},
PK:{nodes:['Arabian Sea'],themes:['domestic political/security stability','China corridor','IMF/FX','India security','Gulf energy']}
};
const out=[];
for(const region of REGIONS.filter(r=>r.id!=='world')){
 for(const code of region.countries){const c=by.get(code);if(!c)continue; const d=defaults[region.id]; const o=overrides[code]||{}; out.push({countryCode:code,name:c.name,regionId:region.id,priority:priority[code]||Math.round(region.priority*70),priorityBand:(priority[code]||0)>=95?'CORE':(priority[code]||0)>=88?'HIGH':(priority[code]||0)>=82?'ELEVATED':'STANDARD',monitorThemes:o.themes||d.themes,strategicNodes:o.nodes||[],financialExposures:d.exposures,decisionQuestions:d.questions,neighbours:[],collectionBias:'Prioritise verified operational, legal, market and infrastructure changes. Discount personality coverage and domestic spectacle without cross-border, financial or security consequence.'});}
}
fs.writeFileSync('src/catalog/country-priority-profiles.js','export const COUNTRY_PRIORITY_PROFILES = Object.freeze('+JSON.stringify(out,null,2)+');\nexport const COUNTRY_PRIORITY_BY_CODE = new Map(COUNTRY_PRIORITY_PROFILES.map(x=>[x.countryCode,x]));\n');
console.log(out.length);
