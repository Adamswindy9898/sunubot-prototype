from selenium import webdriver
from selenium.webdriver.edge.options import Options
import os, time

options = Options()
options.add_argument("--headless")
options.add_argument("--window-size=1200,1500")

driver = webdriver.Edge(options=options)

html_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "schema_architecture_sunubot.html"))
driver.get("file:///" + html_file.replace(os.sep, "/"))
time.sleep(2)

output = os.path.join(os.path.dirname(__file__), "..", "..", "schema_architecture_sunubot.png")
output = os.path.abspath(output)
driver.save_screenshot(output)
driver.quit()
print(f"Screenshot saved: {output}")
