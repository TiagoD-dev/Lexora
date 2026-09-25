const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const base = path.resolve(__dirname, '..');
const native = { StyleSheet: { create: x => x }, View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', Modal: 'Modal', TextInput: 'TextInput' };
function load(relative, mocks = {}) {
  const file = path.join(base, relative);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(js, { exports, __DEV__: false, console, require: name => {
    if (name in mocks) return mocks[name];
    if (name === 'react-native') return native;
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    return {};
  } }, { filename: file });
  return exports;
}
function hookHarness(storage, initial) {
  let index = 0, slots = [], effects = [], options = initial;
  const react = {
    useRef(value) { const i = index++; return slots[i] ??= { current: value }; },
    useState(value) { const i = index++; slots[i] ??= { value }; return [slots[i].value, next => { slots[i].value = typeof next === 'function' ? next(slots[i].value) : next; }]; },
    useCallback(fn, deps) { const i = index++; const old = slots[i]; if (!old || deps.some((x,j) => x !== old.deps[j])) slots[i] = { fn, deps }; return slots[i].fn; },
    useEffect(fn, deps) { const i = index++; const old = slots[i]; if (!old || deps.some((x,j) => x !== old.deps[j])) { const slot = { deps }; slots[i] = slot; effects.push(() => { old?.cleanup?.(); slot.cleanup = fn(); }); } },
  };
  react.useLayoutEffect = react.useEffect;
  const { useSyncedCollection } = load('src/hooks/use-synced-collection.ts', { react, '@react-native-async-storage/async-storage': { __esModule: true, default: storage } });
  const render = () => { index = 0; const result = useSyncedCollection(options); const next = effects; effects = []; next.forEach(fn => fn()); return result; };
  return { render, change(next) { options = { ...options, ...next }; return render(); }, async settle() { let result; for (let n=0;n<50;n++) { await Promise.resolve(); result = render(); } return result; }, unmount() { slots.forEach(slot => slot?.cleanup?.()); } };
}
(async () => {
  const memory = new Map([['test/v1', JSON.stringify([{id:'legacy-secret'}])]]);
  const storage = { async getItem(key) { return memory.get(key) ?? null; }, async setItem(key,value) { memory.set(key,value); } };
  const remote = [], calls = []; let fail = true;
  const options = { userId: 'A', storageKey: 'test/v2', normalize: x=>x, loadRemote: async()=>remote.slice(),
    createRemote: async item => { calls.push('create'); if(fail) throw Error('offline'); remote.push(item); },
    updateRemote: async(id,patch)=>{calls.push('update'); Object.assign(remote.find(x=>x.id===id),patch);}, deleteRemote: async()=>{} };
  let h=hookHarness(storage,options); h.render(); let value=await h.settle();
  assert.equal(value.items.length,0,'legacy cache must not load');
  let recipes=0;
  value.setItems(items=>{ recipes++; return [...items,{id:'one',title:'draft'}]; });
  value.enqueue({kind:'create',item:{id:'one',title:'draft'}});
  value=await h.settle(); assert.equal(value.syncStatus,'error'); assert.equal(recipes,1);
  value.setItems(items=>items.map(x=>({...x,title:'updated'})));
  value.enqueue({kind:'update',id:'one',patch:{title:'updated'}});
  value=await h.settle(); assert.equal(calls.join(','),'create','failed create must block subsequent patch');
  const saved=JSON.parse(memory.get('test/v2/A')); assert.equal(saved.pending.length,2); assert.equal(saved.items[0].title,'updated');
  h.unmount(); h=hookHarness(storage,options); h.render(); value=await h.settle();
  assert.equal(value.syncStatus,'error'); assert.equal(value.items[0].title,'updated','pending local edits survive restart/refetch');
  fail=false; value.retrySync(); value=await h.settle();
  assert.equal(calls.join(','),'create,create,update'); assert.equal(value.syncStatus,'saved'); assert.equal(remote[0].title,'updated');
  assert.equal(JSON.parse(memory.get('test/v2/A')).pending.length,0);
  value=h.change({userId:'B',loadRemote:async()=>[{id:'B-only'}]}); assert.equal(value.items.length,0,'A never visible during B render');
  value=await h.settle(); assert.equal(value.items[0].id,'B-only');
  let resolveA; const slow=hookHarness(storage,{...options,userId:'slowA',loadRemote:()=>new Promise(r=>resolveA=r)}); slow.render(); await slow.settle();
  slow.change({userId:'slowB',loadRemote:async()=>[{id:'new-account'}]}); await slow.settle(); resolveA([{id:'old-account'}]);
  assert.equal((await slow.settle()).items[0].id,'new-account');
  const deadlines=load('src/utils/deadlines.ts');
  const {buildAgenda}=load('src/components/priority-agenda.tsx',{'@/utils/deadlines':deadlines});
  const task=(id,dueDate,extra={})=>({id,title:id,dueDate,completed:false,priority:'Normal',deadlineKind:'Interno',...extra});
  const agenda=buildAgenda([{id:'case',title:'Case',tasks:[task('late2','2026-09-04'),task('late1','2026-09-01'),task('today','2026-09-05'),task('seven','2026-09-12'),task('eight','2026-09-13'),task('done','2026-09-01',{completed:true}),task('invalid','2026-02-31')]}],new Date(2026,8,5,12));
  assert.equal(agenda[0].items.map(x=>x.task.id).join(','),'late1,late2'); assert.equal(agenda[1].items[0].task.id,'today'); assert.equal(agenda[2].items.map(x=>x.task.id).join(','),'seven');
  const fixtures=[{id:'case',title:'Processo',client:'Cliente',reference:'LEX',documents:[{id:'doc',name:'Contrato',type:'PDF',extractedText:'A obrigação exclusiva consta aqui.'}],notes:[{id:'note',text:'Telefonema singular'}],tasks:[{id:'task',title:'Preparar',description:'Descrição distinta'}]}];
  let query='', pushes=[];
  const search=load('src/app/(tabs)/search.tsx',{ react:{useMemo:fn=>fn(),useState:()=>[query,()=>{}]}, 'expo-router':{useRouter:()=>({push:route=>pushes.push(route)})}, '@/providers/cases-provider':{useCases:()=>({cases:fixtures})}, '@/providers/clients-provider':{useClients:()=>({clients:[]})}, '@/providers/theme-provider':{useAppTheme:()=>({colors:{}})} });
  function walk(node, visit) { if(Array.isArray(node)) node.forEach(x=>walk(x,visit)); else if(node&&typeof node==='object'){visit(node);walk(node.props?.children,visit);} }
  for(const [q,kind,id] of [['obrigacao','document','doc'],['telefonema','notes','note'],['distinta','tasks','task']]) {
    query=q; const tree=search.default(); let clicked=false; walk(tree,node=>{if(node.type==='Pressable'&&node.props.onPress){node.props.onPress();clicked=true;}}); assert.ok(clicked,q);
    const route=pushes.pop(); if(kind==='document')assert.equal(route.params.documentId,id); else {assert.equal(route.params.panel,kind);assert.equal(route.params.focusId,id);}
  }
  query='';let results=0;walk(search.default(),node=>{if(node.type==='Pressable')results++;});assert.equal(results,0,'empty query has no content results');
  assert.ok(search.searchExcerpt('x'.repeat(220)+' obrigação '+ 'y'.repeat(220),'obrigacao').includes('obrigação'));
  console.log('PASS: account isolation, stale responses, ordered retry, restart recovery, single recipe, agenda boundaries and search routes/excerpts.');
})().catch(error=>{console.error(error);process.exitCode=1;});
