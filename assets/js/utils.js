//const url = window.location.protocol + "//" + window.location.host + "";

//------------------------FUNCIONES UTILES---------------------------
function mensajeAlerta(_mensaje,_div,_tipo='success'){
    let tx_html=''
    tx_html+='<div class="alert alert-'+_tipo+' alert-dismissible" role="alert">'
    tx_html+='<p class="mb-0">'+_mensaje+'</p>'
    tx_html+='<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>'
    tx_html+='</div>'
    $('#'+_div).html(tx_html)
}


function getObjetoSincronizado(_objetoBase,_objetoUpdate){
  const synchronizedObj = Object.keys(_objetoBase).reduce((acc, key) => {
      if (_objetoUpdate.hasOwnProperty(key)) {
        acc[key] = _objetoUpdate[key];
      }
      return acc;
  }, {});

  return synchronizedObj;

}

function getObjectoReducido(_objeto) {
    const objeto=Object.assign({},_objeto)
    for (let clave in objeto) {
      if (objeto[clave] === undefined || objeto[clave] === null || objeto[clave] === '') {
        delete objeto[clave];
      }
    }
    return objeto;
  }
  
   /**
       * Obtener version limpio
       * @param _form Es el objeto a limpiar
       * @return regresa una version limpia del objeto
    */
  function getLimpio(_form){
    const lista=Object.keys(_form)
    const form=Object.assign({}, _form)
    lista.forEach((key) => {
        form[key] = ""
    })
    return form
  }
  
  function getLimpioOnlyNullable(_form){
    const lista=Object.keys(_form)
    const form=Object.assign({}, _form)
    lista.forEach((key) => {
        if(form[key]==''){
          form[key] = null
        }
        
    })
    return form
  }