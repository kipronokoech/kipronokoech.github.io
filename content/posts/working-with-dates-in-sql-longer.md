---
title: 'Working with Dates in SQL - Detailed (PostgreSQL)'
date: 2026-06-13T16:44:06+03:00
draft: true
description: "A practical guide to working with dates, timestamps, intervals, and time zones in PostgreSQL."
tags: [sql, postgresql]
categories: []
authors:
- "Kiprono"
---

> Reference: https://www.postgresql.org/docs/current/functions-datetime.html

Dates and timestamps are everywhere in software systems. Whether you are tracking user registrations, generating reports, measuring subscription durations, analyzing trends, or scheduling background jobs, you will spend a significant amount of time working with temporal data.

PostgreSQL provides one of the richest date and time toolsets among relational databases. Understanding a handful of core concepts and functions will make it much easier to write correct, efficient, and maintainable queries.

This guide covers the PostgreSQL date and time features that appear most frequently in real-world applications.

---

## Core Date and Time Data Types

Before learning functions and operators, it is important to understand PostgreSQL's date-related data types.

```sql
DATE
TIME                              -- less common
TIMESTAMP                         -- date + time (no timezone)
TIMESTAMP WITH TIME ZONE
  (or TIMESTAMPTZ)                -- timestamp with time zone
INTERVAL                          -- durations
```

### `DATE`

A `DATE` stores only a calendar date.

```sql
2026-06-13
```

Use this when the time of day is irrelevant, such as birthdays, public holidays, due dates, or accounting periods.

### `TIME`

A `TIME` stores only a time value.

```sql
14:30:00
```

This type is less commonly used because most business events require both a date and a time.

### `TIMESTAMP`

A `TIMESTAMP` stores a date and time but does not contain any timezone information.

```sql
2026-06-13 14:30:00
```

Use it only when you intentionally do not want timezone awareness.

### `TIMESTAMPTZ`

A `TIMESTAMPTZ` (timestamp with time zone) stores a point in time and automatically handles timezone conversions.

```sql
2026-06-13 14:30:00+03
```

For most modern applications, this is the preferred choice.

### `INTERVAL`

An `INTERVAL` represents a duration rather than a specific point in time.

```sql
INTERVAL '7 days'
INTERVAL '3 hours'
INTERVAL '1 month'
```

Intervals are commonly used when adding, subtracting, or comparing dates.

### Rule of Thumb

* Use `DATE` for calendar-only values.
* Use `TIMESTAMPTZ` for almost everything else.
* Use `INTERVAL` whenever you need to represent durations.

---

## Getting the Current Date and Time

Retrieving the current date or timestamp is one of the most common operations in SQL.

```sql
NOW()
CURRENT_TIMESTAMP
CURRENT_DATE
CURRENT_TIME
clock_timestamp()
```

At first glance these functions look similar, but there is an important distinction.

### `NOW()` and `CURRENT_TIMESTAMP`

These return the timestamp at which the current transaction started.

```sql
SELECT NOW();
SELECT CURRENT_TIMESTAMP;
```

Both are effectively equivalent in most use cases.

### `clock_timestamp()`

This returns the actual wall-clock time whenever it is called.

```sql
SELECT clock_timestamp();
```

Unlike `NOW()`, the value changes every time the function executes.

Consider the following example:

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
| `pg_sleep(20)`      | waits    |
| `now()`             | 10:00:00 |
| `pg_sleep(20)`      | waits    |
| `clock_timestamp()` | 10:00:40 |

### Key Concept

* `now()` and `current_timestamp` return the transaction start time.
* `clock_timestamp()` returns the actual current time.
* `pg_sleep(n)` pauses execution for `n` seconds.

For roughly 99% of application code, `NOW()` is the correct choice.

---

## Adding and Subtracting Time

Date arithmetic is fundamental in reporting, analytics, and business logic.

PostgreSQL uses the `INTERVAL` type for time calculations.

```sql
SELECT NOW() + INTERVAL '1 day';
SELECT NOW() - INTERVAL '3 hours';
SELECT CURRENT_DATE + INTERVAL '7 days';
```

Some interval values worth memorizing:

```sql
INTERVAL '1 day'
INTERVAL '2 hours'
INTERVAL '30 minutes'
INTERVAL '1 month'
INTERVAL '1 year'
```

Intervals can also be generated dynamically.

```sql
SELECT NOW() + (5 || ' days')::interval;
```

This pattern is useful when interval values come from user input or application parameters.

### Common Real-World Examples

Find users who registered during the last week:

```sql
WHERE registration_date_utc >= NOW() - INTERVAL '7 days'
```

Find subscriptions that expired more than 30 days after payment:

```sql
WHERE date_of_latest_payment_utc + INTERVAL '30 days' < NOW()
```

### PostgreSQL 16+: `date_add()` and `date_subtract()`

PostgreSQL 16 introduced dedicated functions for adding and subtracting time.

```sql
date_add(timestamp with time zone, interval [, text])
```

```sql
date_subtract(timestamp with time zone, interval [, text])
```

Example:

```sql
SELECT date_add(
  DATE '2024-06-14',
  INTERVAL '-14 days'
);
```

This subtracts 14 days from the supplied date.

For PostgreSQL versions earlier than 16, continue using the traditional `+` and `-` operators.

---

## Extracting Individual Date Parts

Frequently, you will need to extract a specific component from a date or timestamp.

Examples include:

* Grouping records by month
* Finding activity by weekday
* Building hourly analytics dashboards
* Calculating seasonal trends

PostgreSQL provides the `EXTRACT()` function for this purpose.

```sql
SELECT EXTRACT(YEAR  FROM registration_date_utc);
SELECT EXTRACT(MONTH FROM registration_date_utc);
SELECT EXTRACT(DAY   FROM registration_date_utc);
SELECT EXTRACT(HOUR  FROM registration_date_utc);
SELECT EXTRACT(DOW   FROM registration_date_utc);
SELECT EXTRACT(WEEK  FROM registration_date_utc);
SELECT EXTRACT(EPOCH FROM registration_date_utc);
```

Some commonly used fields include:

| Field    | Meaning                                  |
| -------- | ---------------------------------------- |
| `year`   | Year component                           |
| `month`  | Month number                             |
| `day`    | Day of month                             |
| `hour`   | Hour component                           |
| `dow`    | Day of week (`0 = Sunday`)               |
| `isodow` | ISO weekday (`1 = Monday`, `7 = Sunday`) |
| `doy`    | Day of year                              |
| `week`   | Week number                              |
| `epoch`  | Seconds since Unix epoch                 |

An equivalent syntax is available through `DATE_PART()`.

```sql
DATE_PART('year', registration_date_utc);
```

### Common Use Cases

Filter records for a specific month:

```sql
WHERE EXTRACT(MONTH FROM registration_date_utc) = 6
```

Group records by hour:

```sql
GROUP BY EXTRACT(HOUR FROM registration_date_utc)
```

Return only weekday records:

```sql
WHERE EXTRACT(ISODOW FROM registration_date_utc) <= 5
```

---

## Date Truncation

If `EXTRACT()` retrieves a specific component, `DATE_TRUNC()` rounds a timestamp down to a specified boundary.

This is one of the most important functions for analytics.

```sql
DATE_TRUNC('day',    registration_date_utc)
DATE_TRUNC('week',   registration_date_utc)
DATE_TRUNC('month',  registration_date_utc)
DATE_TRUNC('year',   registration_date_utc)
DATE_TRUNC('hour',   registration_date_utc)
DATE_TRUNC('minute', registration_date_utc)
```

For example:

```sql
SELECT DATE_TRUNC('month', registration_date_utc)
FROM users;
```

A timestamp such as:

```text
2026-06-13 15:42:11
```

becomes:

```text
2026-06-01 00:00:00
```

### Why It Matters

Most reporting queries aggregate data into daily, weekly, monthly, or yearly buckets.

Monthly registrations:

```sql
SELECT
    DATE_TRUNC('month', registration_date_utc),
    COUNT(*)
FROM users
GROUP BY 1;
```

Without `DATE_TRUNC()`, producing these summaries becomes much more complicated.

---

## Calculating Date Differences

Computing elapsed time is a common requirement in business applications.

Examples include:

* Days since registration
* Time until subscription expiry
* Customer lifetime calculations
* SLA measurements

### Timestamp Difference

Subtracting two timestamps returns an interval.

```sql
SELECT NOW() - registration_date_utc;
```

Example output:

```text
12 days 05:14:22
```

### Days Between Dates

Subtracting two dates returns an integer.

```sql
SELECT CURRENT_DATE - date_of_latest_payment_utc;
```

Example output:

```text
42
```

### Extracting Specific Units

Retrieve the day component:

```sql
SELECT EXTRACT(
    DAY FROM NOW() - registration_date_utc
);
```

Retrieve total elapsed seconds:

```sql
SELECT EXTRACT(
    EPOCH FROM NOW() - registration_date_utc
);
```

Example:

```sql
SELECT EXTRACT(
  DAY
  FROM
  '2026-02-24 10:12:22.450 +0300'::timestamp
  - '2026-01-13'
);
```

---

## Understanding `AGE()`

The `AGE()` function often confuses developers because it behaves differently from timestamp subtraction.

`AGE()` performs a calendar-aware calculation.

```sql
SELECT age(
  '2022-02-24 10:12:22.450 +0300'::timestamp,
  '2026-01-13'
);
```

Possible result:

```text
-3 years -10 mons -16 days -13:47:37.55
```

Notice that PostgreSQL expresses the difference using calendar units such as years and months.

By contrast, subtracting timestamps produces an absolute elapsed interval:

```sql
SELECT
  '2022-02-24 10:12:22.450 +0300'::timestamp
  - '2026-01-13'::date;
```

Possible result:

```text
-1418 days -13:47:37.55
```

### When to Use Each

Use `AGE()` when:

* You need calendar-aware differences.
* Years and months matter.
* You are calculating ages or anniversaries.

Use subtraction when:

* You need elapsed time.
* You care about total duration rather than calendar boundaries.

---

## Calculating Differences in Days, Hours, and Minutes

For precise calculations, convert intervals into seconds using `EXTRACT(EPOCH)`.

### Days

```sql
SELECT
  EXTRACT(EPOCH FROM
    '2026-02-24 10:12:22.450 +0300'::timestamp
    - '2026-01-13'
  ) / 60 / 60 / 24;
```

### Hours

```sql
SELECT
  EXTRACT(EPOCH FROM
    '2026-02-24 10:12:22.450 +0300'::timestamp
    - '2026-01-13'
  ) / 60 / 60;
```

### Minutes

```sql
SELECT
  EXTRACT(EPOCH FROM
    '2026-02-24 10:12:22.450 +0300'::timestamp
    - '2026-01-13'
  ) / 60;
```

This approach is particularly useful when building dashboards, calculating SLAs, or measuring processing durations.

---

## Calculating Month Differences

Month calculations are difficult because months vary in length.

For calendar-accurate calculations, use `AGE()`.

```sql
SELECT
    (
        EXTRACT(YEAR FROM age(t1, t2)) * 12
      + EXTRACT(MONTH FROM age(t1, t2))
      + EXTRACT(DAY FROM age(t1, t2))
        / EXTRACT(
            DAY FROM
            date_trunc('month', t2)
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

For rough analytics, an approximation is often sufficient.

```sql
SELECT
  EXTRACT(EPOCH FROM
    '2022-02-24 10:12:22.450 +0300'::timestamp
    - '2026-01-13'::timestamp
  ) / (86400 * 30) AS months;
```

Choose the method based on whether calendar accuracy matters for your use case.

---

## Formatting Dates for Display

Applications rarely display raw timestamps directly to users.

PostgreSQL's `TO_CHAR()` function allows you to format dates into human-readable strings.

```sql
TO_CHAR(registration_date_utc, 'YYYY-MM-DD')
TO_CHAR(registration_date_utc, 'YYYY-MM')
TO_CHAR(registration_date_utc, 'DD Mon YYYY')
TO_CHAR(registration_date_utc, 'HH24:MI:SS')
```

### Common Formatting Tokens

| Pattern | Meaning                  |
| ------- | ------------------------ |
| `YYYY`  | Four-digit year          |
| `MM`    | Month number             |
| `DD`    | Day of month             |
| `HH24`  | 24-hour clock            |
| `MI`    | Minute                   |
| `SS`    | Second                   |
| `Mon`   | Abbreviated month name   |
| `Month` | Full month name          |
| `MS`    | Milliseconds             |
| `Dy`    | Abbreviated weekday name |

Examples:

```sql
SELECT TO_CHAR(
  NOW(),
  'YYYY-MM-DD HH24:MI:SS'
);
```

```sql
SELECT TO_CHAR(
  NOW(),
  'DD Mon YYYY'
);
```

These formats are especially useful for reports, exports, and user-facing dashboards.

---

## Parsing Strings into Dates and Timestamps

Applications frequently receive date values as strings.

PostgreSQL provides dedicated parsing functions.

```sql
TO_DATE(
  '2026-02-24',
  'YYYY-MM-DD'
);
```

```sql
TO_TIMESTAMP(
  '2026-02-24 15:30',
  'YYYY-MM-DD HH24:MI'
);
```

Casting is often simpler.

```sql
'2026-02-24'::date
```

```sql
'2026-02-24 10:00'::timestamp
```

A common pattern is converting timestamps to dates before comparison.

```sql
WHERE registration_date_utc::date = CURRENT_DATE
```

---

## Time Zone Handling

Time zones are one of the most common sources of bugs in production systems.

If users are distributed across multiple regions, handling time correctly becomes essential.

### Converting Time Zones

```sql
SELECT registration_date_utc AT TIME ZONE 'UTC';
```

```sql
SELECT registration_date_utc AT TIME ZONE 'America/New_York';
```

This converts the timestamp into the requested timezone.

### Setting a Session Time Zone

```sql
SET TIME ZONE 'UTC';
```

All subsequent date operations in that session will use the specified timezone.

### The Golden Rule

For most applications:

* Store timestamps as `TIMESTAMPTZ`.
* Keep UTC as the source of truth.
* Convert to local time only when displaying data.

Following this approach avoids many timezone-related issues.

---

## Generating Date Series

One of PostgreSQL's most powerful date features is `generate_series()`.

```sql
SELECT generate_series(
    '2025-01-01'::date,
    '2025-01-10'::date,
    INTERVAL '1 day'
);
```

Result:

```text
2025-01-01
2025-01-02
2025-01-03
...
2025-01-10
```

### Common Uses

* Filling missing dates in reports
* Creating calendar tables
* Building date dimensions
* Producing time buckets for analytics

For reporting systems, this function is invaluable.

---

## Comparing Dates

Filtering records by time range is one of the most frequent tasks in SQL.

Examples:

```sql
WHERE registration_date_utc > NOW() - INTERVAL '7 days'
```

```sql
WHERE date_of_latest_payment_utc = CURRENT_DATE
```

```sql
WHERE registration_date_utc
      BETWEEN '2026-01-01'
          AND '2026-01-31'
```

### Current Month Filter

A common requirement is selecting records from the current month.

```sql
WHERE registration_date_utc >= DATE_TRUNC('month', NOW())
```

This works because `DATE_TRUNC('month', NOW())` returns the first moment of the current month.

---

## High-Value Patterns Worth Memorizing

These patterns appear repeatedly in real-world PostgreSQL applications.

### Rolling 30-Day Window

```sql
WHERE registration_date_utc >= NOW() - INTERVAL '30 days'
```

Useful for dashboards, engagement metrics, and trend analysis.

### Monthly Aggregation

```sql
SELECT
    DATE_TRUNC('month', registration_date_utc),
    COUNT(*)
FROM sales
GROUP BY 1;
```

One of the most common reporting queries.

### Daily Unique Customers

```sql
SELECT
    registration_date_utc::date,
    COUNT(DISTINCT customer_id)
FROM sales
GROUP BY 1;
```

Useful for measuring active user counts and customer engagement.

---

## Final Thoughts

Most PostgreSQL date-related work can be broken down into a few recurring tasks:

* Getting the current timestamp
* Adding or subtracting intervals
* Extracting date components
* Truncating timestamps for aggregation
* Calculating differences between dates
* Formatting dates for display
* Handling time zones correctly
* Generating date ranges for reporting

If you become comfortable with `NOW()`, `INTERVAL`, `EXTRACT()`, `DATE_TRUNC()`, `AGE()`, `TO_CHAR()`, and `generate_series()`, you will be able to solve the vast majority of date and time problems encountered in everyday PostgreSQL development.
