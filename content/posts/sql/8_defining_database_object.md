---
title: "Creating Database Objects"
date: 2023-09-30T22:05:21+03:00
draft: false
categories: ["SQL"]
tags: ["SQL"]
---

## Creating Tables in SQL 
New tables are defined in a database by entering a CREATE TABLE statement. In its simplest form, the CREATE TABLE statement includes a new table name and one or more column definitions. Tables are removed using the DROP TABLE statement. 

SQL Syntax for Creating Tables:
```SQL
CREATE TABLE table_name (
    column1 datatype constraints,
    column2 datatype constraints,
    ...
);
```

- `table_name`: The name of the table you want to create.
- `column1`, `column2`, etc.: The names of the columns in the table.
- `datatype`: The data type for each column (e.g., INT, VARCHAR, DATE, etc.).
- `constraints`: Optional constraints (discussed in the next section)

Example: Creating a simple table with basic columns:
```SQL
CREATE TABLE Employees (
    EmployeeID INT PRIMARY KEY,
    FirstName VARCHAR(50),
    LastName VARCHAR(50),
    Salary DECIMAL(10, 2),
    HireDate DATE
);
```

You can check the structure of a specific table using the DESCRIBE statement. For example, 
```SQL
## Show characteristics of table fields 
DESCRIBE customers;
```

## SQL Integrity Constraints 
SQL constraints are rules and conditions applied to tables and columns to ensure the accuracy, integrity, and consistency of data stored in the database. Constraints define limitations or requirements for the data that can be inserted, updated, or deleted in a database table. Here are common SQL constraints and their definitions:

1. **DEFAULT**:
   - Purpose: The DEFAULT constraint is used to specify a default value for a column when a new record is inserted into a table if no explicit value is provided for that column.
   - Example: 
   
   ```SQL 
   CREATE TABLE Employees (
      EmployeeID INT, 
      FirstName VARCHAR(50) DEFAULT 'John',
      LastName VARCHAR(50) DEFAULT 'Doe'
      );
   ```

2. **NOT NULL**:
   - Purpose: The NOT NULL constraint ensures that a column cannot contain NULL values, meaning it must have a value in every row.
   - Example: 
   
   ```SQL
   CREATE TABLE Customers (
      CustomerID INT NOT NULL, 
      FirstName VARCHAR(50) NOT NULL, 
      LastName VARCHAR(50) NOT NULL);
   ```

3. **UNIQUE**:
   - Purpose: The UNIQUE constraint ensures that all values in a column are unique across all rows in the table. It enforces data integrity by preventing duplicate values.
   - Example: 
   ```SQL
   CREATE TABLE Products (
      ProductID INT UNIQUE, 
      ProductName VARCHAR(50) UNIQUE);
   ```

4. **CHECK**:
   - Purpose: The CHECK constraint is used to specify a condition that values in a column must meet. If the condition evaluates to false, the insertion or update operation is rejected.
   - Example: 
   ```SQL
   CREATE TABLE Orders (
      OrderID INT, 
      OrderDate DATE CHECK (OrderDate >= '2023-01-01')
      );
   ```

5. **INDEX**:
   - Purpose: The INDEX constraint is not an integrity constraint itself, but it is used to improve query performance. It creates an index on one or more columns, allowing for faster data retrieval.
   - Example: 
   ```SQL
   CREATE INDEX idx_ProductName ON Products (ProductName);
   ```

6. **PRIMARY KEY (PK)**:
   - Purpose: The PRIMARY KEY constraint uniquely identifies each record in a table. It enforces the uniqueness of values in the specified column(s) and ensures that they are not NULL.
   - Example: 
   ```SQL
   CREATE TABLE Students (
      StudentID INT PRIMARY KEY, 
      StudentName VARCHAR(50));
   ```

   PK can be made of a single field (like in the example above) or multiple columns, as shown below.

   ```SQL   
   CREATE TABLE Orders (
      OrderID INT,
      ProductID INT,
      Quantity INT,
      PRIMARY KEY (OrderID, ProductID)
    );
    ```

7. **FOREIGN KEY (FK)**:
   - Purpose: The FOREIGN KEY constraint establishes a link between two tables by defining a relationship between a column in one table (the child table) and the primary key column in another table (the parent table). It enforces referential integrity, ensuring that values in the child table match values in the parent table.
   - Example: 
     ```SQL
     CREATE TABLE Orders (
         OrderID INT PRIMARY KEY,
         CustomerID INT,
         OrderDate DATE,
         FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
     );
     ```
In the table above, the `CustomerID` column in the `Orders` table is a foreign key that references the `CustomerID` primary key in the `Customers` table, creating a relationship between the two tables.