// Modified from https://addons.mozilla.org/en-CA/firefox/addon/show-profile/

function saveOptions(e) {
  browser.storage.local.set({
    profileDir: document.getElementById("profile-dir").value,
  });
  e.preventDefault();
  restoreOptions();
}

function restoreOptions() {
  var storageItem = browser.storage.local.get('profileDir');
  storageItem.then((res) => {
    document.getElementById("profile-dir").value = res.profileDir || '';
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
