---
title: "Expressions in SQL"
date: 2023-09-30T22:25:06+03:00
draft: false
categories: ["SQL"]
tags: ["SQL"]
---

## Arithmetic Expressions

An arithmetic expression is a phrase formed with operands (numeric values and/or column names) and arithmetic operators (shown below). Arithmetic expressions are evaluated by SQL and replaced with the appropriate numeric value.

![Arithmetic Operations](/images/arithmetric_operations.png)

#### Operands can be numeric values or column names
In an expression, valid operands include numbers, column names, and other expressions. When a column is used in an expression, the values in that column must be numeric or valid dates. Only addition and subtraction are valid with dates.
#### Operators are specified between operands
#### Expressions in parentheses are evaluated first

Along with the asterisk and column names, expressions can be specified in the column list of a SELECT clause. SQL inserts a calculated column in the result table at the given position. The new column name defaults to the expression itself.

```SQL
SELECT *, follow_on_paid +upfront_price 
FROM accounts;
```

```SQL
SELECT *, expected_paid - follow_on_paid 
FROM accounts;
```

**Key Points**:
- Expressions are specified in the SELECT clause 
- Expressions produce new columns in the result 
- Expressions are calculated for each row

## Expressions in Other Clauses
Since SQL treats expressions in SELECT statements as 'virtual columns' filled with calculated values, we can use expressions in place of column names in both the WHERE and ORDER BY clauses, as illustrated in the examples below.

 ```SQL
SELECT *, expected_paid - follow_on_paid 
FROM accounts
WHERE expected_paid - follow_on_paid = 0;
```

**Key Points**
- Expressions can be used in the WHERE clause 
- Expressions can be used in the ORDER BY clause

## Column Aliases
The keyword AS can be used in the SELECT clause to define a column alias- a user-assigned name for a column. Column aliases can be specified for any column, but they are most frequently used to give meaningful names to calculated columns.

```SQL
SELECT *, expected_paid - follow_on_paid AS amount_behind 
FROM accounts
WHERE amount_behind = 0;
```

**Key Points**:
- Column aliases are defined in the SELECT clause 
- Aliases cannot be used in the WHERE clause 
- Aliases can be used in the ORDER BY clause
- AS is optional in some dialects
