---
title: "Advanced Operators in SQL (Not Really Advanced 😜)"
date: 2023-09-30T22:30:04+03:00
draft: false
categories: ["SQL"]
tags: ["SQL"]
---

## The LIKE Operator 
The LIKE operator is used to find values that match a pattern. Patterns are always entered in quotes. 

A per cent symbol is used to represent zero or more unknown characters; an underscore represents any single character.

**Note:** The LIKE operator is added to the WHERE clause, as shown in the examples below.

Filters rows where the "user" column starts with "Abd" followed by any characters.
```SQL
SELECT *
FROM angaza_users
WHERE user LIKE 'Abd%';
```

It's looking for values in the "user" column that start with "De" and end with "ni," with any characters in between.
```SQL
SELECT *
FROM angaza_users
WHERE user LIKE 'De%ni';
```

It searches for rows where the "user" column starts with 'F,' followed by three characters, ends with 'm,' or has additional characters afterwards.
```SQL
SELECT *
FROM angaza_users
WHERE user LIKE 'F___m%';
```

Fetch accounts are registered in August of any year.
```SQL
SELECT *
FROM accounts
WHERE registration_date LIKE '%-08-%';
```

**Key Points**:
- LIKE finds values that match a pattern
- Percent (%) represents zero or more characters 
- Underscore (\_) represents one character

**Questions**:
1. Find all accounts registered in September 2023.
2. Fetch all clusters in angaza_users that start with "O"

## The AND Operator
The AND operator is used to combine two comparisons, creating a compound comparison. The keyword AND is placed between the two comparisons. Both comparisons must evaluate to true for the compound comparison to be true.

```SQL
SELECT *
FROM accounts
WHERE country="Tanzania" AND days_to_cutoff>=0;
```

```SQL
SELECT *
FROM accounts
WHERE country="Kenya" AND days_to_cutoff>=0
AND daily_price>50 AND registration_date LIKE '2023-09%';
```

**Key Points**:
- Syntax
```SQL
SELECT cols_list
FROM table_name
WHERE condition1 AND condition2
AND condition3;
```
- AND combines two comparisons
- AND is placed between two comparisons 
- Both comparisons must evaluate to true

Questions:
1. Select all accounts from Abeokuta, Nigeria.
2. Find all enabled accounts in Kenya. Just get the accounts registered in August 2023.

## The BETWEEN Operator 
Some compound comparisons using the AND operator can be more conveniently expressed using the BETWEEN operator. BETWEEN compares each column value with a range of values. The range always includes the endpoints.

The following SQL query

```SQL
SELECT *
FROM accounts
WHERE country='Tanzania'
AND days_to_cutoff>=4 AND days_to_cutoff<=20;
```

translates to this

```SQL
SELECT *
FROM accounts
WHERE country='Tanzania'
AND days_to_cutoff BETWEEN 4 AND 20;
```

**Key Points**:
- BETWEEN compares each column value to a range 
- The range includes both endpoints
- The second value must be greater than the first

## The OR Operator
The OR operator is used to combine two comparisons, creating a compound comparison. The keyword OR is placed between the two comparisons. Either or both comparisons must evaluate to true for the compound comparison to be true.

```SQL
SELECT *
FROM accounts
WHERE country ='Tanzania'
OR days_to_cutoff>10;
```

**Key Points**:
- OR combines two comparisons
- OR is placed between two comparisons
- Either or both comparisons must evaluate to true

**Question**:
1. Display all columns and records in Eastern Africa.

## The IN Operator 
Some compound comparisons using the OR operator can be more conveniently expressed using the IN operator. IN compares each column value with a list of values. The list is enclosed in parentheses; the values are separated with commas.

``` SQL
SELECT *
FROM accounts 
WHERE area IN ("Kawangware", "Tongareni", "Sumbawanga");
```

## The IS NULL Operator

A null value is a missing entry in a column. Nul means 'unknown' or 'does not apply.' Nulls are neither blanks nor zeros (two nulls are not necessarily equal, and you cannot do arithmetic with nulls). The IS NULL operator locates rows with null values.

There are no columns with null values in the three tables we are working with. Here is the syntax.

```SQL
SELECT cols_list
FROM table_name
WHERE col IS NULL;
```

**Key Points:**
- Nulls are missing values 
- Nulls are not the same as blanks
- Nulls are not the same as zeros (Not entirely)
- IS NULL locates null values


## Precedence and Negation
Parentheses are used to indicate precedence - the order in which comparisons are evaluated. SQL evaluates comparisons enclosed in parentheses first. The keyword NOT is used to negate or reverse the result of a comparison.

```SQL
SELECT * FROM angaza_users
WHERE user_angaza_id LIKE "US16%"
AND (user LIKE "C%" OR user LIKE "%a")
AND field_level <> "";
```

```SQL
SELECT * FROM angaza_users
WHERE user_angaza_id LIKE "US16%"
AND NOT (user LIKE "C%" OR user LIKE "%a")
AND field_level <> "";
```

**Key Points**:
- Comparisons in parentheses are evaluated first 
- NOT is placed in front of a comparison
- NOT reverses the result of a comparison