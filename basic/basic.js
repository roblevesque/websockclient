// A Simple WSClient for PennMUSH
// -grapenut

var serverAddress = window.location.hostname;
var serverPort = '4201';

// pre-define the connection object, later it will be set to
// conn = WSClient.open('ws://host:port/wsclient')
var conn = null;

// terminal is the container for output, cmdprompt, quicklinks and the entry box.
var terminal = document.getElementById('terminal');

// the main terminal output window
var output = WSClient.emulate(document.getElementById('output'));

// the user input box
var entry = document.getElementById('entry');

// user input command history
var history = [];
var ncommand = 0;
var save_current = '';
var current = -1;

var keepAliveTime = 300;
var forceSSL = false;


/***********************************************/
/**  Body  **/

// called by body.onLoad
function startup() {

  // autoconnect
  reconnect();

  // start the keepalive loop
  keepalive();

  // set focus on the input box
  refocus();
};



// called by body.onUnload
function shutdown() {
  // if we have an active connection, 
  // send a QUIT command and exit gracefully
  if (conn && conn.socket.readyState === 1) {
    conn.sendText('QUIT');
    setTimeout(conn.close, 1000);
  }

  conn = null;
};



/***********************************************/
/**  Callbacks  **/

// the user pressed enter
terminal.onsubmit = function() {
  if (conn && conn.socket.readyState === 1) {
    if (entry.value !== '') {
      // save command history
      history[ncommand] = entry.value;
      ncommand++;
      save_current = '';
      current = -1;

      // send current user input to the MUSH
      conn.sendText(entry.value);
      // and echo to the terminal
      msg(entry.value);
    }
  } else {
    // auto-reconnect if the connection was lost
    reconnect();
  }

  // clear the user input and make sure it keeps focus
  entry.value = '';
  entry.focus();

  return false;
};



// capture keypresses and implement special command functions
entry.onkeydown = function(e) {
  var code = (e.keyCode ? e.keyCode : e.which);

  if ((code == 80 && e.ctrlKey)) {
    // ctrl+p
    
    // let's prevent printing
    e.preventDefault();

    // keep the current entry in case they come back to it
    if (current < 0) {
      save_current = entry.value;
    }
    
    // cycle command history back
    if (current < ncommand - 1) {
      current++;
      entry.value = history[ncommand-current-1];
    }

  } else if ((code == 78 && e.ctrlKey)) {
    // ctrl+n
    
    // cycle command history forward
    if (current > 0) {
      current--;
      entry.value = history[ncommand-current-1];
    } else if (current === 0) {
      // recall the current entry if they had typed something already
      current = -1;
      entry.value = save_current;
    }

  } else if (code == 13) {
    // enter key
    
    // prevent the default action of submitting forms, etc
    e.preventDefault();
    
    // submit user input
    terminal.onsubmit();

    // make sure we keep focus on the input box
    entry.focus();

  }
};



// capture key releases
entry.onkeyup = function(e) {
  var code = (e.keyCode ? e.keyCode : e.which);

  if ((code == 80 && e.ctrlKey)) {
    // ctrl+p
    
    // move the cursor to end of the input text after a history change
    // only needed for going up, since ctrl+n moves cursor already
    move_cursor_to_end(entry);
  }
};



/***********************************************/
/**  Focus  **/

// put focus back on the user input box
function refocus() {
  if (((window.getSelection == "undefined") ||
       (window.getSelection() == "")) &&
      ((document.getSelection == "undefined") ||
       (document.getSelection() == "")) &&
     !((document.activeElement.tagName === "INPUT") &&
       (document.activeElement.type.search(/image/gi) === -1)))
  {
    entry.focus();
  }
};



// move the input cursor to the end of the input elements current text
function move_cursor_to_end(el) {
  if (typeof el.selectionStart == "number") {
      el.selectionStart = el.selectionEnd = el.value.length;
  } else if (typeof el.createTextRange != "undefined") {
      el.focus();
      var range = el.createTextRange();
      range.collapse(false);
      range.select();
  }
};



/***********************************************/
/**  Terminal  **/

// send a log message to the terminal output
function msg(data) {
  var text = document.createElement('div');
  text.className = "logMessage";
  text.innerHTML = data;
  output.appendHTML(text);
};



// execute pueblo command
// a '??' token in command will be replaced with user input
function xch_cmd(command) {
  var cmd = command;
  var regex = /\?\?/;
  
  // detect if user input is required by finding '??'
  if (cmd.search(regex) !== -1) {
    var val = prompt(command);
    
    // replace '??' with the value input by the user
    if (val && val != 'undefined') {
      cmd = cmd.replace(regex, val);
    } else {
      cmd = cmd.replace(regex, '');
    }
  }
  
  // send the (modified) command to the MUSH
  conn && conn.sendText(cmd);
  msg(cmd);
};



// clear the child elements from any element (like the output window)
function clearscreen (which) {
  document.getElementById(which).innerHTML = '';
};



// keepalive function continually calls itself and sends the IDLE command
function keepalive () {
  conn && conn.sendText("IDLE");
  setTimeout(keepalive, keepAliveTime*1000.0);
};



// connect or reconnect to the MUSH
function reconnect() {

  // we can't do websockets, redirect to 505
  if (!window.WebSocket){
    window.location.replace("/505.htm");
  }

  entry.focus();

  // clean up the old connection gracefully
  if (conn) {
    var old = conn;
    old.sendText('QUIT');
    setTimeout(function () { old.close(); }, 1000);
    conn = null;
  }

  msg('%% Reconnecting to server...\r\n');

  // detect whether to use SSL or not
  var proto = ((window.location.protocol == "https:") || forceSSL) ? 'wss://' : 'ws://';

  // open a new connection to ws://host:port/wsclient
  conn = WSClient.open(proto + serverAddress + ":" + serverPort + '/wsclient');
  
  
  
  // Setup the connection's event callbacks
  // auto-login if username and password are not the default values
  conn.onOpen = function (text) {
    msg("%% Connected.");
  };

  
  
  // send a log message if there is a connection error
  conn.onError = function (evt) {
    msg("%% Connection error!");
    console.log('error', evt);
  };

  
  
  // send a log message when connection closed
  conn.onClose = function (evt) {
    msg("%% Connection closed.");
    console.log('close', evt);
  };
  
  

  // handle incoming plain text
  // this will parse ansi color codes, but won't render untrusted HTML
  conn.onText = function (text) {
    var reg = /^FugueEdit > /;
    
    // detect if we are capturing a FugueEdit string
    if (text.search(reg) !== -1) {
      // replace the user input with text, sans the FugueEdit bit
      entry.value = text.replace(reg, "");
    } else {
      // append text to the output window
      output.appendText(text);
    }
  };


  
  // handle incoming JSON object
  conn.onObject = function (obj) {
    // just send a log message
    // could use this for lots of neat stuff
    // maps, huds, combat logs in a separate window
    console.log('object', obj);
  };


  
  // handle incoming HTML from the MUSH
  // it's already been encoded and trusted by the MUSH
  conn.onHTML = function (fragment) {
    // just append it to the terminal output
    output.appendHTML(fragment);
  };


  
  // handle incoming pueblo tags
  // currently implements xch_cmd and xch_hint
  conn.onPueblo = function (tag, attrs) {
    var html = '<' + tag + (attrs ? ' ' : '') + attrs + '>';

    var start;
    if (tag[0] !== '/') {
      start = true;
    } else {
      start = false;
      tag = tag.substring(1);
    }

    if ((tag === 'XCH_PAGE') || 
        ((tag === 'IMG') && (attrs.search(/xch_graph=(("[^"]*")|('[^']*')|([^\s]*))/i) !== -1)) ||
        (tag === 'HR')) {
      console.log("unhandled pueblo", html);
      return;
    }


    if (start) {
      var div = document.createElement('div');

      html = html.replace(
        /xch_graph=(("[^"]*")|('[^']*')|([^\s]*))/i,
        ''
      );

      html = html.replace(
        /xch_mode=(("[^"]*")|('[^']*')|([^\s]*))/i,
        ''
      );

      html = html.replace(
        /xch_hint="([^"]*)"/i,
        'title="$1"'
      );

      div.innerHTML = html.replace(
        /xch_cmd="([^"]*)"/i,
        "onClick='xch_cmd(&quot;$1&quot;)'"
      );

      div.setAttribute('target', '_blank');

      output.pushElement(div.firstChild);
    } else {
      output.popElement();
    }
  };
};



