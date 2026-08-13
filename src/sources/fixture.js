import { stableId } from '../core/hash.js';
const now=()=>Date.now();
const iso=h=>new Date(now()-h*3600_000).toISOString();
const R=(title,summary,url,h,sourceName,domain,regionHint,sourceType='publisher',quality=.9)=>({id:stableId('fixture',url),kind:'article',title,summary,url,publishedAt:iso(h),sourceId:`fixture:${domain}`,sourceName,sourceDomain:domain,sourceType,sourceQuality:quality,regionHint});
export function fixtureResults(){
  const rows=[
    R('US military adjusts Gulf posture as Iran tensions rise','Additional force-protection measures and regional deployments increase attention on direct escalation and Gulf shipping.','https://reuters.com/demo/us-iran-posture',.5,'Reuters','reuters.com','middle-east','publisher',.98),
    R('UKMTO reports attack on commercial vessel near Bab el-Mandeb','A merchant vessel reports damage after an attack in the southern Red Sea; carriers review routing and war-risk cover.','https://ukmto.org/demo/red-sea-attack',.8,'UKMTO','ukmto.org','middle-east','official',1),
    R('IAEA issues new technical update on Iran enrichment','The agency reports a material change in enrichment-related activity and requests further access.','https://iaea.org/demo/iran-update',1.2,'IAEA','iaea.org','middle-east','official',1),
    R('OFAC announces new Iran-linked shipping designations','New designations target entities and vessels connected to sanctioned petroleum trade.','https://ofac.treasury.gov/demo/iran-shipping',1.8,'OFAC','ofac.treasury.gov','middle-east','official',1),
    R('Israel and Lebanon border exchanges intensify overnight','Cross-border fire expands to additional locations while mediation continues.','https://reuters.com/demo/israel-lebanon',2.2,'Reuters','reuters.com','middle-east','publisher',.98),
    R('Gulf operators review contingency plans for Strait of Hormuz','Energy and shipping operators assess alternative routing and terminal resilience after new warnings.','https://ft.com/demo/hormuz-contingency',3,'Financial Times','ft.com','middle-east','publisher',.94),
    R('Airlines alter Middle East schedules after airspace warnings','Multiple carriers change routings and suspend selected services because of regional security notices.','https://bbc.com/demo/mideast-airspace',4,'BBC','bbc.com','middle-east','publisher',.9),
    R('Red Sea war-risk insurance premiums rise after fresh incident','Insurance brokers report a sharp increase in quoted cover for selected Red Sea transits.','https://reuters.com/demo/red-sea-insurance',4.5,'Reuters','reuters.com','middle-east','publisher',.98),

    R('Russia launches large drone and missile strike on Ukrainian infrastructure','Ukrainian authorities report damage to energy and logistics sites after a large overnight strike.','https://reuters.com/demo/ukraine-strike',.7,'Reuters','reuters.com','europe','publisher',.98),
    R('EU agrees additional sanctions measures targeting circumvention','The package expands restrictions on shipping, dual-use goods and entities linked to sanctions evasion.','https://consilium.europa.eu/demo/sanctions',1.5,'Council of the EU','consilium.europa.eu','europe','official',1),
    R('Black Sea port operations disrupted after overnight attack','Port and grain logistics are assessing damage, vessel queues and expected reopening times.','https://reuters.com/demo/black-sea-port',2,'Reuters','reuters.com','europe','publisher',.98),
    R('Baltic states investigate new subsea cable damage','Authorities open a joint investigation and increase monitoring of critical infrastructure routes.','https://bbc.com/demo/baltic-cable',3.5,'BBC','bbc.com','europe','publisher',.9),
    R('GPS interference reports increase around Baltic aviation corridor','Operators report navigation interference affecting parts of the Baltic region.','https://rferl.org/demo/baltic-gps',4,'RFE/RL','rferl.org','europe','publisher',.8),
    R('ECB signals policy remains dependent on inflation data','Officials emphasize wages, services inflation and financial conditions ahead of the next decision.','https://ecb.europa.eu/demo/rates',5,'ECB','ecb.europa.eu','europe','official',1),
    R('European gas prices rise on supply and storage concerns','Benchmark gas prices move higher as traders assess storage, LNG arrivals and regional supply risk.','https://ft.com/demo/eu-gas',5.5,'Financial Times','ft.com','europe','publisher',.94),

    R('Russian government announces new controls on selected strategic exports','The measure affects selected raw materials and industrial products, with implementation details pending.','https://interfax.com/demo/russia-export',2.4,'Interfax','interfax.com','russia-eurasia','publisher',.76),
    R('Kremlin issues new statement on military posture and negotiations','The statement changes official language around conditions for talks and military objectives.','https://en.kremlin.ru/demo/posture',3.2,'Kremlin','en.kremlin.ru','russia-eurasia','official',.8),
    R('Russian refinery outage tightens regional product supply','Market participants assess reduced throughput and possible knock-on effects for diesel exports.','https://reuters.com/demo/russia-refinery',4.2,'Reuters','reuters.com','russia-eurasia','publisher',.98),

    R('Taiwan reports expanded PLA aircraft and naval activity','Taiwan defence authorities report increased sorties and naval movements around key approaches to the island.','https://mnd.gov.tw/demo/pla-activity',.4,'Taiwan Ministry of National Defense','mnd.gov.tw','strategic-asia','official',1),
    R('Japan raises monitoring after regional missile activity','Japan defence authorities issue an operational update and increase monitoring in the region.','https://mod.go.jp/demo/missile-monitoring',1.1,'Japan Ministry of Defense','mod.go.jp','strategic-asia','official',1),
    R('North Korea conducts new ballistic missile test','Regional governments assess the trajectory, system type and implications for deterrence posture.','https://yonhapnews.co.kr/demo/dprk-missile',1.7,'Yonhap','yonhapnews.co.kr','strategic-asia','publisher',.88),
    R('US expands advanced semiconductor export restrictions','New rules tighten controls on selected advanced chips and semiconductor manufacturing equipment.','https://bis.gov/demo/chip-controls',2.3,'Bureau of Industry and Security','bis.gov','strategic-asia','official',1),
    R('Taiwan chip suppliers assess impact of new export-control rules','Semiconductor firms review licensing, customer exposure and equipment supply following updated controls.','https://asia.nikkei.com/demo/chips',3.1,'Nikkei Asia','asia.nikkei.com','strategic-asia','publisher',.91),
    R('South China Sea confrontation triggers diplomatic protests','Coast guard activity near a contested area leads to new official protests and operational warnings.','https://reuters.com/demo/south-china-sea',3.8,'Reuters','reuters.com','strategic-asia','publisher',.98),
    R('Bank of Japan emphasizes wage and inflation persistence','Policy communication keeps markets focused on the timing and pace of further normalization.','https://boj.or.jp/demo/policy',5.1,'Bank of Japan','boj.or.jp','strategic-asia','official',1),
    R('Japan announces expanded defence-industrial cooperation','New cooperation covers munitions, maintenance and selected advanced defence technologies.','https://mod.go.jp/demo/industry',6,'Japan Ministry of Defense','mod.go.jp','strategic-asia','official',1),

    R('Federal Reserve keeps rates unchanged and highlights inflation risks','The statement keeps policy-sensitive markets focused on inflation, employment and financial conditions.','https://federalreserve.gov/demo/fomc',1,'Federal Reserve','federalreserve.gov','north-america','official',1),
    R('CISA adds actively exploited vulnerabilities affecting enterprise software','The catalogue update identifies vulnerabilities with evidence of active exploitation and remediation deadlines.','https://cisa.gov/demo/kev',1.4,'CISA','cisa.gov','north-america','official',1),
    R('US announces new export controls on strategic technology','Commerce officials announce additional restrictions affecting advanced technology supply chains.','https://commerce.gov/demo/export-controls',2.1,'U.S. Commerce Department','commerce.gov','north-america','official',1),
    R('US maritime advisory warns of elevated risk in Persian Gulf and Hormuz','The advisory updates commercial shipping on regional threat conditions and recommended precautions.','https://maritime.dot.gov/demo/hormuz-advisory',2.6,'U.S. Maritime Administration','maritime.dot.gov','middle-east','official',1),
    R('Major US port labour talks enter critical phase','Importers and carriers prepare contingency plans as negotiations approach a key deadline.','https://reuters.com/demo/us-port-labor',4.4,'Reuters','reuters.com','north-america','publisher',.98),
    R('Treasury yields rise as markets reassess inflation and issuance','Government bond yields move higher as investors reprice the policy path and supply outlook.','https://ft.com/demo/treasury-yields',5.2,'Financial Times','ft.com','north-america','publisher',.94),
  ];
  const predictions=[
    P('Will the United States and Iran enter direct military conflict this month?',.38,8_400_000,920_000),
    P('Will Brent crude trade above $100 this month?',.31,5_100_000,610_000),
    P('Will the Strait of Hormuz face a sustained commercial disruption?',.24,3_600_000,430_000),
    P('Will China begin a large-scale blockade exercise around Taiwan this quarter?',.19,2_900_000,350_000),
    P('Will the Federal Reserve cut rates at its next meeting?',.43,12_200_000,1_300_000),
  ];
  const markets=[
    M('commodity:BRENT','BRENT','Brent crude','commodity',94.28,3.7),M('commodity:WTI','WTI','WTI crude','commodity',90.14,3.2),M('commodity:GOLD','XAUUSD','Gold','commodity',2478.4,1.4),M('commodity:TTF','TTF','European natural gas','commodity',39.82,4.9),M('index:VIX','VIX','VIX','index',22.7,9.3),M('index:SPX','SPX','S&P 500','index',6238,-.8),M('crypto:bitcoin','BTC','Bitcoin','crypto',118200,-1.2),M('crypto:ethereum','ETH','Ethereum','crypto',4310,-.9),M('fx:USDEUR','USD/EUR','US Dollar / EUR','fx',.91,.2),M('fx:USDJPY','USD/JPY','US Dollar / Yen','fx',149.7,.6)
  ];
  return{items:rows,predictions,markets};
}
function P(title,probability,volume,liquidity){return{id:stableId('fixture-pred',title),kind:'prediction',title,description:'Demo prediction-market context used for product acceptance testing.',url:'https://polymarket.com',probability,volume,liquidity,updatedAt:iso(.25),sourceId:'polymarket',sourceName:'Polymarket',sourceQuality:.74};}
function M(id,symbol,name,type,price,change24h){return{id,symbol,name,type,price,change24h,updatedAt:iso(.05),sourceName:'Demo market feed'};}
