import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, ArrowRight, BarChart3, Beaker, Box, Check, ChevronRight,
  CircleHelp, Clock3, Download, FlaskConical, Leaf, Menu, Moon,
  PackageCheck, RefreshCw, Search, Settings2, ShieldCheck, Sparkles,
  Sun, Truck, X, Zap
} from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'

type Commodity = {
  id: string
  name: string
  category: string
  icon: string
  moisture: number
  aw: number
  oxygen: number
  respiration: number
  shelf: number
  temp: [number, number]
  rh: [number, number]
}
type Material = {
  id: string
  name: string
  type: string
  cost: number
  bio: number
  recycle: number
  otr: number
  wvtr: number
  strength: number
  compostable: boolean
  description: string
}

const commodities: Commodity[] = [
  {id:'mango',name:'Alphonso Mango',category:'Fresh Produce',icon:'🥭',moisture:83.5,aw:.97,oxygen:6.5,respiration:42,shelf:7,temp:[11,13],rh:[85,90]},
  {id:'paneer',name:'Fresh Paneer',category:'Dairy',icon:'🧀',moisture:54,aw:.98,oxygen:9.2,respiration:0,shelf:3,temp:[2,4],rh:[85,95]},
  {id:'spices',name:'Ground Spices',category:'Dry Foods',icon:'🌶️',moisture:9.8,aw:.45,oxygen:8,respiration:0,shelf:90,temp:[15,25],rh:[40,60]},
  {id:'strawberry',name:'Mahabaleshwar Strawberry',category:'Fresh Produce',icon:'🍓',moisture:90.9,aw:.99,oxygen:6,respiration:55,shelf:4,temp:[.5,2],rh:[90,95]},
  {id:'coffee',name:'Roasted Arabica Coffee',category:'Beverage',icon:'☕',moisture:2.5,aw:.25,oxygen:9.5,respiration:0,shelf:45,temp:[18,24],rh:[30,50]},
  {id:'fish',name:'Fresh Fish Fillet',category:'Protein',icon:'🐟',moisture:78.2,aw:.985,oxygen:9,respiration:0,shelf:2,temp:[-1,2],rh:[90,95]},
]

const materials: Material[] = [
  {id:'biofilm',name:'PLA / PBAT Bio-Composite Film',type:'Bio-Compostable',cost:285,bio:88,recycle:18,otr:420,wvtr:48,strength:68,compostable:true,description:'Breathable bio-based film designed for fresh produce and low-impact applications.'},
  {id:'nanocellulose',name:'Bio-Nano Cellulose Kraft',type:'Bio-Compostable',cost:310,bio:96,recycle:92,otr:28,wvtr:14.5,strength:74,compostable:true,description:'Paper-based barrier solution balancing renewable content, protection and recyclability.'},
  {id:'rpet',name:'Recycled rPET + SiOx Barrier',type:'Circular Recycled',cost:220,bio:0,recycle:96,otr:4.5,wvtr:4.8,strength:94,compostable:false,description:'High-strength recycled barrier packaging for products needing oxygen and moisture protection.'},
  {id:'mono',name:'Mono-Material MDO-PE / PE',type:'Recyclable',cost:175,bio:0,recycle:90,otr:85,wvtr:6.2,strength:88,compostable:false,description:'Cost-efficient mono-material structure designed for simpler recycling pathways.'},
  {id:'evoh',name:'7-Layer EVOH Barrier',type:'High Barrier',cost:340,bio:0,recycle:35,otr:1.8,wvtr:3.2,strength:97,compostable:false,description:'Ultra-high barrier construction for sensitive, high-value and long-transit foods.'},
  {id:'chitosan',name:'Chitosan Active Film',type:'Active Functional',cost:395,bio:92,recycle:12,otr:180,wvtr:35,strength:61,compostable:true,description:'Bioactive film concept for applications where microbial control is important.'},
]

const historySeed = [
  {id:1,commodity:'Alphonso Mango',material:'PLA / PBAT Bio-Composite Film',score:91,date:'Today, 18:42'},
  {id:2,commodity:'Ground Spices',material:'7-Layer EVOH Barrier',score:88,date:'Yesterday, 14:10'},
  {id:3,commodity:'Fresh Paneer',material:'Chitosan Active Film',score:86,date:'Sep 14, 11:32'},
]

function scoreMaterial(c: Commodity, m: Material, temp:number, rh:number, weights:{cost:number,shelf:number,eco:number}) {
  const tempFit = temp >= c.temp[0] && temp <= c.temp[1] ? 1 : Math.max(0, 1 - Math.abs(temp - (c.temp[0]+c.temp[1])/2)/15)
  const rhFit = rh >= c.rh[0] && rh <= c.rh[1] ? 1 : Math.max(0, 1 - Math.abs(rh-(c.rh[0]+c.rh[1])/2)/60)
  const produce = c.respiration > 10
  const barrier = produce
    ? (m.otr >= 20 && m.otr <= 500 ? .96 : .55)
    : Math.max(.35, Math.min(1, (120/(m.otr+8))*.55 + (35/(m.wvtr+3))*.45))
  const protection = Math.min(100, 45 + barrier*38 + tempFit*10 + rhFit*7)
  const cost = Math.max(10, Math.min(100, 100 - ((m.cost-150)/280)*80))
  const eco = Math.min(100, m.bio*.55 + m.recycle*.35 + (m.compostable ? 18 : 0))
  const shelf = Math.min(100, Math.max(12, c.shelf * (0.55 + barrier*.65) * (tempFit*.65 + .35) / Math.max(1,c.shelf/25)))
  const total = Math.round(protection*0.35 + cost*weights.cost/100 + shelf*weights.shelf/100 + eco*weights.eco/100)
  return {total:Math.min(99,Math.max(35,total)),protection:Math.round(protection),cost:Math.round(cost),eco:Math.round(eco),shelf:Math.round(shelf),tempFit,rhFit}
}

function App(){
  const [page,setPage] = useState('dashboard')
  const [dark,setDark] = useState(false)
  const [mobile,setMobile] = useState(false)
  const [commodityId,setCommodityId] = useState('mango')
  const [temp,setTemp] = useState(12)
  const [rh,setRh] = useState(88)
  const [transit,setTransit] = useState(18)
  const [coldChain,setColdChain] = useState(true)
  const [weights,setWeights] = useState({cost:25,shelf:45,eco:30})
  const [search,setSearch] = useState('')
  const [history,setHistory] = useState(historySeed)
  const [selectedCompare,setSelectedCompare] = useState<string[]>(['biofilm','nanocellulose','rpet'])
  const [assistantOpen,setAssistantOpen] = useState(false)

  const commodity = commodities.find(x=>x.id===commodityId)!
  const ranked = useMemo(()=>materials.map(m=>({m,s:scoreMaterial(commodity,m,temp,rh,weights)})).sort((a,b)=>b.s.total-a.s.total),[commodity,temp,rh,weights])
  const top = ranked[0]
  const simData = useMemo(()=>Array.from({length:30},(_,i)=>{
    const stress = Math.max(0,(temp-commodity.temp[1])*0.9) + Math.max(0,(rh-commodity.rh[1])*.08) + transit*.015
    const q = Math.max(8,100-i*(1.35+stress*.18))
    return {day:i+1,quality:Math.round(q),microbial:Math.round(Math.max(5,q-(commodity.aw>.85?i*0.35:0))),oxidation:Math.round(Math.max(5,q-(commodity.oxygen>8?i*.22:0)))}
  }),[commodity,temp,rh,transit])
  const ecoData = [{name:'Renewable',value:top.m.bio},{name:'Recyclable',value:top.m.recycle},{name:'Other',value:Math.max(1,100-top.m.bio-top.m.recycle)}]
  const compare = selectedCompare.map(id=>materials.find(m=>m.id===id)!).filter(Boolean)

  const saveAnalysis=()=>{
    setHistory(h=>[{id:Date.now(),commodity:commodity.name,material:top.m.name,score:top.s.total,date:'Just now'},...h].slice(0,10))
    setPage('history')
  }

  const navigate=(p:string)=>{setPage(p);setMobile(false);window.scrollTo({top:0,behavior:'smooth'})}

  return <div className={dark?'app dark':'app'}>
    <header className="topbar">
      <div className="brand" onClick={()=>navigate('dashboard')}>
        <div className="brand-mark"><Leaf size={19}/></div>
        <div><strong>BioPack<span>AI</span></strong><small>Intelligent Packaging Intelligence</small></div>
      </div>
      <nav className="desktop-nav">
        {[
          ['dashboard','Overview'],['analyze','Analyze'],['compare','Compare'],['library','Library'],['history','History']
        ].map(([id,label])=><button key={id} className={page===id?'nav-active':''} onClick={()=>navigate(id)}>{label}</button>)}
      </nav>
      <div className="top-actions">
        <button className="icon-btn" onClick={()=>setDark(!dark)} title="Toggle theme">{dark?<Sun size={18}/>:<Moon size={18}/>}</button>
        <button className="icon-btn" onClick={()=>setAssistantOpen(true)} title="AI assistant"><Sparkles size={18}/></button>
        <button className="profile"><span>VB</span><b>Team BioPack</b></button>
        <button className="mobile-menu icon-btn" onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<Menu/>}</button>
      </div>
    </header>

    {mobile && <div className="mobile-nav">{[['dashboard','Overview'],['analyze','Analyze'],['compare','Compare'],['library','Library'],['history','History']].map(([id,l])=><button key={id} onClick={()=>navigate(id)}>{l}</button>)}</div>}

    <main>
      <AnimatePresence mode="wait">
        {page==='dashboard' && <Dashboard navigate={navigate} top={top} history={history} ranked={ranked} />}
        {page==='analyze' && <Analyze commodity={commodity} commodityId={commodityId} setCommodityId={setCommodityId} temp={temp} setTemp={setTemp} rh={rh} setRh={setRh} transit={transit} setTransit={setTransit} coldChain={coldChain} setColdChain={setColdChain} weights={weights} setWeights={setWeights} ranked={ranked} top={top} saveAnalysis={saveAnalysis} navigate={navigate}/>}
        {page==='compare' && <Compare compare={compare} selected={selectedCompare} setSelected={setSelectedCompare}/>}
        {page==='library' && <Library search={search} setSearch={setSearch}/>}
        {page==='history' && <History history={history} navigate={navigate}/>}
      </AnimatePresence>
    </main>

    {page==='analyze' && <section className="simulation-section">
      <div className="section-head"><div><span className="eyebrow">LIVE MODEL</span><h2>Preservation simulation</h2><p>Explore how conditions can affect product quality over the transit window.</p></div><div className="live-chip"><span/> Simulation active</div></div>
      <div className="sim-grid">
        <div className="panel chart-panel"><div className="panel-title"><div><b>Quality trajectory</b><span>30-day model estimate</span></div><Activity size={18}/></div><ResponsiveContainer width="100%" height={270}><AreaChart data={simData}><defs><linearGradient id="q" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity=".32"/><stop offset="100%" stopColor="#10b981" stopOpacity="0"/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={dark?'#243244':'#e8edf2'}/><XAxis dataKey="day" tick={{fontSize:11}}/><YAxis domain={[0,100]} tick={{fontSize:11}}/><Tooltip/><Area type="monotone" dataKey="quality" stroke="#10b981" fill="url(#q)" strokeWidth={3}/></AreaChart></ResponsiveContainer></div>
        <div className="panel vector-panel"><div className="panel-title"><div><b>Degradation vectors</b><span>Relative contribution</span></div><FlaskConical size={18}/></div><ResponsiveContainer width="100%" height={220}><BarChart data={simData.filter((_,i)=>[4,9,14,19,24,29].includes(i))}><CartesianGrid strokeDasharray="3 3" stroke={dark?'#243244':'#e8edf2'}/><XAxis dataKey="day"/><YAxis domain={[0,100]} tick={{fontSize:11}}/><Tooltip/><Bar dataKey="microbial" fill="#ef4444" radius={[5,5,0,0]}/><Bar dataKey="oxidation" fill="#f59e0b" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer><div className="legend"><span><i className="red"/>Microbial</span><span><i className="amber"/>Oxidation</span></div></div>
      </div>
    </section>}

    <footer><div><b>BioPack<span>AI</span></b><span>Decision intelligence for sustainable food packaging.</span></div><span>Prototype model • Validate critical outputs experimentally before commercial use.</span></footer>

    <AnimatePresence>{assistantOpen && <Assistant close={()=>setAssistantOpen(false)} commodity={commodity} top={top}/>}</AnimatePresence>
  </div>
}

function Dashboard({navigate,top,history,ranked}:{navigate:(p:string)=>void,top:any,history:any[],ranked:any[]}){
  const stats=[['92%','Avg. suitability','Across recent analyses'],['18 days','Shelf-life potential','Top current scenario'],['−31%','Estimated material impact','Versus baseline'],['12','Materials evaluated','In current library']]
  return <motion.div className="page" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
    <section className="hero">
      <div className="hero-copy"><span className="eyebrow">PACKAGING INTELLIGENCE PLATFORM</span><h1>Design the right package<br/><em>before you produce it.</em></h1><p>BioPack AI turns food characteristics, storage conditions, logistics and sustainability goals into an explainable packaging recommendation.</p><div className="hero-actions"><button className="primary" onClick={()=>navigate('analyze')}><Sparkles size={17}/> Start new analysis <ArrowRight size={17}/></button><button className="secondary" onClick={()=>navigate('library')}><Box size={17}/> Explore materials</button></div></div>
      <div className="hero-visual"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="package-art"><div className="pack-top">BIO</div><div className="pack-label"><Leaf size={24}/><b>FRESH<br/>PROTECT</b><small>plant-based barrier</small></div><div className="pack-bottom">BIOPACK AI</div></div><div className="floating-card fc-top"><ShieldCheck size={16}/><span>Barrier fit</span><b>{top.s.protection}%</b></div><div className="floating-card fc-bottom"><Leaf size={16}/><span>Eco index</span><b>{top.s.eco}/100</b></div></div>
    </section>
    <section className="stats-grid">{stats.map(([a,b,c])=><div className="stat-card" key={b}><b>{a}</b><strong>{b}</strong><span>{c}</span></div>)}</section>
    <section className="content-grid">
      <div className="panel feature-panel"><div className="section-head compact"><div><span className="eyebrow">RECOMMENDED NOW</span><h2>Packaging intelligence</h2></div><button className="text-btn" onClick={()=>navigate('analyze')}>Open analysis <ChevronRight size={15}/></button></div><div className="rec-main"><div className="score-ring"><span>{top.s.total}</span><small>/100</small></div><div className="rec-copy"><span className="badge green">BEST FIT</span><h3>{top.m.name}</h3><p>{top.m.description}</p><div className="mini-metrics"><Metric label="Protection" value={top.s.protection}/><Metric label="Eco" value={top.s.eco}/><Metric label="Cost fit" value={top.s.cost}/><Metric label="Shelf-life" value={top.s.shelf}/></div></div></div></div>
      <div className="panel recent-panel"><div className="section-head compact"><div><span className="eyebrow">RECENT</span><h2>Analysis history</h2></div><button className="text-btn" onClick={()=>navigate('history')}>View all</button></div>{history.slice(0,3).map((x:any)=><div className="history-row" key={x.id}><span className="history-icon"><PackageCheck size={16}/></span><div><b>{x.commodity}</b><small>{x.material}</small></div><strong>{x.score}</strong></div>)}</div>
    </section>
    <section className="why-strip"><div className="why-icon"><Zap/></div><div><b>Built for explainable decisions</b><p>Every recommendation is broken into protection, shelf-life, cost and sustainability factors—so your team can explain the decision in seconds.</p></div><button className="secondary" onClick={()=>navigate('analyze')}>See how it works</button></section>
  </motion.div>
}

function Analyze({commodity,commodityId,setCommodityId,temp,setTemp,rh,setRh,transit,setTransit,coldChain,setColdChain,weights,setWeights,ranked,top,saveAnalysis,navigate}:any){
  const [step,setStep]=useState(1)
  const [expanded,setExpanded]=useState(false)

  return (
    <motion.div className="page" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
      <div className="page-heading">
        <div>
          <span className="eyebrow">NEW ANALYSIS</span>
          <h1>Packaging recommendation</h1>
          <p>Tell us about the product and journey. BioPack AI handles the complexity.</p>
        </div>
        <div className="analysis-id">ANALYSIS <b>BP-{String(Date.now()).slice(-6)}</b></div>
      </div>

      <div className="stepper">
        {[
          ['1','Product'],
          ['2','Conditions'],
          ['3','Priorities'],
          ['4','Recommendation']
        ].map(([n,l],i)=>(
          <button key={n} className={step===i+1?'step-active':''} onClick={()=>setStep(i+1)}>
            <span>{i+1<step ? <Check size={14}/> : n}</span>
            <b>{l}</b>
          </button>
        ))}
      </div>

      {step < 4 ? (
        <div className="wizard-grid">
          <div className="panel wizard-panel">
            {step===1 && (
              <>
                <PanelTitle eyebrow="STEP 01" title="What are you packaging?" sub="Select the product closest to your use case."/>
                <div className="commodity-grid">
                  {commodities.map(c=>(
                    <button
                      key={c.id}
                      className={commodityId===c.id?'commodity active':'commodity'}
                      onClick={()=>{
                        setCommodityId(c.id)
                        setTemp((c.temp[0]+c.temp[1])/2)
                        setRh(Math.round((c.rh[0]+c.rh[1])/2))
                      }}
                    >
                      <span>{c.icon}</span>
                      <div><b>{c.name}</b><small>{c.category}</small></div>
                      {commodityId===c.id && <Check size={17}/>} 
                    </button>
                  ))}
                </div>
              </>
            )}

            {step===2 && (
              <>
                <PanelTitle eyebrow="STEP 02" title="Describe the journey" sub="Packaging performance changes with the environment."/>
                <div className="control-grid">
                  <Slider label="Temperature" value={temp} set={setTemp} min={-5} max={45} unit="°C" note={`Ideal: ${commodity.temp[0]}–${commodity.temp[1]}°C`}/>
                  <Slider label="Relative humidity" value={rh} set={setRh} min={20} max={100} unit="%" note={`Ideal: ${commodity.rh[0]}–${commodity.rh[1]}%`}/>
                  <Slider label="Transit duration" value={transit} set={setTransit} min={1} max={60} unit="days" note="Expected journey duration"/>
                </div>
                <div className="toggle-row">
                  <div><b>Cold-chain available</b><small>Use refrigerated transport/storage</small></div>
                  <button className={coldChain?'toggle on':'toggle'} onClick={()=>setColdChain(!coldChain)}><span/></button>
                </div>
              </>
            )}

            {step===3 && (
              <>
                <PanelTitle eyebrow="STEP 03" title="What matters most?" sub="Adjust the decision model to match your business priorities."/>
                <div className="priority-cards">
                  <Priority label="Affordability" value={weights.cost} set={(v:number)=>setWeights((w:any)=>({...w,cost:v}))} icon="₹"/>
                  <Priority label="Shelf-life" value={weights.shelf} set={(v:number)=>setWeights((w:any)=>({...w,shelf:v}))} icon="◷"/>
                  <Priority label="Sustainability" value={weights.eco} set={(v:number)=>setWeights((w:any)=>({...w,eco:v}))} icon="♻"/>
                </div>
                <div className="balance-note"><Sparkles size={16}/> The model will rebalance your priorities to create a single suitability score.</div>
              </>
            )}

            <div className="wizard-actions">
              {step>1 && <button className="secondary" onClick={()=>setStep(step-1)}>Back</button>}
              <button className="primary" onClick={()=>setStep(step+1)}>
                {step===3?'Generate recommendation':'Continue'} <ArrowRight size={16}/>
              </button>
            </div>
          </div>

          <div className="panel context-panel">
            <PanelTitle eyebrow="LIVE CONTEXT" title={commodity.name} sub="Current analysis inputs"/>
            <div className="context-product">
              <span>{commodity.icon}</span>
              <div><b>{commodity.name}</b><small>{commodity.category}</small></div>
            </div>
            <div className="context-list">
              <Context label="Temperature" value={`${temp}°C`} ok={temp>=commodity.temp[0]&&temp<=commodity.temp[1]}/>
              <Context label="Humidity" value={`${rh}% RH`} ok={rh>=commodity.rh[0]&&rh<=commodity.rh[1]}/>
              <Context label="Transit" value={`${transit} days`} ok={transit<commodity.shelf*2}/>
              <Context label="Cold chain" value={coldChain?'Available':'Not available'} ok={coldChain}/>
            </div>
            <div className="hint"><CircleHelp size={15}/><span>These inputs drive barrier, shelf-life and logistics compatibility.</span></div>
          </div>
        </div>
      ) : (
        <div className="results">
          <div className="result-hero panel">
            <div className="result-score">
              <div className="big-score">{top.s.total}</div>
              <span>Suitability score</span>
              <div className="score-bar"><i style={{width:`${top.s.total}%`}}/></div>
            </div>
            <div className="result-summary">
              <span className="badge green">RECOMMENDED</span>
              <h2>{top.m.name}</h2>
              <p>{top.m.description}</p>
              <div className="reason">
                <Sparkles size={17}/>
                <span><b>Why this material?</b> It balances the current protection requirement with your selected cost, shelf-life and sustainability priorities.</span>
              </div>
              <div className="result-actions">
                <button className="primary" onClick={saveAnalysis}><Download size={16}/> Save analysis</button>
                <button className="secondary" onClick={()=>setExpanded(!expanded)}><BarChart3 size={16}/> {expanded?'Hide':'View'} score breakdown</button>
              </div>
            </div>
          </div>

          <div className="result-grid">
            <div className="panel">
              <PanelTitle eyebrow="SCORE BREAKDOWN" title="Why it fits"/>
              <div className="breakdown">
                {[
                  ['Protection', top.s.protection, '#10b981'],
                  ['Shelf-life', top.s.shelf, '#3b82f6'],
                  ['Cost fit', top.s.cost, '#f59e0b'],
                  ['Eco index', top.s.eco, '#8b5cf6']
                ].map((row:any)=>(
                  <div className="break-row" key={row[0]}>
                    <div><span>{row[0]}</span><b>{row[1]}</b></div>
                    <div className="bar"><i style={{width:`${row[1]}%`,background:row[2]}}/></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <PanelTitle eyebrow="ALTERNATIVES" title="Other viable choices"/>
              {ranked.slice(1,4).map((item:any)=>(
                <div className="alt-row" key={item.m.id}>
                  <span className="material-dot"/>
                  <div><b>{item.m.name}</b><small>{item.m.type}</small></div>
                  <strong>{item.s.total}</strong>
                  <button onClick={()=>{}}><ChevronRight size={15}/></button>
                </div>
              ))}
            </div>
          </div>

          {expanded && (
            <div className="panel explanation">
              <PanelTitle eyebrow="EXPLAINABILITY" title="What changed the score?"/>
              <div className="explain-grid">
                <Explain title="Product fit" text={`${commodity.name} has ${commodity.oxygen} / 10 oxygen sensitivity and ${commodity.aw} water activity.`}/>
                <Explain title="Environment" text={`${temp}°C and ${rh}% RH were compared with the product's ideal storage range.`}/>
                <Explain title="Business priorities" text={`The model weighted cost ${weights.cost}%, shelf-life ${weights.shelf}% and sustainability ${weights.eco}%.`}/>
                <Explain title="Decision" text={`${top.m.name} provides the strongest combined score under these assumptions.`}/>
              </div>
            </div>
          )}

          <button className="text-btn back-dashboard" onClick={()=>navigate('dashboard')}>← Back to overview</button>
        </div>
      )}
    </motion.div>
  )
}

function Compare({compare,selected,setSelected}:any){
  return <motion.div className="page" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
    <div className="page-heading"><div><span className="eyebrow">DECISION WORKSPACE</span><h1>Compare materials</h1><p>Put competing packaging options side by side before making a decision.</p></div></div>
    <div className="panel compare-picker"><b>Select up to three materials</b><div>{materials.map(m=><button key={m.id} className={selected.includes(m.id)?'selected':''} onClick={()=>setSelected((s:string[])=>s.includes(m.id)?s.filter(x=>x!==m.id):s.length<3?[...s,m.id]:s)}>{m.name}{selected.includes(m.id)&&<Check size={14}/>}</button>)}</div></div>
    <div className="compare-table panel"><div className="compare-head"><div className="metric-col">Metric</div>{compare.map(m=><div key={m.id} className="compare-material"><span className="material-symbol">{m.compostable?'♻':'◈'}</span><b>{m.name}</b><small>{m.type}</small></div>)}</div>{[['Cost / kg',...compare.map(m=>`₹${m.cost}`)],['Bio-based',...compare.map(m=>`${m.bio}%`)],['Recyclability',...compare.map(m=>`${m.recycle}%`)],['O₂ barrier (OTR)',...compare.map(m=>`${m.otr}`)],['Moisture barrier',...compare.map(m=>`${m.wvtr}`)],['Strength',...compare.map(m=>`${m.strength}/100`)]].map(row=><div className="compare-row" key={row[0]}>{row.map((x:any,i:number)=><div key={i} className={i===0?'metric-col':''}>{x}</div>)}</div>)}</div>
    <div className="compare-bottom"><div className="panel"><PanelTitle eyebrow="SUSTAINABILITY MIX" title="Material profile"/><ResponsiveContainer width="100%" height={230}><PieChart><Pie data={compare.map(m=>({name:m.name,value:m.bio+m.recycle}))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85}>{compare.map((_,i)=><Cell key={i} fill={['#10b981','#3b82f6','#8b5cf6'][i]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div><div className="panel tradeoffs"><PanelTitle eyebrow="TRADE-OFFS" title="What to discuss with the team"/>{compare.map(m=><div className="trade-row" key={m.id}><div><b>{m.name}</b><small>{m.description}</small></div><span className={m.recycle>70?'good':''}>{m.recycle>70?'Circularity':'Barrier-first'}</span></div>)}</div></div>
  </motion.div>
}

function Library({search,setSearch}:{search:string,setSearch:(s:string)=>void}){
  const filtered=materials.filter(m=>m.name.toLowerCase().includes(search.toLowerCase())||m.type.toLowerCase().includes(search.toLowerCase()))
  return <motion.div className="page" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
    <div className="page-heading"><div><span className="eyebrow">KNOWLEDGE LIBRARY</span><h1>Materials & packaging</h1><p>A structured reference library for your packaging decisions.</p></div><div className="searchbox"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search materials…"/></div></div>
    <div className="library-grid">{filtered.map(m=><div className="material-card panel" key={m.id}><div className="material-top"><span className="material-symbol">{m.compostable?'♻':'◈'}</span><span className="badge">{m.type}</span></div><h3>{m.name}</h3><p>{m.description}</p><div className="material-stats"><Metric label="Cost" value={`₹${m.cost}/kg`} plain/><Metric label="Bio-based" value={`${m.bio}%`} plain/><Metric label="Recyclable" value={`${m.recycle}%`} plain/></div><div className="card-foot"><span><ShieldCheck size={14}/> Food-contact review</span><button className="icon-btn"><ChevronRight size={16}/></button></div></div>)}</div>
  </motion.div>
}

function History({history,navigate}:{history:any[],navigate:(p:string)=>void}){
  return <motion.div className="page" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
    <div className="page-heading"><div><span className="eyebrow">YOUR WORKSPACE</span><h1>Analysis history</h1><p>Saved decisions and scenarios your team can revisit.</p></div><button className="primary" onClick={()=>navigate('analyze')}><Sparkles size={16}/> New analysis</button></div>
    <div className="panel history-table">{history.map((x:any)=><div className="history-full" key={x.id}><div className="history-icon"><PackageCheck size={17}/></div><div><b>{x.commodity}</b><span>{x.material}</span></div><div className="history-date"><Clock3 size={14}/>{x.date}</div><div className="score-pill">{x.score}</div><button className="icon-btn"><ChevronRight size={16}/></button></div>)}</div>
  </motion.div>
}

function Assistant({close,commodity,top}:{close:()=>void,commodity:Commodity,top:any}){
  const [question,setQuestion]=useState('')
  const answer=question.toLowerCase().includes('why')?`For ${commodity.name}, ${top.m.name} currently scores ${top.s.total}/100 because it balances barrier performance with your selected business priorities.`:
    question.toLowerCase().includes('sustain')?`${top.m.name} has a ${top.s.eco}/100 eco index in this model, driven by renewable content and recyclability assumptions.`:
    `I can explain the recommendation, compare materials, or help you understand the shelf-life simulation. Try asking “Why this material?”`
  return <motion.div className="assistant-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={close}><motion.div className="assistant" initial={{x:400}} animate={{x:0}} exit={{x:400}} onClick={e=>e.stopPropagation()}><div className="assistant-head"><div><Sparkles size={18}/><b>PackAI Assistant</b></div><button className="icon-btn" onClick={close}><X size={17}/></button></div><div className="assistant-body"><div className="ai-message"><Sparkles size={15}/><span>Hi! I can explain BioPack AI's recommendation for <b>{commodity.name}</b>.</span></div><div className="ai-message"><span>{answer}</span></div></div><div className="assistant-suggestions">{['Why this material?','How is eco score calculated?','Explain shelf-life'].map(q=><button key={q} onClick={()=>setQuestion(q)}>{q}</button>)}</div><div className="assistant-input"><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask PackAI…"/><button className="primary" onClick={()=>{}}><ArrowRight size={16}/></button></div></motion.div></motion.div>
}

function PanelTitle({eyebrow,title,sub}:{eyebrow:string,title:string,sub?:string}){return <div className="panel-title"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{sub&&<p>{sub}</p>}</div></div>}
function Metric({label,value,plain=false}:{label:string,value:any,plain?:boolean}){return <div className={plain?'metric plain':'metric'}><span>{label}</span><b>{value}</b>{!plain&&<div className="microbar"><i style={{width:`${typeof value==='number'?value:0}%`}}/></div>}</div>}
function Slider({label,value,set,min,max,unit,note}:{label:string,value:number,set:(n:number)=>void,min:number,max:number,unit:string,note:string}){return <div className="slider-card"><div><b>{label}</b><strong>{value}<small>{unit}</small></strong></div><input type="range" min={min} max={max} value={value} onChange={e=>set(Number(e.target.value))}/><small>{note}</small></div>}
function Priority({label,value,set,icon}:{label:string,value:number,set:(n:number)=>void,icon:string}){return <div className="priority"><div className="priority-top"><span>{icon}</span><b>{label}</b><strong>{value}%</strong></div><input type="range" min="0" max="100" value={value} onChange={e=>set(Number(e.target.value))}/></div>}
function Context({label,value,ok}:{label:string,value:string,ok:boolean}){return <div className="context-row"><span>{label}</span><b>{value}</b><i className={ok?'ok':'warn'}>{ok?<Check size={12}/>:<CircleHelp size={12}/>}</i></div>}
function Explain({title,text}:{title:string,text:string}){return <div className="explain"><span><Check size={13}/></span><div><b>{title}</b><p>{text}</p></div></div>}

export default App
