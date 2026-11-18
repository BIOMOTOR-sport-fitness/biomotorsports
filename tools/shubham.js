/* Shubham engine for the build tools (same engine the platform uses to save data). */
globalThis['SK'+'ON']=(()=>{
 const ESC={'"':'\\"','\\':'\\\\','\b':'\\b','\f':'\\f','\n':'\\n','\r':'\\r','\t':'\\t'};
 const q=s=>'"'+s.replace(/["\\\u0000-\u001f]|[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g,c=>ESC[c]||'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'))+'"';
 function str(v,inArr){
  if(v===null)return 'null';
  if(v instanceof Date)return isNaN(v)?'null':q(v.toISOString());
  if(v instanceof Number||v instanceof String||v instanceof Boolean)v=v.valueOf();
  switch(typeof v){
   case 'string':return q(v);
   case 'number':return isFinite(v)?String(v):'null';
   case 'boolean':return v?'true':'false';
   case 'bigint':throw new TypeError('Cannot save a BigInt');
   case 'undefined':case 'function':case 'symbol':return inArr?'null':undefined;
  }
  if(Array.isArray(v))return '['+v.map(x=>str(x,true)).join(',')+']';
  const out=[];for(const k of Object.keys(v)){const s=str(v[k],false);if(s!==undefined)out.push(q(k)+':'+s)}return '{'+out.join(',')+'}'}
 function stringify(v){return str(v,true)===undefined?undefined:str(v,false)}
 function parse(text){text=String(text);let i=0,nb=-2;const n=text.length;const NUM=/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
  const err=m=>{throw new SyntaxError('SKON: '+m+' at position '+i)};
  const ws=()=>{while(i<n){const c=text.charCodeAt(i);if(c===32||c===9||c===10||c===13)i++;else break}};
  function val(){ws();const c=text[i];
   if(c==='{'){i++;const o={};ws();if(text[i]==='}'){i++;return o}
    for(;;){ws();if(text[i]!=='"')err('expected key');const k=strv();ws();if(text[i]!==':')err('expected :');i++;o[k]=val();ws();if(text[i]===','){i++;continue}if(text[i]==='}'){i++;return o}err('expected , or }')}}
   if(c==='['){i++;const a=[];ws();if(text[i]===']'){i++;return a}
    for(;;){a.push(val());ws();if(text[i]===','){i++;continue}if(text[i]===']'){i++;return a}err('expected , or ]')}}
   if(c==='"')return strv();
   if(text.startsWith('true',i)){i+=4;return true}if(text.startsWith('false',i)){i+=5;return false}if(text.startsWith('null',i)){i+=4;return null}
   NUM.lastIndex=i;const m=NUM.exec(text);if(m&&m[0]){i+=m[0].length;return Number(m[0])}
   err('unexpected '+(c===undefined?'end of data':'character '+c))}
  function strv(){i++;let s='';for(;;){const j=text.indexOf('"',i);if(nb!==-1&&nb<i)nb=text.indexOf('\\',i);const b=nb;if(j<0)err('unterminated string');
    if(b<0||j<b){const part=text.slice(i,j);if(/[\u0000-\u001f]/.test(part))err('bad character in string');s+=part;i=j+1;return s}
    s+=text.slice(i,b);i=b+1;const e=text[i++];
    if(e==='u'){const h=text.slice(i,i+4);if(!/^[0-9a-fA-F]{4}$/.test(h))err('bad \\u escape');s+=String.fromCharCode(parseInt(h,16));i+=4}
    else{const r={'"':'"','\\':'\\','/':'/',b:'\b',f:'\f',n:'\n',r:'\r',t:'\t'}[e];if(r===undefined)err('bad escape');s+=r}}}
  const v=val();ws();if(i<n)err('extra data after value');return v}
 return Object.freeze({parse,stringify})})();
module.exports = globalThis['SK'+'ON'];
