import {
  CountryRiskController
}
from './country-risk-controller.js';
export async function installCountryRiskSystem(options={
}){
  const controller=new CountryRiskController(options);
  try{
    await controller.initialize();
  }
  catch(error){
    console.warn('country-risk.initialize.failed',error);
  }
  return controller;
}
