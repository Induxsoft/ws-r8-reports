var HtmlTemplates={
    LoadingSpinner:"<div class=\'spinner-grow text-success\' role=\'status\'></div>",
    LowLevelError:"<div><small>Ha ocurrido un error</small></div>"
};
/*********************************************************

refreshElement

Actualiza un elemento del DOM con el HTML obtenido a
través de una solicitud POST con parámetros en JSON

Todos los parámetros son opcionales y en caso de omitirse,
se usarán valores conocidos del objeto global spa_context

Parámetros:
===========
view - La URL hacia la que se envía la solicitud
dest - El Id de un elemento del DOM
data - Objeto de datos que serán enviados como parámetros
success - Función 'callback' si todo sale bien 

*********************************************************/

function refreshElement(view, dest, data,success)
{
    if (view===undefined)
    {
        if (spa_context.current_request==undefined)
            view=spa_context.START_MODULE;
        else
            view=spa_context.current_request.view;
    }

    if (dest===undefined)
    {
        if (spa_context.current_request==undefined)
            dest="body"
        else
            dest=spa_context.current_request.element_id;
    }
        

    if (spa_context.current_request===undefined)
        spa_context.current_request={};
    
    if (spa_context.current_request===null)
        spa_context.current_request={};

    if (data===undefined)
        data={};
    
    if (data===null)
        data={};
    
    spa_context.current_request.element_id=dest;
    spa_context.current_request.view=view;
    spa_context.current_request.data=data;

    $(dest).html(HtmlTemplates.LoadingSpinner);

    $.ajax({
    type: "POST",
    url: view,
    contentType:"text/plain",
    data: JSON.stringify(spa_context),
    success: function(data){
        $(dest).html(data);
        if (!(success===undefined))
            if (success!=null)
                success();
    },
    error: function(err)
    {
        $(dest).html(HtmlTemplates.LowLevelError);
    },
    dataType: "html"
    });

}

/*********************************************************
createDialog

Crea un elemento del DOM contenedor para el Html obtenido
a través de una solicitud POST y despliega un diálogo modal

Parámetros:
===========
id - El identificado asociado a la instancia del diálogo
title - Título del diálogo
view  - URL desde donde se obtiene el contenido
data  - Parámetros de la solicitud
success - Función 'callback' cuando el diálogo está listo
*********************************************************/
var previous_element_id="body";
var previous_view="";

function createDialog(id, title, view, data, success)
{
    var template=   '<div class="modal" tabindex="-1" role="dialog" id="dialog_'+id+'">'+
                        '<div class="modal-dialog" role="document">'+
                            '<div class="modal-content">'+
                                '<div class="modal-header">'+
                                    '<h5 class="modal-title" id="_dialog_title">'+title+'</h5>'+
                                        '<button type="button" class="close" onclick="closeDialog(\''+id+'\');" aria-label="Close">'+
                                            '<span aria-hidden="true">&times;</span>'+
                                        '</button>'+
                                '</div>'+
                                '<div class="modal-body" id="'+id+'">'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>';

    previous_element_id=spa_context.current_request.element_id;
    previous_view=spa_context.current_request.view;

    $("body").append(template);

    refreshElement(view,"#"+id,data, function(){
        $("#dialog_"+id).modal('handleUpdate'); 
        if (success!=undefined)  
            success();
    });
    
    $("#dialog_"+id).modal({backdrop:false,keyboard:false});
    $("#dialog_"+id).modal("show");
}

/*********************************************************
closeDialog

Cierra un diálogo modal previamente abierto

Parámetros:
===========
id - El identificado asociado a la instancia del diálogo

*********************************************************/

function closeDialog(id)
{
    spa_context.current_request.element_id=previous_element_id;
    spa_context.current_request.view=previous_view;
    
    $("#dialog_"+id).hide();
    $("#dialog_"+id).remove();
    $(".modal-backdrop").remove();
    $('body').removeClass('modal-open');
    $('body').removeAttr('padding-right');
    $('body').removeAttr('data-bs-padding-right');
    $('body').removeAttr("style");
}

/*********************************************************
getFormData

Devuelve un objeto con todos los datos de un formulario
basándose en el tipo de input.

Omitirá los input cuyo nombre inicie con --

Parámetros:
===========
formid - El identificado del formulario

*********************************************************/
function getFormData(formId)
{
    var data={};

    $("form#"+formId+" input, form#"+formId+" select").each(function(){
        var input=$(this);
        var nm=input.attr("name");
        var ommittable=false;

        if (nm===undefined)
            nm=input.attr("id");

        if (nm.length>=2)
            if (nm[0]=="-" && nm[1]=="-")
                ommittable=true;

        if (!ommittable)
            if ($(input).attr("type")!=undefined)
                if ($(input).attr("type").toLowerCase()=="checkbox")
                    data[nm]= $(input).prop("checked");
                else
                    data[nm]=input.val();
            else
                data[nm]=input.val();
    });

    return data;
}

/*********************************************************
refreshReport

Actualiza un elemento con base en los campos de un 
formulario con el Id 'form_reportParameters'

*********************************************************/
function refreshReport()
{
    refreshElement(spa_context.current_request.view,spa_context.current_request.element_id,getFormData("form_reportParameters"));
}

/*********************************************************
onFinderSelectedRow

Función de uso interno del control FK Input que se invoca
cuando el usuario ha seleccionado un elemento.
*********************************************************/

var finderModule="";
var finderCallback=null;

var finder_data_table=[];
var finder_dialog_id="";

function onFinderSelectedRow(index)
{
    var row=finder_data_table[index];
    finderCallback(row);
    closeDialog(finder_dialog_id);
}

/*********************************************************
selectFromFinderDialog

Despliega un 'buscador' como diálogo

Parámetros:
===========
title - Título del diálogo
itemType - Identificador del tipo de elemento a buscar 
(requiere que esté implementado en el backend)
onselected - Función callback para cuando el usuario 
selecciona un elemento
initData - Datos que serán enviados en la solicitud durante
la inicialización del buscador.
*********************************************************/
function selectFromFinderDialog(title, itemType, onselected, initData)
{
    var dlg_id="_"+itemType;
    var data={};

    if (initData!==undefined)
        data=initData;
        
    data["_itemType"]=itemType;
    data["_dialogId"]=dlg_id;

    if (title===undefined)
        title="";

    finderCallback=onselected;
    finder_dialog_id=dlg_id;

    createDialog(dlg_id, title, finderModule, data);

}

/*********************************************************
onEditFKinput
Función de uso interno del control FK Input que se ejecuta
cuando se inicia la selcción a través del buscador

*********************************************************/
function onEditFKinput(id, itemType, valueField, displayField,finderTitle)
{
    selectFromFinderDialog(finderTitle,itemType,
    function(data){
        $("#"+id).val(data[valueField]);
        $("#--display_"+id).val(data[displayField]);
        $("#--json_"+id).val(JSON.stringify(data));
        });
}

/*********************************************************
ifempty_fire_fkbutton
Función de uso interno del control FK Input
*********************************************************/
function ifempty_fire_fkbutton(id)
{
    if ($("#"+id).val()!="")
        return;

    $("#fkinput_button_"+id).click();
}

/*********************************************************
ifempty_fire_fkbutton
Función de uso interno del control FK Input
*********************************************************/
function onClearFKinput(id)
{
    $("#"+id).val("");
    $("#--display_"+id).val("");
    $("#--json_"+id).val("");
}

/*********************************************************
Funciones para resolver el problema de precisión en 
punto flotante de javascript
*********************************************************/
var _cf = (function() {
    function _shift(x) {
      var parts = x.toString().split('.');
      return (parts.length < 2) ? 1 : Math.pow(10, parts[1].length);
    }
    return function() { 
      return Array.prototype.reduce.call(arguments, function (prev, next) { return prev === undefined || next === undefined ? undefined : Math.max(prev, _shift (next)); }, -Infinity);
    };
  })();
  

/*********************************************************
Suma en punto flotante
*********************************************************/
  Math.add = function () {
    var f = _cf.apply(null, arguments); if(f === undefined) return undefined;
    function cb(x, y, i, o) { return x + f * y; }
    return Array.prototype.reduce.call(arguments, cb, 0) / f;
  };
  
/*********************************************************
Resta en punto flotante
*********************************************************/
  Math.sub = function (l,r) { var f = _cf(l,r); return (l * f - r * f) / f; };
/*********************************************************
Multiplicación en punto flotante
*********************************************************/  
  Math.mul = function () {
    var f = _cf.apply(null, arguments);
    function cb(x, y, i, o) { return (x*f) * (y*f) / (f * f); }
    return Array.prototype.reduce.call(arguments, cb, 1);
  };
/*********************************************************
División en punto flotante
*********************************************************/
  Math.div = function (l,r) { var f = _cf(l,r); return (l * f) / (r * f); };