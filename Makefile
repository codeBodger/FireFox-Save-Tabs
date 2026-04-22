rootFiles := manifest.json  save_dialog.css  save_dialog.html  save_dialog.js  tabtxt.js
iconsFiles := icons/icon32.png icons/icon48.png

all: savetabs.zip

savetabs.zip: $(rootFiles) $(iconsFiles)
	rm -f savetabs.zip
	zip -r -FS savetabs.zip * -x@.zipignore

