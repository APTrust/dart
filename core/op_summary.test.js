const { OpSummary } = require('./op_summary');

const isoTimeStamp = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/;

function getOpSummary() {
    return new OpSummary({
        op: '1',
        action: '2',
        msg: '3',
        status: '4',
        errors: ['err1', 'err2'],
        stack: Error('Huh?').stack
    });
}

test('Constructor sets expected properties', () => {
    let summary1 = new OpSummary();
    expect(summary1.op).toBeNull();
    expect(summary1.action).toBeNull();
    expect(summary1.ts).toMatch(isoTimeStamp);
    expect(summary1.msg).toBeNull();
    expect(summary1.status).toBeNull();
    expect(summary1.errors).toEqual([]);
    expect(summary1.stack).toBeNull();

    let summary2 = getOpSummary();
    expect(summary2.op).toEqual('1');
    expect(summary2.action).toEqual('2');
    expect(summary2.ts).toMatch(isoTimeStamp);
    expect(summary2.msg).toEqual('3');
    expect(summary2.status).toEqual('4');
    expect(summary2.errors).toEqual(['err1', 'err2']);
    expect(summary2.stack.length).toBeGreaterThan(50);
});

test('toJSON', () => {
    let summary = getOpSummary();
    // Match the beginning of the JSON.
    // Stack trace will be different on each machine.
    expect(JSON.stringify(summary)).toMatch(/\{"op":"1","action":"2","ts":"[0-9\-\.:TZ]+","msg":"3","status":"4","errors":\["err1","err2"\],"stack":"Error: Huh\?/);
});

test('inflateFrom', () => {
    let summary1 = getOpSummary();
    let data = JSON.parse(JSON.stringify(summary1));
    let summary2 = OpSummary.inflateFrom(data);
    expect(summary2.op).toEqual(summary1.op);
    expect(summary2.action).toEqual(summary1.action);
    expect(summary2.ts).toEqual(summary1.ts);
    expect(summary2.msg).toEqual(summary1.msg);
    expect(summary2.status).toEqual(summary1.status);
    expect(summary2.errors).toEqual(summary1.errors);
    expect(summary2.stack.length).toEqual(summary1.stack.length);
});
