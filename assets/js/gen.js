
function incrementar() {
    const input = document.getElementById('numeroModal');
    input.stepUp();
  }

  function decrementar() {
    const input = document.getElementById('numeroModal');
    input.stepDown();
  }
// Prueba
$(document).ready(function() {
    $('#inlineCheckbox1').change(function() {
        $('#inputOculto').toggle(); // Alternar la visibilidad del div
    });
});

//Ancla
function irArriba(pxPantalla){
  window.addEventListener('scroll', () => {
    var scroll = document.documentElement.scrollTop;
    var buttonUp = document.getElementById('buttonUp');
    if(scroll > pxPantalla){
      buttonUp.style.right = 20 + "px";
    } else{
      buttonUp.style.right = -100 + "%";
    }
  })
}
irArriba(1900); 

// ancla capítulos

// Agregamos un offset al desplazamiento para compensar el menú
$(document).ready(() => {
  console.log("cargo");
  var target = window.location.href;
  if (target.includes("#")) {
    target = "#" + target.split("#")[1];
  }

  $("html, body").animate(
    {
      scrollTop: $(target).offset().top - 190, // 100 es el valor que necesitaremos ajustar a la altura exacta de tu menú
    },
    10
  );
  if(target == "#pills-Creemos-tab"){
    console.log("si")
    $("#pills-Creemos-tab").click()
  }
  history.pushState(null, "", window.location.href.split("#")[0]);
});

function mover_cape(id) {
  console.log("entro mover");
  $("html, body").animate(
    {
      scrollTop: $(id).offset().top - 190, // 100 es el valor que necesitaremos ajustar a la altura exacta de tu menú
    },
    10
  );
}