import{B}from"./geotiff-L5s2wz-l.js";import"./react-4ldeB94U.js";import"./drei-BQFFepro.js";import"./three-BIBagZx2.js";import"./fiber-DLnro_FV.js";const D=9,y=256,m=257,b=12;function k(c,o,r){const i=o%8,t=Math.floor(o/8),h=8-i,g=o+r-(t+1)*8;let l=8*(t+2)-(o+r);const p=(t+2)*8-o;if(l=Math.max(0,l),t>=c.length)return console.warn("ran off the end of the buffer before finding EOI_CODE (end on input code)"),m;let u=c[t]&2**(8-i)-1;u<<=r-h;let s=u;if(t+1<c.length){let f=c[t+1]>>>l;f<<=Math.max(0,r-p),s+=f}if(g>8&&t+2<c.length){const f=(t+3)*8-(o+r),n=c[t+2]>>>f;s+=n}return s}function E(c,o){for(let r=o.length-1;r>=0;r--)c.push(o[r]);return c}function x(c){const o=new Uint16Array(4093),r=new Uint8Array(4093);for(let e=0;e<=257;e++)o[e]=4096,r[e]=e;let i=258,t=D,h=0;function g(){i=258,t=D}function l(e){const a=k(e,h,t);return h+=t,a}function p(e,a){return r[i]=a,o[i]=e,i++,i-1}function u(e){const a=[];for(let w=e;w!==4096;w=o[w])a.push(r[w]);return a}const s=[];g();const f=new Uint8Array(c);let n=l(f),d;for(;n!==m;){if(n===y){for(g(),n=l(f);n===y;)n=l(f);if(n===m)break;if(n>y)throw new Error(`corrupted code at scanline ${n}`);{const e=u(n);E(s,e),d=n}}else if(n<i){const e=u(n);E(s,e),p(d,e[e.length-1]),d=n}else{const e=u(d);if(!e)throw new Error(`Bogus entry. Not in dictionary, ${d} / ${i}, position: ${h}`);E(s,e),s.push(e[e.length-1]),p(d,e[e.length-1]),d=n}i+1>=2**t&&(t===b?d=void 0:t++),n=l(f)}return new Uint8Array(s)}class M extends B{decodeBlock(o){return x(o).buffer}}export{M as default};
