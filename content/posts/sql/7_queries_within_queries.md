---
title: "Queries with Queries with SQL"
date: 2023-09-30T22:10:21+03:00
draft: false
categories: ["SQL"]
tags: ["SQL"]
---


## Single-Valued Subqueries
A single-valued subquery is a query that 1) produces a result with a single column and a single row and 2) is 'nested' in the WHERE clause of another query. Subqueries must be enclosed in parentheses.


A single-valued queries:

```SQL
SELECT AVG(days_to_cutoff)
FROM accounts;
```

Sing-valued sub-query:

```SQL
SELECT * 
FROM accounts
WHERE days_to_cutoff > (SELECT AVG(days_to_cutoff)
FROM accounts)
ORDER BY days_to_cutoff;
```

**Key Points**:
- Single-valued queries can be used in comparisons
- Subqueries are enclosed in parentheses

## Multi-Valued Subqueries 
A multi-valued subquery is a query that 1) returns a single-column result with zero, one, or more rows and 2) is 'nested' in the WHERE clause of another query. Multi-valued subqueries always follow the IN operator.

```SQL
SELECT AVG(days_to_cutoff)
FROM accounts 
WHERE angaza_id IN (SELECT angaza_id
FROM accounts
WHERE area="Ilorin");
```

**Key Point**: 
Multi-valued subqueries follow the IN operator.