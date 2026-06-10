---
title: "Notes on Hugo and Markdown"
date: 2022-11-21T17:49:17+03:00
draft: true
tags: ["Markdown"]
categories: ["Linux"]
description: "This article disccusses some MarkDown Syntax. Notes for self kind of."

# You can also include Cover Image on the Front-matter
# cover:
#     image: "images/example1.jpg"
#     alt: "Featured image"
#     caption: "Source https://unsplash.com/@chelseanscott?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
---

## Some MarkDown Syntax

### Working with URLs on MarkDown
Some URL
```MarkDown
Some link [Link to Unsplash](https://unsplash.com/@chelseanscott?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)
```
Rendered as

Some link [Link to Unsplash](https://unsplash.com/@chelseanscott?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)

Use HTML code if you want to open link on a new tab. Here is an example.
```HTML
<a href="https://unsplash.com" target="_blank"> Link2<a/>
```

### Rendering code on MarkDown
The Code can be rendered using the the following Syntax.

```Markdown
`<language> (use 3 `)
(some code here)
` (use 3 `)
```

Here is some Python code

```Python 3
import psycopg2
data_folder = "clean_data/August"
import os
import pandas as pd
import numpy as np

#Establishing the connection
conn = psycopg2.connect(
   database="kiprono_database2", user='postgres', password='pass1', host='127.0.0.1', port= '5432'
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

More code on CSS

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

JavaScript:

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

### Rendering mathematical equations

**Step 1:** Create `layouts/partials/extend_head.html` file with the following content:

```HTML
{{ if or .Params.math .Site.Params.math }}
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css" integrity="sha384-AfEj0r4/OFrOo5t7NnNe46zW/tFgW6x/bCJG8FqQCEo3+Aro6EYUG4+cU+KJWu/X" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.js" integrity="sha384-g7c+Jr9ZivxKLnZTDUhnkOnsh30B4H0rpLUpJ4jAIKs4fnJI+sEnkvrMWph2EDg4" crossorigin="anonymous"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/contrib/auto-render.min.js" integrity="sha384-mll67QQFJfxn0IYznZYonOWZ644AWYC+Pt2cHqMaRhXVrursRwvLnLaebdGIlYNa" crossorigin="anonymous"
    onload="renderMathInElement(document.body);"></script>
{{ end }}
```
**Step 2:** add the parameter in order to enable MathJax on config.yml as follows:
```yaml
params:
  math: true
```


Examples

```Markdown
**The Cauchy-Schwarz Inequality**
$$\left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)$$

The following  example show the quadratic equation.
$$x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}$$

```

Rendered as

**The Cauchy-Schwarz Inequality**

$$\left( \sum_{k=1}^n a_k b_k\right)^2 \leq\left( \sum_{k=1}^n a_k^2\right) \left( \sum_{k=1}^n b_k^2 \right)$$

The following  example show the quadratic equation.
$$x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}$$

### Loading an image in MarkDown

```
![Alt text of image](/images/example1.jpg)
```
rendered as

![Alt text of image](/images/example1.jpg)

Add #center after image to center align an image
```
![Alt text of image](/images/example1.jpg#center)
```
rendered as followed

![Alt text of image](/images/example1.jpg#center)

### Lists in MarkDown

Itemized list on Markdown:

```Markdown
- Item 1
- Item 2
	- sub item 1
	- sub item 2
- Item 3
```
Rendered as:
- Item 1
- Item 2
	- sub item 1
	- sub item 2
- Item 3

Numbered list on Markdown:

```Markdown
1. Item 1
1. Item 2
	1. sub item 1
	1. sub item 2
1. Item 3
```

1. Item 1
1. Item 2
	1. sub item 1
	1. sub item 2
1. Item 3


## Notes about Hugo
Use `hugo server -D` to open a local server which renderes drafts.
By default, hugo organizes posts by date.

If you want to override that provide the `weight: <int>` on the front-matter. The smaller the `<int>` the higher the article in the list. I have provided the value 99 for this article.

Use at least H2 on the title headings. H1 headings do not show on the Table of Content. Take note.

## Possible Problems you will run into in Hugo and how to self them

**Problem 1:**
Module "PaperMod" is not compatible with this Hugo version;  run "hugo mod graph" for more information.

**Solution 1:** Hugo is probably outdated. Updated it by installing the [latest version](https://github.com/gohugoio/hugo/releases). You can install the downloaded .deb file by running

```bash
sudo dpkg --install <path_to_the_deb_file>
```

## Conclusion

Notes for self
