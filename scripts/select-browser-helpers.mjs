/** Exercise the actual menu surface; native support permits baseline comparisons. */
export function selectBrowserHelpers({evaluate,click,waitFor,delay}) {
 const select = async (id,value) => {
  const native=await evaluate(`document.querySelector(${JSON.stringify(id)})?.tagName==='SELECT'`);
  if(native)await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  else {
   await click(id);
   await waitFor("!!document.querySelector('[data-slot=select-content][data-open]')",'select menu open');
   await click(`[data-slot=select-content][data-open] [data-slot=select-item][data-value="${value}"]`);
   await waitFor("!document.querySelector('[data-slot=select-content][data-open]')",'select menu closed');
  }
  await waitFor(`document.querySelector(${JSON.stringify(id)}).value===${JSON.stringify(value)}`,'navigation selected');
  await delay(300);
 };
 const options = async id => {
  if(await evaluate(`document.querySelector(${JSON.stringify(id)})?.tagName==='SELECT'`))return evaluate(`document.querySelector(${JSON.stringify(id)}).options.length`);
  await click(id);await waitFor("!!document.querySelector('[data-slot=select-content][data-open]')",'select menu open');
  const count=await evaluate("document.querySelector('[data-slot=select-content][data-open]').querySelectorAll('[data-slot=select-item]').length");
  await click(id);await waitFor("!document.querySelector('[data-slot=select-content][data-open]')",'select menu closed');await delay(150);return count;
 };
 return {select,options};
}
