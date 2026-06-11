---
title: "Joins"
date: 2023-09-30T22:15:15+03:00
draft: false
categories: ["SQL"]
tags: ["SQL"]
---

## Joins
The SQL Joins clause is used to combine records from two or more tables in a database. A JOIN is a means of merging two tables based on common fields. 

1. **INNER JOIN**: returns rows when there is a match in both tables.
2. **LEFT JOIN**: returns all rows from the left table, even if there are no matches in the right table.
3. **RIGHT JOIN**: returns all rows from the right table, even if there are no matches in the left table.
4. **FULL JOIN**: returns rows when there is a match in one of the tables.

**Note**: FULL JOIN cannot be implemented directly in MySQL dialet. In this dialect, FULL JOIN is the UNION between RIGHT JOIN and LEFT JOIN.

```SQL
SELECT *
FROM accounts AS acc
INNER JOIN angaza_users AS angaza
ON acc.responsible_user_angaza_id = angaza.user_angaza_id;
```

```SQL
SELECT *
FROM angaza_users AS angaza
LEFT JOIN accounts AS acc
ON acc.responsible_user_angaza_id = angaza.user_angaza_id;
```

```SQL
SELECT *
FROM angaza_users AS angaza
RIGHT JOIN accounts AS acc
ON acc.responsible_user_angaza_id = angaza.user_angaza_id;
```

### UNION and Full Join:

A union combines the rows of two similar queries into a single result with no duplicates. The keyword UNION is placed between the queries. The ORDER BY clause, if used, must specify column positions and appear in the final query only.

```SQL
SELECT *
FROM angaza_users AS angaza
LEFT JOIN accounts AS acc
ON acc.responsible_user_angaza_id = angaza.user_angaza_id

UNION 

SELECT *
FROM angaza_users AS angaza
RIGHT JOIN accounts AS acc
ON acc.responsible_user_angaza_id = angaza.user_angaza_id;
```
**Key Points on UNION**:

- The number and type of columns must match
- The UNION keyword is placed between the queries
- ORDER BY, if used, must be the last clause 
- ORDER BY must specify column positions 
- Duplicate rows are not included in the result

## Table Aliases
The keyword AS can be used in the FROM clause to define a table alias - a user-assigned name for a table. Table aliases can be specified for any table, but they are most frequently used in multi-table queries to shorten full column names.

Example queries are shown in the "Joins" section above.

**Key Points**:
- Table aliases are defined in the FROM clause 
- Table aliases can be used in any clause
- Once an alias is defined, the original cannot be used 
- AS is optional in some dialects
