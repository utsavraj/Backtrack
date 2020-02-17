from django.http import HttpResponseRedirect
from django.contrib.auth.models import User
from rest_framework import permissions, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from django.core.mail import EmailMultiAlternatives
from access_tokens import scope, tokens
from django.conf import settings
from urllib.parse import unquote


from .serializers import ProductSerializer, PBISerializer, PbiTaskSerializer, TeamMemberSerializer
from .models import Product as pro, Pbi, PbiTasks, Developer, ProductOwner, ScrumMaster, TeamMember
from django.contrib.auth.models import User
from django.db.models import Sum
import sys

def mapProduct(product_id):
    return pro.objects.get(id=product_id)

def mapPBI(PBI_id):
    return Pbi.objects.get(id=PBI_id)

def mapUser(User_id):
    return User.objects.get(id=User_id).username

def userID(name):
    user = User.objects.get(username=name)
    print(user.username, file=sys.stderr)
    return user.id

def userInstance(name):
    try:
        return User.objects.get(username=name)
    except:
        return None

@api_view(['POST'])
def isProductOwner(request):
    user_id = userID(request.data["username"])
    all_po = []
    for po in ProductOwner.objects.all():
        all_po.append(po.author_id)
    if user_id in all_po:
        return Response({'stat': 'success', 'data': True})
    Response({'stat': 'failed', 'data': False})

@api_view(['POST'])
def isScrumMaster(request):
    user_id = userID(request.data["username"])
    all_scrum = []
    for s in ScrumMaster.objects.all():
        all_scrum.append(s.author_id)
    if user_id in all_scrum:
        return Response({'stat': 'success', 'data': True})
    Response({'stat': 'failed', 'data': False})



@api_view(['POST'])
def isDeveloper(request):
    user_id = userID(request.data["username"])
    all_developers = []
    for d in Developer.objects.all():
        all_developers.append(d.author_id)
    if user_id in all_developers:
        return Response({'stat': 'success', 'data': True})
    Response({'stat': 'failed', 'data': False})

@api_view(['POST'])
def getProductOwnerName(request):
    product_title = request.data["product_title"]
    p = pro.objects.all().filter(title=product_title)[:1]
    po = ProductOwner.objects.all().filter(id=p[0].product_owner.id)
    po_name = mapUser(po[0].author_id)
    return Response({'stat': 'success', 'data': po_name})

@api_view(['POST'])
def showProjects(request):
    user_id = userID(request.data["username"])
    all_scrum = []
    for s in ScrumMaster.objects.all():
        all_scrum.append(s.author_id)
    all_developers = []
    for d in Developer.objects.all():
        all_developers.append(d.author_id)
    all_po = []
    for po in ProductOwner.objects.all():
        all_po.append(po.author_id)
    projects = None
    if user_id in all_scrum:
        s = ScrumMaster.objects.all().filter(author_id=user_id)
        projects = pro.objects.all().filter(scrum_master=s[0].id)
    elif user_id in all_developers:
        t = TeamMember.objects.all().filter(author_id=user_id)
        project_id = t[0].product.id
        projects = pro.objects.all().filter(id=project_id)
    elif user_id in all_po:
        #po = ProductOwner.objects.all().filter(author_id=user_id)
        projects = pro.objects.all().filter(author=user_id)[:1]

    # projects = pro.objects.get(author=userID(request.data["username"]))
    #projects = pro.objects.all().filter(author=userID(request.data["username"]))[:1]
    # projects = pro.objects.get(title="Django Application")

    serializer = ProductSerializer(projects, context={'request': request}, many=True)
    return Response({'data': serializer.data})


@api_view(['POST'])
def createProject(request):
    po = ProductOwner(author=userInstance(request.data["username"]))
    po.save()
    p = pro(title=request.data["title"], content=request.data["content"], sprintCapacity=request.data["capacity"], author=userInstance(request.data["username"]), product_owner=po)
    p.save()
    projects = pro.objects.all().filter(id=int(p.id))

    serializer = ProductSerializer(projects, context={'request': request}, many=True)
    return Response({'stat': 'success', 'data': serializer.data})


@api_view(['POST'])
def deleteProject(request):
    instance = pro.objects.get(id=request.data["project_id"])
    instance.delete()
    return Response({'data': 'success'})

@api_view(['POST'])
def cumEffortHours(request):
    prod = pro.objects.get(id=int(request.data["prod_id"]))
    pbis = Pbi.objects.all().filter(product=prod, checked=True)
    load = 0
    rem = 0
    tot = 0
    for num, listObject in enumerate(pbis):
        print(listObject.id)
        numHours = PbiTasks.objects.all().filter(Pbi=listObject).aggregate(Sum('storyPoints'))
        if numHours['storyPoints__sum'] != None:
            load += int(numHours['storyPoints__sum'])
        numHours = PbiTasks.objects.all().filter(Pbi=listObject, status="Complete").aggregate(Sum('storyPoints'))
        if numHours['storyPoints__sum'] != None:
            rem += int(numHours['storyPoints__sum'])
        tot = load-rem
    return Response({'stat': 'success', 'hours': load, 'remhours': tot})

@api_view(['POST'])
def getVelocityStats(request):
    pbis = Pbi.objects.all()
    temp1 = pro.objects.get(id=int(request.data["product_id"]))
    ongoingSprint = 0
    ongoingSprint = temp1.ongoingSprint
    my_list = []
    totalStoryPoints = 0

    for i in pbis:
        if (i.product.id == request.data["product_id"]):
            totalStoryPoints += i.storyPoints
            print(i.storyPoints)
    for i in range(0, ongoingSprint):
        my_list.append(0)

    for i in pbis:
        if i.completedSprint != -1 and i.product.id == request.data["product_id"]:
            my_list[i.completedSprint - 1] = my_list[i.completedSprint - 1] + i.storyPoints
    my_list.pop()
    my_list.insert(0, 0)
    # print(my_list)
    myNewList = []
    for each in my_list:
        totalStoryPoints -= each
        myNewList.append(totalStoryPoints)
    return Response({'data': myNewList})

@api_view(['POST'])
def delSprintPBI(request):
    prod = pro.objects.get(id=int(request.data["prod_id"]))
    pbis = Pbi.objects.all().filter(product=prod, checked=True)
    for num, listObject in enumerate(pbis):
        numtasks = PbiTasks.objects.all().filter(Pbi=listObject).count()
        if numtasks == 0:
            listObject.checked = "False"
            listObject.status = "Not Started"
            listObject.save()

    queryset = Pbi.objects.all().filter(product=prod).order_by('priority')
    serializer = PBISerializer(queryset, context={'request': request}, many=True)
    return Response({'stat': 'success', 'data': serializer.data})


@api_view(['POST'])
def sprintLoad(request):
    prod = Pbi.objects.get(id=request.data["pbi_id"]).product
    pbis = Pbi.objects.all().filter(product=prod, checked=True)
    load = 0
    for num, listObject in enumerate(pbis):
        numHours = PbiTasks.objects.all().filter(Pbi=listObject).aggregate(Sum('storyPoints'))
        if numHours['storyPoints__sum'] != None:
            load += int(numHours['storyPoints__sum'])

    return Response({'data': 'success', 'load': load})

@api_view(['POST'])
def getStats(request):
    print("getstats received a req")
    totalStoryPoints = Pbi.objects.all().filter(product=mapProduct(int(request.data["product_id"])))
    Sum = 0
    inProgressSum = 0
    notStartedSum = 0
    completeSum = 0
    for i in totalStoryPoints:
        if(i.status == "In Progress"  ):
            inProgressSum = inProgressSum + i.storyPoints
            # print(i.storyPoints)
            # print(i.title)
        elif(i.status == "Not Started"):
            notStartedSum = notStartedSum + i.storyPoints
        elif(i.status == "Complete"):
            completeSum = completeSum + i.storyPoints
    print(completeSum)
    print(inProgressSum)
    print( notStartedSum)
    return Response({'data': [ notStartedSum, inProgressSum, completeSum]})


@api_view(['POST'])
def getOtherStats(request):
    print("getothers received a req")
    temp1 = Pbi.objects.all()
    totalStoryPoints=[]
    # totalStoryPoints = Pbi.objects.all().filter(product= notmapProduct(int(request.data["product_id"])))
    # totalStoryPoints = [i for i in temp1 + temp2 if i not in temp1 or i not in temp2]
    for i in temp1:
        if (i.product.id!=request.data["product_id"]):
            totalStoryPoints.append(i)
            print(i.id)
    Sum = 0
    inProgressSum = 0
    notStartedSum = 0
    completeSum = 0
    for i in totalStoryPoints:
        if(i.status == "In Progress"  ):
            inProgressSum = inProgressSum + i.storyPoints
            # print(i.storyPoints)
            # print(i.title)
        elif(i.status == "Not Started"):
            notStartedSum = notStartedSum + i.storyPoints
        elif(i.status == "Complete"):
            completeSum = completeSum + i.storyPoints
    print(completeSum)
    # print ("before me")
    print(inProgressSum)
    # print ("before me")
    print( notStartedSum)
    # print ("before me")
    print([ notStartedSum, inProgressSum, completeSum])
    return Response({'data': [ notStartedSum, inProgressSum, completeSum]})


# @api_view(['GET'])
# def getStats(request):
#     totalStoryPoints = Pbi.objects.all()
#     Sum = 0
#     inProgressSum = 0
#     notStartedSum = 0
#     completeSum = 0
#     for i in totalStoryPoints:
#         if(i.status == "In Progress"):
#             inProgressSum = inProgressSum + i.storyPoints
#             # print(i.storyPoints)
#             # print(i.title)
#         elif(i.status == "Not Started"):
#             notStartedSum = notStartedSum + i.storyPoints
#         elif(i.status == "Complete"):
#             completeSum = completeSum + i.storyPoints
#     print(completeSum)
#     print(inProgressSum)
#     print(notStartedSum)
#     return Response({'data': {"sprint": [ notStartedSum, inProgressSum, completeSum], "PBLog": [300, 220, 130]}})


# @api_view(['GET'])
# def getTasksStats(request):
#     totalStoryPoints = PbiTasks.objects.all()
#     inProgressSum = 0
#     notStartedSum = 0
#     completeSum = 0
#     for i in totalStoryPoints:
#         if(i.status == "InProgress"):
#             inProgressSum = inProgressSum + i.storyPoints
#             # print(i.storyPoints)
#             # print(i.title)
#         elif(i.status == "Not Started"):
#             notStartedSum = notStartedSum + i.storyPoints
#         elif(i.status == "Complete"):
#             completeSum = completeSum + i.storyPoints
#     print(completeSum)
#     print(inProgressSum)
#     print( notStartedSum)
#     return Response({'data': {"sprint": [ notStartedSum, inProgressSum, completeSum], "PBLog": [300, 220, 130]}})




@api_view(['POST'])
def updateProjectDescription(request):
    p = pro.objects.get(id=request.data["id"])
    p.content = request.data["description"];
    p.save()

    projects = pro.objects.all().filter(id=int(request.data["id"]))
    serializer = ProductSerializer(projects, context={'request': request}, many=True)
    return Response({'stat': 'success', 'data': serializer.data})


@api_view(['POST'])
def showPBIs(request):
    queryset = Pbi.objects.all().filter(product=mapProduct(int(request.data["product_id"]))).order_by('priority')
    serializer = PBISerializer(queryset, context={'request': request}, many=True)
    return Response({'stat': 'success', 'data': serializer.data})

@api_view(['POST'])
def showPBITasks(request):
    queryset = PbiTasks.objects.all().filter(Pbi=mapPBI(int(request.data["PBI_id"])))
    serializer = PbiTaskSerializer(queryset, context={'request': request}, many=True)
    for i in serializer.data:
        if(i["assigined_team_member"] != None):
            i["assigined_team_member"] = mapUser(i["assigined_team_member"])
        else:
            i["assigined_team_member"] = "Not Assigned"
    return Response({'stat': 'success', 'data': serializer.data})


@api_view(['POST'])
def createPBI(request):
    allObj = Pbi.objects.all().filter(product=mapProduct(request.data["product_id"])).order_by('priority')
    i = 1
    targetpriority = int(request.data["priority"])
    for num, listObject in enumerate(allObj):
        if listObject.priority == targetpriority:
            i += 1
        listObject.priority = i
        listObject.save()
        i += 1
    # for k in range(0, allObj.count()):


    # pbi_count = Pbi.objects.all().filter(product=mapProduct(request.data["product_id"])).count()
    p = Pbi(title=request.data["title"], description=request.data["description"],
            storyPoints=request.data["storyPoints"], status=request.data["status"],
            product=mapProduct(request.data["product_id"]), priority=targetpriority)
    p.save()
    # allObjects = Pbi.objects.all().filter(id=p.id)
    allObjects = Pbi.objects.all().filter(product=mapProduct(request.data["product_id"])).order_by('priority')
    serializer = PBISerializer(allObjects, context={'request': request}, many=True)

    return Response({'stat': 'success', 'data': serializer.data})

@api_view(['POST'])
def createPBITask(request):
    if request.data["assigined_team_member"] != "Not Assigned":
        p = PbiTasks(title=request.data["title"], description=request.data["description"], storyPoints=request.data["storyPoints"], Pbi=mapPBI(request.data["PBI_id"]), assigined_team_member=User.objects.get(username=request.data["assigined_team_member"]), status=" In Progress") 
    else:
        p = PbiTasks(title=request.data["title"], description=request.data["description"], storyPoints=request.data["storyPoints"], Pbi=mapPBI(request.data["PBI_id"]), assigined_team_member=None)
    p.save()
    pbitask = PbiTasks.objects.all().filter(id=int(p.id))
    serializer = PbiTaskSerializer(pbitask, context={'request': request}, many=True)
    for i in serializer.data:
        if(i["assigined_team_member"] != None):
            i["assigined_team_member"] = mapUser(i["assigined_team_member"])
        else:
            i["assigined_team_member"] = "Not Assigned"
    return Response({'stat': 'success', 'data': serializer.data})



@api_view(['POST'])
def deletePBI(request):
    obj = Pbi.objects.get(id=request.data["PBI_id"])
    obj.delete()
    allObjects = Pbi.objects.all().order_by('priority').filter(product=obj.product)
    for num, listObject in enumerate(allObjects):
        listObject.priority = num + 1
        listObject.save()
    # allObjects.save()
    serializer = PBISerializer(allObjects, context={'request': request}, many=True)
    return Response({'stat': 'success', 'data': serializer.data})


@api_view(['POST'])
def deletePBITask(request):
    obj = PbiTasks.objects.get(id=request.data["PBITask_id"])
    temp = obj.Pbi.id
    obj.delete()
    allObjects = PbiTasks.objects.all().filter(Pbi=mapPBI(int(temp)))
    serializer = PbiTaskSerializer(allObjects, context={'request': request}, many=True)
    for i in serializer.data:
        if(i["assigined_team_member"] != None):
            i["assigined_team_member"] = mapUser(i["assigined_team_member"])
    return Response({'stat': 'success', 'data': serializer.data})


@api_view(['POST'])
def getTeamDevelopers(request):
    queryset = TeamMember.objects.all().filter(product=mapProduct(request.data["product_id"]))
    serializer = TeamMemberSerializer(queryset, context={'request': request}, many=True)
    for i in serializer.data:
        if(i["author"] != None):
            i["author"] = mapUser(i["author"])
    return Response({'stat': 'success', 'data': serializer.data})


@api_view(['POST'])
def ChangePBITaskEffort(request):
    obj = PbiTasks.objects.get(id=request.data["PBITask_id"])
    obj.status = "Complete"
    obj.completed = True
    obj.save()
    allObjects = PbiTasks.objects.all().filter(Pbi=obj.Pbi)
    serializer = PbiTaskSerializer(allObjects, context={'request': request}, many=True)
    return Response({'stat': 'success', 'data': serializer.data, 'curr_task': request.data["PBITask_id"]})


@api_view(['POST'])
def editPBI(request):
    obj = Pbi.objects.get(id=request.data["id"])
    allObj = Pbi.objects.all().filter(product=obj.product).order_by('priority')
    i = 1

    targetpriority = int(request.data["priority"])
    if obj.priority != targetpriority:
        for num, listObject in enumerate(allObj):
            if obj.id != listObject.id:
                if targetpriority > obj.priority:
                    if targetpriority == i:
                        i += 1
                elif listObject.priority == targetpriority:
                    i += 1
                listObject.priority = i
                listObject.save()
                i += 1


    # obj = Pbi.objects.get(id=request.data["id"])
    obj.title = request.data["title"]
    obj.description = request.data["description"]
    obj.status = request.data["status"]
    obj.storyPoints = int(request.data["storyPoints"])
    obj.priority = targetpriority
    obj.save()
    allObjects = Pbi.objects.all().filter(product=obj.product).order_by('priority')
    serializer = PBISerializer(allObjects, context={'request': request}, many=True)
    return Response({'stat': 'success', 'data': serializer.data})

@api_view(['POST'])
def editPBITask(request):
        obj = PbiTasks.objects.get(id=request.data["id"])
        obj.title = request.data["title"]
        obj.description = request.data["description"]
        obj.storyPoints = int(request.data["storyPoints"])
        try:
            obj.assigined_team_member = User.objects.get(username=request.data["assigined_team_member"])
            obj.status =  "InProgress"   
        except (ValueError, User.DoesNotExist):
            obj.assigined_team_member = None
            obj.status =  "Not Started" 
        obj.save()
        allObjects = PbiTasks.objects.all().filter(Pbi=obj.Pbi)
        serializer = PbiTaskSerializer(allObjects, context={'request': request}, many=True)
        for i in serializer.data:
            if(i["assigined_team_member"] != None):
                i["assigined_team_member"] = mapUser(i["assigined_team_member"])
        return Response({'stat': 'success', 'data': serializer.data})

    

@api_view(['POST'])
def priorityUp(request):
    obj = Pbi.objects.get(id=request.data["id"])
    subject = obj.status
    allObj = Pbi.objects.all().filter(status=subject).order_by('priority')
    prev = obj
    for i in range(0, allObj.count()):
        if allObj[i].id == obj.id:
            target = prev
            break
        prev = allObj[i]
    pr = obj.priority
    obj.priority = target.priority
    target.priority = pr
    obj.save()
    target.save()

    allObjects = Pbi.objects.all().filter(product=obj.product).order_by('priority')
    serializer = PBISerializer(allObjects, context={'request': request}, many=True)
    return Response({'stat': 'success', 'data': serializer.data})


@api_view(['POST'])
def priorityDown(request):
    obj = Pbi.objects.get(id=request.data["id"])
    subject = obj.status
    allObj = Pbi.objects.all().filter(status=subject).order_by('priority')
    for i in range(0, allObj.count()):
        if allObj[i].id == obj.id:
            target = allObj[i + 1]
            break
    pr = obj.priority
    obj.priority = target.priority
    target.priority = pr
    obj.save()
    target.save()

    allObjects = Pbi.objects.all().filter(product=obj.product).order_by('priority')
    serializer = PBISerializer(allObjects, context={'request': request}, many=True)
    return Response({'stat': 'success', 'data': serializer.data})

@api_view(['GET'])
def inviteDeveloper(request):
    assigned = TeamMember.objects.all()
    all_ids = []
    for a in assigned:
        all_ids.append(a.author_id)
    all_developers = []
    for d in Developer.objects.all():
        all_developers.append(d.author_id)
    free = list(set(all_developers) - set(all_ids))
    all_emails = []
    for f in free:
        u = User.objects.get(id=f)
        all_emails.append(u.email)
    return Response({'stat': 'success', 'data': all_emails})

@api_view(['GET'])
def inviteScrumMaster(request):
    assigned = pro.objects.all().values("scrum_master")
    all_ids = []
    for a in assigned:
        all_ids.append(a['scrum_master'])
    all_scrum = []
    for s in ScrumMaster.objects.all():
        all_scrum.append(s.id)
    free = list(set(all_scrum) - set(all_ids))
    all_emails = []
    for f in free:
        sm = ScrumMaster.objects.all().filter(id=f)
        u = User.objects.get(id=sm[0].author_id)
        all_emails.append(u.email)
    return Response({'stat': 'success', 'data': all_emails})

@api_view(['POST'])
def sendEmail(request):
    product_title = request.data["product_title"]
    user_id = request.data["user_id"]
    token = tokens.generate(scope=(), key=product_title, salt=None)
    email = request.data["email"]
    subject = "DSG has invited you to work on a project"
    from_email, to = settings.EMAIL_HOST_USER, email
    text_content = 'Please click on the link below to access the project.'
    html_content = '<p><a href="http://localhost:8000/projects/validateEmail/'+user_id+'/'+product_title+'/'+token+'">Accept Invitation</a></p>'
    msg = EmailMultiAlternatives(subject, text_content, from_email, [email])
    msg.attach_alternative(html_content, "text/html")
    msg.send()
    return Response({'stat': 'success'})

@api_view(['GET'])
def validateEmail(request, token, product_title, user_id):
    validate = tokens.validate(token, scope=(), key=product_title, salt=None, max_age=60*60*24)
    decode_product_title = unquote(product_title)
    if validate:
        this_product = pro.objects.filter(title=decode_product_title)
        d = Developer.objects.all()
        all_developers = []
        for each_dev in d:
            all_developers.append(each_dev.author)
        sm = ScrumMaster.objects.all()
        all_scrum = []
        for each_sm in sm:
            all_scrum.append(each_sm.author)
        if userInstance(user_id) in all_developers:
            t = TeamMember(author=userInstance(user_id), product=this_product[0])
            t.save()
            #this_team_member = TeamMember.objects.filter(author=userInstance(user_id))[0]
            #p = pro(title=product_title, content=this_content, created_on=this_created_on, author=this_author,
                    #product_owner=this_product_owner, scrum_master=this_scrum_master, team_member=this_team_member)
            #p.save()
        elif userInstance(user_id) in all_scrum:
            this_scrum_master = ScrumMaster.objects.filter(author=userInstance(user_id))[0]
            for p in this_product:
                p.scrum_master = this_scrum_master
            p.save()
        return Response({'stat': 'success'})
    return Response({'stat': 'failed'})

@api_view(['POST'])
def getUserID(request):
    user_email = request.data["email"]
    u = User.objects.get(email=user_email)
    return Response({'stat': 'success', 'data': u.username})

@api_view(['POST'])
def addPBItoSprint(request):
    obj = Pbi.objects.get(id=request.data["id"])
    obj.checked = bool(request.data["checked"])
    obj.status = "In Progress"
    obj.save()
    queryset = Pbi.objects.all().filter(product=obj.product)
    serializer = PBISerializer(queryset, context={'request': request}, many=True)
    return Response({'stat': 'success', 'data': serializer.data})

def checkComplete(pbi_id):
    obj = Pbi.objects.get(id=int(pbi_id))
    complete_pbitasks = PbiTasks.objects.all().filter(Pbi=obj, status="Complete").count()
    all_pbitasks = PbiTasks.objects.all().filter(Pbi=obj).count()
    if complete_pbitasks == all_pbitasks:
        return 1


@api_view(['POST'])
def endSprint(request):
    sprint = request.data["sprintPBIs"]
    print(sprint)
    PBI = Pbi.objects.get(id=int(sprint[0]))
    # Product = pro.objects.get(id=PBI.product)
    Product = PBI.product
    ongoingSprint = Product.ongoingSprint
    for pbi in sprint:
        print("Here")
        PBI = Pbi.objects.get(id=int(pbi))
        if checkComplete(pbi):
            PBI.status = "Complete"
            PBI.checked = "False"
            PBI.completedSprint = ongoingSprint
            PBI.save()
        else:
            PBI.checked = "False"
            PBI.status = "Not Started"
            tasks = PbiTasks.objects.all().filter(Pbi=PBI).delete()
            PBI.save()
    Product.ongoingSprint = ongoingSprint+1
    Product.sprintCapacity = int(request.data["sprintCapacity"])
    Product.save()

    queryset = Pbi.objects.all().filter(product=Product)
    serializer = PBISerializer(queryset, context={'request': request}, many=True)
    return Response({'stat': 'success', 'data': serializer.data, 'sprint': Product.ongoingSprint, 'capacity':Product.sprintCapacity})

@api_view(['POST'])
def removePBIfromSprint(request):
    obj = Pbi.objects.get(id=request.data["id"])
    obj.checked = 'False'
    obj.status = "Not Started"
    obj.save()
    queryset = Pbi.objects.all().filter(product=obj.product)
    serializer = PBISerializer(queryset, context={'request': request}, many=True)
    return Response({'stat': 'success', 'data': serializer.data})
