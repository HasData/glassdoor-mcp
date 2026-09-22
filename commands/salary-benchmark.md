---
description: What a role pays in a given market, from Glassdoor postings
---

Benchmark what a role pays.

Ask me for the role and the market if I have not given them, in the shape `data engineer` and `Austin, TX`.

Then:

1. Call `hasdata_glassdoor_listing_getJobListings` with `keyword` and `location`.
2. Split the postings by `salary.source`. Report the employer-provided figures and the estimated ones as two separate sets, and never average across them.
3. For each set give the low, the median and the high, and say how many postings it rests on, along with how many carried no salary at all. Postings where `min`, `median` and `max` match are a single stated figure, so count them as one point.
4. Normalise nothing silently. If some postings are `HOURLY` and others `ANNUAL`, say so and keep them apart unless I ask for a conversion.
5. Name the employers paying at the top and at the bottom, with their `rating` and the `ageInDays` of the posting.

Do not open the detail tool unless I ask what a specific posting requires. The listing already carries the pay, and each detail call costs the same as a whole page of postings.

Say that the figures are Glassdoor's, and that estimates are Glassdoor's model rather than reported pay.
