---
title: "Aggregation Functions in SQL"
date: 2023-09-30T22:20:07+03:00
draft: false
categories: ["SQL"]
tags: ["SQL"]
---

## Aggregation Functions

An aggregation (statistical) function is a built-in program that accepts a parameter and returns a summary value. The parameter may be either a column name or an expression. The five statistical functions supported by standard SQL are shown in the following table.

![statististical_functions.png](/images/statististical_functions.png)

#### Statistical functions accept parameters
Parameters are either column names or expressions. Parameters must always be enclosed in parentheses. Note that spaces inside and outside the parentheses are
optional but are shown in the examples above for readability.
#### Statistical functions return summary values
SUM and AVG can only be used with columns that contain numeric values. COUNT, MIN, and MAX can be used with columns of any data type. All statistical functions operate on a single column or expression.
#### COUNT accepts a variety of parameters
COUNT(\*) produces a count of rows. COUNT(column) produces a count of rows where the specified column contains non-null values. COUNT(DISTINCT column)
produces a count of unique, non-null values in the given column

If a SELECT clause contains nothing but statistical functions, SQL displays grand totals for the query. The resulting table contains one row, with one column for each statistical function. Column aliases may be used to rename the column(s).

```SQL
SELECT AVG(days_to_cutoff) AS average_days_to_cutoff
FROM accounts;
```

```SQL
SELECT MIN(daily_price), MAX(daily_price)
FROM accounts
WHERE country="Kenya";
```

**Key Points**:
- Only functions are specified in the SELECT clause 
- The result contains only one row
- The result contains one column for each function 
- Column aliases may be assigned


## Grouping Functions in Other Clauses

If a SELECT clause contains column names and functions, SQL displays subtotals. The specified columns must also be listed in the GROUP BY clause. SQL divides
the table into groups calculates subtotals for each and displays one row per group.

```SQL
SELECT registration_date, COUNT(*) AS "Unit Sales"
FROM accounts
GROUP BY registration_date;
```

```SQL
SELECT country, AVG(days_to_cutoff) AS "AVG Days to Cut Off"
FROM accounts
GROUP BY country;
```

```SQL
SELECT field_level, COUNT(*) AS Count
FROM angaza_users
GROUP BY field_level;
```

```SQL
SELECT angaza_id, SUM(amount_towards_follow_on) AS Total_Collected 
FROM payments
GROUP BY angaza_id;
```

```SQL
SELECT area, country, COUNT(*) AS "Unit Sales"
FROM accounts
GROUP BY area, country;
```

**Key Points**:
- Group columns are specified in the SELECT clause
- Group columns are repeated in the GROUP BY clause
- Order of clauses FROM, WHERE, GROUP BY

## Functions in Other Clauses
Functions cannot be specified in the WHERE clause because that clause is evaluated before grouping (and function execution) takes place. Functions can, however, appear in the HAVING clause, which is processed after grouping occurs.

This will not work:

```SQL
SELECT area, country, COUNT(*) AS unit_sales
FROM accounts
WHERE unit_sales>250
GROUP BY area, country;
```

But this will:

```SQL
SELECT area, country, COUNT(*) AS unit_sales
FROM accounts
GROUP BY area, country
HAVING unit_sales>250;
```

**Key Points**:
- The HAVING clause follows the GROUP BY clause
- The HAVING clause is just like WHERE except... 
- The HAVING clause is executed after grouping
