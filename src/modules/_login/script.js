//Script que se carga únicamente la primera vez que se carga el módulo

function login()
{
    var data={
        "userId":$("#userId").val(),
        "password":$("#password").val()
    };

    refreshElement(spa_context.START_MODULE,spa_context.current_request.element_id,data);
}

function change_connection()
{
    spa_context.CONNECTION_QNAME="";
    refreshElement();
}