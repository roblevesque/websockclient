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
   var scene = new THREE.Scene();
   var renderer = new THREE.WebGLRenderer();
   var camera;
   var container;
   var controls;
   var WIDTH;
   var HEIGHT;
   var textLabels = [];

return {
  initializeScreen: function( element ) {
      if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
        container = document.getElementById(element);
      if ( container == undefined || container == null ) {
        throw "invalid element";
      }

      var clock = new THREE.Clock();
      WIDTH = container.clientWidth;
      HEIGHT = container.clientHeight;
    //  this.scene = new THREE.Scene();
    //  this.renderer = new THREE.WebGLRenderer();
      container.appendChild( renderer.domElement );
      renderer.setSize( WIDTH , HEIGHT );
      camera = new THREE.PerspectiveCamera(55, WIDTH / HEIGHT, 1, 1e7);
      camera.position.set(0,0,100);
      camera.lookAt(new THREE.Vector3(0,0,0));
      camera.updateProjectionMatrix();
	    renderer.render( scene, camera );
      scene.updateMatrixWorld();
      controls = new THREE.OrbitControls( camera, renderer.domElement );
      controls.enableDamping = true;
      controls.dampingFactor = 0.50;
      controls.enableZoom = false;
      controls.minDistance = 15;
      controls.maxDistance = 210;
      controls.minAzimuthAngle = 0;
      controls.maxAzimuthAngle = 0;
      controls.minPolarAngle = this.radians( 90 );
      controls.maxPolarAngle = this.radians( 170 );
      controls.enablePan = false;

      controls.addEventListener( 'change', this.render );
      scene.add( camera );
      var g_objSelf = new THREE.SphereGeometry( 1, 5, 5 );
      var m_objSelf = new THREE.MeshBasicMaterial( { color: "#0F0", wireframe: false} );
      var mesh_objSelf = new THREE.Mesh( g_objSelf, m_objSelf );

      scene.add( mesh_objSelf );

      // 10 unit radius
      this.drawCircle( 10 );

      // 25 Unit Radius
      this.drawCircle( 25 );

      // 50 unit radius
      this.drawCircle( 50 );

      // 50 unit radius
      this.drawCircle( 100 );

      // Vertical Orientation Circle
      this.drawCircle( 200, {x:0, y:90}, "#262626" );

      // Horizontal Orientation Circle
      this.drawCircle( 200, {x:90, y:0}, "#262626" );

      // Zoom in and out buttons
      var zoom = this.drawZoomButtons();
      zoom.drawButtons();


      this.render();

  }, /* End initializeScreen */

  drawCircle: function( radius, angle={x:0,y:0}, lineColor="#00d100" ) {
      var segmentCount = 32,
      geometry = new THREE.Geometry(),
      material = new THREE.LineBasicMaterial({ color: lineColor });

      for (var i = 0; i <= segmentCount; i++) {
        var theta = (i / segmentCount) * Math.PI * 2;
        geometry.vertices.push(
            new THREE.Vector3(
                Math.cos(theta) * radius,
                Math.sin(theta) * radius,
                0));
      }
      var circle = new THREE.Line( geometry, material );
      circle.rotateY( this.radians( angle.y ) )
      circle.rotateX( this.radians( angle.x ) )
      scene.add( circle );
    }, /* End drawCircle */
    drawZoomButtons: function() {
      var zoomIn = document.createElement('div');
      var zoomOut = document.createElement('div');
      zoomIn.className = 'radar-zoom-button';
      zoomIn.style.position = 'absolute';
      zoomIn.style.width = 50;
      zoomIn.style.height = 50;
      zoomIn.id="radar-zoom-in"
      zoomIn.innerHTML = "<i class='fas fa-search-plus'></i>";
      zoomIn.style.top = -1000;
      zoomIn.style.left = -1000;
      zoomOut = zoomIn.cloneNode(true);
      zoomOut.id="radar-zoom-out";
      zoomOut.innerHTML = "<i class='fas fa-search-minus'></i>";

      var _this = this;


      return {
        zoomIn: zoomIn,
        zoomOut: zoomOut,
        positionIn: new THREE.Vector3(0,0,0),
        positionOut: new THREE.Vector3(0,0,0),
        updatePosition: function() {
          //var coords2d = _this.toScreenXY(this.position,camera,container)
          var containerloc = this.getContainerLocation();
          var inHeightPad = parseFloat(window.getComputedStyle(document.getElementById("radar-zoom-in")).height) + 15 ;
          var inWidthPad = parseFloat(window.getComputedStyle(document.getElementById("radar-zoom-in")).width) + 15;
          this.zoomIn.style.left = ( containerloc.right - inWidthPad ) + 'px';
          this.zoomIn.style.top = ( containerloc.bottom - inHeightPad ) + 'px';

          var outHeightPad = parseFloat(window.getComputedStyle(document.getElementById("radar-zoom-out")).height) + 15 ;
          var outWidthPad = parseFloat(window.getComputedStyle(document.getElementById("radar-zoom-out")).width) - 5;
          this.zoomOut.style.left = ( containerloc.left + outWidthPad ) + 'px';
          this.zoomOut.style.top = ( containerloc.bottom - outHeightPad ) + 'px';

        },
        getContainerLocation: function() {
          return container.getBoundingClientRect();
        },
        drawButtons: function() {
          container.appendChild( zoomIn );
          container.appendChild( zoomOut );
          this.updatePosition();

          // Do some jQuery magic where
          $("#radar-zoom-in").on("click", function() {

            camera.fov = Math.max(camera.fov * 0.85, 15);
            camera.updateProjectionMatrix();
            _this.render();



          });
          $("#radar-zoom-out").on("click", function() {

            camera.fov = Math.min(camera.fov * 1.15, 92);
            camera.updateProjectionMatrix();
            _this.render();



          });
        }
      };


    }, /* End drawZoomButtons */
    drawPointHeading: function( azmuth, pitch, distance, name, labeldata ) {

        this.drawPointCoord( this.calculateXYZ(azmuth, pitch, distance), name, labeldata );

    }, /* End drawPointHeading */
    drawPointCoord: function( coord = new THREE.Vector3(0,0,0), name = "Unnamed", labeldata="" ) {
      var g_blip = new THREE.SphereGeometry( 1, 5, 5 );
      var m_blip = new THREE.MeshBasicMaterial( { color: "#FF0", wireframe: false} );
      var mesh_blip = new THREE.Mesh( g_blip, m_blip );
      mesh_blip.name = name;
      mesh_blip.position.set( coord.x, coord.y, coord.z );
      mesh_blip.updateMatrix();
      mesh_blip.matrixAutoUpdate = false;
      scene.add( mesh_blip );

      var label = this.drawPointLabel();
      label.setHTML( name );
      label.setHover( labeldata );
      label.setParent( mesh_blip );
      textLabels.push( label );
      container.appendChild(label.element);
      this.render();
    },     /* End drawPointCoord */
    removePointByName: function( point ){
      var selectedObject;
      while ( selectedObject = scene.getObjectByName( point ) ) {
        scene.remove( selectedObject );
      }
      while ( selectedObject = scene.getObjectByName( point + "_label" ) ) {
        scene.remove( selectedObject );
      }
      this.render();
    }, /* End removePointByName */
    drawPointLabel: function() {
      var div = document.createElement('div');
      var visibleText = document.createElement('span');
      var hoverText = document.createElement('span');
      hoverText.className = "radar-hover-text";
      div.className = 'radar-text-label';
      div.style.position = 'absolute';
      div.style.width = 100;
      div.style.height = 100;
      div.innerHTML = "";
      div.style.top = -1000;
      div.style.left = -1000;

      var _this = this;

      div.appendChild( visibleText );
      div.appendChild( hoverText )

      return {
        element: div,
        hover: hoverText,
        visible: visibleText,
        parent: false,
        position: new THREE.Vector3(0,0,0),
        setHTML: function(html) {
          this.visible.innerHTML = html;
        },
        setHover: function(html) {
          this.hover.innerHTML = html;
        },
        setParent: function(threejsobj) {
          this.parent = threejsobj;
        },
        updatePosition: function() {
          if(parent) {
            this.position.copy(this.parent.position);
          }

          var coords2d = this.get2DCoords(this.position, camera);
          //var coords2d = _this.toScreenXY(this.position,camera,container)
          this.element.style.left = coords2d.x + 'px';
          this.element.style.top = coords2d.y + 'px';

          this.updateVisibility(); // Don't display outside of the radar box
        },
        updateVisibility: function() {
          var containerloc = container.getBoundingClientRect();
          var top = parseFloat(this.element.style.top);
          var bottom = parseFloat(this.element.style.bottom);
          var left = parseFloat(this.element.style.left);
          var right = parseFloat(this.element.style.right);

            if( top < containerloc.top || bottom > containerloc.bottom || left < containerloc.left || right > containerloc.right) {
              this.element.style.display = "none"
            } else {
              this.element.style.display = "block"
            }

        }, /* End updateVisibility */
        get2DCoords: function(position, fcamera) {
          //  var vector = position.project( fcamera );
          //  vector.x = (vector.x + 1)/2 * container.clientWidth;
          //  vector.y = -(vector.y - 1)/2 * container.clientHeight;
          var vector = new THREE.Vector3();
          vector = vector.setFromMatrixPosition( this.parent.matrixWorld );
          vector.project( fcamera );
          var widthHalf = WIDTH / 2;
          var heightHalf = HEIGHT / 2;
          var containerloc = container.getBoundingClientRect();
          vector.x = ( (vector.x * widthHalf) + widthHalf ) + containerloc.left -15;
          vector.y =  ( - (vector.y * heightHalf) + heightHalf ) + containerloc.top -10;
          return vector;
        }
      };


    }, /* End drawPointLabel */
    toScreenXY:function(position, camera, canvas) {
      var pos = position.clone();
      var projScreenMat = new THREE.Matrix4();
      projScreenMat.multiply(camera.projectionMatrix, camera.matrixWorldInverse);
      projScreenMat.multiplyVector3( pos );

      return { x: ( pos.x + 1 ) * canvas.width / 2 + canvas.offsetLeft,
          y: ( - pos.y + 1) * canvas.height / 2 + canvas.offsetTop };
    },
    calculateXYZ: function( azmuth, pitch, distance ) {
      var azmuth_rad = this.radians( azmuth + 90 );
      var pitch_rad = this.radians( pitch );
      var deltaPos = new THREE.Vector3;

      deltaPos.x = distance * Math.cos ( azmuth_rad ) * Math.cos( pitch_rad );
      deltaPos.y = distance * Math.cos( pitch_rad ) * Math.sin(azmuth_rad);
  	  deltaPos.z = distance * Math.sin( pitch_rad );

      return deltaPos;
    }, /* End calculateXYZ */
    render:function() {
        renderer.render( scene, camera );
        for(var i=0; i<textLabels.length; i++) {
          textLabels[i].updatePosition();
        }
    }, /* End Render */
    animate:function() {
      requestAnimationFrame( this.animate.bind(this) );
      this.render();
      controls.update();

    }, /* end Animate */
    radians:function(degrees) { // Degress to radians
        var pi = Math.PI;
        return degrees * (pi/180);
      } /* End Radians */
} /* End radarScreen return */
}());
