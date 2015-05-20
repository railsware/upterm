var webdriver = require('selenium-webdriver');

var driver = new webdriver.Builder().
   // The "9515" is the port opened by chrome driver.
   usingServer('http://localhost:9515').
   withCapabilities({chromeOptions: {
     // Here is the path to your Electron binary.
     binary: './node_modules/.bin/electron'}}).
   forBrowser('electron').
   build();

driver.get('http://www.google.com');
driver.findElement(webdriver.By.name('q')).sendKeys('webdriver');
driver.findElement(webdriver.By.name('btnG')).click();
driver.wait(function() {
 return driver.getTitle().then(function(title) {
   return title === 'webdriver - Пошук Google';
 });
}, 1000);

driver.quit();
