import json
from channels import Group
from channels.auth import channel_session_user, channel_session_user_from_http
from projects.models import PbiTasks, Pbi
# from BackTrack.backTrack.projects.views import mapPBI



@channel_session_user_from_http
def ws_connect(message):
    Group('ws').add(message.reply_channel)
    message.reply_channel.send({"accept": True})


@channel_session_user
def ws_message(message):
    obj = PbiTasks.objects.get(id=int(message.content["text"]))
    complete_pbitasks = PbiTasks.objects.all().filter(Pbi=obj.Pbi, status="Complete").count()
    all_pbitasks = PbiTasks.objects.all().filter(Pbi=obj.Pbi).count()
    pbi_id = -1
    if complete_pbitasks == all_pbitasks:
        PBI = obj.Pbi
        PBI.status = "Complete"
        pbi_id = PBI.id
        PBI.save()
    Group("ws").send({
        'text': json.dumps({
            'completed_pbi': pbi_id
        })
    })
    message.reply_channel.send({"accept": True})


@channel_session_user
def ws_disconnect(message):
    Group('ws').discard(message.reply_channel)
    message.reply_channel.send({"accept": True})