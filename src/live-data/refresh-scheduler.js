export class LiveRefreshScheduler{
  constructor(options={}){this.refresh=options.refresh;this.intervalMs=Math.max(30000,Number(options.intervalMs)||120000);this.logger=options.logger;this.timer=null;this.running=false;}
  start(){if(this.timer)return;this.timer=setInterval(()=>this.tick(),this.intervalMs);this.timer.unref?.();queueMicrotask(()=>this.tick());}
  async tick(){if(this.running)return;this.running=true;try{await this.refresh();}catch(error){this.logger?.warn?.('live_data.refresh_failed',{error});}finally{this.running=false;}}
  stop(){if(this.timer)clearInterval(this.timer);this.timer=null;}
}
