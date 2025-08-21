//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------JAVASCRIPT/ALPINEJS QUE MANEJA LA PAGINA DE DONACIONES SIMPLES----------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
document.addEventListener('alpine:init', () => {
  //------------------STORE DE ALPINEJS-------
  Alpine.store('donacion', {

    //------AQUÍ SE INICIARAN ALGUNAS FUNCIONES Y VARIABLES
    async init() {


      //-------AJUSTAR COSITAS DEL FORMULARIO NORMAL
      $('#inputOculto2').toggle();
      $('#inlineCheckbox2').change(function () {
        $('#inputOculto2').toggle(); // Alternar la visibilidad del div
      });


      //---INICIALIZAR LOS ERRORES.
      this.form_error = Object.assign({}, this.form);
      this.form_error.amount = ''


      //---INICIALIZAR STRIPE
      this.stripe = Stripe('pk_live_51PWMm9DB8zkbPNBAVROlyrG92SfRHFtqyJWtI6FQxcJwYmqquq9QxQ9OO1zqi61qu9YaX9znEtNtwFOJBY82DQZK00VmjyxMo0')


      //------CHEQUEAR ESTATUS SUCCESS DEL STRIPE ELEMENT
      const urlocal = new URL(this.urlstring)
      const url_params = new URLSearchParams(urlocal.search);
      const success_estatus = url_params.get('success');
      if (![undefined, null, ''].includes(success_estatus) && success_estatus == 'true') {
        this.estatus = 4
      }

      //-----SOLICITAR COMISIONES ESTATICAS
      //this.getRequestTest()
      this.HandleRequestFee()

    },

    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------SECCIÓN DE VARIABLES---------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    urlstring: window.location.href,
    stripe: null,
    elements: null,
    paymentElement: null,
    paymentID: null,
    clientID: null,
    domain: 'https://www.api.ordendesanbenito.org',
    //https://api.ordendesanbenito.org
    /*Estatus:
      0->inicial/monto
      1->pagina info
      2->pagina fee
      3->pagina stripe
      4->pagina success
    */
    estatus: 0,
    in_loading: false,
    in_open_dedication: false,
    in_open_comment: false,
    in_open_organization: false,
    form_html: null,
    in_invalid: false,
    fee_porce: 0,
    fee_fixed: 0,
    in_fee_loaded:false,
    //estado: 1,
    /*Este objeto esta asi para estar ya parcheado para stripe*/
    form: {
      name: '',
      email: '',
      last_name: null,
      organization: null,
      comment: null,
      dedication: null,
      amount: 10,
      in_fee: false,
      in_unpago: true
    },
    form_error: {},



    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------SECCIÓN DE SETTERS-----------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    /**
     * Inyecta el monto base de la donación
     * @param {Number} _monto monto a donar
     */
    setMonto(_monto) {
      this.form.amount = _monto
    },
    /**
     * Cambia el estado de openComment
     */
    setOpenComment() {
      this.in_open_comment = !this.in_open_comment;
    },

    /**
     * @description cambia el estado de open_dedication, y cuando lo "cierra", borra la dedicación
     */
    setOpenDedication() {
      this.in_open_dedication = !this.in_open_dedication;
      if (!this.in_open_dedication) {
        this.form.dedication = null
      }
    },


    /**
     * @description cambia el estado de open_organizacion, y cuando lo "cierra", borra la organización
     */
    setOpenOrganization() {
      this.in_open_organization = !this.in_open_organization;
      if (!this.in_open_organization) {
        this.form.organization = null
      }
    },

    /**
     * 
     * @param {boolean} _tipo tipo de pago
     * @description true->una vez  | false->suscripción
     */
    setInTipoPago(_tipo) {
      this.form.in_unpago = _tipo
    },

    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------SECCIÓN DE GETTERS---------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    /**
     * @description evalúa si hay que deshabilitar algo o no.
     */
    getDisable() {
      return (this.in_loading == true || this.in_invalid == true)
    },
    /**
     * @description Calcula y retorna la comisión de stripe en base al monto final con la comisión.
     * @returns Monto de la comisión de stripe.
     */
    getFee() {
      const total = this.getPrecioTotal()
      let monto = total - parseFloat(this.form.amount)
      monto = Math.round(monto * 100) / 100;
      return monto
    },
    /**
     * @description calcula el monto total a donar según si el usuario quiere pagar la comisión o no
     * @returns Monto total a donar.
     */
    getPrecioTotal() {
      /**
       * La comisión se calcula asi: monto_total=monto+(monto*fee_porce)+fee_fijo
       */

      //----CASO DE QUE EL USUARIO QUIERA PAGAR LA COMISIÓN
      if (this.form.in_fee) {

        let monto = (parseFloat(this.form.amount) + this.fee_fixed) / (1 - this.fee_porce)
        monto = Math.round(monto * 100) / 100;
        return monto

      } else {  //-----CASO CONTRARIO
        return this.form.amount
      }

    },
    async delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------SECCIÓN DE PETICIONES SIMPLES------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
     async getRequestTest() {
      const response = await $.ajax({
        url: this.domain + '/api/test',
        method: "GET"
      })
      return response
    },

    /**
     * @description consulta los producto de tipo misa activos.
     * @returns respuesta
     */
    async getRequestFee1() {
      const response = await jQuery.ajax({
        url: this.domain + '/api/stripe/fee',
        method: "GET"
      })
      return response
    },
   
    async getRequestFee() {
      try{
      const response = await fetch(this.domain + '/api/stripe/fee',{
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const data=await response.json();
      return data
      
    }catch{
      console.error('Error fetching fee:', error);
      throw error;
    }
      //return response
    },
    async getRequestFee2() {
      return new Promise((resolve, reject) => {
          const xhr = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXobjet('Microsoft.XMLHTTP');
          xhr.open("GET", this.domain + '/api/stripe/fee', true);
         xhr.timeout = 10000; 
        xhr.withCredentials = true;
         xhr.setRequestHeader("Content-Type", "application/json");  
          // Configura lo que sucede cuando la solicitud cambia de estado
          xhr.onreadystatechange = function () {
              if (xhr.readyState === 4) { // La solicitud se completó
                  if (xhr.status >= 200 && xhr.status < 300) {
                      try {
                          // Parsea la respuesta como JSON
                          const response = JSON.parse(xhr.responseText);
                          resolve(response);
                      } catch (error) {
                          reject(new Error("Error al parsear la respuesta JSON"));
                      }
                  } else {
                      // Manejo de errores HTTP
                      reject(new Error(`HTTP Error: ${xhr.status} - ${xhr.statusText}`));
                  }
              }
          };
  
          // Manejo de errores de red
          xhr.onerror = function () {
              reject(new Error("Error de red o CORS"));
          };

          // Manejar el tiempo de espera
           xhr.ontimeout = function () { reject(new Error('La solicitud tardó demasiado en responder.')); // Envía la solicitud
          };         

          xhr.send();
          });
    },
   getRequestFee3() {
      return new Promise((resolve, reject) => {
        $.ajax({
            url: this.domain + '/api/stripe/fee',
            method: "GET",
            success: (response) => {
                resolve(response);
            },
            error: (xhr, status, error) => {
                reject({ xhr, status, error });
            }
        });
    });
    },

    /**
     * @description Solicitar el payment intent
     * @param {object} _data 
     * @returns respuesta
     */
    async postRequestDonacion(_data) {
      /*const response = await $.ajax({
        url: this.domain + '/api/stripe/create-donacion-payment-intent',
        data: _data,
        method: "POST"
      })
      return response*/
      /*try{
        const response = await fetch(this.domain + '/api/stripe/create-donacion-payment-intent',{
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body:JSON.stringify(_data)
        })
  
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        const data=await response.json();
        return data
        
      }catch{
        console.error('Error fetching fee:', error);
        throw error;
      }*/
     return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", this.domain + '/api/stripe/create-donacion-payment-intent', true);
          xhr.timeout = 10000; 
          // Establecer encabezados
          xhr.setRequestHeader("Content-Type", "application/json");
      
          // Definir lo que hacer cuando la respuesta esté disponible
          xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
              // La respuesta fue exitosa, la parseamos como JSON
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (error) {
                reject('Error al parsear la respuesta JSON');
              }
            } else {
              // Si el estado de la respuesta no es exitoso
              reject(`HTTP error! status: ${xhr.status}`);
            }
          };
      
          // Definir lo que hacer en caso de error en la petición
          xhr.onerror = function() {
             const errorDetails = {
              status: xhr.status, // Estado HTTP (debería ser 0 en errores de red)
              statusText: xhr.statusText, // Texto del estado (a menudo vacío en errores de red)
              responseURL: xhr.responseURL, // URL que se intentó acceder
              readyState: xhr.readyState, // Estado de la solicitud
            };

            reject(`Error en la solicituddd: ${JSON.stringify(errorDetails)}`);
            //reject('Error en la solicitud');
          };

         xhr.ontimeout = function () { reject(new Error('La solicitud tardó demasiado en responder.'));
         };          // Convertir los datos a JSON y enviarlos
          xhr.send(JSON.stringify(_data));
      });
    },
    /**
     * @description Solicitar cancelar un payment intent
     * @returns respuesta
     */
    async postRequestCancelDonacion() {
      /*const response = await $.ajax({
        url: this.domain + '/api/stripe/cancel-payment-intent',
        data: { id: this.paymentID },
        method: "POST"
      })
      return response*/
     /*try{
        const response = await fetch(this.domain + '/api/stripe/cancel-payment-intent',{
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body:JSON.stringify({ id: this.paymentID })
        })
  
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        const data=await response.json();
        return data
        
      }catch{
        console.error('Error fetching fee:', error);
        throw error;
      }*/
    return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", this.domain + '/api/stripe/cancel-payment-intent', true);
      
          // Establecer encabezados
          xhr.setRequestHeader("Content-Type", "application/json");
      
          // Definir lo que hacer cuando la respuesta esté disponible
          xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
              // La respuesta fue exitosa, la parseamos como JSON
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (error) {
                reject('Error al parsear la respuesta JSON');
              }
            } else {
              // Si el estado de la respuesta no es exitoso
              reject(`HTTP error! status: ${xhr.status}`);
            }
          };
      
          // Definir lo que hacer en caso de error en la petición
          xhr.onerror = function() {
            reject('Error en la solicitud');
          };
      
          // Convertir los datos a JSON y enviarlos
          xhr.send(JSON.stringify({ id: this.paymentID }));
        });
    },
    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------SECCIÓN DE HANDLE REQUEST----------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------

    /**
     * @description handle request principal el cual solicita el payment intent y genera el formulario de stripe.
     */
    async HandleRequest() {

      //-----------PASO 1 INICIAR EL PROCESO
      //----------------------------------------------------
      
      this.in_loading = true;
      await this.delay(1000)
      this.form_error = getLimpio(this.form_error)
      const elform = getObjectoReducido(this.form)

      try {

        //-----------PASO 2 SOLICITAR EL PAYMENT INTENT CON LOS DATOS SUMINISTRADOS POR EL USUARIO
        //----------------------------------------------------

        const response = await this.postRequestDonacion(elform)



        if (response.success && response.data.amount == this.getPrecioTotal()) {

          //----------PASO 3  GENERAR FORMULARIO DE STRIPE
          //----------------------------------------------------
          this.elements = this.stripe.elements({ clientSecret: response.data.client_secret })
          this.paymentID = response.data.id
          this.clientID = response.data.client_secret
          this.paymentElement = this.elements.create('payment')
          this.paymentElement.mount('#payment-element');
          this.paymentElement.on('change', function (event) {
            const displayError = document.getElementById('payment-errors');
            if (event.error) {
              displayError.textContent = event.error.message;
            } else {
              displayError.textContent = '';
            }
          });
          this.form_html = document.getElementById("payment-form")
          this.form_html.addEventListener('submit', async (_event) => {
            _event.preventDefault();
            await this.handleRequestStripe();
          })

          //----------PASO 4  CAMBIA EL FORMULARIO ACTUAL AL DE STRIPE
          //----------------------------------------------------
          this.estatus = 3

        } else if (response.success && response.data.amount != this.getPrecioTotal()) {
          //----------CASO ERROR LOS MONTO DEL SERVIDOR Y DEL CLIENTE NO COINCIDEN.
          //----------------------------------------------------
          mensajeAlerta('hubo un problema en los montos', 'div-alerta-fee', 'danger')


        } else {

          //------------MANEJO DE ERRORES DE INPUTS
          //----------------------------------------------------
          if (![undefined, null, ''].includes(response.input_errors)) {
            this.goToNextForm(1)
            Object.assign(this.form_error, getObjetoSincronizado(this.form_error, response.input_errors));
            if (this.form_error.amount != undefined && this.form_error.amount != '') {
              this.goToNextForm(0)
            }

          }


          //------------MANEJO DE ERRORES NORMALES
          //----------------------------------------------------
          if (![undefined, null, ''].includes(response.error)) {
            mensajeAlerta(response.error, 'div-alerta', 'danger')
          }

        }
      } catch (error) {
        //------------MANEJO DE ERRORES INUSUALES
        //----------------------------------------------------
        console.log(error)
        //'Ha ocurrido un errror'
        mensajeAlerta('Error en la petición al api', 'div-alerta-fee', 'danger')
      }

      //-----FINAL
      this.in_loading = false;
    },



    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    /**
     * @description Esto va ejecutar el pago real de stripe
     * 
    */
    async handleRequestStripe() {
      
      this.in_loading = true;
      await this.delay(1000)
      //----------PASO 1  EJECUTAR EL PAGO REAL DE STRIPE
      //----------------------------------------------------
      const { error, response } = await this.stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          return_url: this.urlstring + '?success=true',
        },
      })

      //----------MANEJO DE ERRORES
      //----------------------------------------------------
      if (error) {
        mensajeAlerta(error.message, 'payment-errors', 'danger')
      } else if (response && response.status === 'requires_action') {
        // Manejar autenticación adicional si es necesario
        const { error: confirmationError } = this.stripe.confirmCardPayment(this.clientID);
        if (confirmationError) {
          mensajeAlerta(confirmationError.message, 'payment-errors', 'danger')
        }

      } else if (response && response.status === 'succeeded') {
        //----------SI BIEN ESTO ESTA AQUÍ, POR FUNCIONALIDAD, STRIPE TE REDIRECCIONA/RECARGA LA PAGINA CUANDO EL PAGO ES EXITOSO
        //----------------------------------------------------
        console.log('Pago realizado con éxito');
      } else {
        mensajeAlerta('Ha ocurrido un error desconocido.', 'payment-errors', 'danger')
      }

      //mensajeAlerta("probando alerta",'payment-errors')

      this.in_loading = false;

    },

    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    /**
     * @description handle request para obtener las misas y llenar el select de las misas.
    */
    async HandleRequestFee() {
      //await this.delay(1000)
      this.in_loading = true;
      try {
        const response = await this.getRequestFee2()
        if (response.success) {
          //----------GENERAR FORMULARIO DE STRIPE
          this.fee_porce = response.data.fee_porce
          this.fee_fixed = response.data.fee_fixed

        } else {
          //------------MANEJO DE ERRORES
          mensajeAlerta('No se pudo consultar las comisiones, por favor recargue la pagina ', 'div-alerta-inicio', 'danger')
          this.in_invalid = true

        }
      } catch (error) {
        console.log(error)
        const errorDetails = {
          error: error,
          navigator: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language,
          },
          window: {
              location: window.location.href,
              referrer: document.referrer,
          },
        };
        //gola
        //mensajeAlerta('Ha ocurrido un error, por favor recargue la pagina', 'div-alerta-inicio', 'danger')
        mensajeAlerta('Error en la petición al api', 'div-alerta-inicio', 'danger')
        this.in_invalid = true
      }


      this.in_loading = false;
      /*this.getRequestFee().then(response=>{
        if (response.success) {
          //----------GENERAR FORMULARIO DE STRIPE
          this.fee_porce = response.data.fee_porce
          this.fee_fixed = response.data.fee_fixed

        } else {
          //------------MANEJO DE ERRORES
          mensajeAlerta('No se pudo consultar las comisiones, por favor recargue la pagina ', 'div-alerta-inicio', 'danger')
          this.in_invalid = true

        }
      }).catch(error=>{
        console.log(error)
        const errorDetails = {
          error: error,
          navigator: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language,
          },
          window: {
              location: window.location.href,
              referrer: document.referrer,
          },
        };
        mensajeAlerta(JSON.stringify(errorDetails, null, 2), 'div-alerta-inicio', 'danger')
        this.in_invalid = true
      }).finally(()=>{
        this.in_loading = false;
      })*/
    },


    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    /**
     * @description Esta función hecha a un paso para atras el pago, 
     * aunque tiene una funciÓn asíncrona no importa ver si el resultado es satisfactorio o no de esta
     */
    HandleRequestCancel() {
      this.estatus = 2

      $("#payment-element").html('')

      //------PROCESO PRINCIPAL, no hace falta el await.
      try {
        this.postRequestCancelDonacion()
      } catch (error) {
        console.log(error)
      }

      //------VACÍA LOS CAMPOS GENERADOS PARA STRIPE

      this.elements = null
      this.paymentID = null
      this.paymentElement = null
      this.form_html = null
      this.clientID = null

    },

    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------SECCIÓN DE FUNCIONES ÚTILES----------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    /**
     * @description Vacía los datos del stripe (su DOM Y sus variables)
     */
    vaciarFormularioPago() {
      this.elements = null
      this.paymentID = null
      this.paymentElement = null
      this.clientID = null
      this.form_html = null
      $("#payment-element").html('')
      this.goToNextForm(0)
    },
    /**
     * 
     * @param {number} _estatus 
     * @description cambia el status(el formulario) y ajusta el scroll.
     */
    async goToNextForm(_estatus){
      this.estatus=_estatus
      //if(_estatus==1 && !this.in_fee_loaded){
        //await this.HandleRequestFee()
      //}
      window.scrollTo({top:400,behavior:'smooth'})
    }
  })
})
