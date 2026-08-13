function emit(level, event, data={}) {
  const row = { ts:new Date().toISOString(), level, event, ...data };
  const line = JSON.stringify(row);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
export const log = Object.freeze({
  info:(event,data)=>emit('info',event,data),
  warn:(event,data)=>emit('warn',event,data),
  error:(event,data)=>emit('error',event,data)
});
