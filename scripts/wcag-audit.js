const fs = require('fs');
const path = require('path');

const themePath = path.join(__dirname, '..', 'src', 'theme.css');
const outPath = path.join(__dirname, '..', 'Markdowns', 'wcag-audit-report.md');

function parseVars(css) {
  const vars = {};
  const re = /--([a-z0-9-]+)\s*:\s*([^;\n]+);/gi;
  let m;
  while ((m = re.exec(css))) {
    vars[`--${m[1]}`] = m[2].trim();
  }
  return vars;
}

function hexToRgb(hex) {
  if (!hex) return null;
  hex = hex.trim();
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
  const r = parseInt(hex.slice(0,2),16);
  const g = parseInt(hex.slice(2,4),16);
  const b = parseInt(hex.slice(4,6),16);
  return [r,g,b];
}

function srgbToLinear(c) {
  c = c/255;
  return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
}

function luminance(rgb) {
  const [r,g,b] = rgb;
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return 0.2126*R + 0.7152*G + 0.0722*B;
}

function contrastRatio(rgb1, rgb2) {
  const L1 = luminance(rgb1);
  const L2 = luminance(rgb2);
  const light = Math.max(L1,L2);
  const dark = Math.min(L1,L2);
  return (light + 0.05) / (dark + 0.05);
}

function rgbToHex([r,g,b]){
  return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
}

function clamp(v,min,max){return Math.max(min,Math.min(max,v));}

function rgbToHsl([r,g,b]){
  r/=255;g/=255;b/=255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h,s,l=(max+min)/2;
  if(max===min){h=s=0;} else {
    const d = max-min;
    s = l>0.5?d/(2-max-min):d/(max+min);
    switch(max){
      case r: h = (g-b)/d + (g<b?6:0); break;
      case g: h = (b-r)/d + 2; break;
      case b: h = (r-g)/d + 4; break;
    }
    h/=6;
  }
  return [h*360, s*100, l*100];
}

function hslToRgb([h,s,l]){
  h/=360; s/=100; l/=100;
  if(s===0){ const v = Math.round(l*255); return [v,v,v]; }
  const q = l<0.5 ? l*(1+s) : l+s - l*s;
  const p = 2*l - q;
  const hk = h;
  const t = [hk+1/3, hk, hk-1/3].map(tt=>{
    if(tt<0) tt+=1; if(tt>1) tt-=1;
    if(tt < 1/6) return p + (q-p)*6*tt;
    if(tt < 1/2) return q;
    if(tt < 2/3) return p + (q-p)*(2/3-tt)*6;
    return p;
  });
  return t.map(x=>Math.round(x*255));
}

function adjustLightnessToContrast(rgbSource, rgbTarget, required=4.5){
  // try adjusting lightness up/down in HSL until contrast achieved
  const [h,s,l] = rgbToHsl(rgbSource);
  for(let delta=0; delta<=50; delta++){
    for(const dir of [1,-1]){
      const nl = clamp(l + dir*delta, 0, 100);
      const candidate = hslToRgb([h,s,nl]);
      if(contrastRatio(candidate, rgbTarget) >= required) return candidate;
    }
  }
  return null;
}

function percentLuminanceDiff(rgbA, rgbB){
  const LA = luminance(rgbA);
  const LB = luminance(rgbB);
  if(LA===0) return LB===0?0:100;
  return Math.abs(LA-LB)/LA * 100;
}

const css = fs.readFileSync(themePath,'utf8');
const vars = parseVars(css);

const protected = ['--color-primary','--color-secondary','--color-accent','--color-brand'];
const mapping = {
  '--color-primary': ['--color-primary-500','--color-primary'],
  '--color-accent': ['--color-accent'],
  '--color-secondary': ['--color-secondary','--color-text'],
  '--color-brand': ['--color-brand','--color-primary-500']
};

const bgVar = vars['--color-background'] || '#FFFFFF';
const bgRgb = hexToRgb(bgVar.replace(/var\([^)]*\)/,'') || bgVar) || hexToRgb('#FFFFFF');

let report = '# WCAG Audit Report\n\n';
report += 'This report lists protected brand tokens and accessibility checks.\n\n';

for(const token of protected){
  const candidates = mapping[token] || [];
  let value = null;
  for(const c of candidates){ if(vars[c]) { value = vars[c]; break; } }
  if(!value){ report += `Token: ${token}\nStatus: Not found in theme.css\n\n`; continue; }
  // strip possible spaces and var() wrappers
  const raw = value.trim();
  const hex = raw.startsWith('var(')? (vars[ raw.match(/--[a-z0-9-]+/)?.[0] ] || raw) : raw;
  const rgb = hexToRgb(hex.replace(/\s/g,'')) || null;
  if(!rgb){ report += `Token: ${token}\nCurrent Value: ${value}\nStatus: Unable to parse color\n\n`; continue; }

  const contrastWithBg = contrastRatio(rgb, bgRgb);
  const required = 4.5; // normal text default

  report += '### Brand Color Review Required\n\n';
  report += `Token: ${token}\n`;
  report += `Current Value: ${hexToHex = rgbToHex(rgb)}\n`;
  report += `Required Contrast Ratio: ${required}:1 (normal text)\n`;
  report += `Current Contrast Ratio: ${contrastWithBg.toFixed(2)}:1 vs background (${rgbToHex(bgRgb)})\n`;

  if(contrastWithBg >= required){
    report += `Suggested Replacement: (none) — passes contrast\n`;
    report += `Luminance Difference: 0%\n`;
    report += `Approval Required: No\n\n`;
    continue;
  }

  // Try suggestions: adjust token or background; prefer adjusting accessible variant (increase contrast)
  const candidate = adjustLightnessToContrast(rgb, bgRgb, required);
  if(candidate){
    const lumDiff = percentLuminanceDiff(rgb, candidate).toFixed(2);
    const candidateHex = rgbToHex(candidate);
    const approval = lumDiff > 10 ? 'Yes' : 'No';
    report += `Suggested Replacement: ${candidateHex}\n`;
    report += `Luminance Difference: ${lumDiff}%\n`;
    report += `Approval Required: ${approval}\n\n`;
  } else {
    report += `Suggested Replacement: None (no simple adjustment found)\n`;
    report += `Luminance Difference: >10% or not achievable\n`;
    report += `Approval Required: Yes\n\n`;
  }
}

fs.writeFileSync(outPath, report, 'utf8');
console.log('WCAG audit complete. Report written to', outPath);
