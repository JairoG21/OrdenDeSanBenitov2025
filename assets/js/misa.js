//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------JAVASCRIPT/ALPINEJS QUE MANEJA LA PAGINA DE DONACIONES POR MISA---------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
document.addEventListener("alpine:init", () => {
  //------------------STORE DE ALPINEJS-------
  Alpine.store("misa", {
    //------AQUÍ SE INICIARAN ALGUNAS FUNCIONES Y VARIABLES
    async init() {
      //-------AJUSTAR COSITAS DEL FORMULARIO NORMAL
      $("#inputOculto2").toggle();
      $("#inlineCheckbox2").change(function () {
        $("#inputOculto2").toggle(); // Alternar la visibilidad del div
      });

      //---INICIALIZAR LOS ERRORES.
      this.form_error = Object.assign({}, this.form);
      this.form_error.amount = "";
      this.form_error.quantity = "";

      //---INICIALIZAR STRIPE
      this.stripe = Stripe(
        "pk_live_51PWMm9DB8zkbPNBAVROlyrG92SfRHFtqyJWtI6FQxcJwYmqquq9QxQ9OO1zqi61qu9YaX9znEtNtwFOJBY82DQZK00VmjyxMo0"
      );

      //------CHEQUEAR ESTATUS SUCCESS
      const urlocal = new URL(this.urlstring);
      const url_params = new URLSearchParams(urlocal.search);
      const success_estatus = url_params.get("success");
      if (
        ![undefined, null, ""].includes(success_estatus) &&
        success_estatus == "true"
      ) {
        this.estatus = 4;
      }

      this.getRequestTest();

      //-----SOLICITAR LOS PRODUCTOS/TIPOS DE MISAS DISPONIBLES PARA EL INPUT SELECT
      this.HandleRequestGetMisa();

      //-----SOLICITAR COMISIONES ESTATICAS
      this.HandleRequestFee();
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
    /*Estatus:
      0->inicial/monto
      1->pagina info
      2->pagina fee
      3->pagina stripe
      4->pagina success
    */
    lista_misa: [],
    estatus: 0,
    in_loading: false,
    in_open_organization: false,
    form_html: null,
    domain: "https://api.ordendesanbenito.org",

    in_invalid: false,
    fee_porce: 0,
    fee_fixed: 0,
    //https://api.ordendesanbenito.org
    //estado: 1,
    /*Este objeto esta asi para estar ya parcheado para stripe*/
    form: {
      name: "",
      email: "",
      last_name: null,
      organization: null,
      //description:null,
      motive: "",
      misa_id: null,
      quantity: 1,
      amount: 5,
      in_fee: false,
    },
    form_error: {},
    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------SECCIÓN DE SETTERS-----------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    /**
     * @param {Number} _monto monto a donar
     */
    setMonto(_monto) {
      this.form.amount = _monto;
    },
    /**
     * @description disminuye la cantidad de misas en 1
     */
    setMenosCantidad() {
      if (this.form.quantity - 1 >= 0) {
        this.form.quantity--;
      }
    },
    /**
     * @description cambia el estado de open_organizacion, y cuando lo "cierra", borra la organización
     */
    setOpenOrganization() {
      this.in_open_organization = !this.in_open_organization;
      if (!this.in_open_organization) {
        this.form.organization = null;
      }
    },
    /**
     *
     * @param {boolean} _tipo tipo de pago
     * @description true->una vez  | false->suscripción
     */
    setInTipoPago(_tipo) {
      this.form.in_unpago = _tipo;
    },
    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------SECCIÓN DE GETTERS-----------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    /**
     * @description evalúa si hay que deshabilitar algo o no.
     */
    getDisable() {
      return this.in_loading == true || this.in_invalid == true;
    },
    /**
     * @description Calcula y retorna la comisión de stripe en base al monto final con la comisión.
     * @returns Monto de la comisión de stripe.
     */
    getFee() {
      const total = this.getPrecioTotal();
      let monto = total - parseFloat(this.form.amount * this.form.quantity);
      monto = Math.round(monto * 100) / 100;
      return monto;
    },
    /**
     * @description este monto es el monto a donar por el numero de misas.
     * @returns el precio total normal sin comisión
     */
    getMontoTotalNormal() {
      const item_producto = this.lista_misa.filter(
        (item) => item.id == this.form.misa_id
      )[0];
      if (![undefined, null, ""].includes(item_producto)) {
        return Math.round(this.form.amount * this.form.quantity * 100) / 100;
      } else {
        return 0;
      }
    },

    /**
     * @description calcula el monto total a donar según si el usuario quiere pagar la comisión o no
     * @returns Monto total a donar.
     */
    getPrecioTotal() {
      /**
       * La comisión se calcula asi: monto_total=monto+(monto*fee_porce)+fee_fijo
       */

      //----BUSCAR EL PRODUCTO/TIPO MISA SELECCIONADO
      const item_producto = this.lista_misa.filter(
        (item) => item.id == this.form.misa_id
      )[0];

      if (![undefined, null, ""].includes(item_producto)) {
        //----CASO DE QUE EL USUARIO QUIERA PAGAR LA COMISIÓN
        if (this.form.in_fee) {
          const monto_total_normal = this.form.amount * this.form.quantity;
          const monto_total_confee =
            (parseFloat(monto_total_normal) + this.fee_fixed) /
            (1 - this.fee_porce);
          return Math.round(monto_total_confee * 100) / 100;
        } else {
          //----CASO CONTRARIO
          return Math.round(this.form.amount * this.form.quantity * 100) / 100;
        }
      } else {
        //-----CASO CONTRARIO
        return 0;
      }
    },

    /**
     *
     * @returns Texto del monto total para el formulario inicial
     */
    getTxPreciototal() {
      if ([undefined, null, ""].includes(this.form.misa_id)) {
        return "Debe seleccionar un tipo misa";
      } else {
        return (
          "La donación sugerida para " +
          this.form.quantity.toString() +
          " misas son " +
          this.getMontoTotalNormal().toString() +
          "$"
        );
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
    async getRequestFee() {
      const response = await $.ajax({
        url: this.domain + "/api/stripe/fee",
        method: "GET",
      });
      return response;
    },
   async getRequestFee2() {
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
    /**
     * @description consulta los producto de tipo misa activos.
     * @returns respuesta
     */
    async getRequestTipoMisa() {
      /*const response = await $.ajax({
        url: this.domain + "/api/stripe/tipo-misa",
        method: "GET",
      });
      return response;*/
     try{
        const response = await fetch(this.domain + '/api/stripe/tipo-misa',{
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
    },
    /**
     * @description Solicitar el payment intent
     * @param {object} _data
     * @returns respuesta
     */
    async postRequestMisa(_data) {
      const response = await $.ajax({
        url: this.domain + "/api/stripe/create-misa-payment-intent",
        data: _data,
        method: "POST",
      });
      return response;
    },
    /**
     * @description Solicitar cancelar un payment intent
     * @returns respuesta
     */
    async postRequestCancelDonacion() {
      const response = await $.ajax({
        url: this.domain + "/api/stripe/cancel-payment-intent",
        data: { id: this.paymentID },
        method: "POST",
      });
      return response;
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
      this.form_error = getLimpio(this.form_error);
      const elform = getObjectoReducido(this.form);

      try {
        //-----------PASO 2 SOLICITAR EL PAYMENT INTENT CON LOS DATOS SUMINISTRADOS POR EL USUARIO
        //----------------------------------------------------
        const response = await this.postRequestMisa(elform);
        if (response.success && response.data.amount == this.getPrecioTotal()) {
          //----------PASO 3  GENERAR FORMULARIO DE STRIPE
          //----------------------------------------------------
          this.elements = this.stripe.elements({
            clientSecret: response.data.client_secret,
          });
          this.paymentID = response.data.id;
          this.clientID = response.data.client_secret;
          this.paymentElement = this.elements.create("payment");
          this.paymentElement.mount("#payment-element");
          this.paymentElement.on("change", function (event) {
            const displayError = document.getElementById("payment-errors");
            if (event.error) {
              displayError.textContent = event.error.message;
            } else {
              displayError.textContent = "";
            }
          });

          this.form_html = document.getElementById("payment-form");
          this.form_html.addEventListener("submit", async (_event) => {
            _event.preventDefault();
            await this.handleRequestStripe();
          });

          //----------PASO 4  CAMBIA EL FORMULARIO ACTUAL AL DE STRIPE
          //----------------------------------------------------
          this.goToNextForm(3);
        } else if (
          response.success &&
          response.data.amount != this.getPrecioTotal()
        ) {
          //----------CASO ERROR LOS MONTO DEL SERVIDOR Y DEL CLIENTE NO COINCIDEN.
          //----------------------------------------------------
          mensajeAlerta(
            "hubo un problema en los montos",
            "div-alerta",
            "danger"
          );
        } else {
          //------------MANEJO DE ERRORES DE INPUTS
          //----------------------------------------------------
          if (![undefined, null, ""].includes(response.input_errors)) {
            Object.assign(
              this.form_error,
              getObjetoSincronizado(this.form_error, response.input_errors)
            );
            this.goToNextForm(1);

            if (
              !["", undefined, null].includes(this.form_error.quantity) ||
              !["", undefined, null].includes(this.form_error.misa_id) ||
              !["", undefined, null].includes(this.form_error.amount) ||
              !["", undefined, null].includes(this.form_error.motive)
            ) {
              this.goToNextForm(0);
            }
          }

          //------------MANEJO DE ERRORES NORMALES
          //----------------------------------------------------
          if (![undefined, null, ""].includes(response.error)) {
            mensajeAlerta(response.error, "div-alerta", "danger");
          }

          //console.log(this.form_error)
        }
      } catch (error) {
        //------------MANEJO DE ERRORES INUSUALES
        //----------------------------------------------------
        console.log(error);
        mensajeAlerta("Ha ocurrido un error", "div-alerta-fee", "danger");
      }

      //-----FINAL
      this.in_loading = false;
    },

    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    /**
     * @description handle request para obtener las misas y llenar el select de las misas.
     */
    async HandleRequestGetMisa() {
      await this.delay(1000)
      this.in_loading = true;
      try {
        const response = await this.getRequestTipoMisa();
        if (response.success) {
          //----------GENERAR FORMULARIO DE STRIPE
          this.lista_misa = response.data;
        } else {
          this.lista_misa = [];
          //------------MANEJO DE ERRORES

          if (![undefined, null, ""].includes(response.error)) {
            mensajeAlerta(response.error, "div-alerta-inicio", "danger");
          } else {
            mensajeAlerta(
              "No se ha podido cargar las misas, por favor recargue la pagina",
              "div-alerta-inicio",
              "danger"
            );
          }
          this.in_invalid = true;
        }
      } catch (error) {
        this.lista_misa = [];
        console.log(error);
        this.in_invalid = true;
        mensajeAlerta(
          "Ha ocurrido un error, por favor recargue la pagina",
          "div-alerta-inicio",
          "danger"
        );
      }

      this.in_loading = false;
    },
    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    /**
     * @description handle request para obtener las misas y llenar el select de las misas.
     */
    async HandleRequestFee() {
      await this.delay(1000)
      this.in_loading = true;
      try {
        const response = await this.getRequestFee2();
        if (response.success) {
          //----------GENERAR FORMULARIO DE STRIPE
          this.fee_porce = response.data.fee_porce;
          this.fee_fixed = response.data.fee_fixed;
        } else {
          //------------MANEJO DE ERRORES
          mensajeAlerta(
            "No se pudo consultar las comisiones, por favor recargue la pagina ",
            "div-alerta-inicio",
            "danger"
          );
          this.in_invalid = true;
        }
      } catch (error) {
        console.log(error);
        mensajeAlerta(
          "Ha ocurrido un error, por favor recargue la pagina",
          "div-alerta-inicio",
          "danger"
        );
        this.in_invalid = true;
      }

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

      //----------PASO 1  EJECUTAR EL PAGO REAL DE STRIPE
      //----------------------------------------------------
      const { error, response } = await this.stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          return_url: this.urlstring + "?success=true",
        },
      });

      //----------MANEJO DE ERRORES
      //----------------------------------------------------
      if (error) {
        mensajeAlerta(error.message, "payment-errors", "danger");
      } else if (response && response.status === "requires_action") {
        // Manejar autenticación adicional si es necesario
        const { error: confirmationError } = this.stripe.confirmCardPayment(
          this.clientID
        );
        if (confirmationError) {
          mensajeAlerta(confirmationError.message, "payment-errors", "danger");
        }
      } else if (response && response.status === "succeeded") {
        //----------SI BIEN ESTO ESTA AQUÍ, POR FUNCIONALIDAD, STRIPE TE REDIRECCIONA/RECARGA LA PAGINA CUANDO EL PAGO ES EXITOSO
        //----------------------------------------------------
        console.log("Pago realizado con éxito");
        // Aquí puedes redirigir o mostrar un mensaje de éxito
      } else {
        mensajeAlerta(
          "Ha ocurrido un error desconocido.",
          "payment-errors",
          "danger"
        );
      }

      this.in_loading = false;
    },
    //--------------------------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------
    /**
     * @description Esta función hecha a un paso para atras el pago,
     * aunque tiene una funciÓn asíncrona no importa ver si el resultado es satisfactorio o no de esta
     */
    HandleRequestCancel() {
      this.estatus = 2;

      $("#payment-element").html("");
      //------PROCESO PRINCIPAL, no hace falta el await.
      try {
        this.postRequestCancelDonacion();
      } catch (error) {
        console.log(error);
      }
      //------VACÍA LOS CAMPOS GENERADOS PARA STRIPE
      this.elements = null;
      this.paymentID = null;
      this.paymentElement = null;
      this.form_html = null;
      this.clientID = null;
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
      this.elements = null;
      this.paymentID = null;
      this.paymentElement = null;
      this.clientID = null;
      this.form_html = null;
      $("#payment-element").html("");
      this.goToNextForm(0);
      this.estatus = 0;
    },
    /**
     *
     * @param {number} _estatus
     * @description cambia el status(el formulario) y ajusta el scroll.
     */
    goToNextForm(_estatus) {
      this.estatus = _estatus;
      window.scrollTo({ top: 400, behavior: "smooth" });
    },
  });
});
