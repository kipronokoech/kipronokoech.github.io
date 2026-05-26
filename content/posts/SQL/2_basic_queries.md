---
title: "Basic Queries in SQL"
date: 2023-09-30T22:35:02+03:00
draft: false
categories: ["SQL"]
tags: ["SQL"]
---

A SQL statement is a collection of clauses, keywords, and parameters that perform a particular function. In the examples below, each clause is shown on a separate line; keywords appear in all uppercase letters, parameters in all lowercase letters.

![SQL Statements](/images/clauses_keywords.png)

#### Clauses
The various clauses of SQL statements are named after their initial words: the
SELECT clause, for example, or the FROM clause. SQL allows multiple clauses per line, but most SQL programmers use separate lines for clarity and ease of editing.
#### Keywords
SQL reserves a small number of words, called keywords, for specific purposes. Keywords can be entered ni upper, lower, or mixed-case letters; they are shown here in all uppercase. Keywords may not be used as table or column names.
#### Parameters
Parameters are the 'variable' parts of each clause. When formulating a SQL
statement, you insert the appropriate column names, table names, and other such values in place of the lowercase parameters shown above.


## Basic Queries
Let's create a databased called 'ds2'
```SQL
CREATE DATABASE ds2;
```

<span style="color:red">[Info] _At this point load the data from CSV into MySQL ds2 database (see Figure below)._</span>

You can create three tables, namely *accounts*, *angaza_users*, and *payments* by utilizing the data from the following three files:

1. [accounts.csv](/files/sql_data/accounts.csv)
2. [angaza_users.csv](/files/sql_data/angaza_users.csv)
3. [payments.csv](/files/sql_data/payments.csv)

These files contain the data that will be used to populate the respective tables.

![Loading data from CSV into MySQL](/images/loading_data.png)

We need to fix the *registration_date* field on accounts table - dates in SQL should be in the format yyyy-mm-dd. You don't need to understand this for now. Just run the query on MySQL Workbench (or alternatives).

```SQL
UPDATE accounts
SET registration_date = STR_TO_DATE(registration_date, '%d/%m/%Y');
```

### Selecting All Columns & Rows - using asterisk (\*)

- The following query fetches all rows and all columns from account table.
```sql 
SELECT * 
FROM accounts 
```

- Show the first 7 using LIMIT clause.
```sql 
SELECT * 
FROM accounts 
LIMIT 7
```

**Key points:**
- Syntax
```SQL
SELECT *
FROM table_name
```

- All queries have SELECT and FROM clauses 
- The FROM clause follows the SELECT clause
- The asterisk (*) means 'all columns'
- The table name is specified in the FROM clause Columns and rows appear in arbitrary order
- You can show the first _x_ rows using the LIMIT clause.

**Questions:**
1. Fetch all rows and columns from angaza_users table
2. Show the first 15 records on payments table.

### Selecting Specific Columns 
To select specific columns, we enter a list of columns in the SELECT statement (instead of an asterisk). 

Each column name is separated from the others by a comma and optional spaces. The columns are displayed in the order listed.

```SQL
SELECT angaza_id, area, daily_price
FROM accounts;
```

```SQL
SELECT user 
FROM angaza_users;
```
The SQL query selects all columns for each user from the "angaza_users" table, including the "user" column. In this case, "user" field will appear twice. 
```SQL
SELECT user,* 
FROM angaza_users;
```
**Key Points**:
- Syntax
```SQL
SELECT col1_name, col2_name, col4_name
FROM table_name
```
- Column names are listed in the SELECT clause
- Column names are separated by commas
- Columns appear in the order listed
- Rows appear in arbitrary order

Question:
1. Show the area and country of all accounts.

### Selecting Specific Rows 
Rows in a table are identified by the values they contain. 

It is therefore important to understand the different categories of values that SQL supports, and the appropriate
syntax for entering each kind of value in query statements.

#### 1. Numeric values are entered in the normal way
- That is 76, -4, 3.142, etc
- Note: Note that commas, dollar signs, and percent signs are not allowed in numeric values.

#### 2. Non-numeric values are enclosed in quotes
- Non-numeric values, called strings, are entered inside of single quote marks. Use two consecutive single quote marks inside a string to represent a single quote.

#### 3. Date values are entered in 'yyyy-mm-dd' format
- Dates must be enclosed in single quotes.

<br>
One more piece before we are ready to select specific rows - comparison and comparison operators.

- A comparison is a phrase that consists of a column name, a comparison operator, and a value. Al comparisons yield a result of either true or false. Comparisons are used to specify which rows of a table should be included in the result of a query.

![Comparison Operators](/images/comparison_operators.png)

- Comparisons are specified in the WHERE clause of a SQL SELECT statement. The WHERE clause must immediately follow the FROM clause. The result table includes all the rows of the source table where the comparison is true.

- Select accounts from Kenya

```SQL
SELECT * 
FROM accounts
WHERE country='Kenya' ;
```


- Fetch accounts registered on Sept 1, 2023 and onwards
```SQL
SELECT * 
FROM accounts
WHERE registration_date>='2023-09-01';
```

- Query all disabled accounts (whose days to cut off is under 0)
```SQL
SELECT *
FROM accounts
WHERE days_to_cutoff<0;
```

**Key Points**:
- Syntax:
```SQL
SELECT column_list
FROM table_name
WHERE <condition>;
```
- The WHERE clause follows the FROM clause
- Comparisons are entered in the WHERE clause 
- Rows where the comparison is true are displayed

**Question**:
1. Select all accounts except those registered in Tanzania.
2. Fetch all enabled accounts (those accounts whose days to cut off is 0 or greater)
3. On payments table, fetch accounts which were not paid for on a given day.
4. Show all cluster leaders on angaza_users table. Cluster leaders are tagged "Cluster Leader" in field_level.

### Sorting Rows 
To sort the rows of a result table, use the ORDER BY clause. This optional clause must be the last clause in a query. 

Column names, column positions in the SELECT clause, and the keyword DESC (descending) can be entered as parameters. The default ordering is ASC (asending).

Select accounts registered in Tongareni and sort the results in descending order based on days_to_cutoff.
```SQL
SELECT * 
FROM accounts
WHERE area='Tongareni'
ORDER BY days_to_cutoff DESC
LIMIT 7;
```

Fetch accounts registered in Morogoro, then sort the accounts in ascending order based on follow_on_paid field.
```SQL
SELECT * 
FROM accounts
WHERE area='Morogoro'
ORDER BY follow_on_paid
LIMIT 10;
```

Sort payments in ascending order based on column at position 2 (angaza_id)
```SQL
SELECT account_angaza_id, angaza_id, amount_towards_follow_on
FROM payments
WHERE effective_date='2023-09-29'
ORDER BY 2
LIMIT 10;
```

**Key Points**:
- Syntax:
```SQL
SELECT col_list
FROM table_name
WHERE condition
ORDER BY field DESC;

```

- The ORDER BY clause must be last
- A column name or position can be specified 
- DESC indicates a descending sort and ASC keyword means sort in ascending order.


Rows in a result table can be ordered based on the values in more than one column by entering a column list in the ORDER BY clause. The left-to-right order of the columns indicates the major-to-minor sort sequence.

```SQL
SELECT account_angaza_id, 
	angaza_id, 
    effective_date, 
    amount_towards_follow_on
FROM payments
ORDER BY 2, 1, 3;
```

```SQL
SELECT angaza_id, 
	registration_date, 
	upfront_price, 
    days_to_cutoff
FROM accounts
WHERE area='Ilorin'
ORDER BY upfront_price ASC, days_to_cutoff DESC;
```

**Key Points**:
- Syntax:
```SQL
SELECT col_list
FROM table_name
WHERE condition
ORDER BY field1, field2 [DESC];

```
- A column list is allowed in the ORDER BY clause
- Column names are separated by commas 
- Columns are listed in major-to-minor sequence

**Question**:
- Show all columns on angaza_users, sort cluster in descending order and user in ascening order.

### Eliminating Duplicate Rows
Typically, tables do not contain duplicate rows. Queries, however, may result in duplicate rows when a subset of the columns is selected. The keyword DISTINCT is used in the SELECT clause to prevent the display of duplicate rows in a result table.

```SQL
SELECT DISTINCT cluster
FROM angaza_users;
```

**Key Points**:
- Syntax:
```SQL
SELECT [DISTINCT] cols_list
FROM table_name
WHERE conditions
ORDER BY col1 [ASC|DESC], col2 [ASC|DESC]
```
- DISTINCT is entered after the keyword SELECT 
- DISTINCT eliminates duplicate rows
- DISTINCT may only be entered once in a query

**Questions**:
1. List all distinct countries in accounts table.
2. List all clusters in angaza_users, sort them in alphabetical order.
3. List all areas in Nigeria
