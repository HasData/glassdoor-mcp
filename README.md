# Glassdoor MCP Server

<!-- mcp-name: com.hasdata/glassdoor -->

A hosted Model Context Protocol (MCP) server that gives Claude, Cursor, Windsurf and any other MCP client two read-only Glassdoor tools. Search job listings by keyword and location, then read one posting in full with the employer rating, the salary figure and its provenance, both as structured JSON, with no Glassdoor partner account and nothing to host.

It reads public Glassdoor job pages that a signed-out visitor can see, on the US site and 22 regional ones.

**1,000 free credits every month, no card required**, which is 100 Glassdoor calls at the 10-credit rate.

```
https://mcp.hasdata.com/api/mcp?apis=glassdoor
```

[![Glama score](https://glama.ai/mcp/servers/HasData/glassdoor-mcp/badges/score.svg)](https://glama.ai/mcp/servers/HasData/glassdoor-mcp)
[![tool contract](https://github.com/HasData/glassdoor-mcp/actions/workflows/contract.yml/badge.svg)](https://github.com/HasData/glassdoor-mcp/actions/workflows/contract.yml)
[![MCP](https://img.shields.io/badge/MCP-remote%20%7C%20streamable%20HTTP-6366f1?style=flat-square)](https://mcp.hasdata.com/api/mcp?apis=glassdoor)
[![Tools](https://img.shields.io/badge/tools-2-10b981?style=flat-square)](#tools)
[![npm](https://img.shields.io/npm/v/@hasdata/glassdoor-mcp?style=flat-square&logo=npm&label=npm&color=cb3837)](https://www.npmjs.com/package/@hasdata/glassdoor-mcp)
[![PyPI](https://img.shields.io/pypi/v/hasdata-glassdoor-mcp?style=flat-square&logo=pypi&logoColor=white&label=PyPI&color=3775a9)](https://pypi.org/project/hasdata-glassdoor-mcp/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

## Contents

- [What you need](#what-you-need)
- [Quick start](#quick-start)
- [Example prompts](#example-prompts)
- [Tools](#tools)
- [Errors and failure paths](#errors-and-failure-paths)
- [Pricing, free tier and limits](#pricing-free-tier-and-limits)
- [Tool selection](#tool-selection)
- [How it compares](#how-it-compares)
- [FAQ](#faq)
- [HasData links](#hasdata-links)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## What you need

An MCP client and a HasData API key from the [dashboard](https://app.hasdata.com/sign-up?utm_source=github&utm_medium=syndication&utm_campaign=glassdoor-mcp), free to create with no card, and the free tier covers about 100 calls a month at the 10-credit rate. This is a remote server, so the simplest path is a URL and an `x-api-key` header, with no container to run. A client that only speaks stdio reaches it through a thin launcher, published as `@hasdata/glassdoor-mcp` on npm and `hasdata-glassdoor-mcp` on PyPI, shown below.

## Quick start

The server URL is the same for every client. We run it hands-on in Claude Code and Claude Desktop. The other blocks follow each client's own documented format for a remote server.

| Field | Value |
| :--- | :--- |
| URL | `https://mcp.hasdata.com/api/mcp?apis=glassdoor` |
| Transport | HTTP, streamable |
| Auth header | `x-api-key: HASDATA_API_KEY` |

Clients with OAuth support can add the same URL as a connector and sign in without putting a key in a config file.

<details>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add --transport http glassdoor "https://mcp.hasdata.com/api/mcp?apis=glassdoor" \
  --header "x-api-key: HASDATA_API_KEY"
```

</details>

<details>
<summary><b>Claude Desktop</b></summary>

Settings, then Connectors, then Add custom connector, then paste `https://mcp.hasdata.com/api/mcp?apis=glassdoor` and sign in.

For the config-file route, Claude Desktop loads only local (stdio) servers, so it reaches a remote server through a stdio launcher. The `@hasdata/glassdoor-mcp` package is that launcher, and it reads the key from the environment. Add this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "glassdoor": {
      "command": "npx",
      "args": ["-y", "@hasdata/glassdoor-mcp"],
      "env": { "HASDATA_API_KEY": "YOUR_KEY" }
    }
  }
}
```

For Python instead of Node, swap the launcher for the PyPI package, which `uvx` runs without a manual install:

```json
{
  "mcpServers": {
    "glassdoor": {
      "command": "uvx",
      "args": ["hasdata-glassdoor-mcp"],
      "env": { "HASDATA_API_KEY": "YOUR_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>Cursor</b></summary>

`~/.cursor/mcp.json` for every project, or `.cursor/mcp.json` for one:

```json
{
  "mcpServers": {
    "glassdoor": {
      "url": "https://mcp.hasdata.com/api/mcp?apis=glassdoor",
      "headers": { "x-api-key": "HASDATA_API_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>Windsurf</b></summary>

`~/.codeium/windsurf/mcp_config.json`. Windsurf calls the field `serverUrl`, not `url`:

```json
{
  "mcpServers": {
    "glassdoor": {
      "serverUrl": "https://mcp.hasdata.com/api/mcp?apis=glassdoor",
      "headers": { "x-api-key": "HASDATA_API_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>VS Code</b></summary>

`.vscode/mcp.json` in the workspace:

```json
{
  "servers": {
    "glassdoor": {
      "type": "http",
      "url": "https://mcp.hasdata.com/api/mcp?apis=glassdoor",
      "headers": { "x-api-key": "HASDATA_API_KEY" }
    }
  }
}
```

</details>

## Example prompts

Each of these lands on one tool, or on two in sequence when the second needs the URL the first returns.

- Find data engineer roles in Austin, TX and show me only the ones where the employer stated the salary.
- What is the median posted salary for this role in Austin, and how many postings did that come from?
- Read this Glassdoor posting in full and list the required qualifications.
- Which companies hiring for this role have an employer rating above 4?
- Show me postings for this role added in the last week, sorted by recency.
- Compare posted salaries for this role on the UK and the German Glassdoor sites.

A prompt that names a role goes to the listing tool, and reading the full description takes a second call per posting. The listing already carries the salary, the employer rating and the skills, so a comparison across many roles needs one call rather than one per posting.

## Tools

| Tool | Credits | What it returns |
| :--- | :--- | :--- |
| `hasdata_glassdoor_job_getJobDetails` | 10 | Job title, company name and rating, location, salary estimate, employment type, posted date, full job description, qualifications/benefits, and apply link |
| `hasdata_glassdoor_listing_getJobListings` | 10 | An array of jobs with title, company, location, salary estimate, posted date, job URL, and jobId, plus the next page token |

Two tools, 10 credits per successful call.

### Get Glassdoor job listings

[`hasdata_glassdoor_listing_getJobListings`](https://docs.hasdata.com/apis/glassdoor/listing?utm_source=github&utm_medium=syndication&utm_campaign=glassdoor-mcp)

A page of postings for a role in a place, 30 to a page.

| Parameter | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `keyword` | string | yes | The role to search for, such as `data engineer` |
| `location` | string | yes | Where to search, such as `Austin, TX` |
| `sort` | string | | `relevant` or `recent` |
| `domain` | string | | One of 22 regional Glassdoor sites |
| `nextPageToken` | string | | Cursor for the next page, taken from the previous response |

Returns `searchInformation` with `totalResults` and the Glassdoor URL behind the query, a `jobs` array, and `pagination`.

Each posting carries `title`, `id`, `url`, `location`, `ageInDays`, `sponsored`, a `skills` array, a `description` snippet, a `salary` object and an `employer` object with its own `rating` and `logoUrl`.

The `salary` object is the reason this tool is worth more than a job board feed. It reports `min`, `median`, `max`, `currency`, `period` and, decisively, `source`, which is either `EMPLOYER_PROVIDED` or `ESTIMATED`. The first is a figure the employer published, the second is Glassdoor's own model. In the sample below, 19 of 30 postings were employer-provided and 10 estimated.

```json
{
  "title": "Data Engineer",
  "id": 1010220057561,
  "url": "https://www.glassdoor.com/job-listing/data-engineer-esc-region-xiii-JV_IC1139761_KO0,13_KE14,29.htm?jl=1010220057561",
  "location": "Austin, TX",
  "ageInDays": 36,
  "sponsored": false,
  "skills": ["Azure", "Customer service", "System design"],
  "salary": {
    "currency": "USD",
    "period": "ANNUAL",
    "min": 82572,
    "median": 82572,
    "max": 82572,
    "source": "EMPLOYER_PROVIDED"
  },
  "employer": {
    "id": 477452,
    "name": "Education Service Center Region XIII",
    "shortName": "ESC Region XIII",
    "rating": 4.2,
    "sponsored": false
  }
}
```

### Get Glassdoor job details

[`hasdata_glassdoor_job_getJobDetails`](https://docs.hasdata.com/apis/glassdoor/job?utm_source=github&utm_medium=syndication&utm_campaign=glassdoor-mcp)

One posting in full, by its Glassdoor URL.

| Parameter | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `url` | string | yes | The posting URL, as the listing tool returns it |

Returns a `job` object. On top of the title, salary and employer the listing already gave you, it adds the full `description` as plain text, the same text as `descriptionHtml`, a `requirements` object holding `educationRequirements` and an `experienceRequirements` array, an `address` object with coordinates, `datePosted`, and an `expired` flag.

```json
{
  "title": "Data Engineer",
  "employer": {
    "name": "ESC Region XIII",
    "url": "https://www.glassdoor.com/Overview/Working-at-ESC-Region-XIII-EI_IE477452.11,26.htm"
  },
  "address": {
    "country": "United States",
    "region": "Texas",
    "city": "Austin, TX",
    "latitude": 30.26694,
    "longitude": -97.74278
  },
  "requirements": {
    "educationRequirements": "Bachelor's degree",
    "experienceRequirements": ["Azure", "Customer service", "System design", "Windows", "SQL", "AWS"]
  },
  "salary": {
    "payCurrency": "USD",
    "period": "ANNUAL",
    "min": 82572,
    "median": 82572,
    "max": 82572,
    "source": "EMPLOYER_PROVIDED"
  },
  "datePosted": "2026-09-03T00:00:00",
  "ageInDays": 36,
  "expired": false
}
```

## Errors and failure paths

Plan for these rather than assuming a happy path.

**`salary.source` decides whether the figure is a fact or a model output.** `EMPLOYER_PROVIDED` came from the posting. `ESTIMATED` is Glassdoor's own estimate for the role and market, and mixing the two into one median produces a number that describes neither. Filter on `source` before you aggregate, and say which set a published figure came from.

**A single stated salary arrives as `min`, `median` and `max` all equal.** Three of the 30 postings in the sample looked like that. A range of zero is a point figure, not a missing range.

**`salary` can be absent, and `period` can be `HOURLY` rather than `ANNUAL`.** One posting in the sample carried no salary at all. Converting hourly to annual is your assumption to make, not something the response does.

**The listing `description` is a truncated snippet.** Eighteen of the 30 samples ended mid-sentence with an ellipsis. The full text is only on the detail tool, so a prompt that reads descriptions costs one call per posting.

**Pagination is token-based, and `otherPages` holds tokens rather than page URLs.** `pagination.otherPages` maps a page number to an opaque base64 token, and that token is what goes into `nextPageToken`. Keep the other parameters unchanged while paging.

**`www.glassdoor.com` is the default and is not a value you can pass.** The `domain` enum lists the 22 regional sites, so the US site is what you get when you leave `domain` off. There is nothing to send for it.

**`expired` is on the detail tool only.** A listing page can still show a posting the employer has closed, and only the detail call reports it. Check the flag before you act on an old `ageInDays`.

**A salary figure and an employer rating are Glassdoor's numbers.** They come from Glassdoor's own data and models, so attribute them rather than presenting them as market truth.

Results that carry data also carry a `requestMetadata.id` worth quoting in support.

## Pricing, free tier and limits

Each Glassdoor tool costs **10 credits per successful call**. Response size does not change the price, so a 30-posting page costs the same as a single detail call, which makes the listing tool the cheap way to cover a market and the detail tool the expensive way.

The free tier is **1,000 credits every month with no card**, which is 100 Glassdoor calls at the base rate. It renews with the billing cycle, so a low-volume agent runs on the free tier indefinitely.

Paid plans start at **$49 a month** for 200,000 credits, which is 20,000 calls. The unit price falls with volume, from **$2.45 per 1,000 calls** on the entry plan to **$1.00** on Business, **$0.84** on Growth and **$0.74** on the largest [high-volume plans](https://hasdata.com/prices?utm_source=github&utm_medium=syndication&utm_campaign=glassdoor-mcp).

Your plan also sets concurrency. The free tier allows 1 request at a time, Startup 15, Business 30, Growth 50, and the high-volume plans run from 200 to 1,500. Retry on the 429 with a backoff in anything unattended, because an agent that walks a page of postings will reach the ceiling before you do.

A request that comes back non-200 is not billed. A successful call that finds nothing is still a call.

A note on cost per answer. Thirty postings arrive for 10 credits, and reading all thirty in full costs 300 more. Most comp and hiring questions are answerable from the listing alone, so reach for the detail tool per posting rather than per page.

## Tool selection

Start from what the prompt gives you. A role and a place go to the listing tool, and a Glassdoor URL goes straight to the detail tool.

Then ask what the answer needs. Salary, employer rating, skills, location and age all arrive with the listing, which covers comp benchmarking, hiring-trend monitoring and sourcing shortlists in one call. The detail tool exists for the full description and the stated qualifications, which is what a matching or resume-tailoring pipeline needs and what a market summary does not.

## How it compares

Glassdoor has no public jobs API, so the honest comparison is against a job board feed and against Glassdoor's own site.

| | A job board feed | Glassdoor on the site | This server |
| :--- | :--- | :--- | :--- |
| Eligibility | A partner agreement per board | A browser and a login prompt | An API key |
| Employer rating | Not included | Shown | On every posting |
| Salary provenance | Rarely stated | Shown | `source` on every figure |
| Skills tags | Board-dependent | Shown | An array per posting |
| Regional sites | Separate integrations | Separate sites | A parameter |
| Structured output | Feed-dependent | None | JSON |

The row that decides it is salary provenance. Comp work falls apart when an employer figure and a modelled estimate land in the same column, and this is the field that keeps them apart.

## FAQ

### Is there an official Glassdoor MCP server?

Glassdoor does not publish one, and it does not publish a public jobs API either. This one is maintained by HasData and reads public Glassdoor pages.

### What is a Glassdoor MCP server?

An MCP server exposes tools an AI client can call. This one turns Glassdoor job searches and postings into JSON an agent can reason over, without a browser or a scraping library in your stack.

### Do I need a Glassdoor account?

No. The only credential is your HasData key.

### Are the salaries real or estimated?

Both, and the response says which. `salary.source` is `EMPLOYER_PROVIDED` for a figure the employer published and `ESTIMATED` for Glassdoor's own model. Read that field before you average anything.

### Does it return company reviews?

No. These two tools cover job listings and postings. The employer object carries the aggregate `rating` Glassdoor shows next to a company name, and review text is not part of the response.

### Which countries are covered?

The US site by default, plus 22 regional ones from `www.glassdoor.co.uk` through `www.glassdoor.co.in`, `www.glassdoor.com.au` and the language-split Belgian, Canadian and Swiss sites. Pass `domain` to switch.

### How do I page through results?

Take the token for the page you want from `pagination.otherPages` and send it as `nextPageToken`, leaving `keyword`, `location` and `sort` unchanged.

### Can I use this together with other HasData APIs?

Yes. One key covers everything, and one endpoint serves them all through the `apis` parameter. Point a client at `?apis=glassdoor,indeed` to get both tool sets in one connection, or at [`mcp.hasdata.com/api/mcp`](https://docs.hasdata.com/mcp-server?utm_source=github&utm_medium=syndication&utm_campaign=glassdoor-mcp) for the full catalogue.

### Is HasData affiliated with Glassdoor?

No. HasData is an independent service and is not affiliated with, endorsed by, or sponsored by Glassdoor. Glassdoor is a trademark of its respective owner. The tools work with publicly available data only, and you are responsible for using the results in line with Glassdoor's terms and the law that applies to you.

### Compliance and personal data

Job postings are business records, and these tools return no candidate or reviewer data. Two things still need care. Employer ratings and salary estimates are Glassdoor's own aggregates, so republishing them without attribution misrepresents whose numbers they are. And a posting at a very small employer can name a person as the contact, which is the one place personal data appears.

## HasData links

- [Glassdoor Scraper API](https://hasdata.com/apis/glassdoor-api?utm_source=github&utm_medium=syndication&utm_campaign=glassdoor-mcp), the REST endpoints behind these tools
- [API documentation](https://docs.hasdata.com/apis/glassdoor/listing?utm_source=github&utm_medium=syndication&utm_campaign=glassdoor-mcp)
- [MCP server documentation](https://docs.hasdata.com/mcp-server?utm_source=github&utm_medium=syndication&utm_campaign=glassdoor-mcp)
- [Pricing](https://hasdata.com/prices?utm_source=github&utm_medium=syndication&utm_campaign=glassdoor-mcp)
- [Dashboard](https://app.hasdata.com/sign-up?utm_source=github&utm_medium=syndication&utm_campaign=glassdoor-mcp)

Other HasData MCP servers: [Indeed](https://github.com/HasData/indeed-mcp), [Google Search](https://github.com/HasData/google-search-mcp), [Google Maps](https://github.com/HasData/google-maps-mcp), [Google Trends](https://github.com/HasData/google-trends-mcp), [Google Flights](https://github.com/HasData/google-flights-mcp), [DuckDuckGo](https://github.com/HasData/duckduckgo-mcp), [YouTube](https://github.com/HasData/youtube-mcp), [TikTok](https://github.com/HasData/tiktok-mcp), [Instagram](https://github.com/HasData/instagram-mcp), [Amazon](https://github.com/HasData/amazon-mcp), [Walmart](https://github.com/HasData/walmart-mcp), [Shopify](https://github.com/HasData/shopify-mcp), [Yelp](https://github.com/HasData/yelp-mcp), [Zillow](https://github.com/HasData/zillow-mcp), [Redfin](https://github.com/HasData/redfin-mcp), [Airbnb](https://github.com/HasData/airbnb-mcp), [Booking.com](https://github.com/HasData/booking-mcp).

## Development

The launcher is a thin stdio bridge to the remote server, so there is nothing to build.

```bash
npm install
HASDATA_API_KEY=your_key_here npm test
```

The tests in `test/` assert the tool contract, the part that can break without a commit here. They check that `?apis=glassdoor` returns the expected tool count, that no name changed, that every tool still declares its required parameters and carries a description, that `sort` still offers both orders, and that the key in use is actually accepted. That last check calls a tool for real and costs 10 credits, which is the price of a canary that can fail for the right reason.

One test asserts that a live posting still carries `salary.source`. The README leans on that field to keep employer figures apart from estimates, and a response that quietly dropped it would leave the advice standing with nothing behind it.

The contract suite also runs weekly on a schedule, because the upstream tool list can change without anyone touching this repository.

## Contributing

A tool table, a response sample or a documented behaviour that does not match reality is worth an issue. There is a template for exactly that. Pull requests are welcome for the same, and for anything in the launcher.

## License

MIT, see [LICENSE](LICENSE).
