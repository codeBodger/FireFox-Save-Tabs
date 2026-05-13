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
	let text = profile;
	for(w of Object.keys(tablist)){
		for(t of tablist[w]) text+=t+"\n";
		text+="\n";
	}
	if(btn!=cpbtn){
		let blob=new Blob([text],{type:"text/plain"});
		(browser.storage.session.set({data:blob,name:fltxt.value})).then(function(){
			if(btn==svbtn) browser.runtime.sendMessage({message:"save"});
			else if(btn==opbtn) browser.runtime.sendMessage({message:"open"});
			else browser.storage.session.clear();
		});
	}else navigator.clipboard.writeText(text);
}

let profile = "";
function getProfile() {
        browser.storage.local.get("profileDir").then((res) => {
                profile = res.profileDir ?? profile;
                pftxt.innerText += " " + (profile || "UNSET");
                if (profile) profile += "\n";
        });
}

svtxt=document.getElementById("savtext");
pftxt=document.getElementById("prftext");
fltxt=document.getElementById("filename");
fltxt.value = Date.now() + ".tabs";
slbox=document.getElementById("selchbox");
wnbox=document.getElementById("winchbox");
svbtn=document.getElementById("savebtn");
opbtn=document.getElementById("openbtn");
cpbtn=document.getElementById("copybtn");
var tablist;
gathertabs();
getProfile();
slbox.addEventListener("change",gathertabs);
wnbox.addEventListener("change",gathertabs);
svbtn.addEventListener("click",loadtxt);
opbtn.addEventListener("click",loadtxt);
cpbtn.addEventListener("click",loadtxt);
