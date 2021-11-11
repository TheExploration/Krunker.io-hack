'use strict';

const version = 0.02;

var check_updates = async () => {
	var res = await fetch('https://y9x.github.io/userscripts/serve.json'),
		{ lext } = await res.json();
	
	// lext.url
	if(lext.version > version){
		if(!confirm('A new Gaming Gurus Lext update is a available. Download?'))return clearInterval(check);
		
		chrome.downloads.download({ url: 'https://www.learningcontainer.com/sample-zip-files/#' }, () => {
			chrome.tabs.create({ url: 'chrome://extensions' }, () => {
				alert('Lext will now uninstall. Drag the downloaded .zip file over the list of extensions.');
				chrome.management.uninstallSelf();
			});
		});
	}
};

// every 15 minutes
var check = setInterval(check_updates, 15e3 * 60);

check_updates();


class utils {
	static is_host(url, ...hosts){
		return hosts.some(host => url.hostname == host || url.hostname.endsWith('.' + host));
	}
};

chrome.webNavigation.onCommitted.addListener(data => {
	var url = new URL(data.url);
	
	if(utils.is_host(url, 'krunker.io', 'browserfps.com'))chrome.tabs.executeScript(data.tabId, {
		file: 'preload.js',
		runAt: 'document_start',
	}, () => {}) 
});