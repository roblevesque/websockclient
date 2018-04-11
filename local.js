String.prototype.replaceAll = function(target, replacement) {
  return this.split(target).join(replacement);
};


var interfaceBuilder = (function() {

var settings = {
 'interfaceContainer': "containerInterface"
};

return {
  parse:function( obj ) {  // Parse inbound JSON object
    if ( obj.m_type  != "IBUILD" )
      return;  // Not for us
      switch ( obj.data.i_type ) {
        case "bar":
          this.build_bar( obj.data );
          break;
        case "group":
          this.build_group( obj.data );
          break;
        case "clear":
          this.clear();
          break;
        case "modal":
          this.build_modal( obj.data );
          break;
        default:
          console.log( "Debug: Undefined i_type: " + obj.data.i_type )
          console.log( obj )
      }
  },
  clear:function( obj ){ // Clear interface elements
    $("#" + settings.interfaceContainer).html("");
  }, // End clear
  build_group:function ( obj ) {  // Build group
    var name = "GRP-" + obj.name;
    var current = document.getElementById(name);
    if (current == undefined ) {
      var group = `<fieldset><legend>${obj.name.replaceAll("_"," ")}</legend><div id="${name}"></div></fieldset>`;
      $("#" + settings.interfaceContainer).html( $("#" + settings.interfaceContainer).html() + group );
    }
  }, // End build_group

  build_modal:function( obj ) { // Build Modal
    var modal_buttons = {};
    var modal = `<div id="dialog-confirm" title="${obj.title}">
                <p><span class="ui-icon ui-icon-alert" style="float:left; margin:12px 12px 20px 0;"></span>${obj.message}</p>
                </div>`;
    $('body').append( modal );

    modal_buttons[obj.choice1title] = function() {
      $( this ).dialog( "close" );
      sendCommand( obj.choice1cmd );
      $("#dialog-confirm").remove();
    }

    modal_buttons[obj.choice2title] =function() {
        $( this ).dialog( "close" );
        sendCommand( obj.choice2cmd );
        $("#dialog-confirm").remove();

    }

    $( "#dialog-confirm" ).dialog({
      resizable: false,
      height: "auto",
      width: 400,
      modal: true,
      buttons: modal_buttons
    });
  }, // End Build Modal
  
  build_bar:function( obj ) { // Build bar
      var name = "BAR-" + obj.name;
      var percent = (obj.bar_current / obj.bar_max) * 100;
      var current = document.getElementById(name);
      var color = "#b7b7b7";
      if ( obj.group != null | obj.group != undefined )
        var container = "GRP-" + obj.group;
      else
        var container = settings.interfaceContainer
      if ( current == undefined ) {
        var progress = "<div id=\"" + name + "\"><div class=\"" + name + "-label ibuild-bar-label\">" + obj.name.replaceAll("_"," ")  + "</div></div>";
        $("#" + container).html( $("#" + container).html() + progress );
      }
      switch ( Math.floor(percent / 10) ) {
        case 0:
        case 1:
        case 2:
          color = "#d10000";
          break;
        case 3:
        case 4:
          color = "#bf5301";
        case 5:
        case 6:
        case 7:
          color = "#e4e405";
          break;
        case 8:
        case 9:
        case 10:
          color = "#2ec141";
          break;
      }

      $('#' + name)
              .progressbar({
          value: percent
      })
      .children(".ui-progressbar-value")
      .css("background-color",color)


      $('.' + name + "-label").text(obj.name.replaceAll("_"," ") + " - \( " + percent.toFixed(0) +"% \)" );

  } // End build_bar

}  // </ interfaceBuilder > return
}());