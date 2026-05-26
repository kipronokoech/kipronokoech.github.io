---
title: "Maintaining and Managing Database Objects in SQL"
date: 2023-09-30T22:00:21+03:00
draft: false
categories: ["SQL"]
tags: ["SQL"]
---

Before we learn how to update data in SQL tables, let's create two tables we will use: *customers* and *orders*.

- *customers* table
```SQL
USE ds2; # select database
show tables;
CREATE TABLE customers (
    id INT PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    age INT DEFAULT - 99,
    address VARCHAR(45),
    salary DECIMAL(18 , 2 ) DEFAULT 2000.00
);
```
- *orders* table
```SQL
CREATE TABLE orders (
    id INT NOT NULL,
    date datetime,
    customer_id INT REFERENCES customers (id),
    amount DOUBLE,
    PRIMARY KEY (id)
);
```

### Inserting Rows Updating Rows 
New rows may be inserted into a table one at a time using the SQL INSERT statement. A table name and column list are specified in the INTO clause, and a value list, enclosed in parentheses, is entered in the VALUES clause.

- Adding data into the *customers* table

```SQL
# Add values to the table
insert into customers values 
(1, "Kiprono Elijah", 27, "20 Koisagat", 483000.50);

/*issuing salary with decimal places more than 
indicated at table creation leads to rounding off
504560.987 is rounded off to 504560.99*/
insert into customers values
(2, "Caroline Koech", 25, "62 Sereng", 504560.987);
/* Insert values to specific fields.
Note: if a given field does not accept a null value, you
must provide it -e.g. id, name*/
insert into customers(id,name,age) values(9, "Maritim Dancun", 31);

/*Insert multiple entries in one line*/
insert into customers(id,name,age,address,salary) values
(3, "Jane Koskey", 72, "20 Koisagat", 64000),
(4, "Maritim Benard", 28, "20 Koisagat", 72000),
(5, "Rotich Geoffrey", 48, "78 Mentera", 54120);
insert into customers values(6, "Faith Chelang'at", 15, "45 Lelu", 0);
insert into customers values(7, "Angela Chepkoech", 13, "20 Fort-Ternan", 0);
insert into customers values(8, "Joy Chepkoech", 14, "98 Kipkelion", 0);
```

- Adding rows into *orders* table.
```SQL
insert into orders values
(101, "20220902", 2, 4810),
(102, "20220604", 3, 1415),
(103, "20220711", 2, 3920),
(104, "20211214", 5, 2210);
```

### Deleting Rows in SQL

To remove one or more rows from a SQL table, you can use the `DELETE` statement. The `DELETE` statement allows you to specify a condition that identifies the rows to be deleted. Be cautious when using the `DELETE` statement, as it can permanently remove data from your table.

#### Deleting Rows with a Condition

To delete rows that meet specific criteria, you can use the `DELETE` statement with a `WHERE` clause. Here's an example:

```SQL
-- Delete all customers with age greater than 60
DELETE FROM customers WHERE age > 60;
```

#### Deleting All Rows

To delete all rows from a table, you can use the `DELETE` statement without a `WHERE` clause. Be careful when using this, as it will remove all data from the table.

```SQL
-- Delete all rows from the orders table
DELETE FROM orders;
```

### Updating Rows in SQL

To modify existing data in SQL tables, you can use the `UPDATE` statement. The `UPDATE` statement allows you to change the values of one or more columns in existing rows.

#### Updating Rows with a Condition

To update rows that meet specific criteria, you can use the `UPDATE` statement with a `WHERE` clause. Here's an example:

```SQL
-- Update the salary for customers with an age greater than 30
UPDATE customers SET salary = 3000 WHERE age > 30;
```

#### Updating All Rows

To update all rows in a table, you can use the `UPDATE` statement without a `WHERE` clause. Be cautious when using this, as it will modify all rows in the table.

```SQL
-- Update all order amounts to 5000 in the orders table
UPDATE orders SET amount = 5000;
```

These are basic examples of how to delete and update rows in SQL. Always exercise caution when modifying data, especially when using `DELETE` without a `WHERE` clause or when updating multiple rows.
