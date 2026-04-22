rootFiles := manifest.json  save_dialog.css  save_dialog.html  save_dialog.js  tabtxt.js
metaInfFiles := META-INF/cose.manifest META-INF/cose.sig META-INF/manifest.mf META-INF/mozilla.rsa META-INF/mozilla.sf
iconsFiles := icons/icon32.png icons/icon48.png

all: savetabs.zip

savetabs.zip: $(rootFiles) $(metaInfFiles) $(iconsFiles)
	rm -f savetabs.zip
	zip -r -FS savetabs.zip * -x@.zipignore

