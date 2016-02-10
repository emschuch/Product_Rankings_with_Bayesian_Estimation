import sys  
from PyQt4.QtGui import *  
from PyQt4.QtCore import *  
from PyQt4.QtWebKit import * 
import requests
import json
import re
import pickle

url = 'http://www.sephora.com/eye-cream-dark-circles?pageSize=-1'

class Render(QWebPage):
  def __init__(self, url):
    self.app = QApplication(sys.argv)
    QWebPage.__init__(self)
    self.loadFinished.connect(self._loadFinished)
    self.mainFrame().load(QUrl(url))
    self.app.exec_()
  
  def _loadFinished(self, result):
    self.frame = self.mainFrame()
    self.app.quit()

r = Render(url)
html = r.frame.toHtml()

products = unicode(re.search(r"(?<=products).*?(?=meta)", html).group(0)).replace('}}],"', '}}').replace('":[{', '{')

p = products.split('},')

prods = []

for product in p[:-1]:
    prods.append(product + '}')
    
prods.append(p[-1])

products = {}

for prod in prods:
    product = json.loads(prod)
    key = product['product_url']
    products[key] = {
        'rating': product['rating'],
        'brand': product['brand_name'],
        'id': product['id'],
        'name': product['display_name']
    }

url_base = 'http://www.sephora.com'

for product in products.keys():
    url = url_base + product
    response = requests.get(url)
    page = response.text
    try:
        reviews = int(unicode(re.search(r"(?<=\n).*?(?= review)", page).group(0)).strip())
    except ValueError:
        reviews = 0
    products[product]['num_reviews'] = reviews

with open('sephora_data.pkl', 'w') as picklefile:
    pickle.dump(products, picklefile)
