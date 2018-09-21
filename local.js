String.prototype.replaceAll = function(target, replacement) {
  return this.split(target).join(replacement);
};


var interfaceBuilder = (function() {

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
        case "tabgroup":
          this.build_tabgroup( obj.data );
          break;
        case "tab":
          this.build_tab( obj.data );
          break;
        case "piechart":
          this.build_piechart( obj.data );
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
    var name = obj.name;
    var current = document.getElementById(name);
    if ( obj.parent != null | obj.parent != undefined )
      var container = obj.parent;
    else
      var container = settings.interfaceContainer
    if (current == undefined ) {
      var group = `<fieldset><legend>${obj.name.replaceAll("_"," ")}</legend><div id="${name}"></div></fieldset>`;
      $("#" + container).append( group );
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
      var name = obj.name;
      var percent = (obj.bar_current / obj.bar_max) * 100;
      var current = document.getElementById(name);
      var color = "#b7b7b7";
      if ( obj.parent != null | obj.parent != undefined )
        var container = obj.parent;
      else
        var container = settings.interfaceContainer
      if ( current == undefined ) {
        var progress = "<div id=\"" + name + "\"><div class=\"" + name + "-label ibuild-bar-label\">" + obj.name.replaceAll("_"," ")  + "</div></div>";
        $("#" + container).append( progress );
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

  }, // End build_bar

  build_tabgroup:function( obj ) { // Build Tabgroup
    var name =  obj.name;
    var current = document.getElementById( name );
    if (current == undefined ) {
      var group = `<div id="${name}" class="tabgroup"><ul></ul></div>`
      $("#" + settings.interfaceContainer).append( group );
      $( `#${name}` ).tabs();
    }
  }, // End Build Tabgroup

  build_tab:function( obj ) { //Add tab to Tabgroup
    var name = obj.name;
    var tabbie = `<li><a id="btn_${name}" href="#${name}">${obj.name.replaceAll("_"," ")}</a></li>`;
    var tabcontents = `<div id='${name}'></div>`;
    var current = document.getElementById( name );
    if (current == undefined ) {
      $(`#${obj.parent} ul`).append( tabbie );
      $(`#${obj.parent}`).append( tabcontents );
      $( `#${obj.parent}` ).tabs("refresh");
      $( `#btn_${name}` ).click();
    }
  }, // End add tab

  build_piechart:function ( obj ) { // Add Pie Chart
    var name = obj.name;
    var current = document.getElementById( name );
    if ( obj.parent != null | obj.parent != undefined )
      var container = obj.parent;
    else
      var container = settings.interfaceContainer

    if (current == undefined ) {
        var graph = `<div id="${name}"></div>`
        $(`#${container}`).append( graph );

        var chartConfig = this.generatePieChartConfig( obj );

       zingchart.render({
        	id : `${name}`,
        	data : chartConfig,
        	height: 200,
        	width: '100%'
        });
    } else {
    var series = []
    obj.values.forEach(function( element ) {
      series.push({
        values: [element.value],
        text: element.name,
        backgroundColor: element.color,
      })
    });
    zingchart.exec(`${name}`, "setseriesdata", {
      graphid: 0,
      data: series
    });
  }


  },


  generatePieChartConfig:function ( obj ) {  // Helper function to generate a pie chart chartConfig
    var config = {
      type: obj.type,
      backgroundColor: "#333",
      plot: {
        borderColor: "#2B313B",
        borderWidth: 2,
        detach: false,
        //slice: "5%",
        valueBox: {
          placement: 'in',
          text: '%t\n%npv%',
          fontFamily: "Open Sans",
          fontSize: 10
        },
        tooltip:{
          fontSize: '10',
          fontFamily: "Open Sans",
          padding: "1 2",
          text: "%npv%"
        },
        animation:{
          effect: 2,
          method: 3,
          sequence: 2,
          speed:"ANIMATION_FAST"
        }
      },
      title: {
        fontColor: "#fff",
        text: obj.name,
        align: "left",
        offsetX: 1,
        fontFamily: "Open Sans",
        fontSize: 10
      },
      subtitle: {
        offsetX: 0,
        offsetY: 0,
        fontColor: "#8e99a9",
        fontFamily: "Open Sans",
        fontSize: "1",
        text: '',
        align: "left"
      },
      plotarea: {
        margin: "2 0 0 0"
      },

      series : []

  };

    obj.values.forEach(function( element ) {
      config.series.push({
        values: [element.value],
        text: element.name,
        backgroundColor: element.color,
      })
    });
    return config;



}


}  // </ interfaceBuilder > return
}());


// Radar Viewer Helper Functions
var radarScreen = (function() {

return {
  initializeScreen: function( element ) {
      if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
      var container = document.getElementById(element);
      if ( container == undefined || container == null ) {
        throw "invalid element";
      }

      var camera, controls, scene, renderer;
      var clock = new THREE.Clock();
      var WIDTH = container.clientWidth , HEIGHT = container.clientHeight;
      scene = new THREE.Scene();
      renderer = new THREE.WebGLRenderer();
      container.appendChild( renderer.domElement );
      renderer.setSize( WIDTH , HEIGHT );
      camera = new THREE.PerspectiveCamera(50, WIDTH / HEIGHT, 1, 1e7);
      camera.position.set(0,0,100);
      camera.lookAt(new THREE.Vector3(0,0,0));
      camera.updateProjectionMatrix();
	    renderer.render( scene, camera );
      scene.updateMatrixWorld();
      scene.add( camera );
      g_objSelf = new THREE.SphereGeometry( 1, 5, 5 );
      m_objSelf = new THREE.MeshBasicMaterial( { color: "#0F0", wireframe: false} );
      mesh_objSelf = new THREE.Mesh( g_objSelf, m_objSelf );

      scene.add( mesh_objSelf );
      // 50 unit radius
      var circle = this.drawCircle( 10 );
      scene.add( new THREE.Line(circle[0], circle[1] ) );
      // 25 Unit Radius
      circle = this.drawCircle( 25 );
      scene.add( new THREE.Line(circle[0], circle[1] ) );
      // 50 unit radius
      circle = this.drawCircle( 50 );
      scene.add( new THREE.Line(circle[0], circle[1] ) );


      renderer.render( scene, camera );

  }, /* End initializeScreen */

  drawCircle: function(radius) {
    var segmentCount = 32,
    geometry = new THREE.Geometry(),
    material = new THREE.LineBasicMaterial({ color: 0x009900 });

    for (var i = 0; i <= segmentCount; i++) {
      var theta = (i / segmentCount) * Math.PI * 2;
      geometry.vertices.push(
          new THREE.Vector3(
              Math.cos(theta) * radius,
              Math.sin(theta) * radius,
              0));
    }

    return [geometry,material];
    } /* End drawCircle */
  }
}());
