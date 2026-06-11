---
title: "Introduction to SQL and Relational Databases"
date: 2023-09-30T22:40:59+03:00
draft: false
categories: ["SQL"]
tags: ["SQL"]
---

## Introduction
### What is a Relational Database?
A relational database is a collection of data stored in tables. Each table consists of one or more vertical columns and zero or more horizontal rows.

#### Tables are identified by name
Table names must be unique within a database. Typical SQL databases allow up to 18 characters in a table name. The first character must be a letter, while the remaining characters can be letters, numbers, or underscores.

#### Columns are identified by name
Column names are unique within each table, but the same column name can appear in different tables. Both tables above, for example, have COUNTRY columns.

#### Rows are identified by their contents
The rows of a table do not have names, nor is their position in a table fixed. Therefore, we refer to the rows of tables by describing the data values they contain: 'Person number 2,' for instance, or 'Al English-speaking countries.'

### SQL
SQL, or Structured Query Language, is a specialized programming language used for managing and manipulating relational databases. SQL provides a standardized way to interact with databases, allowing users and applications to perform a wide range of operations on data

**SQL Commands**

The standard SQL commands to interact with relational databases are CREATE, SELECT, INSERT, UPDATE, DELETE and DROP. These commands can be classified based on their nature:

![sql_commands.png](/images/sql_commands.png)

