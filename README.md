# Product Rankings with Bayesian Estimation

To demonstrate using Bayesian estimation for product rankings versus ranking products by their average rating, I scraped product data from Sephora's website. You can read more about Bayesian estimation [on my website](http://www.emilyschuch.com/works/sephora-product-ranking/)

### Scraping the Data

To run the web scraper, fork or download this repository and navigate to the folder in a terminal window. Then type

```
python sephora_scraper.py
```

The web scraper takes a minute or two to run. The output will be saved to a pickle file called `sephora_data.pkl`.

Since Sephora's website utilizes Angularjs, BeautifulSoup does not work to scrape the data. I solved this by parsing through the raw html string using regular expressions. For example, line 27 in `sephora_scraper.py`:

```python
products = unicode(re.search(r"(?<=products).*?(?=meta)", html).group(0)).replace('}}],"', '}}').replace('":[{', '{')
```
This line takes a slice of the html string between the words `products` and `meta`, then deletes some of the bracket junk at the start and end of the returned string. 

`products` appears to be a JSON object loaded with the web page. In lines 29 to 48 of `sephora_scraper.py`, I split the JSON string into seperate products, then read the data for each product using the python `json` package, and save the information that I want to use into a python dictionary.

Lines 50 to 63 then loads each product page to add additional data to the dictionary that isn't available on the product search page, and saves out the dictionary to a pickle file.

### Transforming the Data

Start a Jupyter notebook with the command

```
ipython notebook
```

Open the notebook `sephora_data_clean.ipynb`. Running the cells in the notebook will 

* read in the pickled data file
* transform the data into a pandas dataframe
* add a column for the Bayesian estimate
* output two csv files, `sephora.csv` and `sephora-table.csv`

The two csv files are utilized by the javascript file, `sephora.js`, to create a table and some d3 charts. If you run the web scraper and Jupyter notebook, you will overwrite the csv files downloaded with this repository.

### Visualizations

The code for the data visualizations is in the `visualizations` folder. To view in a web browser, navigate to this folder in a terminal window and start a local server with the command

```
python -m SimpleHTTPServer
```

then open a web browser and navigate to `localhost:8000`. 

