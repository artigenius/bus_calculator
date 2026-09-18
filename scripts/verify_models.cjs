// Compare models against cached values extracted from the supplied Excel file.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const reference = require('../source_files/model-2026-reference.json');
const cells = reference.cells;
const context = vm.createContext({PRODUCTS:{}, fmtMoneyFull:String, fmtNum:String, fmtPercent:String});
const references = {
  internship: {effects:['B12','B19','B30'], total:'B35', cost:'B38', roi:'B39'},
  growth: {effects:['B50','B60','B67','B74'], total:'B80', cost:'B84', roi:'B85'},
  evp: {effects:['B99','B109','B119','B129'], total:'B132', cost:'B135', roi:'B136'},
  certification: {effects:['B150','B157','B170','B163'], total:'B176', cost:'B180', roi:'B181'},
};
const close = (actual, expected, label, tolerance=0.01) =>
  assert.ok(Math.abs(actual-expected)<tolerance, `${label}: ${actual} != ${expected}`);
const defaults = p => Object.fromEntries(p.inputs.map(f=>[f.id,f.def]));

for(const [id, refs] of Object.entries(references)){
  vm.runInContext(fs.readFileSync(path.join(root, 'src/products', `${id}.js`),'utf8'), context);
  const p = context.PRODUCTS[id];
  const result = p.compute(defaults(p));
  for(const key of ['total','cost','roi']) close(result[key],cells[refs[key]].value,`${id} ${refs[key]}`,key==='roi'?1e-6:0.01);
  result.effects.forEach((effect,i)=>close(effect.rawAmount??effect.amount, cells[refs.effects[i]].value,`${id} ${refs.effects[i]}`));
  close(result.effects.reduce((sum,e)=>sum+e.amount,0),result.total,`${id} effects reconcile`);
  assert.ok(result.effects.every(e=>e.source && e.data.length));
  // Every exposed input must actually affect the calculation.
  for(const field of p.inputs){
    const changed = p.compute({...defaults(p),[field.id]:field.def+1});
    assert.ok(changed.total!==result.total || changed.cost!==result.cost,`${id}: disconnected ${field.id}`);
  }
  const zero = p.compute(Object.fromEntries(p.inputs.map(f=>[f.id,0])));
  close(zero.total,0,`${id} empty population`);
  assert.ok(Number.isFinite(zero.total) && Number.isFinite(zero.cost));
  assert.ok(zero.roi===null || Number.isFinite(zero.roi));
  console.log(`PASS Excel: ${id} (${refs.effects.join(', ')}, ${refs.total}, ${refs.cost}, ${refs.roi})`);
}

const growth = context.PRODUCTS.growth;
const g = defaults(growth);
const base = growth.compute(g);
const moreParticipants = growth.compute({...g,participantsCount:400});
close(moreParticipants.effects[0].amount,15936000,'growth double participants: productivity');
close(moreParticipants.effects[3].amount,2600640,'growth double participants: AI');
close(moreParticipants.cost,10660571.42857143,'growth double participants: linked R&D staff time');
const actualCostChanged = growth.compute({...g,programCost:7000000});
close(actualCostChanged.total,base.total,'actual project cost must not change R&D benefit');
close(actualCostChanged.cost-base.cost,1000000,'actual project cost');
const rdChanged = growth.compute({...g,rdProjectCost:17000000});
close(rdChanged.total-base.total,2500000,'R&D valuation cost changes benefit');
close(rdChanged.cost,base.cost,'R&D valuation cost must not change actual cost');

const evp = context.PRODUCTS.evp;
const e = defaults(evp);
close(evp.compute({...e,authenticityIndex:0}).total,125244000,'EVP no discount');
close(evp.compute({...e,authenticityIndex:100}).total,4320000,'EVP full activation discount retains development');
close(evp.compute({...e,headcount:6000}).total,190026000,'EVP linked headcount');
assert.equal(evp.compute({...e,programCost:0,activationCost:0}).roi,null);
const noTurnover = evp.compute({...e,turnoverRate:0});
close(noTurnover.total,12771000,'EVP annual sourcing share is independent of replacement turnover');

const cert = context.PRODUCTS.certification;
const c = defaults(cert);
const certBase = cert.compute(c);
const benefits = cert.compute({...c,benefitsSalary:340000});
close(benefits.effects[3].amount,201062400,'certification separate benefits salary');
close(benefits.effects[0].amount,certBase.effects[0].amount,'benefits salary does not change hiring');
close(cert.compute({...c,headcount:224000}).total,2010624000,'certification linked headcount');
const noCertTurnover = cert.compute({...c,turnoverRate:0});
close(noCertTurnover.effects[1].amount,0,'certification zero hiring errors');
close(noCertTurnover.effects[2].amount,0,'certification zero turnover savings');
assert.equal(cert.compute({...c,programCost:0,internalCost:0}).roi,null);
const internship = context.PRODUCTS.internship;
assert.ok(internship.compute({...defaults(internship),internSalary:300000}).effects[0].amount<0,'payroll loss must not be clamped');
console.log('PASS dependencies, separate costs, discount boundaries, zero costs and negative payroll effect');
