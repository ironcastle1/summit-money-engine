import {
  HazardController
}
from './hazard-controller.js';
function ensureRoot() {
  let root=document.getElementById('hazard-panel');
  if(!root) {
    root=document.createElement('aside');
    root.id='hazard-panel';
    root.className='hazard-panel hidden';
    document.querySelector('.map-stage')?.append(root);
  }
  return root;
}
export async function installHazardSystem(options) {
  const root=ensureRoot();
  let button=document.getElementById('hazard-toggle');
  if(!button) {
    button=document.createElement('button');
    button.id='hazard-toggle';
    button.type='button';
    button.className='hazard-toggle';
    button.textContent='HAZARDS';
    document.querySelector('.map-tools')?.append(button);
  }
  const controller=new HazardController( {
    map:options.map, root
  });
  button.addEventListener('click', ()=>controller.toggle());
  try {
    await controller.start();
    button.classList.add('is-ready');
    return controller;
  }catch(error) {
    button.classList.add('is-error');
    button.title=error.message;
    console.error('Hazard system failed to start', error);
    return null;
  }
}
