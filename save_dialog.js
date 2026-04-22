function gathertabs()
{
	let tq={};
	if(slbox.checked) tq.highlighted=true;
	if(wnbox.checked) tq.currentWindow=true;
	(browser.tabs.query(tq)).then(function(tl){
		tablist={};
		let tabct=0;
		for(t of tl){
			if(tablist[t.windowId]==null) tablist[t.windowId]=[];
			tablist[t.windowId].push(t.url);
			tabct++;
		}var txt;
		if(tabct==1) txt="Save "+tabct+" tab";
		else txt="Save "+tabct+" tabs";
		svtxt.innerText=txt;
	});
}

function loadtxt(e)
{
	let btn=e.currentTarget;
	let text="";
	for(w of Object.keys(tablist)){
		for(t of tablist[w]) text+=t+"\n";
		text+="\n";
	}
	if(btn!=cpbtn){
		let blob=new Blob([text],{type:"text/plain"});
		(browser.storage.local.set({data:blob,name:fltxt.value})).then(function(){
			if(btn==svbtn) browser.runtime.sendMessage({message:"save"});
			else if(btn==opbtn) browser.runtime.sendMessage({message:"open"});
			else browser.storage.local.clear();
		});
	}else navigator.clipboard.writeText(text);
}

svtxt=document.getElementById("savtext");
fltxt=document.getElementById("filename");
fltxt.value="tabs-"+Date.now()+".txt";
slbox=document.getElementById("selchbox");
wnbox=document.getElementById("winchbox");
svbtn=document.getElementById("savebtn");
opbtn=document.getElementById("openbtn");
cpbtn=document.getElementById("copybtn");
var tablist;
gathertabs();
slbox.addEventListener("change",gathertabs);
wnbox.addEventListener("change",gathertabs);
svbtn.addEventListener("click",loadtxt);
opbtn.addEventListener("click",loadtxt);
cpbtn.addEventListener("click",loadtxt);
