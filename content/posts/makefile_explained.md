---
date: '2026-06-06T01:00:59+03:00'
draft: false
title: 'Makefile Explained'
description: "A practical guide to Makefiles for data scientists and engineers — syntax, variables, dependencies, and real-world use cases."
tags: ["Python", "Make", "DevOps", "Tooling"]
categories: []
showtoc: true
---

## What is a `Makefile`?
A `Makefile` is a declarative build script used by the `make` tool to **automate tasks** like compiling code, running scripts, cleaning directories, or managing dependencies.

It's most useful when:
- You want to codify a **repeatable workflow**
- You want **one-liner commands** for multi-step processes
- You work across environments (e.g., Docker, EC2, CI/CD)

## Basic Syntax and Anatomy
```make
# Syntax:

#target: dependency1, dependency2, …  
#<TAB>recipe  (command 1)  
#<TAB>recipe  (command 2)  
# ...

# Example of Makefile entry
train: data/processed.csv
	python src/train.py --input data/processed.csv --output model.pkl
```

### Key Concepts:
- `target`: The name of the file or alias you want to build (e.g. `train`)
- `dependencies`: Files that the target depends on, in the case above `data/processed.csv` is the dependency.
- `recipe`: Command(s) to run if dependencies are newer than target. in the example above recipe is `python src/train.py --input data/processed.csv --output model.pkl`

> **Tab is required.** Space will break it.

We will revisit the concept of dependencies later.
## Phony Targets (for aliases)
If your target is just a make label (command alias), not a file, declare it as `.PHONY`. This ensures that `make` doesn’t look for a file by that name.
```make
.PHONY: clean test all
all: clean test

clean:
	rm -rf __pycache__ model.pkl output/

test:
	pytest tests/
```

## Variables in a Makefile
Variables make your Makefile DRY (Don't Repeat Yourself) and readable:

```make
PYTHON=python3
SRC_DIR=src
DATA=data/raw.csv

train:
	$(PYTHON) $(SRC_DIR)/train.py --input $(DATA) --output model.pkl
```

You can also define with `:=` (immediate) or `?=` (assign if not set):
```
PYTHON ?= python
```

### The three assignment operators in Makefile:
#### 1. `=` (Recursive Assignment)
Does Lazy evaluation: the variable is not expanded until it is used. **Use when variable references other variables** or you want late binding.

```make
A = hello
B = $(A) world
A = goodbye

# Now B will be "goodbye world", not "hello world"
```

#### 2. `:=` (Immediate/Expanded Assignment)
Does immediate evaluation - the right-hand side is evaluated when the line is read. Use when you want to **freeze the value now**, regardless of changes later.
```
A := hello
B := $(A) world
A := goodbye

# B will be "hello world"
```

#### 3. `?=` (Conditional Assignment)
Assigns a value **only if the variable is not already defined**. **Use in reusable Makefiles** where you want to provide a default but allow external override via command line or environment.

For, example, if your `Makefile` is defined with this
```
PYTHON ?= python3.9
```
A call to that `Makefile` will override that value. Running `make` command like this will use Python 3.11 rather than 3.9.
```
make PYTHON=python3.11
```

## Dependencies and Conditional Running
This is exactly where `make` shines.

Let's revisit this. Recall the syntax of a make entry.

```
target: dependencies
[TAB] command to run
```

- Important: Targets can depend on other targets or files. That is to say, `dependencies` can be a target or a file.

### Case 1
In this case, for example:
- When you run `make train`, it will first run `make clean`, then run the command. `clean` is a target.
```
train: clean
	python train.py --input data.csv --output model.pkl
```

### Case 2
Make only runs a target **if dependencies have changed**.
```
model.pkl: data.csv train.py
	python train.py --input data.csv --output model.pkl
```

So if `data.csv` hasn’t changed, and `model.pkl` exists, `make` does nothing. This is how real build systems avoid doing redundant work.

That is:
- “To build `model.pkl`, I need `data.csv` and `train.py`.  If either of those is **newer** than `model.pkl`, then re-run the command.”
You can run that with:
```
make model.pkl
```
## More Used Cases for Makefile
### Chain tasks
```
all: clean train test
```
`make all` will run all the targets in order of occurrence.

### Multiple recipes
You can also run multiple commands in a single target.

## Wildcards and Patterns
| Concept         | Purpose                           | Example                |
| --------------- | --------------------------------- | ---------------------- |
| `%`             | Wildcard for filenames            | `%.o: %.c`             |
| `$(wildcard …)` | Match all files fitting a pattern | `$(wildcard src/*.py)` |
| `$@`            | The target file                   | `foo.o`                |
| `$<`            | First dependency                  | `foo.c`                |
| `$^`            | All dependencies                  | `foo.c bar.c`          |

## Tips and Best Practices when Working with Make
- **Use `.PHONY`** liberally to prevent clashes with file names.
- Group related actions under a meta target like `all`, `build`, or `dev`.
- **Always indent with TAB**, not spaces.
- Organize Makefiles at root of your project.
- Provide comments in your `Makefile` with pound sign, just like you do in Python.
- Any target that involves cleaning/deleting files should not be put as first target or as part of the default target, instead,  `clean` should be called manually when cleaning is needed.

## Nice-to-Know Points
- By default, when make command is executed, the command being executed will be printed out. If you don't want that use the `@` symbol before the command, eg,
```
generate_train_data: train.csv
	@python3 generate_training_data.py
```
- If you run `make` without providing the target, the first target stated on Makefile only will be executed by default.  We can override this behavior using a special phony target called `.DEFAULT_GOAL`. That means if we had this line to the top of the Makefile `generate` target will be executed by default irregardless of its position in the file. Note: `.DEFAULT_GOAL` can only run one target at a time.
```
.DEFAULT_GOAL := generate
```
## My Personal Used Cases - These Are Tried Concepts

### Used Case 1: This is where Makefile Shines
To **skip training if both `feature_columns.joblib` and `loan_model.joblib` already exist**, you define **both files as the targets** of your Makefile rule.

### Explanation:
- `train` is the **alias** you run: `make train`
- The actual files `feature_columns.joblib` and `loan_model.joblib` are the **real targets**
- `make` checks:
    - Do both files exist?
    - Are they **older** than `train.py` or `train.csv`?

If both files exist **and** are up to date, `make` does **nothing**.
```
train: feature_columns.joblib loan_model.joblib

feature_columns.joblib loan_model.joblib: train.py train.csv
	@echo "Training model..."
	python train.py
```

### Used Case 2
(remember: `$<` matches the first dependency (input) which is `data/raw.csv` and `$@` matches the target (output) which is `data/clean.csv`)
- `make` checks whether `data/clean.csv` is missing or outdated
	- 
```make
.PHONY: clean_data
clean_data: data/clean.csv
data/clean.csv: data/raw.csv src/preprocess.py
	python src/preprocess.py --input $< --output $@
```

### My Used Case 3:
Consider the script attached which generates training data (`train.csv` ) when executed.
> [!NOTE]- generate_training_data.py
> ```python
> # generate_training_data.py
> import os
> import pandas as pd
> from sklearn.model_selection import train_test_split
> 
> def create_training_data(df):
>     df_train, df_test = train_test_split(df, test_size=0.3, random_state=42)
>     df_train.to_csv("train.csv", index=False)
>     return df_train
> 
> if __name__ == "__main__":
>     df = pd.read_csv("loan_modelling.csv")
>     create_training_data(df) 
> ```

This `Makefile` entry will run the command only if train.csv.
```makefile
train.csv:
	@python3 generate_training_data.py
```

- `make` will run the command **only if `train.csv` doesn't exist**.
- If `train.csv` exists and is newer than any dependencies (if any), nothing happens.
If you run `make train.csv` and the `train.csv` already exist you will get info like this
```
make: `train.csv' is up to date.
```

#### Force re-generation
If you want to regenerate `train.csv` even if it exists, run:
```
make -B train.csv
```

Or define a `.PHONY` rule:

```
.PHONY: force_generate  
force_generate: 	
	@python3 generate_training_data.py
```

### Used Case 4: Cleaning and Reset
If you want to purge the project, and start afresh, this it.
```
clean:
	rm -rf __pycache__ .pytest_cache *.pkl *.joblib *.csv

reset:
	make clean && make all
```

### Used Case 5: Docker Workflow Shortcuts
`make` can really help manage Docker commands during containerization.

```
.PHONY: build run
build:
	docker build -t mymodel .
run:
	docker run -v $(CURDIR):/app mymodel
```
