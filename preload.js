'use strict';

var request = new XMLHttpRequest();
request.open('GET', 'https://y9x.github.io/userscripts/loader.user.js', false);
request.send();

var script = document.createElement('script');
script.textContent = request.responseText;
document.documentElement.appendChild(script);
script.remove();