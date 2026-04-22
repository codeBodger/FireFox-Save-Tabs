//======== Tab Count State ========

const MAXWINCOUNT = 256;
const BPW = Int32Array.BYTES_PER_ELEMENT;

// Shared Memory
var lockbuffer = new ArrayBuffer(BPW);
var countbuffer = new ArrayBuffer(BPW,{maxByteLength: MAXWINCOUNT*BPW});

// Master RW Lock
var lock = new Int32Array(lockbuffer);

// Per-Window Tab Count
var count = new Uint32Array(countbuffer);

// WindowId => count Index
var widmap = new Map();

//======== Readers-Writer Lock ========

// Implemented Using JS Atomic Primitives

// Initialize The Lock To 'free' State
function l_init(L){
	Atomics.store(lock, 0, 0);
}

// Acquire The Lock As A Reader
function l_racq(L){
	let exp, val;
	do{
		val = Atomics.load(L, 0);
		if(val<0) exp = 0;
		else exp = val;
	}while(Atomics.compareExchange(L, 0, exp, exp+1) != exp);
}

// Acquire The Lock As A Writer
function l_wacq(L){
	while(Atomics.compareExchange(L, 0, 0, -1) != 0);
}

// Downgrade The Lock From Writer To Reader
function l_down(L){
	Atomics.compareExchange(L, 0, -1, 1);
}

// Release The Lock As A Reader
function l_rrel(L){
	Atomics.sub(L, 0, 1);
}

// Release The Lock As A Writer
function l_wrel(L){
	Atomics.store(L, 0, 0);
}

//======== Tab Count Operations ========

// Increase Tab Count For Window wid, Allocating A New Slot In The Count Array If Needed
function tabAdded(wid){
	l_racq(lock);
	if(!widmap.has(wid)){
		l_rrel(lock);
		l_wacq(lock);
		if(!widmap.has(wid)){
			let winct = widmap.size;
			if(count.length==winct) countbuffer.resize((winct+1)*BPW);
			count[winct] = 0;
			widmap.set(wid,winct);
		}
		l_down(lock);
	}
	Atomics.add(count, widmap.get(wid), 1);
	l_rrel(lock);
}

// Decrease Tab Count For Window wid, Deallocating Its Count Array Slot If Empty
function tabRemoved(wid){
	l_racq(lock);
	if(widmap.has(wid) && Atomics.sub(count, widmap.get(wid), 1)==1){
		l_rrel(lock);
		l_wacq(lock);
		if(widmap.has(wid) && count[widmap.get(wid)]==0){
			let invmap = {};
			for(const [w,i] of widmap.entries()) invmap[i] = w;
			for(let i=widmap.get(wid)+1 ; i<widmap.size ; i+=1){
				count[i-1] = count[i];
				widmap.set(invmap[i], i-1);
			}
			widmap.delete(wid);
			countbuffer.resize(widmap.size*BPW);
		}
		l_down(lock);
	}
	l_rrel(lock);
}

// Read Tab Counts And Update The Browser Action
function updateBadge(){
	let tmpmap = {};

	l_racq(lock);
	for(const [w,i] of widmap.entries()){
		tmpmap[w] = Atomics.load(count, i);
	}
	l_rrel(lock);
	
	for(const w of Object.keys(tmpmap)){
		let txt;
		let wc = parseInt(w);
		if(tmpmap[w]==1) txt = "Save 1 tab";
		else txt="Save "+tmpmap[w]+" tabs";
		browser.browserAction.setTitle({title:txt,windowId:wc});

		if(tmpmap[w]<1000) txt=""+tmpmap[w];
		else if(tmpmap[w]<100000) txt=""+Math.floor(tmpmap[w]/1000)+"k";
		else txt="∞";
		browser.browserAction.setBadgeText({text:txt,windowId:wc});
	}
}

// Initialize The Lock, Add Tab Listeners And Populate The Count Array With Existing Windows
function initialize(counts){
	l_init(lock);
	l_wacq(lock);

	browser.tabs.onCreated.addListener(function(tab){
		tabAdded(tab.windowId);
		updateBadge();
	});
	browser.tabs.onRemoved.addListener(function(tid, info){
		tabRemoved(info.windowId);
		updateBadge();
	});
	browser.tabs.onAttached.addListener(function(tid, info){
		tabAdded(info.newWindowId);
		updateBadge();
	});
	browser.tabs.onDetached.addListener(function(tid, info){
		tabRemoved(info.oldWindowId);
		updateBadge();
	});

	console.log(""+counts.size+" windows added");
	if(count.length<counts.size) countbuffer.resize(counts.size*BPW);
	let i = 0;
	for(const [w,c] of counts.entries()){
		count[i] = c;
		widmap.set(w, i);
		i+=1;
	}

	l_wrel(lock);
	updateBadge();
}

browser.browserAction.setBadgeBackgroundColor({color:"#000000"});
(browser.tabs.query({})).then(function(tabs){
	let counts = new Map();
	for(const t of tabs){
		if(!counts.has(t.windowId)) counts.set(t.windowId, 0);
		counts.set(t.windowId, counts.get(t.windowId)+1);
	}
	initialize(counts);
});

// Save Tab List To File Or Open In New Tab
browser.runtime.onMessage.addListener(function(msg){
	if(msg.message=="save"){
		(browser.storage.local.get(["data","name"])).then(function(v){
			let blob=URL.createObjectURL(v.data);
			(browser.downloads.download({url:blob,filename:v.name})).then(function(dl){
				browser.downloads.onChanged.addListener(function dlh(e){
					if(e.id==dl && e.state && e.state.current==="complete"){
						browser.downloads.onChanged.removeListener(dlh);
						URL.revokeObjectURL(blob);
						browser.storage.local.clear();
					}
				});
			});
		});
	}else if(msg.message=="open"){
		(browser.storage.local.get(["data","name"])).then(function(v){
			let blob=URL.createObjectURL(v.data);
			(browser.tabs.create({url:blob,active:true})).then(function(t){
				browser.tabs.onRemoved.addListener(function trh(tid){
					if(tid==t.id){
						browser.tabs.onRemoved.removeListener(trh);
						URL.revokeObjectURL(blob);
						browser.storage.local.clear();
					}
				});
			});
		});
	}
});
