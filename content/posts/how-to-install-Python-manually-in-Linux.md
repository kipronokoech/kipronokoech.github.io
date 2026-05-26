---
title: "How to Install Python Manually in Linux"
date: 2022-11-28T14:09:52+03:00
draft: false
tags: ["Install", "Python", "Linux"]
categories: ["Python", "Linux"]
description: "This post covers the steps to install Python manually and how to remove it."
---
This guide will discuss how to install Python manually on a Linux machine. For your convenience, we will also discuss how to uninstall Python installed in this way.

## Steps to Follow to Install Python Manually
First of all, we need to update package repositories and install dependencies.
### Step 1: Update repositories
On Debian-based distributions, execute (modify the commands according to the distro you are running):
```bash
sudo apt update
sudo apt install build-essential zlib1g-dev \
libncurses5-dev libgdbm-dev libnss3-dev \
libssl-dev libreadline-dev libffi-dev curl
```
### Step 2: Download the stable release of Python on its official website
In this step, go to https://www.python.org/downloads/source/ and download XZ compressed source tarball (.tar.xz) file. This file contains all the source files we can build to get the Python we want (I am downloading Python 3.10.5, so I get, _Python-3.10.5.tar.xz_ file).

### Step 3: Extract the tarball
Use the inbuilt extraction functionality to extract the tarball, or you can use the tar command in Python as follows
```bash
tar -xf Python-****.tar.xz
```
(In my case, I have to run `tar -xf Python-3.10.5.tar.xz`)

### Step 4: Run the configuration
This is accomplished by running the following command on Linux Terminal

```bash
cd Python-****/ && ./configure
```

That is, `cd` into the extracted directory and run configure file.

### Step 5: Build the package
Since we want to install this Python version along with the preinstalled one, we will run:
```bash
sudo make altinstall
```

Now, Python 3.10 is installed, and we can wake it up by running 
```bash
python3.10 
```
or 
```bash
/usr/local/bin/python3.10
```

## Remove Python install Manually

To do that, save the following commands on the bash file named “uninstall_python.sh” (you can give it any name, really) and execute it with sudo privileges.
```bash
loc='/usr/local/'
py_version="$1"
rm -rf \
    $HOME/.local/lib/Python${py_version} \
    ${loc}bin/python${py_version} \
    ${loc}bin/python${py_version}-config \
    ${loc}bin/pip${py_version} \
    ${loc}bin/include/python${py_version} \
    ${loc}lib/libpython${py_version}.a \
    ${loc}lib/python${py_version} \
    ${loc}lib/pkgconfig/python-${py_version}.pc \
    ${loc}lib/libpython${py_version}m.a \
    ${loc}bin/python${py_version}m \
    ${loc}bin/2to3-${py_version} \
    ${loc}bin/python${py_version}m-config \
    ${loc}bin/idle${py_version} \
    ${loc}bin/pydoc${py_version} \
    ${loc}bin/pyvenv-${py_version} \
    ${loc}share/man/man1/python${py_version}.1 \
    ${loc}include/python${py_version}m \
    ${loc}bin/easy_install-${py_version}
```
Execute the bash script by running:
```bash
sudo bash <location of uninstall_python.sh> <python version to remove>
```
In my case, I will cd into the location of uninstall_python.sh and run the command. 

```bash
sudo bash uninstall_python.sh 3.10
```
