'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const DIFFICULTIES = {
  easy:     { cols:4, safe:3, rows:9, label:'EASY',     ratio:'3 safe / 4', pct:'75%',  mult:[1.27,1.69,2.25,3.00,4.00,5.34,7.12,9.49,12.65], factor:0.85 },
  medium:   { cols:3, safe:2, rows:9, label:'MEDIUM',   ratio:'2 safe / 3', pct:'66%',  mult:[1.42,2.14,3.21,4.81,7.21,10.82,16.23,24.35,36.52], factor:0.65 },
  hard:     { cols:2, safe:1, rows:9, label:'HARD',     ratio:'1 safe / 2', pct:'50%',  mult:[1.90,3.80,7.60,15.20,30.40,60.80,121.60,243.20,486.40], factor:0.45 },
  extreme:  { cols:3, safe:1, rows:6, label:'EXTREME',  ratio:'1 safe / 3', pct:'33%',  mult:[2.85,8.55,25.65,76.95,230.85,692.55], factor:0.30 },
  nightmare:{ cols:4, safe:1, rows:6, label:'NIGHTMARE', ratio:'1 safe / 4', pct:'25%',  mult:[3.80,15.20,60.80,243.20,972.80,3891.20], factor:0.20 },
};
const ICONS: Record<string, string> = { easy:'\u{1F6E1}\u{FE0F}', medium:'\u26A1', hard:'\u{1F525}', extreme:'\u{1F480}', nightmare:'\u2620\u{FE0F}' };
type DiffKey = keyof typeof DIFFICULTIES;

interface CellData { safe: boolean; mult: number; row: number; col: number }
interface GridData { rows: CellData[][] }

function dvysPredict(cur: DiffKey): number {
  const d = DIFFICULTIES[cur];
  const f = d.factor;
  const maxSafe = Math.ceil(d.rows * f * (0.8 + Math.random() * 0.4));
  const minSafe = Math.max(1, Math.ceil(d.rows * f * 0.4));
  return Math.max(1, Math.min(d.rows, Math.min(maxSafe, Math.max(minSafe, minSafe + Math.floor(Math.random() * (maxSafe - minSafe + 1))))));
}

function buildGridData(cur: DiffKey): GridData {
  const d = DIFFICULTIES[cur];
  const grid: CellData[][] = [];
  for (let r = d.rows - 1; r >= 0; r--) {
    const row: CellData[] = [];
    const idx = Array.from({ length: d.cols }, (_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    const safeSet = new Set(idx.slice(0, d.safe));
    for (let c = 0; c < d.cols; c++) {
      row.push({ safe: safeSet.has(c), mult: d.mult[r], row: r, col: c });
    }
    grid.push(row);
  }
  return grid;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [loadPct, setLoadPct] = useState(0);
  const [cur, setCur] = useState<DiffKey>('easy');
  const [showPopover, setShowPopover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hasPredicted, setHasPredicted] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [revealedRows, setRevealedRows] = useState(0);
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [pathCells, setPathCells] = useState<Set<string>>(new Set());
  const [stopCells, setStopCells] = useState<Set<string>>(new Set());
  const [stopRow, setStopRow] = useState(0);
  const [resultClass, setResultClass] = useState('');
  const [resultMain, setResultMain] = useState('');
  const [resultSub, setResultSub] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showFox, setShowFox] = useState(false);
  const [particles] = useState(() => Array.from({ length: 12 }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 50,
    delay: Math.random() * 5,
    dur: Math.random() * 4 + 4,
  })));

  const gaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => { timerRef.current.forEach(t => clearTimeout(t)); timerRef.current = []; }, []);

  const selDiff = useCallback((k: DiffKey) => {
    setCur(k);
    setShowPopover(false);
    if (hasPredicted) { setShowGrid(false); setShowResult(false); setHasPredicted(false); clearTimers(); }
  }, [hasPredicted, clearTimers]);

  const doBack = useCallback(() => {
    setCur('easy');
    setShowGrid(false); setShowResult(false); setHasPredicted(false); clearTimers();
  }, [clearTimers]);

  const predict = useCallback(() => {
    if (busy) return;
    setBusy(true);
    setShowResult(false);
    clearTimers();

    if (hasPredicted) {
      setShowFox(true);
      const t = setTimeout(() => { setShowFox(false); startPrediction(); }, 7500);
      timerRef.current.push(t);
    } else {
      startPrediction();
    }
  }, [busy, hasPredicted, clearTimers]);

  const startPrediction = useCallback(() => {
    const gd = buildGridData(cur);
    setGridData(gd);
    setRevealedRows(0);
    setRevealedCells(new Set());
    setPathCells(new Set());
    setStopCells(new Set());
    setShowGrid(false);

    const target = dvysPredict(cur);
    setStopRow(target);
    const d = DIFFICULTIES[cur];
    const goAll = target >= d.rows;

    const t1 = setTimeout(() => {
      setShowGrid(true);
      const totalRows = gd.length;
      const rowsToReveal = goAll ? totalRows : Math.min(target, totalRows);
      let rowDelay = 0;

      for (let i = totalRows - 1; i >= totalRows - rowsToReveal; i--) {
        const delay = rowDelay;
        const t2 = setTimeout(() => {
          setRevealedRows(prev => prev + 1);
          const cells = gd[i];
          const isStopRow = totalRows - 1 - i === target - 1;
          const safeCells: number[] = [];
          cells.forEach((cell, ci) => { if (cell.safe) safeCells.push(ci); });
          const pathIdx = safeCells.length > 0 ? safeCells[Math.floor(Math.random() * safeCells.length)] : -1;

          cells.forEach((_, ci) => {
            const t3 = setTimeout(() => {
              setRevealedCells(prev => new Set(prev).add(`${i}-${ci}`));
              if (ci === pathIdx) {
                const t4 = setTimeout(() => setPathCells(prev => new Set(prev).add(`${i}-${ci}`)), 300);
                timerRef.current.push(t4);
              }
              if (isStopRow && ci === cells.length - 1) {
                const t5 = setTimeout(() => {
                  const sc = new Set<string>();
                  cells.forEach((cell, cci) => { if (cell.safe) sc.add(`${i}-${cci}`); });
                  setStopCells(sc);
                }, 400);
                timerRef.current.push(t5);
              }
            }, ci * 120);
            timerRef.current.push(t3);
          });
        }, delay);
        timerRef.current.push(t2);
        rowDelay += 1000;
      }

      const t6 = setTimeout(() => {
        const stopMult = d.mult[target - 1];
        if (goAll) {
          setResultClass('win'); setResultMain(`\u2705 Monte au sommet ! ${d.rows} marches`);
          setResultSub(`Max \u00d7${d.mult[d.mult.length - 1].toFixed(2)} \u00b7 ${d.label}`);
        } else if (target >= Math.ceil(d.rows * 0.5)) {
          setResultClass('win'); setResultMain(`\u2705 S'arr\u00eater \u00e0 la ligne ${target}`);
          setResultSub(`\u00d7${stopMult.toFixed(2)} \u00b7 Risque mod\u00e9r\u00e9 \u00b7 ${d.label}`);
        } else {
          setResultClass('caution'); setResultMain(`\u26A0\uFE0F Prudence : ligne ${target} uniquement`);
          setResultSub(`\u00d7${stopMult.toFixed(2)} \u00b7 Zone s\u00fbr \u00b7 ${d.label}`);
        }
        setShowResult(true);
        setBusy(false);
        setHasPredicted(true);
      }, rowDelay + 600);
      timerRef.current.push(t6);
    }, 800);
    timerRef.current.push(t1);
  }, [cur, clearTimers]);

  useEffect(() => {
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 12;
      if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => setLoading(false), 400); }
      setLoadPct(p);
    }, 200);
    return () => clearInterval(iv);
  }, []);

  const d = DIFFICULTIES[cur];

  return (
    <div className="gc">
      {/* Particles */}
      <div className="ptc">
        {particles.map((p, i) => <div key={i} className="pt" style={{ left: p.left+'%', top: p.top+'%', animationDelay: p.delay+'s', animationDuration: p.dur+'s' }} />)}
      </div>

      {/* Loading */}
      {loading && <div className={`ld${!loading ? ' hide' : ''}`}>
        <div className="ld-logo">THE FOX&apos;s JOB</div>
        <div className="ld-bar"><div className="ld-fill" style={{ width: loadPct+'%' }} /></div>
        <div className="ld-tag">DVYS AI Prediction</div>
      </div>}

      {/* Result banner */}
      <div className={`rb ${resultClass} ${showResult ? 'show' : ''}`}>
        <span className="rb-main">{resultMain}</span>
        <span className="rb-sub">{resultSub}</span>
      </div>

      {/* Top bar */}
      <div className="top">
        <button className="back" onClick={doBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          Retour
        </button>
        <div className="logo"><span className="logo-t">THE FOX&apos;s <span>JOB</span></span></div>
      </div>

      {/* DVYS badge */}
      <div className="dvys-badge">
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          <span className="dvys-logo">DVYS</span>
          <span className="dvys-sub">AI Prediction</span>
        </div>
      </div>

      {/* Grid area */}
      <div className={`ga${showGrid ? ' show' : ''}`} ref={gaRef}>
        <div className="diff-tag"><span>{d.label}</span><small>{d.ratio} \u00b7 {d.pct} de chances</small></div>
        <div className="grid">
          {gridData?.map((row, ri) => (
            <div key={ri} className={`row${ri < revealedRows ? ' visible' : ''}`}>
              {row.map((cell, ci) => {
                const key = `${ri}-${ci}`;
                const revealed = revealedCells.has(key);
                const isPath = pathCells.has(key);
                const isStop = stopCells.has(key);
                const mob = typeof window !== 'undefined' && window.innerWidth < 500;
                const cw = mob ? 88 : 106;
                const ch = mob ? 49 : 58;
                let cls = 'c';
                if (!revealed) cls += ' c-0';
                else if (cell.safe) cls += ' c-1';
                else cls += ' c-2';
                if (isPath) cls += ' c-path';
                if (isStop) cls += ' c-stop';
                return (
                  <div key={ci} className={cls} style={{ width: cw+'px', height: ch+'px' }}>
                    {revealed && cell.safe && <><span className="ci">{'\u{1FA99}'}</span><span className="cv">\u00d7{cell.mult.toFixed(2)}</span></>}
                    {revealed && !cell.safe && <><span className="ci">{'\u26D3\uFE0F'}</span><span className="cl">TRAP</span></>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Popover */}
      <div className={`popover-ov${showPopover ? ' show' : ''}`} onClick={() => setShowPopover(false)} />
      <div className={`popover${showPopover ? ' show' : ''}`}>
        <div className="pop-title">Choisir la difficult\u00e9</div>
        <div className="popover-pipe" />
        <div className="pop-list">
          {(Object.keys(DIFFICULTIES) as DiffKey[]).map(k => {
            const dd = DIFFICULTIES[k];
            return (
              <div key={k} className={`pop-opt${k === cur ? ' act' : ''}`} onClick={() => selDiff(k)}>
                <div className="pop-di">{ICONS[k]}</div>
                <div>
                  <div className="pop-dn">{dd.label}</div>
                  <div className="pop-dr">{dd.ratio} \u00b7 {dd.pct} de chances</div>
                  <div className="pop-dm">{dd.mult.length} marches \u00b7 Max {dd.mult[dd.mult.length-1].toFixed(2)}x</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fox run animation */}
      {showFox && <div className="fox-run" style={{ left:'110%', transition:'left 7s cubic-bezier(.22,.61,.36,1)' }}>
        <div className="fox-text">CASH OUT !</div>
        <div className="fox-img-wrap"><img className="fox-img" src="/fox_running.png" alt="fox" /></div>
      </div>}

      {/* Bottom controls */}
      <div className="bot">
        <button className="diff-btn" onClick={() => setShowPopover(true)}>
          <span className="db-icon">{'\u2699\uFE0F'}</span>
          <div className="db-text">
            <span className="db-name">{d.label}</span>
            <span className="db-sub">{d.ratio.split(' / ')[0]}/{d.ratio.split(' / ')[1]} \u00b7 {d.pct}</span>
          </div>
        </button>
        <button className={`pbtn${busy ? ' busy' : ''}`} onClick={predict}>
          {busy ? <>ANALYSE...<span className="bs">DVYS AI</span></> : <>PR\u00C9DIRE<span className="bs">DVYS AI</span></>}
        </button>
      </div>
    </div>
  );
}
