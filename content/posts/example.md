---
title: "Example post"
date: 2022-11-21T11:36:10+03:00
draft: true
cover:
    image: "example1.jpg"
    alt: "Featured image"
    caption: "Source https://unsplash.com/@chelseanscott?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
tags: ["example", "Python"]
categories: ["Linux"]
---



# Hello there
Here are some dummy text here
## Hello there h2
### Hello there h3
Some link [Link to Unsplash](https://unsplash.com/@chelseanscott?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)
![vfd](images/IMG20200912142011.jpg)

```Python 3
import psycopg2
data_folder = "clean_data/August"
import os 
import pandas as pd
import numpy as np

#Establishing the connection
conn = psycopg2.connect(
   database="kiprono_database2", user='postgres', password='destinyx2719*KE', host='127.0.0.1', port= '5432'
)
#Setting auto commit false
conn.autocommit = True

#Creating a cursor object using the cursor() method
cursor = conn.cursor()

files = os.listdir(data_folder)
print(files)

for file in files:
   df = pd.read_csv(os.path.join(data_folder, file))
   df = df[['wmoID', 'kmdID', 'Year', 'Month', 'Day', 'Hour', 'AirTemp', 'Tmax', 'Tmin']]
   data = df.to_dict(orient="records")
   for data_point in data:
      result = list(data_point.values())
      insert_command = '''INSERT INTO AMSS(wmoID, kmdID, Year, Month, Day, Hour, AirTemp, Tmax, Tmin)\
       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)'''
      try:
         cursor.execute(insert_command, result)
         # Commit your changes in the database
         conn.commit()
      except psycopg2.errors.UniqueViolation as e:
         print(e)
         continue

# Closing the connection
conn.close()
```

```CSS
div.highlight button {
  color: #adb5bd;
  box-sizing: border-box;
  transition: 0.2s ease-out;
  cursor: pointer;
  user-select: none;
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0);
  padding: 5px 10px;
  font-size: 0.8em;
  position: absolute;
  top: 0;
  right: 0;
  border-radius: 0 0.15rem;
}

```

**The Cauchy-Schwarz Inequality**
$$\left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)$$

The following  example show the quadratic equation.
$$x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}$$


```JavaScript
var copy = function(target) {
    var textArea = document.createElement('textarea')
    textArea.setAttribute('style','width:1px;border:0;opacity:0;')
    document.body.appendChild(textArea)
    textArea.value = target.innerHTML
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
}

var pres = document.querySelectorAll(".comment-body > pre")
pres.forEach(function(pre){
  var button = document.createElement("button")
  button.className = "btn btn-sm"
  button.innerHTML = "copy"
  pre.parentNode.insertBefore(button, pre)
  button.addEventListener('click', function(e){
    e.preventDefault()
    copy(pre.childNodes[0])
  })
})
```
