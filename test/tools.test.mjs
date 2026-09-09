// Tool contract test.
//
// The README promises two tools with specific names and required parameters. The upstream list
// can change without a single commit here, and the README would start lying silently. These
// checks catch that before a user does.
//
// One live call serves two checks. Listing tools accepts any non-empty key, so a contract check
// that only lists tools stays green with a revoked or mistyped key. The same response also
// carries salary.source, which the README leans on to keep employer figures apart from
// Glassdoor's estimates, so both are asserted against one call rather than two. That call costs
// 10 credits, which is the price of a canary that can fail for the right reason.
//
// Run: HASDATA_API_KEY=your_key_here npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';

const ENDPOINT = 'https://mcp.hasdata.com/api/mcp?apis=glassdoor';
const KEY = process.env.HASDATA_API_KEY;
const TIMEOUT_MS = 30_000;

const EXPECTED = {
    hasdata_glassdoor_listing_getJobListings: ['keyword', 'location'],
    hasdata_glassdoor_job_getJobDetails: ['url'],
};

// A streamable HTTP body arrives either as plain JSON or as server-sent events. One SSE event
// can span several data: lines, several events can share one response, and a server is free to
// send progress notifications before the answer. So collect every event and pick the message
// carrying our request id instead of trusting the first data: line.
function parseRpc(raw, id) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed);

    const messages = [];
    for (const event of trimmed.split(/\r?\n\r?\n+/)) {
        const data = event
            .split(/\r?\n/)
            .filter((l) => l.startsWith('data:'))
            .map((l) => l.slice(5).replace(/^ /, ''))
            .join('\n');
        if (!data || data === '[DONE]') continue;
        try {
            messages.push(JSON.parse(data));
        } catch {
            // A keep-alive or a partial event is not our response.
        }
    }
    assert.ok(messages.length, `no JSON-RPC message in the response: ${raw.slice(0, 300)}`);
    const match = messages.find((m) => m.id === id);
    assert.ok(match, `no message with id ${id} in the response: ${raw.slice(0, 300)}`);
    return match;
}

let nextId = 1;

async function rpc(method, params = {}) {
    // The CI key sits on the free plan, where concurrency is 1. When several of
    // these repos are pushed at once their contract runs collide, and HasData
    // answers 429 with code concurrency_limit straight away rather than queueing.
    // That is a plan limit, not a broken contract, so the call is retried before
    // the test gives up. A 401 still fails on the first attempt.
    for (let attempt = 1; ; attempt++) {
        const id = nextId++;
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'x-api-key': KEY,
                'Content-Type': 'application/json',
                // The server answers over streamable HTTP, so accept both a plain body and a stream.
                Accept: 'application/json, text/event-stream',
            },
            body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        assert.equal(res.status, 200, `${method} returned ${res.status}`);
        const raw = await res.text();
        if (raw.includes('concurrency_limit') && attempt < 5) {
            await new Promise((r) => setTimeout(r, attempt * 4000));
            continue;
        }
        return { raw, body: parseRpc(raw, id) };
    }
}

// One network round trip for every test that needs the list.
let toolsPromise;
function listTools() {
    toolsPromise ??= rpc('tools/list').then(({ body }) => {
        assert.ok(body.result?.tools, 'the response carried no result.tools');
        return body.result.tools;
    });
    return toolsPromise;
}

// One paid round trip, shared by the checks that need a real answer.
let searchPromise;
function liveSearch() {
    searchPromise ??= rpc('tools/call', {
        name: 'hasdata_glassdoor_listing_getJobListings',
        arguments: { keyword: 'data engineer', location: 'Austin, TX' },
    });
    return searchPromise;
}

const live = { skip: KEY ? false : 'HASDATA_API_KEY is not set, skipping the live checks' };

test('apis=glassdoor exposes the documented tools and nothing else', live, async () => {
    const tools = await listTools();
    const names = tools.map((t) => t.name).sort().join(', ');
    assert.equal(
        tools.length,
        Object.keys(EXPECTED).length,
        `expected ${Object.keys(EXPECTED).length} tools, got ${tools.length}: ${names}`
    );
});

test('the tool names have not changed', live, async () => {
    const tools = await listTools();
    const names = new Set(tools.map((t) => t.name));
    for (const expected of Object.keys(EXPECTED)) {
        assert.ok(names.has(expected), `tool ${expected} is missing from the list`);
    }
});

test('every tool still declares its required parameters', live, async () => {
    const tools = await listTools();
    for (const tool of tools) {
        const required = tool.inputSchema?.required ?? [];
        const want = EXPECTED[tool.name];
        assert.ok(want, `tool ${tool.name} is not covered by this test`);
        for (const param of want) {
            assert.ok(
                required.includes(param),
                `${tool.name} should require ${param}, declares: ${required.join(', ') || 'nothing'}`
            );
        }
    }
});

test('every tool carries a description', live, async () => {
    const tools = await listTools();
    for (const tool of tools) {
        assert.ok(
            (tool.description || '').trim().length > 20,
            `${tool.name} has an empty or near-empty description`
        );
    }
});

test('the listing tool still offers both sort orders and the page cursor', live, async () => {
    const tools = await listTools();
    const listing = tools.find((t) => t.name === 'hasdata_glassdoor_listing_getJobListings');
    assert.ok(listing, 'the listing tool is missing from the list');
    const props = listing.inputSchema?.properties ?? {};
    assert.ok(props.nextPageToken, 'the listing tool no longer accepts nextPageToken');
    const offered = props.sort?.enum ?? [];
    for (const value of ['recent', 'relevant']) {
        assert.ok(offered.includes(value), `sort no longer accepts ${value}, offers: ${offered.join(', ') || 'no enum'}`);
    }
});

test('the key is accepted by HasData', live, async () => {
    const { raw } = await liveSearch();
    assert.ok(!raw.includes('401 Unauthorized'), 'HasData rejected the key');
    assert.ok(!raw.includes('"isError":true'), `the tool call failed: ${raw.slice(0, 300)}`);
});

// The README tells readers to filter on salary.source before averaging, because an employer
// figure and a Glassdoor estimate are different kinds of number. That advice is worthless if
// the field stops arriving, and nothing else in the response would reveal the loss.
test('a live posting still reports where its salary figure came from', live, async () => {
    const { body } = await liveSearch();
    const text = body.result?.content?.[0]?.text ?? '';
    const payload = JSON.parse(text);
    const jobs = payload.json?.jobs;
    assert.ok(Array.isArray(jobs) && jobs.length, `no jobs array in the response: ${text.slice(0, 300)}`);

    const withSalary = jobs.filter((j) => j.salary);
    assert.ok(withSalary.length, 'not one posting carried a salary object');

    const sources = new Set(withSalary.map((j) => j.salary.source).filter(Boolean));
    assert.ok(
        sources.size > 0,
        'no posting reported salary.source. The README leans on that field to separate employer '
        + 'figures from estimates, so revisit the advice or drop this test.'
    );
    for (const source of sources) {
        assert.ok(
            ['EMPLOYER_PROVIDED', 'ESTIMATED'].includes(source),
            `salary.source returned an undocumented value: ${source}`
        );
    }
});
