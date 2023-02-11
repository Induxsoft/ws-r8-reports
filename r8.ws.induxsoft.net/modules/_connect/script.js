
function selConnection(qname)
{
    spa_context.CONNECTION_QNAME=qname;
    refreshElement(spa_context.START_MODULE,spa_context.current_request.element_id);
}