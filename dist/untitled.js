function loadSGF(sgf) {
  jrecord = JGO.sgf.load(sgf, true);

  if(typeof jrecord == 'string') {
    alert('Error loading SGF: ' + jrecord);
    return;
  }

  if(!(jrecord instanceof JGO.Record)) {
    alert('Empty SGF or multiple games in one SGF not supported!');
    return;
  }

  $('#moves').html(jrecord.normalize()-1); // longest sequence first
  notifier.changeBoard(jrecord.getBoard());
  updateGameInfo(jrecord.getRootNode().info);
  moveNum = 0;
  move(gotoMove); // also updates game info
  gotoMove = 0;
}

function loadURL(url) {
  $.ajax('http://static.jgoboard.com/get_sgf.php', {
    dataType: 'jsonp', data: {url: url}, complete: function(resp) {
      loadSGF(resp.responseJSON);
    }
  });
}

function loadFile() {
  var files = document.getElementById("file").files;
	
	if(!files || files.length == 0)
		alert("File loading either not supported or no file selected!");
		
	var reader = new FileReader();
	reader.onload = function() { loadSGF(reader.result); };
	reader.readAsText(files[0], "UTF-8");
}