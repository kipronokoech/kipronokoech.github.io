---
title: 'Working with Dates in SQL (PostgreSQL)'
date: 2026-06-13T16:44:06+03:00
draft: true
description: ""
tags: [sql]
categories: []
authors:
    - "Kiprono"
---

> Reference: [PostgreSQL Date/Time Functions](https://www.postgresql.org/docs/current/functions-datetime.html)

---

## Core Date Data Types (Know These Cold)
```
DATE
TIME                              -- less common
TIMESTAMP                         -- date + time (no timezone)
TIMESTAMP WITH TIME ZONE
  (or TIMESTAMPTZ)                -- timestamp with time zone
INTERVAL                          -- durations
```
**Rule of thumb:**
- Use `DATE` for calendar-only values
- Use `TIMESTAMPTZ` for almost everything else

---

## Getting Current Date/Time (Very Common)

```sql
NOW()                -- current timestamp (transaction start time)
CURRENT_TIMESTAMP
CURRENT_DATE
CURRENT_TIME
clock_timestamp()    -- actual current time (not transaction-stable)
```

Know the difference between:
- `NOW()` is transaction timestamp (stable within transaction)
- `clock_timestamp()` gives actual wall clock time (changes per call)

99% use case → `NOW()`.

```sql
SELECT current_timestamp;
SELECT pg_sleep(20);
SELECT now();
SELECT pg_sleep(20);
SELECT clock_timestamp();
```

| Query               | Result   |
| ------------------- | -------- |
| `current_timestamp` | 10:00:00 |
| `pg_sleep(20)`      | (waits)  |
| `now()`             | 10:00:00 |
| `pg_sleep(20)`      | (waits)  |
| `clock_timestamp()` | 10:00:40 |

### Key Concept
- `now()` = `current_timestamp` → **transaction start time**
- `clock_timestamp()` → **actual current time**
- `pg_sleep(n)` → **pause execution for n seconds**

---

## Adding / Subtracting Time (VERY Important)

Using `INTERVAL`:

```sql
SELECT NOW() + INTERVAL '1 day';
SELECT NOW() - INTERVAL '3 hours';
SELECT CURRENT_DATE + INTERVAL '7 days';
```

You should know:

```sql
INTERVAL '1 day'
INTERVAL '2 hours'
INTERVAL '30 minutes'
INTERVAL '1 month'
INTERVAL '1 year'
```

Also parameterized:

```sql
SELECT NOW() + (5 || ' days')::interval;
```

Very common patterns to master:

```sql
WHERE registration_date_utc >= NOW() - INTERVAL '7 days'
WHERE date_of_latest_payment_utc + INTERVAL '30 days' < NOW()
```

There are also `date_add` and `date_subtract` functions:

```sql
date_add ( timestamp with time zone, interval [, text ] ) → timestamp with time zone
```

```sql
date_subtract ( timestamp with time zone, interval [, text ] ) → timestamp with time zone
```

These two functions are only available on PostgreSQL version 16 and later. For earlier versions, use the `+` and `-` operators shown above.

Both functions take a timestamp with time zone and an interval, and return a timestamp with time zone. You can master `date_add()` alone and use a negative interval in place of `date_subtract()`:

```sql
SELECT date_add(DATE '2024-06-14', INTERVAL '-14 days'); -- subtract 14 days
```

---

## Extracting Parts (Extremely Common)

```sql
SELECT EXTRACT(YEAR  FROM registration_date_utc);
SELECT EXTRACT(MONTH FROM registration_date_utc);
SELECT EXTRACT(DAY   FROM registration_date_utc);
SELECT EXTRACT(HOUR  FROM registration_date_utc);
SELECT EXTRACT(DOW   FROM registration_date_utc);   -- day of week (0=Sunday)
SELECT EXTRACT(WEEK  FROM registration_date_utc);
SELECT EXTRACT(EPOCH FROM registration_date_utc);   -- seconds since Unix epoch
```

Alternative syntax:

```sql
DATE_PART('year', registration_date_utc);
```

You can also use:
- `dow` (day of the week, 0 = Sunday)
- `isodow` (day of the week, Monday = 1, Sunday = 7)
- `doy` (day of the year, 1–365/366)

Common real-world uses:
- filtering by month
- grouping by hour
- checking weekday

More on EXTRACT() [here](https://www.postgresql.org/docs/current/functions-datetime.html#FUNCTIONS-DATETIME-EXTRACT).

---

## Date Truncation (Analytics Essential)

One of the most important functions:

```sql
DATE_TRUNC('day',    registration_date_utc)
DATE_TRUNC('week',   registration_date_utc)
DATE_TRUNC('month',  registration_date_utc)
DATE_TRUNC('year',   registration_date_utc)
DATE_TRUNC('hour',   registration_date_utc)
DATE_TRUNC('minute', registration_date_utc)
```

Used for grouping in analytics:

```sql
GROUP BY DATE_TRUNC('month', registration_date_utc)
```

---

## Date Difference (Critical for Business Logic)

### Timestamp difference

```sql
SELECT NOW() - registration_date_utc;   -- returns interval
```

### Days between dates

```sql
SELECT CURRENT_DATE - date_of_latest_payment_utc;   -- returns integer
```

### Extracting specific units

```sql
SELECT EXTRACT(DAY   FROM NOW() - registration_date_utc);
SELECT EXTRACT(EPOCH FROM NOW() - registration_date_utc);  -- total seconds
SELECT extract(day from '2026-02-24 10:12:22.450 +0300'::timestamp - '2026-01-13');
```

### AGE()

```sql
-- AGE() returns a calendar-based interval.
-- It breaks the difference into years, months, days, and time
-- using real calendar boundaries (month lengths vary).
-- Result example: "-3 years -10 mons -16 days -13:47:37.55"
SELECT age(
  '2022-02-24 10:12:22.450 +0300'::timestamp,
  '2026-01-13'
);

-- Subtracting timestamps returns a pure interval (absolute elapsed time).
-- Result example: "-1418 days -13:47:37.55"
SELECT
  '2022-02-24 10:12:22.450 +0300'::timestamp
  - '2026-01-13'::date;
```

For more granular timestamp differences, use `EXTRACT(EPOCH)` — this converts the interval into total **seconds**, then divide as needed:

```sql
-- Days in decimals
SELECT EXTRACT(EPOCH FROM '2026-02-24 10:12:22.450 +0300'::timestamp - '2026-01-13') / 60 / 60 / 24;

-- Hours
SELECT EXTRACT(EPOCH FROM '2026-02-24 10:12:22.450 +0300'::timestamp - '2026-01-13') / 60 / 60;

-- Minutes
SELECT EXTRACT(EPOCH FROM '2026-02-24 10:12:22.450 +0300'::timestamp - '2026-01-13') / 60;
```

If you are dealing with months, things are trickier because **months are not a fixed length** (28–31 days). Calendar-accurate method using `AGE()`:

```sql
SELECT
    (
        EXTRACT(YEAR  FROM age(t1, t2)) * 12
      + EXTRACT(MONTH FROM age(t1, t2))
      + EXTRACT(DAY   FROM age(t1, t2))
        / EXTRACT(DAY FROM date_trunc('month', t2)
            + INTERVAL '1 month'
            - date_trunc('month', t2)
          )
    ) AS months
FROM (
    SELECT
      '2022-02-24 10:12:22.450 +0300'::timestamp AS t1,
      '2026-01-13'::timestamp AS t2
) s;
```

You can also approximate months using 30 or 30.44 days as an average:

```sql
SELECT
  EXTRACT(EPOCH FROM
    '2022-02-24 10:12:22.450 +0300'::timestamp
    - '2026-01-13'::timestamp
  ) / (86400 * 30) AS months;
```

---

## Formatting Dates (For Reporting and Display)

```sql
TO_CHAR(registration_date_utc, 'YYYY-MM-DD')
TO_CHAR(registration_date_utc, 'YYYY-MM')
TO_CHAR(registration_date_utc, 'DD Mon YYYY')
TO_CHAR(registration_date_utc, 'HH24:MI:SS')
```

Common formatting patterns:

| Pattern | Meaning                                                                                      |
| ------- | -------------------------------------------------------------------------------------------- |
| YYYY    | 4-digit year                                                                                 |
| MM      | month number (01–12)                                                                         |
| DD      | day                                                                                          |
| HH24    | 24-hour hour                                                                                 |
| MI      | minute (00–59)                                                                               |
| SS      | second (00–59)                                                                               |
| Mon     | abbreviated capitalized month name (3 chars) — e.g. `to_char(timestamp '2024-12-20 21:06:12.98', 'YYYY Mon')` → `2024 Dec` |
| Month   | full capitalized month name (blank-padded to 9 chars) — e.g. `2024 December`               |
| MS      | millisecond (000–999)                                                                        |
| Dy      | abbreviated capitalized day name (3 chars)                                                  |

---

## Type Casting / Parsing Strings to Date (Input Handling)

```sql
TO_DATE('2026-02-24', 'YYYY-MM-DD')
TO_TIMESTAMP('2026-02-24 15:30', 'YYYY-MM-DD HH24:MI')
```

Or casting:

```sql
'2026-02-24'::date
'2026-02-24 10:00'::timestamp
```

Example pattern:

```sql
WHERE registration_date_utc::date = CURRENT_DATE
```

---

## Time Zone Handling (Very Important in Real Apps)

### Convert timezone

```sql
SELECT registration_date_utc AT TIME ZONE 'UTC';
SELECT registration_date_utc AT TIME ZONE 'America/New_York';
```

### Set session timezone

```sql
SET TIME ZONE 'UTC';
```

**Golden rule:**
- Store as `TIMESTAMPTZ`
- Convert at the presentation layer

---

## Generating Date Series (Very Powerful)

```sql
SELECT generate_series(
    '2025-01-01'::date,
    '2025-01-10'::date,
    INTERVAL '1 day'
);
```

Used for:
- filling missing dates in reports
- calendar tables
- time bucket generation

Extremely useful in analytics.

---

## Comparing Dates (Filtering – Used Constantly)

```sql
WHERE registration_date_utc > NOW() - INTERVAL '7 days'
WHERE date_of_latest_payment_utc = CURRENT_DATE
WHERE registration_date_utc BETWEEN '2026-01-01' AND '2026-01-31'
```

Super common pattern — accounts registered in the current month:

```sql
WHERE registration_date_utc >= DATE_TRUNC('month', NOW())
```

---

## Bonus: High-Value Patterns to Master

### Rolling window

```sql
WHERE registration_date_utc >= NOW() - INTERVAL '30 days'
```

### Monthly aggregation

```sql
SELECT DATE_TRUNC('month', registration_date_utc), COUNT(*)
FROM sales
GROUP BY 1;
```

### Daily unique customers

```sql
SELECT registration_date_utc::date, COUNT(DISTINCT customer_id)
FROM sales
GROUP BY 1;
```
