'use strict';

//var request = require('superagent');
var C = require('./constants');

/**
 * Automatic div module.
 * @module autodiv
 */

 function parseMarkup(str) {
  var lines = str.split('\n'), data = [];

  // Handle div contents as diagram contents
  for(var i = 0, len = lines.length; i < len; ++i) {
    var elems = [], line = lines[i];

    for(var j = 0, len2 = line.length; j < len2; ++j) {
      switch(line[j]) {
        case '.':
        elems.push({type: C.CLEAR}); break;
        case 'o':
        elems.push({type: C.WHITE}); break;
        case 'x':
        elems.push({type: C.BLACK}); break;
        case ' ':
          break; // ignore whitespace
        default: // assume marker
          if(!elems.length) break; // no intersection yet
          // Append to mark so x123 etc. are possible
          if(elems[elems.length - 1].mark)
            elems[elems.length - 1].mark += line[j];
          else
            elems[elems.length - 1].mark = line[j];
        }
      }

      if(elems.length) data.push(elems);
    }

    return data;
  }

// Array of loaded boards
//var boards = [];

// Available attributes:
// data-jgostyle: Evaluated and used as board style
// data-jgosize: Used as board size unless data-jgosgf is defined
// data-jgoview: Used to define viewport
function process(JGO, div) {
  // Handle special jgo-* attributes
  var style, width, height, TL, BR; // last two are viewport

  if(div.getAttribute('data-jgostyle')) {
    /*jshint evil:true  */
    style = eval(div.getAttribute('data-jgostyle'));
  } else style = JGO.BOARD.medium;

  if(div.getAttribute('data-jgosize')) {
    var size = div.getAttribute('data-jgosize');

    if(size.indexOf('x') != -1) {
      width = parseInt(size.substring(0, size.indexOf('x')));
      height = parseInt(size.substr(size.indexOf('x')+1));
    } else width = height = parseInt(size);
  }

  if(div.getAttribute('data-jgosgf')){
    div.innerHTML = '<input style="padding-left: 2em;" id="file" type="file"> <button onclick="loadFile();">Load file</button> </p> <div style="text-align: center; width: 100%"> <div style="display: inline-block;"> <div style="float: left;"> <div id="board"></div> <p class="controls" style="width: 500px;"> <a href="#" onclick="move(0); return false;"><i class="fa fa-fast-backward"></i></a> <a href="#" onclick="move(-10); return false;"><i class="fa fa-backward"></i></a> <a href="#" onclick="move(-1); return false;"><i class="fa fa-step-backward"></i></a> <strong id="move">1</strong> / <strong id="moves">1</strong> <a href="#" onclick="move(1); return false;"><i class="fa fa-step-forward"></i></a> <a href="#" onclick="move(10); return false;"><i class="fa fa-forward"></i></a> <a href="#" onclick="move(1000); return false;"><i class="fa fa-fast-forward"></i></a> Variation: <strong id="variation">1</strong> / <strong id="variations">1</strong> <a href="#" onclick="nextVariation(); return false;"><i title="variation" class="fa fa-arrows-v"></i></a> </p> </div> <div id="infopane" style="float: left; padding: 1em; text-align: left;"> <h2>Game information</h2> <p id="information"></p> <p> Black captures: <strong id="black_captures"></strong><br> White captures: <strong id="white_captures"></strong> </p> <h2>Comments</h2> <p id="comments"></p> </div> <div style="clear: both;"></div> </div>)'
    var params = getParams(); // parse URL parameters
    var jboard = new JGO.Board(19, 19), jsetup; // hardcoded size

    if('board' in params && params.board in JGO.BOARD)
      jsetup = new JGO.Setup(jboard, JGO.BOARD[params.board]);
    else
      jsetup = new JGO.Setup(jboard, JGO.BOARD.medium);

    // we can use this to change the board to listen to
    var notifier = jsetup.getNotifier();

    jsetup.create('board', function(canvas) {
      canvas.addListener('click', function(c) {
        if(c.i < 10) move(-1); // back
        if(c.i > 10) move(1); // forward
      });
    });

    function getParams() { // VERY simple query parameter parse
      var params = {}, url = window.location.toString();
      if(url.indexOf('?') !== -1) {
        url.substr(url.indexOf('?')+1).split('&').forEach(function(pair) {
          var pos = pair.indexOf('=');
        if(pos === -1) return; // skip if no equals sign
        params[pair.substr(0, pos)] = pair.substr(pos+1);
      });
      }
      return params;
    }

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

      document.getElementById('moves').innerHTML=jrecord.normalize()-1; 
      notifier.changeBoard(jrecord.getBoard());
      updateGameInfo(jrecord.getRootNode().info);
      moveNum = 0;
  move(gotoMove); // also updates game info
  gotoMove = 0;

  function loadFile() {
    var files = div.jgosgf;


    if(!files || files.length == 0)
      alert("File loading either not supported or no file selected!");
    
    var reader = new FileReader();
    reader.onload = function() { loadSGF(reader.result); };
    reader.readAsText(files[0], "UTF-8");
  }
  loadFile();
}

if('move' in params) gotoMove = parseInt(params.move);
if('url' in params) loadURL(params.url);
}
else{

  var data = parseMarkup(div.innerHTML);
  div.innerHTML = '';

    if(!width) { // Size still missing
      if(!data.length) return; // no size or data, no board

      height = data.length;
      width = data[0].length;
    }

    var jboard = new JGO.Board(width, height);
    var jsetup = new JGO.Setup(jboard, style);

    if(div.getAttribute('data-jgoview')) {
      var tup = div.getAttribute('data-jgoview').split('-');
      TL = jboard.getCoordinate(tup[0]);
      BR = jboard.getCoordinate(tup[1]);
    } else {
      TL = new JGO.Coordinate(0,0);
      BR = new JGO.Coordinate(width-1, height-1);
    }

    jsetup.view(TL.i, TL.j, width-TL.i, height-TL.j);

    var c = new JGO.Coordinate();

    for(c.j = TL.j; c.j <= BR.j; ++c.j) {
      for(c.i = TL.i; c.i <= BR.i; ++c.i) {
        var elem = data[c.j - TL.j][c.i - TL.i];
        jboard.setType(c, elem.type);
        if(elem.mark) jboard.setMark(c, elem.mark);
      }
    }

    jsetup.create(div);
    
  }


}

/**
 * Find all div elements with class 'jgoboard' and initialize them.
 */
 exports.init = function(document, JGO) {
  var matches = document.querySelectorAll('div.jgoboard');

  for(var i = 0, len = matches.length; i < len; ++i)
    process(JGO, matches[i]);
};
